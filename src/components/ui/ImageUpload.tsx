"use client";

import { useState, useRef } from "react";
import UploadImage from "@/components/ui/UploadImage";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "@/store/toast";
import dynamic from "next/dynamic";

const ImageCropModal = dynamic(() => import("@/components/ui/ImageCropModal"), { ssr: false });

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    compact?: boolean;
    /** When set, shows a crop modal before uploading. 1 = square (logo), 16/9 = banner, etc. */
    cropAspect?: number;
    /** Output size in pixels for cropped image (default 500) */
    cropOutputSize?: number;
}

export default function ImageUpload({ value, onChange, disabled, compact, cropAspect, cropOutputSize = 500 }: ImageUploadProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadFile = async (file: File | Blob, fileName?: string) => {
        setIsLoading(true);
        try {
            const uploadBlob = file instanceof File ? file : new File([file], fileName || "cropped.jpg", { type: "image/jpeg" });
            const formData = new FormData();
            formData.append("file", uploadBlob);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");

            const data = await response.json();
            onChange(data.url);
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Error al subir la imagen. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (cropAspect) {
            // Show crop modal instead of uploading directly
            const reader = new FileReader();
            reader.onload = (ev) => {
                setCropSrc(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
            return;
        }

        // No crop — compress and upload directly
        setIsLoading(true);
        try {
            const compressedFile = await compressImage(file);
            await uploadFile(compressedFile);
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Error al subir la imagen. Intenta de nuevo.");
            setIsLoading(false);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setCropSrc(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await uploadFile(croppedBlob, "logo.jpg");
    };

    const handleCropClose = () => {
        setCropSrc(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Compression Utility (used for non-crop uploads)
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = document.createElement("img");
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 1024;
                    const MAX_HEIGHT = 1024;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                                type: "image/jpeg",
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error("Canvas to Blob failed"));
                        }
                    }, "image/jpeg", 0.7);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleRemove = () => {
        onChange("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const isSquare = cropAspect === 1;

    return (
        <div className="w-full">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={disabled || isLoading}
            />

            {!value ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-xl ${compact ? "p-3 aspect-square" : "p-8"} flex flex-col items-center justify-center cursor-pointer transition
                        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 hover:border-blue-500"}
                        border-gray-300 bg-white
                    `}
                >
                    {isLoading ? (
                        <Loader2 className={`${compact ? "w-5 h-5" : "w-10 h-10"} text-blue-500 animate-spin ${compact ? "" : "mb-2"}`} />
                    ) : (
                        <Upload className={`${compact ? "w-5 h-5" : "w-10 h-10"} text-gray-400 ${compact ? "" : "mb-2"}`} />
                    )}
                    {!compact && (
                        <>
                            <p className="text-sm font-medium text-gray-600">
                                {isLoading ? "Subiendo..." : "Click para subir imagen"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP (Max 4MB)</p>
                        </>
                    )}
                </div>
            ) : (
                <div className={`relative w-full ${isSquare ? "aspect-square" : "aspect-video sm:aspect-[4/3]"} rounded-xl overflow-hidden border border-gray-200 group`}>
                    <UploadImage
                        src={value}
                        alt="Uploaded Image"
                        fill
                        className="object-cover"
                    />

                    {/* Overlay for replacement */}
                    <div
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <p className="text-white font-medium flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Cambiar imagen
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                        disabled={disabled}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-sm z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Crop Modal */}
            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspectRatio={cropAspect || 1}
                    outputSize={cropOutputSize}
                    onCrop={handleCropComplete}
                    onClose={handleCropClose}
                />
            )}
        </div>
    );
}
