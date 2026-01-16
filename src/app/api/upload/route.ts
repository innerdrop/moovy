import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

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

        // Generate unique filename
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name.replaceAll(" ", "_")}`;

        // Ensure directory exists (handled by creation command, but good practice)
        // In local/VPS we write to public/uploads/products
        const uploadDir = path.join(process.cwd(), "public", "uploads", "products");

        try {
            await writeFile(path.join(uploadDir, filename), buffer);
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
