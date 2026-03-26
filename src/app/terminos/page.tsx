import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y Condiciones | MOOVY",
  description:
    "Términos y condiciones de uso de la plataforma MOOVY. Lee nuestras políticas antes de utilizar el servicio.",
};

export default function TerminosPage() {
  const lastUpdated = "22 de marzo de 2026";
  const whatsappNumber = "5492901553173";

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-red-100 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Términos y Condiciones
          </h1>
          <p className="text-red-100 text-sm">
            Última actualización: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-400">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-amber-800">
            <strong>⚠️ Nota Legal:</strong> Este documento es un borrador.
            Versión final sujeta a revisión legal por asesor jurídico
            certificado en Argentina.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Table of Contents */}
        <div className="bg-slate-50 rounded-lg p-6 mb-12">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Tabla de Contenidos
          </h2>
          <nav className="space-y-2">
            {[
              { id: "naturaleza", label: "1. Naturaleza del Servicio" },
              { id: "registro", label: "2. Registro y Cuenta de Usuario" },
              {
                id: "comercios",
                label: "3. Responsabilidades de los Comercios",
              },
              { id: "repartidores", label: "4. Repartidores Independientes" },
              { id: "compras", label: "5. Compras y Pagos" },
              { id: "delivery", label: "6. Entregas y Horarios" },
              {
                id: "limitacion",
                label: "7. Limitación de Responsabilidad",
              },
              { id: "propiedad", label: "8. Propiedad Intelectual" },
              { id: "datos", label: "9. Datos Personales y Privacidad" },
              {
                id: "arrepentimiento",
                label: "10. Derecho de Arrepentimiento",
              },
              {
                id: "modificaciones",
                label: "11. Modificaciones de Términos",
              },
              {
                id: "cancelaciones",
                label: "12. Cancelaciones y Devoluciones",
              },
              {
                id: "conflictos",
                label: "13. Resolución de Conflictos",
              },
              { id: "contacto", label: "14. Información de Contacto" },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-red-600 hover:text-red-700 hover:underline transition text-sm"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Content Sections */}
        <div className="prose prose-sm sm:prose max-w-none space-y-8">
          {/* 1. Naturaleza del Servicio */}
          <section id="naturaleza" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              1. Naturaleza del Servicio
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                MOOVY es una plataforma tecnológica de intermediación que
                conecta <strong>compradores</strong>, <strong>comercios</strong>{" "}
                y <strong>repartidores</strong> independientes. Facilitamos
                transacciones de compra y entrega, pero{" "}
                <strong>no somos responsables directos</strong> por:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  La calidad, legalidad o seguridad de los productos ofrecidos
                  por comercios
                </li>
                <li>El cumplimiento de horarios exactos de entrega</li>
                <li>
                  Daños, pérdidas o robos durante el transporte (salvo defecto
                  de MOOVY)
                </li>
                <li>
                  Comportamiento de repartidores fuera de la relación de entrega
                </li>
              </ul>
              <p>
                MOOVY actúa como facilitador tecnológico. Los compradores, al
                usar nuestra plataforma, aceptan esta naturaleza de intermediario
                y no de vendedor directo.
              </p>
            </div>
          </section>

          {/* 2. Registro y Cuenta */}
          <section id="registro" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              2. Registro y Cuenta de Usuario
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                Para usar MOOVY, debes registrarte con datos veraces y
                actualizados:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Mayor de 18 años:</strong> Solo personas mayores de
                  edad pueden crear cuenta
                </li>
                <li>
                  <strong>Datos veraces:</strong> Nombre, email, teléfono y
                  dirección deben ser exactos
                </li>
                <li>
                  <strong>Responsabilidad:</strong> Eres responsable de toda
                  actividad en tu cuenta
                </li>
                <li>
                  <strong>Contraseña:</strong> Mantén tu contraseña segura.
                  Mínimo 8 caracteres
                </li>
                <li>
                  <strong>Una cuenta por persona:</strong> No está permitido tener
                  múltiples cuentas
                </li>
              </ul>
              <p>
                Si detectamos información falsa, uso fraudulento o violación de
                estos términos, podemos suspender o cancelar tu cuenta sin aviso.
              </p>
            </div>
          </section>

          {/* 3. Comercios */}
          <section id="comercios" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              3. Responsabilidades de los Comercios
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>Los comercios que operan a través de MOOVY declaran:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Legalidad:</strong> Poseen todos los permisos,
                  habilitaciones sanitarias, CUIT registrado en AFIP y cumplen
                  normativas locales
                </li>
                <li>
                  <strong>Calidad de productos:</strong> Son responsables únicos
                  de la legalidad, seguridad y descripción de productos ofrecidos
                </li>
                <li>
                  <strong>Precios:</strong> Fijan libremente sus precios. MOOVY
                  retiene una comisión según el plan contratado (standard 8%)
                </li>
                <li>
                  <strong>Stock:</strong> Son responsables de mantener stock
                  actualizado
                </li>
                <li>
                  <strong>Horarios:</strong> Deben respetar sus horarios
                  publicados
                </li>
                <li>
                  <strong>Obligaciones fiscales:</strong> Deben registrar todas
                  las ventas ante AFIP
                </li>
              </ul>
              <p>
                MOOVY puede rechazar comercios o productos que considere
                ilegales, peligrosos o que violen leyes argentinas.
              </p>
            </div>
          </section>

          {/* 4. Repartidores */}
          <section id="repartidores" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              4. Repartidores Independientes
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                <strong>Los repartidores NO son empleados de MOOVY.</strong> Son
                contratistas independientes que aceptan entregas caso por caso.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Independencia:</strong> Pueden aceptar o rechazar
                  pedidos. No hay relación laboral con MOOVY
                </li>
                <li>
                  <strong>Ingresos:</strong> Perciben una comisión por entrega
                  completada (configurable: standard 80% del delivery fee)
                </li>
                <li>
                  <strong>Responsabilidad:</strong> Son responsables de:
                  <ul className="list-circle list-inside ml-4 mt-2 space-y-1">
                    <li>Documentación: DNI vigente, licencia, VTV, seguro</li>
                    <li>Vehículo en buen estado mecánico</li>
                    <li>Manejo seguro e irresponsabilidad en la ruta</li>
                    <li>Póliza de seguro (no obligatoria pero recomendada)</li>
                  </ul>
                </li>
                <li>
                  <strong>No somos responsables:</strong> MOOVY no cubre accidentes,
                  multas de tránsito ni daños al vehículo
                </li>
              </ul>
            </div>
          </section>

          {/* 5. Compras y Pagos */}
          <section id="compras" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              5. Compras y Pagos
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                <strong>Métodos de pago:</strong> MOOVY acepta dos formas de pago:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  <strong>MercadoPago Checkout Pro:</strong> Tarjeta de crédito,
                  débito, transferencia y otros medios digitales
                </li>
                <li>
                  <strong>Efectivo en la puerta:</strong> El repartidor cobra al
                  momento de entrega
                </li>
              </ol>

              <p className="mt-4">
                <strong>Moneda de compra:</strong> Todas las transacciones se
                realizan en Pesos Argentinos (ARS).
              </p>

              <p>
                <strong>Comisiones:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  Comercios: <strong>8%</strong> de la venta (configurable)
                </li>
                <li>
                  Repartidores: <strong>20%</strong> del delivery fee
                </li>
                <li>Puntos MOOVER: Podés usar hasta 50% de descuento</li>
              </ul>

              <p>
                <strong>Compra exitosa:</strong> Al confirmar el pago via
                MercadoPago o elegir efectivo, se genera el pedido y el comercio
                recibe notificación para preparar.
              </p>

              <p>
                <strong>Reembolsos:</strong> En caso de pago rechazado o error,
                MercadoPago procesa reembolsos automáticamente (3-5 días hábiles).
              </p>
            </div>
          </section>

          {/* 6. Entregas y Horarios */}
          <section id="delivery" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              6. Entregas y Horarios
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                <strong>Horario de entregas:</strong> MOOVY opera entregas entre
                las <strong>9:00 y 22:00 horas</strong>.
              </p>

              <p>
                <strong>Tiempos estimados:</strong> Los tiempos de entrega (ej:
                "15-30 min") son{" "}
                <strong>orientativos, no garantizados</strong>. Pueden variar por:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Demora en la preparación del comercio</li>
                <li>Disponibilidad de repartidores</li>
                <li>Tráfico y condiciones climáticas</li>
                <li>Ubicación geográfica del destino</li>
              </ul>

              <p>
                <strong>Radio de entrega:</strong> Cada comercio define su radio
                (default 5 km). Si tu dirección está fuera del radio, no podemos
                procesar el pedido.
              </p>

              <p>
                <strong>Entregas programadas:</strong> Podés solicitar entregas
                en franjas futuras (hasta 48 horas). El comercio debe confirmar
                disponibilidad.
              </p>

              <p>
                <strong>Efectivo:</strong> Si pagás en efectivo, debes tener el
                monto exacto o mayor. El repartidor puede rechazar el pedido si
                no tiene cambio.
              </p>
            </div>
          </section>

          {/* 7. Limitación de Responsabilidad */}
          <section id="limitacion" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              7. Limitación de Responsabilidad
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                <strong>MOOVY no garantiza:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Que los productos no estén dañados, vencidos o falsificados</li>
                <li>Ausencia de demoras o entregas tardías</li>
                <li>Que los precios sean los mejores del mercado</li>
                <li>Continuidad ininterrumpida del servicio (puede haber
                  mantenimientos)</li>
                <li>Cumplimiento exacto de horarios publicados</li>
              </ul>

              <p className="mt-4">
                <strong>Responsabilidad limitada:</strong> MOOVY es responsable
                SOLO por errores directos de la plataforma (ej: cobro duplicado,
                no entrega de código de pago). En estos casos, el monto máximo de
                restitución es el valor del pedido.
              </p>

              <p>
                <strong>Terceros:</strong> MOOVY no es responsable por:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Daño, pérdida o robo del producto durante entrega</li>
                <li>Conducta de comercios o repartidores</li>
                <li>Disputas entre compradores y terceros</li>
                <li>Disponibilidad de servicios de terceros (MercadoPago, Google Maps)</li>
              </ul>
            </div>
          </section>

          {/* 8. Propiedad Intelectual */}
          <section id="propiedad" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              8. Propiedad Intelectual
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                <strong>MOOVY</strong> es marca registrada. Todos los derechos de
                la plataforma, logo, interfaz, textos y funcionalidades pertenecen
                a sus titulares.
              </p>

              <p>
                <strong>Prohibido:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Copiar, descargar o replicar el código fuente</li>
                <li>Usar marcas MOOVY sin autorización</li>
                <li>Scraping de datos de la plataforma</li>
                <li>Publicidad engañosa basada en MOOVY</li>
              </ul>

              <p>
                <strong>Contenido de usuarios:</strong> Al publicar fotos,
                comentarios o reseñas en MOOVY, aceptas que podemos usarlos en
                la plataforma sin compensación.
              </p>
            </div>
          </section>

          {/* 9. Datos Personales */}
          <section id="datos" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              9. Datos Personales y Privacidad
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                MOOVY cumple con la <strong>Ley 25.326 de Protección de Datos Personales</strong> y
                la <strong>Ley 24.240 de Defensa del Consumidor</strong>.
              </p>

              <p>
                <strong>Datos que recopilamos:</strong> Nombre, email, teléfono,
                dirección, historial de compras, ubicación GPS (durante entrega),
                IP, cookies.
              </p>

              <p>
                <strong>Finalidad:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Procesar tu orden de compra</li>
                <li>Facilitar entrega</li>
                <li>Contactarte sobre tu pedido</li>
                <li>Mejorar el servicio</li>
                <li>Prevenir fraude</li>
              </ul>

              <p>
                <strong>Derechos ARCO:</strong> Tenés derecho a Acceso,
                Rectificación, Cancelación u Oposición de tus datos. Escribí a{" "}
                <strong>legal@somosmoovy.com</strong> con tu solicitud.
              </p>

              <p>
                <strong>Terceros:</strong> Compartimos datos con:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Comercios (nombre, teléfono, dirección del pedido)</li>
                <li>Repartidores (nombre, ubicación, teléfono)</li>
                <li>MercadoPago (datos de pago)</li>
                <li>Proveedores técnicos (hosting, analytics)</li>
              </ul>

              <p>
                <strong>Cookies:</strong> Usamos cookies para mejorar tu
                experiencia. Podés deshabilitarlas en tu navegador.
              </p>
            </div>
          </section>

          {/* 10. Derecho de Arrepentimiento */}
          <section id="arrepentimiento" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              10. Derecho de Arrepentimiento
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                Conforme el <strong>artículo 34 de la Ley 24.240</strong>, tenés
                derecho a arrepentirte de tu compra <strong>dentro de 10 días</strong> contados
                desde la entrega.
              </p>

              <p>
                <strong>Cómo ejercerlo:</strong> Escribí a WhatsApp{" "}
                <strong>{whatsappNumber}</strong> o email{" "}
                <strong>reclamos@somosmoovy.com</strong> con:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Número de pedido</li>
                <li>Foto del producto (si es posible)</li>
                <li>Motivo del arrepentimiento</li>
              </ul>

              <p>
                <strong>Condiciones y excepciones:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>NO aplica</strong> a productos perecederos (comidas,
                  bebidas, productos frescos) una vez entregados
                </li>
                <li>
                  <strong>NO aplica</strong> si el producto se consumió parcialmente
                </li>
                <li>
                  <strong>SÍ aplica</strong> a productos defectuosos o no conformes
                  con la descripción
                </li>
              </ul>

              <p>
                <strong>Reembolso:</strong> Si aceptamos el arrepentimiento,
                procesaremos el reembolso en 7 días hábiles.
              </p>
            </div>
          </section>

          {/* 11. Modificaciones */}
          <section id="modificaciones" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              11. Modificaciones de Términos
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                MOOVY se reserva el derecho de modificar estos términos en
                cualquier momento. Las modificaciones serán efectivas:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Cambios menores:</strong> 48 horas de aviso
                </li>
                <li>
                  <strong>Cambios que te afecten:</strong> Mínimo 10 días de aviso
                  por email o in-app
                </li>
              </ul>

              <p>
                Si no aceptas los nuevos términos, podés dejar de usar MOOVY.
                Seguir usando la plataforma después del aviso implica aceptación.
              </p>
            </div>
          </section>

          {/* 12. Cancelaciones y Devoluciones */}
          <section id="cancelaciones" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              12. Cancelaciones y Devoluciones
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                <strong>Cancelación antes de aceptación:</strong> Podés cancelar
                tu pedido SIN COSTO si el comercio aún no lo aceptó. Reembolso
                instantáneo.
              </p>

              <p>
                <strong>Después de aceptación:</strong> Si el comercio ya aceptó
                el pedido, la cancelación incluye penalización (10-20% del monto)
                como compensación por preparación.
              </p>

              <p>
                <strong>Durante entrega:</strong> MOOVY puede negociar con el
                comercio y repartidor. No garantizamos cancelación sin costo.
              </p>

              <p>
                <strong>Producto faltante o dañado:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Contacta en la app dentro de 24 horas</li>
                <li>Envía foto del problema</li>
                <li>
                  El comercio debe resolver o devolver dinero (MOOVY media en
                  disputas)
                </li>
              </ul>

              <p>
                <strong>Devoluciones:</strong> El comercio es responsable de su
                política de cambios. MOOVY no interviene en devoluciones directas
                al comercio. Los tiempos pueden ser 15-30 días según comercio.
              </p>
            </div>
          </section>

          {/* 13. Conflictos */}
          <section id="conflictos" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              13. Resolución de Conflictos
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                <strong>Mediación previa:</strong> Toda disputa debe intentarse
                resolver por WhatsApp o email con MOOVY antes de accionar legalmente.
              </p>

              <p>
                <strong>Procedimiento:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Escribí tu reclamo a WhatsApp: {whatsappNumber}</li>
                <li>MOOVY responde en máximo 48 horas</li>
                <li>Si no se resuelve, escalar a reclamos@somosmoovy.com</li>
                <li>Respuesta formal en 10 días hábiles</li>
              </ol>

              <p>
                <strong>Jurisdicción:</strong> Estos términos se rigen por la
                legislación de la <strong>Provincia de Tierra del Fuego, Argentina</strong>.
                Las partes se someten a los tribunales competentes de Ushuaia.
              </p>

              <p>
                <strong>Ley aplicable:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Ley 24.240 - Defensa del Consumidor</li>
                <li>Ley 25.326 - Protección de Datos Personales</li>
                <li>Código Civil y Comercial Argentino</li>
                <li>Leyes locales de Tierra del Fuego</li>
              </ul>
            </div>
          </section>

          {/* 14. Contacto */}
          <section id="contacto" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              14. Información de Contacto
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                <strong>MOOVY — Plataforma de Delivery</strong>
              </p>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <p>
                  <strong>WhatsApp (Soporte):</strong>{" "}
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline"
                  >
                    {whatsappNumber}
                  </a>
                </p>
                <p>
                  <strong>Email (Reclamos):</strong>{" "}
                  <a
                    href="mailto:reclamos@somosmoovy.com"
                    className="text-red-600 hover:underline"
                  >
                    reclamos@somosmoovy.com
                  </a>
                </p>
                <p>
                  <strong>Email (Legal/ARCO):</strong>{" "}
                  <a
                    href="mailto:legal@somosmoovy.com"
                    className="text-red-600 hover:underline"
                  >
                    legal@somosmoovy.com
                  </a>
                </p>
                <p>
                  <strong>Dominio:</strong>{" "}
                  <a
                    href="https://somosmoovy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline"
                  >
                    somosmoovy.com
                  </a>
                </p>
                <p>
                  <strong>Ubicación:</strong> Ushuaia, Tierra del Fuego, Argentina
                </p>
              </div>
            </div>
          </section>

          {/* Final Note */}
          <section className="mt-12 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <h3 className="font-bold text-slate-900 mb-2">
              ✓ Aceptación de Términos
            </h3>
            <p className="text-sm text-slate-700">
              Al usar MOOVY, aceptás estos términos y condiciones en su totalidad.
              Si no estás de acuerdo con alguna cláusula, no podés usar el servicio.
              La aceptación es libre, informada y voluntaria.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Link
              href="/privacidad"
              className="text-red-600 hover:text-red-700 hover:underline"
            >
              Política de Privacidad
            </Link>
            <Link
              href="/politica-cookies"
              className="text-red-600 hover:text-red-700 hover:underline"
            >
              Política de Cookies
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
