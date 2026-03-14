import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Términos para Comercios | Moovy',
    description: 'Términos y condiciones específicos para comercios adheridos a la plataforma MOOVY.',
};

export default function TerminosComercioPage() {
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

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y Condiciones para Comercios</h1>
                <p className="text-gray-500 mb-8">Última actualización: Marzo 2026</p>

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-8">
                    {/* 1. Introducción */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introducción y Aceptación</h2>
                        <p className="text-gray-600 mb-4">
                            Los presentes Términos y Condiciones (&quot;Términos&quot;) regulan la relación entre
                            <strong className="text-[#e60012]"> MOOVY</strong> y los comercios, locales gastronómicos,
                            tiendas y otros establecimientos que operan a través de la plataforma (&quot;Comercios&quot;
                            o &quot;Merchants&quot;).
                        </p>
                        <p className="text-gray-600">
                            Al registrar un Comercio en MOOVY, el titular o representante legal declara haber leído,
                            comprendido y aceptado íntegramente estos Términos. Estos Términos complementan los
                            Términos y Condiciones generales de la plataforma.
                        </p>
                    </section>

                    {/* 2. Naturaleza */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">2. Naturaleza de la Relación</h2>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-700 font-medium">
                                ⚠️ <strong>MOOVY actúa como intermediario tecnológico entre el Comercio y los consumidores.</strong>
                            </p>
                        </div>
                        <p className="text-gray-600 mb-4">
                            MOOVY provee una plataforma digital que permite a los Comercios exhibir y vender sus productos,
                            y opcionalmente utilizar el servicio de logística de última milla para la entrega de pedidos.
                            No existe entre MOOVY y el Comercio relación laboral, societaria, de franquicia ni de
                            representación comercial.
                        </p>
                        <p className="text-gray-600">
                            El Comercio es el único responsable de los productos que ofrece, su calidad, precios, stock,
                            condiciones de higiene y cumplimiento de la normativa vigente.
                        </p>
                    </section>

                    {/* 3. Requisitos */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. Requisitos para Operar</h2>
                        <p className="text-gray-600 mb-4">
                            Para registrarse y operar como Comercio en MOOVY, se requiere:
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.1 Documentación Fiscal y Legal</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                            <li>CUIT de la persona física o jurídica titular del comercio</li>
                            <li>Constancia de inscripción ante AFIP (Monotributo o Responsable Inscripto)</li>
                            <li>Habilitación municipal del comercio expedida por la Municipalidad de Ushuaia</li>
                            <li>CBU o Alias bancario para la recepción de pagos</li>
                        </ul>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.2 Requisitos Adicionales para Alimentos</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                            <li>Registro sanitario o habilitación bromatológica expedida por la autoridad sanitaria
                                competente de Tierra del Fuego</li>
                            <li>Cumplimiento del Código Alimentario Argentino</li>
                            <li>Libreta sanitaria del personal manipulador de alimentos</li>
                        </ul>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.3 Requisitos Operativos</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Dispositivo con acceso a internet para gestionar pedidos en tiempo real</li>
                            <li>Capacidad operativa para responder a pedidos dentro del tiempo de confirmación configurado</li>
                            <li>Persona responsable disponible durante el horario de operación declarado</li>
                        </ul>
                    </section>

                    {/* 4. Comisiones */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. Comisiones, Tarifas y Pagos</h2>
                        <p className="text-gray-600 mb-4">
                            MOOVY cobra una comisión porcentual sobre cada venta realizada a través de la plataforma.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>El porcentaje de comisión será informado al Comercio antes de su aceptación de estos Términos</li>
                            <li>La comisión se calcula sobre el precio de venta de los productos (sin incluir el costo de envío)</li>
                            <li>La comisión se descuenta automáticamente al momento de liquidar al Comercio</li>
                            <li>MOOVY podrá ofrecer planes de publicación y posicionamiento con tarifas adicionales</li>
                            <li>Los pagos se procesan a través de MercadoPago al CBU/Alias registrado del Comercio</li>
                            <li>MOOVY podrá modificar las comisiones con aviso previo de 30 días</li>
                        </ul>
                        <p className="text-gray-600">
                            El Comercio es responsable de cumplir con todas sus obligaciones tributarias y fiscales,
                            incluyendo la emisión de facturas o tickets fiscales correspondientes.
                        </p>
                    </section>

                    {/* 5. SLA */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. Nivel de Servicio (SLA)</h2>
                        <p className="text-gray-600 mb-4">
                            El Comercio se compromete a mantener los siguientes estándares de servicio:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li><strong>Confirmación de pedidos:</strong> El Comercio debe confirmar o rechazar cada pedido
                                dentro del tiempo de confirmación configurado en la plataforma. Si no se confirma en el
                                plazo establecido, el pedido se cancelará automáticamente</li>
                            <li><strong>Preparación:</strong> El Comercio debe preparar los pedidos dentro del tiempo de
                                preparación declarado en su configuración</li>
                            <li><strong>Stock actualizado:</strong> El Comercio debe mantener actualizada la disponibilidad
                                de sus productos para evitar cancelaciones por falta de stock</li>
                            <li><strong>Horarios:</strong> El Comercio debe operar dentro de los horarios declarados en la
                                plataforma, y actualizar su estado a &quot;cerrado&quot; cuando no esté disponible</li>
                        </ul>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-gray-700">
                                ⚠️ El incumplimiento reiterado de los tiempos de confirmación o preparación podrá
                                resultar en la reducción de visibilidad del Comercio en la plataforma o la suspensión
                                temporal de su cuenta.
                            </p>
                        </div>
                    </section>

                    {/* 6. Responsabilidad */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">6. Responsabilidad del Comercio</h2>
                        <p className="text-gray-600 mb-4">
                            El Comercio es exclusiva e íntegramente responsable por:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>La calidad, seguridad, legalidad e idoneidad de los productos que vende</li>
                            <li>La veracidad de los precios, descripciones y fotos publicadas</li>
                            <li>El cumplimiento de las normas sanitarias, bromatológicas y regulatorias aplicables</li>
                            <li>Las garantías legales conforme la Ley 24.240 de Defensa del Consumidor</li>
                            <li>Los daños que sus productos pudieran ocasionar a los consumidores</li>
                            <li>Mantener vigentes todas las habilitaciones y registros requeridos para su actividad</li>
                            <li>El correcto embalaje de los productos para su transporte</li>
                        </ul>
                    </section>

                    {/* 7. Propiedad Intelectual */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">7. Contenido y Propiedad Intelectual</h2>
                        <p className="text-gray-600 mb-4">
                            El Comercio garantiza que las imágenes, logos, descripciones y todo contenido que publique
                            en la plataforma son de su propiedad o cuenta con las licencias necesarias para su uso.
                        </p>
                        <p className="text-gray-600">
                            El Comercio otorga a MOOVY una licencia no exclusiva, gratuita y revocable para utilizar
                            su nombre comercial, logo y contenido publicado con fines de exhibición, promoción y
                            operación de la plataforma, incluyendo redes sociales y materiales publicitarios.
                        </p>
                    </section>

                    {/* 8. Suspensión */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">8. Suspensión y Baja de Cuenta</h2>
                        <p className="text-gray-600 mb-4">
                            MOOVY podrá suspender temporal o permanentemente la cuenta de un Comercio en los siguientes casos:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Incumplimiento de estos Términos o de los Términos generales</li>
                            <li>Habilitaciones o registros sanitarios vencidos o revocados</li>
                            <li>Reiteradas calificaciones negativas o reclamos de consumidores</li>
                            <li>Incumplimiento reiterado del SLA (confirmaciones tardías, cancelaciones por falta de stock)</li>
                            <li>Sospecha de fraude o actividad ilícita</li>
                            <li>Información falsa o engañosa en publicaciones</li>
                        </ul>
                        <p className="text-gray-600">
                            En caso de baja, los fondos pendientes de liquidar serán procesados según los plazos
                            habituales, una vez resueltas las disputas o reclamos vigentes.
                        </p>
                    </section>

                    {/* 9. Modificaciones */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">9. Modificaciones a los Términos</h2>
                        <p className="text-gray-600">
                            MOOVY se reserva el derecho de modificar estos Términos en cualquier momento.
                            Las modificaciones serán notificadas al Comercio con al menos 15 días de anticipación
                            a través de la plataforma o por correo electrónico. El uso continuado de la plataforma
                            después de la fecha de vigencia de las modificaciones constituye la aceptación de los
                            nuevos términos.
                        </p>
                    </section>

                    {/* 10. Ley Aplicable */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">10. Ley Aplicable y Jurisdicción</h2>
                        <p className="text-gray-600">
                            Estos Términos se rigen por las leyes de la República Argentina.
                            Cualquier controversia será sometida a los tribunales ordinarios de la ciudad de Ushuaia,
                            Provincia de Tierra del Fuego, Antártida e Islas del Atlántico Sur,
                            renunciando expresamente a cualquier otro fuero que pudiera corresponder.
                        </p>
                    </section>

                    {/* 11. Contacto */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">11. Contacto</h2>
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
