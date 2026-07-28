import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StoreProfileClient, { type StoreProfileProduct, type ScheduleRow } from "@/components/store/StoreProfileClient";
import EmptyState from "@/components/ui/EmptyState";
import ReviewsSection from "@/components/store/ReviewsSection";
import {
    checkMerchantSchedule,
    parseSchedule,
    DEFAULT_MERCHANT_SCHEDULE,
    type WeekSchedule,
} from "@/lib/merchant-schedule";
import { getPointsConfig, calculatePointsEarned } from "@/lib/points";
import { Star, ShoppingBag } from "lucide-react";

// feat/rediseno-perfil-comercio (2026-07-25): cabecera y catálogo viven en
// StoreProfileClient (portada full-bleed con curva, buscador scoped, chips).
// Esta página (RSC) solo busca datos, calcula el estado real del horario en
// timezone Ushuaia y arma props SLIM (nunca pasar el Product entero al client:
// tiene costPrice y otra metadata interna que no debe viajar al navegador).
//
// Decisión canónica: el perfil público NO muestra badge "Verificado" ni
// canales externos de contacto (WhatsApp/Instagram/Facebook). Las redes del
// comercio son canal de ENTRADA vía co-marketing, nunca de salida.

// ISSUE-049: umbral para mostrar lista plana sin filtro de categorías.
// Si el comercio tiene < 5 productos, el filtro por categorías genera
// ruido visual ("Otros (2)") en vez de ayudar a explorar.
const FLAT_LIST_THRESHOLD = 5;

const DAY_LABELS: Record<string, string> = {
    "1": "Lunes", "2": "Martes", "3": "Miércoles", "4": "Jueves",
    "5": "Viernes", "6": "Sábado", "7": "Domingo",
};

/** Día actual (key 1-7, lunes-domingo) y minutos desde medianoche en Ushuaia. */
function nowInUshuaia(): { todayKey: string; nowMinutes: number } {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Argentina/Ushuaia",
        weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(new Date());
    const map: Record<string, string> = { Mon: "1", Tue: "2", Wed: "3", Thu: "4", Fri: "5", Sat: "6", Sun: "7" };
    let weekday = "Mon", hours = 0, minutes = 0;
    for (const part of parts) {
        if (part.type === "weekday") weekday = part.value;
        if (part.type === "hour") hours = parseInt(part.value, 10);
        if (part.type === "minute") minutes = parseInt(part.value, 10);
    }
    return { todayKey: map[weekday] ?? "1", nowMinutes: hours * 60 + minutes };
}

const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
    return (h || 0) * 60 + (m || 0);
};

/** Filas del popup de horarios + hora de cierre de HOY si está abierto ahora. */
function buildScheduleView(scheduleJson: string | null, isCurrentlyOpen: boolean): {
    rows: ScheduleRow[];
    openUntil: string | null;
} {
    const schedule: WeekSchedule = parseSchedule(scheduleJson) ?? DEFAULT_MERCHANT_SCHEDULE;
    const { todayKey, nowMinutes } = nowInUshuaia();

    const rows: ScheduleRow[] = ["1", "2", "3", "4", "5", "6", "7"].map((key) => {
        const ranges = schedule[key] ?? null;
        return {
            label: DAY_LABELS[key],
            isToday: key === todayKey,
            text: ranges && ranges.length > 0
                ? ranges.map((r) => `${r.open} – ${r.close}`).join(" / ")
                : "Cerrado",
        };
    });

    // "Abierto hasta las HH:MM": el cierre del rango de HOY que contiene el
    // momento actual (contempla rangos que cruzan medianoche).
    let openUntil: string | null = null;
    if (isCurrentlyOpen) {
        for (const r of schedule[todayKey] ?? []) {
            const open = toMinutes(r.open);
            const close = toMinutes(r.close);
            const inRange = close >= open
                ? nowMinutes >= open && nowMinutes < close
                : nowMinutes >= open || nowMinutes < close;
            if (inRange) { openUntil = r.close; break; }
        }
    }
    return { rows, openUntil };
}

async function getMerchant(slug: string) {
    const merchant = await prisma.merchant.findUnique({
        where: { slug },
        include: {
            products: {
                where: { isActive: true },
                include: {
                    categories: { include: { category: true } },
                    images: true,
                },
            },
        },
    });
    return merchant;
}

