/**
 * src/lib/email-admin-ops.ts
 *
 * 6 emails nuevos post-launch críticos para operación:
 *
 *   Avisos al admin/owner (P1):
 *     #1 sendAdminNewMerchantPendingEmail  → nuevo comercio pendiente de revisión
 *     #2 sendAdminNewDriverPendingEmail    → nuevo repartidor pendiente de revisión
 *     #3 sendAdminNewChangeRequestEmail    → genérico de change request (merchant o driver)
 *
 *   UX:
 *     #4 sendPointsExpiringEmail           → 5 meses sin pedir, puntos por vencer (P2)
 *     #5 sendDriverAutoActivatedEmail      → todos los docs aprobados, cuenta activa (P0)
 *     #6 sendReferralActivatedEmail        → referido completó primer pedido, referrer suma pts (P0)
 *
 * Los 3 primeros mandan a la lista `getAlertEmails()` (owner + admins configurados
 * en MoovyConfig.alert_emails). Los 3 de UX son directos al user afectado.
 *
 * Todas las funciones retornan `Promise<boolean>` (true si al menos un destinatario
 * recibió; false si fallaron todos). Son fire-and-forget desde los callers — nunca
 * bloquean el endpoint que las dispara.
 */

import {
    emailLayout,
    emailButton,
    emailBadge,
    emailInfoBox,
    emailAlertBox,
    baseUrl,
    sendEmail,
    getAlertEmails,
} from "@/lib/email";

// ─── #1 — Nuevo comercio pendiente (admin/owner) ─────────────────────────────

export async function sendAdminNewMerchantPendingEmail(data: {
    merchantName: string;
    ownerName: string;
    ownerEmail: string;
    merchantId: string;
}): Promise<boolean> {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('🏪 Nuevo comercio', '#eff6ff', '#1e40af')}
        </div>
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">
            Nuevo comercio pendiente de revisión
        </h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            Un comercio acaba de registrarse en MOOVY y necesita aprobación para empezar a operar.
            Revisá la documentación (CUIT, constancia AFIP, habilitación municipal) desde el panel.
        </p>
        ${emailInfoBox(`
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Comercio:</strong> ${data.merchantName}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Dueño:</strong> ${data.ownerName}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Email:</strong> ${data.ownerEmail}</p>
        `)}
        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 16px 0 0 0;">
            El comercio no puede recibir pedidos hasta ser aprobado. No dejes que se enfríe.
        </p>
        ${emailButton('Revisar en pipeline', `${baseUrl}/ops/pipeline-comercios`, 'blue')}
    `);

    const recipients = await getAlertEmails();
    const results = await Promise.all(
        recipients.map((to) =>
            sendEmail({
                to,
                subject: `📋 Nuevo comercio registrado — revisar en OPS`,
                html,
                tag: 'admin_new_merchant_pending',
            })
        )
    );
    return results.some(Boolean);
}

// ─── Nuevo ticket de soporte (admin/owner) — feat/soporte-bandeja-ops ────────

export async function sendAdminNewSupportTicketEmail(data: {
    origin: string;          // BUYER | MERCHANT | DRIVER
    userName: string;
    subject: string;
    message: string;
    chatId: string;
}): Promise<boolean> {
    const esc = (s: string) =>
        (s || "").replace(/[<>&]/g, (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;"));
    const originLabel =
        data.origin === "MERCHANT" ? "Comercio" :
        data.origin === "DRIVER" ? "Repartidor" : "Comprador";
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('💬 Nuevo ticket', '#fef2f2', '#b91c1c')}
        </div>
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">
            Nuevo ticket de soporte
        </h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            Entró una consulta nueva a soporte. Respondela desde la bandeja de OPS.
        </p>
        ${emailInfoBox(`
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Origen:</strong> ${originLabel}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>De:</strong> ${esc(data.userName)}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Asunto:</strong> ${esc(data.subject)}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Mensaje:</strong> ${esc(data.message)}</p>
        `)}
        ${emailButton('Responder en OPS', `${baseUrl}/ops/soporte`, 'blue')}
    `);

    const recipients = await getAlertEmails();
    const results = await Promise.all(
        recipients.map((to) =>
            sendEmail({
                to,
                subject: `💬 Nuevo ticket de soporte (${originLabel}) — responder en OPS`,
                html,
                tag: 'admin_new_support_ticket',
            })
        )
    );
    return results.some(Boolean);
}

// ─── #2 — Nuevo repartidor pendiente (admin/owner) ───────────────────────────

