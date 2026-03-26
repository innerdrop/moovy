import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";
import {
  MoovyIconStore,
  MoovyIconCart,
  MoovyIconDelivery,
  MoovyIconPercentage,
  MoovyIconInstantPay,
  MoovyIconShield,
  MoovyIconClock,
  MoovyIconFairFees,
  MoovyIconHumanSupport,
  MoovyIconLocal,
  MoovyIconGrowth,
} from "@/components/ui/MoovyIcons";

export const metadata: Metadata = {
  title: "Tarifas y Comisiones | MOOVY",
  description: "Conocé nuestras tarifas transparentes. Comisiones bajas, sin letra chica. Pago instantáneo a comercios. Mejor que PedidosYa y Rappi.",
  keywords: "tarifas, comisiones, precios, MOOVY, delivery, marketplace",
  openGraph: {
    title: "Tarifas y Comisiones Transparentes | MOOVY",
    description: "Comisiones bajas sin retención de dinero. El 80% para repartidores. $0 cargo al comprador.",
    type: "website",
  },
};

// Pricing Cards Data
const pricingCards = [
  {
    role: "Comercios",
    icon: <MoovyIconStore className="w-8 h-8" />,
    mainPrice: "8%",
    description: "Comisión por venta",
    details: [
      "Pago instantáneo al instante",
      "Sin retención de dinero",
      "Tarifa Fundador 5% (primeros 10)",
      "Sin cargo de configuración",
      "Dashboard de ventas en tiempo real",
      "Soporte por WhatsApp",
    ],
    accentColor: "bg-red-50 border-red-200",
    buttonColor: "btn-primary",
    cta: "Registrate como Comercio",
    ctaHref: "/comercios/registro",
    isHighlight: true,
  },
  {
    role: "Vendedores Marketplace",
    icon: <MoovyIconCart className="w-8 h-8" />,
    mainPrice: "0%",
    description: "Comisión de lanzamiento",
    details: [
      "Comisión 0% en el lanzamiento",
      "Escala gradual después (12% máx)",
      "Alcance a 80.000 personas en Ushuaia",
      "Pago automático a tu MP",
      "Herramientas de análisis",
      "Soporte 24/7",
    ],
    accentColor: "bg-violet-50 border-violet-200",
    buttonColor: "btn-secondary",
    cta: "Sumate como Vendedor",
    ctaHref: "/vendedor/registro",
    isHighlight: false,
  },
  {
    role: "Compradores",
    icon: <MoovyIconCart className="w-8 h-5" />,
    mainPrice: "$0",
    description: "Cargo de servicio",
    details: [
      "Sin cargo por usar la app",
      "Delivery desde $50 (según zona)",
      "Puntos MOOVER en cada compra",
      "$0.01 por punto (máx 50% desc)",
      "Compra en múltiples comercios",
      "Tracking en tiempo real",
    ],
    accentColor: "bg-blue-50 border-blue-200",
    buttonColor: "btn-primary",
    cta: "Descargá la App",
    ctaHref: "/",
    isHighlight: false,
  },
  {
    role: "Repartidores",
    icon: <MoovyIconDelivery className="w-8 h-8" />,
    mainPrice: "80%",
    description: "Del fee de delivery",
    details: [
      "80% del fee de delivery",
      "Bonos por productividad",
      "Aseguranza incluida",
      "Soporte ante accidentes",
      "App con GPS y navegación",
      "Cobro semanal",
    ],
    accentColor: "bg-green-50 border-green-200",
    buttonColor: "btn-primary",
    cta: "Trabajá con nosotros",
    ctaHref: "/repartidor/registro",
    isHighlight: false,
  },
];

// Comparison Data
const comparisonData = [
  {
    metric: "Comisión Comercio",
    moovy: "8%",
    pedidosya: "25-30%",
    rappi: "25-30%",
    winner: "moovy",
  },
  {
    metric: "Tarifa Fundador",
    moovy: "5% (10 primeros)",
    pedidosya: "–",
    rappi: "–",
    winner: "moovy",
  },
  {
    metric: "Pago a Comercios",
    moovy: "Instantáneo",
    pedidosya: "7-15 días",
    rappi: "7-15 días",
    winner: "moovy",
  },
  {
    metric: "Retención de Dinero",
    moovy: "0%",
    pedidosya: "Sí (7-15 días)",
    rappi: "Sí (7-15 días)",
    winner: "moovy",
  },
  {
    metric: "Cargo al Comprador",
    moovy: "$0",
    pedidosya: "$50-100",
    rappi: "$50-100",
    winner: "moovy",
  },
  {
    metric: "% Repartidor",
    moovy: "80%",
    pedidosya: "60-70%",
    rappi: "60-70%",
    winner: "moovy",
  },
  {
    metric: "Soporte Humano",
    moovy: "WhatsApp",
    pedidosya: "Chat bot",
    rappi: "Chat bot",
    winner: "moovy",
  },
  {
    metric: "Respuesta Soporte",
    moovy: "< 30 min",
    pedidosya: "Horas/días",
    rappi: "Horas/días",
    winner: "moovy",
  },
];

