// ISSUE-012 — Accesos directos a Favoritos y Puntos MOOVER desde la home.
//
// Server Component: lee la sesión con auth(). Si hay usuario logueado, hace
// UNA sola query a User con select mínimo (pointsBalance + _count.favorites)
// para evitar N+1 y mantener el TTFB bajo en conexiones 3G de Ushuaia.
//
// Si el usuario NO está logueado, renderiza CTAs genéricos sin queries — la
// home sigue funcionando server-side y se hidrata rápido.
//
// Se inserta entre HomeFeed y CategoryGrid (arriba del home) para maximizar
// descubribilidad: Favoritos no tenía acceso directo desde ningún lado (estaba
// enterrado en /mi-perfil/favoritos), y Puntos gana un segundo punto de
// entrada con contexto de balance visible.
import Link from "next/link";
import { Heart, Star, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface UserSnapshot {
    pointsBalance: number;
    favoritesCount: number;
}

async function getUserSnapshot(userId: string): Promise<UserSnapshot | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                pointsBalance: true,
                _count: { select: { favorites: true } },
            },
        });
        if (!user) return null;
        return {
            pointsBalance: user.pointsBalance ?? 0,
            favoritesCount: user._count?.favorites ?? 0,
        };
    } catch {
        // No bloqueamos el home si falla la query; devolvemos null y
        // el componente cae al estado "deslogueado" (CTAs genéricos).
        return null;
    }
}

function formatPoints(n: number): string {
    return n.toLocaleString("es-AR");
}

export default async function QuickAccessRow() {
    const session = await auth();
    const userId = session?.user?.id;
    const snapshot = userId ? await getUserSnapshot(userId) : null;
    const isLogged = !!snapshot;

    // Textos dinámicos según estado
    const favoritesTitle = isLogged ? "Tus favoritos" : "Guardá tus favoritos";
    const favoritesSubtitle = isLogged
        ? snapshot!.favoritesCount === 0
            ? "Aún no guardaste ninguno. Tocá el ❤ en tus comercios."
            : snapshot!.favoritesCount === 1
                ? "1 guardado · Entrá rápido a tu comercio"
                : `${snapshot!.favoritesCount} guardados · Entrá rápido a ellos`
        : "Iniciá sesión y tenelos siempre a mano";
    const favoritesHref = isLogged
        ? "/mi-perfil/favoritos"
        : "/login?redirect=/mi-perfil/favoritos";

    const pointsTitle = isLogged ? "Puntos MOOVER" : "Puntos MOOVER";
    const pointsSubtitle = isLogged
        ? snapshot!.pointsBalance === 0
            ? "Sumá con cada pedido · 10 pts por cada $1.000"
            : `${formatPoints(snapshot!.pointsBalance)} pts · Canjealos en tu próxima compra`
        : "Sumá con cada pedido · 10 pts por cada $1.000";
    const pointsHref = isLogged ? "/puntos" : "/login?redirect=/puntos";

    return (
        <section className="py-4 lg:py-5 bg-white">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    {/* Card Favoritos */}
                    <Link
                        href={favoritesHref}
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-rose-50 to-red-50 p-4 lg:p-5 transition-all hover:border-rose-200 hover:shadow-md active:scale-[0.98]"
                        aria-label={`${favoritesTitle} — ${favoritesSubtitle}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-[#e60012] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                    <h3 className="text-sm lg:text-base font-black text-gray-900 truncate">
                                        {favoritesTitle}
                                    </h3>
                                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-[#e60012] group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <p className="text-xs lg:text-sm text-gray-600 mt-0.5 line-clamp-2 leading-snug">
                                    {favoritesSubtitle}
                                </p>
                            </div>
                        </div>
                    </Link>

                    {/* Card Puntos MOOVER */}
                    <Link
                        href={pointsHref}
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 lg:p-5 transition-all hover:border-amber-200 hover:shadow-md active:scale-[0.98]"
                        aria-label={`${pointsTitle} — ${pointsSubtitle}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Star className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                    <h3 className="text-sm lg:text-base font-black text-gray-900 truncate">
                                        {pointsTitle}
                                    </h3>
                                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <p className="text-xs lg:text-sm text-gray-600 mt-0.5 line-clamp-2 leading-snug">
                                    {pointsSubtitle}
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    );
}
