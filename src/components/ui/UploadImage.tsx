"use client";

import Image, { type ImageProps } from "next/image";

/**
 * UploadImage — wrapper de next/image para imágenes subidas por usuarios.
 *
 * Problema: En producción, Next.js standalone no puede optimizar imágenes
 * que están en /uploads/ (fueron creadas post-build). El optimizador
 * devuelve 400 Bad Request.
 *
 * Solución: Si la URL es un path local (/uploads/...), se usa `unoptimized`
 * para que el browser pida el archivo directo a Nginx. Si la URL es remota
 * (R2, CDN, etc.), se usa la optimización normal de Next.js.
 *
 * Uso: Reemplazar `<Image>` por `<UploadImage>` en TODO componente que
 * muestre imágenes subidas por usuarios (productos, banners, avatares, etc.)
 */
function isLocalUpload(src: string | undefined | null): boolean {
    if (!src) return false;
    return src.startsWith("/uploads/") || src.startsWith("/uploads\\");
}

type UploadImageProps = Omit<ImageProps, "src"> & {
    src: string | null | undefined;
    fallbackSrc?: string;
};

export default function UploadImage({
    src,
    fallbackSrc = "/placeholder-image.webp",
    alt,
    ...props
}: UploadImageProps) {
    const imageSrc = src || fallbackSrc;
    const shouldSkipOptimization = isLocalUpload(imageSrc);

    return (
        <Image
            src={imageSrc}
            alt={alt}
            unoptimized={shouldSkipOptimization}
            {...props}
        />
    );
}
