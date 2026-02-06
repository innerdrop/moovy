import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import sharp from "sharp";

export async function POST(request: Request) {
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

        // Validate type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }

        // Get original buffer
        const originalBuffer = Buffer.from(await file.arrayBuffer());

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
