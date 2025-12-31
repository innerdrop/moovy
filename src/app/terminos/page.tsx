
import React from 'react';

export const metadata = {
    title: 'Términos y Condiciones | Polirrubro San Juan',
    description: 'Conoce los términos y condiciones de uso de Polirrubro San Juan.',
};

export default function TerminosPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold text-navy mb-8 text-center">Términos y Condiciones</h1>

            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 space-y-6 text-gray-700">
                <section>
                    <h2 className="text-xl font-bold text-turquoise-dark mb-3">1. Introducción</h2>
                    <p>
                        Bienvenido a Polirrubro San Juan. Al acceder y utilizar nuestro sitio web y servicios, aceptas cumplir con los siguientes términos y condiciones.
                        Si no estás de acuerdo con alguna parte de estos términos, te recomendamos no utilizar nuestros servicios.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-turquoise-dark mb-3">2. Uso del Servicio</h2>
                    <p>
                        Nuestro servicio de delivery y venta online está disponible exclusivamente para la ciudad de Ushuaia, Tierra del Fuego.
                        Nos reservamos el derecho de modificar o discontinuar el servicio (o cualquier parte del mismo) en cualquier momento sin previo aviso.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-turquoise-dark mb-3">3. Pedidos y Precios</h2>
                    <p>
                        Todos los pedidos están sujetos a disponibilidad de stock. Los precios de los productos están expresados en pesos argentinos e incluyen IVA.
                        Polirrubro San Juan se reserva el derecho de modificar los precios en cualquier momento. El costo del envío se calculará al momento de finalizar la compra.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-turquoise-dark mb-3">4. Envíos y Entregas</h2>
                    <p>
                        Realizamos entregas las 24 horas del día. Los tiempos de entrega son estimados y pueden variar debido a factores externos como el clima o el tráfico.
                        Es responsabilidad del usuario proporcionar una dirección de entrega correcta y completa.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-turquoise-dark mb-3">5. Política de Devoluciones</h2>
                    <p>
                        Si recibís un producto en mal estado o incorrecto, por favor contactanos inmediatamente a través de nuestro WhatsApp o formulario de contacto.
                        Evaluaremos el caso para proceder con el cambio o reintegro correspondiente.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-turquoise-dark mb-3">6. Propiedad Intelectual</h2>
                    <p>
                        Todo el contenido de este sitio, incluyendo logotipos, textos, imágenes y diseño, es propiedad de Polirrubro San Juan y está protegido por las leyes de propiedad intelectual vigentes.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-turquoise-dark mb-3">7. Contacto</h2>
                    <p>
                        Para cualquier duda o consulta relacionada con estos términos, podés contactarnos a través de nuestra sección de <a href="/contacto" className="text-turquoise font-semibold hover:underline">Contacto</a>.
                    </p>
                </section>

                <div className="pt-6 border-t border-gray-100 text-sm text-gray-500">
                    Última actualización: Enero 2026
                </div>
            </div>
        </div>
    );
}
