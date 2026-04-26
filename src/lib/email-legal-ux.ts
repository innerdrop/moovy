/**
 * MOOVY — Emails legales (Ley 25.326 / 26.951 / 24.240) + UX cr\u00edtico buyer/driver.
 *
 * 9 funciones que cubren huecos obligatorios del cat\u00e1logo de emails del lanzamiento:
 *   LEGAL:
 *     1. sendEmailChangeConfirmationEmail  — cambio de email (doble env\u00edo: nuevo + viejo)
 *     2. sendDataExportReadyEmail          — export ARCO listo para descargar
 *     3. sendTermsUpdatedEmail             — bump de T\u00e9rminos o Pol\u00edtica de Privacidad
 *     4. sendMarketingOptOutConfirmedEmail — confirmaci\u00f3n de revocaci\u00f3n de marketing (Ley 26.951)
 *   UX CR\u00cdTICO:
 *     5. sendDriverAssignedEmail           — al buyer: driver asignado
 *     6. sendOrderOnTheWayEmail            — al buyer: pedido en camino + PIN destacado
 *     7. sendOrderReadyForPickupEmail      — al buyer: listo para retirar (pickup)
 *     8. sendRateOrderReminderEmail        — 24h despu\u00e9s de DELIVERED sin calificar
 *     9. sendPointsEarnedEmail             — al buyer: puntos acreditados al pasar a DELIVERED
 *
 * Todas usan el layout + helpers centralizados de email.ts. Tag del sendEmail
 * coincide con el id de EMAIL_REGISTRY para trazabilidad.
 *
 * Importante: fire-and-forget desde los callers. Las funciones no throwean —
 * retornan el boolean de `sendEmail` (true si Nodemailer no explot\u00f3).
 */

import {
    sendEmail,
    emailLayout,
    emailButton,
    emailInfoBox,
    emailAlertBox,
    emailDivider,
    baseUrl,
} from "./email";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS LOCALES
// ═══════════════════════════════════════════════════════════════════════════

/** Formatea una fecha en zona AR de forma human-friendly. */
function formatDateTimeAR(date: Date): string {
    try {
        return new Intl.DateTimeFormat("es-AR", {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "America/Argentina/Ushuaia",
        }).format(date);
    } catch {
        return date.toISOString();
    }
}

