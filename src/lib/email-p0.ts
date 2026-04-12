/**
 * MOOVY — Emails P0 (obligatorios para lanzar)
 *
 * 24 funciones organizadas por categoría.
 * Todas usan el layout y helpers centralizados de email.ts.
 *
 * IMPORTANTE: Cada función debe ser llamada desde la ruta API correspondiente.
 * Ver CAMBIOS_COMPARTIDOS_EMAILS.md para los puntos de integración.
 */

import {
    sendEmail,
    emailLayout,
    emailButton,
    emailBadge,
    emailInfoBox,
    emailAlertBox,
    baseUrl,
    getAlertEmails,
} from "./email";

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 1 — ONBOARDING COMERCIO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * #6 — Solicitud de comercio recibida
 * Trigger: POST /api/auth/register/merchant éxito
 */
export async function sendMerchantRequestReceivedEmail(data: {
    email: string;
    businessName: string;
    contactName: string;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Solicitud Recibida', '#dbeafe', '#1e40af')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            &iexcl;Hola ${data.contactName}!
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Recibimos tu solicitud para registrar <strong>${data.businessName}</strong> en MOOVY.
            Nuestro equipo va a revisar tu informaci&oacute;n y documentaci&oacute;n en las pr&oacute;ximas 24-48 horas h&aacute;biles.
        </p>

        ${emailInfoBox(`
            <h4 style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">&iquest;Qu&eacute; sigue?</h4>
            <ol style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li>Verificamos tu documentaci&oacute;n fiscal y legal</li>
                <li>Revisamos que la informaci&oacute;n de tu comercio est&eacute; completa</li>
                <li>Te notificamos por email si tu tienda fue aprobada o si necesitamos algo m&aacute;s</li>
            </ol>
        `)}

        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 20px;">
            Si ten&eacute;s alguna duda, respond&eacute; este correo o escribinos por WhatsApp.
        </p>
    `);

    return sendEmail({
        to: data.email,
        subject: '📋 Recibimos tu solicitud de comercio - MOOVY',
        html,
        tag: 'merchant_request_received',
    });
}

/**
 * #9 — Tienda aprobada
 * Trigger: PUT /api/admin/merchants/[id] cuando se verifica
 */
export async function sendMerchantApprovedEmail(data: {
    email: string;
    businessName: string;
    contactName: string;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('¡Aprobada!', '#def7ec', '#03543f')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            &iexcl;Felicitaciones, ${data.contactName}! &#x1f389;
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Tu comercio <strong>${data.businessName}</strong> fue <strong style="color: #059669;">aprobado</strong> y ya est&aacute; activo en MOOVY.
            Los clientes ya pueden ver tu tienda y hacerte pedidos.
        </p>

        ${emailInfoBox(`
            <h4 style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">Pr&oacute;ximos pasos recomendados</h4>
            <ul style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li>Configur&aacute; tus horarios de atenci&oacute;n</li>
                <li>Agreg&aacute; tus productos al cat&aacute;logo</li>
                <li>Vincul&aacute; tu cuenta de MercadoPago para recibir pagos</li>
                <li>Activ&aacute; las notificaciones push para no perderte pedidos</li>
            </ul>
        `)}

        ${emailButton('Ir a mi panel de comercio', `${baseUrl}/comercios`, 'green')}
    `);

    return sendEmail({
        to: data.email,
        subject: '🎉 ¡Tu comercio fue aprobado en MOOVY!',
        html,
        tag: 'merchant_approved',
    });
}

/**
 * #10 — Tienda rechazada
 * Trigger: PUT /api/admin/merchants/[id] cuando se rechaza
 */
export async function sendMerchantRejectedEmail(data: {
    email: string;
    businessName: string;
    contactName: string;
    reason?: string;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Solicitud No Aprobada', '#fef2f2', '#991b1b')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Hola ${data.contactName}
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Lamentamos informarte que la solicitud de tu comercio <strong>${data.businessName}</strong>
            no pudo ser aprobada en este momento.
        </p>

        ${data.reason ? emailAlertBox(`
            <h4 style="margin: 0 0 8px 0; font-size: 14px;">Motivo</h4>
            <p style="margin: 0; font-size: 14px;">${data.reason}</p>
        `, 'warning') : ''}

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Pod&eacute;s corregir la informaci&oacute;n y volver a intentarlo, o contactarnos si cre&eacute;s que hubo un error.
        </p>

        ${emailButton('Contactar Soporte', `${baseUrl}/ayuda`, 'blue')}
    `);

    return sendEmail({
        to: data.email,
        subject: '📋 Actualización sobre tu solicitud de comercio - MOOVY',
        html,
        tag: 'merchant_rejected',
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 1 — ONBOARDING REPARTIDOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * #14 — Solicitud de repartidor recibida (al repartidor)
 * Trigger: POST /api/auth/activate-driver éxito (además del email al admin que ya existe)
 */
export async function sendDriverRequestReceivedEmail(data: {
    email: string;
    driverName: string;
    vehicleType?: string;
}) {
    const vehicleLabel: Record<string, string> = {
        bicycle: 'Bicicleta',
        motorcycle: 'Moto',
        car: 'Auto',
        van: 'Camioneta',
    };

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Solicitud Recibida', '#dbeafe', '#1e40af')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            &iexcl;Hola ${data.driverName}!
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Recibimos tu solicitud para ser repartidor MOOVY${data.vehicleType ? ` con <strong>${vehicleLabel[data.vehicleType] || data.vehicleType}</strong>` : ''}.
            Nuestro equipo va a revisar tu documentaci&oacute;n en las pr&oacute;ximas 24-48 horas h&aacute;biles.
        </p>

        ${emailInfoBox(`
            <h4 style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">&iquest;Qu&eacute; revisamos?</h4>
            <ul style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li>DNI (frente y dorso)</li>
                <li>Licencia de conducir (si aplica)</li>
                <li>Seguro del veh&iacute;culo (si aplica)</li>
                <li>Datos fiscales (CUIT)</li>
            </ul>
        `)}

        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 20px;">
            Te notificaremos por email cuando tu solicitud sea revisada.
        </p>
    `);

    return sendEmail({
        to: data.email,
        subject: '📋 Recibimos tu solicitud de repartidor - MOOVY',
        html,
        tag: 'driver_request_received',
    });
}

