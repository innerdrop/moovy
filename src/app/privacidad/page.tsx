import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Política de Privacidad | Moovy',
    description: 'Información sobre cómo recopilamos, usamos y protegemos tus datos personales en MOOVY.',
};

export default function PrivacidadPage() {
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

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
                <p className="text-gray-500 mb-8">Última actualización: Enero 2026</p>

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-8">
                    {/* 1. Introducción */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introducción</h2>
                        <p className="text-gray-600 mb-4">
                            En <strong className="text-[#e60012]">MOOVY</strong> (&quot;nosotros&quot;, &quot;nuestro&quot;) nos comprometemos a proteger
                            la privacidad de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos, usamos,
                            compartimos y protegemos su información personal cuando utiliza nuestra plataforma.
                        </p>
                        <p className="text-gray-600">
                            Al utilizar nuestros servicios, usted acepta las prácticas descritas en esta política.
                            Le recomendamos leer este documento detenidamente.
                        </p>
                    </section>

                    {/* 2. Información que Recopilamos */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">2. Información que Recopilamos</h2>
                        <p className="text-gray-600 mb-4">Recopilamos los siguientes tipos de información:</p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.1 Información proporcionada directamente:</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                            <li>Nombre completo y apellido</li>
                            <li>Dirección de correo electrónico</li>
                            <li>Número de teléfono</li>
                            <li>Dirección de entrega</li>
                            <li>Datos de perfil y preferencias</li>
                        </ul>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.2 Información recopilada automáticamente:</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                            <li>Dirección IP y datos de ubicación aproximada</li>
                            <li>Tipo de dispositivo y sistema operativo</li>
                            <li>Navegador utilizado</li>
                            <li>Páginas visitadas y tiempo de navegación</li>
                            <li>Historial de pedidos y preferencias de compra</li>
                        </ul>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.3 Información de terceros:</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Datos de autenticación si inicia sesión con proveedores externos (Google, etc.)</li>
                            <li>Información de referidos si se registró con un código de invitación</li>
                        </ul>
                    </section>

                    {/* 3. Uso de la Información */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. Cómo Usamos su Información</h2>
                        <p className="text-gray-600 mb-4">Utilizamos la información recopilada para:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>Procesar y entregar sus pedidos</li>
                            <li>Crear y gestionar su cuenta de usuario</li>
                            <li>Comunicarnos sobre el estado de sus compras</li>
                            <li>Administrar el programa de puntos MOOVER</li>
                            <li>Enviar promociones y ofertas (con su consentimiento)</li>
                            <li>Mejorar nuestros servicios y experiencia de usuario</li>
                            <li>Detectar y prevenir fraudes</li>
                            <li>Cumplir con obligaciones legales</li>
                            <li>Resolver disputas y brindar soporte al cliente</li>
                        </ul>
                    </section>

                    {/* 4. Compartir Información */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. Con Quién Compartimos su Información</h2>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-700 font-medium">
                                ✓ <strong>NO vendemos ni alquilamos su información personal a terceros.</strong>
                            </p>
                        </div>
                        <p className="text-gray-600 mb-4">Solo compartimos información en los siguientes casos:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li><strong>Comercios:</strong> Compartimos los datos necesarios para preparar su pedido (nombre, dirección, teléfono)</li>
                            <li><strong>Conductores:</strong> Datos de entrega para completar el delivery</li>
                            <li><strong>Procesadores de pago:</strong> Información necesaria para procesar transacciones</li>
                            <li><strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar la plataforma (hosting, analytics)</li>
                            <li><strong>Autoridades:</strong> Cuando sea requerido por ley o proceso legal</li>
                        </ul>
                        <p className="text-gray-600 mt-4">
                            Todos nuestros proveedores están sujetos a obligaciones de confidencialidad.
                        </p>
                    </section>

                    {/* 5. Seguridad */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. Seguridad de la Información</h2>
                        <p className="text-gray-600 mb-4">
                            Implementamos medidas de seguridad técnicas y organizativas para proteger su información:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>Encriptación de datos en tránsito (HTTPS/TLS)</li>
                            <li>Almacenamiento seguro con acceso restringido</li>
                            <li>Contraseñas encriptadas con algoritmos seguros</li>
                            <li>Monitoreo de actividad sospechosa</li>
                            <li>Copias de seguridad regulares</li>
                        </ul>
                        <p className="text-gray-600 mt-4">
                            Sin embargo, ningún sistema es 100% seguro. Le recomendamos proteger sus credenciales de acceso.
                        </p>
                    </section>

                    {/* 6. Cookies */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">6. Cookies y Tecnologías Similares</h2>
                        <p className="text-gray-600 mb-4">
                            Utilizamos cookies y tecnologías similares para:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Mantener su sesión iniciada</li>
                            <li>Recordar sus preferencias</li>
                            <li>Analizar el uso de la plataforma</li>
                            <li>Personalizar su experiencia</li>
                        </ul>
                        <p className="text-gray-600">
                            Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad de la plataforma.
                        </p>
                    </section>

                    {/* 7. Sus Derechos */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">7. Sus Derechos (ARCO)</h2>
                        <p className="text-gray-600 mb-4">
                            De acuerdo con la Ley 25.326 de Protección de Datos Personales de Argentina, usted tiene derecho a:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li><strong>Acceso:</strong> Solicitar información sobre qué datos tenemos sobre usted</li>
                            <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                            <li><strong>Cancelación:</strong> Solicitar la eliminación de sus datos</li>
                            <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos para ciertos fines</li>
                        </ul>
                        <p className="text-gray-600">
                            Para ejercer estos derechos, contáctenos a <strong>privacidad@somosmoovy.com</strong> o
                            desde la sección &quot;Mi Perfil&quot; en la plataforma.
                        </p>
                    </section>

                    {/* 8. Retención */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">8. Retención de Datos</h2>
                        <p className="text-gray-600">
                            Conservamos su información mientras su cuenta esté activa o según sea necesario para
                            prestarle servicios. También podemos retener ciertos datos para cumplir con obligaciones
                            legales, resolver disputas y hacer cumplir nuestros acuerdos.
                        </p>
                    </section>

                    {/* 9. Menores */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">9. Menores de Edad</h2>
                        <p className="text-gray-600">
                            Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos
                            intencionalmente información de menores. Si detectamos que un menor ha proporcionado
                            datos personales, procederemos a eliminarlos de nuestros sistemas.
                        </p>
                    </section>

                    {/* 10. Cambios */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">10. Cambios a esta Política</h2>
                        <p className="text-gray-600">
                            Podemos actualizar esta política periódicamente. Le notificaremos sobre cambios
                            significativos a través de la plataforma o por correo electrónico. Le recomendamos
                            revisar esta página regularmente.
                        </p>
                    </section>

                    {/* 11. Contacto */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">11. Contacto</h2>
                        <p className="text-gray-600">
                            Para consultas sobre privacidad: <br />
                            <strong>Email:</strong> privacidad@somosmoovy.com <br />
                            <strong>Dirección:</strong> Ushuaia, Tierra del Fuego, Argentina
                        </p>
                        <p className="text-gray-600 mt-4 text-sm">
                            El titular de la base de datos es MOOVY. La Agencia de Acceso a la Información Pública
                            tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten
                            afectados en sus derechos por incumplimiento de las normas vigentes en materia de
                            protección de datos personales.
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