export default async function MerchantPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const merchant = await getMerchant(slug);

    if (!merchant) {
        notFound();
    }

    // fix/envio-gratis-badge: el badge de envío gratis sale de la ÚNICA promo real
    // (StoreSettings.freeDeliveryMinimum, global, controlada por Moovy desde la
    // Biblia). El viejo `merchant.deliveryFee === 0` era un campo legacy que el
    // motor por distancia ignora — mostraba "Envío Gratis" y el checkout cobraba.
    const settings = await prisma.storeSettings.findFirst({
        select: { freeDeliveryMinimum: true },
    });
    const freeDeliveryMinimum =
        settings?.freeDeliveryMinimum && settings.freeDeliveryMinimum > 0
            ? settings.freeDeliveryMinimum
            : null;

    // Calcular estado real (pausa manual + horario) en timezone de Ushuaia.
    // merchant.isOpen es SOLO la pausa manual; el estado que el buyer tiene
    // que ver combina eso con el horario configurado. El guard server-side
    // en /api/orders usa la misma función (defense in depth).
    const scheduleResult = checkMerchantSchedule({
        isOpen: merchant.isOpen,
        scheduleJson: merchant.scheduleJson,
    });
    const isCurrentlyOpen = scheduleResult.isCurrentlyOpen;
    const scheduleView = buildScheduleView(merchant.scheduleJson, isCurrentlyOpen);

    // Puntos MOOVER por producto — SIEMPRE el cálculo canónico del server
    // (calculatePointsEarned + PointsConfig real, boost de lanzamiento
    // incluido). Nunca estimar en el cliente: el checkout ya tuvo ese bug.
    const pointsConfig = await getPointsConfig();

    // Props SLIM para el ProductCard: solo lo que la card necesita. El estado
    // combinado (pausa + horario) viaja en merchant.isCurrentlyOpen.
    const normalizedProducts: StoreProfileProduct[] = merchant.products.map((product) => {
        const points = calculatePointsEarned(product.price, pointsConfig);
        return {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            description: product.description,
            image: product.images[0]?.url || null,
            merchantId: merchant.id,
            merchant: { isOpen: isCurrentlyOpen, isCurrentlyOpen },
            points: points > 0 ? points : null,
            // fix/comercio-pausa-stock-y-ajustes: el catálogo no mandaba el
            // stock, así que un producto agotado se ofrecía como disponible y
            // el cliente se enteraba recién en el checkout (el guard server-side
            // de /api/orders sí lo frena — era fricción, no sobreventa).
            stock: product.stock,
        };
    });

    const totalProducts = normalizedProducts.length;

    // ISSUE-049: si hay < 5 productos, lista plana sin agrupar por categoría.
    const useFlatList = totalProducts > 0 && totalProducts < FLAT_LIST_THRESHOLD;

    // Agrupar por categoría preservando el orden de aparición.
    let groups: { name: string; products: StoreProfileProduct[] }[];
    // Agotados AL FINAL de su grupo (decisión founder 07-27): la primera
    // pantalla tiene que mostrar lo que SÍ se puede comprar. `sort` de JS es
    // estable, así que entre disponibles se respeta el orden original del
    // catálogo — solo se hunden los que están en cero.
    const conDisponiblesPrimero = (lista: StoreProfileProduct[]) =>
        [...lista].sort((a, b) => Number(a.stock <= 0) - Number(b.stock <= 0));

    if (useFlatList) {
        groups = [{ name: "Todo", products: conDisponiblesPrimero(normalizedProducts) }];
    } else {
        const byCategory = new Map<string, StoreProfileProduct[]>();
        merchant.products.forEach((product, i) => {
            const catName = product.categories[0]?.category.name || "Otros";
            if (!byCategory.has(catName)) byCategory.set(catName, []);
            byCategory.get(catName)!.push(normalizedProducts[i]);
        });
        groups = Array.from(byCategory, ([name, products]) => ({
            name,
            products: conDisponiblesPrimero(products),
        }));
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <StoreProfileClient
                merchant={{
                    id: merchant.id,
                    name: merchant.name,
                    description: merchant.description,
                    category: merchant.category,
                    image: merchant.image,
                    banner: merchant.banner,
                    rating: merchant.rating,
                    deliveryTimeMin: merchant.deliveryTimeMin,
                    deliveryTimeMax: merchant.deliveryTimeMax,
                    address: merchant.address,
                }}
                isCurrentlyOpen={isCurrentlyOpen}
                closedInfo={
                    isCurrentlyOpen
                        ? null
                        : {
                              isPaused: scheduleResult.isPaused,
                              nextOpenDay: scheduleResult.nextOpenDay,
                              nextOpenTime: scheduleResult.nextOpenTime,
                          }
                }
                freeDeliveryMinimum={freeDeliveryMinimum}
                groups={groups}
                useFlatList={useFlatList}
                schedule={scheduleView}
            />

            <div className="container mx-auto px-4">
                {totalProducts === 0 && (
                    <div className="mt-8">
                        <EmptyState
                            icon={ShoppingBag}
                            tone="neutral"
                            size="md"
                            title="Todavía no cargaron productos"
                            description="Este comercio está arrancando. Volvé a visitarlo en unos días para ver su catálogo."
                            primaryCta={{ label: "Ver otros comercios", href: "/tiendas" }}
                        />
                    </div>
                )}

                {/* feat/resenas-publicas-tienda (2026-05-10): sección publica de
                    reseñas. Solo se muestran las que pasaron moderacion
                    (AUTO_APPROVED + APPROVED). El rating numerico siempre
                    cuenta en el avg/distribution, el texto del comentario es
                    lo que se modera. */}
                {/* feat/rediseno-perfil-comercio: las reseñas viven en una CARD
                    (mismo lenguaje visual que la tarjeta de datos y los productos)
                    — antes el estado vacío flotaba en blanco sobre blanco. */}
                <section className="mt-8 pb-8">
                    <div className="bg-white rounded-2xl border border-gray-50 shadow-[0_3px_16px_rgba(23,24,28,0.07)] p-5">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            Reseñas
                        </h2>
                        <ReviewsSection
                            entityType="merchant"
                            entityId={merchant.id}
                            entityLabel={merchant.name}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}