/**
 * #18 — Repartidor rechazado
 * Trigger: PUT /api/admin/drivers/[id]/reject (o equivalente)
 */
export async function sendDriverRejectedEmail(data: {
    email: string;
    driverName: string;
    reason?: string;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Solicitud No Aprobada', '#fef2f2', '#991b1b')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Hola ${data.driverName}
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Lamentamos informarte que tu solicitud para ser repartidor en MOOVY
            no pudo ser aprobada en este momento.
        </p>

        ${data.reason ? emailAlertBox(`
            <h4 style="margin: 0 0 8px 0; font-size: 14px;">Motivo</h4>
            <p style="margin: 0; font-size: 14px;">${data.reason}</p>
        `, 'warning') : ''}

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Pod&eacute;s actualizar tu documentaci&oacute;n y volver a postularte,
            o contactarnos si cre&eacute;s que hubo un error.
        </p>

        ${emailButton('Contactar Soporte', `${baseUrl}/ayuda`, 'blue')}
    `);

    return sendEmail({
        to: data.email,
        subject: '📋 Actualización sobre tu solicitud de repartidor - MOOVY',
        html,
        tag: 'driver_rejected',
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 3 — CICLO DE VIDA DEL PEDIDO (COMPRADOR)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * #34 — Pago pendiente (MercadoPago)
 * Trigger: Webhook MP con status "in_process" o "pending"
 */
export async function sendPaymentPendingEmail(data: {
    email: string;
    customerName: string;
    orderNumber: string;
    total: number;
    paymentMethod: string;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Pago Pendiente', '#fffbeb', '#92400e')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Tu pago est&aacute; en proceso, ${data.customerName}
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Recibimos tu pedido <strong>#${data.orderNumber}</strong> pero el pago a&uacute;n est&aacute; pendiente de confirmaci&oacute;n.
        </p>

        ${emailInfoBox(`
            <table style="width: 100%;">
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Pedido</td>
                    <td style="text-align: right; color: #2d3748; font-weight: 500;">#${data.orderNumber}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Total</td>
                    <td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px;">$${data.total.toLocaleString('es-AR')}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">M&eacute;todo</td>
                    <td style="text-align: right; color: #2d3748;">${data.paymentMethod}</td>
                </tr>
            </table>
        `)}

        ${emailAlertBox(`
            <p style="margin: 0; font-size: 14px;">
                <strong>No te preocupes.</strong> Algunos m&eacute;todos de pago pueden demorar unos minutos en confirmarse.
                Te avisaremos apenas se acredite.
            </p>
        `, 'info')}

        ${emailButton('Ver mi pedido', `${baseUrl}/mis-pedidos`)}
    `);

    return sendEmail({
        to: data.email,
        subject: `⏳ Pago pendiente - Pedido #${data.orderNumber}`,
        html,
        tag: 'payment_pending',
    });
}

/**
 * #35 — Pago rechazado
 * Trigger: Webhook MP con status "rejected"
 */
export async function sendPaymentRejectedEmail(data: {
    email: string;
    customerName: string;
    orderNumber: string;
    total: number;
    reason?: string;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Pago Rechazado', '#fef2f2', '#991b1b')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Tu pago no pudo ser procesado
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Hola ${data.customerName}, lamentablemente el pago de tu pedido <strong>#${data.orderNumber}</strong>
            por <strong style="color: #e60012;">$${data.total.toLocaleString('es-AR')}</strong> fue rechazado.
        </p>

        ${data.reason ? emailAlertBox(`
            <p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> ${data.reason}</p>
        `, 'error') : ''}

        ${emailInfoBox(`
            <h4 style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">&iquest;Qu&eacute; pod&eacute;s hacer?</h4>
            <ul style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li>Verific&aacute; que tu tarjeta tenga fondos suficientes</li>
                <li>Intent&aacute; con otro medio de pago</li>
                <li>Contact&aacute; a tu banco si el problema persiste</li>
            </ul>
        `)}

        ${emailButton('Reintentar compra', `${baseUrl}/tienda`)}
    `);

    return sendEmail({
        to: data.email,
        subject: `❌ Pago rechazado - Pedido #${data.orderNumber}`,
        html,
        tag: 'payment_rejected',
    });
}

/**
 * #37 — Pedido rechazado por comercio
 * Trigger: POST /api/orders/[id]/reject (comercio rechaza)
 */
