import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { applyRateLimit } from "@/lib/rate-limit";
import { isR2Configured, uploadToR2 } from "@/lib/r2-storage";

/**
 * Endpoint PÚBLICO para subir documentos durante el registro.
 * NO requiere auth (el usuario aún no tiene cuenta).
 * Rate limit más estricto: 5 uploads por minuto.
 * Solo acepta imágenes y PDF.
 * Archivos van a la carpeta "registration-docs/".
 */

// Magic bytes para validar tipo real del archivo
const MAGIC_BYTES: Record<string, number[][]> = {
    jpeg: [[0xFF, 0xD8, 0xFF]],
    png: [[0x89, 0x50, 0x4E, 0x47]],
    gif: [[0x47, 0x49, 0x46, 0x38]],
    webp: [[0x52, 0x49, 0x46, 0x46]],
    pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function detectFileType(buf: Buffer): "image" | "pdf" | null {
    // Check PDF first
    const pdfSig = MAGIC_BYTES.pdf[0];
    if (buf.length >= pdfSig.length && pdfSig.every((byte, i) => buf[i] === byte)) {
        return "pdf";
    }
    // Check image types
    for (const [type, signatures] of Object.entries(MAGIC_BYTES)) {
        if (type === "pdf") continue;
        for (const sig of signatures) {
            if (buf.length >= sig.length && sig.every((byte, i) => buf[i] === byte)) {
                return "image";
            }
        }
    }
    return null;
}

export async function POST(request: Request) {
    // Rate limit más estricto para endpoint público: 5 por minuto
    const limited = await applyRateLimit(request, "upload-registration", 5, 60_000);
    if (limited) return limited;

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
        }

        // Validar tamaño
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `Archivo demasiado grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        // Validar extensión
        const ext = file.name?.split(".").pop()?.toLowerCase() || "";
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return NextResponse.json(
                { error: "Formato no permitido. Aceptamos PDF, JPG, PNG y WebP." },
                { status: 400 }
            );
        }

        // Leer buffer
        const originalBuffer = Buffer.from(await file.arrayBuffer());

        // Validar magic bytes
        const fileType = detectFileType(originalBuffer);
        if (!fileType) {
            return NextResponse.json(
                { error: "El contenido del archivo no coincide con un formato válido (PDF o imagen)." },
                { status: 400 }
            );
        }

        // Validar coherencia extensión ↔ contenido
        if (ext === "pdf" && fileType !== "pdf") {
            return NextResponse.json(
                { error: "La extensión es .pdf pero el contenido no es un PDF válido." },
                { status: 400 }
            );
        }
        if (ext !== "pdf" && fileType === "pdf") {
            return NextResponse.json(
                { error: "El archivo es un PDF pero tiene extensión de imagen." },
                { status: 400 }
            );
        }

        const safeFolder = "registration-docs";
        let finalBuffer: Buffer;
        let filename: string;
        let contentType: string;

        if (fileType === "pdf") {
            // PDF: guardar tal cual, sin procesar con sharp
            finalBuffer = originalBuffer;
            const baseName = file.name.replace(/\.[^/.]+$/, "").replaceAll(" ", "_");
            filename = `${Date.now()}-${baseName}.pdf`;
            contentType = "application/pdf";
        } else {
            // Imagen: comprimir con sharp
            finalBuffer = await sharp(originalBuffer)
                .resize(1200, null, {
                    withoutEnlargement: true,
                    fit: "inside"
                })
                .webp({ quality: 80 })
                .rotate()
                .toBuffer();
            const baseName = file.name.replace(/\.[^/.]+$/, "").replaceAll(" ", "_");
            filename = `${Date.now()}-${baseName}.webp`;
            contentType = "image/webp";
        }

        const key = `${safeFolder}/${filename}`;

        // R2 (producción)
        if (isR2Configured()) {
            try {
                const publicUrl = await uploadToR2(key, finalBuffer, contentType);
                return NextResponse.json({ url: publicUrl });
            } catch (r2Error) {
                console.error("R2 upload failed, falling back to filesystem:", r2Error);
            }
        }

        // Filesystem (desarrollo / fallback)
        const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch {
            // Directory already exists
        }

        try {
            await writeFile(path.join(uploadDir, filename), finalBuffer);
        } catch (error) {
            console.error("Error saving file:", error);
            return NextResponse.json({ error: "Error al guardar el archivo" }, { status: 500 });
        }

        const fileUrl = `/uploads/${safeFolder}/${filename}`;
        return NextResponse.json({ url: fileUrl });

    } catch (error) {
        console.error("Registration upload error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
