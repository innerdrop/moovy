"use client";

import Link from "next/link";
import { useState } from "react";
import {
    ArrowLeft,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    Mail,
    ShoppingBag,
    Truck,
    CreditCard,
    Star,
    Store,
    Tag,
    UserCog
} from "lucide-react";

interface FaqItem {
    question: string;
    answer: string;
}

interface FaqSection {
    title: string;
    icon: React.ReactNode;
    items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
    {
        title: "Pedidos y Compras",
        icon: <ShoppingBag className="w-5 h-5" />,
        items: [
            {
                question: "¿Cómo hago un pedido?",
                answer: "Ingresá a la tienda, buscá los productos que querés, agregalos al carrito y seguí los pasos del checkout. Podés elegir entre retiro en local o delivery."
            },
            {
                question: "¿Puedo cancelar un pedido?",
                answer: "Podés cancelar tu pedido siempre y cuando no haya sido aceptado por el comercio. Una vez aceptado, contactanos por WhatsApp para gestionar la cancelación."
            },
            {
                question: "¿Cómo veo el estado de mi pedido?",
                answer: "Entrá a \"Mis Pedidos\" desde el menú inferior. Ahí vas a ver el estado actualizado en tiempo real de cada pedido."
            },
            {
                question: "¿Puedo repetir un pedido anterior?",
                answer: "Sí, entrá al detalle de un pedido anterior desde \"Mis Pedidos\" y usá el botón \"Repetir pedido\" para agregar los mismos productos al carrito."
            }
        ]
    },
    {
        title: "Delivery y Envíos",
        icon: <Truck className="w-5 h-5" />,
        items: [
            {
                question: "¿Cuánto tarda el delivery?",
                answer: "El tiempo estimado depende del comercio y la distancia. Generalmente entre 20 y 45 minutos. Podés seguir tu pedido en tiempo real."
            },
            {
                question: "¿Cuánto cuesta el envío?",
                answer: "El costo de envío se calcula automáticamente en el checkout según la distancia entre el comercio y tu dirección."
            },
            {
                question: "¿Puedo retirar en el local?",
                answer: "Sí, al momento del checkout podés elegir \"Retiro en local\" como método de entrega para evitar el costo de envío."
            }
        ]
    },
    {
        title: "Pagos",
        icon: <CreditCard className="w-5 h-5" />,
        items: [
            {
                question: "¿Qué métodos de pago aceptan?",
                answer: "Aceptamos pago en efectivo contra entrega y pago online a través de Mercado Pago (tarjetas de crédito, débito y otros medios)."
            },
            {
                question: "¿Es seguro pagar online?",
                answer: "Sí, los pagos online se procesan a través de Mercado Pago, una plataforma segura y certificada. MOOVY no almacena datos de tarjetas."
            }
        ]
    },
    {
        title: "Programa MOOVER (Puntos)",
        icon: <Star className="w-5 h-5" />,
        items: [
            {
                question: "¿Cómo gano puntos MOOVER?",
                answer: "Ganás 1 punto por cada $1 que gastás en compras. También ganás 500 puntos por cada amigo que invites y un bono de bienvenida de 250 puntos al registrarte."
            },
            {
                question: "¿Cómo uso mis puntos?",
                answer: "Podés canjear tus puntos por descuentos en el checkout. El descuento máximo es del 50% del subtotal y se requiere un mínimo de 500 puntos."
            },
            {
                question: "¿Los puntos vencen?",
                answer: "Consultá los términos completos del programa MOOVER en la sección de Términos MOOVER para conocer las condiciones de vigencia."
            }
        ]
    },
    {
        title: "Comercios",
        icon: <Store className="w-5 h-5" />,
        items: [
            {
                question: "¿Cómo registro mi comercio en MOOVY?",
                answer: "Ingresá a somosmoovy.com/comercio/registro y completá el formulario de onboarding. Nuestro equipo revisará tu solicitud y te contactará."
            },
            {
                question: "¿Cuánto cuesta tener mi comercio en MOOVY?",
                answer: "Contactanos por WhatsApp o email para conocer los planes disponibles para tu comercio."
            }
        ]
    },
    {
        title: "Marketplace (Vendedores)",
        icon: <Tag className="w-5 h-5" />,
        items: [
            {
                question: "¿Cómo vendo mis productos en el Marketplace?",
                answer: "Desde tu perfil, activá el rol de Vendedor. Luego vas a poder publicar tus productos desde el portal de vendedor."
            },
            {
                question: "¿Qué puedo vender?",
                answer: "Podés vender productos nuevos, usados o reacondicionados. Todas las publicaciones pasan por un proceso de moderación antes de ser visibles."
            }
        ]
    },
    {
        title: "Mi Cuenta",
        icon: <UserCog className="w-5 h-5" />,
        items: [
            {
                question: "¿Cómo cambio mi contraseña?",
                answer: "Entrá a Mi Perfil → Cambiar contraseña. Vas a necesitar ingresá tu contraseña actual y la nueva."
            },
            {
                question: "¿Cómo actualizo mis datos?",
                answer: "Entrá a Mi Perfil → Mis Datos. Ahí podés editar tu nombre, teléfono y otros datos personales."
            },
            {
                question: "¿Puedo tener más de un rol?",
                answer: "Sí, un mismo usuario puede ser comprador, vendedor y repartidor simultáneamente. Activá los roles desde Mi Perfil."
            }
        ]
    }
];

