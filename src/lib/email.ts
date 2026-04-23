import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { emailLogger } from "@/lib/logger";

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

export const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://somosmoovy.com";
export const companyLogo = `${baseUrl}/logo-moovy.svg`;
export const fromEmail = `"MOOVY" <${process.env.SMTP_USER || "somosmoovy@gmail.com"}>`;
export const adminEmail = process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || process.env.SMTP_USER || "somosmoovy@gmail.com";

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
        emailLogger.error({ error }, "Error reading alert_emails config");
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
export function emailLayout(content: string, options?: { footerExtra?: string; accentColor?: string }): string {
    const year = new Date().getFullYear();
    const accent = options?.accentColor || '#e60012';
    return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MOOVY</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">
<tr><td align="center" style="padding: 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">

    <!-- Header -->
    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">
        <img src="${companyLogo}" alt="MOOVY" style="height: 32px; width: auto;" />
    </td></tr>

    <!-- Accent line -->
    <tr><td style="padding: 0 40px;">
        <div style="height: 3px; background: ${accent}; border-radius: 2px;"></div>
    </td></tr>

    <!-- Content -->
    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
        ${content}
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding: 0 40px;">
        <div style="height: 1px; background: #f0f0f0;"></div>
    </td></tr>
    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; ${year} MOOVY. Ushuaia, Tierra del Fuego.</p>
        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>
        ${options?.footerExtra || ''}
    </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Helpers de estilo ──────────────────────────────────────────────────────
export function emailButton(text: string, href: string, color: 'red' | 'green' | 'blue' | 'purple' = 'red'): string {
    const colors: Record<string, string> = {
        red: '#e60012',
        green: '#059669',
        blue: '#1a1a1a',
        purple: '#7C3AED',
    };
    const bg = colors[color] || colors.red;
    return `
    <div style="text-align: center; margin: 32px 0;">
        <a href="${href}"
           style="display: inline-block; background-color: ${bg}; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">
            ${text}
        </a>
    </div>`;
}

export function emailBadge(text: string, bgColor: string, textColor: string): string {
    return `<div style="display: inline-block; background-color: ${bgColor}; color: ${textColor}; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">${text}</div>`;
}

export function emailInfoBox(content: string): string {
    return `<div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">${content}</div>`;
}

export function emailAlertBox(content: string, type: 'warning' | 'error' | 'success' | 'info' = 'info'): string {
    const styles: Record<string, { bg: string; border: string; text: string }> = {
        warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
        error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
        success: { bg: '#f0fdf4', border: '#059669', text: '#166534' },
        info: { bg: '#f5f5f5', border: '#1a1a1a', text: '#1a1a1a' },
    };
    const s = styles[type];
    return `<div style="background: ${s.bg}; border-left: 3px solid ${s.border}; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: ${s.text}; font-size: 14px; line-height: 1.6;">${content}</div>`;
}

/** Separador visual sutil */
export function emailDivider(): string {
    return `<div style="height: 1px; background: #f0f0f0; margin: 28px 0;"></div>`;
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
        emailLogger.info({ tag: params.tag, recipient: `${params.to.substring(0, 3)}***` }, "Email sent");
        return true;
    } catch (error) {
        emailLogger.error({ tag: params.tag, error }, "Email send error");
        return false;
    }
}

// ─── Emails existentes (refactorizados) ─────────────────────────────────────

/**
 * #1 — Bienvenida comprador (P0, ya existía)
 */
