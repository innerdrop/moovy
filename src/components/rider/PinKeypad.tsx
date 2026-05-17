"use client";

// ISSUE-001: PIN doble de entrega
// Modal con keypad numérico de 4 dígitos para que el driver ingrese el PIN
// entregado por el comercio (pickup) o por el comprador (delivery).
// Longitud cambiada a 4 en rama fix/state-machine-paralela-merchant-driver
// (estándar industria + UX a -5°C con guantes).
// Diseñado para uso en calle: botones grandes, feedback háptico, tolerante a
// errores (backspace, paste desde portapapeles, instrucciones claras).
import { useEffect, useState, useCallback } from "react";
import { KeyRound, X, Delete, Loader2, AlertCircle, CheckCircle, MapPin, HelpCircle, Send, Phone, ArrowLeft } from "lucide-react";

// feat/driver-soporte-gps-bloqueado (2026-05-13): WhatsApp de soporte de Moovy
// (mismo que figura en /terminos-repartidor). Hardcoded por simplicidad — si
// cambia, actualizar aca + en T&C. Idealmente en el futuro se mueve a
// StoreSettings para que OPS lo edite sin tocar codigo.
const SUPPORT_WHATSAPP_NUMBER = "5492901553173";
// Limite del comentario en el reporte. Coincide con el COMMENT_MAX del endpoint.
const REPORT_COMMENT_MAX = 500;

export type PinVerifyResult = {
    success: boolean;
    error?: string;
    errorCode?: string;
    remainingAttempts?: number;
    distanceMeters?: number;
    alreadyVerified?: boolean;
};

interface PinKeypadProps {
    isOpen: boolean;
    /** "pickup" = PIN del comercio; "delivery" = PIN del comprador */
    pinType: "pickup" | "delivery";
    /** Nombre del comercio o comprador (para mostrar contexto) */
    counterpartName?: string | null;
    onClose: () => void;
    /**
     * Verifica el PIN contra el backend. Debe retornar success:true para
     * cerrar el modal automáticamente y avanzar el flujo.
     */
    onVerify: (pin: string) => Promise<PinVerifyResult>;
    /** Callback después de verificación exitosa (ej: avanzar a PICKED_UP/DELIVERED) */
    onVerified?: () => void | Promise<void>;
    /**
     * feat/driver-soporte-gps-bloqueado (2026-05-13): orderId del pedido en
     * curso. Si se pasa, cuando el sistema bloquea por OUT_OF_GEOFENCE se
     * muestra el sub-modal de "Reportar problema de ubicación". Si no se
     * pasa, los botones de soporte no aparecen (modo legacy compatible).
     */
    orderId?: string | null;
}

const PIN_LENGTH = 4;

const haptic = {
    light: () => typeof navigator !== "undefined" && navigator.vibrate?.(10),
    medium: () => typeof navigator !== "undefined" && navigator.vibrate?.(50),
    success: () => typeof navigator !== "undefined" && navigator.vibrate?.([50, 50, 100]),
    error: () => typeof navigator !== "undefined" && navigator.vibrate?.([100, 50, 100, 50, 100]),
};

