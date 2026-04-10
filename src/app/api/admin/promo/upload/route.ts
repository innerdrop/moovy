// API Route: Promo Banner Image Upload
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { isR2Configured, uploadToR2 } from "@/lib/r2-storage";

export async function POST(request: Request) {
    try {
        const session = await auth();
        const userRole = (session?.user as any)?.role;

        if (!session || !["ADMIN", "admin"].includes(userRole)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Tipo de archivo no permitido. Use JPG, PNG, WebP o GIF." },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "El archivo es muy grande. Máximo 10MB." },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const ext = file.name.split(".").pop();
        const uniqueName = `promo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const key = `promo/${uniqueName}`;

        // ── R2 (producción) ───────────────────────────────────────
        if (isR2Configured()) {
            try {
                const publicUrl = await uploadToR2(key, buffer, file.type);
                return NextResponse.json({
                    success: true,
                    url: publicUrl,
                    message: "Imagen subida correctamente",
                });
            } catch (r2Error) {
                console.error("R2 upload failed, falling back to filesystem:", r2Error);
            }
        }

        // ── Filesystem (desarrollo / fallback) ───────────────────
        const uploadDir = path.join(process.cwd(), "public", "uploads", "promo");
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, uniqueName), buffer);

        return NextResponse.json({
            success: true,
            url: `/uploads/promo/${uniqueName}`,
            message: "Imagen subida correctamente",
        });
    } catch (error) {
        console.error("Error uploading promo banner image:", error);
        return NextResponse.json(
            { error: "Error al subir la imagen" },
            { status: 500 }
        );
    }
}
