import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import sharp from "sharp";
import { applyRateLimit } from "@/lib/rate-limit";

// V-018 FIX: Magic bytes validation for real file type detection
const MAGIC_BYTES: Record<string, number[][]> = {
    jpeg: [[0xFF, 0xD8, 0xFF]],
    png: [[0x89, 0x50, 0x4E, 0x47]],
    gif: [[0x47, 0x49, 0x46, 0x38]],
    webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateMagicBytes(buf: Buffer): boolean {
    for (const signatures of Object.values(MAGIC_BYTES)) {
        for (const sig of signatures) {
            if (buf.length >= sig.length && sig.every((byte, i) => buf[i] === byte)) {
                return true;
            }
        }
    }
    return false;
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
                { error: "Extensión no permitida. Solo JPEG, PNG, GIF y WebP." },
                { status: 400 }
            );
        }

        // Validate MIME type (client-provided, can be spoofed)
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }

        // Get original buffer
        const originalBuffer = Buffer.from(await file.arrayBuffer());

        // V-018: Validate magic bytes (real file type detection, cannot be spoofed)
        if (!validateMagicBytes(originalBuffer)) {
            return NextResponse.json(
                { error: "Formato de imagen no válido. El contenido del archivo no coincide con una imagen." },
                { status: 400 }
            );
        }

        // Process image with sharp:
        // 1. Resize to max 1200px width (maintaining aspect ratio)
        // 2. Convert to WebP format
        // 3. Compress to 80% quality
        // 4. Remove EXIF/metadata
        const optimizedBuffer = await sharp(originalBuffer)
            .resize(1200, null, {
                withoutEnlargement: true,  // Don't upscale small images
                fit: 'inside'
            })
            .webp({ quality: 80 })
            .rotate() // Auto-rotate based on EXIF orientation before stripping
            .toBuffer();

        // Generate unique filename with .webp extension
        const baseName = file.name.replace(/\.[^/.]+$/, "").replaceAll(" ", "_");
        const filename = `${Date.now()}-${baseName}.webp`;

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), "public", "uploads", "products");

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch {
            // Directory already exists, ignore
        }

        try {
            await writeFile(path.join(uploadDir, filename), optimizedBuffer);
        } catch (error) {
            console.error("Error saving file:", error);
            return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
        }

        // Return the public URL
        const imageUrl = `/uploads/products/${filename}`;
        return NextResponse.json({ url: imageUrl });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
