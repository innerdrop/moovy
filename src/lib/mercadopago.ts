// MercadoPago SDK Singleton + Helpers
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import crypto from "crypto";

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

export function buildPreferenceBody(
    order: OrderForPreference,
    baseUrl: string,
    marketplaceFee = 0
) {
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

    const returnUrl = `${baseUrl}/checkout/mp-return?orderId=${order.id}`;

    return {
        items,
        // Only include marketplace_fee for split payments (vendor's token)
        ...(marketplaceFee > 0 ? { marketplace_fee: marketplaceFee } : {}),
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

// ─── Webhook HMAC Verification ───────────────────────────────────────────────

/**
 * Verify MercadoPago webhook signature.
 * MP sends x-signature header with format: "ts=TIMESTAMP,v1=HASH"
 * Template: "id:{dataId};request-id:{xRequestId};ts:{ts};"
 */
export function verifyWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string
): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) return false;

    // Parse ts and v1 from x-signature
    const parts: Record<string, string> = {};
    for (const part of xSignature.split(",")) {
        const [key, ...rest] = part.split("=");
        parts[key.trim()] = rest.join("=").trim();
    }

    const ts = parts["ts"];
    const v1 = parts["v1"];
    if (!ts || !v1) return false;

    // Build template and compute HMAC
    const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const hmac = crypto
        .createHmac("sha256", secret)
        .update(template)
        .digest("hex");

    // Timing-safe comparison
    try {
        return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(hmac));
    } catch {
        return false;
    }
}

// ─── OAuth Helpers ───────────────────────────────────────────────────────────

const MP_OAUTH_BASE = "https://auth.mercadopago.com";
const MP_API_BASE = "https://api.mercadopago.com";

/**
 * Build the OAuth authorization URL for vendor linking.
 */
export function getOAuthAuthorizeUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
        client_id: process.env.MP_APP_ID!,
        response_type: "code",
        platform_id: "mp",
        state,
        redirect_uri: redirectUri,
    });
    return `${MP_OAUTH_BASE}/authorization?${params.toString()}`;
}

/**
 * Sign an OAuth state string with HMAC to prevent CSRF.
 */
export function signOAuthState(payload: Record<string, string>): string {
    const data = JSON.stringify(payload);
    const base64 = Buffer.from(data).toString("base64url");
    const sig = crypto
        .createHmac("sha256", process.env.MP_ACCESS_TOKEN!)
        .update(base64)
        .digest("hex")
        .slice(0, 16);
    return `${base64}.${sig}`;
}

/**
 * Verify and decode a signed OAuth state.
 */
export function verifyOAuthState(state: string): Record<string, string> | null {
    const [base64, sig] = state.split(".");
    if (!base64 || !sig) return null;

    const expectedSig = crypto
        .createHmac("sha256", process.env.MP_ACCESS_TOKEN!)
        .update(base64)
        .digest("hex")
        .slice(0, 16);

    if (sig !== expectedSig) return null;

    try {
        return JSON.parse(Buffer.from(base64, "base64url").toString());
    } catch {
        return null;
    }
}

interface OAuthTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    user_id: number;
    refresh_token: string;
    public_key: string;
    live_mode: boolean;
}

/**
 * Exchange an authorization code for vendor tokens.
 */
export async function exchangeOAuthCode(
    code: string,
    redirectUri: string
): Promise<OAuthTokenResponse> {
    const res = await fetch(`${MP_API_BASE}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: process.env.MP_APP_ID,
            client_secret: process.env.MP_ACCESS_TOKEN,
            code,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`MP OAuth token exchange failed: ${res.status} ${err}`);
    }

    return res.json();
}

/**
 * Refresh a vendor's access token using their refresh token.
 */
export async function refreshOAuthToken(
    refreshToken: string
): Promise<OAuthTokenResponse> {
    const res = await fetch(`${MP_API_BASE}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: process.env.MP_APP_ID,
            client_secret: process.env.MP_ACCESS_TOKEN,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`MP OAuth token refresh failed: ${res.status} ${err}`);
    }

    return res.json();
}

/**
 * Create a Preference using a vendor's access token (for split payments).
 * Payment goes to the vendor's account, marketplace_fee goes to Moovy.
 */
export async function createVendorPreference(
    vendorAccessToken: string,
    body: ReturnType<typeof buildPreferenceBody>
) {
    const vendorConfig = new MercadoPagoConfig({ accessToken: vendorAccessToken });
    const vendorPref = new Preference(vendorConfig);
    return vendorPref.create({ body });
}
