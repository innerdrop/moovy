"use client";

// StoreProfileClient — cabecera y catálogo del perfil público del comercio.
// Rama feat/rediseno-perfil-comercio (2026-07-25), diseño "Onda austral":
//
// - Portada compacta FULL-BLEED hasta el borde superior con corte curvo (SVG).
// - Volver + buscador + favorito FLOTAN sobre la foto; al scrollear aparece un
//   header fijo con blur que hereda el buscador (mismo estado, te sigue lo
//   que escribiste).
// - Identidad: logo y nombre lado a lado (sin espacio muerto).
// - Datos operativos como chips: "Abierto" con punto vivo, rating/"Nuevo"
//   (rating real; "Nuevo" desaparece solo con la primera reseña), tiempo,
//   envío gratis.
// - Buscador SCOPED: filtra solo los productos de ESTE comercio, en memoria
//   (ya vienen cargados server-side — cero requests).
// - Decisión canónica: el perfil público NO expone badge "Verificado" ni
//   canales externos de contacto (WhatsApp/Instagram/Facebook/teléfono).
//   Las redes del comercio son canal de ENTRADA (co-marketing), no de salida.
//
// Server/client split: la página (RSC) calcula estado real del horario en
// timezone Ushuaia, los puntos MOOVER por producto (calculatePointsEarned) y
// las filas del popup de horarios; acá solo se renderiza y se filtra.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Clock, MapPin, Search, ShoppingBag, Star, X } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import HeartButton from "@/components/ui/HeartButton";
import { useCartStore } from "@/store/cart";

export interface StoreProfileProduct {
    id: string;
    slug: string;
    name: string;
    price: number;
    description: string | null;
    image: string | null;
    merchantId: string;
    merchant: { isOpen: boolean; isCurrentlyOpen: boolean };
    /** puntos MOOVER calculados server-side (calculatePointsEarned) */
    points: number | null;
}

export interface ScheduleRow {
    label: string;      // "Lunes"
    isToday: boolean;
    text: string;       // "09:00 – 21:00" | "09:00 – 13:00 / 17:00 – 21:00" | "Cerrado"
}

interface StoreProfileClientProps {
    merchant: {
        id: string;
        name: string;
        description: string | null;
        category: string | null;
        image: string | null;
        banner: string | null;
        rating: number | null;
        deliveryTimeMin: number;
        deliveryTimeMax: number;
        address: string | null;
    };
    isCurrentlyOpen: boolean;
    freeDeliveryMinimum: number | null;
    /** [{ name, products }] — un solo grupo sin header cuando useFlatList */
    groups: { name: string; products: StoreProfileProduct[] }[];
    useFlatList: boolean;
    /** Horarios calculados server-side (timezone Ushuaia) para el popup */
    schedule: {
        rows: ScheduleRow[];
        /** hora de cierre de HOY si está abierto ahora (ej: "23:59") */
        openUntil: string | null;
    };
}

const SCROLL_THRESHOLD = 150;

