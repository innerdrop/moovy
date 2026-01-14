"use client";

import { useEffect, useState } from "react";
import { Sparkles, Star } from "lucide-react";

interface PointsAnimationProps {
    pointsEarned: number;
    isVisible: boolean;
    onComplete?: () => void;
}

export default function PointsAnimation({ pointsEarned, isVisible, onComplete }: PointsAnimationProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                if (onComplete) onComplete();
            }, 4000); // Duration
            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            {/* Backdrop flash */}
            <div className="absolute inset-0 bg-white/50 animate-pulse-fast"></div>

            <div className="relative animate-bounce-in">
                {/* Main Circle */}
                <div className="w-48 h-48 bg-gradient-to-br from-[#e60012] to-red-600 rounded-full flex flex-col items-center justify-center text-white shadow-[0_0_50px_rgba(230,0,18,0.5)] border-4 border-white/20 relative overflow-hidden">

                    {/* Background rays */}
                    <div className="absolute inset-0 animate-spin-slow opacity-20">
                        <div className="w-full h-full bg-[conic-gradient(transparent_0deg,white_45deg,transparent_90deg)]"></div>
                    </div>

                    <Sparkles className="w-10 h-10 text-yellow-300 animate-pulse mb-1" />

                    <span className="text-xl font-medium opacity-90">¡Ganaste!</span>
                    <span className="text-5xl font-bold tracking-tight text-white drop-shadow-md">
                        +{pointsEarned}
                    </span>
                    <span className="text-sm font-medium mt-1 uppercase tracking-wider opacity-80">Puntos Moovy</span>
                </div>

                {/* Floating particles */}
                <div className="absolute -top-4 -right-4 animate-float-delayed text-yellow-400">
                    <Star className="w-8 h-8 fill-current" />
                </div>
                <div className="absolute -bottom-2 -left-4 animate-float text-yellow-400">
                    <Star className="w-6 h-6 fill-current" />
                </div>
                <div className="absolute top-1/2 -right-12 animate-ping-slow text-[#e60012]">
                    <div className="w-4 h-4 bg-current rounded-full"></div>
                </div>
            </div>

            <style jsx>{`
                @keyframes pulse-fast {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
                @keyframes bounce-in {
                    0% { transform: scale(0); opacity: 0; }
                    60% { transform: scale(1.1); opacity: 1; }
                    80% { transform: scale(0.95); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(10deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                @keyframes float-delayed {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(10px) rotate(-10deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                .animate-pulse-fast { animation: pulse-fast 0.5s ease-out forwards; }
                .animate-bounce-in { animation: bounce-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .animate-spin-slow { animation: spin-slow 10s linear infinite; }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-float-delayed { animation: float-delayed 4s ease-in-out infinite; }
            `}</style>
        </div>
    );
}
