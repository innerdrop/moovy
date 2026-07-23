// MOOVY — Notificaciones a Telegram para el equipo (founder/ops).
// Rama: feat/notificacion-telegram-leads
//
// FAIL-SAFE por diseño:
//   - Sin TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID configuradas → no-op silencioso
//     (un entorno sin credenciales no rompe nada).
//   - Si Telegram falla o tarda (timeout 5s), se loguea y se sigue: JAMÁS
//     rompe el flujo que la disparó (patrón fire-and-forget, regla #32).
//
// Uso: eventos de NEGOCIO de bajo volumen (leads del pre-lanzamiento; post-launch:
// pedido sin repartidor, refund automático, webhook MP rechazado). Los errores
// técnicos van por Sentry — no duplicar acá.

import baseLogger from "@/lib/logger";

const logger = baseLogger.child({ module: "telegram" });

export async function sendTelegramNotification(text: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return; // entorno sin Telegram configurado: no-op

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            logger.warn({ status: res.status, body: body.slice(0, 200) }, "[telegram] sendMessage no-ok");
        }
    } catch (error) {
        logger.warn({ error }, "[telegram] error enviando notificación");
    }
}
