import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Política de Cancelaciones | Moovy',
    description: 'Información sobre la política de cancelaciones de pedidos en la plataforma MOOVY.',
};

export default function CancelacionesPage() {
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

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Cancelaciones</h1>
                <p className="text-gray-500 mb-8">Última actualización: Marzo 2026</p>

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-8">
                    {/* 1. Introducción */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introducción</h2>
                        <p className="text-gray-600">
                            Esta Política de Cancelaciones establece las condiciones bajo las cuales los pedidos
                            realizados a través de <strong className="text-[#e60012]">MOOVY</strong> pueden ser
                            cancelados por las distintas partes involucradas: compradores, vendedores, comercios
                            y la propia plataforma.
                        </p>
                    </section>

                    {/* 2. Cancelación por el Comprador */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">2. Cancelación por el Comprador</h2>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.1 Antes de la confirmación del comercio/vendedor</h3>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-700 font-medium">
                                ✓ <strong>Cancelación gratuita y sin penalidad.</strong> El reembolso se procesa
                                automáticamente al medio de pago original.
                            </p>
                        </div>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.2 Después de la confirmación, antes de la preparación</h3>
                        <p className="text-gray-600 mb-4">
                            Si el comercio o vendedor ya confirmó el pedido pero aún no comenzó la preparación,
                            el comprador podrá solicitar la cancelación. El reembolso se procesará, pudiendo aplicarse
                            un cargo administrativo mínimo según el caso.
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.3 Durante la preparación</h3>
                        <p className="text-gray-600 mb-4">
                            Una vez que el comercio o vendedor comenzó a preparar el pedido, la cancelación por
                            parte del comprador podrá estar sujeta a un cargo parcial o total, dependiendo del
                            estado de preparación y la naturaleza de los productos (especialmente alimentos ya preparados).
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.4 En camino (pedido en delivery)</h3>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-700">
                                ⚠️ <strong>Una vez que el pedido está en camino con el repartidor, NO se aceptan
                                cancelaciones.</strong> Si hay un problema con el pedido entregado, se aplica la
                                Política de Devoluciones.
                            </p>
                        </div>
                    </section>

                    {/* 3. Cancelación por el Vendedor/Comercio */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. Cancelación por el Vendedor o Comercio</h2>
                        <p className="text-gray-600 mb-4">
                            El vendedor o comercio puede cancelar un pedido en los siguientes casos:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li><strong>Falta de stock:</strong> El producto solicitado no está disponible</li>
                            <li><strong>Error en el precio:</strong> El precio publicado contenía un error evidente</li>
                            <li><strong>Imposibilidad de preparación:</strong> Circunstancias que impiden completar
                                el pedido (falla de equipos, cierre imprevisto, etc.)</li>
                            <li><strong>Pedido sospechoso:</strong> Indicios de fraude o actividad irregular</li>
                        </ul>
                        <p className="text-gray-600">
                            En todos estos casos, el comprador recibirá un <strong>reembolso completo</strong> sin
                            cargo alguno. Las cancelaciones recurrentes por falta de stock podrán afectar la
                            visibilidad del comercio en la plataforma y, en casos reiterados, dar lugar a la
                            suspensión de la cuenta conforme los Términos para Comercios.
                        </p>
                    </section>

                    {/* 4. Cancelaciones Automáticas */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. Cancelaciones Automáticas</h2>
                        <p className="text-gray-600 mb-4">
                            MOOVY podrá cancelar pedidos automáticamente en los siguientes escenarios:
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.1 Timeout de confirmación del comercio</h3>
                        <p className="text-gray-600 mb-4">
                            Si el comercio o vendedor no confirma el pedido dentro del tiempo establecido
                            (configurable por la plataforma, generalmente 5 minutos), el pedido se cancela
                            automáticamente y el comprador recibe un reembolso completo.
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.2 Sin repartidor disponible</h3>
                        <p className="text-gray-600 mb-4">
                            Si el sistema de asignación no encuentra un repartidor disponible después de agotar
                            todos los intentos, el pedido podrá ser cancelado. El comprador recibirá un reembolso
                            completo y será notificado.
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.3 Pedidos programados no confirmados</h3>
                        <p className="text-gray-600 mb-4">
                            Para pedidos programados, si el vendedor no confirma la preparación dentro del plazo
                            previo a la hora programada (generalmente 30 minutos antes), el pedido se cancela
                            automáticamente con reembolso completo.
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.4 Problemas de pago</h3>
                        <p className="text-gray-600">
                            Si el pago a través de MercadoPago es rechazado, caduca o presenta irregularidades,
                            el pedido será cancelado automáticamente.
                        </p>
                    </section>

                    {/* 5. Cancelación por MOOVY */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. Cancelación por MOOVY</h2>
                        <p className="text-gray-600 mb-4">
                            MOOVY se reserva el derecho de cancelar pedidos en los siguientes casos:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>Sospecha de fraude o uso indebido de la plataforma</li>
                            <li>Violación de los Términos y Condiciones por cualquiera de las partes</li>
                            <li>Situaciones de fuerza mayor que impidan la operación</li>
                            <li>Errores técnicos que afecten la integridad del pedido</li>
                            <li>Por solicitud de las autoridades competentes</li>
                        </ul>
                    </section>

                    {/* 6. Reembolsos por Cancelación */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">6. Reembolsos por Cancelación</h2>
                        <p className="text-gray-600 mb-4">
                            Los reembolsos se procesan de la siguiente manera:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li><strong>Pagos con MercadoPago:</strong> El reembolso se realiza al medio de pago
                                original. El plazo de acreditación depende del medio de pago utilizado (tarjeta
                                de crédito: 1-2 estados de cuenta; tarjeta de débito: 5-10 días hábiles; dinero
                                en cuenta MP: inmediato)</li>
                            <li><strong>Pagos en efectivo:</strong> Si el pedido fue cancelado antes de la entrega,
                                no se cobra al comprador. Si ya se realizó un pago parcial, se gestionará el
                                reembolso por transferencia o crédito en la plataforma</li>
                            <li><strong>Puntos MOOVER:</strong> Los puntos utilizados en el pedido se restituyen
                                automáticamente al saldo del comprador</li>
                        </ul>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <p className="text-gray-700 font-medium">
                                ✓ <strong>En cancelaciones no imputables al comprador</strong> (timeout del
                                comercio, falta de stock, sin repartidor), el reembolso es siempre del 100%
                                sin cargo alguno.
                            </p>
                        </div>
                    </section>

                    {/* 7. Penalidades */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">7. Penalidades por Cancelaciones Reiteradas</h2>
                        <p className="text-gray-600 mb-4">
                            Las cancelaciones reiteradas pueden tener consecuencias:
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">Para Compradores:</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                            <li>Las cancelaciones abusivas o fraudulentas podrán resultar en la suspensión
                                temporal de la cuenta</li>
                        </ul>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">Para Comercios y Vendedores:</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                            <li>Reducción de visibilidad en la plataforma</li>
                            <li>Alerta visible para el equipo de operaciones</li>
                            <li>Suspensión temporal o permanente de la cuenta en casos graves</li>
                        </ul>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">Para Repartidores:</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Rechazos reiterados de ofertas de entrega pueden afectar la prioridad de
                                asignación de futuros pedidos</li>
                        </ul>
                    </section>

                    {/* 8. Contacto */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">8. Contacto</h2>
                        <p className="text-gray-600">
                            Para consultas sobre cancelaciones: <br />
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
