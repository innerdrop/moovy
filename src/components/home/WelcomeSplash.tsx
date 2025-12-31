"use client";

// Welcome Splash - Pantalla de bienvenida que aparece solo la primera vez por sesión
import { useState, useEffect, useLayoutEffect } from "react";
import { Store } from "lucide-react";

const SPLASH_SHOWN_KEY = "polisanjuan_splash_shown";

// Check if splash should show (sync, before render)
const shouldShowSplash = () => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem(SPLASH_SHOWN_KEY);
};

export default function WelcomeSplash() {
    // Start visible if splash hasn't been shown yet (prevents flash)
    const [isVisible, setIsVisible] = useState(() => shouldShowSplash());
    const [isExiting, setIsExiting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Use layoutEffect to set visibility before paint
    useLayoutEffect(() => {
        setIsMounted(true);
        const wasShown = sessionStorage.getItem(SPLASH_SHOWN_KEY);

        if (wasShown) {
            setIsVisible(false);
            return;
        }

        // Mark as shown for this session
        sessionStorage.setItem(SPLASH_SHOWN_KEY, "true");
        setIsVisible(true);

        // Lock body scroll
        document.body.style.overflow = 'hidden';

        // Auto-hide after 2.5 seconds
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
                setIsVisible(false);
                // Restore body scroll
                document.body.style.overflow = 'unset';
            }, 800); // Exit animation duration
        }, 2500);

        return () => {
            clearTimeout(timer);
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 h-[100dvh] w-screen z-[9999] flex items-center justify-center transition-all duration-800 ${isExiting ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
                }`}
            style={{
                background: 'linear-gradient(135deg, #0a1628 0%, #0d2847 50%, #0f3460 100%)'
            }}
        >
            {/* Decorative circles removed to prevent mobile ghosting glitches */}

            {/* Content - Scaled down on small screens to fit */}
            <div className={`text-center relative z-10 transition-all duration-500 transform scale-75 sm:scale-100 ${isExiting ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'
                }`}>
                {/* Logo Icon */}
                <div className="mb-4 sm:mb-6 inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-turquoise to-cyan-400 shadow-2xl shadow-turquoise/30 animate-bounce">
                    <Store className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>

                {/* Logo Text */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-script text-turquoise mb-2 drop-shadow-2xl">
                    Polirrubro
                </h1>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-script text-white mb-4 sm:mb-6">
                    San Juan
                </h2>

                {/* Tagline */}
                <p className="text-turquoise-light text-base sm:text-lg md:text-xl mb-6 sm:mb-8 animate-pulse px-4">
                    Tu polirrubro de confianza en Ushuaia
                </p>

                {/* Loading indicator */}
                <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-turquoise rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-turquoise rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-turquoise rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
}
