import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import sharp from "sharp";
import { applyRateLimit } from "@/lib/rate-limit";
import { isR2Configured, uploadToR2 } from "@/lib/r2-storage";

// V-018 FIX: Magic bytes validation for real file type detection
const MAGIC_BYTES: Record<string, number[][]> = {
    jpeg: [[0xFF, 0xD8, 0xFF]],
    png: [[0x89, 0x50, 0x4E, 0x47]],
    gif: [[0x47, 0x49, 0x46, 0x38]],
    webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF header
    pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function detectFileType(buf: Buffer): "image" | "pdf" | null {
    const pdfSig = MAGIC_BYTES.pdf[0];
    if (buf.length >= pdfSig.length && pdfSig.every((byte, i) => buf[i] === byte)) {
        return "pdf";
    }
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
    // Rate limit: max 10 uploads per minute per IP
    const limited = await applyRateLimit(request, "upload", 10, 60_000);
    if (limited) return limited;

    try {
        // Security check
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file received" }, { status: 400 });
        }

        // V-018: Validate file size BEFORE reading buffer
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `Archivo demasiado grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        // V-018: Validate file extension (whitelist)
        const ext = file.name?.split(".").pop()?.toLowerCase() || "";
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return NextResponse.json(
                { error: "Extensión no permitida. Aceptamos PDF, JPEG, PNG, GIF y WebP." },
                { status: 400 }
            );
        }

        // Validate MIME type (client-provided, can be spoofed)
        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
            return NextResponse.json({ error: "El archivo debe ser una imagen o PDF" }, { status: 400 });
        }

        // Get original buffer
        const originalBuffer = Buffer.from(await file.arrayBuffer());

        // V-018: Validate magic bytes (real file type detection, cannot be spoofed)
        const fileType = detectFileType(originalBuffer);
        if (!fileType) {
            return NextResponse.json(
                { error: "Formato no válido. El contenido del archivo no coincide con una imagen o PDF." },
                { status: 400 }
            );
        }

        // Support custom maxWidth via query string (for hero banners etc.)
        const url = new URL(request.url);
        const maxWidthParam = url.searchParams.get("maxWidth");
        const subfolder = url.searchParams.get("folder") || "products";
        // Validate subfolder to prevent path traversal
        const safeFolder = subfolder.replace(/[^a-zA-Z0-9_-]/g, "");
        const maxWidth = maxWidthParam ? Math.min(Math.max(parseInt(maxWidthParam, 10) || 1200, 200), 3000) : 1200;

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
                .resize(maxWidth, null, {
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

        // ── R2 (producción) ───────────────────────────────────────
        if (isR2Configured()) {
            try {
                const publicUrl = await uploadToR2(key, finalBuffer, contentType);
                return NextResponse.json({ url: publicUrl });
            } catch (r2Error) {
                console.error("R2 upload failed, falling back to filesystem:", r2Error);
                // Fall through to filesystem
            }
        }

        // ── Filesystem (desarrollo / fallback) ───────────────────
        const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch {
            // Directory already exists, ignore
        }

        try {
            await writeFile(path.join(uploadDir, filename), finalBuffer);
        } catch (error) {
            console.error("Error saving file:", error);
            return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
        }

        const fileUrl = `/uploads/${safeFolder}/${filename}`;
        return NextResponse.json({ url: fileUrl });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