export async function sendWelcomeEmail(email: string, firstName: string, referralCode: string) {
    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Bienvenido, ${firstName}</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            Tu cuenta en MOOVY est&aacute; activa. Ya pod&eacute;s explorar los comercios de Ushuaia
            y recibir tus pedidos donde est&eacute;s.
        </p>

        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 8px 0;">
            Cada compra suma puntos MOOVER que pod&eacute;s canjear por descuentos.
            Tambi&eacute;n pod&eacute;s invitar amigos con tu c&oacute;digo personal y ganar puntos extra cuando hagan su primer pedido.
        </p>

        ${emailDivider()}

        <div style="text-align: center; margin: 0 0 8px 0;">
            <p style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px 0; font-weight: 600;">Tu c&oacute;digo de referido</p>
            <p style="color: #e60012; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 3px; font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;">${referralCode}</p>
        </div>

        ${emailDivider()}

        ${emailButton('Explorar la tienda', `${baseUrl}/tienda`)}
    `);

    return sendEmail({ to: email, subject: 'Bienvenido a MOOVY', html, tag: 'welcome' });
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
            <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #333; font-size: 14px;">
                ${item.name}${item.variantName ? ` <span style="color: #999;">&middot; ${item.variantName}</span>` : ''}
                <span style="color: #999;"> &times; ${item.quantity}</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #1a1a1a; font-size: 14px; font-weight: 500; white-space: nowrap;">
                $${(item.price * item.quantity).toLocaleString('es-AR')}
            </td>
        </tr>
    `).join('');

    const paymentMethodLabel = orderData.paymentMethod === 'cash' ? 'Efectivo' :
        orderData.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia / Otros';

    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 22px; font-weight: 600;">Pedido confirmado</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
            Gracias, ${orderData.customerName}. Recibimos tu pedido <strong>#${orderData.orderNumber}</strong> y ya estamos trabajando en &eacute;l.
        </p>

        <!-- Items -->
        <table style="width: 100%; border-collapse: collapse; margin: 0 0 16px 0;">${itemsHtml}</table>

        <!-- Totals -->
        <table style="width: 100%; margin: 0 0 8px 0;">
            <tr>
                <td style="color: #777; font-size: 14px; padding: 4px 0;">Subtotal</td>
                <td style="text-align: right; color: #1a1a1a; font-size: 14px; padding: 4px 0;">$${orderData.subtotal.toLocaleString('es-AR')}</td>
            </tr>
            ${orderData.deliveryFee > 0 ? `<tr><td style="color: #777; font-size: 14px; padding: 4px 0;">${orderData.isPickup ? 'Retiro en local' : 'Env&iacute;o'}</td><td style="text-align: right; color: #1a1a1a; font-size: 14px; padding: 4px 0;">$${orderData.deliveryFee.toLocaleString('es-AR')}</td></tr>` : ''}
            ${orderData.discount > 0 ? `<tr><td style="color: #e60012; font-size: 14px; padding: 4px 0;">Descuento (puntos)</td><td style="text-align: right; color: #e60012; font-size: 14px; padding: 4px 0;">&minus;$${orderData.discount.toLocaleString('es-AR')}</td></tr>` : ''}
        </table>
        <div style="height: 1px; background: #e5e5e5; margin: 8px 0;"></div>
        <table style="width: 100%; margin: 0 0 28px 0;">
            <tr>
                <td style="color: #1a1a1a; font-weight: 600; font-size: 16px; padding: 8px 0 0 0;">Total</td>
                <td style="text-align: right; color: #1a1a1a; font-weight: 600; font-size: 16px; padding: 8px 0 0 0;">$${orderData.total.toLocaleString('es-AR')}</td>
            </tr>
        </table>

        ${emailDivider()}

        <!-- Details -->
        <table style="width: 100%; margin: 0 0 28px 0;">
            <tr>
                <td style="color: #999; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; padding: 0 0 6px 0; font-weight: 600;">Pago</td>
                <td style="color: #999; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; padding: 0 0 6px 0; font-weight: 600; text-align: right;">${orderData.isPickup ? 'Retiro' : 'Entrega'}</td>
            </tr>
            <tr>
                <td style="color: #1a1a1a; font-size: 14px; padding: 0; vertical-align: top;">${paymentMethodLabel}</td>
                <td style="color: #1a1a1a; font-size: 14px; padding: 0; text-align: right; vertical-align: top; max-width: 200px;">${orderData.isPickup ? 'Retir&aacute;s por el comercio' : orderData.address}</td>
            </tr>
        </table>

        ${emailButton('Ver estado del pedido', `${baseUrl}/mis-pedidos`)}
    `);

    return sendEmail({
        to: orderData.email,
        subject: `Pedido #${orderData.orderNumber} confirmado`,
        html,
        tag: 'order_confirmation',
    });
}

/**
 * #20 — Reset de contraseña (P0, ya existía)
 */
