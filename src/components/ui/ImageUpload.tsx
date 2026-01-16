"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    disabled?: boolean;
}

export default function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();
            onChange(data.url);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error al subir la imagen. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = () => {
        onChange("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

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
                        border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition
                        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 hover:border-blue-500"}
                        border-gray-300 bg-white
                    `}
                >
                    {isLoading ? (
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
                    ) : (
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    )}
                    <p className="text-sm font-medium text-gray-600">
                        {isLoading ? "Subiendo..." : "Click para subir imagen"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP (Max 4MB)</p>
                </div>
            ) : (
                <div className="relative w-full aspect-video sm:aspect-[4/3] rounded-xl overflow-hidden border border-gray-200">
                    <Image
                        src={value}
                        alt="Product Image"
                        fill
                        className="object-cover"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={disabled}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-sm"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute create-bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                        <p className="text-white text-xs font-medium truncate">{value.split('/').pop()}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
