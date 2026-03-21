import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

// ─── Transporter centralizado ───────────────────────────────────────────────
export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const baseUrl = process.env.NEXTAUTH_URL || "https://www.somosmoovy.com";
export const companyLogo = `${baseUrl}/logo-moovy.svg`;
export const fromEmail = `"MOOVY" <${process.env.SMTP_USER || "somosmoovy@gmail.com"}>`;
export const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || "somosmoovy@gmail.com";

// ownerEmail legacy (fallback estático). Usar getAlertEmails() en su lugar.
export const ownerEmail = adminEmail;

// ─── Config dinámica de emails desde MoovyConfig ────────────────────────────

/** Caché en memoria (5 min TTL) para no consultar DB en cada email */
let _alertEmailsCache: { emails: string[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Lee los emails de destino para alertas del owner desde MoovyConfig.
 * Keys en DB:
 *   - `alert_emails` → comma-separated list (ej: "mauro@me.com,ops@moovy.com")
 * Fallback: adminEmail
 */
export async function getAlertEmails(): Promise<string[]> {
    // Check cache
    if (_alertEmailsCache && Date.now() - _alertEmailsCache.fetchedAt < CACHE_TTL) {
        return _alertEmailsCache.emails;
    }

    try {
        const config = await prisma.moovyConfig.findUnique({
            where: { key: "alert_emails" },
        });

        if (config?.value) {
            const emails = config.value
                .split(",")
                .map((e: string) => e.trim())
                .filter((e: string) => e.length > 0 && e.includes("@"));

            if (emails.length > 0) {
                _alertEmailsCache = { emails, fetchedAt: Date.now() };
                return emails;
            }
        }
    } catch (error) {
        console.error("[Email] Error reading alert_emails config:", error);
    }

    // Fallback
    const fallback = [adminEmail];
    _alertEmailsCache = { emails: fallback, fetchedAt: Date.now() };
    return fallback;
}

/** Invalida el caché (útil si se actualiza desde OPS) */
export function invalidateAlertEmailsCache() {
    _alertEmailsCache = null;
}

// ─── Layout base reutilizable ───────────────────────────────────────────────
export function emailLayout(content: string, options?: { footerExtra?: string }): string {
    const year = new Date().getFullYear();
    return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <img src="${companyLogo}" alt="MOOVY" style="height: 50px; width: auto;" />
    </div>
    <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px;">
        ${content}
    </div>
    <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${year} MOOVY&trade;. Ushuaia, Tierra del Fuego.</p>
        <p>Este es un correo autom&aacute;tico, por favor no lo respondas.</p>
        ${options?.footerExtra || ''}
    </div>
</div>
</body>
</html>`;
}

// ─── Helpers de estilo ──────────────────────────────────────────────────────
export function emailButton(text: string, href: string, color: 'red' | 'green' | 'blue' | 'purple' = 'red'): string {
    const gradients: Record<string, string> = {
        red: 'linear-gradient(to right, #e60012, #ff4d5e)',
        green: 'linear-gradient(to right, #059669, #10b981)',
        blue: 'linear-gradient(to right, #2563eb, #3b82f6)',
        purple: 'linear-gradient(to right, #7C3AED, #8B5CF6)',
    };
    return `
    <div style="text-align: center; margin: 30px 0;">
        <a href="${href}"
           style="display: inline-block; background: ${gradients[color]}; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
            ${text}
        </a>
    </div>`;
}

export function emailBadge(text: string, bgColor: string, textColor: string): string {
    return `<div style="background-color: ${bgColor}; color: ${textColor}; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: 600; margin-bottom: 10px;">${text}</div>`;
}

export function emailInfoBox(content: string): string {
    return `<div style="background-color: white; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #edf2f7;">${content}</div>`;
}

export function emailAlertBox(content: string, type: 'warning' | 'error' | 'success' | 'info' = 'info'): string {
    const styles: Record<string, { bg: string; border: string; text: string }> = {
        warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
        error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
        success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
        info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    };
    const s = styles[type];
    return `<div style="background: ${s.bg}; border-left: 4px solid ${s.border}; border-radius: 10px; padding: 20px; margin: 20px 0; color: ${s.text};">${content}</div>`;
}

// ─── Helper de envío con logging ────────────────────────────────────────────
export async function sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    tag?: string;
}): Promise<boolean> {
    try {
        await transporter.sendMail({
            from: fromEmail,
            to: params.to,
            subject: params.subject,
            html: params.html,
        });
        console.log(`[Email][${params.tag || 'generic'}] Sent to: ${params.to.substring(0, 3)}***`);
        return true;
    } catch (error) {
        console.error(`[Email][${params.tag || 'generic'}] Error:`, error);
        return false;
    }
}

// ─── Emails existentes (refactorizados) ─────────────────────────────────────

/**
 * #1 — Bienvenida comprador (P0, ya existía)
 */
export async function sendWelcomeEmail(email: string, firstName: string, referralCode: string) {
    const html = emailLayout(`
        <h2 style="color: #111827; margin-top: 0;">&iexcl;Hola ${firstName}! &#x1f44b;</h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            &iexcl;Bienvenido a la comunidad MOOVY! Ya pod&eacute;s empezar a disfrutar de todos los beneficios.
        </p>

        <div style="background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%); border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #b45309; margin: 0 0 10px 0; font-size: 16px;">&#x2b50; Tu c&oacute;digo de referido</h3>
            <p style="color: #78350f; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">${referralCode}</p>
            <p style="color: #92400e; font-size: 12px; margin: 8px 0 0 0;">Compart&iacute;lo y gana puntos MOOVER cuando tus amigos compren</p>
        </div>

        <h3 style="color: #111827; font-size: 16px; margin-top: 25px;">&iquest;Qu&eacute; pod&eacute;s hacer con MOOVY?</h3>
        <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; padding-left: 20px;">
            <li>&#x1f6cd;&#xfe0f; <strong>Comprar</strong> en comercios locales</li>
            <li>&#x1f680; <strong>Recibir</strong> tus pedidos en minutos</li>
            <li>&#x2b50; <strong>Sumar puntos MOOVER</strong> con cada compra</li>
            <li>&#x1f381; <strong>Canjear</strong> tus puntos por descuentos exclusivos</li>
            <li>&#x1f465; <strong>Referir amigos</strong> y ganar m&aacute;s puntos</li>
        </ul>

        ${emailButton('Empezar a comprar', `${baseUrl}/tienda`)}
    `);

    return sendEmail({ to: email, subject: '¡Bienvenido a MOOVY! 🎉', html, tag: 'welcome' });
}

/**
 * #32 — Confirmación de pedido (P0, ya existía)
 */
export async function sendOrderConfirmationEmail(orderData: {
    email: string;
    customerName: string;
    orderNumber: string;
    items: any[];
    total: number;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    paymentMethod: string;
    address: string;
    isPickup: boolean;
}) {
    const itemsHtml = orderData.items.map(item => `
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #4a5568;">
                ${item.name} ${item.variantName ? `<br><small style="color: #a0aec0;">${item.variantName}</small>` : ''}
                <div style="font-size: 12px; color: #a0aec0;">x${item.quantity}</div>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; text-align: right; color: #2d3748; font-weight: 500;">
                $${(item.price * item.quantity).toLocaleString('es-AR')}
            </td>
        </tr>
    `).join('');

    const paymentMethodLabel = orderData.paymentMethod === 'cash' ? 'Efectivo' :
        orderData.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia / Otros';

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 25px;">
            ${emailBadge('Pedido Confirmado', '#def7ec', '#03543f')}
            <h2 style="color: #111827; margin-top: 0;">&iexcl;Gracias por tu compra, ${orderData.customerName}!</h2>
            <p style="color: #6b7280; font-size: 16px;">Recibimos tu pedido <strong>#${orderData.orderNumber}</strong> y ya estamos trabajando en &eacute;l.</p>
        </div>

        ${emailInfoBox(`
            <h3 style="color: #1a202c; font-size: 16px; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #f7fafc; padding-bottom: 10px;">Resumen del Pedido</h3>
            <table style="width: 100%; border-collapse: collapse;">${itemsHtml}</table>
            <table style="width: 100%; margin-top: 15px;">
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Subtotal</td>
                    <td style="text-align: right; color: #2d3748; font-size: 14px; padding: 4px 0;">$${orderData.subtotal.toLocaleString('es-AR')}</td>
                </tr>
                ${orderData.deliveryFee > 0 ? `<tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Env&iacute;o</td><td style="text-align: right; color: #2d3748; font-size: 14px; padding: 4px 0;">$${orderData.deliveryFee.toLocaleString('es-AR')}</td></tr>` : ''}
                ${orderData.discount > 0 ? `<tr><td style="color: #e53e3e; font-size: 14px; padding: 4px 0;">Descuento (Puntos)</td><td style="text-align: right; color: #e53e3e; font-size: 14px; padding: 4px 0;">-$${orderData.discount.toLocaleString('es-AR')}</td></tr>` : ''}
                <tr>
                    <td style="color: #1a202c; font-weight: bold; font-size: 18px; padding: 15px 0 0 0;">Total</td>
                    <td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px; padding: 15px 0 0 0;">$${orderData.total.toLocaleString('es-AR')}</td>
                </tr>
            </table>
        `)}

        ${emailInfoBox(`
            <h4 style="color: #718096; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; margin: 0 0 10px 0;">M&eacute;todo de Pago</h4>
            <p style="color: #2d3748; font-weight: 500; margin: 0;">${paymentMethodLabel}</p>
        `)}
        ${emailInfoBox(`
            <h4 style="color: #718096; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; margin: 0 0 10px 0;">${orderData.isPickup ? 'Retiro en Local' : 'Direcci&oacute;n de Env&iacute;o'}</h4>
            <p style="color: #2d3748; font-weight: 500; margin: 0;">${orderData.isPickup ? 'Retir&aacute;s tu pedido por el comercio' : orderData.address}</p>
        `)}

        ${emailButton('Ver estado de mi pedido', `${baseUrl}/mis-pedidos`)}

        <p style="color: #a0aec0; font-size: 14px; text-align: center; margin-top: 20px;">
            Si ten&eacute;s alguna duda con tu pedido, escribinos por WhatsApp al soporte.
        </p>
    `);

    return sendEmail({
        to: orderData.email,
        subject: `¡Confirmación de tu pedido ${orderData.orderNumber}! 🛍️`,
        html,
        tag: 'order_confirmation',
    });
}

/**
 * #20 — Reset de contraseña (P0, ya existía)
 */
export async function sendPasswordResetEmail(email: string, resetLink: string) {
    const html = emailLayout(`
        <h2 style="color: #111827; margin-top: 0;">Restablecer contrase&ntilde;a</h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Recibimos una solicitud para restablecer tu contrase&ntilde;a.
            Hac&eacute; click en el bot&oacute;n de abajo para crear una nueva contrase&ntilde;a.
        </p>
        ${emailButton('Restablecer Contraseña', resetLink)}
        <p style="color: #9ca3af; font-size: 14px;">
            Este enlace expirar&aacute; en 1 hora. Si no solicitaste restablecer tu contrase&ntilde;a,
            pod&eacute;s ignorar este correo.
        </p>
    `);

    return sendEmail({ to: email, subject: 'Restablecer contraseña - MOOVY', html, tag: 'password_reset' });
}

/**
 * Notificación al admin — nueva solicitud de repartidor (existía)
 */
export async function sendDriverRequestNotification(
    driverName: string | null,
    driverEmail: string | null
) {
    const html = emailLayout(`
        <h2 style="color: #111827; margin-top: 0;">Nueva solicitud de repartidor</h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Un usuario quiere ser repartidor en MOOVY:
        </p>
        ${emailInfoBox(`
            <p style="margin: 5px 0; color: #4a5568;"><strong>Nombre:</strong> ${driverName || "No especificado"}</p>
            <p style="margin: 5px 0; color: #4a5568;"><strong>Email:</strong> ${driverEmail || "No especificado"}</p>
        `)}
        <p style="color: #6b7280; font-size: 14px;">
            Revis&aacute; la solicitud desde el panel de administraci&oacute;n en <strong>Operaciones &rarr; Repartidores</strong>.
        </p>
        ${emailButton('Ir al panel OPS', `${baseUrl}/ops/repartidores`, 'blue')}
    `);

    return sendEmail({ to: adminEmail, subject: '🚗 Nueva solicitud de repartidor', html, tag: 'driver_request_admin' });
}

/**
 * #17 — Repartidor aprobado (P0, ya existía — FIX: /rider → /repartidor)
 */
export async function sendDriverApprovalEmail(email: string, firstName: string) {
    const html = emailLayout(`
        <h2 style="color: #111827; margin-top: 0;">&iexcl;Bienvenido al equipo, ${firstName}! &#x1f697;</h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Tu solicitud para ser repartidor MOOVY fue <strong style="color: #059669;">aprobada</strong>.
            Ya pod&eacute;s empezar a recibir pedidos y generar ingresos.
        </p>
        ${emailButton('Ir al panel de repartidor', `${baseUrl}/repartidor`, 'green')}
        <p style="color: #9ca3af; font-size: 14px; text-align: center;">
            Si ten&eacute;s dudas, escribinos por WhatsApp al soporte.
        </p>
    `);

    return sendEmail({ to: email, subject: '🎉 ¡Tu solicitud de repartidor fue aprobada!', html, tag: 'driver_approved' });
}
