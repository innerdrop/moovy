import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Política de Cookies | Moovy',
    description: 'Información sobre las cookies que utiliza la plataforma MOOVY y cómo gestionarlas.',
};

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-[#e60012] transition mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al inicio
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Cookies</h1>
                <p className="text-gray-500 mb-8">Última actualización: Marzo 2026</p>

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-8">
                    {/* 1. Qué son las Cookies */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">1. ¿Qué son las Cookies?</h2>
                        <p className="text-gray-600 mb-4">
                            Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo
                            (computadora, teléfono móvil o tablet) cuando los visita. Se utilizan ampliamente para que
                            los sitios funcionen correctamente, mejorar la experiencia de usuario y proporcionar
                            información a los propietarios del sitio.
                        </p>
                        <p className="text-gray-600">
                            En <strong className="text-[#e60012]">MOOVY</strong> utilizamos cookies y tecnologías
                            similares para ofrecerle una experiencia segura, personalizada y eficiente en nuestra
                            plataforma.
                        </p>
                    </section>

                    {/* 2. Cookies que utiliza MOOVY */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">2. Cookies que Utiliza MOOVY</h2>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.1 Cookies Esenciales (Necesarias)</h3>
                        <p className="text-gray-600 mb-2">
                            Estas cookies son imprescindibles para el funcionamiento de la plataforma. Sin ellas,
                            no podríamos garantizar servicios básicos como la navegación segura y el acceso a su cuenta.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                            <li><strong>Sesión (NextAuth):</strong> Mantiene su sesión iniciada mientras navega por la plataforma</li>
                            <li><strong>CSRF Token:</strong> Protege contra ataques de falsificación de solicitudes</li>
                            <li><strong>Callback URL:</strong> Recuerda a qué página redirigirle después de iniciar sesión</li>
                        </ul>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.2 Cookies de Preferencias</h3>
                        <p className="text-gray-600 mb-2">
                            Nos permiten recordar sus preferencias para personalizar su experiencia:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                            <li><strong>Dirección de entrega:</strong> Recuerda su dirección seleccionada para futuros pedidos</li>
                            <li><strong>Carrito de compras:</strong> Mantiene los productos que agregó al carrito entre sesiones</li>
                            <li><strong>Notificaciones:</strong> Registra sus preferencias de notificaciones push</li>
                        </ul>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.3 Cookies de Rendimiento y Análisis</h3>
                        <p className="text-gray-600 mb-2">
                            Nos ayudan a entender cómo se utiliza la plataforma para mejorar nuestros servicios:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                            <li><strong>Analytics:</strong> Recopilan información anónima sobre el uso de la plataforma (páginas visitadas, tiempo de navegación)</li>
                            <li><strong>Rendimiento:</strong> Nos permiten detectar errores y optimizar la velocidad de carga</li>
                        </ul>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.4 Cookies de Funcionalidad</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li><strong>Geolocalización:</strong> Utilizada para mostrar comercios cercanos y calcular costos de envío</li>
                            <li><strong>Service Worker:</strong> Permiten el funcionamiento de notificaciones push y carga offline parcial</li>
                        </ul>
                    </section>

                    {/* 3. Cookies de Terceros */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. Cookies de Terceros</h2>
                        <p className="text-gray-600 mb-4">
                            Algunos servicios de terceros integrados en nuestra plataforma pueden establecer sus propias cookies:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li><strong>Google Maps:</strong> Para mostrar mapas de ubicación de comercios y seguimiento de entregas</li>
                            <li><strong>MercadoPago:</strong> Para procesar pagos de forma segura durante el checkout</li>
                            <li><strong>Google Analytics:</strong> Para análisis de uso de la plataforma (si está habilitado)</li>
                        </ul>
                        <p className="text-gray-600 mt-4">
                            Estas cookies están sujetas a las políticas de privacidad de sus respectivos proveedores.
                            MOOVY no controla el contenido ni las prácticas de estos terceros.
                        </p>
                    </section>

                    {/* 4. Cómo Gestionar las Cookies */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. Cómo Gestionar las Cookies</h2>
                        <p className="text-gray-600 mb-4">
                            Usted puede controlar y gestionar las cookies de diversas maneras:
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.1 Configuración del Navegador</h3>
                        <p className="text-gray-600 mb-4">
                            La mayoría de los navegadores le permiten ver, bloquear o eliminar cookies a través de su
                            configuración. Los pasos varían según el navegador:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                            <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                            <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
                            <li><strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos de sitios web</li>
                            <li><strong>Edge:</strong> Configuración → Privacidad → Cookies</li>
                        </ul>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-gray-700">
                                ⚠️ <strong>Importante:</strong> Si desactiva las cookies esenciales, es posible que no pueda
                                utilizar todas las funciones de MOOVY, como iniciar sesión, realizar pedidos o mantener
                                productos en su carrito de compras.
                            </p>
                        </div>
                    </section>

                    {/* 5. Duración de las Cookies */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. Duración de las Cookies</h2>
                        <p className="text-gray-600 mb-4">Las cookies que utilizamos tienen distintas duraciones:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li><strong>Cookies de sesión:</strong> Se eliminan automáticamente al cerrar el navegador</li>
                            <li><strong>Cookies persistentes:</strong> Permanecen en su dispositivo por un período determinado
                                (generalmente entre 30 días y 1 año) o hasta que usted las elimine manualmente</li>
                        </ul>
                    </section>

                    {/* 6. Cambios */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">6. Cambios a esta Política</h2>
                        <p className="text-gray-600">
                            Podemos actualizar esta Política de Cookies periódicamente para reflejar cambios en las
                            cookies que utilizamos o por otros motivos operativos, legales o regulatorios. Le recomendamos
                            revisar esta página regularmente para mantenerse informado sobre el uso de cookies.
                        </p>
                    </section>

                    {/* 7. Contacto */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">7. Contacto</h2>
                        <p className="text-gray-600">
                            Para consultas sobre nuestra Política de Cookies: <br />
                            <strong>Email:</strong> legal@somosmoovy.com <br />
                            <strong>Dirección:</strong> Ushuaia, Tierra del Fuego, Argentina
                        </p>
                    </section>
                </div>

                <p className="text-center text-gray-400 text-sm mt-8">
                    © {new Date().getFullYear()} MOOVY. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