export async function sendAdminNewDriverPendingEmail(data: {
    driverName: string;
    driverEmail: string;
    driverPhone: string;
    vehicleType: string;
    driverId: string;
}): Promise<boolean> {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('🏍️ Nuevo repartidor', '#eff6ff', '#1e40af')}
        </div>
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">
            Nuevo repartidor pendiente de revisión
        </h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            Un repartidor se registró y necesita aprobación. Revisá DNI, licencia, seguro y RTO
            (si es motorizado) antes de activarlo.
        </p>
        ${emailInfoBox(`
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Nombre:</strong> ${data.driverName}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Vehículo:</strong> ${data.vehicleType}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Email:</strong> ${data.driverEmail}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Teléfono:</strong> ${data.driverPhone}</p>
        `)}
        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 16px 0 0 0;">
            Cada día sin aprobar es un repartidor que no está llevando pedidos. Con pocos drivers activos,
            el tiempo de asignación sube y los comprradores abandonan.
        </p>
        ${emailButton('Revisar solicitud', `${baseUrl}/ops/usuarios`, 'blue')}
    `);

    const recipients = await getAlertEmails();
    const results = await Promise.all(
        recipients.map((to) =>
            sendEmail({
                to,
                subject: `🏍️ Nuevo repartidor registrado — revisar en OPS`,
                html,
                tag: 'admin_new_driver_pending',
            })
        )
    );
    return results.some(Boolean);
}

// ─── #3 — Nueva solicitud de cambio (genérico merchant|driver) ───────────────

/**
 * Función genérica reutilizable. No reemplaza a las específicas existentes
 * (`sendAdminChangeRequestEmail` merchant, `sendAdminDriverChangeRequestEmail` driver)
 * porque esas ya están conectadas en los endpoints correspondientes. Esta queda
 * disponible como fallback o para flujos nuevos que quieran un único helper.
 */
export async function sendAdminNewChangeRequestEmail(data: {
    actorType: 'MERCHANT' | 'DRIVER';
    actorName: string;
    actorEmail: string;
    documentField: string;
    reason: string;
    entityId: string;
}): Promise<boolean> {
    const actorLabel = data.actorType === 'MERCHANT' ? 'comercio' : 'repartidor';
    const icon = data.actorType === 'MERCHANT' ? '🏪' : '🏍️';

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge(`${icon} Solicitud de cambio`, '#fffbeb', '#92400e')}
        </div>
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">
            Nueva solicitud de cambio de documento
        </h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            Un ${actorLabel} quiere modificar un documento ya aprobado. Evaluá la solicitud desde
            el panel de operaciones antes de desbloquear el campo para re-upload.
        </p>
        ${emailInfoBox(`
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>${data.actorType === 'MERCHANT' ? 'Comercio' : 'Repartidor'}:</strong> ${data.actorName}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Email:</strong> ${data.actorEmail}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Documento:</strong> ${data.documentField}</p>
        `)}
        ${emailAlertBox(`<strong>Motivo:</strong> ${data.reason}`, 'info')}
        ${emailButton('Revisar solicitud', `${baseUrl}/ops/usuarios`, 'blue')}
    `);

    const recipients = await getAlertEmails();
    const results = await Promise.all(
        recipients.map((to) =>
            sendEmail({
                to,
                subject: `${icon} Solicitud de cambio de ${data.documentField} — ${data.actorName}`,
                html,
                tag: 'admin_new_change_request',
            })
        )
    );
    return results.some(Boolean);
}

// ─── #4 — Puntos por vencer (UX, buyer) ──────────────────────────────────────