export async function sendPasswordResetEmail(email: string, resetLink: string) {
    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Restablecer contrase&ntilde;a</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            Recibimos una solicitud para restablecer tu contrase&ntilde;a. Us&aacute; el bot&oacute;n de abajo para crear una nueva. El enlace es v&aacute;lido por 1 hora.
        </p>
        ${emailButton('Crear nueva contrase\u00f1a', resetLink)}
        <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
            Si no solicitaste este cambio, pod&eacute;s ignorar este correo. Tu contrase&ntilde;a actual no se ver&aacute; afectada.
        </p>
    `);

    return sendEmail({ to: email, subject: 'Restablecer contrase\u00f1a \u2014 MOOVY', html, tag: 'password_reset' });
}

/**
 * Notificación al admin — nueva solicitud de repartidor (existía)
 */
export async function sendDriverRequestNotification(
    driverName: string | null,
    driverEmail: string | null
) {
    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Nueva solicitud de repartidor</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            Un usuario quiere sumarse como repartidor en MOOVY.
        </p>
        ${emailInfoBox(`
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Nombre:</strong> ${driverName || "No especificado"}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Email:</strong> ${driverEmail || "No especificado"}</p>
        `)}
        <p style="color: #555; font-size: 14px; margin: 20px 0 0 0;">
            Revis&aacute; la documentaci&oacute;n desde Operaciones &rarr; Repartidores.
        </p>
        ${emailButton('Revisar solicitud', `${baseUrl}/ops/repartidores`, 'blue')}
    `);

    return sendEmail({ to: adminEmail, subject: 'Nueva solicitud de repartidor \u2014 MOOVY', html, tag: 'driver_request_admin' });
}

/**
 * #17 — Repartidor aprobado (P0, ya existía — FIX: /rider → /repartidor)
 */
export async function sendDriverApprovalEmail(email: string, firstName: string) {
    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Solicitud aprobada</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            ${firstName}, tu solicitud para ser repartidor MOOVY fue aprobada. Ya pod&eacute;s conectarte desde tu panel y empezar a recibir pedidos.
        </p>
        ${emailButton('Ir a mi panel', `${baseUrl}/repartidor`, 'green')}
    `);

    return sendEmail({ to: email, subject: 'Tu solicitud fue aprobada \u2014 MOOVY', html, tag: 'driver_approved' });
}

/**
 * Notificación al admin — nueva solicitud de comercio
 */
export async function sendMerchantRequestNotification(
    businessName: string,
    ownerName: string | null,
    ownerEmail: string | null,
    category: string | null
) {
    const alertEmails = await getAlertEmails();
    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Nueva solicitud de comercio</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            Un nuevo comercio quiere sumarse a MOOVY.
        </p>
        ${emailInfoBox(`
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Comercio:</strong> ${businessName}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Due&ntilde;o:</strong> ${ownerName || "No especificado"}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Email:</strong> ${ownerEmail || "No especificado"}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Categor&iacute;a:</strong> ${category || "No especificada"}</p>
        `)}
        <p style="color: #555; font-size: 14px; margin: 20px 0 0 0;">
            Revis&aacute; la documentaci&oacute;n y aprob&aacute; o rechaz&aacute; desde el panel de operaciones.
        </p>
        ${emailButton('Revisar solicitud', `${baseUrl}/ops/comercios`, 'blue')}
    `);

    const results = await Promise.all(
        alertEmails.map(email =>
            sendEmail({ to: email, subject: `Nueva solicitud de comercio: ${businessName} \u2014 MOOVY`, html, tag: 'merchant_request_admin' })
        )
    );
    return results.some(r => r);
}

/**
 * Comercio aprobado — email al merchant
 */