export async function sendOrderRejectedByMerchantEmail(data: {
    email: string;
    customerName: string;
    orderNumber: string;
    merchantName: string;
    reason?: string;
    willRefund: boolean;
    total: number;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Pedido Rechazado', '#fef2f2', '#991b1b')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Tu pedido fue cancelado por el comercio
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Hola ${data.customerName}, lamentablemente <strong>${data.merchantName}</strong>
            no pudo aceptar tu pedido <strong>#${data.orderNumber}</strong>.
        </p>

        ${data.reason ? emailAlertBox(`
            <p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> ${data.reason}</p>
        `, 'warning') : ''}

        ${data.willRefund ? emailAlertBox(`
            <p style="margin: 0; font-size: 14px;">
                <strong>Reembolso:</strong> Se te devolver&aacute;n <strong>$${data.total.toLocaleString('es-AR')}</strong>
                autom&aacute;ticamente al medio de pago original. Puede demorar entre 2 y 10 d&iacute;as h&aacute;biles.
            </p>
        `, 'success') : ''}

        ${emailButton('Hacer otro pedido', `${baseUrl}/tienda`)}
    `);

    return sendEmail({
        to: data.email,
        subject: `📋 Tu pedido #${data.orderNumber} fue rechazado`,
        html,
        tag: 'order_rejected_merchant',
    });
}

/**
 * #41 — Pedido entregado
 * Trigger: Driver marca DELIVERED (POST /api/driver/status)
 */
export async function sendOrderDeliveredEmail(data: {
    email: string;
    customerName: string;
    orderNumber: string;
    total: number;
    deliveryTime?: string;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('¡Entregado!', '#def7ec', '#03543f')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            &iexcl;Tu pedido lleg&oacute;! &#x1f389;
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Hola ${data.customerName}, tu pedido <strong>#${data.orderNumber}</strong>
            por <strong>$${data.total.toLocaleString('es-AR')}</strong> fue entregado exitosamente.
            ${data.deliveryTime ? `Tiempo de entrega: <strong>${data.deliveryTime}</strong>.` : ''}
        </p>

        ${emailAlertBox(`
            <p style="margin: 0; font-size: 14px;">
                &#x2b50; <strong>&iquest;C&oacute;mo fue tu experiencia?</strong> Tu calificaci&oacute;n nos ayuda a mejorar
                y a reconocer a los mejores comercios y repartidores.
            </p>
        `, 'info')}

        ${emailButton('Calificar pedido', `${baseUrl}/mis-pedidos`)}

        <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 20px;">
            Si tuviste alg&uacute;n problema con tu pedido, contact&aacute; a soporte dentro de las 48 horas.
        </p>
    `);

    return sendEmail({
        to: data.email,
        subject: `✅ ¡Tu pedido #${data.orderNumber} fue entregado!`,
        html,
        tag: 'order_delivered',
    });
}

/**
 * #42 — Pedido cancelado por comprador
 * Trigger: POST /api/orders/[id]/cancel (comprador cancela)
 */
export async function sendOrderCancelledByBuyerEmail(data: {
    email: string;
    customerName: string;
    orderNumber: string;
    total: number;
    willRefund: boolean;
    paymentMethod: string;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Pedido Cancelado', '#f3f4f6', '#4b5563')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Cancelaste tu pedido
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Hola ${data.customerName}, confirmamos la cancelaci&oacute;n de tu pedido <strong>#${data.orderNumber}</strong>.
        </p>

        ${data.willRefund && data.paymentMethod !== 'cash' ? emailAlertBox(`
            <p style="margin: 0; font-size: 14px;">
                <strong>Reembolso:</strong> $${data.total.toLocaleString('es-AR')} ser&aacute;n devueltos
                a tu medio de pago original. Puede demorar entre 2 y 10 d&iacute;as h&aacute;biles.
            </p>
        `, 'success') : ''}

        ${emailButton('Volver a la tienda', `${baseUrl}/tienda`)}
    `);

    return sendEmail({
        to: data.email,
        subject: `Pedido #${data.orderNumber} cancelado`,
        html,
        tag: 'order_cancelled_buyer',
    });
}

/**
 * #43 — Pedido cancelado por comercio
 * Trigger: Comercio rechaza/cancela desde su panel
 */
export async function sendOrderCancelledByMerchantEmail(data: {
    email: string;
    customerName: string;
    orderNumber: string;
    merchantName: string;
    total: number;
    reason?: string;
    willRefund: boolean;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Pedido Cancelado', '#fef2f2', '#991b1b')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Tu pedido fue cancelado
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Hola ${data.customerName}, lamentablemente <strong>${data.merchantName}</strong>
            cancel&oacute; tu pedido <strong>#${data.orderNumber}</strong>.
        </p>

        ${data.reason ? emailAlertBox(`
            <p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> ${data.reason}</p>
        `, 'warning') : ''}

        ${data.willRefund ? emailAlertBox(`
            <p style="margin: 0; font-size: 14px;">
                <strong>Reembolso:</strong> Se te devolver&aacute;n <strong>$${data.total.toLocaleString('es-AR')}</strong>
                al medio de pago original. Puede demorar entre 2 y 10 d&iacute;as h&aacute;biles.
            </p>
        `, 'success') : ''}

        ${emailButton('Hacer otro pedido', `${baseUrl}/tienda`)}
    `);

    return sendEmail({
        to: data.email,
        subject: `📋 Tu pedido #${data.orderNumber} fue cancelado`,
        html,
        tag: 'order_cancelled_merchant',
    });
}

