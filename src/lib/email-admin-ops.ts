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
