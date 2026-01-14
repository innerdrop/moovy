"use client";

// Personalized Welcome Section for logged-in users
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Star, Gift, Clock, Zap, ArrowRight } from "lucide-react";
import { useUserPoints } from "@/hooks/useUserPoints";

export default function PersonalizedWelcome() {
    const { data: session, status } = useSession();
    const { points } = useUserPoints();

    // Don't show for loading or anonymous users
    if (status === "loading" || status === "unauthenticated") {
        return null;
    }

    const firstName = session?.user?.name?.split(" ")[0] || "MOOVER";

    return (
        <section className="bg-gradient-to-r from-[#e60012] to-red-600 text-white">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Greeting */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="font-bold text-lg">
                                {firstName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-white/70">¡Hola de nuevo!</p>
                            <p className="font-semibold">{firstName}</p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <Link
                        href="/puntos"
                        className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-full hover:bg-white/30 transition"
                    >
                        <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                        <span className="text-sm font-bold">
                            {points > 999 ? `${(points / 1000).toFixed(1)}K` : `${points} pts`}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    <Link
                        href="/mis-pedidos"
                        className="flex-shrink-0 flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm hover:bg-white/20 transition"
                    >
                        <Clock className="w-4 h-4" />
                        <span>Mis Pedidos</span>
                    </Link>
                    <Link
                        href="/puntos"
                        className="flex-shrink-0 flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm hover:bg-white/20 transition"
                    >
                        <Gift className="w-4 h-4" />
                        <span>Canjear Puntos</span>
                    </Link>
                    <Link
                        href="/productos"
                        className="flex-shrink-0 flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm hover:bg-white/20 transition"
                    >
                        <Zap className="w-4 h-4" />
                        <span>Explorar</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
