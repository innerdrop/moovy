// MercadoPago SDK Singleton + Helpers
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const globalForMp = global as unknown as { mpClient: MercadoPagoConfig };

export const mpClient =
    globalForMp.mpClient ||
    new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

if (process.env.NODE_ENV !== "production") globalForMp.mpClient = mpClient;

export const preferenceApi = new Preference(mpClient);
export const paymentApi = new Payment(mpClient);

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderForPreference {
    id: string;
    orderNumber: string;
    total: number;
    deliveryFee: number;
    items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
    subOrders: Array<{
        moovyCommission: number | null;
    }>;
    user: {
        name: string | null;
        email: string | null;
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function buildPreferenceBody(order: OrderForPreference, baseUrl: string) {
    const items = order.items.map((item) => ({
        id: item.id,
        title: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: "ARS",
    }));

    // Add delivery fee as a separate item if > 0
    if (order.deliveryFee > 0) {
        items.push({
            id: `delivery-${order.id}`,
            title: "Envío a domicilio",
            quantity: 1,
            unit_price: order.deliveryFee,
            currency_id: "ARS",
        });
    }

    // Moovy's total commission across all SubOrders
    const marketplaceFee = order.subOrders.reduce(
        (sum, sub) => sum + (sub.moovyCommission || 0),
        0
    );

    const returnUrl = `${baseUrl}/checkout/mp-return?orderId=${order.id}`;

    return {
        items,
        marketplace_fee: marketplaceFee,
        back_urls: {
            success: returnUrl,
            failure: returnUrl,
            pending: returnUrl,
        },
        auto_return: "approved" as const,
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        external_reference: order.id,
        metadata: {
            order_id: order.id,
            order_number: order.orderNumber,
        },
        payer: {
            name: order.user.name || undefined,
            email: order.user.email || undefined,
        },
    };
}
