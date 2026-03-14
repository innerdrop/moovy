import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Política de Devoluciones y Reembolsos | Moovy',
    description: 'Información sobre devoluciones y reembolsos en la plataforma MOOVY, conforme la Ley 24.240 de Defensa del Consumidor.',
};

export default function DevolucionesPage() {
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

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Devoluciones y Reembolsos</h1>
                <p className="text-gray-500 mb-8">Última actualización: Marzo 2026</p>

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-8">
                    {/* 1. Introducción */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introducción</h2>
                        <p className="text-gray-600 mb-4">
                            En <strong className="text-[#e60012]">MOOVY</strong> queremos que tu experiencia de compra
                            sea satisfactoria. Esta Política de Devoluciones y Reembolsos establece las condiciones
                            bajo las cuales podés solicitar la devolución de un producto o el reembolso de tu dinero.
                        </p>
                        <p className="text-gray-600">
                            Esta política se rige por la Ley 24.240 de Defensa del Consumidor de la República Argentina
                            y sus modificatorias, así como por la normativa complementaria aplicable.
                        </p>
                    </section>

                    {/* 2. Cuándo aplica */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">2. ¿Cuándo Podés Solicitar una Devolución?</h2>
                        <p className="text-gray-600 mb-4">
                            Podés solicitar una devolución o reembolso en los siguientes casos:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li><strong>Producto defectuoso:</strong> El producto presenta fallas de fabricación, vicios
                                ocultos o no cumple con las condiciones de calidad esperables</li>
                            <li><strong>Producto distinto al descrito:</strong> El producto recibido no coincide con la
                                descripción, fotos o especificaciones publicadas por el vendedor o comercio</li>
                            <li><strong>Producto dañado en el transporte:</strong> El producto llegó en mal estado por
                                daños durante la entrega</li>
                            <li><strong>Pedido incompleto:</strong> Faltaron uno o más productos del pedido</li>
                            <li><strong>Pedido incorrecto:</strong> Se entregaron productos diferentes a los solicitados</li>
                        </ul>
                    </section>

                    {/* 3. Plazos */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. Plazos para Solicitar la Devolución</h2>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-700 font-medium">
                                ✓ <strong>Tenés hasta 10 (diez) días hábiles desde la recepción del producto para
                                solicitar una devolución, conforme lo establece la Ley 24.240.</strong>
                            </p>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>El plazo comienza a contar desde la fecha y hora en que el pedido fue entregado</li>
                            <li>Para productos dañados en el transporte, recomendamos reportarlo inmediatamente al
                                recibir el pedido a través de la app</li>
                            <li>Transcurrido el plazo, no se aceptarán solicitudes de devolución salvo en casos de
                                garantía legal (Art. 11, Ley 24.240)</li>
                        </ul>
                    </section>

                    {/* 4. Proceso */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. Proceso de Devolución</h2>
                        <p className="text-gray-600 mb-4">
                            Para solicitar una devolución, seguí estos pasos:
                        </p>
                        <ol className="list-decimal list-inside space-y-3 text-gray-600">
                            <li><strong>Contactá a MOOVY:</strong> Ingresá al Centro de Ayuda desde tu perfil o
                                escribinos a <strong>soporte@somosmoovy.com</strong> indicando el número de pedido
                                y el motivo de la devolución</li>
                            <li><strong>Adjuntá evidencia:</strong> Enviá fotos del producto mostrando el problema
                                (defecto, daño, diferencia con lo publicado)</li>
                            <li><strong>Evaluación:</strong> MOOVY evaluará tu solicitud y, de ser necesario, coordinará
                                con el vendedor o comercio para resolver la situación</li>
                            <li><strong>Resolución:</strong> Te informaremos la resolución dentro de los 5 (cinco) días
                                hábiles desde que recibamos toda la información necesaria</li>
                        </ol>
                    </section>

                    {/* 5. Formas de Reembolso */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. Formas de Reembolso</h2>
                        <p className="text-gray-600 mb-4">
                            De aprobarse la devolución, el reembolso podrá realizarse a través de:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li><strong>MercadoPago:</strong> Reintegro al medio de pago original utilizado en la compra.
                                El plazo de acreditación depende del medio de pago y de MercadoPago (generalmente entre
                                5 y 15 días hábiles)</li>
                            <li><strong>Puntos MOOVER:</strong> Acreditación de puntos equivalentes al valor del producto
                                devuelto, disponibles para canjear en futuras compras</li>
                            <li><strong>Crédito en la plataforma:</strong> Saldo a favor para utilizar en tu próximo pedido</li>
                        </ul>
                        <p className="text-gray-600">
                            El método de reembolso será acordado con el comprador al momento de aprobar la devolución.
                            En caso de disputa sobre el método, se priorizará el reintegro al medio de pago original.
                        </p>
                    </section>

                    {/* 6. Productos No Retornables */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">6. Productos No Retornables</h2>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-700">
                                ⚠️ <strong>Los siguientes productos NO admiten devolución, salvo que presenten defectos:</strong>
                            </p>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li><strong>Alimentos perecederos:</strong> Comidas preparadas, productos frescos, congelados
                                o refrigerados (salvo que lleguen en mal estado o no cumplan condiciones sanitarias)</li>
                            <li><strong>Productos de higiene personal:</strong> Artículos que por su naturaleza no pueden
                                ser devueltos por razones sanitarias una vez abiertos</li>
                            <li><strong>Productos personalizados:</strong> Artículos fabricados a medida o personalizados
                                según especificaciones del comprador</li>
                            <li><strong>Productos sellados:</strong> Que hayan sido abiertos después de la entrega y no
                                puedan devolverse por razones de protección de la salud o higiene</li>
                        </ul>
                        <p className="text-gray-600 mt-4">
                            Aun en estos casos, si el producto presenta defectos, no coincide con la descripción o
                            llegó dañado, la devolución será aceptada conforme la Ley 24.240.
                        </p>
                    </section>

                    {/* 7. Responsabilidad */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">7. Responsabilidad</h2>
                        <p className="text-gray-600 mb-4">
                            Dado que MOOVY actúa como intermediario:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>La responsabilidad principal por la calidad y conformidad del producto recae en el
                                vendedor o comercio que lo ofreció</li>
                            <li>MOOVY facilitará la comunicación entre las partes para resolver la situación</li>
                            <li>En caso de daños durante el transporte, MOOVY evaluará la responsabilidad según
                                las circunstancias del caso</li>
                            <li>MOOVY podrá, a su exclusivo criterio, realizar el reembolso directamente al comprador
                                y gestionar el cobro correspondiente al vendedor o comercio</li>
                        </ul>
                    </section>

                    {/* 8. Garantía Legal */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">8. Garantía Legal</h2>
                        <p className="text-gray-600 mb-4">
                            Conforme la Ley 24.240, los productos nuevos cuentan con una garantía legal mínima de
                            6 (seis) meses y los productos usados de 3 (tres) meses, contados desde la fecha de entrega.
                        </p>
                        <p className="text-gray-600">
                            Durante el período de garantía legal, el consumidor puede reclamar por defectos o vicios
                            ocultos al vendedor o comercio. MOOVY podrá asistir en la gestión del reclamo pero la
                            responsabilidad de la garantía recae en quien vendió el producto.
                        </p>
                    </section>

                    {/* 9. Contacto */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">9. Contacto</h2>
                        <p className="text-gray-600">
                            Para solicitar devoluciones o consultas: <br />
                            <strong>Email:</strong> soporte@somosmoovy.com <br />
                            <strong>Centro de Ayuda:</strong> Disponible desde la sección &quot;Mi Perfil&quot; en la app <br />
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
