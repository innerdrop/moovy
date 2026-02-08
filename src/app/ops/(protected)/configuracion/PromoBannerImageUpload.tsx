"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface PromoBannerImageUploadProps {
    currentImage?: string | null;
    name: string;
}

export default function PromoBannerImageUpload({ currentImage, name }: PromoBannerImageUploadProps) {
    const [imageUrl, setImageUrl] = useState<string>(currentImage || "");
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/admin/promo/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setImageUrl(data.url);
            } else {
                alert(data.error || "Error al subir imagen");
            }
        } catch (error) {
            alert("Error de conexión");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            handleUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const clearImage = () => {
        setImageUrl("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen del Banner (opcional)
            </label>

            {/* Hidden input to store the actual value */}
            <input type="hidden" name={name} value={imageUrl} />

            {imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-pink-200 bg-gray-100">
                    <div className="relative h-40 w-full">
                        <Image
                            src={imageUrl}
                            alt="Preview"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver
                            ? "border-pink-500 bg-pink-50"
                            : "border-gray-300 hover:border-pink-400 hover:bg-pink-50/50"
                        }`}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                            <p className="text-sm text-gray-500">Subiendo...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-pink-500" />
                            </div>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium text-pink-600">Click para subir</span> o arrastrá una imagen
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG, WebP (máx. 5MB)</p>
                        </div>
                    )}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            <p className="text-xs text-gray-500 mt-2">
                Si subís una imagen, reemplazará la ilustración por defecto del banner.
            </p>
        </div>
    );
}
