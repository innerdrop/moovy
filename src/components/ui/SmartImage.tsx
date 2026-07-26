"use client";

// perf/skeletons-y-optimizacion-imagenes (2026-07-26): reemplazo de los <img>
// pelados del camino comprador. Tres mejoras en una:
// 1. next/image: el servidor comprime y sirve el tamaño JUSTO para el
//    dispositivo (WebP), con carga diferida — el <img> pelado bajaba la foto
//    original entera; de ahí la lentitud percibida en producción.
// 2. Esqueleto gris con brillo mientras la imagen baja (patrón de todas las
//    apps grandes) — nunca más un hueco blanco.
// 3. Si la imagen falla (optimizador con timeout, R2 caído), queda un bloque
//    gris limpio en vez del ícono de imagen rota.
//
// REQUISITO del contenedor: position relative + tamaño definido
// (aspect-*, w-/h- fijos) — la imagen se estira a llenarlo (fill).

import Image from "next/image";
import { useState } from "react";

type Props = {
    src: string;
    alt: string;
    /** Clases del <img> interno: object-cover / object-contain, padding, zoom… */
    className?: string;
    /** Hint de tamaño para que Next sirva la resolución justa (no un 4K en un pulgar). */
    sizes?: string;
    /** SOLO para la imagen grande visible al abrir la página (LCP). */
    priority?: boolean;
};

export default function SmartImage({
    src,
    alt,
    className = "object-cover",
    sizes = "100vw",
    priority = false,
}: Props) {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);

    if (failed) {
        // Bloque gris limpio — el layout no salta y no queda un ícono roto.
        return <div className="absolute inset-0 bg-gray-100" aria-hidden />;
    }

    return (
        <>
            {!loaded && <div className="absolute inset-0 sk-skeleton !rounded-none" aria-hidden />}
            <Image
                src={src}
                alt={alt}
                fill
                sizes={sizes}
                priority={priority}
                className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
            />
        </>
    );
}
