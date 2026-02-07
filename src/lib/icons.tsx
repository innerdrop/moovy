"use client";

import React from "react";
import Image from "next/image";

// Mapping of icon keys to PNG file paths
export const CATEGORY_ICON_PATHS: Record<string, string> = {
    // Direct mappings to uploaded PNGs
    almacen: "/icons/categories/cat_almacen.png",
    burger: "/icons/categories/cat_burger.png",
    hamburguesas: "/icons/categories/cat_burger.png",
    cervezas: "/icons/categories/cat_cervezas.png",
    gaseosas: "/icons/categories/cat_gaseosas.png",
    bebidas: "/icons/categories/cat_gaseosas.png",
    juegos: "/icons/categories/cat_juegos.png",
    vinos: "/icons/categories/cat_vinos.png",
};

// Default icon path (fallback)
const DEFAULT_ICON_PATH = "/icons/categories/cat_almacen.png";

// SVG fallback icons for categories without PNG
const SVG_ICONS: Record<string, React.ReactNode> = {
    snacks: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <path d="M8 30 L20 5 L32 30 Z" fill="#FFD700" />
            <circle cx="15" cy="22" r="3" fill="#e60012" />
            <circle cx="22" cy="18" r="2.5" fill="#e60012" />
            <circle cx="18" cy="26" r="2" fill="#e60012" />
            <path d="M8 30 Q20 33 32 30" fill="#DAA520" />
        </svg>
    ),
    kioscos: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <rect x="8" y="15" width="24" height="20" fill="#4A90D9" rx="2" />
            <path d="M5 15 L20 5 L35 15 Z" fill="#e60012" />
            <rect x="16" y="22" width="8" height="13" fill="#87CEEB" />
            <rect x="10" y="18" width="5" height="5" fill="#fff" />
            <rect x="25" y="18" width="5" height="5" fill="#fff" />
        </svg>
    ),
    esenciales: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <rect x="5" y="12" width="18" height="14" fill="#4A90D9" rx="2" />
            <rect x="17" y="18" width="18" height="14" fill="#e60012" rx="2" />
            <rect x="7" y="14" width="6" height="3" fill="#fff" opacity="0.5" />
            <rect x="19" y="20" width="6" height="3" fill="#fff" opacity="0.5" />
        </svg>
    ),
    lacteos: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <path d="M12 8 L14 12 L26 12 L28 8 Z" fill="#87CEEB" />
            <rect x="14" y="12" width="12" height="22" fill="#fff" stroke="#ddd" strokeWidth="1" rx="2" />
            <rect x="16" y="15" width="8" height="6" fill="#87CEEB" rx="1" />
        </svg>
    ),
    golosinas: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <circle cx="20" cy="20" r="10" fill="#FF69B4" />
            <path d="M12 15 Q8 12 10 8" stroke="#FF69B4" strokeWidth="4" fill="none" />
            <path d="M28 15 Q32 12 30 8" stroke="#FF69B4" strokeWidth="4" fill="none" />
            <circle cx="17" cy="18" r="2" fill="#fff" opacity="0.5" />
        </svg>
    ),
    limpieza: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <rect x="14" y="8" width="12" height="24" fill="#4ECDC4" rx="3" />
            <rect x="16" y="4" width="8" height="6" fill="#45B7AA" rx="2" />
            <rect x="16" y="14" width="8" height="8" fill="#fff" rx="1" />
        </svg>
    ),
    default: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <circle cx="20" cy="20" r="14" fill="#e60012" />
            <rect x="16" y="12" width="8" height="16" fill="#fff" rx="2" />
        </svg>
    )
};

// Get all available icon keys for the admin selector
export function getAvailableIconKeys(): string[] {
    const pngKeys = Object.keys(CATEGORY_ICON_PATHS);
    const svgKeys = Object.keys(SVG_ICONS).filter(k => k !== 'default');
    return [...new Set([...pngKeys, ...svgKeys])];
}

// Check if icon has a PNG version
export function hasPngIcon(iconName: string | null | undefined): boolean {
    if (!iconName) return false;
    return iconName in CATEGORY_ICON_PATHS;
}

// Get PNG path for an icon
export function getIconPath(iconName: string | null | undefined): string {
    if (!iconName) return DEFAULT_ICON_PATH;
    return CATEGORY_ICON_PATHS[iconName] || DEFAULT_ICON_PATH;
}

// Get icon as React Node (for backwards compatibility)
export function getCategoryIcon(iconName: string | null | undefined): React.ReactNode {
    if (!iconName) {
        return SVG_ICONS.default;
    }

    // If we have a PNG for this icon, use Image component
    if (iconName in CATEGORY_ICON_PATHS) {
        return (
            <Image
                src={CATEGORY_ICON_PATHS[iconName]}
                alt={iconName}
                width={40}
                height={40}
                className="object-contain"
            />
        );
    }

    // Fall back to SVG if available
    if (iconName in SVG_ICONS) {
        return SVG_ICONS[iconName];
    }

    // Default fallback
    return SVG_ICONS.default;
}

// LEGACY: Keep old CATEGORY_ICONS export for compatibility
export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    ...Object.fromEntries(
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
    ),
    ...SVG_ICONS
};
