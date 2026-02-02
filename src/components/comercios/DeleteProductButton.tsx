"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProduct } from "@/app/comercios/actions";
import { useRouter } from "next/navigation";

interface DeleteProductButtonProps {
    productId: string;
    productName: string;
}

export default function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm(`¿Estás seguro de que quieres eliminar "${productName}"?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteProduct(productId);
            if (result.error) {
                alert(result.error);
            } else {
                // Success
                router.refresh();
            }
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Ocurrió un error al eliminar el producto.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition active:scale-95 disabled:opacity-50"
            title="Eliminar"
        >
            {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
        </button>
    );
}
