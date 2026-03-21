"use client";

import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useFavoritesStore } from "@/store/favorites";

interface HeartButtonProps {
    type: "merchant" | "product" | "listing";
    itemId: string;
    className?: string;
}

export default function HeartButton({ type, itemId, className = "" }: HeartButtonProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const { isFavorite, toggleFavorite, loaded, loadFavorites } = useFavoritesStore();
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (session?.user && !loaded) {
            loadFavorites();
        }
    }, [session?.user, loaded, loadFavorites]);

    const isLoggedIn = !!session?.user;
    const favorited = isLoggedIn ? isFavorite(type, itemId) : false;

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isLoggedIn) {
            router.push("/login");
            return;
        }

        setAnimating(true);
        await toggleFavorite(type, itemId);
        setTimeout(() => setAnimating(false), 450);
    };

    // Logged-out: subtle bookmark-style hint that invites login
    if (!isLoggedIn) {
        return (
            <button
                onClick={handleClick}
                className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    bg-white/70 backdrop-blur-sm
                    transition-all duration-200
                    hover:bg-white hover:scale-110 active:scale-95
                    group
                    ${className}
                `}
                aria-label="Iniciá sesión para guardar en favoritos"
                title="Iniciá sesión para guardar"
            >
                <Heart
                    className="w-4 h-4 text-gray-300 group-hover:text-pink-400 transition-colors duration-200"
                />
            </button>
        );
    }

    // Logged-in: full interactive heart
    return (
        <button
            onClick={handleClick}
            className={`
                w-8 h-8 rounded-full flex items-center justify-center
                bg-white/90 backdrop-blur-sm shadow-sm
                transition-all duration-200
                hover:scale-110 active:scale-95
                ${animating ? "mp-heart-bounce" : ""}
                ${className}
            `}
            aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
            <Heart
                className={`w-4 h-4 transition-colors duration-200 ${
                    favorited
                        ? "fill-pink-500 text-pink-500"
                        : "text-gray-400 hover:text-pink-400"
                }`}
            />
        </button>
    );
}
