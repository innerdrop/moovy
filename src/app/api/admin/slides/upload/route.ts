// API Route: Image Upload for Slides
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { isR2Configured, uploadToR2 } from "@/lib/r2-storage";

export async function POST(request: Request) {
    try {
        const session = await auth();
        const userRole = (session?.user as any)?.role;

        // Check for admin role
        if (!session || !["ADMIN", "admin"].includes(userRole)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Tipo de archivo no válido. Use JPG, PNG, WEBP o GIF" },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "El archivo es muy grande. Máximo 10MB" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const ext = file.name.split(".").pop();
        const filename = `slide-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const key = `slides/${filename}`;

        // ── R2 (producción) ───────────────────────────────────────
        if (isR2Configured()) {
            try {
                const publicUrl = await uploadToR2(key, buffer, file.type);
                return NextResponse.json({ url: publicUrl });
            } catch (r2Error) {
                console.error("R2 upload failed, falling back to filesystem:", r2Error);
            }
        }

        // ── Filesystem (desarrollo / fallback) ───────────────────
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "slides");
        await mkdir(uploadsDir, { recursive: true });
        await writeFile(path.join(uploadsDir, filename), buffer);

        return NextResponse.json({ url: `/uploads/slides/${filename}` });
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json(
            { error: "Error al subir el archivo" },
            { status: 500 }
        );
    }
}