/**
 * #44 — Pedido cancelado por sistema (timeout, sin repartidor, etc.)
 * Trigger: Cron merchant-timeout o assignment-engine sin repartidor
 */
export async function sendOrderCancelledBySystemEmail(data: {
    email: string;
    customerName: string;
    orderNumber: string;
    total: number;
    reason: string;
    willRefund: boolean;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Pedido Cancelado', '#fef2f2', '#991b1b')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Tu pedido fue cancelado autom&aacute;ticamente
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Hola ${data.customerName}, lamentamos informarte que tu pedido <strong>#${data.orderNumber}</strong>
            fue cancelado autom&aacute;ticamente.
        </p>

        ${emailAlertBox(`
            <p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> ${data.reason}</p>
        `, 'warning')}

        ${data.willRefund ? emailAlertBox(`
            <p style="margin: 0; font-size: 14px;">
                <strong>Reembolso:</strong> $${data.total.toLocaleString('es-AR')} ser&aacute;n devueltos
                a tu medio de pago original. Puede demorar entre 2 y 10 d&iacute;as h&aacute;biles.
            </p>
        `, 'success') : ''}

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
            Disculp&aacute; las molestias. Pod&eacute;s intentar hacer tu pedido nuevamente.
        </p>

        ${emailButton('Reintentar pedido', `${baseUrl}/tienda`)}
    `);

    return sendEmail({
        to: data.email,
        subject: `⚠️ Pedido #${data.orderNumber} cancelado automáticamente`,
        html,
        tag: 'order_cancelled_system',
    });
}

/**
 * #45 — Reembolso procesado
 * Trigger: POST /api/ops/refund éxito
 */
export async function sendRefundProcessedEmail(data: {
    email: string;
    customerName: string;
    orderNumber: string;
    refundAmount: number;
    reason?: string;
    paymentMethod: string;
}) {
    const methodLabel = data.paymentMethod === 'mercadopago' ? 'MercadoPago' :
        data.paymentMethod === 'cash' ? 'Efectivo' : data.paymentMethod;

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Reembolso Procesado', '#def7ec', '#03543f')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Tu reembolso fue procesado
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Hola ${data.customerName}, confirmamos que procesamos el reembolso
            de tu pedido <strong>#${data.orderNumber}</strong>.
        </p>

        ${emailInfoBox(`
            <table style="width: 100%;">
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Monto reembolsado</td>
                    <td style="text-align: right; color: #059669; font-weight: bold; font-size: 18px;">$${data.refundAmount.toLocaleString('es-AR')}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Medio de devoluci&oacute;n</td>
                    <td style="text-align: right; color: #2d3748;">${methodLabel}</td>
                </tr>
                ${data.reason ? `<tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Motivo</td>
                    <td style="text-align: right; color: #2d3748;">${data.reason}</td>
                </tr>` : ''}
            </table>
        `)}

        ${emailAlertBox(`
            <p style="margin: 0; font-size: 14px;">
                El reembolso puede demorar entre <strong>2 y 10 d&iacute;as h&aacute;biles</strong>
                en reflejarse en tu cuenta, seg&uacute;n el medio de pago utilizado.
            </p>
        `, 'info')}

        ${emailButton('Ver mis pedidos', `${baseUrl}/mis-pedidos`)}
    `);

    return sendEmail({
        to: data.email,
        subject: `💸 Reembolso procesado - Pedido #${data.orderNumber}`,
        html,
        tag: 'refund_processed',
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 4 — CICLO DE VIDA DEL PEDIDO (COMERCIO)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * #51 — Nuevo pedido recibido (backup email para comercio)
 * Trigger: POST /api/orders éxito (junto con push/socket)
 */
export async function sendMerchantNewOrderEmail(data: {
    email: string;
    merchantName: string;
    orderNumber: string;
    customerName: string;
    total: number;
    itemCount: number;
    isPickup: boolean;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('🔔 Nuevo Pedido', '#dbeafe', '#1e40af')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            &iexcl;Ten&eacute;s un nuevo pedido!
        </h2>

        ${emailInfoBox(`
            <table style="width: 100%;">
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Pedido</td>
                    <td style="text-align: right; color: #2d3748; font-weight: bold;">#${data.orderNumber}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Cliente</td>
                    <td style="text-align: right; color: #2d3748;">${data.customerName}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Productos</td>
                    <td style="text-align: right; color: #2d3748;">${data.itemCount} item${data.itemCount > 1 ? 's' : ''}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Tipo</td>
                    <td style="text-align: right; color: #2d3748;">${data.isPickup ? 'Retiro en local' : 'Delivery'}</td>
                </tr>
                <tr>
                    <td style="color: #1a202c; font-weight: bold; font-size: 18px; padding: 15px 0 0 0;">Total</td>
                    <td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px; padding: 15px 0 0 0;">$${data.total.toLocaleString('es-AR')}</td>
                </tr>
            </table>
        `)}

        ${emailAlertBox(`
            <p style="margin: 0; font-size: 14px;">
                <strong>&#x23f0; Importante:</strong> Acept&aacute; o rechaz&aacute; el pedido lo antes posible.
                Si no respond&eacute;s, el pedido se cancelar&aacute; autom&aacute;ticamente.
            </p>
        `, 'warning')}

        ${emailButton('Ver pedido en mi panel', `${baseUrl}/comercios`, 'red')}
    `);

    return sendEmail({
        to: data.email,
        subject: `🔔 Nuevo pedido #${data.orderNumber} - $${data.total.toLocaleString('es-AR')}`,
        html,
        tag: 'merchant_new_order',
    });
}