function FaqAccordion({ section }: { section: FaqSection }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
                <div className="w-8 h-8 bg-[#e60012]/10 rounded-lg flex items-center justify-center text-[#e60012]">
                    {section.icon}
                </div>
                <h2 className="font-bold text-gray-900">{section.title}</h2>
            </div>
            <div className="divide-y divide-gray-50">
                {section.items.map((item, index) => (
                    <div key={index}>
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-medium text-gray-800 pr-4">{item.question}</span>
                            {openIndex === index ? (
                                <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                        </button>
                        {openIndex === index && (
                            <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed animate-fadeIn">
                                {item.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AyudaPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <Link href="/mi-perfil" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-[#e60012]" />
                        <h1 className="font-bold text-lg text-gray-900">Centro de Ayuda</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {/* FAQ Sections */}
                {FAQ_SECTIONS.map((section, index) => (
                    <FaqAccordion key={index} section={section} />
                ))}

                {/* Contact CTA */}
                <div className="bg-gradient-to-br from-[#e60012] to-[#ff4d5e] rounded-2xl p-6 text-white text-center">
                    <h3 className="font-bold text-lg mb-2">¿No encontrás lo que buscás?</h3>
                    <p className="text-white/80 text-sm mb-5">
                        Nuestro equipo está disponible para ayudarte
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <a
                            href="https://wa.me/5492901531773?text=Hola!%20Necesito%20ayuda%20con%20MOOVY"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-green-50 transition"
                        >
                            <MessageCircle className="w-5 h-5" />
                            WhatsApp
                        </a>
                        <a
                            href="mailto:somosmoovy@gmail.com?subject=Ayuda%20MOOVY"
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition"
                        >
                            <Mail className="w-5 h-5" />
                            Email
                        </a>
                    </div>
                </div>

                {/* Useful links */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-900 mb-3">Links útiles</h3>
                    <div className="space-y-2">
                        <Link href="/terminos" className="block text-[#e60012] hover:underline text-sm font-medium">
                            → Términos y Condiciones
                        </Link>
                        <Link href="/privacidad" className="block text-[#e60012] hover:underline text-sm font-medium">
                            → Política de Privacidad
                        </Link>
                        <Link href="/terminos-moover" className="block text-[#e60012] hover:underline text-sm font-medium">
                            → Términos del Programa MOOVER
                        </Link>
                        <Link href="/contacto" className="block text-[#e60012] hover:underline text-sm font-medium">
                            → Contacto
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
