"use client";

// Welcome Splash - Pantalla de entrada con logo M y efecto zoom
import { useEffect } from "react";
import Image from "next/image";

const SPLASH_SHOWN_KEY = "moovy_splash_v4";

interface WelcomeSplashProps {
    onDone?: () => void;
}

export default function WelcomeSplash({ onDone }: WelcomeSplashProps) {

    useEffect(() => {
        // Mark as shown in localStorage
        try {
            localStorage.setItem(SPLASH_SHOWN_KEY, "true");
        } catch {
            // Ignore storage errors
        }
    }, []);

    // When animation ends, notify parent
    const handleAnimationEnd = () => {
        onDone?.();
    };

    // Manual dismiss on click
    const handleClick = () => {
        onDone?.();
    };

    return (
        <>
            {/* CSS Keyframes inline */}
            <style jsx global>{`
                @keyframes splashFadeZoom {
                    0% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    85% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(1.5);
                    }
                }
                .splash-animate {
                    animation: splashFadeZoom 3.5s ease-out forwards;
                }
            `}</style>

            <div
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#e60012] splash-animate min-h-screen"
                onClick={handleClick}
                onAnimationEnd={handleAnimationEnd}
            >
                <Image
                    src="/moovy-m.png"
                    alt="M"
                    width={80}
                    height={80}
                    priority
                    unoptimized
                />
            </div>
        </>
    );
}
