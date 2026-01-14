
import React from 'react';

export const metadata = {
    title: 'Política de Privacidad | Moovy',
    description: 'Información sobre cómo recopilamos y protegemos tus datos personales.',
};

export default function PrivacidadPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold text-navy mb-8 text-center">Política de Privacidad</h1>

            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 space-y-6 text-gray-700">
                <section>
                    <h2 className="text-xl font-bold text-moovy-dark mb-3">1. Recopilación de Información</h2>
                    <p>
                        En Moovy, recopilamos información personal que nos proporcionas directamente al registrarte, realizar un pedido o contactarnos.
                        Esto puede incluir tu nombre, dirección de correo electrónico, número de teléfono y dirección de entrega.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-moovy-dark mb-3">2. Uso de la Información</h2>
                    <p>
                        Utilizamos tu información para:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>Procesar y entregar tus pedidos.</li>
                        <li>Comunicarnos con vos sobre el estado de tu compra.</li>
                        <li>Mejorar nuestros servicios y experiencia de usuario.</li>
                        <li>Enviarte promociones y novedades (si aceptaste recibirlas).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-moovy-dark mb-3">3. Protección de Datos</h2>
                    <p>
                        Nos tomamos muy en serio la seguridad de tus datos. Implementamos medidas técnicas y organizativas para proteger tu información personal contra el acceso no autorizado,
                        la alteración, la divulgación o la destrucción.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-moovy-dark mb-3">4. Cookies</h2>
                    <p>
                        Utilizamos cookies y tecnologías similares para mejorar la funcionalidad de nuestro sitio web y recordar tus preferencias.
                        Podés configurar tu navegador para rechazar todas las cookies o para que te avise cuando se envía una cookie.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-moovy-dark mb-3">5. Compartir Información</h2>
                    <p>
                        No vendemos ni alquilamos tu información personal a terceros. Solo compartimos tu información con proveedores de servicios de confianza
                        (como repartidores o procesadores de pago) que necesitan acceder a ella para cumplir con nuestros servicios, bajo estrictas obligaciones de confidencialidad.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-moovy-dark mb-3">6. Tus Derechos</h2>
                    <p>
                        Tenés derecho a acceder, corregir o eliminar tu información personal en cualquier momento. Podés hacerlo desde tu perfil de usuario o contactándonos directamente.
                    </p>
                </section>

                <div className="pt-6 border-t border-gray-100 text-sm text-gray-500">
                    Última actualización: Enero 2026
                </div>
            </div>
        </div>
    );
}

