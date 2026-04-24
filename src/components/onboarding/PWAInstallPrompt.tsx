"use client";

// PWA Install Prompt — ayuda a los users a instalar Moovy como app en su celular.
// Rama fix/driver-settings-pwa (2026-04-24): pedido de Mauro — al registrarse
// no había guía de cómo agregar la app al home screen, especialmente crítico
// en iPhone donde sin instalar la PWA no llegan las push notifications.
//
// Comportamiento:
//   - No aparece si la app ya está instalada (display-mode: standalone)
//   - No aparece si el user ya lo cerró (localStorage flag)
//   - No aparece en desktop
//   - Detecta iOS (Safari o Chrome) vs Android y muestra pasos específicos
//   - iOS: paso a paso textual (Apple no permite dispararlo programáticamente)
//   - Android Chrome: botón nativo "Instalar" via beforeinstallprompt event
//
// NOTA: el componente se monta globalmente en layouts de user logueado; usa
// un delay de 3s antes de aparecer para no bombardear el primer click.

import { useEffect, useState } from "react";
import { X, Download, Share2, Plus, Smartphone } from "lucide-react";

const STORAGE_KEY = "moovy_pwa_prompt_seen";
const SHOW_DELAY_MS = 3000;

type Platform = "ios" | "android-chrome" | "desktop" | "other";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
    if (typeof window === "undefined" || typeof navigator === "undefined") return "other";
    const ua = navigator.userAgent;
    // iOS en cualquier navegador (Safari, Chrome iOS, Firefox iOS usan WebKit)
    if (/iPad|iPhone|iPod/.test(ua)) return "ios";
    // Android con Chrome (navigator.userAgent incluye "Chrome" y "Android")
    if (/Android/.test(ua) && /Chrome/.test(ua)) return "android-chrome";
    // Desktop o navegador raro
    return "desktop";
}

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    // Android/Chrome: match media display-mode
    if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
    // iOS: navigator.standalone (legacy, solo iOS Safari)
    if ((navigator as any).standalone === true) return true;
    return false;
}

export default function PWAInstallPrompt() {
    const [visible, setVisible] = useState(false);
    const [platform, setPlatform] = useState<Platform>("other");
    const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        // Skip si ya está instalada o ya lo vio
        if (isStandalone()) return;
        if (typeof window === "undefined") return;
        const seen = window.localStorage.getItem(STORAGE_KEY);
        if (seen === "true") return;

        const p = detectPlatform();
        setPlatform(p);

        // Desktop: no mostrar, no vale la pena
        if (p === "desktop" || p === "other") {
            window.localStorage.setItem(STORAGE_KEY, "true");
            return;
        }

        // Android Chrome: escuchar el beforeinstallprompt para usar el botón nativo
        const onBeforeInstall = (e: Event) => {
            e.preventDefault();
            setInstallEvent(e as BeforeInstallPromptEvent);
        };
        if (p === "android-chrome") {
            window.addEventListener("beforeinstallprompt", onBeforeInstall);
        }

        // Delay para no bombardear al primer click
        const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
        };
    }, []);

    function close(persist = true) {
        setVisible(false);
        if (persist && typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, "true");
        }
    }

    async function handleAndroidInstall() {
        if (!installEvent) {
            close();
            return;
        }
        try {
            await installEvent.prompt();
            const choice = await installEvent.userChoice;
            close(choice.outcome !== "dismissed");
        } catch {
            close();
        }
    }

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-2 duration-300">
                <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-[#e60012] to-[#b8000e] text-white">
                    <button
                        onClick={() => close(true)}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-extrabold">Instalá Moovy como app</h2>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed">
                        {platform === "ios"
                            ? "Agregá Moovy a tu pantalla de inicio en 3 pasos para recibir notificaciones de tus pedidos."
                            : "Instalá Moovy en un toque para recibir notificaciones y entrar más rápido."}
                    </p>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {platform === "ios" ? <IOSSteps /> : <AndroidSteps onInstall={handleAndroidInstall} hasEvent={!!installEvent} />}
                </div>

                <div className="px-6 pb-5 pt-2 border-t border-gray-100">
                    <button
                        onClick={() => close(true)}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium py-2"
                    >
                        Ahora no
                    </button>
                </div>
            </div>
        </div>
    );
}

function IOSSteps() {
    return (
        <ol className="space-y-4">
            <Step
                number={1}
                icon={<Share2 className="w-4 h-4 text-[#e60012]" />}
                title="Tocá el botón Compartir"
                desc="Está en la barra de abajo (Safari) o arriba a la derecha."
            />
            <Step
                number={2}
                icon={<Plus className="w-4 h-4 text-[#e60012]" />}
                title="Elegí &ldquo;Agregar a inicio&rdquo;"
                desc="Scrolleá en el menú de compartir hasta encontrar la opción."
            />
            <Step
                number={3}
                icon={<Smartphone className="w-4 h-4 text-[#e60012]" />}
                title="Tocá &ldquo;Agregar&rdquo;"
                desc="Moovy aparece en tu pantalla de inicio como una app normal."
            />
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
                <strong>Importante:</strong> sin instalarla como app, Safari iOS no recibe
                notificaciones push de Moovy. Si sos repartidor o comerciante, no te vas a
                enterar de los pedidos nuevos hasta que instales.
            </div>
        </ol>
    );
}

function AndroidSteps({ onInstall, hasEvent }: { onInstall: () => void; hasEvent: boolean }) {
    return (
        <>
            {hasEvent ? (
                <button
                    onClick={onInstall}
                    className="w-full bg-[#e60012] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#cc000f] transition"
                >
                    <Download className="w-4 h-4" />
                    Instalar Moovy
                </button>
            ) : (
                <ol className="space-y-4">
                    <Step
                        number={1}
                        icon={<Plus className="w-4 h-4 text-[#e60012]" />}
                        title="Abrí el menú del navegador"
                        desc="Los tres puntitos arriba a la derecha."
                    />
                    <Step
                        number={2}
                        icon={<Download className="w-4 h-4 text-[#e60012]" />}
                        title="Tocá &ldquo;Instalar app&rdquo; o &ldquo;Agregar a inicio&rdquo;"
                        desc="El texto cambia según la versión de Chrome."
                    />
                </ol>
            )}
        </>
    );
}

function Step({
    number,
    icon,
    title,
    desc,
}: {
    number: number;
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700">
                {number}
            </div>
            <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2 mb-0.5">
                    {icon}
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
        </li>
    );
}
