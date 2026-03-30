"use client";

import { useState, useRef } from "react";
import UploadImage from "@/components/ui/UploadImage";
import { Upload, X, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "@/store/toast";

interface DocumentUploadProps {
    value: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    /** Texto que aparece en el área de drop. Default: "Click para subir documento" */
    placeholder?: string;
    /** Texto de formatos aceptados. Default: "PDF, JPG, PNG (Max 10MB)" */
    formatHint?: string;
    /** Endpoint de upload. Default: "/api/upload/registration" (público, sin auth) */
    uploadEndpoint?: string;
}

export default function DocumentUpload({
    value,
    onChange,
    disabled,
    placeholder = "Click para subir documento",
    formatHint = "PDF, JPG, PNG (Max 10MB)",
    uploadEndpoint = "/api/upload/registration"
}: DocumentUploadProps) {
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isPdf = value?.toLowerCase().endsWith(".pdf") || value?.includes("/pdf");

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
        const isDocPdf = ext === "pdf";

        if (!isImage && !isDocPdf) {
            toast.error("Formato no permitido. Subí un PDF o imagen (JPG, PNG).");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("El archivo supera el límite de 10MB.");
            return;
        }

        setIsLoading(true);

        try {
            let fileToUpload = file;

            // Solo comprimir si es imagen, los PDF se suben tal cual
            if (isImage) {
                fileToUpload = await compressImage(file);
            }

            const formData = new FormData();
            formData.append("file", fileToUpload);

            const response = await fetch(uploadEndpoint, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "Error al subir el archivo");
            }

            const data = await response.json();
            onChange(data.url);
        } catch (error) {
            console.error("Error uploading document:", error);
            toast.error(error instanceof Error ? error.message : "Error al subir el archivo. Intentá de nuevo.");
        } finally {
            setIsLoading(false);
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
                accept="image/*,.pdf,application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={disabled || isLoading}
            />

            {!value ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition
                        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 hover:border-blue-500"}
                        border-gray-300 bg-white
                    `}
                >
                    {isLoading ? (
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                    ) : (
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    )}
                    <p className="text-sm font-medium text-gray-600">
                        {isLoading ? "Subiendo..." : placeholder}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{formatHint}</p>
                </div>
            ) : isPdf ? (
                // Vista previa para PDF
                <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 p-4 flex items-center gap-3 group">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">Documento PDF</p>
                        <p className="text-xs text-gray-500">Archivo cargado correctamente</p>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                        disabled={disabled}
                        className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-sm flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                // Vista previa para imagen (igual que ImageUpload)
                <div className="relative w-full aspect-video sm:aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 group">
                    <UploadImage
                        src={value}
                        alt="Documento"
                        fill
                        className="object-cover"
                    />
                    <div
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <p className="text-white font-medium flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Cambiar archivo
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
        </div>
    );
}
