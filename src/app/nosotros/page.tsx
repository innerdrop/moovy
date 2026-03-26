import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Quiénes Somos — MOOVY",
  description:
    "Nacimos en Ushuaia. Vivimos en Ushuaia. Creamos MOOVY para nuestra ciudad. Pagos instantáneos, comisiones justas, soporte humano.",
  keywords: [
    "delivery ushuaia",
    "comercio local",
    "pago instantáneo",
    "plataforma de delivery",
  ],
  openGraph: {
    title: "Quiénes Somos — MOOVY",
    description:
      "Nacimos en Ushuaia. Vivimos en Ushuaia. Creamos MOOVY para nuestra ciudad.",
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
              "https://wa.me/5492901553173",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+5492901553173",
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
      <section className="relative bg-white pt-20 pb-20 lg:pt-28 lg:pb-28 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
              Nuestra Historia
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-8 leading-tight">
              Nacimos en Ushuaia.
              <br />
              Vivimos en Ushuaia.
              <br />
              Creamos MOOVY para Ushuaia.
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-12">
              No somos una app que llegó de afuera. Somos gente de acá. Conocemos cada comercio, cada repartidor, cada cliente de esta ciudad. Eso nos hace diferentes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/comercio/registro"
              className="inline-flex items-center justify-center gap-2 bg-[#e60012] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#c40010] transition"
            >
              Registra tu Comercio
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://wa.me/5492901553173?text=Hola%20MOOVY!%20Quiero%20saber%20más"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition"
            >
              <MessageCircle className="w-5 h-5" />
              Contactanos
            </a>
          </div>
        </div>
      </section>

      {/* ===== STORY ===== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-8">
            Por Qué Existe MOOVY
          </p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <p className="text-lg md:text-xl text-gray-900 font-medium">
              Sabíamos que los comercios de nuestro barrio merecían algo mejor. Comisiones justas, sin letra chica.
            </p>

            <p>
              Sabíamos que retener la plata de un comercio por semanas no estaba bien. Que un negocio necesita su dinero hoy, no en un mes.
            </p>

            <p>
              Sabíamos que los negocios chicos que llevan años en Ushuaia merecen las mismas oportunidades de vender online que cualquier cadena grande.
            </p>

            <p>
              Entonces decidimos hacer algo diferente. Crear una plataforma que no sea de afuera, sino que sea de acá. Que entienda lo que es una ciudad de 80 mil habitantes. Que sepa que cuando hace -5°C, el repartidor que está en la calle se merece ganar bien. Que el comercio que abre a las 6 de la mañana no puede esperar un mes para acceder a su dinero.
            </p>

            <p>
              Por eso MOOVY existe. No porque queremos revolucionar el mundo. Sino porque queremos que nuestro barrio funcione mejor.
            </p>
          </div>
        </div>
      </section>

      {/* ===== DIFERENCIADORES ===== */}
      <section className="py-16 lg:py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-8">
            Qué nos hace diferentes
          </p>

          <div className="space-y-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Pago instantáneo
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Los comercios cobran al instante. Sin retenciones, sin esperas, sin intermediarios que decidan cuándo te llega tu plata. Vos vendés, vos cobrás. Así de simple.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Comisiones justas
              </h3>
              <p className="text-gray-600 leading-relaxed">
                8% para comercios. 12% para vendedores marketplace. 80% del delivery fee para repartidores. Nuestros números están publicados sin culpa. No tenemos secretos.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Soporte real
              </h3>
              <p className="text-gray-600 leading-relaxed">
                No somos un chatbot. Cuando nos contactés, hablas con personas de verdad que conocen tu negocio. WhatsApp, llamada, lo que necesites. Estamos acá.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                100% local
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Conocemos cada cuadra de Ushuaia. Conocemos el frio de invierno, el caos del verano, los comercios que les cuesta llegar a fin de mes. Por eso entendemos lo que necesitás.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-16 lg:py-24 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-12 text-center">
            Números que importan
          </p>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl lg:text-5xl font-black text-[#e60012] mb-2">
                80k
              </div>
              <p className="text-sm text-gray-600">
                Habitantes en Ushuaia
              </p>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-black text-[#e60012] mb-2">
                0%
              </div>
              <p className="text-sm text-gray-600">
                Retención de dinero
              </p>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-black text-[#e60012] mb-2">
                8%
              </div>
              <p className="text-sm text-gray-600">
                Comisión comercios
              </p>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-black text-[#e60012] mb-2">
                80%
              </div>
              <p className="text-sm text-gray-600">
                Para repartidores
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOR MERCHANTS ===== */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-8">
            Si tenés un comercio en Ushuaia
          </p>

          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-tight">
            Mereces cobrar al instante.
          </h2>

          <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-2xl">
            No esperes una semana. No esperes dos. Cada venta que hacés es dinero tuyo que te pertenece desde ese momento. Con MOOVY, así es.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              href="/comercio/registro"
              className="inline-flex items-center justify-center gap-2 bg-[#e60012] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#c40010] transition"
            >
              Registra tu comercio
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://wa.me/5492901553173?text=Hola%20MOOVY!%20Tengo%20un%20comercio%20en%20Ushuaia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition border border-gray-200"
            >
              <MessageCircle className="w-5 h-5" />
              Consultanos
            </a>
          </div>

          <div className="border-t border-gray-200 pt-10">
            <p className="text-sm text-gray-500 mb-6">Preguntas frecuentes de comercios:</p>
            <div className="space-y-6">
              <div>
                <p className="font-bold text-gray-900 mb-2">¿En cuánto tiempo cobro?</p>
                <p className="text-gray-600 text-sm">Al instante. Cuando el cliente paga, el dinero es tuyo.</p>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-2">¿Cuánta comisión cobran?</p>
                <p className="text-gray-600 text-sm">8%. Nada escondido. Es la más baja del mercado.</p>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-2">¿Quién me ayuda si tengo dudas?</p>
                <p className="text-gray-600 text-sm">Nuestro equipo. Por WhatsApp, mail, como prefieras. Somos personas de verdad.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="py-16 lg:py-24 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-8">
            Contactanos
          </p>

          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8">
            Estamos acá para vos.
          </h2>

          <div className="space-y-6">
            <a
              href="https://wa.me/5492901553173?text=Hola%20MOOVY!%20Me%20gustaría%20saber%20más"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex-shrink-0 mt-1">
                <MessageCircle className="w-6 h-6 text-[#e60012]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">WhatsApp</h3>
                <p className="text-gray-600 text-sm mb-2">Respuestas rápidas del equipo</p>
                <span className="inline-flex items-center gap-2 text-[#e60012] font-semibold text-sm">
                  +54 9 2901 553173
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </a>

            <a
              href="mailto:somosmoovy@gmail.com?subject=Consulta%20desde%20Quiénes%20Somos"
              className="flex items-start gap-4 p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex-shrink-0 mt-1">
                <MessageCircle className="w-6 h-6 text-[#e60012]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                <p className="text-gray-600 text-sm mb-2">Para consultas detalladas</p>
                <span className="inline-flex items-center gap-2 text-[#e60012] font-semibold text-sm">
                  somosmoovy@gmail.com
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </a>

            <a
              href="https://instagram.com/somosmoovy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex-shrink-0 mt-1">
                <MessageCircle className="w-6 h-6 text-[#e60012]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Instagram</h3>
                <p className="text-gray-600 text-sm mb-2">Noticias y actualizaciones</p>
                <span className="inline-flex items-center gap-2 text-[#e60012] font-semibold text-sm">
                  @somosmoovy
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>


      {/* ===== CTA FINAL ===== */}
      <section className="py-16 lg:py-24 bg-[#e60012] text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">
            Vos podés ser el siguiente.
          </h2>
          <p className="text-lg text-white/90 mb-12 leading-relaxed">
            Si sos comprador, comercio, repartidor o simplemente alguien que cree que Ushuaia se merece esto, acá estamos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#e60012] px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Comenzar
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/comercio/registro"
              className="inline-flex items-center justify-center gap-2 bg-white/20 text-white px-8 py-3 rounded-lg font-bold hover:bg-white/30 transition border border-white/30"
            >
              Registra tu Comercio
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}