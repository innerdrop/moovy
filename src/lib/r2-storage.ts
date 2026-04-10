/**
 * Cloudflare R2 client — almacenamiento de objetos para MOOVY.
 *
 * R2 usa la misma API de S3, así que usamos el SDK oficial de AWS.
 * Si las env vars no están configuradas, isR2Configured() devuelve false
 * y las rutas usan filesystem local como fallback (desarrollo).
 *
 * Env vars requeridas en producción:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *
 * Opcional:
 *   R2_PUBLIC_URL — dominio custom para URLs públicas.
 *     Si no se define, usa: https://pub-{ACCOUNT_ID}.r2.dev/{key}
 *
 * Última actualización: 2026-03-28
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// ── Configuración ─────────────────────────────────────────────────
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "";

// ── Singleton (lazy) ──────────────────────────────────────────────
let _client: S3Client | null = null;

function getClient(): S3Client {
    if (!_client) {
        if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
            throw new Error(
                "R2 no configurado: faltan R2_ACCOUNT_ID, R2_ACCESS_KEY_ID o R2_SECRET_ACCESS_KEY"
            );
        }
        _client = new S3Client({
            region: "auto",
            endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
            },
        });
    }
    return _client;
}

// ── API pública ───────────────────────────────────────────────────

/** ¿Está R2 configurado? Si no, las rutas usan filesystem como fallback. */
export function isR2Configured(): boolean {
    return !!(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY && BUCKET_NAME);
}

/**
 * Sube un archivo a R2.
 * @param key - Ruta dentro del bucket (ej: "products/123-image.webp")
 * @param body - Contenido del archivo (Buffer)
 * @param contentType - MIME type (ej: "image/webp")
 * @returns URL pública del archivo
 */
export async function uploadToR2(
    key: string,
    body: Buffer,
    contentType: string
): Promise<string> {
    const client = getClient();
    await client.send(
        new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
        })
    );
    return getR2PublicUrl(key);
}

/** Elimina un archivo de R2. */
export async function deleteFromR2(key: string): Promise<void> {
    const client = getClient();
    await client.send(
        new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        })
    );
}

/** Genera la URL pública para un key. */
export function getR2PublicUrl(key: string): string {
    const customDomain = process.env.R2_PUBLIC_URL;
    if (customDomain) {
        const base = customDomain.replace(/\/+$/, "");
        return `${base}/${key}`;
    }
    return `https://pub-${ACCOUNT_ID}.r2.dev/${key}`;
}

/**
 * Extrae el key de una URL de R2 (para operaciones de delete).
 * Devuelve null si la URL no es de R2.
 */
export function extractR2Key(url: string): string | null {
    const r2Match = url.match(/\.r2\.dev\/(.+)$/);
    if (r2Match) return r2Match[1];

    const customDomain = process.env.R2_PUBLIC_URL;
    if (customDomain && url.startsWith(customDomain)) {
        const base = customDomain.replace(/\/+$/, "");
        return url.slice(base.length + 1);
    }

    return null;
}
