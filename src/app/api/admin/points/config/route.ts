
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPointsConfig, updatePointsConfig } from "@/lib/points";

// GET - Retrieve current points configuration
export async function GET(request: Request) {
    try {
        const session = await auth();
        // Check if user is admin - Adjust role check based on your auth implementation
        const isAdmin = session?.user?.role === "ADMIN" || session?.user?.email === "admin@moovy.com";

        if (!isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const config = await getPointsConfig();
        return NextResponse.json(config);
    } catch (error) {
        console.error("Error fetching points config:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Update points configuration
export async function POST(request: Request) {
    try {
        const session = await auth();
        const isAdmin = session?.user?.role === "ADMIN" || session?.user?.email === "admin@moovy.com";

        if (!isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();

        // Basic validation can be added here if needed

        const updatedConfig = await updatePointsConfig(body);
        return NextResponse.json(updatedConfig);
    } catch (error) {
        console.error("Error updating points config:", error);
        return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 });
    }
}
