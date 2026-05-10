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
                <p className="text-gray-500 mb-8">Última actualización: 8 de mayo de 2026</p>

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
                            <li>Vehículo en condiciones mecánicas y de seguridad adecuadas</li>
                            <li>Documentación del vehículo al día (título, patente, cédula verde)</li>
                            <li>Cumplimiento de las obligaciones provinciales aplicables (incluida la Revisión Técnica Obligatoria — RTO — en jurisdicciones que la exijan). Ver Sección 4 (Declaraciones del Repartidor).</li>
                        </ul>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.3 Requisitos para Bicicletas</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Bicicleta en buen estado mecánico</li>
                            <li>Elementos de seguridad (casco, luces, reflectantes) recomendados</li>
                            <li>No se requiere licencia de conducir ni seguro vehicular</li>
                        </ul>
                    </section>

                    {/* 4. Declaraciones y Compromisos del Repartidor (rama feat/rto-no-obligatorio-driver) */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. Declaraciones y Compromisos del Repartidor</h2>
                        <p className="text-gray-600 mb-4">
                            Al aceptar estos Términos y al operar en la plataforma, el Repartidor declara bajo
                            juramento y se compromete a lo siguiente:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Que toda la información y documentación que proporcione es veraz, completa y vigente.</li>
                            <li>Que cuenta con la capacidad legal y física para prestar el servicio de entrega.</li>
                            <li>Que su vehículo (cuando corresponda) se encuentra en condiciones mecánicas y de seguridad adecuadas para circular.</li>
                            <li>
                                Que su vehículo cumple con todas las obligaciones provinciales aplicables,
                                incluida la Revisión Técnica Obligatoria (RTO) en jurisdicciones que la
                                exijan. <strong>MOOVY no es responsable de verificar ni mantener vigente
                                esta documentación; es responsabilidad exclusiva del Repartidor.</strong>
                                El Repartidor mantendrá indemne a MOOVY frente a cualquier multa, sanción
                                o reclamo derivado del incumplimiento de obligaciones que recaen sobre
                                su persona o su vehículo.
                            </li>
                            <li>Que cuenta con las pólizas de seguro vigentes que correspondan a su actividad y categoría de vehículo.</li>
                            <li>Que cumplirá con las normas de tránsito vigentes (Ley Nacional de Tránsito 24.449 y normativa provincial complementaria) durante toda la prestación del servicio.</li>
                            <li>Que comunicará a MOOVY, sin demora, cualquier cambio relevante en su situación documental, fiscal o vehicular.</li>
                        </ul>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-gray-700 text-sm">
                                <strong>Importante:</strong> Estas declaraciones tienen carácter de declaración
                                jurada. La falsedad u omisión en las mismas faculta a MOOVY a suspender o dar
                                de baja la cuenta sin previo aviso, sin perjuicio de las acciones legales que
                                pudieran corresponder.
                            </p>
                        </div>
                    </section>

                    {/* 5. Documentación (era 4 antes de feat/rto-no-obligatorio-driver) */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. Documentación Requerida</h2>
                        <p className="text-gray-600 mb-4">
                            El Repartidor deberá proporcionar y mantener actualizada la siguiente documentación
                            obligatoria. La documentación incompleta o vencida puede impedir la activación de
                            la cuenta o suspender el servicio:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Foto de DNI (frente y dorso)</li>
                            <li>Licencia de conducir vigente (vehículos motorizados)</li>
                            <li>Comprobante de seguro vehicular vigente (vehículos motorizados)</li>
                            <li>Cédula verde / título del vehículo (vehículos motorizados)</li>
                            <li>Constancia de CUIT/CUIL e inscripción AFIP / Monotributo</li>
                        </ul>
                        <p className="text-gray-600 mb-4">
                            <strong>Documentación opcional:</strong> el Repartidor puede cargar voluntariamente
                            su Revisión Técnica Obligatoria (RTO) y otros comprobantes adicionales desde su
                            panel. La carga de documentación opcional no condiciona la activación, pero MOOVY
                            puede exhibirla a clientes o partners como señal de confianza.
                        </p>
                        <p className="text-gray-600">
                            MOOVY se reserva el derecho de verificar la autenticidad de la documentación
                            presentada y de solicitar documentación adicional cuando lo considere necesario.
                        </p>
                    </section>

                    {/* 6. Comisiones (era 5 antes de feat/rto-no-obligatorio-driver) */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">6. Comisiones y Pagos</h2>
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

                    {/* 7. Responsabilidad (era 6 antes de feat/rto-no-obligatorio-driver) */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">7. Responsabilidad del Repartidor</h2>
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

                    {/* 8. Seguro (era 7 antes de feat/rto-no-obligatorio-driver) */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">8. Seguro</h2>
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

                    {/* 9. Código de Conducta (era 8 antes de feat/rto-no-obligatorio-driver) */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">9. Código de Conducta</h2>
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

                    {/* 10. Sistema operativo (era 9 antes de feat/rto-no-obligatorio-driver) */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">10. Sistema Operativo de Seguridad</h2>
                        <p className="text-gray-600 mb-4">
                            La plataforma cuenta con un sistema de validación operativa para proteger
                            tanto al Repartidor como a los compradores y comercios. Al aceptar estos
                            términos, el Repartidor acepta operar bajo este sistema.
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">10.1 PIN doble (4 dígitos)</h3>
                        <p className="text-gray-600 mb-3">
                            Cada pedido tiene dos PINs de 4 dígitos: uno para el retiro (que el
                            Comercio le dicta al Repartidor para validar el pickup) y otro para
                            la entrega (que el Comprador le dicta al Repartidor para confirmar
                            la entrega). Sin estos PINs el pedido NO puede cerrarse, garantizando
                            que solo el destinatario legítimo recibe el pedido. El Repartidor no
                            tiene acceso al PIN del Comprador hasta que este se lo dicte; este es
                            un mecanismo crítico anti-fraude. Cinco intentos fallidos consecutivos
                            de PIN bloquean el pedido y disparan investigación.
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">10.2 Geofence y validación de ubicación</h3>
                        <p className="text-gray-600 mb-3">
                            La validación de PIN solo es aceptada cuando el Repartidor está dentro
                            de un radio de <strong>100 metros</strong> del comercio (para pickup) o del
                            domicilio del cliente (para delivery), con 50 metros adicionales de gracia
                            para casos de GPS impreciso. Si el Repartidor está fuera del geofence,
                            la app le pide acercarse antes de permitir el ingreso del PIN. Esto previene
                            el fraude tipo &quot;ingresar PIN desde casa sin haber entregado&quot;.
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">10.3 GPS continuo durante el delivery</h3>
                        <p className="text-gray-600 mb-3">
                            Mientras el Repartidor tiene un pedido activo, su ubicación GPS se reporta
                            cada 30 segundos a la plataforma. Esto sirve para: (a) tracking en vivo
                            del Comprador, (b) evidencia anti-fraude en disputas, (c) cálculo
                            de pagos y bonus por zona. La información se almacena en logs operativos
                            que se purgan a los 30 días.
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">10.4 Política de no-show y bonus compensatorio</h3>
                        <p className="text-gray-600 mb-3">
                            Si el Repartidor llega al domicilio del cliente y este no responde, debe
                            tocar el botón &quot;Llegué al cliente&quot; en la app, lo cual inicia un
                            timer obligatorio de <strong>10 minutos reales</strong>. Solo cuando el timer
                            llega a 0, el Repartidor puede marcar &quot;Cliente no responde&quot; y
                            volver al comercio para devolver el pedido. La plataforma valida en el
                            backend que pasaron los 10 minutos completos — no es posible saltarse el tiempo.
                        </p>
                        <p className="text-gray-600 mb-3">
                            Cuando el Repartidor completa una devolución por no-show válida, recibe
                            su payout completo del viaje <strong>+ un bonus compensatorio de $300</strong>
                            {" "}por el viaje fallido. Sin embargo, el payout queda en{" "}
                            <strong>hold por 24 horas</strong> para permitir al cliente impugnar el caso
                            si tiene evidencia de que estaba disponible. Si el cliente no impugna en 24h,
                            el payout se libera automáticamente. Si impugna y se determina que el
                            Repartidor reportó no-show de mala fe, el payout se cancela y el caso queda
                            registrado en el fraudScore.
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-4 mb-2">10.5 fraudScore y suspensión automática</h3>
                        <p className="text-gray-600 mb-3">
                            La plataforma asigna un <strong>fraudScore</strong> al Repartidor que se
                            incrementa por cada incidente sospechoso: 5 intentos fallidos consecutivos
                            de PIN, no-show impugnado por el cliente con evidencia, salir del geofence
                            durante el período de espera, etc.
                        </p>
                        <p className="text-gray-600">
                            Al alcanzar <strong>3 incidentes registrados</strong>, la cuenta del
                            Repartidor se suspende automáticamente de manera preventiva. La sesión se
                            invalida y el Repartidor no puede tomar pedidos hasta que el equipo de
                            MOOVY revise manualmente el caso desde el panel administrativo. La
                            decisión final (reactivar la cuenta o mantenerla suspendida) la toma el
                            equipo en función del contexto de cada incidente. Esta política protege
                            a los Compradores y al ecosistema MOOVY de comportamientos sistemáticos
                            de fraude.
                        </p>
                    </section>

                    {/* 11. Suspensión (era 10 antes de feat/rto-no-obligatorio-driver) */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">11. Suspensión y Baja de Cuenta</h2>
                        <p className="text-gray-600 mb-4">
                            MOOVY podrá suspender temporal o permanentemente la cuenta de un Repartidor en los siguientes casos:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                            <li>Incumplimiento de estos Términos o del Código de Conducta</li>
                            <li>Documentación obligatoria vencida o no válida (licencia, seguro, cédula verde)</li>
                            <li>Falsedad u omisión en las declaraciones del Repartidor (Sección 4)</li>
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

                    {/* 12. Ley Aplicable (era 11 antes de feat/rto-no-obligatorio-driver) */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">12. Ley Aplicable y Jurisdicción</h2>
                        <p className="text-gray-600">
                            Estos Términos se rigen por las leyes de la República Argentina.
                            Cualquier controversia será sometida a los tribunales ordinarios de la ciudad de Ushuaia,
                            Provincia de Tierra del Fuego, Antártida e Islas del Atlántico Sur,
                            renunciando expresamente a cualquier otro fuero que pudiera corresponder.
                        </p>
                    </section>

                    {/* 13. Contacto (era 12 antes de feat/rto-no-obligatorio-driver) */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">13. Contacto</h2>
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