/**
 * #52 — Recordatorio: pedido sin aceptar
 * Trigger: Cron merchant-timeout (antes de cancelar)
 */
export async function sendMerchantOrderReminderEmail(data: {
    email: string;
    merchantName: string;
    orderNumber: string;
    minutesSinceOrder: number;
    timeoutMinutes: number;
}) {
    const minutesLeft = Math.max(0, data.timeoutMinutes - data.minutesSinceOrder);

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('⚠️ Pedido Sin Respuesta', '#fffbeb', '#92400e')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Ten&eacute;s un pedido pendiente de aceptar
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            El pedido <strong>#${data.orderNumber}</strong> lleva <strong>${data.minutesSinceOrder} minutos</strong>
            sin respuesta. Si no lo acept&aacute;s en los pr&oacute;ximos <strong>${minutesLeft} minutos</strong>,
            se cancelar&aacute; autom&aacute;ticamente.
        </p>

        ${emailAlertBox(`
            <p style="margin: 0; font-size: 14px; font-weight: bold;">
                &#x23f0; Tiempo restante: ${minutesLeft} minutos
            </p>
        `, 'error')}

        ${emailButton('Aceptar pedido ahora', `${baseUrl}/comercios`, 'green')}
    `);

    return sendEmail({
        to: data.email,
        subject: `⚠️ ¡Pedido #${data.orderNumber} esperando tu respuesta!`,
        html,
        tag: 'merchant_order_reminder',
    });
}

/**
 * #76 — Pago recibido (confirmación al comercio)
 * Trigger: Webhook MP approved o pago cash confirmado
 */
