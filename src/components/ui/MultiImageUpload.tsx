"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Plus } from "lucide-react";

interface MultiImageUploadProps {
    values: string[];
    onChange: (urls: string[]) => void;
    maxImages?: number;
    disabled?: boolean;
}

export default function MultiImageUpload({
    values,
    onChange,
    maxImages = 4,
    disabled
}: MultiImageUploadProps) {
    const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingSlot, setUploadingSlot] = useState<number>(0);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoadingIndex(uploadingSlot);

        try {
            const compressedFile = await compressImage(file);
            const formData = new FormData();
            formData.append("file", compressedFile);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();

            // Update the array
            const newValues = [...values];
            if (uploadingSlot < values.length) {
                newValues[uploadingSlot] = data.url;
            } else {
                newValues.push(data.url);
            }
            onChange(newValues);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error al subir la imagen. Intenta de nuevo.");
        } finally {
            setLoadingIndex(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

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

    const handleRemove = (index: number) => {
        const newValues = values.filter((_, i) => i !== index);
        onChange(newValues);
    };

    const handleUploadClick = (slotIndex: number) => {
        setUploadingSlot(slotIndex);
        fileInputRef.current?.click();
    };

    // Create array of slots (filled + empty up to maxImages)
    const slots = Array.from({ length: maxImages }, (_, i) => values[i] || null);

    return (
        <div className="w-full">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={disabled || loadingIndex !== null}
            />

            <div className="grid grid-cols-2 gap-3">
                {slots.map((url, index) => (
                    <div
                        key={index}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all
                            ${url ? 'border-gray-200' : 'border-dashed border-gray-300'}
                            ${!disabled && !url ? 'cursor-pointer hover:border-blue-500 hover:bg-gray-50' : ''}
                            ${index === 0 && url ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                        `}
                        onClick={() => !url && !disabled && handleUploadClick(index)}
                    >
                        {loadingIndex === index ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : url ? (
                            <>
                                <Image
                                    src={url}
                                    alt={`Imagen ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />

                                {/* Overlay for replacement */}
                                <div
                                    className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUploadClick(index);
                                    }}
                                >
                                    <p className="text-white text-sm font-medium flex items-center gap-1">
                                        <Upload className="w-4 h-4" />
                                        Cambiar
                                    </p>
                                </div>

                                {/* Remove button */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(index);
                                    }}
                                    disabled={disabled}
                                    className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-sm z-10"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>

                                {/* Primary badge */}
                                {index === 0 && (
                                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium">
                                        Principal
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                <Plus className="w-8 h-8 mb-1" />
                                <span className="text-xs">Imagen {index + 1}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-500 mt-2 text-center">
                La primera imagen será la principal. Máximo {maxImages} imágenes.
            </p>
        </div>
    );
}