export async function sendPointsExpiringEmail(data: {
    email: string;
    firstName: string;
    pointsBalance: number;
    daysUntilExpiry: number;
    lastActivityDate: Date;
}): Promise<boolean> {
    const lastActivityFormatted = data.lastActivityDate.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const pointsFormatted = data.pointsBalance.toLocaleString('es-AR');
    const pesosValue = `$${data.pointsBalance.toLocaleString('es-AR')}`;

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('⏳ Puntos por vencer', '#fffbeb', '#92400e')}
        </div>
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">
            Hola ${data.firstName}, tus puntos MOOVER están por vencer
        </h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            Tu último pedido fue el <strong>${lastActivityFormatted}</strong>. Si no hacés un nuevo
            pedido en los próximos <strong>${data.daysUntilExpiry} días</strong>, tus puntos vencen.
        </p>

        ${emailDivider()}

        <div style="text-align: center; margin: 0 0 24px 0;">
            <p style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px 0; font-weight: 600;">Tu saldo actual</p>
            <p style="color: #e60012; font-size: 36px; font-weight: 700; margin: 0; letter-spacing: 1px;">${pointsFormatted} pts</p>
            <p style="color: #555; font-size: 14px; margin: 4px 0 0 0;">Equivalen a ${pesosValue} de descuento</p>
        </div>

        ${emailDivider()}

        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 16px 0;">
            Podés usarlos en tu próxima compra — 1 punto = $1 de descuento, hasta el 20% del pedido.
            Con un solo pedido reiniciás el contador y los mantenés vigentes 6 meses más.
        </p>

        ${emailButton('Ver comercios y canjear', `${baseUrl}/tienda`, 'red')}
    `);

    return sendEmail({
        to: data.email,
        subject: `⏳ Tenés ${pointsFormatted} puntos MOOVER por vencer`,
        html,
        tag: 'points_expiring',
    });
}

// ─── #5 — Driver auto-activado (UX, driver) ──────────────────────────────────

export async function sendDriverAutoActivatedEmail(data: {
    driverEmail: string;
    driverName: string;
}): Promise<boolean> {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('✅ Cuenta activada', '#f0fdf4', '#166534')}
        </div>
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">
            🎉 ¡Ya sos repartidor MOOVY, ${data.driverName}!
        </h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
            Aprobamos el último documento que faltaba. Tu cuenta está <strong>activa</strong>
            y ya podés conectarte para empezar a recibir pedidos en Ushuaia.
        </p>

        ${emailAlertBox(`
            <strong>Antes de conectarte por primera vez:</strong><br>
            • Asegurate de tener el GPS activo<br>
            • Revisá que los datos del vehículo estén al día<br>
            • Tené el celular cargado — cada entrega corre tracking en vivo
        `, 'success')}

        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 16px 0 0 0;">
            Primeras 10 entregas: solo pedidos con Mercado Pago (sin efectivo) para que te familiarices
            con el flujo. Después se habilitan los pedidos en efectivo con límite progresivo.
        </p>

        ${emailButton('Entrar al panel', `${baseUrl}/repartidor`, 'green')}
    `);

    return sendEmail({
        to: data.driverEmail,
        subject: `🎉 Tu cuenta de repartidor MOOVY está activa`,
        html,
        tag: 'driver_auto_activated',
    });
}

// ─── #6 — Referral completado (UX, referrer) ─────────────────────────────────

export async function sendReferralActivatedEmail(data: {
    referrerEmail: string;
    referrerName: string;
    refereeName: string;
    pointsAwarded: number;
    newBalance: number;
}): Promise<boolean> {
    const awardedFmt = data.pointsAwarded.toLocaleString('es-AR');
    const balanceFmt = data.newBalance.toLocaleString('es-AR');

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('🎁 Puntos de referido', '#fef2f2', '#991b1b')}
        </div>
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">
            ¡${data.refereeName} hizo su primer pedido!
        </h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            Gracias por invitarlo/a a MOOVY, ${data.referrerName}. Ya recibiste los puntos por el referido.
        </p>

        ${emailDivider()}

        <div style="text-align: center; margin: 0 0 16px 0;">
            <p style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px 0; font-weight: 600;">Ganaste</p>
            <p style="color: #059669; font-size: 36px; font-weight: 700; margin: 0; letter-spacing: 1px;">+${awardedFmt} pts</p>
        </div>
        <div style="text-align: center; margin: 0 0 16px 0;">
            <p style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 6px 0; font-weight: 600;">Saldo actualizado</p>
            <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0;">${balanceFmt} pts</p>
        </div>

        ${emailDivider()}

        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 16px 0;">
            Cada amigo que invités y haga su primer pedido te suma más puntos. Compartí tu código
            personal desde la sección Invitar Amigos y seguí sumando.
        </p>

        ${emailButton('Invitar a más amigos', `${baseUrl}/mi-perfil/invitar`, 'red')}
    `);

    return sendEmail({
        to: data.referrerEmail,
        subject: `🎁 ${data.refereeName} hizo su primer pedido — sumaste ${awardedFmt} pts`,
        html,
        tag: 'referral_activated',
    });
}

// ─── #7 — Cuenta auto-bloqueada por intentos fallidos (admin/owner) ───────────
//
// Se dispara desde authorize() cuando una cuenta llega a 5 intentos fallidos
// consecutivos. Permite que el admin contacte al user proactivamente — Ushuaia
// es ciudad chica y un user que no puede entrar abandona rápido si no se le da
// soporte. Acompañado del socket event "account_auto_locked" para los admins
// que tengan /ops/fraude abierto en vivo.

export async function sendAdminAccountLockedEmail(data: {
    userId: string;
    userEmail: string;
    userName: string | null;
    attempts: number;
    lockUntil: Date;
}): Promise<boolean> {
    const userLabel = data.userName || data.userEmail;
    const unlockFmt = new Intl.DateTimeFormat("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Argentina/Ushuaia",
    }).format(data.lockUntil);

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('🔒 Cuenta bloqueada', '#fef2f2', '#991b1b')}
        </div>
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">
            Una cuenta fue bloqueada por intentos fallidos
        </h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            El sistema bloqueó automáticamente la cuenta de <strong>${userLabel}</strong> después de
            <strong>${data.attempts} intentos fallidos</strong> de inicio de sesión consecutivos.
            La cuenta se desbloquea sola a las <strong>${unlockFmt}</strong>, o podés desbloquearla
            antes desde el panel.
        </p>
        ${emailInfoBox(`
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Email:</strong> ${data.userEmail}</p>
            ${data.userName ? `<p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Nombre:</strong> ${data.userName}</p>` : ''}
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Intentos:</strong> ${data.attempts}/5</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Auto-desbloqueo:</strong> ${unlockFmt}</p>
        `)}
        ${emailAlertBox(`
            <p style="margin: 0; font-size: 14px; line-height: 1.7;">
                <strong>¿Y si no fue el dueño?</strong> El user ya recibió un email avisando del bloqueo
                con instrucciones para resetear su contraseña — pero contactalo proactivamente si
                tenés su teléfono. En ciudad chica, una cuenta que "no funciona" 15 minutos puede
                hacer perder el cliente.
            </p>
        `, 'warning')}
        ${emailButton('Ver perfil del usuario', `${baseUrl}/ops/usuarios/${data.userId}`, 'red')}
    `);

    const recipients = await getAlertEmails();
    const results = await Promise.all(
        recipients.map((to) =>
            sendEmail({
                to,
                subject: `🔒 Cuenta bloqueada por intentos fallidos — ${userLabel}`,
                html,
                tag: 'admin_account_auto_locked',
            })
        )
    );
    return results.some(Boolean);
}

