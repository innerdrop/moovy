import type { Metadata } from "next";
import Link from "next/link";
import {
  Zap,
  Smile,
  Users,
  MapPin,
  MessageCircle,
  ArrowRight,
  Check,
  HeartHandshake,
  Globe,
  Shield,
  Store,
} from "lucide-react";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Quiénes Somos — MOOVY",
  description:
    "MOOVY es una plataforma de delivery creada por y para Ushuaia. Pagos instantáneos, comisiones justas y soporte humano. Revolucionando el comercio local en el Fin del Mundo.",
  keywords: [
    "delivery ushuaia",
    "comercio local",
    "pago instantáneo",
    "plataforma de delivery",
  ],
  openGraph: {
    title: "Quiénes Somos — MOOVY",
    description:
      "MOOVY es una plataforma de delivery creada por y para Ushuaia. Pagos instantáneos y comisiones justas.",
    type: "website",
  },
};

export default function QuienesSomosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "MOOVY",
            description:
              "Plataforma de delivery con pagos instantáneos para comercios de Ushuaia",
            url: "https://somosmoovy.com",
            logo: "https://somosmoovy.com/logo-moovy.png",
            sameAs: [
              "https://instagram.com/somosmoovy",
              "https://wa.me/5492901531773",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+5492901531773",
              contactType: "customer service",
            },
            areaServed: {
              "@type": "City",
              name: "Ushuaia",
              areaServed: {
                "@type": "AdministrativeArea",
                name: "Tierra del Fuego",
                areaServed: {
                  "@type": "Country",
                  name: "Argentina",
                },
              },
            },
          }),
        }}
      />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#e60012] via-[#e60012] to-[#c40010] text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -ml-40 -mb-40" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-semibold">Somos de Ushuaia</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight">
            Revolucionando el Delivery en el Fin del Mundo
          </h1>

          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            MOOVY es una plataforma creada{" "}
            <span className="font-bold text-white">por y para Ushuaia</span>.
            Conectamos a los comercios locales con sus clientes con delivery
            rápido, pagos instantáneos y sin sorpresas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/comercio/registro"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#e60012] px-8 py-3 rounded-2xl font-bold hover:bg-gray-100 transition shadow-lg shadow-black/20"
            >
              Registra tu Comercio
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://wa.me/5492901531773?text=Hola%20MOOVY!%20Quiero%20saber%20más"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white/20 text-white px-8 py-3 rounded-2xl font-bold hover:bg-white/30 transition border border-white/40"
            >
              <MessageCircle className="w-5 h-5" />
              Contactanos por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ===== MISSION ===== */}
      <section className="py-16 lg:py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 lg:p-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6">
              Nuestra Misión
            </h2>
            <p className="text-lg lg:text-xl text-gray-700 leading-relaxed mb-8">
              Conectar a los comercios de Ushuaia con sus clientes a través de
              una plataforma que les permita crecer sin intermediarios que
              retengan su dinero.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 text-lg">
                  Para Compradores
                </h3>
                <p className="text-gray-600">
                  Una experiencia simple, rápida y segura. Acceso a todo lo que
                  ofrece Ushuaia en una sola app.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 text-lg">
                  Para Comercios
                </h3>
                <p className="text-gray-600">
                  Crecer sin temor a retenciones. El dinero que ganés es tuyo
                  desde el primer pedido.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 text-lg">
                  Para Repartidores
                </h3>
                <p className="text-gray-600">
                  Trabajar de forma flexible, ganando lo que mereces por cada
                  entrega que completás.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 text-lg">Para Vendedores</h3>
                <p className="text-gray-600">
                  Publicá lo que tengas para vender y conectá con toda la
                  comunidad de Ushuaia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== VALUES ===== */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Nuestros Valores
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              En Moovy nos guiamos por estos principios en cada decisión que
              tomamos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Value 1: Instant Payment */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-5">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Pago Instantáneo
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Los comercios cobran al instante. Sin retenciones, sin esperas,
                sin sorpresas. Diferente a PedidosYa que puede retener días.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Dinero disponible inmediatamente</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Historial claro de todas las transacciones</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Sin sorpresas en los cobros</span>
                </li>
              </ul>
            </div>

            {/* Value 2: Fair Commissions */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-5">
                <HeartHandshake className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Comisiones Justas
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Las comisiones más bajas del mercado. Creemos que los comercios
                son los protagonistas, no nosotros.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>8% de comisión para comercios</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>12% para vendedores marketplace</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>80% del delivery fee para repartidores</span>
                </li>
              </ul>
            </div>

            {/* Value 3: Human Support */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-5">
                <Smile className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Soporte Humano
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                No somos un chatbot. Cuando nos contactés, hablas con una
                persona real que quiere ayudarte.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>WhatsApp directo con el equipo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Respuestas rápidas y en español</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Presentes en la comunidad</span>
                </li>
              </ul>
            </div>

            {/* Value 4: 100% Ushuaiense */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-5">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                100% Ushuaiense
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Creado por y para la comunidad de Ushuaia. En una ciudad chica,
                la confianza lo es todo.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>Equipo local que conoce Ushuaia</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>Decisiones tomadas pensando en vos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>Transparencia radical</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 lg:py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              ¿Cómo Funciona MOOVY?
            </h2>
            <p className="text-lg text-gray-600">
              Tres pasos para una experiencia perfecta
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 text-center h-full border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-[#e60012] to-[#ff4d5e] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-2xl font-black text-white">1</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Elegí</h3>
                <p className="text-gray-600 leading-relaxed">
                  Buscá entre cientos de comercios y productos. Desde comida
                  hasta ropa, todo en una app.
                </p>
              </div>
              <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                <ArrowRight className="w-8 h-8 text-gray-300" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 text-center h-full border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-[#e60012] to-[#ff4d5e] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-2xl font-black text-white">2</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Pedí</h3>
                <p className="text-gray-600 leading-relaxed">
                  Agregá productos al carrito, pagá como prefieras (efectivo u
                  online) y ¡listo!
                </p>
              </div>
              <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                <ArrowRight className="w-8 h-8 text-gray-300" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 text-center h-full border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-[#e60012] to-[#ff4d5e] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-2xl font-black text-white">3</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Recibí
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Seguí tu pedido en tiempo real. Tu repartidor te avisará
                  cuando esté cerca.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOR MERCHANTS ===== */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-[#e60012]/5 to-[#e60012]/10 rounded-3xl border border-[#e60012]/20 p-10 lg:p-14">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
                  ¿Tenés un Comercio?
                </h2>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  MOOVY te ayuda a vender más, cobrar al instante y dejar de
                  perder dinero en comisiones injustas.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-[#e60012] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-gray-900">
                        Cobras al instante
                      </h4>
                      <p className="text-sm text-gray-600">
                        Cada venta es tuya desde que se confirma
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-6 h-6 text-[#e60012] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-gray-900">
                        Comisiones bajas
                      </h4>
                      <p className="text-sm text-gray-600">
                        8% por cada venta (menos que la competencia)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-6 h-6 text-[#e60012] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-gray-900">
                        Soporte dedicado
                      </h4>
                      <p className="text-sm text-gray-600">
                        Equipo disponible en WhatsApp para cualquier duda
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/comercio/registro"
                    className="inline-flex items-center justify-center gap-2 bg-[#e60012] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#c40010] transition"
                  >
                    Registra Tu Comercio
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="https://wa.me/5492901531773?text=Hola%20MOOVY!%20Tengo%20un%20comercio%20en%20Ushuaia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-900 px-8 py-3 rounded-2xl font-bold hover:bg-gray-200 transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Consultar
                  </a>
                </div>
              </div>

              <div className="flex-1 hidden md:flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#e60012] to-[#ff4d5e] rounded-3xl opacity-10 blur-2xl" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Store className="w-24 h-24 text-[#e60012] opacity-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="py-16 lg:py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Nos Encantaría Hablar Contigo
            </h2>
            <p className="text-lg text-gray-600">
              Tenemos preguntas, reclamos o simplemente querés charlar sobre
              MOOVY
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* WhatsApp */}
            <a
              href="https://wa.me/5492901531773?text=Hola%20MOOVY!%20Me%20gustaría%20saber%20más"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-gray-100 rounded-2xl p-8 text-center hover:shadow-lg transition group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">WhatsApp</h3>
              <p className="text-gray-600 mb-4">
                Respuestas rápidas de nuestro equipo
              </p>
              <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-sm">
                +54 9 290 1531773
                <ArrowRight className="w-4 h-4" />
              </span>
            </a>

            {/* Email */}
            <a
              href="mailto:somosmoovy@gmail.com?subject=Consulta%20desde%20Quiénes%20Somos"
              className="bg-white border border-gray-100 rounded-2xl p-8 text-center hover:shadow-lg transition group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 mb-4">
                Para consultas más detalladas
              </p>
              <span className="inline-flex items-center gap-1 text-blue-600 font-semibold text-sm">
                somosmoovy@gmail.com
                <ArrowRight className="w-4 h-4" />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="py-4">
              <div className="text-4xl lg:text-5xl font-black text-[#e60012] mb-2">
                80k
              </div>
              <p className="text-gray-600">Habitantes en Ushuaia</p>
              <p className="text-sm text-gray-500 mt-1">
                Nuestro mercado principal
              </p>
            </div>
            <div className="py-4 border-l border-gray-200">
              <div className="text-4xl lg:text-5xl font-black text-[#e60012] mb-2">
                0%
              </div>
              <p className="text-gray-600">Retención de Dinero</p>
              <p className="text-sm text-gray-500 mt-1">
                Cobras al instante siempre
              </p>
            </div>
            <div className="py-4 border-l border-gray-200">
              <div className="text-4xl lg:text-5xl font-black text-[#e60012] mb-2">
                8%
              </div>
              <p className="text-gray-600">Comisión Comercios</p>
              <p className="text-sm text-gray-500 mt-1">
                La más baja del mercado
              </p>
            </div>
            <div className="py-4 border-l border-gray-200">
              <div className="text-4xl lg:text-5xl font-black text-[#e60012] mb-2">
                24/7
              </div>
              <p className="text-gray-600">Soporte Disponible</p>
              <p className="text-sm text-gray-500 mt-1">
                Siempre que nos necesites
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-[#e60012] to-[#c40010] text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-black mb-6">
            Sé Parte de la Revolución
          </h2>
          <p className="text-lg text-white/90 mb-8 leading-relaxed">
            Ushuaia está cambiando. ¿Querés ser parte de esto?
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#e60012] px-8 py-3 rounded-2xl font-bold hover:bg-gray-100 transition"
            >
              Empezá a Pedir
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/comercio/registro"
              className="inline-flex items-center justify-center gap-2 bg-white/20 text-white px-8 py-3 rounded-2xl font-bold hover:bg-white/30 transition border border-white/40"
            >
              Registra tu Comercio
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