export default function PinKeypad({
    isOpen,
    pinType,
    counterpartName,
    onClose,
    onVerify,
    onVerified,
    orderId,
}: PinKeypadProps) {
    const [pin, setPin] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
    const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
    const [success, setSuccess] = useState(false);

    // feat/driver-soporte-gps-bloqueado (2026-05-13): state del sub-modal de
    // reporte de GPS. Se abre cuando el driver pincha "Tengo problemas con la
    // ubicación" desde el banner de error OUT_OF_GEOFENCE.
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportComment, setReportComment] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setPin("");
            setSubmitting(false);
            setError(null);
            setErrorCode(null);
            setRemainingAttempts(null);
            setDistanceMeters(null);
            setSuccess(false);
            setShowReportModal(false);
            setReportComment("");
            setReportSubmitting(false);
            setReportSubmitted(false);
            setReportError(null);
        }
    }, [isOpen]);

    const title = pinType === "pickup" ? "PIN de retiro" : "PIN de entrega";
    const subtitle =
        pinType === "pickup"
            ? `Pedile al comercio${counterpartName ? ` (${counterpartName})` : ""} el código de 4 dígitos`
            : `Pedile al comprador${counterpartName ? ` (${counterpartName})` : ""} el código de 4 dígitos`;

    const submit = useCallback(
        async (fullPin: string) => {
            if (submitting || fullPin.length !== PIN_LENGTH) return;
            setSubmitting(true);
            setError(null);
            setErrorCode(null);
            setDistanceMeters(null);
            try {
                const result = await onVerify(fullPin);
                if (result.success) {
                    haptic.success();
                    setSuccess(true);
                    // Breve delay para que el usuario vea el feedback de éxito
                    setTimeout(async () => {
                        await onVerified?.();
                        onClose();
                    }, 600);
                    return;
                }
                haptic.error();
                setError(result.error || "PIN incorrecto");
                setErrorCode(result.errorCode || null);
                if (typeof result.remainingAttempts === "number") {
                    setRemainingAttempts(result.remainingAttempts);
                }
                if (typeof result.distanceMeters === "number") {
                    setDistanceMeters(result.distanceMeters);
                }
                // Limpiar el PIN después de 400ms para que el usuario pueda intentar de nuevo
                setTimeout(() => setPin(""), 400);
            } catch (e) {
                haptic.error();
                setError("Error de conexión. Intentá de nuevo.");
                setTimeout(() => setPin(""), 400);
            } finally {
                setSubmitting(false);
            }
        },
        [onVerify, onVerified, onClose, submitting]
    );

    const pushDigit = useCallback(
        (digit: string) => {
            if (submitting || success || pin.length >= PIN_LENGTH) return;
            haptic.light();
            const next = pin + digit;
            setPin(next);
            setError(null);
            setErrorCode(null);
            // Auto-submit cuando se alcanzan los 4 dígitos
            if (next.length === PIN_LENGTH) {
                submit(next);
            }
        },
        [pin, submitting, success, submit]
    );

    const backspace = useCallback(() => {
        if (submitting || success) return;
        haptic.light();
        setPin((p) => p.slice(0, -1));
        setError(null);
        setErrorCode(null);
    }, [submitting, success]);

    // feat/driver-soporte-gps-bloqueado (2026-05-13): envia el reporte de
    // problema de GPS al endpoint nuevo /api/driver/report-pin-issue.
    // Intenta capturar la ubicacion actual del driver con getCurrentPosition
    // (no bloquea si el permiso esta denegado, manda null). El admin
    // recibira el email con todo el contexto + telefono del driver.
    const submitGpsIssueReport = useCallback(async () => {
        if (!orderId || reportSubmitting) return;
        setReportSubmitting(true);
        setReportError(null);

        // Intentar capturar la ubicacion actual. Si falla o el permiso esta
        // denegado, mandamos null para que el admin igual reciba el reporte.
        const tryGetLocation = (): Promise<{ lat: number; lng: number } | null> => {
            return new Promise((resolve) => {
                if (typeof navigator === "undefined" || !navigator.geolocation) {
                    resolve(null);
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    () => resolve(null),
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
                );
            });
        };

        try {
            const location = await tryGetLocation();
            const res = await fetch("/api/driver/report-pin-issue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    pinType,
                    distanceMeters: distanceMeters ?? null,
                    currentLat: location?.lat ?? null,
                    currentLng: location?.lng ?? null,
                    comment: reportComment.trim() || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setReportError(data?.error || "No pudimos enviar el reporte. Probá con WhatsApp.");
                setReportSubmitting(false);
                return;
            }
            setReportSubmitted(true);
            setReportSubmitting(false);
        } catch {
            setReportError("Error de conexión. Probá con WhatsApp soporte.");
            setReportSubmitting(false);
        }
    }, [orderId, pinType, distanceMeters, reportComment, reportSubmitting]);

    // Abre WhatsApp con un mensaje pre-armado al soporte. Funciona en mobile
    // (abre la app WA) y en desktop (web WA en el browser).
    const openWhatsAppSupport = useCallback(() => {
        const distanceStr = typeof distanceMeters === "number"
            ? `${Math.round(distanceMeters)}m`
            : "una distancia que no me deja";
        const pinTypeLabel = pinType === "pickup" ? "retiro del pedido" : "entrega al cliente";
        const orderRef = orderId ? ` (pedido ${orderId.slice(-6)})` : "";
        const text = encodeURIComponent(
            `Hola Moovy, tengo problemas con el GPS para validar el PIN de ${pinTypeLabel}${orderRef}. El sistema me dice que estoy a ${distanceStr} pero estoy en el lugar correcto. ¿Me ayudan?`
        );
        const url = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${text}`;
        if (typeof window !== "undefined") {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    }, [distanceMeters, pinType, orderId]);

    // Soporte de teclado físico (útil en tablets / teclado Bluetooth)
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (submitting || success) return;
            if (e.key >= "0" && e.key <= "9") {
                e.preventDefault();
                pushDigit(e.key);
            } else if (e.key === "Backspace") {
                e.preventDefault();
                backspace();
            } else if (e.key === "Escape") {
                e.preventDefault();
                if (!submitting) onClose();
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, pushDigit, backspace, onClose, submitting, success]);

    if (!isOpen) return null;

    const isLocked = errorCode === "TOO_MANY_ATTEMPTS";
    const isOutOfGeofence = errorCode === "OUT_OF_GEOFENCE";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget && !submitting) onClose();
            }}
        >
            <div className="bg-white dark:bg-[#1a1d27] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                                pinType === "pickup" ? "bg-red-100" : "bg-green-100"
                            }`}
                        >
                            <KeyRound
                                className={`w-5 h-5 ${pinType === "pickup" ? "text-red-600" : "text-green-600"}`}
                            />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">
                                {title}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#22252f] flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* 4-digit display */}
                <div className="flex justify-center gap-2 sm:gap-3 mb-4" role="group" aria-label="Dígitos del PIN">
                    {Array.from({ length: PIN_LENGTH }).map((_, i) => {
                        const filled = i < pin.length;
                        const isNext = i === pin.length && !submitting && !success;
                        return (
                            <div
                                key={i}
                                className={`w-11 h-14 sm:w-12 sm:h-16 rounded-2xl border-2 flex items-center justify-center text-2xl sm:text-3xl font-black transition-all ${
                                    success
                                        ? "border-green-500 bg-green-50 text-green-600"
                                        : error
                                        ? "border-red-400 bg-red-50 text-red-600 animate-shake"
                                        : filled
                                        ? "border-gray-900 dark:border-white bg-white dark:bg-[#22252f] text-gray-900 dark:text-white"
                                        : isNext
                                        ? "border-blue-500 bg-white dark:bg-[#22252f] text-gray-400 animate-pulse"
                                        : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#22252f] text-gray-400"
                                }`}
                            >
                                {filled ? (error ? pin[i] : "●") : ""}
                            </div>
                        );
                    })}
                </div>

                {/* Status row: loading / success / error */}
                <div className="min-h-[3.5rem] mb-4">
                    {submitting && (
                        <div className="flex items-center justify-center gap-2 text-blue-600 text-sm font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verificando...
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-bold animate-in fade-in duration-300">
                            <CheckCircle className="w-5 h-5" />
                            PIN correcto
                        </div>
                    )}
                    {error && !submitting && !success && (
                        <div
                            className={`flex items-start gap-2 text-sm rounded-xl p-3 ${
                                isLocked
                                    ? "bg-red-50 border border-red-200 text-red-700"
                                    : isOutOfGeofence
                                    ? "bg-amber-50 border border-amber-200 text-amber-700"
                                    : "bg-red-50 border border-red-100 text-red-600"
                            }`}
                        >
                            {isOutOfGeofence ? (
                                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold leading-tight">{error}</p>
                                {typeof remainingAttempts === "number" && remainingAttempts > 0 && !isLocked && (
                                    <p className="text-xs mt-0.5 opacity-80">
                                        Te quedan {remainingAttempts} intento{remainingAttempts === 1 ? "" : "s"}
                                    </p>
                                )}
                                {isOutOfGeofence && typeof distanceMeters === "number" && (
                                    <p className="text-xs mt-0.5 opacity-80">
                                        Estás a {Math.round(distanceMeters)}m del destino. Acercate más e intentá de nuevo.
                                    </p>
                                )}
                                {isLocked && (
                                    <p className="text-xs mt-0.5 opacity-80">
                                        Contactá al soporte de MOOVY para desbloquear el pedido.
                                    </p>
                                )}

                                {/* feat/driver-soporte-gps-bloqueado (2026-05-13):
                                    botones de escalamiento cuando geofence bloquea.
                                    Salida para drivers con GPS impreciso (frecuente
                                    en Ushuaia con -5°C y senial degradada). orderId
                                    es opcional: si no se paso, no mostramos esto
                                    para mantener compatibilidad con call sites que
                                    no lo conozcan. */}
                                {isOutOfGeofence && orderId && (
                                    <div className="mt-3 flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowReportModal(true)}
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition active:scale-95"
                                        >
                                            <HelpCircle className="w-3.5 h-3.5" />
                                            Tengo problemas con la ubicación
                                        </button>
                                        <button
                                            type="button"
                                            onClick={openWhatsAppSupport}
                                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition"
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                            o escribí a soporte por WhatsApp
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <button
                            key={n}
                            onClick={() => pushDigit(String(n))}
                            disabled={submitting || success || isLocked || pin.length >= PIN_LENGTH}
                            className="h-14 sm:h-16 rounded-2xl bg-gray-100 dark:bg-[#22252f] hover:bg-gray-200 dark:hover:bg-[#2a2d38] active:scale-95 transition-all text-2xl font-bold text-gray-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {n}
                        </button>
                    ))}
                    {/* Fila inferior: vacío | 0 | backspace */}
                    <div />
                    <button
                        onClick={() => pushDigit("0")}
                        disabled={submitting || success || isLocked || pin.length >= PIN_LENGTH}
                        className="h-14 sm:h-16 rounded-2xl bg-gray-100 dark:bg-[#22252f] hover:bg-gray-200 dark:hover:bg-[#2a2d38] active:scale-95 transition-all text-2xl font-bold text-gray-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        0
                    </button>
                    <button
                        onClick={backspace}
                        disabled={submitting || success || pin.length === 0}
                        className="h-14 sm:h-16 rounded-2xl bg-gray-100 dark:bg-[#22252f] hover:bg-gray-200 dark:hover:bg-[#2a2d38] active:scale-95 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Borrar"
                    >
                        <Delete className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                {/* Ayuda */}
                <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-4 leading-tight">
                    {pinType === "pickup"
                        ? "Sin este PIN no podés marcar el pedido como retirado."
                        : "Sin este PIN no podés marcar el pedido como entregado."}
                </p>

                {/* fix/contacto-modal-soporte (2026-05-13): boton de soporte
                    SIEMPRE visible (no solo despues de un OUT_OF_GEOFENCE).
                    Permite al driver pedir ayuda proactivamente — ej: el
                    comercio no le dicta bien el PIN, hay problema con el
                    pedido, no encuentra la direccion. orderId opcional —
                    si no esta cargado igual se permite WhatsApp (pero no
                    el reporte interno porque requiere orderId). */}
                {orderId && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => setShowReportModal(true)}
                            disabled={submitting}
                            className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400 transition disabled:opacity-50"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                            ¿Tenés problemas? Hablá con soporte
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-4px); }
                    40%, 80% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>

            {/* feat/driver-soporte-gps-bloqueado (2026-05-13): sub-modal de
                reporte de problema de ubicacion. Overlay sobre el modal del
                PIN. z-index mas alto que el modal principal (que es z-[100]
                en general). El driver escribe un comentario opcional, envia y
                aparece confirmacion de exito. Plus opcion WhatsApp como
                fallback rapido. */}
            {showReportModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-2xl w-full max-w-sm max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-amber-600" />
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">Reportar problema</h3>
                            </div>
                            <button
                                onClick={() => {
                                    if (reportSubmitting) return;
                                    setShowReportModal(false);
                                }}
                                disabled={reportSubmitting}
                                aria-label="Cerrar"
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition disabled:opacity-50"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {/* Body */}
                        {reportSubmitted ? (
                            <div className="px-5 py-8 text-center">
                                <div className="w-14 h-14 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle className="w-7 h-7 text-green-600" />
                                </div>
                                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">Reporte enviado</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                                    Soporte va a contactarte para destrabar el caso. Si es urgente, también podés escribir por WhatsApp.
                                </p>
                                <button
                                    type="button"
                                    onClick={openWhatsAppSupport}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition mb-2"
                                >
                                    <Phone className="w-4 h-4" />
                                    Escribir a soporte por WhatsApp
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="block mx-auto mt-1 text-xs text-gray-500 hover:text-gray-700"
                                >
                                    Volver
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-y-auto px-5 py-4 space-y-3">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Si tu GPS te ubica fuera del rango pero estás en el lugar correcto, contanos qué pasa y vamos a ayudarte a destrabar el caso.
                                    </p>
                                    {typeof distanceMeters === "number" && (
                                        <div className="text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg p-2.5 text-amber-800 dark:text-amber-200">
                                            El sistema dice que estás a <strong>{Math.round(distanceMeters)}m</strong> del destino.
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            ¿Qué está pasando? <span className="text-gray-400 font-normal">(opcional)</span>
                                        </label>
                                        <textarea
                                            value={reportComment}
                                            onChange={(e) => setReportComment(e.target.value.slice(0, REPORT_COMMENT_MAX))}
                                            disabled={reportSubmitting}
                                            placeholder="Ej: estoy en la puerta pero el GPS me ubica a media cuadra..."
                                            rows={3}
                                            maxLength={REPORT_COMMENT_MAX}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/10 dark:bg-[#22252f] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 disabled:opacity-50 resize-none"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1 text-right">
                                            {reportComment.length} / {REPORT_COMMENT_MAX}
                                        </p>
                                    </div>
                                    {reportError && (
                                        <div className="flex gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-xs text-red-700 dark:text-red-300">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <p>{reportError}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#22252f] flex flex-col gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={submitGpsIssueReport}
                                        disabled={reportSubmitting}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition disabled:opacity-50 active:scale-95"
                                    >
                                        {reportSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {reportSubmitting ? "Enviando..." : "Enviar reporte"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={openWhatsAppSupport}
                                        disabled={reportSubmitting}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-50"
                                    >
                                        <Phone className="w-3.5 h-3.5" />
                                        O hablar con soporte por WhatsApp
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
