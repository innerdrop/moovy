"use client";

import { Sparkles, Star, X } from "lucide-react";
import Link from "next/link";
import { usePointsCelebration } from "@/store/pointsCelebration";

export default function PointsCelebration() {
    const { isVisible, pointsEarned, hideCelebration } = usePointsCelebration();

    if (!isVisible || pointsEarned <= 0) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative animate-bounce-in flex flex-col items-center">
                {/* Close button */}
                <button
                    onClick={hideCelebration}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center z-10 hover:bg-gray-100 transition"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>

                {/* Main Card */}
                <div className="w-72 bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Red top section */}
                    <div className="bg-gradient-to-br from-[#e60012] to-[#cc000f] px-6 pt-8 pb-10 flex flex-col items-center relative overflow-hidden">
                        {/* Subtle background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-4 left-6 rotate-12"><Star className="w-6 h-6 text-white fill-current" /></div>
                            <div className="absolute top-8 right-8 -rotate-12"><Star className="w-4 h-4 text-white fill-current" /></div>
                            <div className="absolute bottom-4 left-10 rotate-45"><Star className="w-5 h-5 text-white fill-current" /></div>
                            <div className="absolute bottom-6 right-6"><Star className="w-3 h-3 text-white fill-current" /></div>
                        </div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3 animate-float">
                                <Sparkles className="w-7 h-7 text-yellow-300" />
                            </div>
                            <p className="text-white/80 text-sm font-medium tracking-wide uppercase">¡Ganaste!</p>
                            <p className="text-5xl font-black text-white mt-1 tracking-tight">
                                +{pointsEarned.toLocaleString("es-AR")}
                            </p>
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mt-1">
                                Puntos MOOVY
                            </p>
                        </div>
                    </div>

                    {/* White bottom section */}
                    <div className="px-6 py-5 flex flex-col items-center gap-3">
                        <p className="text-gray-500 text-sm text-center">
                            Acumulá puntos y canjeálos por descuentos en tus próximas compras
                        </p>
                        <Link
                            href="/puntos"
                            onClick={hideCelebration}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm text-center hover:bg-gray-800 transition-colors"
                        >
                            Ver mis puntos
                        </Link>
                        <button
                            onClick={hideCelebration}
                            className="text-gray-400 text-xs hover:text-gray-600 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes bounce-in {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); opacity: 1; }
                    70% { transform: scale(0.95); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .animate-float { animation: float 2.5s ease-in-out infinite; }
            `}</style>
        </div>
    );
}
