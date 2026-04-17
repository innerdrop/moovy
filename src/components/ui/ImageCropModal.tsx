"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from "lucide-react";

interface ImageCropModalProps {
    imageSrc: string;
    onCrop: (croppedBlob: Blob) => void;
    onClose: () => void;
    aspectRatio?: number; // 1 = square, 16/9 = widescreen, etc.
    outputSize?: number; // Output pixel size (default 500)
}

export default function ImageCropModal({
    imageSrc,
    onCrop,
    onClose,
    aspectRatio = 1,
    outputSize = 500,
}: ImageCropModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);

    // Load image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            imageRef.current = img;
            setImageLoaded(true);
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Draw canvas
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const size = canvas.width;
        const h = aspectRatio === 1 ? size : size / aspectRatio;

        // Clear
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, size, h);

        // Calculate scaled dimensions to fit image
        const imgAspect = img.width / img.height;
        let drawW: number, drawH: number;

        if (imgAspect > aspectRatio) {
            // Image is wider — fit by height
            drawH = h * zoom;
            drawW = drawH * imgAspect;
        } else {
            // Image is taller — fit by width
            drawW = size * zoom;
            drawH = drawW / imgAspect;
        }

        const drawX = (size - drawW) / 2 + offset.x;
        const drawY = (h - drawH) / 2 + offset.y;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }, [zoom, offset, imageLoaded, aspectRatio]);

    useEffect(() => {
        draw();
    }, [draw]);

    // Mouse/touch handlers
    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setZoom((prev) => Math.min(3, Math.max(1, prev - e.deltaY * 0.002)));
    };

    const handleCrop = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create output canvas at desired size
        const outCanvas = document.createElement("canvas");
        const outH = aspectRatio === 1 ? outputSize : Math.round(outputSize / aspectRatio);
        outCanvas.width = outputSize;
        outCanvas.height = outH;

        const outCtx = outCanvas.getContext("2d");
        if (!outCtx) return;

        // Copy from preview canvas to output canvas
        const srcH = aspectRatio === 1 ? canvas.width : canvas.width / aspectRatio;
        outCtx.drawImage(canvas, 0, 0, canvas.width, srcH, 0, 0, outputSize, outH);

        outCanvas.toBlob(
            (blob) => {
                if (blob) onCrop(blob);
            },
            "image/jpeg",
            0.85
        );
    };

    const handleReset = () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    };

    // Canvas size based on container
    const canvasSize = 300;
    const canvasH = aspectRatio === 1 ? canvasSize : Math.round(canvasSize / aspectRatio);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Ajustar imagen</h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 transition rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Canvas area */}
                <div className="bg-gray-900 flex items-center justify-center p-4" ref={containerRef}>
                    <div className="relative" style={{ width: canvasSize, height: canvasH }}>
                        <canvas
                            ref={canvasRef}
                            width={canvasSize}
                            height={canvasH}
                            className="rounded-xl cursor-grab active:cursor-grabbing touch-none"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onWheel={handleWheel}
                        />
                        {/* Overlay frame */}
                        <div
                            className="absolute inset-0 pointer-events-none rounded-xl"
                            style={{
                                boxShadow: "0 0 0 2px rgba(230, 0, 18, 0.8), inset 0 0 0 1px rgba(255,255,255,0.2)",
                            }}
                        />
                        {/* Corner indicators */}
                        {[
                            "top-0 left-0 border-t-2 border-l-2 rounded-tl-xl",
                            "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
                            "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl",
                            "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl",
                        ].map((pos, i) => (
                            <div
                                key={i}
                                className={`absolute w-5 h-5 border-white pointer-events-none ${pos}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Zoom controls */}
                <div className="px-5 py-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <ZoomOut className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.01"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-red-500"
                        />
                        <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <button
                            onClick={handleReset}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition rounded-lg hover:bg-gray-100 ml-1"
                            title="Restablecer"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center mt-1.5">
                        Arrastrá para mover · Deslizá para zoom
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCrop}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