/** Formatea un PIN de 6 d\u00edgitos como "XXX XXX" para lectura r\u00e1pida. */
function formatPin(pin: string): string {
    const clean = pin.replace(/\D/g, "").padStart(6, "0").slice(0, 6);
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)}`;
}

/** Enmascara tel\u00e9fono — muestra solo los \u00faltimos 4 d\u00edgitos. */
function maskPhone(phone: string | null | undefined): string {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 4) return "";
    return `\u2022\u2022\u2022\u2022 ${digits.slice(-4)}`;
}

/** Label en espa\u00f1ol para el tipo de veh\u00edculo. */
function vehicleLabel(vt: string | null | undefined): string {
    if (!vt) return "Repartidor";
    const map: Record<string, string> = {
        MOTO: "moto",
        MOTORCYCLE: "moto",
        motorcycle: "moto",
        AUTO: "auto",
        CAR: "auto",
        car: "auto",
        BICI: "bicicleta",
        BICICLETA: "bicicleta",
        BICYCLE: "bicicleta",
        bicycle: "bicicleta",
        CAMIONETA: "camioneta",
        PICKUP: "camioneta",
        SUV: "camioneta",
        VAN: "camioneta",
        van: "camioneta",
        PATIN: "patineta",
        PATINETA: "patineta",
        FLETE: "flete",
    };
    return map[vt] || map[vt.toUpperCase()] || "veh\u00edculo";
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGAL #1 — Cambio de email (doble env\u00edo)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Env\u00eda DOS emails: uno al nuevo email (confirmaci\u00f3n) y otro al viejo
 * (alerta de seguridad). Retorna true si ambos sends fueron exitosos.
 *
 * Ley 25.326 Art. 16 (rectificaci\u00f3n): el usuario tiene derecho a actualizar
 * sus datos; la alerta al email anterior protege contra account takeover.
 */
export async function sendEmailChangeConfirmationEmail(
    newEmail: string,
    oldEmail: string,
    firstName: string | null
) {
    const saludo = firstName ? `${firstName}, ` : "";

    // (a) Email al NUEVO — confirmaci\u00f3n.
    const htmlNew = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu email fue actualizado</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            ${saludo}a partir de ahora tu cuenta MOOVY est\u00e1 asociada a <strong>${newEmail}</strong>.
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            Todos los correos transaccionales (confirmaciones de pedidos, notificaciones, recuperaci\u00f3n de contrase\u00f1a) te van a llegar a este nuevo email.
        </p>

        ${emailAlertBox(
            `<strong>\u00bfNo fuiste vos?</strong> Si no hiciste este cambio, contactanos urgente a <a href="mailto:soporte@somosmoovy.com" style="color: #1a1a1a; text-decoration: underline;">soporte@somosmoovy.com</a> para recuperar tu cuenta.`,
            "warning"
        )}

        ${emailButton("Ir a mi perfil", `${baseUrl}/mi-perfil`, "blue")}
    `);

    const okNew = await sendEmail({
        to: newEmail,
        subject: "Tu email en MOOVY fue actualizado",
        html: htmlNew,
        tag: "email_change_confirmation",
    });

    // (b) Email al VIEJO — alerta.
    const htmlOld = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu email fue cambiado</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            ${saludo}te avisamos que el email de tu cuenta MOOVY fue cambiado a <strong>${newEmail}</strong>.
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            Este correo (<strong>${oldEmail}</strong>) ya no va a recibir notificaciones de la cuenta.
        </p>

        ${emailAlertBox(
            `<strong>\u26a0\ufe0f \u00bfNo fuiste vos?</strong> Si no autorizaste este cambio, es posible que alguien haya accedido a tu cuenta. Contactanos <u>urgente</u> a <a href="mailto:soporte@somosmoovy.com" style="color: #991b1b; text-decoration: underline;">soporte@somosmoovy.com</a> para recuperar el acceso.`,
            "error"
        )}

        <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
            Por tu seguridad, te recomendamos cambiar la contrase\u00f1a de tu email anterior y activar la verificaci\u00f3n en dos pasos si no lo hiciste ya.
        </p>
    `);

    const okOld = await sendEmail({
        to: oldEmail,
        subject: "\u26a0\ufe0f Se cambi\u00f3 el email de tu cuenta MOOVY",
        html: htmlOld,
        tag: "email_change_alert_old",
    });

    return okNew && okOld;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGAL #2 — Export ARCO listo para descargar
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cuando el user pide export ARCO (Acceso/Rectificaci\u00f3n/Cancelaci\u00f3n/Oposici\u00f3n)
 * y el resultado est\u00e1 listo para descargar. Hoy `/api/profile/export-data` devuelve
 * el JSON directo — esta funci\u00f3n queda para cuando el export sea as\u00edncrono.
 */
export async function sendDataExportReadyEmail(
    email: string,
    firstName: string | null,
    downloadUrl: string,
    expiresAt: Date
) {
    const saludo = firstName ? `${firstName}, ` : "";
    const vence = formatDateTimeAR(expiresAt);

    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu exportaci\u00f3n de datos est\u00e1 lista</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            ${saludo}preparamos el archivo con todos los datos personales que guardamos en tu cuenta MOOVY: perfil, direcciones, pedidos, transacciones de puntos, consentimientos y m\u00e1s.
        </p>

        ${emailInfoBox(`
            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Formato</p>
            <p style="margin: 0 0 16px 0; color: #555; font-size: 14px;">JSON descargable</p>
            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Disponible hasta</p>
            <p style="margin: 0; color: #555; font-size: 14px;">${vence}</p>
        `)}

        ${emailButton("Descargar mis datos", downloadUrl, "blue")}

        ${emailDivider()}

        <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
            Este link es personal y por seguridad caduca en 48 horas. Si no llegaste a descargarlo a tiempo, pod\u00e9s pedir una nueva exportaci\u00f3n desde tu perfil.
        </p>
        <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0;">
            Derecho de acceso y portabilidad garantizado por la Ley 25.326 de Protecci\u00f3n de Datos Personales.
        </p>
    `);

    return sendEmail({
        to: email,
        subject: "Tu exportaci\u00f3n de datos MOOVY est\u00e1 lista",
        html,
        tag: "data_export_ready",
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGAL #3 — Actualizaci\u00f3n de T\u00e9rminos o Privacidad
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cuando se bumpea `TERMS_VERSION` o `PRIVACY_POLICY_VERSION` en legal-versions.ts.
 * No se conecta a trigger autom\u00e1tico — se dispara manual (cron futuro).
 */
export async function sendTermsUpdatedEmail(
    email: string,
    firstName: string | null,
    documentType: "TERMS" | "PRIVACY",
    newVersion: string
) {
    const saludo = firstName ? `${firstName}, ` : "";
    const isTerms = documentType === "TERMS";
    const docLabel = isTerms ? "T\u00e9rminos y Condiciones" : "Pol\u00edtica de Privacidad";
    const docPath = isTerms ? "/terminos" : "/privacidad";
    const docUrl = `${baseUrl}${docPath}`;

    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Actualizamos nuestros ${docLabel}</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            ${saludo}te avisamos que publicamos una nueva versi\u00f3n de ${isTerms ? "los" : "la"} <strong>${docLabel}</strong> de MOOVY (versi\u00f3n <strong>${newVersion}</strong>).
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            Te pedimos que los leas antes de seguir usando la plataforma. Si segu\u00eds usando MOOVY despu\u00e9s de recibir este correo, entendemos que aceptaste los cambios.
        </p>

        ${emailButton("Leer " + docLabel.toLowerCase(), docUrl, "blue")}

        ${emailDivider()}

        <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
            Pod\u00e9s ver el historial completo de consentimientos y cambios en tu <a href="${baseUrl}/mi-perfil/privacidad" style="color: #1a1a1a; text-decoration: underline;">panel de privacidad</a>.
        </p>
        <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0;">
            Si no est\u00e1s de acuerdo con los cambios, pod\u00e9s eliminar tu cuenta desde el mismo panel.
        </p>
    `);

    return sendEmail({
        to: email,
        subject: `Actualizamos los ${docLabel} de MOOVY`,
        html,
        tag: isTerms ? "terms_updated" : "privacy_updated",
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGAL #4 — Confirmaci\u00f3n de opt-out de marketing (Ley 26.951)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obligatorio por Ley 26.951 "No Llame" / marco AAIP: cuando el user revoca
 * el consentimiento de marketing, tenemos que confirmar por escrito que el
 * cambio fue aplicado.
 */
export async function sendMarketingOptOutConfirmedEmail(
    email: string,
    firstName: string | null
) {
    const saludo = firstName ? `${firstName}, ` : "";

    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Confirmamos tu baja de comunicaciones</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            ${saludo}registramos tu decisi\u00f3n. A partir de este momento ya <strong>no vas a recibir</strong> ofertas, promociones ni novedades comerciales de MOOVY por email ni por push.
        </p>

        ${emailInfoBox(`
            <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Qu\u00e9 vas a seguir recibiendo</p>
            <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.7;">
                Solo correos transaccionales imprescindibles de tus pedidos: confirmaciones, estado de entrega, recibos, y avisos legales obligatorios.
            </p>
        `)}

        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 24px 0 0 0;">
            Si cambi\u00e1s de opini\u00f3n, pod\u00e9s volver a suscribirte en cualquier momento desde tu panel de privacidad.
        </p>

        ${emailButton("Ir a mi panel de privacidad", `${baseUrl}/mi-perfil/privacidad`, "blue")}

        ${emailDivider()}

        <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0;">
            Baja confirmada conforme a la Ley 26.951 "No Llame" y al marco de protecci\u00f3n de datos de la AAIP.
        </p>
    `);

    return sendEmail({
        to: email,
        subject: "Confirmamos tu baja de comunicaciones comerciales",
        html,
        tag: "marketing_opt_out_confirmed",
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// UX #5 — Driver asignado (al buyer)
// ═══════════════════════════════════════════════════════════════════════════

export async function sendDriverAssignedEmail(data: {
    buyerEmail: string;
    buyerName: string | null;
    orderNumber: string;
    driverName: string;
    driverPhone: string | null;
    vehicleType: string | null;
    estimatedPickupMinutes: number;
}) {
    const saludo = data.buyerName ? `${data.buyerName}, ` : "";
    const vLabel = vehicleLabel(data.vehicleType);
    const masked = maskPhone(data.driverPhone);

    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu pedido ya tiene repartidor</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            ${saludo}<strong>${data.driverName}</strong> va a buscar tu pedido <strong>${data.orderNumber}</strong>. Lleg\u00f3 al comercio en aproximadamente <strong>${data.estimatedPickupMinutes} minutos</strong>.
        </p>

        ${emailInfoBox(`
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; padding: 0 0 6px 0;">Repartidor</td>
                </tr>
                <tr>
                    <td style="color: #1a1a1a; font-size: 15px; font-weight: 600; padding: 0 0 14px 0;">${data.driverName}</td>
                </tr>
                <tr>
                    <td style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; padding: 0 0 6px 0;">Veh\u00edculo</td>
                </tr>
                <tr>
                    <td style="color: #555; font-size: 14px; padding: 0 0 14px 0;">${vLabel.charAt(0).toUpperCase() + vLabel.slice(1)}</td>
                </tr>
                ${masked ? `
                <tr>
                    <td style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; padding: 0 0 6px 0;">Contacto</td>
                </tr>
                <tr>
                    <td style="color: #555; font-size: 14px;">${masked} <span style="color: #999; font-size: 12px;">(tel\u00e9fono enmascarado por privacidad)</span></td>
                </tr>
                ` : ""}
            </table>
        `)}

        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 8px 0;">
            Pod\u00e9s seguir la ubicaci\u00f3n del repartidor en vivo y chatear con \u00e9l desde el detalle del pedido.
        </p>

        ${emailButton("Ver mi pedido", `${baseUrl}/mis-pedidos`, "red")}
    `);

    return sendEmail({
        to: data.buyerEmail,
        subject: `Tu pedido ${data.orderNumber} ya tiene repartidor`,
        html,
        tag: "driver_assigned_buyer",
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// UX #6 — Pedido en camino + PIN destacado
// ═══════════════════════════════════════════════════════════════════════════

export async function sendOrderOnTheWayEmail(data: {
    buyerEmail: string;
    buyerName: string | null;
    orderNumber: string;
    deliveryPin: string;
}) {
    const saludo = data.buyerName ? `${data.buyerName}, ` : "";
    const pinDisplay = formatPin(data.deliveryPin);

    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu pedido va en camino</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            ${saludo}tu pedido <strong>${data.orderNumber}</strong> ya sali\u00f3 del comercio. El repartidor lo est\u00e1 llevando a la direcci\u00f3n de entrega.
        </p>

        <div style="background-color: #fafafa; border: 2px solid #1a1a1a; border-radius: 12px; padding: 28px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 12px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">C\u00f3digo de entrega</p>
            <p style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;">${pinDisplay}</p>
            <p style="margin: 0; color: #555; font-size: 13px; line-height: 1.6;">
                Cuando llegue el repartidor, dale este c\u00f3digo.<br>
                Es la \u00fanica forma de confirmar que recibiste tu pedido.
            </p>
        </div>

        ${emailAlertBox(
            `<strong>No compartas el c\u00f3digo con nadie m\u00e1s</strong> ni lo anticipes por chat o tel\u00e9fono. Solo mostraselo al repartidor cuando te entregue el paquete en la puerta.`,
            "warning"
        )}

        ${emailButton("Seguir mi pedido", `${baseUrl}/mis-pedidos`, "red")}
    `);

    return sendEmail({
        to: data.buyerEmail,
        subject: `\ud83d\udee5\ufe0f Tu pedido ${data.orderNumber} va en camino \u2014 c\u00f3digo ${pinDisplay}`,
        html,
        tag: "order_on_the_way",
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// UX #7 — Listo para retirar (pickup)
// ═══════════════════════════════════════════════════════════════════════════

export async function sendOrderReadyForPickupEmail(data: {
    buyerEmail: string;
    buyerName: string | null;
    orderNumber: string;
    merchantName: string;
    merchantAddress: string;
}) {
    const saludo = data.buyerName ? `${data.buyerName}, ` : "";

    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu pedido est\u00e1 listo para retirar</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            ${saludo}tu pedido <strong>${data.orderNumber}</strong> est\u00e1 listo. Pod\u00e9s pasar a buscarlo cuando te quede c\u00f3modo.
        </p>

        ${emailInfoBox(`
            <p style="margin: 0 0 6px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Retirar en</p>
            <p style="margin: 0 0 4px 0; color: #1a1a1a; font-size: 17px; font-weight: 600;">${data.merchantName}</p>
            <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">${data.merchantAddress}</p>
        `)}

        <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 8px 0;">
            Llev\u00e1 tu n\u00famero de pedido (<strong>${data.orderNumber}</strong>) o mostr\u00e1 este email al mostrador.
        </p>
        <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">
            Te recomendamos pasar dentro del horario de atenci\u00f3n del comercio. Si necesit\u00e1s coordinar, pod\u00e9s escribirles desde el chat del pedido.
        </p>

        ${emailButton("Ver mi pedido", `${baseUrl}/mis-pedidos`, "red")}
    `);

    return sendEmail({
        to: data.buyerEmail,
        subject: `Tu pedido ${data.orderNumber} est\u00e1 listo para retirar`,
        html,
        tag: "order_ready_pickup",
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// UX #8 — Recordatorio de calificar (24h post-DELIVERED)
// ═══════════════════════════════════════════════════════════════════════════

export async function sendRateOrderReminderEmail(data: {
    buyerEmail: string;
    buyerName: string | null;
    orderNumber: string;
    merchantName: string;
    orderId: string;
}) {
    const saludo = data.buyerName ? `${data.buyerName}, ` : "";

    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">\u00bfC\u00f3mo estuvo tu pedido?</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            ${saludo}ayer recibiste tu pedido <strong>${data.orderNumber}</strong> de <strong>${data.merchantName}</strong>. Nos encantar\u00eda saber c\u00f3mo fue tu experiencia.
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            Tarda menos de 10 segundos y ayuda al comercio y al repartidor a mejorar. Adem\u00e1s, otros vecinos de Ushuaia ven tu opini\u00f3n antes de pedir.
        </p>

        ${emailButton("Calificar mi pedido", `${baseUrl}/mis-pedidos/${data.orderId}`, "red")}

        ${emailDivider()}

        <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0;">
            Este es el \u00fanico recordatorio que vas a recibir sobre este pedido. Si preferiste no calificar, est\u00e1 perfecto.
        </p>
    `);

    return sendEmail({
        to: data.buyerEmail,
        subject: `\u00bfC\u00f3mo estuvo tu pedido de ${data.merchantName}?`,
        html,
        tag: "rate_order_reminder",
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// UX #9 — Puntos MOOVER acreditados
// ═══════════════════════════════════════════════════════════════════════════

export async function sendPointsEarnedEmail(data: {
    buyerEmail: string;
    buyerName: string | null;
    pointsEarned: number;
    orderNumber: string;
    newBalance: number;
    tierName: string;
}) {
    const saludo = data.buyerName ? `${data.buyerName}, ` : "";
    const earnedFmt = data.pointsEarned.toLocaleString("es-AR");
    const balanceFmt = data.newBalance.toLocaleString("es-AR");
    const discountValue = data.newBalance.toLocaleString("es-AR"); // 1 pt = $1 (Biblia v3)

    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">\ud83c\udf89 Sumaste puntos MOOVER</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            ${saludo}se acreditaron <strong>${earnedFmt} puntos</strong> a tu cuenta por tu pedido <strong>${data.orderNumber}</strong>.
        </p>

        <div style="background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 6px 0; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">Tu saldo actual</p>
            <p style="margin: 0 0 4px 0; color: #1a1a1a; font-size: 36px; font-weight: 700; letter-spacing: -0.02em;">${balanceFmt} <span style="font-size: 16px; font-weight: 500; color: #b45309;">pts</span></p>
            <p style="margin: 0; color: #92400e; font-size: 13px;">Nivel <strong>${data.tierName}</strong></p>
        </div>

        ${emailInfoBox(`
            <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.7;">
                <strong>1 punto = $1 ARS.</strong> Pod\u00e9s canjearlos como descuento en tu pr\u00f3xima compra (hasta 20% del subtotal, desde 500 puntos).
                ${data.newBalance >= 500 ? `<br><span style="color: #059669; font-weight: 600;">\u2713 Ya pod\u00e9s usarlos: ten\u00e9s hasta $${discountValue} en descuento.</span>` : `<br>Te faltan ${(500 - data.newBalance).toLocaleString("es-AR")} pts para llegar al m\u00ednimo de canje.`}
            </p>
        `)}

        ${emailButton("Ver mis puntos", `${baseUrl}/puntos`, "red")}
    `);

    return sendEmail({
        to: data.buyerEmail,
        subject: `\ud83c\udf89 Sumaste ${earnedFmt} puntos MOOVER`,
        html,
        tag: "points_earned",
    });
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// SEGURIDAD \u2014 Cuenta bloqueada por intentos fallidos (ISSUE-062)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//
// Se dispara cuando el sistema bloquea una cuenta por alcanzar el threshold de
// intentos fallidos (5 consecutivos). Cr\u00edtico: si fue un atacante, el due\u00f1o
// real tiene que enterarse para revisar/resetear su contrase\u00f1a. Si fue el
// due\u00f1o que se confundi\u00f3, el email le explica cu\u00e1ndo se desbloquea solo.
//
// El bloqueo es de 15min auto-expira; la auditor\u00eda queda en AuditLog
// (USER_LOGIN_AUTO_LOCKED). El admin puede desbloquear manualmente desde
// /ops/usuarios/[id].

export async function sendAccountLockedEmail(data: {
    email: string;
    name: string | null;
    unlockAt: Date;
}) {
    const saludo = data.name ? `${data.name}, ` : "";
    const unlockFmt = formatDateTimeAR(data.unlockAt);

    const html = emailLayout(`
        <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">\ud83d\udd12 Bloqueamos tu cuenta por seguridad</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            ${saludo}detectamos m\u00faltiples intentos fallidos de inicio de sesi\u00f3n en tu cuenta. Por seguridad la bloqueamos temporalmente.
        </p>

        ${emailAlertBox(`
            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">\u00bfFuiste vos?</p>
            <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.7;">
                Si te confundiste con la contrase\u00f1a, tranquilo \u2014 la cuenta se desbloquea sola el <strong>${unlockFmt}</strong>. O pod\u00e9s reseteala ahora si no la record\u00e1s.
            </p>
        `, "warning")}

        ${emailAlertBox(`
            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">\u00bfNo fuiste vos?</p>
            <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.7;">
                Alguien intent\u00f3 entrar a tu cuenta. Reset\u00e1 tu contrase\u00f1a ahora mismo \u2014 con eso invalidamos cualquier intento futuro.
            </p>
        `, "danger")}

        ${emailButton("Resetear mi contrase\u00f1a", `${baseUrl}/recuperar`, "red")}

        ${emailDivider()}

        <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0;">
            Si no resete\u00e1s nada, tu cuenta se desbloquea autom\u00e1ticamente el ${unlockFmt}. Si necesit\u00e1s ayuda, escribinos a soporte.
        </p>
    `);

    return sendEmail({
        to: data.email,
        subject: "\ud83d\udd12 Tu cuenta MOOVY fue bloqueada por seguridad",
        html,
        tag: "account_auto_locked",
    });
}