// FAQ Data
const faqSections = [
  {
    title: "Comercios",
    items: [
      {
        q: "¿Cuándo recibo el pago de mis ventas?",
        a: "En MOOVY, los pagos son instantáneos. Apenas un cliente paga en nuestra plataforma, el dinero llega a tu cuenta en tiempo real. No hay retenciones ni plazos de espera como en otras plataformas.",
      },
      {
        q: "¿Qué incluye la comisión del 8%?",
        a: "La comisión del 8% cubre: plataforma tecnológica, procesamiento de pagos, servicio de delivery, soporte 24/7 y herramientas de marketing. Es todo incluido.",
      },
      {
        q: "¿Cuál es la Tarifa Fundador?",
        a: "Los primeros 10 comercios en cada categoría pagan solo 5% de comisión durante el primer año. Después se ajusta al 8%. Queremos recompensar a los pioneros que confían en MOOVY.",
      },
      {
        q: "¿Hay costo de configuración o mensualidad?",
        a: "No. En MOOVY pagas solo cuando vendes. Cero costo fijo, cero comisión por inactividad. Nada más que comisión sobre tus ventas.",
      },
      {
        q: "¿Cómo se calcula el delivery?",
        a: "El fee de delivery es dinámico según la zona y distancia. Base + $X por km. El comercio configura su radio de cobertura. El comprador ve el costo antes de confirmar.",
      },
    ],
  },
  {
    title: "Vendedores Marketplace",
    items: [
      {
        q: "¿Por qué 0% de comisión al principio?",
        a: "Queremos que los vendedores crezcan con MOOVY. Comisión 0% en el lanzamiento te permite generar historial y reputación sin fricción. La comisión se introduce gradualmente después.",
      },
      {
        q: "¿Cuándo aumenta la comisión a 12%?",
        a: "Después del período de lanzamiento (a determinar), escala gradualmente. Te avisamos con 30 días de anticipación.",
      },
      {
        q: "¿Cómo recibo mis ganancias?",
        a: "Transferencia automática a tu cuenta de MercadoPago. Pagos semanales. Podés ver el detalle en tu dashboard.",
      },
      {
        q: "¿Quién controla el precio de mis productos?",
        a: "Vos. Fijás el precio que querés. MOOVY no interviene. Solo te pedimos que respetes los términos de servicio.",
      },
    ],
  },
  {
    title: "Compradores",
    items: [
      {
        q: "¿Tengo que pagar por registrarme?",
        a: "No. Registrarse es gratis. Pagás solo lo que compres + el delivery (si elegís esa opción).",
      },
      {
        q: "¿Cuánto cuesta el delivery?",
        a: "Depende del comercio y la zona. Base desde $50 en zona céntrica. Se calcula por distancia. Lo ves antes de confirmar.",
      },
      {
        q: "¿Cómo funcionan los puntos MOOVER?",
        a: "Ganás 1 punto por cada $1 gastado. Cada punto = $0.01 de descuento. Máximo 50% del valor del pedido como descuento con puntos. Nunca expiran.",
      },
      {
        q: "¿Hay bonificación por referidos?",
        a: "Sí. Invitá amigos, ellos usan tu código, ambos reciben 200 puntos ($2 de crédito).",
      },
    ],
  },
  {
    title: "Repartidores",
    items: [
      {
        q: "¿Cuánto ganan los repartidores?",
        a: "80% del fee de delivery + bonos por productividad. Ejemplo: fee $100, ganás $80. Sin retenciones.",
      },
      {
        q: "¿Hay comisión de plataforma?",
        a: "No. El 80% es lo que depositamos directo a tu billetera. Nada más.",
      },
      {
        q: "¿Cómo se paga?",
        a: "Semanalmente a tu billetera virtual o banco. Transferencia automática cada lunes.",
      },
      {
        q: "¿Qué pasa si hay un accidente?",
        a: "Los repartidores tienen cobertura de seguro incluida. Ante cualquier incidente reportado, activa el protocolo de aseguranza.",
      },
    ],
  },
];

