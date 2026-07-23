// MOOVY — Email automático de confirmación de pre-registro (lista de espera).
// Rama: feat/notificacion-telegram-leads
//
// Un solo builder con variantes por rol (COMERCIO/DRIVER/CLIENTE). El preview de
// /ops/emails usa EL MISMO builder (email-registry.ts) → lo que se aprueba en el
// preview es exactamente lo que se envía.
//
// Reglas aplicadas:
//   - #11: función exportada + entrada en EMAIL_REGISTRY + trigger conectado
//     (POST /api/prelaunch/signup, solo lead NUEVO, fire-and-forget).
//   - #34: números de dinero con condición + vigencia ("valores de lanzamiento,
//     sujetos a confirmación al momento del alta"). Sin fechas prometidas ni
//     montos de puntos.
//   - Canal de baja en el footer: responder el correo (Ley 25.326).

import { sendEmail, emailLayout } from "./email";

export type PrelaunchLeadRole = "COMERCIO" | "DRIVER" | "CLIENTE";

interface PrelaunchLeadEmailData {
    name?: string | null;
    businessName?: string | null;
}

const IG_BUTTON = `
<div style="text-align:center;margin:26px 0 6px 0">
    <a href="https://instagram.com/somosmoovy" style="display:inline-block;background:#e60012;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 28px;border-radius:10px">Seguinos en Instagram</a>
</div>`;

const FOOTER_BAJA = `
<p style="margin:0;color:#999;font-size:12px;line-height:1.5">Usamos tus datos solo para contactarte por Moovy.<br>Si quer&eacute;s que los borremos, respond&eacute; este correo y listo.</p>`;

function card(inner: string): string {
    return `<div style="background:#faf7f2;border-radius:12px;padding:18px 20px;margin:22px 0">${inner}</div>`;
}

function firstName(name?: string | null): string {
    return (name || "").trim().split(/\s+/)[0] || "";
}

export function buildPrelaunchLeadEmail(role: PrelaunchLeadRole, data: PrelaunchLeadEmailData): { subject: string; html: string } {
    const nombre = firstName(data.name);
    const saludo = (base: string) => (nombre ? `${base}, ${nombre}!` : `${base}!`);

    if (role === "COMERCIO") {
        const negocio = data.businessName?.trim();
        const subject = "Recibimos tu pre-registro en Moovy 🎉";
        const html = emailLayout(
            `
<h1 style="margin:0 0 14px 0;font-size:23px;font-weight:800;color:#1a1a1a">&iexcl;${saludo("Gracias por sumarte")}</h1>
<p style="margin:0 0 14px 0">Recibimos ${negocio ? `el pre-registro de <b>${negocio}</b>` : "tu pre-registro"} y ya est&aacute;s en la lista de <b>comercios fundadores</b> de Moovy.</p>
<p style="margin:0 0 6px 0"><b>&iquest;Qu&eacute; sigue?</b></p>
<p style="margin:0 0 14px 0">Te vamos a contactar por WhatsApp para sumarte. Estamos incorporando comercios de a poco, rubro por rubro, para que el lanzamiento salga bien para todos.</p>
${card('<p style="margin:0 0 8px 0;font-size:15px"><b style="color:#e60012">Tu beneficio de fundador:</b></p><p style="margin:0;font-size:15px">30 d&iacute;as gratis, sin tarjeta y sin permanencia. Despu&eacute;s, comisi&oacute;n desde el 10% que baja a medida que vend&eacute;s m&aacute;s.</p><p style="margin:10px 0 0 0;font-size:12px;color:#999">Valores de lanzamiento, sujetos a confirmaci&oacute;n al momento del alta.</p>')}
${IG_BUTTON}`,
            { footerExtra: FOOTER_BAJA }
        );
        return { subject, html };
    }

    if (role === "DRIVER") {
        const subject = "Ya estás en la lista de repartidores fundadores";
        const html = emailLayout(
            `
<h1 style="margin:0 0 14px 0;font-size:23px;font-weight:800;color:#1a1a1a">&iexcl;${saludo("Ya estás en la lista")}</h1>
<p style="margin:0 0 14px 0">Quedaste anotado entre los <b>repartidores fundadores</b> de Moovy: los primeros en salir a repartir en Ushuaia, con menos competencia por los pedidos.</p>
<p style="margin:0 0 6px 0"><b>&iquest;Qu&eacute; sigue?</b></p>
<p style="margin:0 0 14px 0">Te contactamos nosotros, sin filas ni tr&aacute;mites. La documentaci&oacute;n se carga despu&eacute;s, desde tu panel, cuando activemos tu cuenta.</p>
${card('<p style="margin:0;font-size:15px"><b style="color:#e60012">Repartir con Moovy es:</b> cobr&aacute;s al instante por MercadoPago, ves cu&aacute;nto paga cada pedido antes de aceptarlo y vos eleg&iacute;s cu&aacute;ndo salir.</p>')}
${IG_BUTTON}`,
            { footerExtra: FOOTER_BAJA }
        );
        return { subject, html };
    }

    // CLIENTE (waitlist)
    const subject = "Sos de los primeros MOOVERS 🛍️";
    const html = emailLayout(
        `
<h1 style="margin:0 0 14px 0;font-size:23px;font-weight:800;color:#1a1a1a">&iexcl;Sos de los primeros MOOVERS!</h1>
<p style="margin:0 0 14px 0">Ya quedaste anotado. Apenas Moovy abra en Ushuaia te va a llegar un aviso a este correo para que hagas tu primer pedido.</p>
${card('<p style="margin:0;font-size:15px"><b style="color:#e60012">Ser MOOVER tiene premio:</b> sum&aacute;s puntos con cada pedido, los canje&aacute;s por descuentos y env&iacute;os gratis, y los primeros arrancan con beneficios de bienvenida.</p>')}
<p style="margin:0 0 14px 0">Mientras tanto, si conoc&eacute;s a alguien que quiera pedir, pasale el dato: cuanto m&aacute;s seamos, antes abrimos.</p>
${IG_BUTTON}`,
        { footerExtra: FOOTER_BAJA }
    );
    return { subject, html };
}

/** Envía la confirmación de pre-registro al lead. Fire-and-forget en el caller. */
export async function sendPrelaunchLeadEmail(
    role: PrelaunchLeadRole,
    to: string,
    data: PrelaunchLeadEmailData
): Promise<boolean> {
    const { subject, html } = buildPrelaunchLeadEmail(role, data);
    return sendEmail({ to, subject, html, tag: `prelaunch-lead-${role.toLowerCase()}` });
}
