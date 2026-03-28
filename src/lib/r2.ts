/**
 * Cloudflare R2 client — almacenamiento de objetos para MOOVY.
 *
 * R2 usa la misma API de S3, así que usamos el SDK oficial de AWS.
 * Si las env vars no están configuradas, las funciones lanzan un error
 * claro para que sea fácil diagnosticar en producción.
 *
 * Env vars requeridas:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *
 * URL pública: https://pub-{account_id}.r2.dev/{key}
 *   (requiere habilitar acceso público en el bucket desde el dashboard)
 *
 * Alternativa: custom domain (ej: cdn.somosmoovy.com)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// ── Configuración ───────────────────────────────────────────────────
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET_NAME || "moovy-uploads";

function getR2Client(): S3Client {
    if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY) {
        throw new Error(
            "R2 no configurado: faltan R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, o R2_SECRET_ACCESS_KEY en .env"
        );
    }
    return new S3Client({
        region: "auto",
        endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: ACCESS_KEY,
            secretAccessKey: SECRET_KEY,
        },
    });
}

// Singleton perezoso — se crea solo cuando se necesita
let _client: S3Client | null = null;
function client(): S3Client {
    if (!_client) _client = getR2Client();
    return _client;
}

// ── Helpers públicos ────────────────────────────────────────────────

/**
 * Sube un archivo a R2.
 * @param key   Ruta dentro del bucket (ej: "slides/1234-banner.webp")
 * @param body  Buffer con el contenido del archivo
 * @param contentType  MIME type (ej: "image/webp")
 * @returns     URL pública del archivo
 */
export async function uploadToR2(
    key: string,
    body: Buffer,
    contentType: string = "image/webp"
): Promise<string> {
    await client().send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: "public, max-age=2592000, immutable", // 30 días
        })
    );

    return getR2PublicUrl(key);
}

/**
 * Elimina un archivo de R2.
 * No falla si el archivo no existe (idempotente).
 */
export async function deleteFromR2(key: string): Promise<void> {
    try {
        await client().send(
            new DeleteObjectCommand({
                Bucket: BUCKET,
                Key: key,
            })
        );
    } catch (error) {
        console.error(`[R2] Error deleting ${key}:`, error);
    }
}

/**
 * Construye la URL pública de un archivo en R2.
 * Usa el dominio público del bucket (r2.dev) o un custom domain si está configurado.
 */
export function getR2PublicUrl(key: string): string {
    const customDomain = process.env.R2_PUBLIC_URL;
    if (customDomain) {
        return `${customDomain}/${key}`;
    }
    // Fallback: URL pública de R2 (requiere habilitar acceso público en el bucket)
    return `https://pub-${ACCOUNT_ID}.r2.dev/${key}`;
}

/**
 * Extrae el key de R2 desde una URL completa.
 * Útil para eliminar archivos cuando solo tenés la URL guardada en la DB.
 */
export function extractR2Key(url: string): string | null {
    if (!url) return null;
    // URL de R2: https://pub-xxx.r2.dev/slides/filename.webp
    // Custom domain: https://cdn.somosmoovy.com/slides/filename.webp
    // Local fallback: /uploads/slides/filename.webp
    try {
        if (url.startsWith("/uploads/")) {
            // Legacy local URL — convertir a key de R2
            return url.replace("/uploads/", "");
        }
        const parsed = new URL(url);
        return parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
    } catch {
        return null;
    }
}

/**
 * Verifica si R2 está configurado (tiene las env vars necesarias).
 */
export function isR2Configured(): boolean {
    return !!(ACCOUNT_ID && ACCESS_KEY && SECRET_KEY);
}
