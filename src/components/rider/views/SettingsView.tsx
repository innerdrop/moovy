"use client";

import { useState, useEffect } from "react";
import {
    ChevronLeft,
    Sun,
    Moon,
    Monitor,
    Vibrate,
    Volume2,
    VolumeX,
    Navigation,
    Map,
    Battery,
    Clock,
    Shield,
} from "lucide-react";
import { playAlertBeep, triggerVibration } from "@/hooks/useRiderPrefs";

interface SettingsViewProps {
    onBack: () => void;
}

type ThemeMode = "auto" | "light" | "dark";
type MapsApp = "google" | "waze";

interface RiderPreferences {
    theme: ThemeMode;
    mapsApp: MapsApp;
    soundAlerts: boolean;
    vibration: boolean;
    batteryThreshold: number;
    autoDisconnectMinutes: number;
}

const STORAGE_KEY = "moovy_rider_prefs";

const defaultPrefs: RiderPreferences = {
    theme: "auto",
    mapsApp: "google",
    soundAlerts: true,
    vibration: true,
    batteryThreshold: 20,
    autoDisconnectMinutes: 0,
};

function loadPrefs(): RiderPreferences {
    if (typeof window === "undefined") return defaultPrefs;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return defaultPrefs;
}

function savePrefs(prefs: RiderPreferences) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch { /* ignore */ }
}

