"use client";

import React from "react";
import Image from "next/image";

// Mapping of icon keys to PNG file paths
export const CATEGORY_ICON_PATHS: Record<string, string> = {
    // Your custom PNG icons
    almacen: "/icons/categories/cat_almacen.png",
    burger: "/icons/categories/cat_burger.png",
    hamburguesas: "/icons/categories/cat_burger.png",
    cervezas: "/icons/categories/cat_cervezas.png",
    gaseosas: "/icons/categories/cat_gaseosas.png",
    bebidas: "/icons/categories/cat_gaseosas.png",
    juegos: "/icons/categories/cat_juegos.png",
    vinos: "/icons/categories/cat_vinos.png",
    farmacia: "/icons/categories/cat_farmacia.png",
    panaderia: "/icons/categories/cat_panaderia.png",
    snacks: "/icons/categories/cat_snacks.png",
    mascotas: "/icons/categories/cat_mascotas.png",
    perfumeria: "/icons/categories/cat_perfumeria.png",
};

// Default icon (simple circle with package icon)
const DefaultIcon = () => (
    <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="20" r="16" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" />
        <rect x="14" y="14" width="12" height="12" rx="2" fill="#9ca3af" />
        <rect x="17" y="11" width="6" height="4" rx="1" fill="#9ca3af" />
    </svg>
);

// Get all available icon keys for the admin selector
export function getAvailableIconKeys(): string[] {
    return Object.keys(CATEGORY_ICON_PATHS);
}

// Check if icon has a PNG version
export function hasPngIcon(iconName: string | null | undefined): boolean {
    if (!iconName) return false;
    return iconName in CATEGORY_ICON_PATHS;
}

// Get PNG path for an icon
export function getIconPath(iconName: string | null | undefined): string | null {
    if (!iconName) return null;
    return CATEGORY_ICON_PATHS[iconName] || null;
}

// Get icon as React Node
export function getCategoryIcon(iconName: string | null | undefined): React.ReactNode {
    // If we have a PNG for this icon, use Image component
    if (iconName && iconName in CATEGORY_ICON_PATHS) {
        return (
            <Image
                src={CATEGORY_ICON_PATHS[iconName]}
                alt={iconName}
                width={200}
                height={200}
                className="w-full h-full object-contain"
            />
        );
    }

    // Default fallback
    return <DefaultIcon />;
}

// Export for admin icon selector
export const CATEGORY_ICONS: Record<string, React.ReactNode> = Object.fromEntries(
    Object.keys(CATEGORY_ICON_PATHS).map(key => [
        key,
        <Image
            key={key}
            src={CATEGORY_ICON_PATHS[key]}
            alt={key}
            width={40}
            height={40}
            className="object-contain"
        />
    ])
);