export async function sendMerchantApprovalEmail(email: string, businessName: string) {
    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu comercio fue aprobado</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            <strong>${businessName}</strong> ya est&aacute; activo en MOOVY. Pod&eacute;s configurar tus horarios de atenci&oacute;n, subir tus productos con fotos y precios, y empezar a recibir pedidos.
        </p>
        ${emailButton('Ir a mi panel', `${baseUrl}/comercios`, 'green')}
    `);

    return sendEmail({ to: email, subject: `Tu comercio ${businessName} fue aprobado \u2014 MOOVY`, html, tag: 'merchant_approved' });
}

/**
 * Comercio rechazado — email al merchant
 */
export async function sendMerchantRejectionEmail(email: string, businessName: string, reason?: string) {
    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Solicitud no aprobada</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            La solicitud de <strong>${businessName}</strong> no pudo ser aprobada en esta oportunidad.
        </p>
        ${reason ? emailAlertBox(`<strong>Motivo:</strong> ${reason}`, 'warning') : ''}
        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 20px 0 0 0;">
            Pod&eacute;s corregir los datos indicados y volver a registrarte, o contactarnos si ten&eacute;s preguntas.
        </p>
        ${emailButton('Contactar soporte', `https://wa.me/5492901553173`, 'blue')}
    `);

    return sendEmail({ to: email, subject: `Solicitud de comercio ${businessName} \u2014 MOOVY`, html, tag: 'merchant_rejected' });
}

/**
 * Repartidor rechazado — email al driver
 */
export async function sendDriverRejectionEmail(email: string, firstName: string, reason?: string) {
    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Solicitud no aprobada</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            ${firstName}, tu solicitud para ser repartidor en MOOVY no pudo ser aprobada en esta oportunidad.
        </p>
        ${reason ? emailAlertBox(`<strong>Motivo:</strong> ${reason}`, 'warning') : ''}
        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 20px 0 0 0;">
            Pod&eacute;s corregir la documentaci&oacute;n indicada y volver a postularte, o contactarnos si ten&eacute;s preguntas.
        </p>
        ${emailButton('Contactar soporte', `https://wa.me/5492901553173`, 'blue')}
    `);

    return sendEmail({ to: email, subject: 'Solicitud de repartidor \u2014 MOOVY', html, tag: 'driver_rejected' });
}

// ─── Fix/onboarding-comercio-completo ────────────────────────────────────────
// Emails asociados a aprobación granular por documento + solicitudes de cambio.

/**
 * Documento específico APROBADO por OPS. Si además esto gatilló la activación
 * del comercio, `merchantActivated=true` agrega mensaje especial.
 */
export async function sendMerchantDocumentApprovedEmail(
    email: string,
    businessName: string,
    documentLabel: string,
    merchantActivated: boolean
) {
    const headline = merchantActivated
        ? `<strong>${businessName}</strong> ya est&aacute; activo en MOOVY. Tu <strong>${documentLabel}</strong> fue el &uacute;ltimo documento aprobado.`
        : `Aprobamos tu <strong>${documentLabel}</strong> en MOOVY. A medida que vayamos revisando el resto de la documentaci&oacute;n te vamos a ir avisando.`;
    const subject = merchantActivated
        ? `Tu comercio ${businessName} fue activado \u2014 MOOVY`
        : `Documento aprobado: ${documentLabel} \u2014 MOOVY`;
    const ctaUrl = merchantActivated ? `${baseUrl}/comercios` : `${baseUrl}/comercios/mi-comercio`;
    const ctaLabel = merchantActivated ? 'Entrar al panel' : 'Ver estado de mi comercio';
    const ctaColor = merchantActivated ? 'green' : 'blue';

    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Documento aprobado</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
            ${headline}
        </p>
        ${merchantActivated ? emailAlertBox('Los clientes ya pueden encontrarte en MOOVY. Revis&aacute; que tu horario de atenci&oacute;n y productos est&eacute;n al d&iacute;a.', 'success') : ''}
        ${emailButton(ctaLabel, ctaUrl, ctaColor)}
    `);

    return sendEmail({ to: email, subject, html, tag: 'merchant_doc_approved' });
}

/**
 * Documento específico RECHAZADO por OPS. Incluye el motivo para que el merchant
 * pueda subir una corrección.
 */
