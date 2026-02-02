"use client";

import { useState } from "react";
import { ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { toggleProductActive } from "@/app/comercios/actions";
import { useRouter } from "next/navigation";

interface ProductStatusToggleProps {
    productId: string;
    initialStatus: boolean;
    compact?: boolean;
}

export default function ProductStatusToggle({
    productId,
    initialStatus,
    compact = false
}: ProductStatusToggleProps) {
    const [isActive, setIsActive] = useState(initialStatus);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsLoading(true);
        try {
            const result = await toggleProductActive(productId, !isActive);
            if (result.success) {
                setIsActive(!isActive);
                // We don't necessarily need to refresh the whole page if we update local state,
                // but let's do it to ensure consistency with other parts of the UI
                router.refresh();
            } else {
                alert(result.error || "Error al actualizar estado");
            }
        } catch (error) {
            console.error("Toggle error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (compact) {
        return (
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`p-2 rounded-xl transition-all ${isActive
                        ? "text-green-600 bg-green-50 hover:bg-green-100"
                        : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                    } disabled:opacity-50`}
                title={isActive ? "Desactivar" : "Activar"}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isActive ? (
                    <ToggleRight className="w-5 h-5" />
                ) : (
                    <ToggleLeft className="w-5 h-5" />
                )}
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${isActive
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                } disabled:opacity-50`}
        >
            {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isActive ? (
                <>
                    <ToggleRight className="w-4 h-4" />
                    En Tienda
                </>
            ) : (
                <>
                    <ToggleLeft className="w-4 h-4" />
                    Oculto
                </>
            )}
        </button>
    );
}
