"use client";

// Ley 25.326 + AAIP: banner de consentimiento de cookies.
// Se muestra en el primer ingreso hasta que el usuario elija una opción.
// Guarda preferencia en localStorage + DB (si está logueado).

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { X, Cookie, Settings2 } from "lucide-react";

const STORAGE_KEY = "moovy_cookies_consent_v1";

type CookieCategories = {
    essential: true; // siempre true — no se puede rechazar
    analytics: boolean;
    functional: boolean;
    marketing: boolean;
};

type StoredConsent = {
    preferences: CookieCategories;
    version: string;
    acceptedAt: string;
};

const DEFAULT_ALL: CookieCategories = {
    essential: true,
    analytics: true,
    functional: true,
    marketing: true,
};

const DEFAULT_ESSENTIAL: CookieCategories = {
    essential: true,
    analytics: false,
    functional: false,
    marketing: false,
};

export default function CookieBanner() {
    const [visible, setVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState<CookieCategories>(DEFAULT_ALL);
    const [saving, setSaving] = useState(false);

    // Montaje: decidir si mostrar según localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                setVisible(true);
                return;
            }
            const stored: StoredConsent = JSON.parse(raw);
            if (!stored?.preferences) {
                setVisible(true);
            }
        } catch {
            setVisible(true);
        }
    }, []);

    const persistConsent = useCallback(async (prefs: CookieCategories) => {
        setSaving(true);
        const acceptedAt = new Date().toISOString();
        try {
            // Guardar en cliente siempre (sesión o no)
            const payload: StoredConsent = {
                preferences: prefs,
                version: "1.1",
                acceptedAt,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

            // Enviar al backend; si no hay sesión, devuelve 200 igual
            await fetch("/api/cookies/consent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(prefs),
            });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn("No se pudo sincronizar preferencia de cookies:", err);
        } finally {
            setSaving(false);
            setVisible(false);
        }
    }, []);

    const handleAcceptAll = () => persistConsent(DEFAULT_ALL);
    const handleRejectNonEssential = () => persistConsent(DEFAULT_ESSENTIAL);
    const handleSaveCustom = () => persistConsent(preferences);

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Consentimiento de cookies"
            className="fixed inset-x-0 bottom-0 z-[70] flex justify-center px-3 pb-3 pointer-events-none"
        >
            <div className="pointer-events-auto w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {!showSettings ? (
                    <div className="p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#e60012]/10 flex items-center justify-center flex-shrink-0">
                                <Cookie className="w-5 h-5 text-[#e60012]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                                    Usamos cookies para mejorar tu experiencia
                                </h2>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Las cookies esenciales son necesarias para que MOOVY funcione (iniciar sesión,
                                    carrito, seguridad). Las otras nos ayudan a entender cómo usás la plataforma y
                                    a personalizar tu experiencia. Podés gestionarlas cuando quieras.{" "}
                                    <Link
                                        href="/cookies"
                                        className="text-[#e60012] hover:underline font-medium"
                                    >
                                        Más info
                                    </Link>
                                    .
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowSettings(true)}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
                            >
                                <Settings2 className="w-4 h-4" />
                                Configurar
                            </button>
                            <button
                                type="button"
                                onClick={handleRejectNonEssential}
                                disabled={saving}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
                            >
                                Rechazar no esenciales
                            </button>
                            <button
                                type="button"
                                onClick={handleAcceptAll}
                                disabled={saving}
                                className="px-4 py-2.5 text-sm font-semibold text-white bg-[#e60012] rounded-xl hover:bg-[#c4000f] disabled:opacity-50 transition"
                            >
                                {saving ? "Guardando..." : "Aceptar todas"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base sm:text-lg font-bold text-gray-900">
                                Configurar cookies
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowSettings(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition"
                                aria-label="Volver"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <CategoryRow
                                title="Esenciales"
                                description="Necesarias para funciones básicas: sesión, carrito, CSRF."
                                checked
                                disabled
                                onChange={() => { }}
                            />
                            <CategoryRow
                                title="Funcionales"
                                description="Recuerdan preferencias como dirección de entrega o idioma."
                                checked={preferences.functional}
                                onChange={(v) =>
                                    setPreferences((p) => ({ ...p, functional: v }))
                                }
                            />
                            <CategoryRow
                                title="Analíticas"
                                description="Nos ayudan a entender cómo usás la plataforma (datos anónimos)."
                                checked={preferences.analytics}
                                onChange={(v) =>
                                    setPreferences((p) => ({ ...p, analytics: v }))
                                }
                            />
                            <CategoryRow
                                title="Marketing"
                                description="Ofertas personalizadas. Podés revocarlas cuando quieras."
                                checked={preferences.marketing}
                                onChange={(v) =>
                                    setPreferences((p) => ({ ...p, marketing: v }))
                                }
                            />
                        </div>

                        <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                            <button
                                type="button"
                                onClick={handleRejectNonEssential}
                                disabled={saving}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
                            >
                                Solo esenciales
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveCustom}
                                disabled={saving}
                                className="px-4 py-2.5 text-sm font-semibold text-white bg-[#e60012] rounded-xl hover:bg-[#c4000f] disabled:opacity-50 transition"
                            >
                                {saving ? "Guardando..." : "Guardar selección"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function CategoryRow({
    title,
    description,
    checked,
    disabled,
    onChange,
}: {
    title: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50">
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{title}</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only peer"
                />
                <div
                    className={`w-10 h-6 rounded-full peer transition ${disabled
                        ? "bg-[#e60012]/60 cursor-not-allowed"
                        : "bg-gray-300 peer-checked:bg-[#e60012]"
                        } after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition peer-checked:after:translate-x-4`}
                ></div>
            </label>
        </div>
    );
}
