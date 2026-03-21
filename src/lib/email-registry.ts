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
        subject: 'Tu contraseña fue cambiada - MOOVY',
        functionName: 'inline (change-password/route.ts)',
        file: 'src/app/api/auth/change-password/route.ts',
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
                Ya podés empezar a recibir pedidos y generar ingresos.
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