export default function StoreProfileClient({
    merchant,
    isCurrentlyOpen,
    freeDeliveryMinimum,
    groups,
    useFlatList,
    schedule,
}: StoreProfileClientProps) {
    // Popup de horarios (decisión founder 2026-07-25): el acordeón inline
    // empujaba el catálogo fuera de pantalla — ahora los horarios flotan en
    // una hoja modal y los productos no se mueven.
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [topbarVisible, setTopbarVisible] = useState(false);

    // Carrito: el AppHeader global (con su badge) no se monta en el perfil
    // inmersivo, así que la salida al carrito vive acá — barra "Ver mi pedido"
    // fija sobre la nav inferior, solo cuando hay items.
    const openCart = useCartStore((s) => s.openCart);
    const cartCount = useCartStore((s) => s.getTotalItems());
    const cartTotal = useCartStore((s) => s.getTotalPrice());

    useEffect(() => {
        const onScroll = () => setTopbarVisible(window.scrollY > SCROLL_THRESHOLD);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const allProducts = useMemo(() => groups.flatMap((g) => g.products), [groups]);

    // Búsqueda scoped: solo el catálogo de este comercio, en memoria.
    const trimmed = query.trim().toLowerCase();
    const results = useMemo(() => {
        if (!trimmed) return null;
        return allProducts.filter(
            (p) =>
                p.name.toLowerCase().includes(trimmed) ||
                (p.description ?? "").toLowerCase().includes(trimmed)
        );
    }, [trimmed, allProducts]);

    const showTabs = !useFlatList && groups.length > 1 && !results;

    const searchInput = (variant: "cover" | "topbar") => (
        <div
            className={`flex-1 min-w-0 flex items-center gap-2 h-10 rounded-full px-3.5 ${
                variant === "cover"
                    ? "bg-white/95 shadow-lg"
                    : "bg-gray-100"
            }`}
        >
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Buscar en ${merchant.name}`}
                className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                aria-label={`Buscar productos en ${merchant.name}`}
            />
            {query && (
                <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Limpiar búsqueda"
                    className="p-0.5 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );

    return (
        <div>
            {/* ── Header fijo: aparece cuando la portada sale de pantalla ── */}
            <div
                className={`fixed top-0 inset-x-0 z-50 transition-transform duration-300 ${
                    topbarVisible ? "translate-y-0" : "-translate-y-full"
                }`}
            >
                {/* fix/safe-area (2026-07-26): en PWA instalada la página llega hasta el
                    borde físico de la pantalla — sin este padding el buscador queda DEBAJO
                    del reloj/batería del iPhone y no se puede tocar. safe-area-top = 0 en
                    navegador común, así que no cambia nada fuera del modo app. */}
                <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm safe-area-top">
                    <div className="container mx-auto px-4 py-2.5 flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-9 h-9 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0"
                            aria-label="Volver"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                            {merchant.image ? (
                                <Image src={merchant.image} alt="" fill sizes="32px" className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                                    {merchant.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        {searchInput("topbar")}
                    </div>
                </div>
            </div>

            {/* ── Portada full-bleed con corte curvo ── */}
            <div className="relative h-44 sm:h-52 overflow-hidden bg-gradient-to-r from-gray-800 to-gray-900">
                {merchant.banner ? (
                    <Image
                        src={merchant.banner}
                        alt={`Portada de ${merchant.name}`}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <span className="text-4xl font-bold text-white tracking-widest uppercase">
                            {merchant.name}
                        </span>
                    </div>
                )}
                {/* Degradé superior: los controles flotantes se leen sobre cualquier foto */}
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />

                {/* Controles flotantes: volver · buscador · favorito */}
                <div className="absolute inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top))] z-10">
                    <div className="container mx-auto px-4 flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-10 h-10 rounded-full bg-white/95 shadow-lg flex items-center justify-center flex-shrink-0"
                            aria-label="Volver"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </Link>
                        {searchInput("cover")}
                        {/* Wrapper con el círculo: HeartButton trae su propio tamaño (w-8)
                            y pisarle clases de Tailwind es orden-dependiente. */}
                        <div className="w-10 h-10 rounded-full bg-white/95 shadow-lg flex items-center justify-center flex-shrink-0">
                            <HeartButton type="merchant" itemId={merchant.id} />
                        </div>
                    </div>
                </div>

                {/* Onda austral: corte curvo inferior (fill = bg de la página) */}
                <svg
                    viewBox="0 0 390 44"
                    preserveAspectRatio="none"
                    className="absolute -bottom-px inset-x-0 w-full h-11 pointer-events-none"
                    aria-hidden="true"
                >
                    <path
                        d="M0,44 L0,24 C80,42 160,6 250,18 C320,27 360,11 390,21 L390,44 Z"
                        fill="#f9fafb"
                    />
                </svg>
            </div>

            {/* ── Identidad: logo + nombre lado a lado ── */}
            <div className="container mx-auto px-4 -mt-9 relative z-10">
                <div className="flex items-end gap-3.5">
                    <div className="w-20 h-20 rounded-3xl bg-white p-1 shadow-lg flex-shrink-0">
                        {merchant.image ? (
                            <div className="relative w-full h-full rounded-[1.25rem] overflow-hidden bg-gray-50">
                                <Image
                                    src={merchant.image}
                                    alt={`Logo de ${merchant.name}`}
                                    fill
                                    sizes="80px"
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full bg-gray-100 rounded-[1.25rem] flex items-center justify-center text-2xl font-bold text-gray-400">
                                {merchant.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                            {merchant.name}
                        </h1>
                        <p className="text-sm text-gray-500 truncate">
                            {[merchant.category, merchant.description].filter(Boolean).join(" · ")}
                        </p>
                    </div>
                </div>

                {/* ── Tarjeta de datos operativos ── */}
                <div className="mt-3.5 bg-white rounded-2xl shadow-[0_8px_30px_rgba(23,24,28,0.08)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {isCurrentlyOpen ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 rounded-full px-3 py-1.5">
                                <span className="relative flex w-2 h-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
                                    <span className="relative inline-flex rounded-full w-2 h-2 bg-green-500" />
                                </span>
                                Abierto{schedule.openUntil ? ` hasta las ${schedule.openUntil}` : ""}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-full px-3 py-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-400" />
                                Cerrado
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-3 py-1.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {merchant.rating ? merchant.rating.toFixed(1) : "Nuevo"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-3 py-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {merchant.deliveryTimeMin}–{merchant.deliveryTimeMax} min
                        </span>
                        {freeDeliveryMinimum !== null && (
                            <span className="inline-flex items-center text-xs font-semibold text-[#e60012] bg-red-50 rounded-full px-3 py-1.5">
                                Envío gratis desde ${freeDeliveryMinimum.toLocaleString("es-AR")}
                            </span>
                        )}
                    </div>
                    {/* Dirección ⟷ Horarios en UNA fila: sin aire muerto. El popup
                        reemplaza al acordeón que empujaba el catálogo. */}
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-100 flex items-center justify-between gap-3">
                        {merchant.address ? (
                            <span className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{merchant.address}</span>
                            </span>
                        ) : <span />}
                        <button
                            type="button"
                            onClick={() => setScheduleOpen(true)}
                            className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-[#e60012] transition flex-shrink-0"
                        >
                            <Clock className="w-3.5 h-3.5" />
                            Horarios
                            <span aria-hidden="true">›</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tabs de categorías (anchors) ── */}
            {showTabs && (
                <div className="sticky top-[calc(56px+env(safe-area-inset-top))] z-40 mt-5">
                    <div className="bg-gradient-to-b from-gray-50 via-gray-50/95 to-transparent pb-2 pt-1">
                        <div className="container mx-auto px-4">
                            <div className="flex overflow-x-auto gap-2 no-scrollbar">
                                {groups.map((g) => (
                                    <a
                                        key={g.name}
                                        href={`#cat-${g.name}`}
                                        className="whitespace-nowrap flex-shrink-0 px-4 py-1.5 bg-white shadow-sm rounded-full text-sm font-semibold text-gray-600 hover:bg-[#e60012] hover:text-white transition"
                                    >
                                        {g.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Catálogo ── */}
            {/* px-5 en mobile (founder 07-26): las cards quedaban pegadas al borde
                de la pantalla — un toque más de aire lateral sin achicar la foto. */}
            <div className="container mx-auto px-5 sm:px-4 mt-5 space-y-8">
                {results ? (
                    // Modo búsqueda: grilla plana con lo que matchea el query
                    <div>
                        <p className="text-sm text-gray-500 mb-4">
                            {results.length > 0
                                ? `${results.length} resultado${results.length === 1 ? "" : "s"} para «${query.trim()}»`
                                : `No encontramos nada con «${query.trim()}» en ${merchant.name}`}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {results.map((product) => (
                                <ProductCard key={product.id} product={product} showAddButton />
                            ))}
                        </div>
                    </div>
                ) : useFlatList ? (
                    // ISSUE-049: < 5 productos → grilla plana sin headers de categoría
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {allProducts.map((product) => (
                            <ProductCard key={product.id} product={product} showAddButton />
                        ))}
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.name} id={`cat-${group.name}`} className="scroll-mt-28">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                {group.name}
                                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {group.products.length}
                                </span>
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                {group.products.map((product) => (
                                    <ProductCard key={product.id} product={product} showAddButton />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Popup de horarios (hoja modal, el catálogo no se mueve) ── */}
            {scheduleOpen && (
                <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Horarios de la semana">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                        onClick={() => setScheduleOpen(false)}
                    />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2.5rem)] max-w-[420px] bg-white rounded-3xl shadow-2xl p-5 animate-in zoom-in-95 fade-in duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#e60012]" />
                                Horarios de {merchant.name}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setScheduleOpen(false)}
                                aria-label="Cerrar"
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {schedule.rows.map((row) => (
                                <div
                                    key={row.label}
                                    className={`flex items-center justify-between py-2.5 text-sm ${
                                        row.isToday ? "font-bold text-gray-900" : "text-gray-600"
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {row.label}
                                        {row.isToday && (
                                            <span className="text-[9px] font-bold text-white bg-[#e60012] rounded-full px-2 py-0.5">
                                                HOY
                                            </span>
                                        )}
                                    </span>
                                    <span className={row.text === "Cerrado" ? "italic text-gray-400" : ""}>
                                        {row.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Barra "Ver mi pedido": acceso al carrito dentro de la tienda ── */}
            {cartCount > 0 && (
                <div className="fixed inset-x-0 bottom-24 lg:bottom-6 z-40 px-4 pointer-events-none">
                    <button
                        type="button"
                        onClick={() => openCart()}
                        className="pointer-events-auto container mx-auto max-w-md w-full flex items-center justify-between gap-3 bg-[#e60012] text-white rounded-2xl px-5 py-3.5 shadow-[0_10px_30px_rgba(230,0,18,0.4)] active:scale-[0.99] transition"
                    >
                        <span className="flex items-center gap-2 font-bold text-sm">
                            <ShoppingBag className="w-4 h-4" />
                            Ver mi pedido
                            <span className="bg-white/25 rounded-full px-2 py-0.5 text-xs font-bold">
                                {cartCount}
                            </span>
                        </span>
                        <span className="font-bold text-sm">
                            ${cartTotal.toLocaleString("es-AR")}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
