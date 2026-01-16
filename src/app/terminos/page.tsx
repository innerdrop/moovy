import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Términos y Condiciones | Moovy',
    description: 'Términos y Condiciones de uso de la plataforma Moovy.',
};

export default function TerminosPage() {
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

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
                <p className="text-gray-500 mb-8">Última actualización: Enero 2026</p>

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-8">
                    {/* 1. Introducción */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introducción y Aceptación</h2>
                        <p className="text-gray-600 mb-4">
                            Bienvenido a <strong className="text-[#e60012]">MOOVY</strong> (&quot;la Plataforma&quot;, &quot;nosotros&quot;, &quot;nuestro&quot;).
                            Al acceder y utilizar nuestra plataforma web ubicada en <strong>somosmoovy.com</strong> y cualquier subdominio asociado,
                            usted (&quot;Usuario&quot;, &quot;usted&quot;) acepta cumplir y estar sujeto a los siguientes Términos y Condiciones.
                        </p>
                        <p className="text-gray-600">
                            Si no está de acuerdo con estos términos, le solicitamos que no utilice nuestra plataforma.
                            El uso continuado de la plataforma constituye la aceptación de estos términos.
                        </p>
                    </section>

                    {/* 2. Naturaleza del Servicio */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">2. Naturaleza del Servicio - IMPORTANTE</h2>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-700 font-medium">
                                ⚠️ <strong>MOOVY NO ES UN VENDEDOR DE PRODUCTOS NI SERVICIOS.</strong>
                            </p>
                        </div>
                        <p className="text-gray-600 mb-4">
                            MOOVY es una <strong>plataforma tecnológica de intermediación</strong> (marketplace) que:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Facilita la conexión entre Comercios/Vendedores y Compradores/Consumidores</li>
                            <li>Proporciona un espacio digital para que terceros publiquen y vendan sus productos o servicios</li>
                            <li>Ofrece servicios de logística de última milla para la entrega de pedidos</li>
                            <li>Cobra comisiones sobre las ventas realizadas a través de la plataforma</li>
                            <li>Provee herramientas de gestión para comercios adheridos</li>
                        </ul>
                        <p className="text-gray-600 font-medium">
                            <strong>MOOVY no fabrica, produce, almacena, ni vende directamente ningún producto.</strong>
                            Todos los productos y servicios ofrecidos en la plataforma son provistos por terceros independientes
                            (&quot;Comercios&quot;, &quot;Vendedores&quot;, &quot;Merchants&quot;).
                        </p>
                    </section>

                    {/* 3. Exclusión de Responsabilidad */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. Exclusión de Responsabilidad sobre Productos</h2>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-700">
                                ⚠️ <strong>MOOVY no asume responsabilidad alguna por:</strong>
                            </p>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>La calidad, seguridad, legalidad o idoneidad de los productos o servicios publicados</li>
                            <li>La veracidad o exactitud de las publicaciones y descripciones de productos</li>
                            <li>La capacidad de los Comercios para vender los bienes o servicios</li>
                            <li>Incumplimientos contractuales entre Comercios y Consumidores</li>
                            <li>Daños directos, indirectos, incidentales o consecuentes derivados del uso o consumo de productos</li>
                            <li>Problemas de salud, alergias, intoxicaciones u otros efectos adversos por productos alimenticios</li>
                            <li>Defectos de fabricación, vicios ocultos o falta de conformidad de los productos</li>
                            <li>El cumplimiento de normativas sanitarias, bromatológicas o regulatorias por parte de los Comercios</li>
                        </ul>
                        <p className="text-gray-600">
                            <strong>Toda reclamación sobre productos debe ser dirigida directamente al Comercio vendedor.</strong>
                            MOOVY podrá, a su exclusivo criterio, facilitar la comunicación entre las partes, pero no está obligado a
                            intervenir ni mediar en disputas comerciales.
                        </p>
                    </section>

                    {/* 4. Relación con Comercios */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. Comercios y Vendedores</h2>
                        <p className="text-gray-600 mb-4">
                            Los Comercios que operan a través de MOOVY son entidades o personas independientes que:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Aceptan los términos específicos para Comercios de MOOVY</li>
                            <li>Son los únicos responsables de sus productos, precios, calidad y cumplimiento legal</li>
                            <li>Deben cumplir con todas las normativas aplicables (bromatología, habilitaciones, etc.)</li>
                            <li>Son responsables de la veracidad de la información publicada sobre sus productos</li>
                            <li>Asumen la responsabilidad tributaria y fiscal correspondiente a sus ventas</li>
                        </ul>
                        <p className="text-gray-600">
                            MOOVY no es empleador, socio, franquiciante ni responsable solidario de los Comercios.
                        </p>
                    </section>

                    {/* 5. Servicios de Delivery */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. Servicios de Entrega (Delivery)</h2>
                        <p className="text-gray-600 mb-4">
                            MOOVY puede ofrecer servicios de entrega a través de conductores independientes (&quot;Drivers&quot;).
                            Respecto a este servicio:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Los tiempos de entrega son estimados y pueden variar por factores externos</li>
                            <li>MOOVY no se responsabiliza por demoras causadas por clima, tráfico u otras circunstancias</li>
                            <li>Los productos deben ser verificados al momento de la entrega</li>
                            <li>Cualquier daño visible debe reportarse inmediatamente al recibir el pedido</li>
                            <li>Las entregas se realizan exclusivamente en la ciudad de Ushuaia, Tierra del Fuego</li>
                        </ul>
                    </section>

                    {/* 6. Programa de Puntos */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">6. Programa MOOVER (Puntos)</h2>
                        <p className="text-gray-600 mb-4">
                            El programa de puntos MOOVER está sujeto a las siguientes condiciones:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Los puntos no tienen valor monetario y no son transferibles ni canjeables por dinero</li>
                            <li>MOOVY se reserva el derecho de modificar o cancelar el programa en cualquier momento</li>
                            <li>Los puntos acumulados pueden expirar según las políticas vigentes</li>
                            <li>El uso fraudulento del programa resultará en la cancelación de puntos y posible suspensión de cuenta</li>
                        </ul>
                    </section>

                    {/* 7. Modelo de Comisiones */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">7. Modelo de Negocio</h2>
                        <p className="text-gray-600 mb-4">
                            MOOVY genera ingresos a través de:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Comisiones sobre las ventas realizadas por los Comercios a través de la plataforma</li>
                            <li>Tarifas de servicio de entrega cobradas a los Usuarios</li>
                            <li>Servicios de publicidad y posicionamiento para Comercios</li>
                            <li>Otros servicios de valor agregado para Comercios</li>
                        </ul>
                        <p className="text-gray-600">
                            Este modelo no convierte a MOOVY en vendedor o distribuidor de los productos ofrecidos.
                        </p>
                    </section>

                    {/* 8. Uso de la Plataforma */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">8. Uso Aceptable de la Plataforma</h2>
                        <p className="text-gray-600 mb-4">
                            El Usuario se compromete a:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Proporcionar información veraz y actualizada</li>
                            <li>No utilizar la plataforma para fines ilegales</li>
                            <li>No intentar vulnerar la seguridad de la plataforma</li>
                            <li>No realizar compras fraudulentas</li>
                            <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                            <li>Ser mayor de 18 años o contar con autorización de un tutor legal</li>
                        </ul>
                    </section>

                    {/* 9. Propiedad Intelectual */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">9. Propiedad Intelectual</h2>
                        <p className="text-gray-600">
                            Todos los contenidos de la plataforma (logos, marca MOOVY, textos, gráficos, código fuente, diseño)
                            son propiedad exclusiva de MOOVY o se utilizan bajo licencia. Queda prohibida su reproducción,
                            distribución, modificación o uso sin autorización expresa por escrito.
                        </p>
                    </section>

                    {/* 10. Modificaciones */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">10. Modificaciones a los Términos</h2>
                        <p className="text-gray-600">
                            MOOVY se reserva el derecho de modificar estos términos en cualquier momento.
                            Las modificaciones entrarán en vigor desde su publicación en la plataforma.
                            El uso continuado después de cualquier modificación constituye la aceptación de los nuevos términos.
                        </p>
                    </section>

                    {/* 11. Ley Aplicable */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">11. Ley Aplicable y Jurisdicción</h2>
                        <p className="text-gray-600">
                            Estos términos se rigen por las leyes de la República Argentina.
                            Cualquier controversia será sometida a los tribunales ordinarios de la ciudad de Ushuaia,
                            Provincia de Tierra del Fuego, Antártida e Islas del Atlántico Sur,
                            renunciando expresamente a cualquier otro fuero que pudiera corresponder.
                        </p>
                    </section>

                    {/* 12. Contacto */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">12. Contacto</h2>
                        <p className="text-gray-600">
                            Para consultas sobre estos términos: <br />
                            <strong>Email:</strong> legal@somosmoovy.com <br />
                            <strong>WhatsApp:</strong> +54 9 2901 55-3173
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
