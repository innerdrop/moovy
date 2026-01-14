
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordPointsTransaction } from "@/lib/points";

// POST - Adjust user points
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Params is a promise in Next 15+
) {
    try {
        const session = await auth();
        const isAdmin = session?.user?.role === "ADMIN" || session?.user?.email === "admin@moovy.com";

        if (!isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id } = await params;
        const { amount, description, type } = await request.json();

        if (!amount || isNaN(amount)) {
            return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
        }

        const success = await recordPointsTransaction(
            id,
            type || "ADJUSTMENT",
            amount,
            description || "Ajuste manual de administrador"
        );

        if (!success) {
            return NextResponse.json({ error: "Error al registrar transacción" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error adjusting points:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
