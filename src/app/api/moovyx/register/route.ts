import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
    try {
        const { name, email } = await request.json();

        if (!name || !email) {
            return NextResponse.json(
                { error: "Nombre y email son requeridos" },
                { status: 400 }
            );
        }

        // Send confirmation email to the business
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Email to the interested business
        await transporter.sendMail({
            from: `"MOOVY X" <${process.env.SMTP_USER || "somosmoovy@gmail.com"}>`,
            to: email,
            subject: "¡Gracias por tu interés en MOOVY X! 🌍",
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <img src="https://somosmoovy.com/logo-moovy.png" alt="MOOVY" style="height: 50px; width: auto;" />
                    </div>
                    <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%); border-radius: 12px; padding: 30px; border-left: 4px solid #14b8a6;">
                        <h2 style="color: #0f766e; margin-top: 0;">¡Hola ${name}! 👋</h2>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            Gracias por registrar tu interés en <strong style="color: #0d9488;">MOOVY X</strong>, 
                            nuestra nueva plataforma de turismo y experiencias en el Fin del Mundo.
                        </p>
                        
                        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h3 style="color: #0f766e; margin-top: 0; font-size: 16px;">¿Qué sigue?</h3>
                            <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                                <li>Estamos desarrollando una plataforma dedicada para negocios turísticos</li>
                                <li>Te mantendremos informado sobre el lanzamiento y las fechas clave</li>
                                <li>Serás de los primeros en acceder cuando abramos el registro oficial</li>
                                <li>Recibirás información sobre cómo registrar tus servicios en la tienda</li>
                            </ul>
                        </div>

                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            Próximamente te contactaremos con más detalles sobre cómo incorporar 
                            tu hotel, agencia de viajes, excursiones o servicios turísticos a la plataforma.
                        </p>

                        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                            Mientras tanto, si tenés alguna consulta, respondé directamente a este correo 
                            o escribinos a <a href="mailto:somosmoovy@gmail.com" style="color: #0d9488;">somosmoovy@gmail.com</a>.
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} MOOVY™. Ushuaia, Tierra del Fuego.</p>
                        <p style="margin-top: 8px;">
                            <a href="https://somosmoovy.com/moovyx" style="color: #14b8a6; text-decoration: none;">MOOVY X</a> · 
                            <a href="https://somosmoovy.com" style="color: #14b8a6; text-decoration: none;">somosmoovy.com</a>
                        </p>
                    </div>
                </div>
            `,
        });

        // Also send notification to MOOVY team
        await transporter.sendMail({
            from: `"MOOVY X" <${process.env.SMTP_USER || "somosmoovy@gmail.com"}>`,
            to: process.env.SMTP_USER || "somosmoovy@gmail.com",
            subject: `[MOOVY X] Nuevo interesado: ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Nuevo pre-registro en MOOVY X</h2>
                    <p><strong>Nombre:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
                </div>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("MOOVY X registration error:", error);
        return NextResponse.json(
            { error: "Error al procesar el registro" },
            { status: 500 }
        );
    }
}
