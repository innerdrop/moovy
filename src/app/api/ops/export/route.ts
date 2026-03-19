import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

function toCsv(headers: string[], rows: string[][]): string {
    const escape = (val: string) => {
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    };
    const lines = [
        headers.map(escape).join(","),
        ...rows.map((row) => row.map((v) => escape(v ?? "")).join(",")),
    ];
    return "\uFEFF" + lines.join("\n"); // BOM for Excel UTF-8
}

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const type = request.nextUrl.searchParams.get("type");

    try {
        let csv = "";
        let filename = "export.csv";

        if (type === "orders") {
            const orders = await prisma.order.findMany({
                include: {
                    user: { select: { name: true, email: true, phone: true } },
                    merchant: { select: { name: true } },
                    driver: { select: { user: { select: { name: true } } } },
                    address: true,
                },
                orderBy: { createdAt: "desc" },
                take: 5000,
            });

            csv = toCsv(
                ["Nro", "Estado", "Total", "Método Pago", "Cliente", "Email", "Teléfono", "Comercio", "Repartidor", "Dirección", "Fecha"],
                orders.map((o) => [
                    o.orderNumber,
                    o.status,
                    o.total.toFixed(2),
                    o.paymentMethod || "",
                    o.user?.name || "",
                    o.user?.email || "",
                    o.user?.phone || "",
                    o.merchant?.name || "",
                    o.driver?.user?.name || "",
                    o.address ? `${o.address.street} ${o.address.number}, ${o.address.city}` : "",
                    new Date(o.createdAt).toLocaleString("es-AR"),
                ])
            );
            filename = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;

        } else if (type === "users") {
            const users = await prisma.user.findMany({
                select: {
                    name: true,
                    email: true,
                    phone: true,
                    pointsBalance: true,
                    createdAt: true,
                    roles: { select: { role: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 10000,
            });

            csv = toCsv(
                ["Nombre", "Email", "Teléfono", "Puntos", "Roles", "Fecha Registro"],
                users.map((u) => [
                    u.name || "",
                    u.email,
                    u.phone || "",
                    u.pointsBalance.toString(),
                    u.roles.map((r) => r.role).join(", "),
                    new Date(u.createdAt).toLocaleString("es-AR"),
                ])
            );
            filename = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;

        } else if (type === "merchants") {
            const merchants = await prisma.merchant.findMany({
                include: {
                    owner: { select: { name: true, email: true, phone: true } },
                },
                orderBy: { createdAt: "desc" },
            });

            csv = toCsv(
                ["Nombre", "Categoría", "CUIT", "Email", "Teléfono", "Dirección", "Activo", "Abierto", "Rating", "Comisión %", "Propietario", "Fecha Registro"],
                merchants.map((m) => [
                    m.name,
                    m.category || "",
                    m.cuit || "",
                    m.email || "",
                    m.phone || "",
                    m.address || "",
                    m.isActive ? "Sí" : "No",
                    m.isOpen ? "Sí" : "No",
                    m.rating?.toFixed(1) || "",
                    m.commissionRate.toString(),
                    m.owner?.name || "",
                    new Date(m.createdAt).toLocaleString("es-AR"),
                ])
            );
            filename = `comercios-${new Date().toISOString().slice(0, 10)}.csv`;

        } else {
            return NextResponse.json({ error: "Tipo no válido. Usar: orders, users, merchants" }, { status: 400 });
        }

        // V-024 FIX: Audit log for PII data exports
        const rowCount = csv.split("\n").length - 1; // minus header
        await logAudit({
            action: "DATA_EXPORT",
            entityType: type!,
            entityId: `export-${type}-${new Date().toISOString()}`,
            userId: session.user.id,
            details: {
                exportType: type,
                recordCount: rowCount,
                filename,
                ip: request.headers.get("x-forwarded-for") || "unknown",
            },
        });

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Error al exportar" }, { status: 500 });
    }
}
