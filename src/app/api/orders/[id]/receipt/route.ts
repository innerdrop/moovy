// API Route: Order Receipt/Comprobante (HTML, print-friendly)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET - Generate receipt HTML
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const isAdmin = hasAnyRole(session, ["ADMIN"]);

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                address: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                merchant: { select: { id: true, name: true, address: true, phone: true } },
                subOrders: {
                    include: {
                        seller: { select: { id: true, displayName: true } },
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Only allow access to own orders or if admin
        if (!isAdmin && order.userId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Format price helper
        const formatPrice = (price: number) =>
            new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
                minimumFractionDigits: 0,
            }).format(price);

        // Format date helper
        const formatDate = (date: Date) =>
            new Intl.DateTimeFormat("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }).format(date);

        const orderDate = new Date(order.createdAt);
        const vendorName =
            order.subOrders?.find((so) => so.seller)?.seller?.displayName ||
            order.merchant?.name ||
            "MOOVY";

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprobante #${order.orderNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: #f5f5f5;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e60012;
        }
        .logo {
            font-size: 28px;
            font-weight: 900;
            color: #e60012;
            margin-bottom: 10px;
            letter-spacing: -1px;
        }
        .order-number {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        .order-date {
            font-size: 13px;
            color: #999;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #999;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        .info-label {
            color: #666;
            font-weight: 500;
        }
        .info-value {
            color: #333;
            text-align: right;
            flex: 1;
            margin-left: 20px;
            word-break: break-word;
        }
        .buyer-info {
            font-size: 14px;
            line-height: 1.6;
        }
        .buyer-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
        }
        .buyer-contact {
            color: #666;
            font-size: 13px;
        }
        .address-info {
            font-size: 14px;
            line-height: 1.6;
        }
        .address-street {
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
        }
        .address-detail {
            color: #666;
            font-size: 13px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table thead {
            background: #f8f8f8;
        }
        .items-table th {
            padding: 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #666;
            border-bottom: 1px solid #ddd;
        }
        .items-table td {
            padding: 12px 10px;
            font-size: 14px;
            border-bottom: 1px solid #eee;
        }
        .item-name {
            color: #333;
            font-weight: 500;
        }
        .item-qty {
            text-align: center;
            color: #666;
        }
        .item-price {
            text-align: right;
            color: #333;
            font-weight: 500;
        }
        .summary {
            border-top: 2px solid #e60012;
            padding-top: 15px;
            margin-top: 15px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .summary-label {
            color: #666;
        }
        .summary-value {
            color: #333;
            font-weight: 500;
            text-align: right;
            min-width: 100px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #ddd;
            font-size: 16px;
            font-weight: 700;
        }
        .total-label {
            color: #333;
        }
        .total-value {
            color: #e60012;
            min-width: 120px;
            text-align: right;
        }
        .vendor-info {
            background: #f8f8f8;
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        .vendor-label {
            font-weight: 600;
            color: #666;
            margin-bottom: 4px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .vendor-name {
            color: #333;
            font-weight: 600;
        }
        .disclaimer {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            color: #856404;
            margin-top: 20px;
            text-align: center;
            font-weight: 500;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
        }
        .status-delivered {
            background: #d4edda;
            color: #155724;
        }
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        .status-cancelled {
            background: #f8d7da;
            color: #721c24;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
                padding: 0;
                border-radius: 0;
                max-width: 100%;
            }
            .no-print {
                display: none;
            }
            a {
                text-decoration: none;
                color: inherit;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">MOOVY</div>
            <div class="order-number">Comprobante #${order.orderNumber}</div>
            <div class="order-date">${formatDate(orderDate)}</div>
            <div class="status-badge status-${order.status === "DELIVERED" ? "delivered" : order.status === "CANCELLED" ? "cancelled" : "pending"}">
                ${order.status === "DELIVERED" ? "Entregado" : order.status === "CANCELLED" ? "Cancelado" : "Pendiente"}
            </div>
        </div>

        <!-- Buyer Info -->
        <div class="section">
            <div class="section-title">Comprador</div>
            <div class="buyer-info">
                <div class="buyer-name">${order.user.name || "Sin nombre"}</div>
                ${order.user.email ? `<div class="buyer-contact">${order.user.email}</div>` : ""}
                ${order.user.phone ? `<div class="buyer-contact">${order.user.phone}</div>` : ""}
            </div>
        </div>

        <!-- Vendor Info -->
        <div class="section">
            <div class="vendor-info">
                <div class="vendor-label">${order.subOrders?.some((so) => so.seller) ? "Vendedor" : "Comercio"}</div>
                <div class="vendor-name">${vendorName}</div>
                ${order.merchant?.address ? `<div style="color: #666; font-size: 12px; margin-top: 4px;">${order.merchant.address}</div>` : ""}
            </div>
        </div>

        <!-- Delivery Address -->
        <div class="section">
            <div class="section-title">Dirección de entrega</div>
            <div class="address-info">
                <div class="address-street">${order.address.street} ${order.address.number}</div>
                ${order.address.floor ? `<div class="address-detail">Piso ${order.address.floor}${order.address.apartment ? `, Depto ${order.address.apartment}` : ""}</div>` : ""}
                <div class="address-detail">${order.address.city}</div>
                ${order.address.notes ? `<div class="address-detail" style="margin-top: 6px; font-style: italic;">${order.address.notes}</div>` : ""}
            </div>
        </div>

        <!-- Items -->
        <div class="section">
            <div class="section-title">Detalle del pedido</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th style="width: 60px;">Cant.</th>
                        <th style="width: 100px;">Precio</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items
                        .map(
                            (item) => `
                    <tr>
                        <td class="item-name">${item.name}</td>
                        <td class="item-qty">${item.quantity}</td>
                        <td class="item-price">${formatPrice((item.price || 0) * item.quantity)}</td>
                    </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        </div>

        <!-- Summary -->
        <div class="summary">
            <div class="summary-row">
                <span class="summary-label">Subtotal</span>
                <span class="summary-value">${formatPrice(order.subtotal || 0)}</span>
            </div>
            ${
                order.deliveryFee > 0
                    ? `
            <div class="summary-row">
                <span class="summary-label">Envío</span>
                <span class="summary-value">${formatPrice(order.deliveryFee)}</span>
            </div>
            `
                    : `
            <div class="summary-row">
                <span class="summary-label">Envío</span>
                <span class="summary-value">Gratis</span>
            </div>
            `
            }
            ${
                order.discount > 0
                    ? `
            <div class="summary-row">
                <span class="summary-label">Descuento</span>
                <span class="summary-value" style="color: #d9534f;">-${formatPrice(order.discount)}</span>
            </div>
            `
                    : ""
            }
            <div class="total-row">
                <span class="total-label">Total</span>
                <span class="total-value">${formatPrice(order.total)}</span>
            </div>
        </div>

        <!-- Payment Method -->
        <div class="section">
            <div class="section-title">Método de pago</div>
            <div class="info-row">
                <span class="info-label">Forma de pago</span>
                <span class="info-value">
                    ${
                        order.paymentMethod === "CASH" || order.paymentMethod === "cash"
                            ? "Efectivo"
                            : order.paymentMethod === "CARD" || order.paymentMethod === "card"
                              ? "Tarjeta"
                              : order.paymentMethod === "mercadopago" || order.paymentMethod === "MERCADOPAGO"
                                ? "MercadoPago"
                                : order.paymentMethod || "No especificado"
                    }
                </span>
            </div>
            <div class="info-row">
                <span class="info-label">Estado del pago</span>
                <span class="info-value">
                    ${order.paymentStatus === "PAID" || order.paymentStatus === "paid" ? "Pagado" : order.paymentStatus === "PENDING" ? "Pendiente" : order.paymentStatus || "Desconocido"}
                </span>
            </div>
        </div>

        <!-- Disclaimer -->
        <div class="disclaimer">
            ⚠️ Este comprobante no es válido como factura. Para facturación, consulte con el comercio.
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Comprobante generado por MOOVY</p>
            <p style="margin-top: 8px;">somosmoovy.com</p>
        </div>
    </div>
</body>
</html>
        `;

        return new NextResponse(html, {
            status: 200,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        });
    } catch (error) {
        console.error("Error generating receipt:", error);
        return NextResponse.json(
            { error: "Error al generar el comprobante" },
            { status: 500 }
        );
    }
}
