/**
 * MOOVY — Registro centralizado de todos los emails del sistema
 *
 * Este archivo define metadata + datos de ejemplo para cada email.
 * Se usa en:
 *   1. Panel OPS de gestión de emails (/ops/emails)
 *   2. API de preview (/api/ops/emails/preview)
 */

import { emailLayout, emailButton, emailBadge, emailInfoBox, emailAlertBox, baseUrl } from "./email";

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface EmailRegistryEntry {
    id: string;
    number: number;          // # del audit
    name: string;
    category: string;
    recipient: 'comprador' | 'comercio' | 'repartidor' | 'admin' | 'owner';
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    status: 'implemented' | 'new' | 'partial';
    trigger: string;
    subject: string;
    functionName: string;
    file: string;
    /** Genera el HTML de preview con datos de ejemplo */
    generatePreview: () => string;
}

// ─── Datos de ejemplo ───────────────────────────────────────────────────────

const SAMPLE = {
    buyerName: 'María López',
    buyerEmail: 'maria@ejemplo.com',
    merchantName: 'Panadería Don Juan',
    merchantContact: 'Juan Pérez',
    merchantEmail: 'contacto@donjuan.com',
    driverName: 'Carlos Gómez',
    driverEmail: 'carlos@ejemplo.com',
    orderNumber: 'MOV-20260320-001',
    referralCode: 'MARIA2026',
    total: 4500,
    subtotal: 3800,
    deliveryFee: 500,
    discount: 200,
    commission: 360,
    netAmount: 3640,
};

// ─── Registro ───────────────────────────────────────────────────────────────