export async function sendMerchantPaymentReceivedEmail(data: {
    email: string;
    merchantName: string;
    orderNumber: string;
    amount: number;
    commission: number;
    netAmount: number;
    paymentMethod: string;
}) {
    const methodLabel = data.paymentMethod === 'mercadopago' ? 'MercadoPago' :
        data.paymentMethod === 'cash' ? 'Efectivo' : data.paymentMethod;

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('💰 Pago Recibido', '#def7ec', '#03543f')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            &iexcl;Recibiste un pago!
        </h2>

        ${emailInfoBox(`
            <table style="width: 100%;">
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Pedido</td>
                    <td style="text-align: right; color: #2d3748; font-weight: 500;">#${data.orderNumber}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Monto bruto</td>
                    <td style="text-align: right; color: #2d3748;">$${data.amount.toLocaleString('es-AR')}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Comisi&oacute;n MOOVY</td>
                    <td style="text-align: right; color: #ef4444;">-$${data.commission.toLocaleString('es-AR')}</td>
                </tr>
                <tr>
                    <td style="color: #1a202c; font-weight: bold; font-size: 18px; padding: 15px 0 0 0;">Neto a cobrar</td>
                    <td style="text-align: right; color: #059669; font-weight: bold; font-size: 18px; padding: 15px 0 0 0;">$${data.netAmount.toLocaleString('es-AR')}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 12px; padding: 8px 0 0 0;">M&eacute;todo de pago</td>
                    <td style="text-align: right; color: #718096; font-size: 12px; padding: 8px 0 0 0;">${methodLabel}</td>
                </tr>
            </table>
        `)}

        ${emailButton('Ver mis ganancias', `${baseUrl}/comercios/pagos`, 'green')}
    `);

    return sendEmail({
        to: data.email,
        subject: `💰 Pago recibido por pedido #${data.orderNumber} - $${data.netAmount.toLocaleString('es-AR')}`,
        html,
        tag: 'merchant_payment_received',
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 9/10 — MODERACIÓN (COMERCIO Y REPARTIDOR)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * #102 — Tienda suspendida
 * Trigger: OPS suspende comercio desde panel
 */
export async function sendMerchantSuspendedEmail(data: {
    email: string;
    businessName: string;
    contactName: string;
    reason?: string;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Tienda Suspendida', '#fef2f2', '#991b1b')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Tu tienda fue suspendida
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Hola ${data.contactName}, tu comercio <strong>${data.businessName}</strong>
            fue suspendido temporalmente en MOOVY. Mientras est&eacute; suspendido,
            los clientes no podr&aacute;n ver tu tienda ni hacerte pedidos.
        </p>

        ${data.reason ? emailAlertBox(`
            <p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> ${data.reason}</p>
        `, 'error') : ''}

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Si cre&eacute;s que esto es un error o quer&eacute;s resolver la situaci&oacute;n,
            por favor contact&aacute; a nuestro equipo de soporte.
        </p>

        ${emailButton('Contactar Soporte', `${baseUrl}/ayuda`, 'blue')}
    `);

    return sendEmail({
        to: data.email,
        subject: '⚠️ Tu comercio fue suspendido - MOOVY',
        html,
        tag: 'merchant_suspended',
    });
}

/**
 * #109 — Cuenta de repartidor suspendida
 * Trigger: OPS suspende repartidor desde panel
 */
export async function sendDriverSuspendedEmail(data: {
    email: string;
    driverName: string;
    reason?: string;
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('Cuenta Suspendida', '#fef2f2', '#991b1b')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Tu cuenta de repartidor fue suspendida
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Hola ${data.driverName}, tu cuenta de repartidor en MOOVY fue suspendida temporalmente.
            Mientras est&eacute; suspendida, no recibir&aacute;s nuevos pedidos.
        </p>

        ${data.reason ? emailAlertBox(`
            <p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> ${data.reason}</p>
        `, 'error') : ''}

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Si cre&eacute;s que esto es un error o quer&eacute;s resolver la situaci&oacute;n,
            por favor contact&aacute; a nuestro equipo de soporte.
        </p>

        ${emailButton('Contactar Soporte', `${baseUrl}/ayuda`, 'blue')}
    `);

    return sendEmail({
        to: data.email,
        subject: '⚠️ Tu cuenta de repartidor fue suspendida - MOOVY',
        html,
        tag: 'driver_suspended',
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 11 — ADMINISTRATIVOS (ELIMINACIÓN DE CUENTA)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * #114 — Solicitud de eliminación de cuenta recibida
 * Trigger: POST /api/profile/delete
 */
export async function sendAccountDeletionRequestEmail(data: {
    email: string;
    userName: string;
    deletionDate: string;
}) {
    const html = emailLayout(`
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Solicitud de eliminaci&oacute;n de cuenta
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Hola ${data.userName}, recibimos tu solicitud para eliminar tu cuenta de MOOVY.
        </p>

        ${emailAlertBox(`
            <p style="margin: 0; font-size: 14px;">
                <strong>Tu cuenta y todos tus datos ser&aacute;n eliminados permanentemente
                el ${data.deletionDate}.</strong> Este proceso es irreversible.
            </p>
        `, 'warning')}

        ${emailInfoBox(`
            <h4 style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">Datos que se eliminar&aacute;n:</h4>
            <ul style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li>Informaci&oacute;n personal y de perfil</li>
                <li>Historial de pedidos</li>
                <li>Puntos MOOVER acumulados</li>
                <li>Favoritos y preferencias</li>
            </ul>
        `)}

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
            Si no solicitaste esto o cambiaste de opini&oacute;n, contact&aacute; a soporte
            antes de la fecha indicada para cancelar la eliminaci&oacute;n.
        </p>

        ${emailButton('Contactar Soporte', `${baseUrl}/ayuda`, 'blue')}
    `);

    return sendEmail({
        to: data.email,
        subject: '⚠️ Solicitud de eliminación de cuenta - MOOVY',
        html,
        tag: 'account_deletion_request',
    });
}

/**
 * #115 — Cuenta eliminada (confirmación final)
 * Trigger: Proceso de eliminación completado
 */
export async function sendAccountDeletedEmail(data: {
    email: string;
    userName: string;
}) {
    const html = emailLayout(`
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Tu cuenta fue eliminada
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Hola ${data.userName}, confirmamos que tu cuenta de MOOVY y todos tus datos personales
            fueron eliminados permanentemente de nuestros sistemas, en cumplimiento con la
            Ley 25.326 de Protecci&oacute;n de Datos Personales.
        </p>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Lamentamos verte partir. Si en el futuro quer&eacute;s volver a usar MOOVY,
            pod&eacute;s crear una cuenta nueva en cualquier momento.
        </p>

        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            Este es el &uacute;ltimo correo que recibir&aacute;s de MOOVY.
        </p>
    `);

    return sendEmail({
        to: data.email,
        subject: 'Confirmación: tu cuenta fue eliminada - MOOVY',
        html,
        tag: 'account_deleted',
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 13 — EMAILS PARA EL OWNER DE MOOVY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * #135/#136/#137/#145 — Alerta crítica genérica para el owner
 * Trigger: Health checks, webhooks, errores críticos
 */
export async function sendOwnerCriticalAlertEmail(data: {
    alertType: 'payment_gateway_down' | 'webhooks_failing' | 'split_payment_failed' | 'server_down' | 'generic';
    title: string;
    description: string;
    details?: string;
    severity: 'critical' | 'high' | 'medium';
}) {
    const severityConfig = {
        critical: { badge: '🔴 CRÍTICO', bg: '#fef2f2', color: '#991b1b' },
        high: { badge: '🟠 ALTO', bg: '#fffbeb', color: '#92400e' },
        medium: { badge: '🟡 MEDIO', bg: '#eff6ff', color: '#1e40af' },
    };
    const sev = severityConfig[data.severity];

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge(sev.badge, sev.bg, sev.color)}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            ${data.title}
        </h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            ${data.description}
        </p>

        ${data.details ? emailInfoBox(`
            <h4 style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">Detalles t&eacute;cnicos</h4>
            <pre style="background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; color: #334155; overflow-x: auto; white-space: pre-wrap; margin: 0;">${data.details}</pre>
        `) : ''}

        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">
            Alerta generada autom&aacute;ticamente el ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Ushuaia' })}
        </p>

        ${emailButton('Ir al panel OPS', `${baseUrl}/ops`, 'red')}
    `);

    const recipients = await getAlertEmails();
    const results = await Promise.all(
        recipients.map(to => sendEmail({
            to,
            subject: `[${sev.badge}] ${data.title} - MOOVY`,
            html,
            tag: `owner_alert_${data.alertType}`,
        }))
    );
    return results.every(Boolean);
}

/**
 * #161 — Pedidos sin repartidor
 * Trigger: Cron o alerta automática cuando hay pedidos sin asignar
 */
export async function sendOwnerUnassignedOrdersEmail(data: {
    unassignedCount: number;
    oldestOrderMinutes: number;
    orderNumbers: string[];
}) {
    const orderList = data.orderNumbers.slice(0, 10).map(n => `#${n}`).join(', ');

    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('🟠 Pedidos Sin Repartidor', '#fffbeb', '#92400e')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            ${data.unassignedCount} pedido${data.unassignedCount > 1 ? 's' : ''} sin repartidor asignado
        </h2>

        ${emailAlertBox(`
            <p style="margin: 0; font-size: 14px;">
                <strong>${data.unassignedCount} pedido${data.unassignedCount > 1 ? 's' : ''}</strong>
                est&aacute;${data.unassignedCount > 1 ? 'n' : ''} esperando repartidor.
                El m&aacute;s antiguo lleva <strong>${data.oldestOrderMinutes} minutos</strong>.
            </p>
        `, 'warning')}

        ${emailInfoBox(`
            <p style="color: #718096; font-size: 14px; margin: 0;">
                <strong>Pedidos afectados:</strong> ${orderList}${data.orderNumbers.length > 10 ? ` y ${data.orderNumbers.length - 10} m&aacute;s` : ''}
            </p>
        `)}

        ${emailButton('Ver pedidos en OPS', `${baseUrl}/ops/pedidos`, 'red')}
    `);

    const recipients = await getAlertEmails();
    const results = await Promise.all(
        recipients.map(to => sendEmail({
            to,
            subject: `🟠 ${data.unassignedCount} pedidos sin repartidor - MOOVY`,
            html,
            tag: 'owner_unassigned_orders',
        }))
    );
    return results.every(Boolean);
}

/**
 * #167 — Reporte diario resumido
 * Trigger: Cron diario (8 AM)
 */
export async function sendOwnerDailyReportEmail(data: {
    date: string;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    totalCommission: number;
    newUsers: number;
    newMerchants: number;
    newDrivers: number;
    avgDeliveryTime?: number;
    topMerchant?: { name: string; orders: number };
}) {
    const completionRate = data.totalOrders > 0 ? Math.round((data.completedOrders / data.totalOrders) * 100) : 0;

    const html = emailLayout(`
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            &#x1f4ca; Reporte Diario — ${data.date}
        </h2>

        <!-- KPIs principales -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin: 20px 0;">
            <tr>
                <td style="background: #eff6ff; border-radius: 10px; padding: 16px; text-align: center; width: 33%;">
                    <div style="color: #1e40af; font-size: 28px; font-weight: bold;">${data.totalOrders}</div>
                    <div style="color: #3b82f6; font-size: 12px; text-transform: uppercase;">Pedidos</div>
                </td>
                <td style="background: #f0fdf4; border-radius: 10px; padding: 16px; text-align: center; width: 33%;">
                    <div style="color: #166534; font-size: 28px; font-weight: bold;">$${data.totalRevenue.toLocaleString('es-AR')}</div>
                    <div style="color: #22c55e; font-size: 12px; text-transform: uppercase;">Facturaci&oacute;n</div>
                </td>
                <td style="background: #fef3c7; border-radius: 10px; padding: 16px; text-align: center; width: 33%;">
                    <div style="color: #92400e; font-size: 28px; font-weight: bold;">$${data.totalCommission.toLocaleString('es-AR')}</div>
                    <div style="color: #f59e0b; font-size: 12px; text-transform: uppercase;">Comisi&oacute;n</div>
                </td>
            </tr>
        </table>

        ${emailInfoBox(`
            <table style="width: 100%;">
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 6px 0;">Pedidos completados</td>
                    <td style="text-align: right; color: #059669; font-weight: 500;">${data.completedOrders} (${completionRate}%)</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 6px 0;">Pedidos cancelados</td>
                    <td style="text-align: right; color: #ef4444; font-weight: 500;">${data.cancelledOrders}</td>
                </tr>
                ${data.avgDeliveryTime ? `<tr>
                    <td style="color: #718096; font-size: 14px; padding: 6px 0;">Tiempo promedio entrega</td>
                    <td style="text-align: right; color: #2d3748; font-weight: 500;">${data.avgDeliveryTime} min</td>
                </tr>` : ''}
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 6px 0;">Nuevos usuarios</td>
                    <td style="text-align: right; color: #2d3748; font-weight: 500;">${data.newUsers}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 6px 0;">Nuevos comercios</td>
                    <td style="text-align: right; color: #2d3748; font-weight: 500;">${data.newMerchants}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 6px 0;">Nuevos repartidores</td>
                    <td style="text-align: right; color: #2d3748; font-weight: 500;">${data.newDrivers}</td>
                </tr>
                ${data.topMerchant ? `<tr>
                    <td style="color: #718096; font-size: 14px; padding: 6px 0;">Top comercio</td>
                    <td style="text-align: right; color: #2d3748; font-weight: 500;">${data.topMerchant.name} (${data.topMerchant.orders} pedidos)</td>
                </tr>` : ''}
            </table>
        `)}

        ${emailButton('Ver dashboard completo', `${baseUrl}/ops/revenue`, 'blue')}
    `);

    const recipients = await getAlertEmails();
    const results = await Promise.all(
        recipients.map(to => sendEmail({
            to,
            subject: `📊 Reporte diario MOOVY — ${data.date}`,
            html,
            tag: 'owner_daily_report',
        }))
    );
    return results.every(Boolean);
}

/**
 * #174 — Solicitud de eliminación de datos (al owner para compliance)
 * Trigger: POST /api/profile/delete
 */
export async function sendOwnerDataDeletionRequestEmail(data: {
    userName: string;
    userEmail: string;
    userId: string;
    requestDate: string;
    roles: string[];
}) {
    const html = emailLayout(`
        <div style="text-align: center; margin-bottom: 20px;">
            ${emailBadge('📋 Solicitud ARCO', '#eff6ff', '#1e40af')}
        </div>
        <h2 style="color: #111827; margin-top: 0; text-align: center;">
            Solicitud de eliminaci&oacute;n de datos personales
        </h2>

        ${emailAlertBox(`
            <p style="margin: 0; font-size: 14px;">
                <strong>Plazo legal:</strong> 10 d&iacute;as h&aacute;biles para completar la eliminaci&oacute;n
                (Ley 25.326, Art. 16).
            </p>
        `, 'warning')}

        ${emailInfoBox(`
            <table style="width: 100%;">
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Usuario</td>
                    <td style="text-align: right; color: #2d3748;">${data.userName}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Email</td>
                    <td style="text-align: right; color: #2d3748;">${data.userEmail}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">ID</td>
                    <td style="text-align: right; color: #2d3748; font-family: monospace; font-size: 12px;">${data.userId}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Roles</td>
                    <td style="text-align: right; color: #2d3748;">${data.roles.join(', ')}</td>
                </tr>
                <tr>
                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Fecha solicitud</td>
                    <td style="text-align: right; color: #2d3748;">${data.requestDate}</td>
                </tr>
            </table>
        `)}

        ${emailButton('Ver en panel OPS', `${baseUrl}/ops/clientes`, 'red')}
    `);

    const recipients = await getAlertEmails();
    const results = await Promise.all(
        recipients.map(to => sendEmail({
            to,
            subject: `📋 [COMPLIANCE] Solicitud eliminación de datos - ${data.userName}`,
            html,
            tag: 'owner_data_deletion_request',
        }))
    );
    return results.every(Boolean);
}

// ─── RECUPERACIÓN DE CARRITOS ───────────────────────────────────────────────

/**
 * Email de carrito abandonado — recordatorio al comprador
 * Se envía 2h después del abandono (1er recordatorio) y 24h (2do).
 * El 2do tiene urgencia incrementada.
 */
export async function sendCartAbandonmentEmail(data: {
    email: string;
    userName: string;
    items: Array<{ name: string; price: number; quantity: number; image?: string }>;
    totalItems: number;
    totalValue: number;
    isSecondReminder: boolean;
    checkoutUrl: string;
}): Promise<boolean> {
    const formatPrice = (price: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

    // Build items HTML (max 5 shown)
    const itemsHtml = data.items.map(item => `
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;">
                <strong style="color: #2d3748;">${item.name}</strong>
                ${item.quantity > 1 ? `<span style="color: #718096; font-size: 13px;"> × ${item.quantity}</span>` : ''}
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; text-align: right; color: #2d3748; font-weight: 600;">
                ${formatPrice(item.price * item.quantity)}
            </td>
        </tr>
    `).join('');

    const moreItemsText = data.totalItems > data.items.length
        ? `<p style="color: #718096; font-size: 13px; text-align: center; margin-top: 8px;">
            y ${data.totalItems - data.items.length} producto${data.totalItems - data.items.length > 1 ? 's' : ''} más...
           </p>`
        : '';

    const subject = data.isSecondReminder
        ? `¡Tu carrito te espera, ${data.userName}! 🛒`
        : `${data.userName}, dejaste algo en tu carrito 🛒`;

    const heading = data.isSecondReminder
        ? `<h2 style="color: #2d3748; font-size: 22px; margin: 0 0 10px;">¡Tus productos siguen esperándote!</h2>
           <p style="color: #718096; margin: 0 0 20px;">No te quedes sin ellos — otros compradores también los están viendo.</p>`
        : `<h2 style="color: #2d3748; font-size: 22px; margin: 0 0 10px;">¿Te olvidaste de algo?</h2>
           <p style="color: #718096; margin: 0 0 20px;">Guardamos tu carrito para que puedas completar tu pedido cuando quieras.</p>`;

    const html = emailLayout(`
        ${emailBadge('Tu carrito', '#FEF3C7', '#92400E')}

        ${heading}

        ${emailInfoBox(`
            <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
                <tr>
                    <td style="padding: 14px 0 0; font-weight: 700; color: #2d3748; font-size: 16px;">Total</td>
                    <td style="padding: 14px 0 0; text-align: right; font-weight: 700; color: #e60012; font-size: 16px;">${formatPrice(data.totalValue)}</td>
                </tr>
            </table>
            ${moreItemsText}
        `)}

        ${emailButton('Completar mi pedido', data.checkoutUrl, 'red')}

        <p style="color: #a0aec0; font-size: 12px; text-align: center; margin-top: 20px;">
            Si ya completaste tu compra, podés ignorar este mensaje.
        </p>
    `);

    return sendEmail({
        to: data.email,
        subject,
        html,
        tag: data.isSecondReminder ? 'cart_abandonment_2nd' : 'cart_abandonment_1st'
    });
}