export async function sendMerchantDocumentRejectedEmail(
    email: string,
    businessName: string,
    documentLabel: string,
    reason: string
) {
    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Documento rechazado</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
            Revisamos <strong>${documentLabel}</strong> de <strong>${businessName}</strong> y no pudimos aprobarlo.
        </p>
        ${emailAlertBox(`<strong>Motivo:</strong> ${reason}`, 'warning')}
        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 16px 0 0 0;">
            Entr&aacute; al panel, carg&aacute; un documento corregido y lo volvemos a revisar. No hace falta que hagas nada m&aacute;s.
        </p>
        ${emailButton('Subir nueva versi\u00f3n', `${baseUrl}/comercios/mi-comercio`, 'red')}
    `);

    return sendEmail({
        to: email,
        subject: `${documentLabel} rechazado \u2014 MOOVY`,
        html,
        tag: 'merchant_doc_rejected',
    });
}

/**
 * Notificación a OPS — un merchant pidió permiso para modificar un documento
 * aprobado. OPS tiene que decidir si autoriza el cambio (bajando el doc a
 * PENDING para que pueda subir uno nuevo).
 */
export async function sendAdminChangeRequestEmail(
    businessName: string,
    ownerEmail: string | null,
    documentLabel: string,
    reason: string,
    merchantId: string
) {
    const alertEmails = await getAlertEmails();
    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Solicitud de cambio de documento</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            Un comercio quiere modificar un documento ya aprobado.
        </p>
        ${emailInfoBox(`
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Comercio:</strong> ${businessName}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Email del due&ntilde;o:</strong> ${ownerEmail || "No especificado"}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Documento:</strong> ${documentLabel}</p>
        `)}
        ${emailAlertBox(`<strong>Motivo del comercio:</strong> ${reason}`, 'info')}
        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 16px 0 0 0;">
            Evalu&aacute; la solicitud desde el panel de operaciones. Si la aprob&aacute;s, el documento vuelve a pendiente y el merchant puede subir uno nuevo.
        </p>
        ${emailButton('Revisar solicitud', `${baseUrl}/ops/usuarios?merchant=${merchantId}`, 'blue')}
    `);

    const results = await Promise.all(
        alertEmails.map((to) =>
            sendEmail({
                to,
                subject: `Solicitud de cambio: ${documentLabel} \u2014 ${businessName}`,
                html,
                tag: 'merchant_change_request_admin',
            })
        )
    );
    return results.some((r) => r);
}

/**
 * Solicitud de cambio APROBADA — email al merchant autorizándolo a subir
 * un archivo nuevo. El doc en DB ya quedó PENDING, así que el botón lleva
 * directo al panel.
 */
export async function sendMerchantChangeRequestApprovedEmail(
    email: string,
    businessName: string,
    documentLabel: string,
    note: string | null
) {
    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Solicitud aprobada</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
            Autorizamos el cambio de <strong>${documentLabel}</strong> de <strong>${businessName}</strong>. Ya pod&eacute;s subir un documento nuevo desde el panel.
        </p>
        ${note ? emailAlertBox(`<strong>Comentario de OPS:</strong> ${note}`, 'info') : ''}
        ${emailButton('Subir nuevo documento', `${baseUrl}/comercios/mi-comercio`, 'green')}
    `);

    return sendEmail({
        to: email,
        subject: `Solicitud aprobada: ${documentLabel} \u2014 MOOVY`,
        html,
        tag: 'merchant_change_request_approved',
    });
}

/**
 * Solicitud de cambio RECHAZADA — OPS no autoriza la modificación. El doc
 * permanece APPROVED. Incluye el comentario para que el merchant entienda
 * por qué no se autoriza.
 */
export async function sendMerchantChangeRequestRejectedEmail(
    email: string,
    businessName: string,
    documentLabel: string,
    note: string
) {
    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Solicitud no autorizada</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
            Revisamos tu solicitud de cambio de <strong>${documentLabel}</strong> en <strong>${businessName}</strong> y no la pudimos autorizar.
        </p>
        ${emailAlertBox(`<strong>Motivo:</strong> ${note}`, 'warning')}
        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 16px 0 0 0;">
            Si necesit&aacute;s aclararlo, contactanos y lo resolvemos juntos.
        </p>
        ${emailButton('Contactar soporte', `https://wa.me/5492901553173`, 'blue')}
    `);

    return sendEmail({
        to: email,
        subject: `Solicitud no autorizada: ${documentLabel} \u2014 MOOVY`,
        html,
        tag: 'merchant_change_request_rejected',
    });
}