export const EMAIL_REGISTRY: EmailRegistryEntry[] = [
    // ── IMPLEMENTADOS (existentes) ──────────────────────────────────────
    {
        id: 'welcome',
        number: 1,
        name: 'Bienvenida comprador',
        category: 'Registro y Onboarding',
        recipient: 'comprador',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/auth/register',
        subject: '¡Bienvenido a MOOVY! 🎉',
        functionName: 'sendWelcomeEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => {
            return emailLayout(`
                <h2 style="color: #111827; margin-top: 0;">¡Hola ${SAMPLE.buyerName}! 👋</h2>
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                    ¡Bienvenido a la comunidad MOOVY! Ya podés empezar a disfrutar de todos los beneficios.
                </p>
                <div style="background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%); border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <h3 style="color: #b45309; margin: 0 0 10px 0; font-size: 16px;">⭐ Tu código de referido</h3>
                    <p style="color: #78350f; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">${SAMPLE.referralCode}</p>
                    <p style="color: #92400e; font-size: 12px; margin: 8px 0 0 0;">Compartílo y gana puntos MOOVER cuando tus amigos compren</p>
                </div>
                <h3 style="color: #111827; font-size: 16px; margin-top: 25px;">¿Qué podés hacer con MOOVY?</h3>
                <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                    <li>🛍️ <strong>Comprar</strong> en comercios locales</li>
                    <li>🚀 <strong>Recibir</strong> tus pedidos en minutos</li>
                    <li>⭐ <strong>Sumar puntos MOOVER</strong> con cada compra</li>
                    <li>🎁 <strong>Canjear</strong> tus puntos por descuentos exclusivos</li>
                    <li>👥 <strong>Referir amigos</strong> y ganar más puntos</li>
                </ul>
                ${emailButton('Empezar a comprar', `${baseUrl}/tienda`)}
            `);
        },
    },
    {
        id: 'order_confirmation',
        number: 32,
        name: 'Pedido confirmado',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/orders + Webhook MP',
        subject: `¡Confirmación de tu pedido ${SAMPLE.orderNumber}! 🛍️`,
        functionName: 'sendOrderConfirmationEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => {
            return emailLayout(`
                <div style="text-align: center; margin-bottom: 25px;">
                    ${emailBadge('Pedido Confirmado', '#def7ec', '#03543f')}
                    <h2 style="color: #111827; margin-top: 0;">¡Gracias por tu compra, ${SAMPLE.buyerName}!</h2>
                    <p style="color: #6b7280; font-size: 16px;">Recibimos tu pedido <strong>#${SAMPLE.orderNumber}</strong> y ya estamos trabajando en él.</p>
                </div>
                ${emailInfoBox(`
                    <h3 style="color: #1a202c; font-size: 16px; margin-top: 0; margin-bottom: 15px;">Resumen del Pedido</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #4a5568;">Hamburguesa clásica<div style="font-size: 12px; color: #a0aec0;">x2</div></td><td style="text-align: right; color: #2d3748; font-weight: 500;">$2.400</td></tr>
                        <tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #4a5568;">Coca-Cola 500ml<div style="font-size: 12px; color: #a0aec0;">x2</div></td><td style="text-align: right; color: #2d3748; font-weight: 500;">$1.400</td></tr>
                    </table>
                    <table style="width: 100%; margin-top: 15px;">
                        <tr><td style="color: #718096; font-size: 14px;">Subtotal</td><td style="text-align: right; color: #2d3748;">$${SAMPLE.subtotal.toLocaleString('es-AR')}</td></tr>
                        <tr><td style="color: #718096; font-size: 14px;">Envío</td><td style="text-align: right; color: #2d3748;">$${SAMPLE.deliveryFee.toLocaleString('es-AR')}</td></tr>
                        <tr><td style="color: #e53e3e; font-size: 14px;">Descuento</td><td style="text-align: right; color: #e53e3e;">-$${SAMPLE.discount.toLocaleString('es-AR')}</td></tr>
                        <tr><td style="color: #1a202c; font-weight: bold; font-size: 18px; padding-top: 15px;">Total</td><td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px; padding-top: 15px;">$${SAMPLE.total.toLocaleString('es-AR')}</td></tr>
                    </table>
                `)}
                ${emailButton('Ver estado de mi pedido', `${baseUrl}/mis-pedidos`)}
            `);
        },
    },
    {
        id: 'password_reset',
        number: 20,
        name: 'Recuperar contraseña',
        category: 'Autenticación y Seguridad',
        recipient: 'comprador',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/auth/forgot-password',
        subject: 'Restablecer contraseña - MOOVY',
        functionName: 'sendPasswordResetEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Restablecer contraseña</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer tu contraseña.
                Hacé click en el botón de abajo para crear una nueva contraseña.
            </p>
            ${emailButton('Restablecer Contraseña', '#')}
            <p style="color: #9ca3af; font-size: 14px;">
                Este enlace expirará en 1 hora. Si no solicitaste restablecer tu contraseña, podés ignorar este correo.
            </p>
        `),
    },
    {
        id: 'password_changed',
        number: 21,
        name: 'Contraseña cambiada',
        category: 'Autenticación y Seguridad',
        recipient: 'comprador',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/auth/change-password',
        subject: 'Tu contraseña fue modificada - MOOVY',
        functionName: 'sendPasswordChangedEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Contraseña actualizada</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Tu contraseña fue cambiada exitosamente el <strong>20/03/2026 a las 14:30</strong>.
            </p>
            ${emailAlertBox(`
                <p style="margin: 0; font-size: 14px;">
                    <strong>¿No fuiste vos?</strong> Si no realizaste este cambio, contactá a soporte inmediatamente.
                </p>
            `, 'warning')}
            ${emailButton('Contactar Soporte', `${baseUrl}/ayuda`, 'red')}
        `),
    },
    {
        id: 'driver_request_admin',
        number: 157,
        name: 'Solicitud repartidor (→ admin)',
        category: 'Registro y Onboarding',
        recipient: 'admin',
        priority: 'P1',
        status: 'implemented',
        trigger: 'POST /api/auth/activate-driver',
        subject: '🚗 Nueva solicitud de repartidor',
        functionName: 'sendDriverRequestNotification',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Nueva solicitud de repartidor</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Un usuario quiere ser repartidor en MOOVY:</p>
            ${emailInfoBox(`
                <p style="margin: 5px 0; color: #4a5568;"><strong>Nombre:</strong> ${SAMPLE.driverName}</p>
                <p style="margin: 5px 0; color: #4a5568;"><strong>Email:</strong> ${SAMPLE.driverEmail}</p>
            `)}
            ${emailButton('Ir al panel OPS', `${baseUrl}/ops/repartidores`, 'blue')}
        `),
    },
    {
        id: 'driver_approved',
        number: 17,
        name: 'Repartidor aprobado',
        category: 'Registro y Onboarding',
        recipient: 'repartidor',
        priority: 'P0',
        status: 'implemented',
        trigger: 'PUT /api/admin/drivers/[id]/approve',
        subject: '🎉 ¡Tu solicitud de repartidor fue aprobada!',
        functionName: 'sendDriverApprovalEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">¡Bienvenido al equipo, ${SAMPLE.driverName}! 🚗</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Tu solicitud para ser repartidor MOOVY fue <strong style="color: #059669;">aprobada</strong>.
                Ya podés conectarte desde tu panel y empezar a recibir pedidos.
            </p>
            ${emailButton('Ir al panel de repartidor', `${baseUrl}/repartidor`, 'green')}
        `),
    },

    // ── NUEVOS P0 ───────────────────────────────────────────────────────
    {
        id: 'merchant_request_received',
        number: 6,
        name: 'Solicitud de comercio recibida',
        category: 'Registro y Onboarding',
        recipient: 'comercio',
        priority: 'P0',
        status: 'new',
        trigger: 'POST /api/auth/register/merchant',
        subject: '📋 Recibimos tu solicitud de comercio - MOOVY',
        functionName: 'sendMerchantRequestReceivedEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Solicitud Recibida', '#dbeafe', '#1e40af')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Hola ${SAMPLE.merchantContact}!</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Recibimos tu solicitud para registrar <strong>${SAMPLE.merchantName}</strong> en MOOVY.
                Nuestro equipo va a revisar tu información y documentación en las próximas 24-48 horas hábiles.
            </p>
            ${emailInfoBox(`
                <h4 style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">¿Qué sigue?</h4>
                <ol style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                    <li>Verificamos tu documentación fiscal y legal</li>
                    <li>Revisamos que la información de tu comercio esté completa</li>
                    <li>Te notificamos por email si tu tienda fue aprobada</li>
                </ol>
            `)}
        `),
    },
    {
        id: 'merchant_approved',
        number: 9,
        name: 'Tienda aprobada',
        category: 'Registro y Onboarding',
        recipient: 'comercio',
        priority: 'P0',
        status: 'new',
        trigger: 'PUT /api/admin/merchants/[id] (verificar)',
        subject: '🎉 ¡Tu comercio fue aprobado en MOOVY!',
        functionName: 'sendMerchantApprovedEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('¡Aprobada!', '#def7ec', '#03543f')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Felicitaciones, ${SAMPLE.merchantContact}! 🎉</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Tu comercio <strong>${SAMPLE.merchantName}</strong> fue <strong style="color: #059669;">aprobado</strong> y ya está activo en MOOVY.
            </p>
            ${emailButton('Ir a mi panel de comercio', `${baseUrl}/comercios`, 'green')}
        `),
    },
    {
        id: 'merchant_rejected',
        number: 10,
        name: 'Tienda rechazada',
        category: 'Registro y Onboarding',
        recipient: 'comercio',
        priority: 'P0',
        status: 'new',
        trigger: 'PUT /api/admin/merchants/[id] (rechazar)',
        subject: '📋 Actualización sobre tu solicitud de comercio - MOOVY',
        functionName: 'sendMerchantRejectedEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Solicitud No Aprobada', '#fef2f2', '#991b1b')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Hola ${SAMPLE.merchantContact}</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Lamentamos informarte que la solicitud de tu comercio <strong>${SAMPLE.merchantName}</strong> no pudo ser aprobada en este momento.</p>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Documentación fiscal incompleta. Falta constancia de inscripción AFIP.</p>', 'warning')}
            ${emailButton('Contactar Soporte', `${baseUrl}/ayuda`, 'blue')}
        `),
    },
    {
        id: 'driver_request_received',
        number: 14,
        name: 'Solicitud de repartidor recibida',
        category: 'Registro y Onboarding',
        recipient: 'repartidor',
        priority: 'P0',
        status: 'new',
        trigger: 'POST /api/auth/activate-driver',
        subject: '📋 Recibimos tu solicitud de repartidor - MOOVY',
        functionName: 'sendDriverRequestReceivedEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Solicitud Recibida', '#dbeafe', '#1e40af')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Hola ${SAMPLE.driverName}!</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Recibimos tu solicitud para ser repartidor MOOVY con <strong>Moto</strong>. Nuestro equipo va a revisar tu documentación en las próximas 24-48 horas hábiles.</p>
            ${emailInfoBox('<ul style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;"><li>DNI (frente y dorso)</li><li>Licencia de conducir</li><li>Seguro del vehículo</li><li>Datos fiscales (CUIT)</li></ul>')}
        `),
    },
    {
        id: 'driver_rejected',
        number: 18,
        name: 'Repartidor rechazado',
        category: 'Registro y Onboarding',
        recipient: 'repartidor',
        priority: 'P0',
        status: 'new',
        trigger: 'PUT /api/admin/drivers/[id]/reject',
        subject: '📋 Actualización sobre tu solicitud de repartidor - MOOVY',
        functionName: 'sendDriverRejectedEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Solicitud No Aprobada', '#fef2f2', '#991b1b')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Hola ${SAMPLE.driverName}</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Lamentamos informarte que tu solicitud para ser repartidor en MOOVY no pudo ser aprobada.</p>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Licencia de conducir vencida. Por favor renovála y volvé a postularte.</p>', 'warning')}
            ${emailButton('Contactar Soporte', `${baseUrl}/ayuda`, 'blue')}
        `),
    },
    {
        id: 'payment_pending',
        number: 34,
        name: 'Pago pendiente',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'Webhook MP status pending/in_process',
        subject: `⏳ Pago pendiente - Pedido #${SAMPLE.orderNumber}`,
        functionName: 'sendPaymentPendingEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Pago Pendiente', '#fffbeb', '#92400e')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pago está en proceso, ${SAMPLE.buyerName}</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Recibimos tu pedido <strong>#${SAMPLE.orderNumber}</strong> pero el pago aún está pendiente de confirmación.</p>
            ${emailInfoBox(`<table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Total</td><td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px;">$${SAMPLE.total.toLocaleString('es-AR')}</td></tr></table>`)}
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>No te preocupes.</strong> Te avisaremos apenas se acredite.</p>', 'info')}
            ${emailButton('Ver mi pedido', `${baseUrl}/mis-pedidos`)}
        `),
    },
    {
        id: 'payment_rejected',
        number: 35,
        name: 'Pago rechazado',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'Webhook MP status rejected',
        subject: `❌ Pago rechazado - Pedido #${SAMPLE.orderNumber}`,
        functionName: 'sendPaymentRejectedEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Pago Rechazado', '#fef2f2', '#991b1b')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pago no pudo ser procesado</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Hola ${SAMPLE.buyerName}, el pago de tu pedido <strong>#${SAMPLE.orderNumber}</strong> por <strong style="color: #e60012;">$${SAMPLE.total.toLocaleString('es-AR')}</strong> fue rechazado.</p>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Fondos insuficientes</p>', 'error')}
            ${emailButton('Reintentar compra', `${baseUrl}/tienda`)}
        `),
    },
    {
        id: 'order_rejected_merchant',
        number: 37,
        name: 'Pedido rechazado por comercio',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'POST /api/orders/[id]/reject',
        subject: `📋 Tu pedido #${SAMPLE.orderNumber} fue rechazado`,
        functionName: 'sendOrderRejectedByMerchantEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Pedido Rechazado', '#fef2f2', '#991b1b')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pedido fue cancelado por el comercio</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Hola ${SAMPLE.buyerName}, <strong>${SAMPLE.merchantName}</strong> no pudo aceptar tu pedido <strong>#${SAMPLE.orderNumber}</strong>.</p>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Producto sin stock temporalmente</p>', 'warning')}
            ${emailAlertBox(`<p style="margin: 0; font-size: 14px;"><strong>Reembolso:</strong> Se te devolverán <strong>$${SAMPLE.total.toLocaleString('es-AR')}</strong> automáticamente.</p>`, 'success')}
            ${emailButton('Hacer otro pedido', `${baseUrl}/tienda`)}
        `),
    },
    {
        id: 'order_delivered',
        number: 41,
        name: 'Pedido entregado',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'POST /api/driver/status (DELIVERED)',
        subject: `✅ ¡Tu pedido #${SAMPLE.orderNumber} fue entregado!`,
        functionName: 'sendOrderDeliveredEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('¡Entregado!', '#def7ec', '#03543f')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Tu pedido llegó! 🎉</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Tu pedido <strong>#${SAMPLE.orderNumber}</strong> por <strong>$${SAMPLE.total.toLocaleString('es-AR')}</strong> fue entregado exitosamente. Tiempo de entrega: <strong>32 minutos</strong>.</p>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;">⭐ <strong>¿Cómo fue tu experiencia?</strong> Tu calificación nos ayuda a mejorar.</p>', 'info')}
            ${emailButton('Calificar pedido', `${baseUrl}/mis-pedidos`)}
        `),
    },
    {
        id: 'order_cancelled_buyer',
        number: 42,
        name: 'Pedido cancelado por comprador',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'POST /api/orders/[id]/cancel',
        subject: `Pedido #${SAMPLE.orderNumber} cancelado`,
        functionName: 'sendOrderCancelledByBuyerEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Pedido Cancelado', '#f3f4f6', '#4b5563')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Cancelaste tu pedido</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Confirmamos la cancelación de tu pedido <strong>#${SAMPLE.orderNumber}</strong>.</p>
            ${emailAlertBox(`<p style="margin: 0; font-size: 14px;"><strong>Reembolso:</strong> $${SAMPLE.total.toLocaleString('es-AR')} serán devueltos a tu medio de pago. Puede demorar entre 2 y 10 días hábiles.</p>`, 'success')}
            ${emailButton('Volver a la tienda', `${baseUrl}/tienda`)}
        `),
    },
    {
        id: 'order_cancelled_merchant',
        number: 43,
        name: 'Pedido cancelado por comercio',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'Comercio rechaza/cancela pedido',
        subject: `📋 Tu pedido #${SAMPLE.orderNumber} fue cancelado`,
        functionName: 'sendOrderCancelledByMerchantEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Pedido Cancelado', '#fef2f2', '#991b1b')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pedido fue cancelado</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">${SAMPLE.merchantName} canceló tu pedido <strong>#${SAMPLE.orderNumber}</strong>.</p>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Local cerrado por emergencia</p>', 'warning')}
            ${emailAlertBox(`<p style="margin: 0; font-size: 14px;"><strong>Reembolso:</strong> $${SAMPLE.total.toLocaleString('es-AR')} serán devueltos.</p>`, 'success')}
            ${emailButton('Hacer otro pedido', `${baseUrl}/tienda`)}
        `),
    },
    {
        id: 'order_cancelled_system',
        number: 44,
        name: 'Pedido cancelado por sistema',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'Cron merchant-timeout / assignment-engine',
        subject: `⚠️ Pedido #${SAMPLE.orderNumber} cancelado automáticamente`,
        functionName: 'sendOrderCancelledBySystemEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Pedido Cancelado', '#fef2f2', '#991b1b')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pedido fue cancelado automáticamente</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Tu pedido <strong>#${SAMPLE.orderNumber}</strong> fue cancelado automáticamente.</p>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> El comercio no respondió dentro del tiempo límite.</p>', 'warning')}
            ${emailAlertBox(`<p style="margin: 0; font-size: 14px;"><strong>Reembolso:</strong> $${SAMPLE.total.toLocaleString('es-AR')} serán devueltos.</p>`, 'success')}
            ${emailButton('Reintentar pedido', `${baseUrl}/tienda`)}
        `),
    },
    {
        id: 'refund_processed',
        number: 45,
        name: 'Reembolso procesado',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'POST /api/ops/refund',
        subject: `💸 Reembolso procesado - Pedido #${SAMPLE.orderNumber}`,
        functionName: 'sendRefundProcessedEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Reembolso Procesado', '#def7ec', '#03543f')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu reembolso fue procesado</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Confirmamos el reembolso de tu pedido <strong>#${SAMPLE.orderNumber}</strong>.</p>
            ${emailInfoBox(`<table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px;">Monto</td><td style="text-align: right; color: #059669; font-weight: bold; font-size: 18px;">$${SAMPLE.total.toLocaleString('es-AR')}</td></tr><tr><td style="color: #718096; font-size: 14px;">Medio</td><td style="text-align: right; color: #2d3748;">MercadoPago</td></tr></table>`)}
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;">El reembolso puede demorar entre <strong>2 y 10 días hábiles</strong>.</p>', 'info')}
            ${emailButton('Ver mis pedidos', `${baseUrl}/mis-pedidos`)}
        `),
    },
    {
        id: 'merchant_new_order',
        number: 51,
        name: 'Nuevo pedido recibido (comercio)',
        category: 'Ciclo de Vida del Pedido (Comercio)',
        recipient: 'comercio',
        priority: 'P0',
        status: 'new',
        trigger: 'POST /api/orders',
        subject: `🔔 Nuevo pedido #${SAMPLE.orderNumber} - $${SAMPLE.total.toLocaleString('es-AR')}`,
        functionName: 'sendMerchantNewOrderEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('🔔 Nuevo Pedido', '#dbeafe', '#1e40af')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Tenés un nuevo pedido!</h2>
            ${emailInfoBox(`<table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Pedido</td><td style="text-align: right; color: #2d3748; font-weight: bold;">#${SAMPLE.orderNumber}</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Cliente</td><td style="text-align: right; color: #2d3748;">${SAMPLE.buyerName}</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Productos</td><td style="text-align: right; color: #2d3748;">3 items</td></tr><tr><td style="color: #1a202c; font-weight: bold; font-size: 18px; padding-top: 15px;">Total</td><td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px; padding-top: 15px;">$${SAMPLE.total.toLocaleString('es-AR')}</td></tr></table>`)}
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>⏰ Importante:</strong> Aceptá o rechazá el pedido lo antes posible.</p>', 'warning')}
            ${emailButton('Ver pedido en mi panel', `${baseUrl}/comercios`, 'red')}
        `),
    },
    {
        id: 'merchant_order_reminder',
        number: 52,
        name: 'Recordatorio pedido sin aceptar',
        category: 'Ciclo de Vida del Pedido (Comercio)',
        recipient: 'comercio',
        priority: 'P0',
        status: 'new',
        trigger: 'Cron merchant-timeout (antes de cancelar)',
        subject: `⚠️ ¡Pedido #${SAMPLE.orderNumber} esperando tu respuesta!`,
        functionName: 'sendMerchantOrderReminderEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('⚠️ Pedido Sin Respuesta', '#fffbeb', '#92400e')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tenés un pedido pendiente de aceptar</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">El pedido <strong>#${SAMPLE.orderNumber}</strong> lleva <strong>8 minutos</strong> sin respuesta. Si no lo aceptás en los próximos <strong>7 minutos</strong>, se cancelará automáticamente.</p>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px; font-weight: bold;">⏰ Tiempo restante: 7 minutos</p>', 'error')}
            ${emailButton('Aceptar pedido ahora', `${baseUrl}/comercios`, 'green')}
        `),
    },
    {
        id: 'merchant_payment_received',
        number: 76,
        name: 'Pago recibido (comercio)',
        category: 'Emails Financieros (Comercio)',
        recipient: 'comercio',
        priority: 'P0',
        status: 'new',
        trigger: 'Webhook MP approved / pago cash',
        subject: `💰 Pago recibido por pedido #${SAMPLE.orderNumber}`,
        functionName: 'sendMerchantPaymentReceivedEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('💰 Pago Recibido', '#def7ec', '#03543f')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Recibiste un pago!</h2>
            ${emailInfoBox(`<table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Pedido</td><td style="text-align: right; color: #2d3748; font-weight: 500;">#${SAMPLE.orderNumber}</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Monto bruto</td><td style="text-align: right; color: #2d3748;">$${SAMPLE.total.toLocaleString('es-AR')}</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Comisión MOOVY</td><td style="text-align: right; color: #ef4444;">-$${SAMPLE.commission.toLocaleString('es-AR')}</td></tr><tr><td style="color: #1a202c; font-weight: bold; font-size: 18px; padding-top: 15px;">Neto a cobrar</td><td style="text-align: right; color: #059669; font-weight: bold; font-size: 18px; padding-top: 15px;">$${SAMPLE.netAmount.toLocaleString('es-AR')}</td></tr></table>`)}
            ${emailButton('Ver mis ganancias', `${baseUrl}/comercios/pagos`, 'green')}
        `),
    },
    {
        id: 'merchant_suspended',
        number: 102,
        name: 'Tienda suspendida',
        category: 'Gestión de Tienda (Comercio)',
        recipient: 'comercio',
        priority: 'P0',
        status: 'new',
        trigger: 'OPS suspende comercio',
        subject: '⚠️ Tu comercio fue suspendido - MOOVY',
        functionName: 'sendMerchantSuspendedEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Tienda Suspendida', '#fef2f2', '#991b1b')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu tienda fue suspendida</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Tu comercio <strong>${SAMPLE.merchantName}</strong> fue suspendido temporalmente.</p>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Múltiples reclamos sin resolver de clientes.</p>', 'error')}
            ${emailButton('Contactar Soporte', `${baseUrl}/ayuda`, 'blue')}
        `),
    },
    {
        id: 'driver_suspended',
        number: 109,
        name: 'Cuenta repartidor suspendida',
        category: 'Gestión de Cuenta del Repartidor',
        recipient: 'repartidor',
        priority: 'P0',
        status: 'new',
        trigger: 'OPS suspende repartidor',
        subject: '⚠️ Tu cuenta de repartidor fue suspendida - MOOVY',
        functionName: 'sendDriverSuspendedEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('Cuenta Suspendida', '#fef2f2', '#991b1b')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu cuenta de repartidor fue suspendida</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Tu cuenta de repartidor en MOOVY fue suspendida temporalmente.</p>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Documentación vencida (licencia de conducir).</p>', 'error')}
            ${emailButton('Contactar Soporte', `${baseUrl}/ayuda`, 'blue')}
        `),
    },
    {
        id: 'account_deletion_request',
        number: 114,
        name: 'Solicitud eliminación de cuenta',
        category: 'Administrativos y de Sistema',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'POST /api/profile/delete',
        subject: '⚠️ Solicitud de eliminación de cuenta - MOOVY',
        functionName: 'sendAccountDeletionRequestEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Solicitud de eliminación de cuenta</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Hola ${SAMPLE.buyerName}, recibimos tu solicitud para eliminar tu cuenta de MOOVY.</p>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>Tu cuenta será eliminada permanentemente el 03/04/2026.</strong> Este proceso es irreversible.</p>', 'warning')}
            ${emailButton('Contactar Soporte', `${baseUrl}/ayuda`, 'blue')}
        `),
    },
    {
        id: 'account_deleted',
        number: 115,
        name: 'Cuenta eliminada',
        category: 'Administrativos y de Sistema',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'Proceso de eliminación completado',
        subject: 'Confirmación: tu cuenta fue eliminada - MOOVY',
        functionName: 'sendAccountDeletedEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu cuenta fue eliminada</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Confirmamos que tu cuenta y todos tus datos personales fueron eliminados permanentemente, en cumplimiento con la Ley 25.326.</p>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">Este es el último correo que recibirás de MOOVY.</p>
        `),
    },
    {
        id: 'owner_critical_alert',
        number: 135,
        name: 'Alerta crítica (Owner)',
        category: 'Emails para el Owner',
        recipient: 'owner',
        priority: 'P0',
        status: 'new',
        trigger: 'Health checks, webhooks, errores',
        subject: '[🔴 CRÍTICO] Pasarela de pagos caída - MOOVY',
        functionName: 'sendOwnerCriticalAlertEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('🔴 CRÍTICO', '#fef2f2', '#991b1b')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Pasarela de pagos no responde</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">La API de MercadoPago no está respondiendo. Los pagos con tarjeta están fallando.</p>
            ${emailInfoBox('<h4 style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">Detalles técnicos</h4><pre style="background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; color: #334155; margin: 0;">Error: ECONNREFUSED\nEndpoint: https://api.mercadopago.com/v1/payments\nÚltimo intento: 2026-03-20 14:30:00 ART\nFallas consecutivas: 5</pre>')}
            ${emailButton('Ir al panel OPS', `${baseUrl}/ops`, 'red')}
        `),
    },
    {
        id: 'owner_unassigned_orders',
        number: 161,
        name: 'Pedidos sin repartidor (Owner)',
        category: 'Emails para el Owner',
        recipient: 'owner',
        priority: 'P0',
        status: 'new',
        trigger: 'Cron / alerta automática',
        subject: '🟠 3 pedidos sin repartidor - MOOVY',
        functionName: 'sendOwnerUnassignedOrdersEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('🟠 Pedidos Sin Repartidor', '#fffbeb', '#92400e')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">3 pedidos sin repartidor asignado</h2>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>3 pedidos</strong> están esperando repartidor. El más antiguo lleva <strong>12 minutos</strong>.</p>', 'warning')}
            ${emailInfoBox('<p style="color: #718096; font-size: 14px; margin: 0;"><strong>Pedidos:</strong> #MOV-001, #MOV-002, #MOV-003</p>')}
            ${emailButton('Ver pedidos en OPS', `${baseUrl}/ops/pedidos`, 'red')}
        `),
    },
    {
        id: 'owner_daily_report',
        number: 167,
        name: 'Reporte diario (Owner)',
        category: 'Emails para el Owner',
        recipient: 'owner',
        priority: 'P0',
        status: 'new',
        trigger: 'Cron diario 8 AM',
        subject: '📊 Reporte diario MOOVY — 20/03/2026',
        functionName: 'sendOwnerDailyReportEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0; text-align: center;">📊 Reporte Diario — 20/03/2026</h2>
            <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin: 20px 0;">
                <tr>
                    <td style="background: #eff6ff; border-radius: 10px; padding: 16px; text-align: center; width: 33%;"><div style="color: #1e40af; font-size: 28px; font-weight: bold;">47</div><div style="color: #3b82f6; font-size: 12px; text-transform: uppercase;">Pedidos</div></td>
                    <td style="background: #f0fdf4; border-radius: 10px; padding: 16px; text-align: center; width: 33%;"><div style="color: #166534; font-size: 28px; font-weight: bold;">$285.400</div><div style="color: #22c55e; font-size: 12px; text-transform: uppercase;">Facturación</div></td>
                    <td style="background: #fef3c7; border-radius: 10px; padding: 16px; text-align: center; width: 33%;"><div style="color: #92400e; font-size: 28px; font-weight: bold;">$22.832</div><div style="color: #f59e0b; font-size: 12px; text-transform: uppercase;">Comisión</div></td>
                </tr>
            </table>
            ${emailInfoBox('<table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Completados</td><td style="text-align: right; color: #059669; font-weight: 500;">42 (89%)</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Cancelados</td><td style="text-align: right; color: #ef4444; font-weight: 500;">5</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Tiempo promedio</td><td style="text-align: right; color: #2d3748; font-weight: 500;">28 min</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Nuevos usuarios</td><td style="text-align: right; color: #2d3748; font-weight: 500;">12</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Top comercio</td><td style="text-align: right; color: #2d3748; font-weight: 500;">Don Juan (8 pedidos)</td></tr></table>')}
            ${emailButton('Ver dashboard completo', `${baseUrl}/ops/revenue`, 'blue')}
        `),
    },
    {
        id: 'owner_data_deletion_request',
        number: 174,
        name: 'Solicitud eliminación datos (Owner)',
        category: 'Emails para el Owner',
        recipient: 'owner',
        priority: 'P0',
        status: 'new',
        trigger: 'POST /api/profile/delete',
        subject: '📋 [COMPLIANCE] Solicitud eliminación de datos',
        functionName: 'sendOwnerDataDeletionRequestEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('📋 Solicitud ARCO', '#eff6ff', '#1e40af')}</div>
            <h2 style="color: #111827; margin-top: 0; text-align: center;">Solicitud de eliminación de datos personales</h2>
            ${emailAlertBox('<p style="margin: 0; font-size: 14px;"><strong>Plazo legal:</strong> 10 días hábiles para completar (Ley 25.326, Art. 16).</p>', 'warning')}
            ${emailInfoBox('<table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Usuario</td><td style="text-align: right; color: #2d3748;">${SAMPLE.buyerName}</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Email</td><td style="text-align: right; color: #2d3748;">maria@ejemplo.com</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Roles</td><td style="text-align: right; color: #2d3748;">USER, SELLER</td></tr></table>')}
            ${emailButton('Ver en panel OPS', `${baseUrl}/ops/clientes`, 'red')}
        `),
    },
    // ─── Recuperación de carritos ────────────────────────────────────────
    {
        id: 'cart_abandonment_1st',
        number: 175,
        name: 'Carrito abandonado (1er recordatorio)',
        category: 'Recuperación',
        recipient: 'comprador' as const,
        priority: 'P1' as const,
        status: 'implemented' as const,
        trigger: 'POST /api/cron/cart-recovery',
        subject: '${nombre}, dejaste algo en tu carrito 🛒',
        functionName: 'sendCartAbandonmentEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            ${emailBadge('Tu carrito', '#FEF3C7', '#92400E')}
            <h2 style="color: #2d3748; font-size: 22px; margin: 0 0 10px;">¿Te olvidaste de algo?</h2>
            <p style="color: #718096; margin: 0 0 20px;">Guardamos tu carrito para que puedas completar tu pedido cuando quieras.</p>
            ${emailInfoBox('<table style="width: 100%;"><tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><strong>Medialunas artesanales x6</strong></td><td style="text-align: right; font-weight: 600;">$3.500</td></tr><tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><strong>Café con leche grande</strong> <span style="color: #718096; font-size: 13px;"> × 2</span></td><td style="text-align: right; font-weight: 600;">$5.000</td></tr><tr><td style="padding: 14px 0 0; font-weight: 700; font-size: 16px;">Total</td><td style="text-align: right; font-weight: 700; color: #e60012; font-size: 16px;">$8.500</td></tr></table>')}
            ${emailButton('Completar mi pedido', `${baseUrl}/checkout`, 'red')}
        `),
    },
    {
        id: 'cart_abandonment_2nd',
        number: 176,
        name: 'Carrito abandonado (2do recordatorio)',
        category: 'Recuperación',
        recipient: 'comprador' as const,
        priority: 'P1' as const,
        status: 'implemented' as const,
        trigger: 'POST /api/cron/cart-recovery',
        subject: '¡Tu carrito te espera, ${nombre}! 🛒',
        functionName: 'sendCartAbandonmentEmail',
        file: 'src/lib/email-p0.ts',
        generatePreview: () => emailLayout(`
            ${emailBadge('Tu carrito', '#FEF3C7', '#92400E')}
            <h2 style="color: #2d3748; font-size: 22px; margin: 0 0 10px;">¡Tus productos siguen esperándote!</h2>
            <p style="color: #718096; margin: 0 0 20px;">No te quedes sin ellos — otros compradores también los están viendo.</p>
            ${emailInfoBox('<table style="width: 100%;"><tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><strong>Medialunas artesanales x6</strong></td><td style="text-align: right; font-weight: 600;">$3.500</td></tr><tr><td style="padding: 14px 0 0; font-weight: 700; font-size: 16px;">Total</td><td style="text-align: right; font-weight: 700; color: #e60012; font-size: 16px;">$3.500</td></tr></table>')}
            ${emailButton('Completar mi pedido', `${baseUrl}/checkout`, 'red')}
        `),
    },

    // ── DOCUMENTOS DE COMERCIO (rama fix/onboarding-comercio-completo) ──
    {
        id: 'merchant_doc_approved',
        number: 200,
        name: 'Documento de comercio aprobado',
        category: 'Aprobación de Documentos',
        recipient: 'comercio',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/admin/merchants/[id]/documents/approve',
        subject: '✅ Documento aprobado — MOOVY',
        functionName: 'sendMerchantDocumentApprovedEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Documento aprobado ✅</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Hola ${SAMPLE.merchantContact}, tu documento <strong>Constancia AFIP</strong> fue
                aprobado por el equipo de MOOVY.
            </p>
            <p style="color: #6b7280; font-size: 14px;">Cuando todos los documentos requeridos estén aprobados, tu comercio se activa automáticamente.</p>
            ${emailButton('Ir a mi panel', `${baseUrl}/comercios/configuracion`, 'green')}
        `),
    },
    {
        id: 'merchant_doc_rejected',
        number: 201,
        name: 'Documento de comercio rechazado',
        category: 'Aprobación de Documentos',
        recipient: 'comercio',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/admin/merchants/[id]/documents/reject',
        subject: '⚠️ Documento rechazado — MOOVY',
        functionName: 'sendMerchantDocumentRejectedEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Documento rechazado</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Hola ${SAMPLE.merchantContact}, tu documento <strong>Habilitación Municipal</strong>
                fue rechazado por el siguiente motivo:
            </p>
            ${emailAlertBox('La foto no permite leer claramente la fecha de vencimiento. Subí una foto más nítida.', 'warning')}
            <p style="color: #6b7280; font-size: 14px;">Podés volver a subirlo desde tu panel de configuración.</p>
            ${emailButton('Subir documento nuevo', `${baseUrl}/comercios/configuracion`, 'red')}
        `),
    },
    {
        id: 'admin_merchant_change_request',
        number: 202,
        name: 'Solicitud de cambio de documento (comercio → admin)',
        category: 'Aprobación de Documentos',
        recipient: 'admin',
        priority: 'P1',
        status: 'implemented',
        trigger: 'POST /api/merchant/documents/change-request',
        subject: '📄 Nueva solicitud de cambio de documento (comercio)',
        functionName: 'sendAdminChangeRequestEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Nueva solicitud de cambio</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                <strong>${SAMPLE.merchantName}</strong> solicita cambiar su <strong>CBU</strong>.
            </p>
            ${emailInfoBox(`
                <p style="margin: 5px 0; color: #4a5568;"><strong>Motivo:</strong></p>
                <p style="margin: 5px 0; color: #4a5568;">Cambiamos de banco por mejores condiciones.</p>
            `)}
            ${emailButton('Revisar en OPS', `${baseUrl}/ops/usuarios`, 'blue')}
        `),
    },
    {
        id: 'merchant_change_request_approved',
        number: 203,
        name: 'Solicitud de cambio aprobada (comercio)',
        category: 'Aprobación de Documentos',
        recipient: 'comercio',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/admin/merchants/[id]/change-requests/[requestId]/resolve (approve)',
        subject: '✅ Tu solicitud de cambio fue aprobada — MOOVY',
        functionName: 'sendMerchantChangeRequestApprovedEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Solicitud aprobada ✅</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Aprobamos tu solicitud de cambio de <strong>CBU</strong>. Ya podés ingresar el nuevo
                valor desde tu panel de configuración.
            </p>
            ${emailButton('Ir a mi panel', `${baseUrl}/comercios/configuracion`, 'green')}
        `),
    },
    {
        id: 'merchant_change_request_rejected',
        number: 204,
        name: 'Solicitud de cambio rechazada (comercio)',
        category: 'Aprobación de Documentos',
        recipient: 'comercio',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/admin/merchants/[id]/change-requests/[requestId]/resolve (reject)',
        subject: '⚠️ Tu solicitud de cambio fue rechazada — MOOVY',
        functionName: 'sendMerchantChangeRequestRejectedEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Solicitud rechazada</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                No aprobamos tu solicitud de cambio de <strong>CBU</strong>.
            </p>
            ${emailAlertBox('Necesitamos que adjuntes el comprobante del nuevo banco antes de aprobar el cambio. Contactanos por soporte si tenés dudas.', 'warning')}
            ${emailButton('Contactar soporte', `${baseUrl}/soporte`, 'red')}
        `),
    },

    // ── DOCUMENTOS DE REPARTIDOR (rama fix/onboarding-repartidor-complet) ──
    {
        id: 'driver_doc_approved',
        number: 210,
        name: 'Documento de repartidor aprobado',
        category: 'Aprobación de Documentos',
        recipient: 'repartidor',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/admin/drivers/[id]/documents/approve',
        subject: '✅ Documento aprobado — MOOVY',
        functionName: 'sendDriverDocumentApprovedEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Documento aprobado ✅</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Hola ${SAMPLE.driverName}, tu <strong>Licencia de conducir</strong> fue aprobada.
            </p>
            <p style="color: #6b7280; font-size: 14px;">Cuando todos los documentos estén aprobados, tu cuenta se activa automáticamente.</p>
            ${emailButton('Ir al panel', `${baseUrl}/repartidor`, 'green')}
        `),
    },
    {
        id: 'driver_doc_rejected',
        number: 211,
        name: 'Documento de repartidor rechazado',
        category: 'Aprobación de Documentos',
        recipient: 'repartidor',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/admin/drivers/[id]/documents/reject',
        subject: '⚠️ Documento rechazado — MOOVY',
        functionName: 'sendDriverDocumentRejectedEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Documento rechazado</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Hola ${SAMPLE.driverName}, tu <strong>Seguro del vehículo</strong> fue rechazado.
            </p>
            ${emailAlertBox('La póliza está vencida. Subí una póliza al día para poder operar.', 'warning')}
            ${emailButton('Subir documento nuevo', `${baseUrl}/repartidor`, 'red')}
        `),
    },
    {
        id: 'admin_driver_change_request',
        number: 212,
        name: 'Solicitud de cambio de documento (repartidor → admin)',
        category: 'Aprobación de Documentos',
        recipient: 'admin',
        priority: 'P1',
        status: 'implemented',
        trigger: 'POST /api/driver/documents/change-request',
        subject: '📄 Nueva solicitud de cambio de documento (repartidor)',
        functionName: 'sendAdminDriverChangeRequestEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Nueva solicitud de cambio</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                <strong>${SAMPLE.driverName}</strong> solicita cambiar su <strong>Licencia de conducir</strong>.
            </p>
            ${emailInfoBox(`
                <p style="margin: 5px 0; color: #4a5568;"><strong>Motivo:</strong></p>
                <p style="margin: 5px 0; color: #4a5568;">Renové la licencia, la nueva vence en 2031.</p>
            `)}
            ${emailButton('Revisar en OPS', `${baseUrl}/ops/usuarios`, 'blue')}
        `),
    },
    {
        id: 'driver_change_request_approved',
        number: 213,
        name: 'Solicitud de cambio aprobada (repartidor)',
        category: 'Aprobación de Documentos',
        recipient: 'repartidor',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/admin/drivers/[id]/change-requests/[requestId]/resolve (approve)',
        subject: '✅ Tu solicitud de cambio fue aprobada — MOOVY',
        functionName: 'sendDriverChangeRequestApprovedEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Solicitud aprobada ✅</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Aprobamos tu solicitud de cambio de <strong>Licencia</strong>. Ya podés subir la nueva
                desde tu perfil.
            </p>
            ${emailButton('Ir al panel', `${baseUrl}/repartidor`, 'green')}
        `),
    },
    {
        id: 'driver_change_request_rejected',
        number: 214,
        name: 'Solicitud de cambio rechazada (repartidor)',
        category: 'Aprobación de Documentos',
        recipient: 'repartidor',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/admin/drivers/[id]/change-requests/[requestId]/resolve (reject)',
        subject: '⚠️ Tu solicitud de cambio fue rechazada — MOOVY',
        functionName: 'sendDriverChangeRequestRejectedEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Solicitud rechazada</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                No aprobamos tu solicitud de cambio de <strong>Seguro</strong>.
            </p>
            ${emailAlertBox('El documento subido no corresponde al vehículo registrado. Contactanos por soporte si tenés dudas.', 'warning')}
            ${emailButton('Contactar soporte', `${baseUrl}/soporte`, 'red')}
        `),
    },

    // ── VENCIMIENTOS DE DOCUMENTOS DRIVER (cron driver-docs-expiry) ──
    {
        id: 'driver_doc_expiring',
        number: 215,
        name: 'Documento próximo a vencer (repartidor)',
        category: 'Aprobación de Documentos',
        recipient: 'repartidor',
        priority: 'P0',
        status: 'implemented',
        trigger: 'cron /api/cron/driver-docs-expiry (7d, 3d, 1d antes)',
        subject: '⏰ Tu documento vence pronto — MOOVY',
        functionName: 'sendDriverDocExpiringEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Tu documento vence pronto</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Hola ${SAMPLE.driverName}, tu <strong>Licencia de conducir</strong> vence en
                <strong>3 días</strong> (30/04/2026).
            </p>
            ${emailAlertBox('Si no renovás a tiempo, no vas a poder recibir nuevos pedidos hasta que subas el documento renovado.', 'warning')}
            ${emailButton('Actualizar documento', `${baseUrl}/repartidor`, 'red')}
        `),
    },
    {
        id: 'driver_doc_expired',
        number: 216,
        name: 'Documento vencido + auto-suspensión (repartidor)',
        category: 'Aprobación de Documentos',
        recipient: 'repartidor',
        priority: 'P0',
        status: 'implemented',
        trigger: 'cron /api/cron/driver-docs-expiry (doc vencido → suspensión)',
        subject: '⛔ Documento vencido — tu cuenta fue suspendida',
        functionName: 'sendDriverDocExpiredEmail',
        file: 'src/lib/email.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #111827; margin-top: 0;">Documento vencido</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Hola ${SAMPLE.driverName}, tu <strong>Licencia de conducir</strong> venció el 24/04/2026.
            </p>
            ${emailAlertBox('Suspendimos tu cuenta de repartidor hasta que subas el documento renovado. Esto es obligatorio por ley (Decreto 779/95).', 'error')}
            ${emailButton('Subir licencia renovada', `${baseUrl}/repartidor`, 'red')}
        `),
    },

    // ── NUEVOS EMAILS LANZAMIENTO: legal + UX buyer/driver ────────────
    {
        id: 'email_change_confirmation',
        number: 300,
        name: 'Confirmación de cambio de email (al nuevo)',
        category: 'Autenticación y Seguridad',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'PATCH /api/profile (cambio de email, endpoint futuro)',
        subject: 'Tu email en MOOVY fue actualizado',
        functionName: 'sendEmailChangeConfirmationEmail',
        file: 'src/lib/email-legal-ux.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu email fue actualizado</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                ${SAMPLE.buyerName}, a partir de ahora tu cuenta MOOVY está asociada a <strong>${SAMPLE.buyerEmail}</strong>.
            </p>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                Todos los correos transaccionales (confirmaciones de pedidos, notificaciones, recuperación de contraseña) te van a llegar a este nuevo email.
            </p>
            ${emailAlertBox(`<strong>¿No fuiste vos?</strong> Si no hiciste este cambio, contactanos urgente a <a href="mailto:soporte@somosmoovy.com" style="color: #1a1a1a; text-decoration: underline;">soporte@somosmoovy.com</a> para recuperar tu cuenta.`, 'warning')}
            ${emailButton('Ir a mi perfil', `${baseUrl}/mi-perfil`, 'blue')}
        `),
    },
    {
        id: 'data_export_ready',
        number: 301,
        name: 'Exportación de datos ARCO lista',
        category: 'Datos Personales (ARCO)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'GET /api/profile/export-data (cuando sea asíncrono)',
        subject: 'Tu exportación de datos MOOVY está lista',
        functionName: 'sendDataExportReadyEmail',
        file: 'src/lib/email-legal-ux.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu exportación de datos está lista</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                ${SAMPLE.buyerName}, preparamos el archivo con todos los datos personales que guardamos en tu cuenta MOOVY: perfil, direcciones, pedidos, transacciones de puntos, consentimientos y más.
            </p>
            ${emailInfoBox(`
                <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Formato</p>
                <p style="margin: 0 0 16px 0; color: #555; font-size: 14px;">JSON descargable</p>
                <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Disponible hasta</p>
                <p style="margin: 0; color: #555; font-size: 14px;">viernes, 25 de abril de 2026, 14:30</p>
            `)}
            ${emailButton('Descargar mis datos', `${baseUrl}/api/profile/export-data`, 'blue')}
            <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">Este link es personal y caduca en 48 horas. Derecho de acceso y portabilidad garantizado por la Ley 25.326.</p>
        `),
    },
    {
        id: 'terms_updated',
        number: 302,
        name: 'Actualización de Términos o Privacidad',
        category: 'Legal',
        recipient: 'comprador',
        priority: 'P0',
        status: 'new',
        trigger: 'Manual / cron futuro al bumpear versión en legal-versions.ts',
        subject: 'Actualizamos los Términos y Condiciones de MOOVY',
        functionName: 'sendTermsUpdatedEmail',
        file: 'src/lib/email-legal-ux.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Actualizamos nuestros Términos y Condiciones</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                ${SAMPLE.buyerName}, publicamos una nueva versión de los <strong>Términos y Condiciones</strong> de MOOVY (versión <strong>1.2</strong>).
            </p>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                Te pedimos que los leas antes de seguir usando la plataforma. Si seguís usando MOOVY después de recibir este correo, entendemos que aceptaste los cambios.
            </p>
            ${emailButton('Leer términos y condiciones', `${baseUrl}/terminos`, 'blue')}
            <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">Si no estás de acuerdo, podés eliminar tu cuenta desde tu <a href="${baseUrl}/mi-perfil/privacidad" style="color: #1a1a1a;">panel de privacidad</a>.</p>
        `),
    },
    {
        id: 'marketing_opt_out_confirmed',
        number: 303,
        name: 'Confirmación de baja de comunicaciones comerciales',
        category: 'Datos Personales (ARCO)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'implemented',
        trigger: 'PATCH /api/profile/privacy (marketingConsent: true → false)',
        subject: 'Confirmamos tu baja de comunicaciones comerciales',
        functionName: 'sendMarketingOptOutConfirmedEmail',
        file: 'src/lib/email-legal-ux.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Confirmamos tu baja de comunicaciones</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                ${SAMPLE.buyerName}, registramos tu decisión. A partir de este momento ya <strong>no vas a recibir</strong> ofertas, promociones ni novedades comerciales de MOOVY por email ni por push.
            </p>
            ${emailInfoBox(`
                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Qué vas a seguir recibiendo</p>
                <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.7;">
                    Solo correos transaccionales imprescindibles de tus pedidos: confirmaciones, estado de entrega, recibos, y avisos legales obligatorios.
                </p>
            `)}
            ${emailButton('Ir a mi panel de privacidad', `${baseUrl}/mi-perfil/privacidad`, 'blue')}
            <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">Baja confirmada conforme a la Ley 26.951 "No Llame" y al marco de protección de datos de la AAIP.</p>
        `),
    },
    {
        id: 'driver_assigned_buyer',
        number: 304,
        name: 'Repartidor asignado al pedido (al buyer)',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'implemented',
        trigger: 'assignment-engine.ts driverAcceptOrder (post-accept)',
        subject: `Tu pedido ${SAMPLE.orderNumber} ya tiene repartidor`,
        functionName: 'sendDriverAssignedEmail',
        file: 'src/lib/email-legal-ux.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu pedido ya tiene repartidor</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                ${SAMPLE.buyerName}, <strong>${SAMPLE.driverName}</strong> va a buscar tu pedido <strong>${SAMPLE.orderNumber}</strong>. Llega al comercio en aproximadamente <strong>7 minutos</strong>.
            </p>
            ${emailInfoBox(`
                <p style="margin: 5px 0; color: #999; font-size: 12px; text-transform: uppercase;">Repartidor</p>
                <p style="margin: 5px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">${SAMPLE.driverName}</p>
                <p style="margin: 12px 0 5px 0; color: #999; font-size: 12px; text-transform: uppercase;">Vehículo</p>
                <p style="margin: 5px 0; color: #555; font-size: 14px;">Moto</p>
                <p style="margin: 12px 0 5px 0; color: #999; font-size: 12px; text-transform: uppercase;">Contacto</p>
                <p style="margin: 5px 0; color: #555; font-size: 14px;">•••• 4521 (teléfono enmascarado por privacidad)</p>
            `)}
            ${emailButton('Ver mi pedido', `${baseUrl}/mis-pedidos`, 'red')}
        `),
    },
    {
        id: 'order_on_the_way',
        number: 305,
        name: 'Pedido en camino + PIN de entrega',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'implemented',
        trigger: 'PATCH /api/driver/orders/[id]/status (PICKED_UP, no pickup)',
        subject: `🛵 Tu pedido ${SAMPLE.orderNumber} va en camino — código 048 291`,
        functionName: 'sendOrderOnTheWayEmail',
        file: 'src/lib/email-legal-ux.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu pedido va en camino</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                ${SAMPLE.buyerName}, tu pedido <strong>${SAMPLE.orderNumber}</strong> ya salió del comercio.
            </p>
            <div style="background-color: #fafafa; border: 2px solid #1a1a1a; border-radius: 12px; padding: 28px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Código de entrega</p>
                <p style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">048 291</p>
                <p style="margin: 0; color: #555; font-size: 13px;">Cuando llegue el repartidor, dale este código.</p>
            </div>
            ${emailAlertBox(`<strong>No compartas el código</strong> ni lo anticipes por chat. Solo mostraselo al repartidor cuando te entregue el paquete en la puerta.`, 'warning')}
            ${emailButton('Seguir mi pedido', `${baseUrl}/mis-pedidos`, 'red')}
        `),
    },
    {
        id: 'order_ready_pickup',
        number: 306,
        name: 'Pedido listo para retirar',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P0',
        status: 'implemented',
        trigger: 'POST /api/merchant/orders/[id]/ready (isPickup: true)',
        subject: `Tu pedido ${SAMPLE.orderNumber} está listo para retirar`,
        functionName: 'sendOrderReadyForPickupEmail',
        file: 'src/lib/email-legal-ux.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu pedido está listo para retirar</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                ${SAMPLE.buyerName}, tu pedido <strong>${SAMPLE.orderNumber}</strong> está listo. Podés pasar a buscarlo cuando te quede cómodo.
            </p>
            ${emailInfoBox(`
                <p style="margin: 0 0 6px 0; color: #999; font-size: 12px; text-transform: uppercase;">Retirar en</p>
                <p style="margin: 0 0 4px 0; color: #1a1a1a; font-size: 17px; font-weight: 600;">${SAMPLE.merchantName}</p>
                <p style="margin: 0; color: #555; font-size: 14px;">San Martín 456, Ushuaia</p>
            `)}
            <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 8px 0;">Llevá tu número de pedido (<strong>${SAMPLE.orderNumber}</strong>) o mostrá este email al mostrador.</p>
            ${emailButton('Ver mi pedido', `${baseUrl}/mis-pedidos`, 'red')}
        `),
    },
    {
        id: 'rate_order_reminder',
        number: 307,
        name: 'Recordatorio de calificar pedido (24h)',
        category: 'Ciclo de Vida del Pedido (Comprador)',
        recipient: 'comprador',
        priority: 'P1',
        status: 'implemented',
        trigger: 'POST /api/cron/rate-order-reminder (diario, 24-48h post-DELIVERED)',
        subject: `¿Cómo estuvo tu pedido de ${SAMPLE.merchantName}?`,
        functionName: 'sendRateOrderReminderEmail',
        file: 'src/lib/email-legal-ux.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">¿Cómo estuvo tu pedido?</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                ${SAMPLE.buyerName}, ayer recibiste tu pedido <strong>${SAMPLE.orderNumber}</strong> de <strong>${SAMPLE.merchantName}</strong>.
            </p>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                Tarda menos de 10 segundos y ayuda al comercio y al repartidor a mejorar. Otros vecinos de Ushuaia ven tu opinión antes de pedir.
            </p>
            ${emailButton('Calificar mi pedido', `${baseUrl}/mis-pedidos`, 'red')}
            <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">Este es el único recordatorio que vas a recibir sobre este pedido.</p>
        `),
    },
    {
        id: 'points_earned',
        number: 308,
        name: 'Puntos MOOVER acreditados',
        category: 'Puntos MOOVER',
        recipient: 'comprador',
        priority: 'P0',
        status: 'implemented',
        trigger: 'PATCH /api/driver/orders/[id]/status (DELIVERED + awarded > 0)',
        subject: `🎉 Sumaste 45 puntos MOOVER`,
        functionName: 'sendPointsEarnedEmail',
        file: 'src/lib/email-legal-ux.ts',
        generatePreview: () => emailLayout(`
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">🎉 Sumaste puntos MOOVER</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                ${SAMPLE.buyerName}, se acreditaron <strong>45 puntos</strong> a tu cuenta por tu pedido <strong>${SAMPLE.orderNumber}</strong>.
            </p>
            <div style="background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 6px 0; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">Tu saldo actual</p>
                <p style="margin: 0 0 4px 0; color: #1a1a1a; font-size: 36px; font-weight: 700;">1.285 <span style="font-size: 16px; font-weight: 500; color: #b45309;">pts</span></p>
                <p style="margin: 0; color: #92400e; font-size: 13px;">Nivel <strong>SILVER</strong></p>
            </div>
            ${emailInfoBox(`<p style="margin: 0; color: #555; font-size: 14px;"><strong>1 punto = $1 ARS.</strong> Podés canjearlos como descuento en tu próxima compra (hasta 20% del subtotal, desde 500 puntos).</p>`)}
            ${emailButton('Ver mis puntos', `${baseUrl}/puntos`, 'red')}
        `),
    },

    // ── NUEVOS EMAILS LANZAMIENTO: avisos al admin + UX operativos ────
    {
        id: 'admin_new_merchant_pending',
        number: 310,
        name: 'Nuevo comercio pendiente (→ admin)',
        category: 'Avisos al Owner',
        recipient: 'admin',
        priority: 'P1',
        status: 'implemented',
        trigger: 'POST /api/auth/register/merchant',
        subject: '📋 Nuevo comercio registrado — revisar en OPS',
        functionName: 'sendAdminNewMerchantPendingEmail',
        file: 'src/lib/email-admin-ops.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('🏪 Nuevo comercio', '#eff6ff', '#1e40af')}</div>
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">Nuevo comercio pendiente de revisión</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                Un comercio acaba de registrarse y necesita aprobación. Revisá CUIT, constancia AFIP y habilitación municipal desde el panel.
            </p>
            ${emailInfoBox(`
                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Comercio:</strong> ${SAMPLE.merchantName}</p>
                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Dueño:</strong> ${SAMPLE.merchantContact}</p>
                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Email:</strong> ${SAMPLE.merchantEmail}</p>
            `)}
            ${emailButton('Revisar en pipeline', `${baseUrl}/ops/pipeline-comercios`, 'blue')}
        `),
    },
    {
        id: 'admin_new_driver_pending',
        number: 311,
        name: 'Nuevo repartidor pendiente (→ admin)',
        category: 'Avisos al Owner',
        recipient: 'admin',
        priority: 'P1',
        status: 'implemented',
        trigger: 'POST /api/auth/register/driver',
        subject: '🏍️ Nuevo repartidor registrado — revisar en OPS',
        functionName: 'sendAdminNewDriverPendingEmail',
        file: 'src/lib/email-admin-ops.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('🏍️ Nuevo repartidor', '#eff6ff', '#1e40af')}</div>
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">Nuevo repartidor pendiente de revisión</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                Un repartidor se registró. Revisá DNI, licencia, seguro y RTO (si es motorizado) antes de activarlo.
            </p>
            ${emailInfoBox(`
                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Nombre:</strong> ${SAMPLE.driverName}</p>
                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Vehículo:</strong> MOTO</p>
                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Email:</strong> ${SAMPLE.driverEmail}</p>
            `)}
            ${emailButton('Revisar solicitud', `${baseUrl}/ops/usuarios`, 'blue')}
        `),
    },
    {
        id: 'admin_new_change_request',
        number: 312,
        name: 'Nueva solicitud de cambio (→ admin, genérica)',
        category: 'Avisos al Owner',
        recipient: 'admin',
        priority: 'P1',
        status: 'new',
        trigger: 'Disponible — no conectada (ya hay versiones específicas merchant/driver)',
        subject: '🏪 Solicitud de cambio de CUIT — Panadería Don Juan',
        functionName: 'sendAdminNewChangeRequestEmail',
        file: 'src/lib/email-admin-ops.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('🏪 Solicitud de cambio', '#fffbeb', '#92400e')}</div>
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">Nueva solicitud de cambio de documento</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">Un comercio quiere modificar un documento ya aprobado.</p>
            ${emailInfoBox(`
                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Comercio:</strong> ${SAMPLE.merchantName}</p>
                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Documento:</strong> CUIT</p>
                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Motivo:</strong> Cambié de monotributo a responsable inscripto.</p>
            `)}
            ${emailButton('Revisar solicitud', `${baseUrl}/ops/usuarios`, 'blue')}
        `),
    },
    {
        id: 'points_expiring',
        number: 313,
        name: 'Puntos MOOVER por vencer (→ buyer)',
        category: 'Puntos MOOVER',
        recipient: 'comprador',
        priority: 'P2',
        status: 'implemented',
        trigger: 'Cron diario POST /api/cron/points-expiring-reminder',
        subject: '⏳ Tenés 1.250 puntos MOOVER por vencer',
        functionName: 'sendPointsExpiringEmail',
        file: 'src/lib/email-admin-ops.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('⏳ Puntos por vencer', '#fffbeb', '#92400e')}</div>
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">Tus puntos MOOVER están por vencer</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                ${SAMPLE.buyerName}, tu último pedido fue hace 5 meses. Si no hacés un nuevo pedido en los próximos <strong>30 días</strong>, tus puntos vencen.
            </p>
            <div style="text-align: center; margin: 24px 0;">
                <p style="color: #999; font-size: 12px; text-transform: uppercase; margin: 0 0 10px 0;">Tu saldo actual</p>
                <p style="color: #e60012; font-size: 36px; font-weight: 700; margin: 0;">1.250 pts</p>
                <p style="color: #555; font-size: 14px; margin: 4px 0 0 0;">Equivalen a $1.250 de descuento</p>
            </div>
            ${emailButton('Ver comercios y canjear', `${baseUrl}/tienda`, 'red')}
        `),
    },
    {
        id: 'driver_auto_activated',
        number: 314,
        name: 'Repartidor auto-activado (→ driver)',
        category: 'Onboarding Repartidor',
        recipient: 'repartidor',
        priority: 'P0',
        status: 'implemented',
        trigger: 'approveDriverDocument cuando aprueba el último doc requerido',
        subject: '🎉 Tu cuenta de repartidor MOOVY está activa',
        functionName: 'sendDriverAutoActivatedEmail',
        file: 'src/lib/email-admin-ops.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('✅ Cuenta activada', '#f0fdf4', '#166534')}</div>
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">🎉 ¡Ya sos repartidor MOOVY!</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
                ${SAMPLE.driverName}, aprobamos el último documento que faltaba. Tu cuenta está <strong>activa</strong>.
            </p>
            ${emailAlertBox(`<strong>Antes de conectarte por primera vez:</strong><br>• GPS activo<br>• Datos del vehículo al día<br>• Celular cargado`, 'success')}
            ${emailButton('Entrar al panel', `${baseUrl}/repartidor`, 'green')}
        `),
    },
    {
        id: 'referral_activated',
        number: 315,
        name: 'Referido completó primer pedido (→ referrer)',
        category: 'Puntos MOOVER',
        recipient: 'comprador',
        priority: 'P0',
        status: 'implemented',
        trigger: 'activatePendingBonuses en src/lib/points.ts (primer DELIVERED del referee)',
        subject: `🎁 Tu amigo hizo su primer pedido — sumaste 1.000 pts`,
        functionName: 'sendReferralActivatedEmail',
        file: 'src/lib/email-admin-ops.ts',
        generatePreview: () => emailLayout(`
            <div style="text-align: center; margin-bottom: 20px;">${emailBadge('🎁 Puntos de referido', '#fef2f2', '#991b1b')}</div>
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">¡Tu amigo hizo su primer pedido!</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                Gracias por invitar a ${SAMPLE.buyerName} a MOOVY. Ya recibiste los puntos por el referido.
            </p>
            <div style="text-align: center; margin: 24px 0;">
                <p style="color: #999; font-size: 12px; text-transform: uppercase; margin: 0 0 10px 0;">Ganaste</p>
                <p style="color: #059669; font-size: 36px; font-weight: 700; margin: 0;">+1.000 pts</p>
            </div>
            ${emailButton('Invitar a más amigos', `${baseUrl}/mi-perfil/invitar`, 'red')}
        `),
    },
];

// ─── Helpers de búsqueda ────────────────────────────────────────────────────

export function getEmailById(id: string): EmailRegistryEntry | undefined {
    return EMAIL_REGISTRY.find(e => e.id === id);
}

export function getEmailsByCategory(category: string): EmailRegistryEntry[] {
    return EMAIL_REGISTRY.filter(e => e.category === category);
}

export function getEmailsByRecipient(recipient: EmailRegistryEntry['recipient']): EmailRegistryEntry[] {
    return EMAIL_REGISTRY.filter(e => e.recipient === recipient);
}

export function getEmailsByPriority(priority: EmailRegistryEntry['priority']): EmailRegistryEntry[] {
    return EMAIL_REGISTRY.filter(e => e.priority === priority);
}

export function getEmailsByStatus(status: EmailRegistryEntry['status']): EmailRegistryEntry[] {
    return EMAIL_REGISTRY.filter(e => e.status === status);
}

export function getAllCategories(): string[] {
    return [...new Set(EMAIL_REGISTRY.map(e => e.category))];
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             