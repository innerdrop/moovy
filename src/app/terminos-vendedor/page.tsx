import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Términos para Vendedores Marketplace | Moovy',
    description: 'Términos y condiciones específicos para vendedores del marketplace MOOVY.',
};

export default function TerminosVendedorPage() {
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

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y Condiciones para Vendedores Marketplace</h1>
                <p className="text-gray-500 mb-8">Última actualización: Marzo 2026</p>

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-8">
                    {/* 1. Introducción */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introducción y Aceptación</h2>
                        <p className="text-gray-600 mb-4">
                            Los presentes Términos y Condiciones (&quot;Términos&quot;) regulan la relación entre
                            <strong className="text-[#e60012]"> MOOVY</strong> y las personas que utilizan la plataforma
                            para vender productos o servicios a través del marketplace (&quot;Vendedores&quot;).
                        </p>
                        <p className="text-gray-600">
                            Al registrarse como Vendedor en MOOVY, usted declara haber leído, comprendido y aceptado
                            íntegramente estos Términos. Estos Términos complementan los Términos y Condiciones generales
                            de la plataforma.
                        </p>
                    </section>

                    {/* 2. Naturaleza de la Relación */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">2. Naturaleza de la Relación</h2>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-700 font-medium">
                                ⚠️ <strong>MOOVY actúa exclusivamente como intermediario tecnológico.</strong>
                            </p>
                        </div>
                        <p className="text-gray-600 mb-4">
                            MOOVY proporciona una plataforma digital que facilita la conexión entre Vendedores y
                            Compradores. La relación entre MOOVY y el Vendedor es de intermediación comercial, no existiendo
                            entre las partes relación laboral, societaria, de franquicia ni de mandato de ninguna naturaleza.
                        </p>
                        <p className="text-gray-600">
                            El Vendedor es el único responsable de los productos y servicios que ofrece a través de la
                            plataforma, incluyendo su calidad, veracidad de la descripción, precio, stock y cumplimiento
                            de todas las normativas aplicables.
                        </p>
                    </section>

                    {/* 3. Requisitos */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. Requisitos para Ser Vendedor</h2>
                        <p className="text-gray-600 mb-4">
                            Para operar como Vendedor en MOOVY, usted debe cumplir con los siguientes requisitos:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>Ser mayor de 18 años y tener capacidad legal para contratar</li>
                            <li>Contar con CUIT o CUIL vigente y estar inscripto ante AFIP en la categoría correspondiente
                                (Monotributo o Responsable Inscripto) si realiza ventas de manera habitual</li>
                            <li>Proporcionar información veraz, completa y actualizada en su perfil de vendedor</li>
                            <li>Aceptar la Política de Privacidad de MOOVY</li>
                            <li>Mantener actualizados sus datos fiscales y de contacto</li>
                        </ul>
                    </section>

                    {/* 4. Comisiones */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. Comisiones y Pagos</h2>
                        <p className="text-gray-600 mb-4">
                            MOOVY cobra una comisión porcentual sobre cada venta realizada a través de la plataforma.
                            El porcentaje de comisión es configurable y será informado al Vendedor antes de su aceptación.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>La comisión se descuenta automáticamente del monto de cada venta</li>
                            <li>El Vendedor recibirá el monto neto (precio de venta menos la comisión de MOOVY)</li>
                            <li>Los pagos se procesan a través de MercadoPago</li>
                            <li>MOOVY podrá modificar las comisiones con aviso previo de 30 días</li>
                            <li>El Vendedor puede consultar el desglose de comisiones en su panel de ganancias</li>
                        </ul>
                        <p className="text-gray-600">
                            El Vendedor es responsable de cumplir con sus obligaciones tributarias y fiscales derivadas
                            de las ventas realizadas a través de la plataforma.
                        </p>
                    </section>

                    {/* 5. Obligaciones del Vendedor */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. Obligaciones del Vendedor</h2>
                        <p className="text-gray-600 mb-4">El Vendedor se compromete a:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>Publicar descripciones veraces, completas y no engañosas de sus productos</li>
                            <li>Mantener actualizado el stock de los productos publicados</li>
                            <li>Preparar los pedidos en el tiempo de preparación declarado</li>
                            <li>Garantizar la calidad y seguridad de los productos ofrecidos</li>
                            <li>Responder a las consultas y reclamos de los compradores en tiempo razonable</li>
                            <li>Cumplir con la Ley 24.240 de Defensa del Consumidor y toda normativa aplicable</li>
                            <li>Emitir los comprobantes fiscales correspondientes cuando sea legalmente requerido</li>
                            <li>No ofrecer productos que infrinjan derechos de propiedad intelectual de terceros</li>
                        </ul>
                    </section>

                    {/* 6. Productos Prohibidos */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">6. Productos Prohibidos</h2>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-700 font-medium">
                                ⚠️ <strong>Queda estrictamente prohibido publicar en MOOVY:</strong>
                            </p>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>Productos falsificados, réplicas o que infrinjan marcas registradas</li>
                            <li>Armas de fuego, armas blancas, municiones o explosivos</li>
                            <li>Sustancias ilegales, estupefacientes o psicotrópicos</li>
                            <li>Medicamentos sin receta médica o no autorizados por ANMAT</li>
                            <li>Productos robados o de procedencia ilícita</li>
                            <li>Material pornográfico o de explotación</li>
                            <li>Productos que promuevan la discriminación u odio</li>
                            <li>Flora o fauna protegida, o productos derivados de especies en peligro</li>
                            <li>Cualquier producto cuya venta esté prohibida por la legislación argentina</li>
                        </ul>
                        <p className="text-gray-600 mt-4">
                            MOOVY se reserva el derecho de remover cualquier publicación que considere inapropiada
                            o que viole estos términos, sin previo aviso.
                        </p>
                    </section>

                    {/* 7. Responsabilidad */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">7. Responsabilidad del Vendedor</h2>
                        <p className="text-gray-600 mb-4">
                            El Vendedor es exclusiva e íntegramente responsable por:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>La calidad, seguridad, legalidad e idoneidad de los productos que vende</li>
                            <li>La veracidad y exactitud de las descripciones, fotos e información publicada</li>
                            <li>El cumplimiento de garantías legales conforme la Ley 24.240</li>
                            <li>Los daños que sus productos pudieran ocasionar a los compradores o terceros</li>
                            <li>El cumplimiento de normas sanitarias, bromatológicas y regulatorias aplicables</li>
                            <li>Sus obligaciones tributarias y fiscales</li>
                        </ul>
                        <p className="text-gray-600">
                            El Vendedor se obliga a mantener indemne a MOOVY frente a cualquier reclamo, demanda,
                            multa o sanción derivada de los productos que comercializa a través de la plataforma.
                        </p>
                    </section>

                    {/* 8. Cancelaciones y Devoluciones */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">8. Cancelaciones y Devoluciones</h2>
                        <p className="text-gray-600 mb-4">
                            El Vendedor acepta que:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>El comprador tiene derecho a cancelar un pedido antes de que sea confirmado por el Vendedor</li>
                            <li>Las devoluciones se rigen por la Política de Devoluciones de MOOVY y la Ley 24.240</li>
                            <li>En caso de cancelaciones o devoluciones imputables al Vendedor (producto defectuoso,
                                no coincide con la descripción, etc.), MOOVY podrá reembolsar al comprador y debitar
                                el monto correspondiente de los fondos del Vendedor</li>
                            <li>Las cancelaciones recurrentes por falta de stock pueden resultar en la suspensión de la cuenta</li>
                        </ul>
                    </section>

                    {/* 9. Suspensión y Baja */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">9. Suspensión y Baja de Cuenta</h2>
                        <p className="text-gray-600 mb-4">
                            MOOVY podrá suspender temporal o permanentemente la cuenta de un Vendedor en los siguientes casos:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Incumplimiento de estos Términos o de los Términos generales de MOOVY</li>
                            <li>Publicación de productos prohibidos</li>
                            <li>Reiteradas calificaciones negativas o reclamos de compradores</li>
                            <li>Sospecha de fraude o actividad ilícita</li>
                            <li>Falta de respuesta reiterada a pedidos confirmados</li>
                            <li>Incumplimiento de obligaciones fiscales que afecten a MOOVY</li>
                        </ul>
                        <p className="text-gray-600">
                            En caso de baja, los fondos pendientes de liquidar serán retenidos hasta resolver cualquier
                            disputa o reclamo vigente, y liberados una vez resueltos.
                        </p>
                    </section>

                    {/* 10. Propiedad Intelectual */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">10. Propiedad Intelectual</h2>
                        <p className="text-gray-600">
                            El Vendedor garantiza que las imágenes, descripciones y todo contenido que publique en la
                            plataforma son de su propiedad o cuenta con las licencias necesarias para su uso. El Vendedor
                            otorga a MOOVY una licencia no exclusiva, gratuita y revocable para utilizar dicho contenido
                            con fines de exhibición, promoción y operación de la plataforma.
                        </p>
                    </section>

                    {/* 11. Ley Aplicable */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">11. Ley Aplicable y Jurisdicción</h2>
                        <p className="text-gray-600">
                            Estos Términos se rigen por las leyes de la República Argentina.
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