export default function SettingsView({ onBack }: SettingsViewProps) {
    const [prefs, setPrefs] = useState<RiderPreferences>(defaultPrefs);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setPrefs(loadPrefs());
        setLoaded(true);
    }, []);

    const updatePref = <K extends keyof RiderPreferences>(key: K, value: RiderPreferences[K]) => {
        const next = { ...prefs, [key]: value };
        setPrefs(next);
        savePrefs(next);

        // Apply theme immediately
        if (key === "theme") {
            applyTheme(value as ThemeMode);
        }

        // Preview al prender: el driver escucha/siente al instante que el toggle funciona.
        // En iOS vibration falla silenciosamente (Apple nunca la implementó).
        // El beep funciona si ya hubo gesto de usuario (este toggle lo es).
        if (key === "soundAlerts" && value === true) {
            playAlertBeep();
        }
        if (key === "vibration" && value === true) {
            triggerVibration([100, 50, 100]);
        }
    };

    const applyTheme = (mode: ThemeMode) => {
        const root = document.documentElement;
        if (mode === "auto") {
            root.removeAttribute("data-theme");
            root.style.colorScheme = "";
        } else {
            root.setAttribute("data-theme", mode);
            root.style.colorScheme = mode;
        }
    };

    if (!loaded) return null;

    return (
        <div className="fixed inset-0 z-[80] bg-[var(--rider-bg)] overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[var(--rider-bg)] backdrop-blur-xl border-b border-gray-100 dark:border-white/10" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                <div className="flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/10 flex items-center justify-center active:scale-95 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 text-[var(--rider-text)]" />
                    </button>
                    <h1 className="text-lg font-extrabold text-[var(--rider-text)] uppercase tracking-wide">Configuración</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6 space-y-6" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>

                {/* ── APARIENCIA ── */}
                <section>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-3 ml-1">Apariencia</h3>
                    <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                        <div className="p-4">
                            <p className="text-sm font-semibold text-[var(--rider-text)] mb-3">Tema</p>
                            <div className="grid grid-cols-3 gap-2">
                                {([
                                    { value: "auto" as ThemeMode, label: "Auto", icon: Monitor },
                                    { value: "light" as ThemeMode, label: "Claro", icon: Sun },
                                    { value: "dark" as ThemeMode, label: "Oscuro", icon: Moon },
                                ]).map(({ value, label, icon: Icon }) => (
                                    <button
                                        key={value}
                                        onClick={() => updatePref("theme", value)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                                            prefs.theme === value
                                                ? 'border-[var(--rider-accent)] bg-[var(--rider-accent)]/5'
                                                : 'border-gray-100 dark:border-white/10 hover:border-gray-200'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 ${prefs.theme === value ? 'text-[var(--rider-accent)]' : 'text-gray-400'}`} />
                                        <span className={`text-xs font-bold ${prefs.theme === value ? 'text-[var(--rider-accent)]' : 'text-gray-500'}`}>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── NOTIFICACIONES ── */}
                <section>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-3 ml-1">Notificaciones</h3>
                    <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-white/10 divide-y divide-gray-50 dark:divide-white/5">
                        <ToggleRow
                            icon={prefs.soundAlerts ? Volume2 : VolumeX}
                            label="Sonido de alertas"
                            description="Sonido al recibir nuevos pedidos"
                            value={prefs.soundAlerts}
                            onChange={(v) => updatePref("soundAlerts", v)}
                        />
                        <ToggleRow
                            icon={Vibrate}
                            label="Vibración"
                            description="Feedback háptico en acciones"
                            value={prefs.vibration}
                            onChange={(v) => updatePref("vibration", v)}
                        />
                    </div>
                </section>

                {/* ── NAVEGACIÓN ── */}
                <section>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-3 ml-1">Navegación</h3>
                    <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                        <div className="p-4">
                            <p className="text-sm font-semibold text-[var(--rider-text)] mb-1">App de mapas</p>
                            <p className="text-xs text-gray-400 mb-3">Se abrirá al tocar &quot;MAPS&quot; durante un pedido</p>
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { value: "google" as MapsApp, label: "Google Maps", icon: Map },
                                    { value: "waze" as MapsApp, label: "Waze", icon: Navigation },
                                ]).map(({ value, label, icon: Icon }) => (
                                    <button
                                        key={value}
                                        onClick={() => updatePref("mapsApp", value)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                                            prefs.mapsApp === value
                                                ? 'border-[var(--rider-accent)] bg-[var(--rider-accent)]/5'
                                                : 'border-gray-100 dark:border-white/10 hover:border-gray-200'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${prefs.mapsApp === value ? 'text-[var(--rider-accent)]' : 'text-gray-400'}`} />
                                        <span className={`text-xs font-bold ${prefs.mapsApp === value ? 'text-[var(--rider-accent)]' : 'text-gray-500'}`}>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── TURNO ── */}
                <section>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-3 ml-1">Turno</h3>
                    <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-white/10 divide-y divide-gray-50 dark:divide-white/5">
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Battery className="w-4 h-4 text-amber-500" />
                                <div>
                                    <p className="text-sm font-semibold text-[var(--rider-text)]">Alerta de batería</p>
                                    <p className="text-xs text-gray-400">Aviso cuando la batería baje de</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-3">
                                {[10, 15, 20, 25].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => updatePref("batteryThreshold", v)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                            prefs.batteryThreshold === v
                                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                                                : 'bg-gray-50 dark:bg-[#22252f] text-gray-500'
                                        }`}
                                    >
                                        {v}%
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <div>
                                    <p className="text-sm font-semibold text-[var(--rider-text)]">Auto-desconectar</p>
                                    <p className="text-xs text-gray-400">Apagar conexión tras inactividad</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                {[{ v: 0, l: "Nunca" }, { v: 30, l: "30 min" }, { v: 60, l: "1h" }, { v: 120, l: "2h" }].map(({ v, l }) => (
                                    <button
                                        key={v}
                                        onClick={() => updatePref("autoDisconnectMinutes", v)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                            prefs.autoDisconnectMinutes === v
                                                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                                                : 'bg-gray-50 dark:bg-[#22252f] text-gray-500'
                                        }`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── INFO ── */}
                <div className="text-center pt-4 pb-8">
                    <div className="pb-4" />
                </div>
            </div>
        </div>
    );
}

// ── Toggle Row ──
function ToggleRow({
    icon: Icon,
    label,
    description,
    value,
    onChange
}: {
    icon: React.ElementType;
    label: string;
    description: string;
    value: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${value ? 'text-[var(--rider-accent)]' : 'text-gray-400'}`} />
                <div>
                    <p className="text-sm font-semibold text-[var(--rider-text)]">{label}</p>
                    <p className="text-xs text-gray-400">{description}</p>
                </div>
            </div>
            <button
                onClick={() => onChange(!value)}
                className={`w-12 h-7 rounded-full transition-all duration-300 relative ${
                    value ? 'bg-[var(--rider-accent)]' : 'bg-gray-200 dark:bg-gray-700'
                }`}
            >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                    value ? 'left-[22px]' : 'left-0.5'
                }`} />
            </button>
        </div>
    );
}