export default function ComisionesPage() {
  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">Tarifas</h1>
      </header>

      <div className="pb-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-red-50 to-white px-4 py-12 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                Tarifas Transparentes
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Sin letra chica. Sin sorpresas. Sin retención de dinero.
              </p>
              <div className="flex items-center justify-center gap-2 text-red-600 font-semibold text-lg">
                <MoovyIconInstantPay className="w-5 h-5" />
                <span>Las comisiones más bajas de Ushuaia</span>
              </div>
            </div>

            {/* Hero Highlight */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-12 border-2 border-red-600">
              <div className="grid md:grid-cols-4 gap-4 md:gap-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-medium mb-1">Comercios</p>
                  <p className="text-3xl font-bold text-red-600">8%</p>
                  <p className="text-xs text-gray-500">vs 25-30% competencia</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-medium mb-1">Pago</p>
                  <p className="text-3xl font-bold text-green-600">Al Instante</p>
                  <p className="text-xs text-gray-500">0% retención</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-medium mb-1">Compradores</p>
                  <p className="text-3xl font-bold text-blue-600">$0</p>
                  <p className="text-xs text-gray-500">cargo de servicio</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-medium mb-1">Repartidores</p>
                  <p className="text-3xl font-bold text-emerald-600">80%</p>
                  <p className="text-xs text-gray-500">del fee delivery</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="px-4 py-12 max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Tarifas por Rol
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingCards.map((card, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border-2 p-6 flex flex-col h-full transition-transform hover:scale-105 ${
                  card.accentColor
                } ${card.isHighlight ? "ring-2 ring-red-500 ring-offset-2" : ""}`}
              >
                {card.isHighlight && (
                  <div className="mb-3 inline-flex bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full w-fit">
                    ⭐ RECOMENDADO
                  </div>
                )}
                <div className="text-red-600 mb-3">{card.icon}</div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">{card.role}</h4>
                <p className="text-4xl font-bold text-gray-900 mb-1">{card.mainPrice}</p>
                <p className="text-sm text-gray-600 mb-4">{card.description}</p>

                <ul className="space-y-2 mb-6 flex-1">
                  {card.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={card.ctaHref}
                  className={`${card.buttonColor} text-center block w-full`}
                >
                  {card.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="px-4 py-12 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              MOOVY vs Competencia
            </h3>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-6 py-4 text-left font-bold text-gray-900 text-sm">
                        Métrica
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-red-600 text-sm bg-red-50">
                        MOOVY
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-gray-600 text-sm">
                        PedidosYa
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-gray-600 text-sm">
                        Rappi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`border-b ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900 text-sm">
                          {row.metric}
                        </td>
                        <td className="px-6 py-4 text-center text-green-600 font-bold text-sm bg-green-50">
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {row.moovy}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600 text-sm">
                          {row.pedidosya === "–" ? (
                            <span className="text-gray-400">–</span>
                          ) : (
                            row.pedidosya
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600 text-sm">
                          {row.rappi === "–" ? (
                            <span className="text-gray-400">–</span>
                          ) : (
                            row.rappi
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {comparisonData.map((row, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3">{row.metric}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">MOOVY</span>
                      <div className="flex items-center gap-1 text-green-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        {row.moovy}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">PedidosYa</span>
                      <span className="text-gray-600 text-sm">
                        {row.pedidosya === "–" ? "–" : row.pedidosya}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Rappi</span>
                      <span className="text-gray-600 text-sm">
                        {row.rappi === "–" ? "–" : row.rappi}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tarifa Fundador Section */}
        <section className="px-4 py-12 max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 md:p-12 text-white">
            <div className="flex items-start gap-4 mb-6">
              <MoovyIconInstantPay className="w-8 h-8 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-3xl font-bold mb-2">Tarifa Fundador 🚀</h3>
                <p className="text-red-100">
                  Pagas solo 5% de comisión durante el primer año
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
              <ul className="space-y-3 text-red-50">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>Solo para los 10 primeros comercios en cada categoría</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>5% de comisión en lugar de 8% durante 12 meses</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>Pago instantáneo garantizado (como siempre)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>Prioritario en búsquedas durante el primer mes</span>
                </li>
              </ul>
            </div>

            <div className="mb-6 p-4 bg-white/15 rounded-lg border border-white/20">
              <p className="text-sm text-red-50 mb-2 font-semibold">⏱️ URGENCIA:</p>
              <p className="text-red-100">
                Solo quedan 3 lugares disponibles para Almacenes. Registrate ahora para asegurar tu
                Tarifa Fundador.
              </p>
            </div>

            <Link
              href="/comercios/registro"
              className="bg-white text-red-600 font-bold py-3 px-6 rounded-lg hover:bg-red-50 transition inline-flex items-center gap-2"
            >
              Registrate Ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Preguntas Frecuentes
            </h3>

            <div className="space-y-8">
              {faqSections.map((section, sIdx) => (
                <div key={sIdx}>
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MoovyIconShield className="w-5 h-5 text-red-600" />
                    {section.title}
                  </h4>

                  <div className="space-y-4">
                    {section.items.map((item, iIdx) => (
                      <details
                        key={iIdx}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden group"
                      >
                        <summary className="px-6 py-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                          <span>{item.q}</span>
                          <div className="transform group-open:rotate-180 transition text-gray-600">
                            ▼
                          </div>
                        </summary>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-gray-700 text-sm leading-relaxed">
                          {item.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose MOOVY Section */}
        <section className="px-4 py-12 max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Por qué elegir MOOVY
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <MoovyIconInstantPay className="w-8 h-8" />,
                title: "Pago Instantáneo",
                desc: "Comercios reciben al instante. 0% retención. Dinero en tu cuenta cuando se paga.",
              },
              {
                icon: <MoovyIconFairFees className="w-8 h-8" />,
                title: "Comisiones Bajas",
                desc: "8% en lugar de 25-30%. La diferencia se nota en tu flujo de caja.",
              },
              {
                icon: <MoovyIconHumanSupport className="w-8 h-8" />,
                title: "Soporte Humano",
                desc: "Atendemos por WhatsApp. Respuesta < 30 min. No es un chatbot.",
              },
              {
                icon: <MoovyIconDelivery className="w-8 h-8" />,
                title: "Delivery Confiable",
                desc: "Red de repartidores capacitados. GPS en tiempo real. Aseguranza incluida.",
              },
              {
                icon: <MoovyIconLocal className="w-8 h-8" />,
                title: "Para Ushuaia",
                desc: "Plataforma pensada por y para Ushuaia. Conocemos el mercado local.",
              },
              {
                icon: <MoovyIconShield className="w-8 h-8" />,
                title: "Transparencia Total",
                desc: "Qué pagás y por qué. Sin sorpresas. Sin letra chica en ningún lado.",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-red-200 transition">
                <div className="text-red-600 mb-4">{item.icon}</div>
                <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-12 bg-gradient-to-r from-red-600 to-red-700">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h3 className="text-3xl font-bold mb-4">
              Listo para empezar con tarifas justas?
            </h3>
            <p className="text-lg text-red-100 mb-8">
              Sos comercio, vendedor marketplace, repartidor o comprador. En MOOVY todos ganan más.
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link
                href="/comercios/registro"
                className="bg-white text-red-600 font-bold py-3 px-8 rounded-lg hover:bg-red-50 transition inline-flex items-center justify-center gap-2"
              >
                Registrate como Comercio
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/vendedor/registro"
                className="bg-red-700 text-white font-bold py-3 px-8 rounded-lg border-2 border-white hover:bg-red-800 transition inline-flex items-center justify-center gap-2"
              >
                Sumate como Vendedor
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/repartidor/registro"
                className="bg-red-700 text-white font-bold py-3 px-8 rounded-lg border-2 border-white hover:bg-red-800 transition inline-flex items-center justify-center gap-2"
              >
                Trabaja con Nosotros
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="px-4 py-12 max-w-4xl mx-auto text-center">
          <h4 className="font-bold text-gray-900 mb-4">Dudas sobre tarifas?</h4>
          <p className="text-gray-600 mb-6">
            Escribinos por WhatsApp. Respondemos en menos de 30 minutos.
          </p>
          <a
            href="https://wa.me/5492901553173"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            Contacta por WhatsApp
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>
      </div>
    </>
  );
}
