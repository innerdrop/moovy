// API Route: Image Upload for Slides
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

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

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "El archivo es muy grande. Máximo 5MB" },
                { status: 400 }
            );
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "slides");
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const ext = file.name.split(".").pop();
        const filename = `slide-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        // Write file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Return the public URL
        const publicUrl = `/uploads/slides/${filename}`;

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json(
            { error: "Error al subir el archivo" },
            { status: 500 }
        );
    }
}
