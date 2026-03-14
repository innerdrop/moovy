import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Términos para Repartidores | Moovy',
    description: 'Términos y condiciones específicos para repartidores de la plataforma MOOVY.',
};

export default function TerminosRepartidorPage() {
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

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y Condiciones para Repartidores</h1>
                <p className="text-gray-500 mb-8">Última actualización: Marzo 2026</p>

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-8">
                    {/* 1. Introducción */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introducción y Aceptación</h2>
                        <p className="text-gray-600 mb-4">
                            Los presentes Términos y Condiciones (&quot;Términos&quot;) regulan la relación entre
                            <strong className="text-[#e60012]"> MOOVY</strong> y las personas que realizan servicios de
                            entrega a través de la plataforma (&quot;Repartidores&quot; o &quot;Drivers&quot;).
                        </p>
                        <p className="text-gray-600">
                            Al registrarse como Repartidor en MOOVY, usted declara haber leído, comprendido y aceptado
                            íntegramente estos Términos. Estos Términos complementan los Términos y Condiciones generales
                            de la plataforma.
                        </p>
                    </section>

                    {/* 2. Relación Contractual */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">2. Naturaleza de la Relación - IMPORTANTE</h2>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-700 font-medium">
                                ⚠️ <strong>El Repartidor es un trabajador independiente, NO un empleado de MOOVY.</strong>
                            </p>
                        </div>
                        <p className="text-gray-600 mb-4">
                            La relación entre MOOVY y el Repartidor es de naturaleza comercial e independiente.
                            No existe entre las partes relación laboral, de dependencia, sociedad, franquicia ni
                            mandato de ninguna especie. El Repartidor:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>Determina libremente sus horarios y disponibilidad</li>
                            <li>Puede aceptar o rechazar las ofertas de entrega sin penalización</li>
                            <li>Utiliza su propio vehículo y herramientas de trabajo</li>
                            <li>Asume los costos operativos de su actividad (combustible, mantenimiento, etc.)</li>
                            <li>Es responsable de su propia inscripción fiscal y tributaria</li>
                        </ul>
                    </section>

                    {/* 3. Requisitos */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. Requisitos para Ser Repartidor</h2>
                        <p className="text-gray-600 mb-4">
                            Para registrarse y operar como Repartidor en MOOVY, usted debe cumplir con:
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.1 Requisitos Generales</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                            <li>Ser mayor de 18 años</li>
                            <li>Poseer DNI argentino vigente</li>
                            <li>Contar con CUIT o CUIL vigente</li>
                            <li>Estar inscripto en AFIP como Monotributista o Responsable Inscripto</li>
                            <li>Proporcionar información veraz y completa en el proceso de registro</li>
                        </ul>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.2 Requisitos para Vehículos Motorizados</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                            <li>Licencia de conducir vigente correspondiente a la categoría del vehículo</li>
                            <li>Seguro automotor vigente con cobertura de responsabilidad civil hacia terceros (obligatorio según Ley 24.449)</li>
                            <li>Verificación Técnica Vehicular (VTV) vigente</li>
                            <li>Vehículo en condiciones mecánicas y de seguridad adecuadas</li>
                            <li>Documentación del vehículo al día (título, patente)</li>
                        </ul>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.3 Requisitos para Bicicletas</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Bicicleta en buen estado mecánico</li>
                            <li>Elementos de seguridad (casco, luces, reflectantes) recomendados</li>
                            <li>No se requiere licencia de conducir ni seguro vehicular</li>
                        </ul>
                    </section>

                    {/* 4. Documentación */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. Documentación Requerida</h2>
                        <p className="text-gray-600 mb-4">
                            El Repartidor deberá proporcionar y mantener actualizada la siguiente documentación:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>Foto de DNI (frente y dorso)</li>
                            <li>Licencia de conducir vigente (vehículos motorizados)</li>
                            <li>Comprobante de seguro vehicular vigente (vehículos motorizados)</li>
                            <li>VTV vigente (vehículos motorizados)</li>
                            <li>Constancia de CUIT/CUIL</li>
                        </ul>
                        <p className="text-gray-600 mt-4">
                            MOOVY se reserva el derecho de verificar la autenticidad de la documentación presentada
                            y de solicitar documentación adicional cuando lo considere necesario.
                        </p>
                    </section>

                    {/* 5. Comisiones */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. Comisiones y Pagos</h2>
                        <p className="text-gray-600 mb-4">
                            MOOVY retiene un porcentaje de cada entrega realizada en concepto de gestión de la plataforma.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>La tarifa de entrega se compone de una tarifa base más un monto por kilómetro recorrido</li>
                            <li>MOOVY retiene un porcentaje configurable sobre cada tarifa de entrega</li>
                            <li>El Repartidor recibe el monto neto después de la retención de MOOVY</li>
                            <li>Los pagos se procesan a través de los medios habilitados por la plataforma</li>
                            <li>El Repartidor puede consultar el desglose de sus ganancias en el panel de la app</li>
                        </ul>
                        <p className="text-gray-600">
                            El Repartidor es el único responsable de cumplir con sus obligaciones tributarias y
                            previsionales derivadas de los ingresos percibidos a través de MOOVY.
                        </p>
                    </section>

                    {/* 6. Responsabilidad */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">6. Responsabilidad del Repartidor</h2>
                        <p className="text-gray-600 mb-4">
                            Durante la ejecución de cada entrega, el Repartidor es responsable de:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Retirar el pedido del comercio o vendedor en tiempo y forma</li>
                            <li>Transportar los productos con el debido cuidado, evitando daños, derrames o deterioro</li>
                            <li>Entregar el pedido en la dirección indicada y a la persona destinataria</li>
                            <li>Respetar las normas de tránsito vigentes (Ley Nacional de Tránsito 24.449 y normativa provincial)</li>
                            <li>Mantener las condiciones sanitarias apropiadas para el transporte de alimentos</li>
                            <li>Portar toda la documentación requerida durante la prestación del servicio</li>
                        </ul>
                        <p className="text-gray-600">
                            El Repartidor será responsable por cualquier daño, pérdida o deterioro de los productos
                            que ocurra durante el transporte por su negligencia o imprudencia.
                        </p>
                    </section>

                    {/* 7. Seguro */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">7. Seguro</h2>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-700">
                                ⚠️ <strong>El Repartidor con vehículo motorizado debe mantener vigente en todo momento
                                un seguro de responsabilidad civil hacia terceros, conforme lo exige la Ley 24.449.</strong>
                            </p>
                        </div>
                        <p className="text-gray-600">
                            MOOVY no provee seguro de ningún tipo al Repartidor. Es responsabilidad exclusiva del
                            Repartidor contar con las coberturas de seguro que considere apropiadas para su actividad,
                            incluyendo pero no limitado a: seguro de responsabilidad civil, seguro contra accidentes
                            personales y seguro del vehículo. La falta de seguro vigente podrá resultar en la suspensión
                            inmediata de la cuenta.
                        </p>
                    </section>

                    {/* 8. Código de Conducta */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">8. Código de Conducta</h2>
                        <p className="text-gray-600 mb-4">
                            El Repartidor se compromete a:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>Tratar con respeto y cordialidad a compradores, vendedores, comerciantes y personal de MOOVY</li>
                            <li>Mantener una presentación personal adecuada</li>
                            <li>No consumir alcohol ni sustancias psicoactivas durante la prestación del servicio</li>
                            <li>No manipular ni abrir los paquetes o productos que transporta</li>
                            <li>Respetar la privacidad de los datos personales de los compradores (dirección, teléfono, etc.)</li>
                            <li>No utilizar la información de contacto de los compradores para fines ajenos a la entrega</li>
                            <li>Reportar cualquier incidente o inconveniente durante la entrega a través de los canales de soporte</li>
                        </ul>
                    </section>

                    {/* 9. Suspensión */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">9. Suspensión y Baja de Cuenta</h2>
                        <p className="text-gray-600 mb-4">
                            MOOVY podrá suspender temporal o permanentemente la cuenta de un Repartidor en los siguientes casos:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Incumplimiento de estos Términos o del Código de Conducta</li>
                            <li>Documentación vencida o no válida (licencia, seguro, VTV)</li>
                            <li>Reiteradas calificaciones negativas de compradores o comercios</li>
                            <li>Sospecha de fraude, manipulación de pedidos o actividad ilícita</li>
                            <li>Conducción bajo efectos del alcohol o sustancias</li>
                            <li>Maltrato o falta de respeto hacia compradores, vendedores o comerciantes</li>
                            <li>No entregar pedidos aceptados sin causa justificada</li>
                        </ul>
                        <p className="text-gray-600">
                            En caso de baja, los fondos pendientes de liquidar serán procesados según los plazos
                            habituales, una vez resueltas las disputas o reclamos vigentes.
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
