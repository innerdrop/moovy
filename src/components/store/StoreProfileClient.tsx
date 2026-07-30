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
import { ChevronDown, ChevronLeft, ChevronRight, Clock, MapPin, Search, ShoppingBag, Star, X } from "lucide-react";
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
    /** unidades disponibles — la card apaga el producto cuando llega a 0 */
    stock: number;
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
    /** Datos del cierre para la barra roja de la cabecera. null = está abierto. */
    closedInfo: {
        isPaused: boolean;
        nextOpenDay: string | null;
        nextOpenTime: string | null;
    } | null;
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
    closedInfo,
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
    // Barra de "cerrado": arranca colapsada — el titular ya dice todo.
    const [closedOpen, setClosedOpen] = useState(false);

    // "mañana a las 09:00" — el día viene con mayúscula del helper del server.
    const reopenLabel =
        closedInfo?.nextOpenTime && closedInfo?.nextOpenDay
            ? `${closedInfo.nextOpenDay.toLowerCase()} a las ${closedInfo.nextOpenTime}`
            : null;

    // Categorías desplegadas con "Ver todos" (riel → grilla, sin salir de la tienda).
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const toggleGroup = (name: string) =>
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name); else next.add(name);
            return next;
        });

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
            {/* fix/comercio-pausa-stock-y-ajustes (founder 07-27): la portada ocupaba
                demasiado en celular y empujaba el catálogo fuera de la primera
                pantalla. h-44 (176px) → h-36 (144px); en desktop queda igual. */}
            <div className="relative h-36 sm:h-52 overflow-hidden bg-gradient-to-r from-gray-800 to-gray-900">
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
                {/* El notch se compensa a MEDIAS: sumar el inset completo (59px en el
                    iPhone 14 Pro Max) tiraba el buscador al medio de la portada. La
                    barra de estado ya vive sobre la foto, así que alcanza con la
                    mitad para que nada quede tapado. */}
                <div className="absolute inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top)/2)] z-10">
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

            </div>

            {/* fix/comercio-pausa-stock-y-ajustes (founder 07-27): "la línea que se
                ve arriba, eliminala". Era la ONDA AUSTRAL: un SVG con el color de
                la página montado sobre la portada. Su curva sube distinto en cada
                ancho, así que al bajar la portada de 176 a 144px quedaba una franja
                oscura de la foto asomando como una línea recta. Reemplazada por un
                borde limpio: el contenido sube con esquinas redondeadas sobre la
                portada — mismo efecto de "capa que se monta", sin artefactos
                posibles en ningún ancho ni con zoom fraccionario. */}
            <div className="relative z-[1] -mt-7 h-7 bg-gray-50 rounded-t-[28px] sm:-mt-8 sm:h-8 sm:rounded-t-[32px]" />

            {/* ── Identidad: logo + nombre lado a lado ── */}
            {/* Consejo de diseño (07-27): el logo se monta ~36px sobre la portada
                (casi medio logo). Antes quedaba TANGENTE al borde de la foto y se
                leía como choque, no como capa. Los tres valores de este bloque
                —máscara -mt-7/h-7, este -mt-16 y el interlineado del nombre— van
                juntos: cambiar uno solo desalinea el resto. */}
            <div className="container mx-auto px-4 -mt-[60px] relative z-10">
                {/* Logo + datos LADO A LADO (founder 07-27). Geometría resuelta:
                    el texto se alinea al pie del logo, así que crece hacia ARRIBA —
                    con un logo de 80px la tercera línea (la dirección) se metía en
                    la portada. La solución no es bajar el texto (despegaría el logo
                    de la foto) sino AGRANDAR el logo a 104px: su pie baja a 184px,
                    el texto (~60px) arranca en 124 y la foto termina en 116 ⇒ 8px de
                    aire garantizado, con el logo montado 36px sobre la portada. Si
                    algún día se suma una cuarta línea, hay que rehacer esta cuenta. */}
                <div className="flex items-end gap-3.5">
                    <div className="w-[104px] h-[104px] rounded-[26px] bg-white p-1 shadow-[0_10px_24px_rgba(23,24,28,0.20)] ring-1 ring-black/5 flex-shrink-0">
                        {merchant.image ? (
                            <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-gray-50">
                                <Image
                                    src={merchant.image}
                                    alt={`Logo de ${merchant.name}`}
                                    fill
                                    sizes="104px"
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full bg-gray-100 rounded-[22px] flex items-center justify-center text-3xl font-bold text-gray-400">
                                {merchant.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pb-0.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight truncate">
                            {merchant.name}
                        </h1>
                        <p className="text-[13px] leading-[1.3] text-gray-500 truncate mt-0.5">
                            {[merchant.category, merchant.description].filter(Boolean).join(" · ")}
                        </p>
                        {/* La dirección vive acá, con el nombre: es identidad del
                            comercio, no un dato operativo (founder 07-27). */}
                        {merchant.address && (
                            <p className="flex items-center gap-1 text-[12.5px] leading-[1.3] text-gray-500 mt-1 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{merchant.address}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Barra de comercio cerrado (founder 07-27: reemplaza al banner rojo
                    ancho de abajo). Vive en el flujo normal — sin z-index, sin sticky:
                    un sticky acá chocaría con las categorías y con la topbar. Se
                    despliega con grid-template-rows (no keyframes ni scale: en este
                    proyecto las animaciones compositadas dieron texto borroso). */}
                {closedInfo && (
                    <div className="mt-4 rounded-t-3xl bg-[#e60012] text-white shadow-[0_8px_30px_rgba(230,0,18,0.20)] overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setClosedOpen((v) => !v)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                            aria-expanded={closedOpen}
                        >
                            <span className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-[18px] h-[18px]" />
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block font-extrabold text-[15px] leading-tight">
                                    Cerrado por ahora
                                </span>
                                <span className="block text-[12.5px] text-white/85 leading-tight mt-0.5 truncate">
                                    {reopenLabel
                                        ? `Abre de nuevo ${reopenLabel}`
                                        : "Podés ver el catálogo, pero todavía no toma pedidos"}
                                </span>
                            </span>
                            <ChevronDown
                                className={`w-5 h-5 flex-shrink-0 transition-transform ${closedOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        <div
                            className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${
                                closedOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            }`}
                        >
                            <div className="overflow-hidden">
                                <div className="px-4 pb-4 pt-0 text-[13px] text-white/90 leading-relaxed">
                                    <p>
                                        {reopenLabel
                                            ? `${merchant.name} no está tomando pedidos en este momento. Abre de nuevo ${reopenLabel}.`
                                            : `${merchant.name} no está tomando pedidos en este momento. Podés ver el catálogo igual.`}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <Link
                                            href="/tiendas?filter=abiertos"
                                            className="inline-flex items-center gap-1.5 bg-white text-[#e60012] font-bold text-[12.5px] rounded-full px-3.5 py-2"
                                        >
                                            Ver comercios abiertos ahora
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => setScheduleOpen(true)}
                                            className="inline-flex items-center gap-1.5 bg-white/15 text-white font-bold text-[12.5px] rounded-full px-3.5 py-2"
                                        >
                                            Ver horarios
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Datos operativos: DOS FILAS FIJAS (opción C, founder 07-27) ──
                    Se descartó el carrusel de pills: para leer el último dato había
                    que deslizar, y los datos de un comercio no se "exploran", se
                    consultan de un vistazo. Fila 1 = estado + demora. Fila 2 = envío
                    + horarios. Nada se corta, nada se desliza.
                    La pill "Nuevo" también se fue: la palabra ya estaba en el
                    subtítulo ("Kiosco · Nuevo comercio Moovy") — decirlo dos veces
                    en 40px era el ruido que molestaba. */}
                <div
                    className={`bg-white shadow-[0_8px_30px_rgba(23,24,28,0.08)] divide-y divide-gray-50 ${
                        closedInfo ? "rounded-b-3xl" : "mt-4 rounded-3xl"
                    }`}
                >
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                        {isCurrentlyOpen ? (
                            <span className="inline-flex items-center gap-2 text-[14px] font-bold text-green-700 min-w-0">
                                <span className="relative flex w-2 h-2 flex-shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
                                    <span className="relative inline-flex rounded-full w-2 h-2 bg-green-500" />
                                </span>
                                <span className="truncate">
                                    Abierto{schedule.openUntil ? ` hasta las ${schedule.openUntil}` : ""}
                                </span>
                            </span>
                        ) : (
                            // Con la cabecera roja arriba no hace falta repetir "cerrado":
                            // esta fila muestra el rating para no quedar vacía.
                            <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-gray-600 min-w-0">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                                <span className="truncate">
                                    {merchant.rating ? merchant.rating.toFixed(1) : "Comercio nuevo en Moovy"}
                                </span>
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-[14px] text-gray-500 flex-shrink-0">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {merchant.deliveryTimeMin}–{merchant.deliveryTimeMax} min
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="text-[14px] text-gray-500 truncate min-w-0">
                            {freeDeliveryMinimum !== null
                                ? `Envío gratis desde $${freeDeliveryMinimum.toLocaleString("es-AR")}`
                                : isCurrentlyOpen && merchant.rating
                                    ? `${merchant.rating.toFixed(1)} de calificación`
                                    : "Envío a domicilio"}
                        </span>
                        <button
                            type="button"
                            onClick={() => setScheduleOpen(true)}
                            className="flex items-center gap-1 text-[14px] font-bold text-gray-600 hover:text-[#e60012] transition flex-shrink-0"
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
                            <div className="flex overflow-x-auto gap-2 scrollbar-hide">
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
            {/* Consejo de diseño (07-27): TODA la pantalla se alinea a la misma
                guía izquierda (px-4, la del logo). El px-5 de mobile corría el
                catálogo 4px respecto de la cabecera — era la causa principal del
                "se ve desalineado" que reportó el founder. */}
            <div className="container mx-auto px-4 mt-6 space-y-8">
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
                    groups.map((group) => {
                        // Riel horizontal (opción A, decisión founder 07-27): cada
                        // categoría muestra ~3 productos y se desliza al costado.
                        // Así entran 4 categorías en una pantalla y el cliente ve
                        // TODO lo que vende el comercio sin scrollear eterno.
                        // "Ver todos" despliega esa categoría en grilla, acá mismo:
                        // no lo saca de la tienda ni pierde el lugar donde estaba.
                        const expanded = expandedGroups.has(group.name);
                        const RAIL_LIMIT = 8;
                        const railProducts = group.products.slice(0, RAIL_LIMIT);
                        const hasMore = group.products.length > railProducts.length;

                        return (
                            <div key={group.name} id={`cat-${group.name}`} className="scroll-mt-28">
                                <div className="flex items-baseline justify-between gap-3 mb-3">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        {group.name}
                                        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                            {group.products.length}
                                        </span>
                                    </h2>
                                    {group.products.length > 3 && (
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(group.name)}
                                            className="text-[13px] font-bold text-[#e60012] whitespace-nowrap"
                                        >
                                            {expanded ? "Ver menos" : "Ver todos ›"}
                                        </button>
                                    )}
                                </div>

                                {expanded ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                        {group.products.map((product) => (
                                            <ProductCard key={product.id} product={product} showAddButton />
                                        ))}
                                    </div>
                                ) : (
                                    // -mx-5 + px-5: el riel sangra hasta el borde de la
                                    // pantalla (se ve que "hay más" a la derecha) pero el
                                    // primer producto queda alineado con el resto.
                                    <div className="-mx-4 px-4 flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
                                        {railProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                className="w-[42%] min-w-[132px] max-w-[168px] sm:w-48 flex-shrink-0 snap-start"
                                            >
                                                <ProductCard product={product} showAddButton />
                                            </div>
                                        ))}
                                        {hasMore && (
                                            <button
                                                type="button"
                                                onClick={() => toggleGroup(group.name)}
                                                className="w-[30%] min-w-[96px] flex-shrink-0 snap-start rounded-2xl border-[1.5px] border-dashed border-gray-200 bg-white flex flex-col items-center justify-center gap-2 text-[#e60012] font-bold text-[13px] px-2 text-center"
                                            >
                                                <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                                                    <ChevronRight className="w-4 h-4" />
                                                </span>
                                                Ver los {group.products.length}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
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

            {/* ── Barra "Ver mi pedido": acceso al carrito dentro de la tienda ──
                fix/comercio-pausa-stock-y-ajustes (founder 07-27): "la barra del
                carrito queda pegada a la barra de navegación".

                Esa vez se arregló a mano con "+ 72px" y quedó MAL igual: 72 sale de
                sumar los 62px de la caja de la píldora, pero el botón MOOVER
                sobresale por encima de la caja (-top-3), así que el hueco real era
                de un par de píxeles, no de 10. Y el mismo número mal calculado se
                copió al FloatingCartButton.
                feat/barras-flotantes-y-copy (regla #47): el número ya no se calcula
                acá — useNavPeak mide la píldora en el dispositivo y publica el
                resultado en --moovy-bar-bottom. */}
            {cartCount > 0 && (
                <div
                    data-moovy-bar
                    className="fixed inset-x-0 z-40 px-4 pointer-events-none"
                    style={{ bottom: "var(--moovy-bar-bottom)" }}
                >
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
