import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const baseUrl = process.env.NEXTAUTH_URL || "https://somosmoovy.com";
const companyLogo = "https://somosmoovy.com/logo-moovy.png"; // Use absolute URL for emails

/**
 * Send welcome email to a new user
 */
export async function sendWelcomeEmail(email: string, firstName: string, referralCode: string) {
    try {
        await transporter.sendMail({
            from: `"MOOVY" <${process.env.SMTP_USER || "somosmoovy@gmail.com"}>`,
            to: email,
            subject: "¡Bienvenido a MOOVY! 🎉",
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <img src="${companyLogo}" alt="MOOVY" style="height: 50px; width: auto;" />
                    </div>
                    <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px;">
                        <h2 style="color: #111827; margin-top: 0;">¡Hola ${firstName}! 👋</h2>
                        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                            ¡Bienvenido a la comunidad MOOVY! Ya podés empezar a disfrutar de todos los beneficios.
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%); border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                            <h3 style="color: #b45309; margin: 0 0 10px 0; font-size: 16px;">⭐ Tu código de referido</h3>
                            <p style="color: #78350f; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">${referralCode}</p>
                            <p style="color: #92400e; font-size: 12px; margin: 8px 0 0 0;">Compartílo y gana puntos MOOVER cuando tus amigos compren</p>
                        </div>

                        <h3 style="color: #111827; font-size: 16px; margin-top: 25px;">¿Qué podés hacer con MOOVY?</h3>
                        <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                            <li>🛍️ <strong>Comprar</strong> en cientos de comercios locales</li>
                            <li>🚀 <strong>Recibir</strong> tus pedidos en minutos</li>
                            <li>⭐ <strong>Sumar puntos MOOVER</strong> con cada compra</li>
                            <li>🎁 <strong>Canjear</strong> tus puntos por descuentos exclusivos</li>
                            <li>👥 <strong>Referir amigos</strong> y ganar más puntos</li>
                        </ul>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${baseUrl}/tienda" 
                               style="display: inline-block; background: linear-gradient(to right, #e60012, #ff4444); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
                                Empezar a comprar
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} MOOVY™. Ushuaia, Tierra del Fuego.</p>
                    </div>
                </div>
            `,
        });
        console.log("[Email] Welcome email sent to:", email);
    } catch (error) {
        console.error("[Email] Error sending welcome email:", error);
    }
}

/**
 * Send order confirmation email to customer
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
    try {
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
            orderData.paymentMethod === 'mercadopago' ? 'Mercado Pago' :
                'Transferencia / Otros';

        await transporter.sendMail({
            from: `"MOOVY" <${process.env.SMTP_USER || "somosmoovy@gmail.com"}>`,
            to: orderData.email,
            subject: `¡Confirmación de tu pedido ${orderData.orderNumber}! 🛍️`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <img src="${companyLogo}" alt="MOOVY" style="height: 50px; width: auto;" />
                    </div>
                    
                    <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px;">
                        <div style="text-align: center; margin-bottom: 25px;">
                            <div style="background-color: #def7ec; color: #03543f; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: 600; margin-bottom: 10px;">
                                Pedido Confirmado
                            </div>
                            <h2 style="color: #111827; margin-top: 0;">¡Gracias por tu compra, ${orderData.customerName}!</h2>
                            <p style="color: #6b7280; font-size: 16px;">Recibimos tu pedido <strong>#${orderData.orderNumber}</strong> y ya estamos trabajando en él.</p>
                        </div>

                        <div style="background-color: white; border-radius: 10px; padding: 20px; margin-bottom: 25px; border: 1px solid #edf2f7;">
                            <h3 style="color: #1a202c; font-size: 16px; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #f7fafc; padding-bottom: 10px;">Resumen del Pedido</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                ${itemsHtml}
                            </table>
                            
                            <table style="width: 100%; margin-top: 15px;">
                                <tr>
                                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Subtotal</td>
                                    <td style="text-align: right; color: #2d3748; font-size: 14px; padding: 4px 0;">$${orderData.subtotal.toLocaleString('es-AR')}</td>
                                </tr>
                                ${orderData.deliveryFee > 0 ? `
                                <tr>
                                    <td style="color: #718096; font-size: 14px; padding: 4px 0;">Envío</td>
                                    <td style="text-align: right; color: #2d3748; font-size: 14px; padding: 4px 0;">$${orderData.deliveryFee.toLocaleString('es-AR')}</td>
                                </tr>` : ''}
                                ${orderData.discount > 0 ? `
                                <tr>
                                    <td style="color: #e53e3e; font-size: 14px; padding: 4px 0;">Descuento (Puntos)</td>
                                    <td style="text-align: right; color: #e53e3e; font-size: 14px; padding: 4px 0;">-$${orderData.discount.toLocaleString('es-AR')}</td>
                                </tr>` : ''}
                                <tr>
                                    <td style="color: #1a202c; font-weight: bold; font-size: 18px; padding: 15px 0 0 0;">Total</td>
                                    <td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px; padding: 15px 0 0 0;">$${orderData.total.toLocaleString('es-AR')}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
                            <div style="background-color: white; border-radius: 10px; padding: 20px; border: 1px solid #edf2f7;">
                                <h4 style="color: #718096; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; margin: 0 0 10px 0;">Método de Pago</h4>
                                <p style="color: #2d3748; font-weight: 500; margin: 0;">${paymentMethodLabel}</p>
                            </div>
                            
                            <div style="background-color: white; border-radius: 10px; padding: 20px; border: 1px solid #edf2f7;">
                                <h4 style="color: #718096; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; margin: 0 0 10px 0;">${orderData.isPickup ? 'Retiro en Local' : 'Dirección de Envío'}</h4>
                                <p style="color: #2d3748; font-weight: 500; margin: 0;">${orderData.isPickup ? 'Retiras tu pedido por el comercio' : orderData.address}</p>
                            </div>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${baseUrl}/mis-pedidos" 
                               style="display: inline-block; background: linear-gradient(to right, #e60012, #ff4444); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
                                Ver estado de mi pedido
                            </a>
                        </div>

                        <p style="color: #a0aec0; font-size: 14px; text-align: center; margin-top: 20px;">
                            Si tenés alguna duda con tu pedido, escribinos por WhatsApp al soporte.
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} MOOVY™. Ushuaia, Tierra del Fuego.</p>
                        <p>Este es un correo automático, por favor no lo respondas.</p>
                    </div>
                </div>
            `,
        });
        console.log("[Email] Order confirmation sent to:", orderData.email, "Order:", orderData.orderNumber);
    } catch (error) {
        console.error("[Email] Error sending order confirmation email:", error);
    }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetLink: string) {
    try {
        await transporter.sendMail({
            from: `"MOOVY" <${process.env.SMTP_USER || "somosmoovy@gmail.com"}>`,
            to: email,
            subject: "Restablecer contraseña - MOOVY",
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <img src="${companyLogo}" alt="MOOVY" style="height: 50px; width: auto;" />
                    </div>
                    <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px;">
                        <h2 style="color: #111827; margin-top: 0;">Restablecer contraseña</h2>
                        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                            Recibimos una solicitud para restablecer tu contraseña. 
                            Hacé click en el botón de abajo para crear una nueva contraseña.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" 
                               style="display: inline-block; background: linear-gradient(to right, #e60012, #ff4444); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
                                Restablecer Contraseña
                            </a>
                        </div>
                        <p style="color: #9ca3af; font-size: 14px;">
                            Este enlace expirará en 1 hora. Si no solicitaste restablecer tu contraseña, 
                            podés ignorar este correo.
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} MOOVY™. Ushuaia, Tierra del Fuego.</p>
                    </div>
                </div>
            `,
        });
        console.log("[Email] Password reset email sent to:", email);
    } catch (error) {
        console.error("[Email] Error sending password reset email:", error);
    }
}