// ─── #8 — Cuenta creada por admin (al user, magic link de set-password) ──────
//
// Se dispara desde POST /api/admin/users/create cuando el admin OPS crea una
// cuenta de buyer/driver/seller desde el panel. El user RECIBE este email (no
// el admin — diferente a las funciones #1-#3 de arriba que van a alert_emails).
// El link contiene el token plaintext y vence en 24h. Reusa el flujo de
// /restablecer-contrasena. Si pasa de 24h sin setear contraseña, el admin
// re-dispara el invite (futuro).

export async function sendAccountCreatedByAdminEmail(data: {
    email: string;
    name: string | null;
    accountType: "BUYER" | "DRIVER" | "SELLER";
    setupLink: string;
    expiresAt: Date;
}): Promise<boolean> {
    const saludo = data.name ? `${data.name}, ` : "";
    const expiresFmt = new Intl.DateTimeFormat("es-AR", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "America/Argentina/Ushuaia",
    }).format(data.expiresAt);

    // Tono adaptado por tipo de cuenta — el buyer es informal, driver/seller
    // son operativos y el mensaje refleja lo que pueden hacer en su portal.
    const portalCopy: Record<typeof data.accountType, { headline: string; pitch: string }> = {
        BUYER: {
            headline: "Te creamos tu cuenta MOOVY",
            pitch: "Pedí lo que necesites a comercios de Ushuaia con delivery rápido. Te esperamos.",
        },
        DRIVER: {
            headline: "Te invitamos a ser repartidor MOOVY",
            pitch: "Tu cuenta de repartidor está lista. Una vez que configures tu contraseña, podés completar tu perfil (vehículo, documentos) y empezar a recibir entregas.",
        },
        SELLER: {
            headline: "Te invitamos a vender en el Marketplace MOOVY",
            pitch: "Tu cuenta de vendedor está lista. Configurá tu contraseña y empezá a publicar tus productos para vender en Ushuaia.",
        },
    };
    const { headline, pitch } = portalCopy[data.accountType];

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Bienvenido a MOOVY', '#fef2f2', '#991b1b')}
        </div>
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">
            ${headline}
        </h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            ${saludo}el equipo de Moovy creó una cuenta para vos. ${pitch}
        </p>

        ${emailInfoBox(`
            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Para empezar:</p>
            <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.7;">
                Hacé click en el botón de abajo y configurá tu contraseña. Vas a poder iniciar sesión inmediatamente con el email <strong>${data.email}</strong>.
            </p>
        `)}

        ${emailButton("Configurar mi contraseña", data.setupLink, "red")}

        ${emailAlertBox(`
            <p style="margin: 0; font-size: 14px; line-height: 1.7;">
                <strong>Tenés tiempo hasta el ${expiresFmt}</strong> para configurar tu contraseña con este link. Si vence, escribinos a soporte y te enviamos uno nuevo.
            </p>
        `, 'warning')}

        <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
            Si no esperabas recibir este email, ignorálo y la cuenta no se va a activar nunca. Si tenés dudas, escribinos a soporte.
        </p>
    `);

    return sendEmail({
        to: data.email,
        subject: `Bienvenido a MOOVY — configurá tu contraseña`,
        html,
        tag: "account_created_by_admin",
    });
}

// ─── Helper privado (emailDivider no está exportado del todo, duplicamos) ────
// Nota: emailLayout ya tiene su propio separador en el footer. Este divider es
// para separar bloques dentro del contenido.
function emailDivider(): string {
    return `<div style="height: 1px; background: #f0f0f0; margin: 28px 0;"></div>`;
}

// ─── #7 — Resumen diario de revenue al CEO/admin ──────────────────────────────
// Rama: feat/sentry-revenue-error-pages
//
// Email matutino (9 AM ART) con KPIs del día anterior. Inspirado en el
// "Daily flash" que mandan empresas grandes al management. La idea: mauro
// abre el mail con el café y en 30 segundos sabe si el día anterior fue
// bueno, malo, o si hay alguna alarma.
//
// El cron que lo dispara hace todas las queries y le pasa los números
// pre-calculados. Esta función SOLO arma el HTML.

export interface DailyRevenueSummaryData {
    /** Fecha del reporte (= ayer, formato "lunes 6 de mayo de 2026"). */
    reportDateLabel: string;
    /** Pedidos DELIVERED ayer. */
    ordersDelivered: number;
    /** Diferencia % vs el día previo (ayer-2). +5 = +5%, -10 = -10%. null si no hay datos. */
    ordersDeltaPct: number | null;
    /** GMV — suma de subtotales de pedidos DELIVERED. */
    gmv: number;
    /** Revenue de Moovy — comisiones cobradas + costo operativo retenido. */
    moovyRevenue: number;
    /** Pagos a comercios. */
    merchantPayouts: number;
    /** Pagos a repartidores. */
    driverPayouts: number;
    /** Pedidos cancelados ayer (timeout pago + manual + no-show). */
    ordersCancelled: number;
    /** No-shows reportados ayer. */
    noShows: number;
    /** Drivers que entregaron al menos 1 pedido ayer. */
    activeDrivers: number;
    /** Comercios con al menos 1 pedido DELIVERED ayer. */
    activeMerchants: number;
    /** Top 3 comercios por pedidos. */
    topMerchants: Array<{ name: string; orders: number; revenue: number }>;
    /** Drivers con fraudScore >= 2 (alerta — 3 = auto-suspend). */
    fraudAlerts: Array<{ name: string; score: number }>;
    /** Pedidos AWAITING_PAYMENT acumulados (no se cancelaron solos por algún motivo). */
    pendingPaymentsStuck: number;
}

export async function sendDailyRevenueSummaryEmail(
    data: DailyRevenueSummaryData,
): Promise<boolean> {
    const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;
    const pct = (n: number | null) => {
        if (n === null) return "—";
        const sign = n > 0 ? "+" : "";
        const color = n > 0 ? "#10b981" : n < 0 ? "#ef4444" : "#6b7280";
        return `<span style="color: ${color}; font-weight: 600;">${sign}${n.toFixed(0)}%</span>`;
    };

    // KPI block — la primera vista que ve el CEO
    const kpiBlock = `
        <div style="display: table; width: 100%; border-collapse: collapse; margin: 24px 0;">
            <div style="display: table-row;">
                <div style="display: table-cell; padding: 16px; background: #f9fafb; border-radius: 12px; text-align: center; width: 50%;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Pedidos entregados</p>
                    <p style="margin: 8px 0 4px 0; color: #111827; font-size: 32px; font-weight: 700;">${data.ordersDelivered}</p>
                    <p style="margin: 0; font-size: 12px;">${pct(data.ordersDeltaPct)} vs ayer</p>
                </div>
                <div style="display: table-cell; width: 12px;"></div>
                <div style="display: table-cell; padding: 16px; background: #fef2f2; border-radius: 12px; text-align: center; width: 50%;">
                    <p style="margin: 0; color: #991b1b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Revenue Moovy</p>
                    <p style="margin: 8px 0 4px 0; color: #e60012; font-size: 32px; font-weight: 700;">${fmt(data.moovyRevenue)}</p>
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">comisiones + margen de envío</p>
                </div>
            </div>
        </div>
    `;

    // Financial breakdown
    const financialBlock = emailInfoBox(`
        <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>GMV:</strong> ${fmt(data.gmv)}</p>
        <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Pagos a comercios:</strong> ${fmt(data.merchantPayouts)}</p>
        <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Pagos a repartidores:</strong> ${fmt(data.driverPayouts)}</p>
        <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Comercios activos:</strong> ${data.activeMerchants}</p>
        <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Repartidores activos:</strong> ${data.activeDrivers}</p>
    `);

    // Top merchants
    const topMerchantsBlock =
        data.topMerchants.length === 0
            ? `<p style="color: #9ca3af; font-style: italic; font-size: 14px;">— sin pedidos —</p>`
            : data.topMerchants
                  .map(
                      (m, i) => `
                <div style="display: flex; justify-content: space-between; padding: 10px 14px; background: ${i === 0 ? "#fef3c7" : "#f9fafb"}; border-radius: 8px; margin-bottom: 6px;">
                    <span style="color: #111827; font-size: 14px; font-weight: 500;">${i + 1}. ${m.name}</span>
                    <span style="color: #6b7280; font-size: 14px;">${m.orders} pedidos · ${fmt(m.revenue)}</span>
                </div>`,
                  )
                  .join("");

    // Alertas — secciones que solo se renderizan si tienen contenido
    const alertsBlocks: string[] = [];
    if (data.noShows > 0) {
        alertsBlocks.push(
            emailAlertBox(
                `<strong>${data.noShows} no-show${data.noShows === 1 ? "" : "s"} reportado${data.noShows === 1 ? "" : "s"} ayer.</strong> Revisar en /ops/pedidos para chequear si son patrones de un mismo cliente o repartidor.`,
                "warning",
            ),
        );
    }
    if (data.fraudAlerts.length > 0) {
        const list = data.fraudAlerts
            .map((d) => `<li><strong>${d.name}</strong> — score ${d.score}</li>`)
            .join("");
        alertsBlocks.push(
            emailAlertBox(
                `<strong>Repartidores con fraudScore alto:</strong><ul style="margin: 8px 0 0 0; padding-left: 20px;">${list}</ul>A 3 incidentes se auto-suspenden.`,
                "error",
            ),
        );
    }
    if (data.pendingPaymentsStuck > 0) {
        alertsBlocks.push(
            emailAlertBox(
                `<strong>${data.pendingPaymentsStuck} pedidos en AWAITING_PAYMENT acumulados.</strong> Si supera el threshold de cancel-stale-pending-payments, revisar en /ops/crons.`,
                "warning",
            ),
        );
    }

    const alertsSection =
        alertsBlocks.length === 0
            ? emailAlertBox("Día limpio — sin alertas operativas.", "success")
            : alertsBlocks.join("\n");

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 16px;">
            ${emailBadge("📊 Daily Flash", "#fef2f2", "#991b1b")}
        </div>
        <h2 style="color: #111827; margin: 0 0 8px 0; font-size: 22px; font-weight: 600; text-align: center;">
            Resumen del ${data.reportDateLabel}
        </h2>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center; margin: 0 0 8px 0;">
            Resumen automático de operaciones del día anterior.
        </p>

        ${kpiBlock}

        <h3 style="color: #111827; font-size: 15px; font-weight: 600; margin: 28px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Financiero</h3>
        ${financialBlock}

        <h3 style="color: #111827; font-size: 15px; font-weight: 600; margin: 28px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Top comercios</h3>
        ${topMerchantsBlock}

        <h3 style="color: #111827; font-size: 15px; font-weight: 600; margin: 28px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Alertas</h3>
        ${alertsSection}

        ${emailDivider()}

        <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
            <strong>Cancelados ayer:</strong> ${data.ordersCancelled} pedidos.<br/>
            Detalle completo en <a href="${baseUrl}/ops/dashboard" style="color: #e60012; font-weight: 500;">/ops/dashboard</a>.
        </p>

        ${emailButton("Abrir panel OPS", `${baseUrl}/ops/dashboard`, "red")}
    `);

    const recipients = await getAlertEmails();
    const results = await Promise.all(
        recipients.map((to) =>
            sendEmail({
                to,
                subject: `📊 Moovy daily — ${data.ordersDelivered} pedidos · ${fmt(data.moovyRevenue)} revenue (${data.reportDateLabel})`,
                html,
                tag: "admin_daily_revenue_summary",
            }),
        ),
    );
    return results.some(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────
// feat/driver-soporte-gps-bloqueado (2026-05-13): alerta a OPS cuando un
// driver reporta problemas con el GPS durante la verificación del PIN.
// Trigger: POST /api/driver/report-pin-issue (driver pinchó el botón
// "Tengo problemas con la ubicación" después de un OUT_OF_GEOFENCE).
// Va a getAlertEmails() — los mismos admins que reciben otras notifs.
// ─────────────────────────────────────────────────────────────────────────

export async function sendAdminPinIssueEmail(data: {
    driverName: string;
    driverPhone: string;
    orderId: string;
    orderNumber: string;
    pinType: "pickup" | "delivery";
    distanceMeters: number | null;
    currentLat: number | null;
    currentLng: number | null;
    comment: string | null;
}): Promise<boolean> {
    const pinTypeLabel = data.pinType === "pickup" ? "retiro (comercio)" : "entrega (cliente)";
    const distanceStr = typeof data.distanceMeters === "number"
        ? `${Math.round(data.distanceMeters)}m`
        : "desconocida";
    const locationStr = (typeof data.currentLat === "number" && typeof data.currentLng === "number")
        ? `${data.currentLat.toFixed(5)}, ${data.currentLng.toFixed(5)}`
        : "no disponible";
    const mapsLink = (typeof data.currentLat === "number" && typeof data.currentLng === "number")
        ? `https://www.google.com/maps?q=${data.currentLat},${data.currentLng}`
        : null;

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('📍 GPS bloqueado', '#fef3c7', '#92400e')}
        </div>
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">
            Repartidor reporta problemas con la ubicación
        </h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            <strong>${data.driverName}</strong> no pudo validar el PIN de ${pinTypeLabel}
            porque el sistema lo ubicó fuera del geofence. Reportó el problema desde la app
            para que soporte lo asista.
        </p>
        ${emailInfoBox(`
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Pedido:</strong> ${data.orderNumber}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Repartidor:</strong> ${data.driverName}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Teléfono:</strong> ${data.driverPhone}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Tipo de PIN:</strong> ${pinTypeLabel}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Distancia reportada:</strong> ${distanceStr}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Ubicación del driver:</strong> ${locationStr}${mapsLink ? ` (<a href="${mapsLink}" style="color: #2563eb;">ver en Maps</a>)` : ""}</p>
        `)}
        ${data.comment ? emailAlertBox(`<p style="margin: 0; font-size: 14px;"><strong>Lo que dice el driver:</strong><br>${escapeHtml(data.comment)}</p>`, 'info') : ''}
        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 16px 0 0 0;">
            Pasos sugeridos: contactá al driver por WhatsApp al ${data.driverPhone},
            confirmá que está en el lugar (puede pedir foto), y si todo OK,
            ayudalo a destrabar el caso desde el panel del pedido.
        </p>
        ${emailButton('Ver pedido en OPS', `${baseUrl}/ops/pedidos/${data.orderId}`, 'blue')}
    `);

    const recipients = await getAlertEmails();
    const results = await Promise.all(
        recipients.map((to) =>
            sendEmail({
                to,
                subject: `📍 PIN bloqueado por GPS — ${data.driverName} · pedido ${data.orderNumber}`,
                html,
                tag: "admin_driver_pin_issue",
            }),
        ),
    );
    return results.some(Boolean);
}

// Mini helper para escapar HTML en el comment libre que escribe el driver.
// Defensa básica anti-XSS aunque solo lo lea el admin (defensa en profundidad).
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ─────────────────────────────────────────────────────────────────────────
// feat/email-ops-comment-pending (2026-05-13): alerta a OPS cuando un
// comentario de reseña cae en moderationStatus = PENDING. Cierra el ciclo
// abierto del sistema de moderacion (feat/propinas-y-ratings-post-entrega +
// feat/resenas-publicas-tienda). Antes el admin tenia que entrar a mano a
// /ops/reviews-pendientes para descubrir si habia algo en la queue; ahora
// recibe email proactivo apenas hay material para revisar.
//
// Se dispara desde:
//   - /api/orders/[id]/rate (cuando el comment del driver matchea blacklist)
//   - /api/orders/[id]/rate-merchant (idem para merchant)
//   - /api/orders/[id]/rate-seller (idem para seller)
//   - /api/reviews/report (cuando reportCount llega al threshold de 3)
//
// reason: union discriminada que dice POR QUE cayo en PENDING. La UI del
// email cambia segun el origen — si fue blacklist mostramos los patterns
// matchados, si fue reportes mostramos las razones de los reporters.
// ─────────────────────────────────────────────────────────────────────────

type ReviewPendingReason =
    | { source: "BLACKLIST"; matchedPatterns: string[] }
    | {
          source: "REPORTS";
          reportCount: number;
          recentReports: Array<{ reason: string | null; reporterName: string | null }>;
      };

export async function sendAdminReviewPendingEmail(data: {
    orderId: string;
    orderNumber: string;
    target: "DRIVER" | "MERCHANT" | "SELLER";
    entityName: string | null;
    rating: number;
    comment: string;
    authorName: string | null;
    authorEmail: string | null;
    reason: ReviewPendingReason;
}): Promise<boolean> {
    const targetLabel =
        data.target === "DRIVER" ? "repartidor" :
        data.target === "MERCHANT" ? "comercio" :
        "vendedor";

    const starsHtml = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);

    // Bloque de "razon" — texto distinto segun source.
    const reasonHtml = (() => {
        if (data.reason.source === "BLACKLIST") {
            const patterns = data.reason.matchedPatterns.slice(0, 5);
            const items = patterns.map((p) => `<li><code>${escapeHtml(p)}</code></li>`).join("");
            const more = data.reason.matchedPatterns.length > 5
                ? `<p style="margin: 6px 0 0; color: #666; font-size: 12px;">+ ${data.reason.matchedPatterns.length - 5} patrones más.</p>`
                : "";
            return emailAlertBox(
                `<p style="margin: 0 0 8px; font-size: 14px;"><strong>Motivo:</strong> matcheo automático de la blacklist al crear el comentario.</p>
                 <p style="margin: 4px 0; font-size: 13px; color: #666;">Patrones que disparon:</p>
                 <ul style="margin: 4px 0 0 18px; padding: 0; color: #444; font-size: 13px;">${items}</ul>
                 ${more}`,
                "warning"
            );
        }
        const reports = data.reason.recentReports.slice(0, 5);
        const items = reports.map((r) => {
            const reporter = r.reporterName ? escapeHtml(r.reporterName) : "Anónimo";
            const reason = r.reason ? escapeHtml(r.reason) : "<em>(sin detalle)</em>";
            return `<li><strong>${reporter}:</strong> ${reason}</li>`;
        }).join("");
        return emailAlertBox(
            `<p style="margin: 0 0 8px; font-size: 14px;"><strong>Motivo:</strong> ${data.reason.reportCount} usuarios reportaron este comentario como inapropiado.</p>
             <p style="margin: 4px 0; font-size: 13px; color: #666;">Razones dejadas:</p>
             <ul style="margin: 4px 0 0 18px; padding: 0; color: #444; font-size: 13px;">${items}</ul>`,
            "warning"
        );
    })();

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('🚨 Reseña en revisión', '#fef3c7', '#92400e')}
        </div>
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">
            Reseña pendiente de moderar (${targetLabel})
        </h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            Un comentario de reseña cayó en estado <strong>PENDING</strong> y está oculto del público hasta que lo revises. Aprobalo o eliminalo desde el panel.
        </p>

        ${emailInfoBox(`
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Pedido:</strong> ${escapeHtml(data.orderNumber)}</p>
            ${data.entityName ? `<p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>${targetLabel.charAt(0).toUpperCase() + targetLabel.slice(1)}:</strong> ${escapeHtml(data.entityName)}</p>` : ""}
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Autor:</strong> ${data.authorName ? escapeHtml(data.authorName) : "Anónimo"}${data.authorEmail ? ` (${escapeHtml(data.authorEmail)})` : ""}</p>
            <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Calificación:</strong> <span style="color: #f59e0b; font-size: 16px;">${starsHtml}</span> ${data.rating}/5</p>
            <p style="margin: 12px 0 4px; color: #333; font-size: 14px;"><strong>Comentario:</strong></p>
            <blockquote style="margin: 0; padding: 10px 14px; background: #fff; border-left: 3px solid #f59e0b; color: #444; font-size: 14px; font-style: italic;">
                &ldquo;${escapeHtml(data.comment)}&rdquo;
            </blockquote>
        `)}

        ${reasonHtml}

        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 16px 0 0 0;">
            En el panel podés aprobar el comentario (queda público) o rechazarlo (se borra el texto, el rating numérico se mantiene). En ambos casos queda audit log.
        </p>
        ${emailButton('Revisar en panel OPS', `${baseUrl}/ops/reviews-pendientes`, 'blue')}
    `);

    const recipients = await getAlertEmails();
    const results = await Promise.all(
        recipients.map((to) =>
            sendEmail({
                to,
                subject: `🚨 Reseña pendiente — ${targetLabel} · pedido ${data.orderNumber}`,
                html,
                tag: "admin_review_pending",
            }),
        ),
    );
    return results.some(Boolean);
}
