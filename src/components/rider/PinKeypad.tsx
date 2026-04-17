"use client";

// ISSUE-001: PIN doble de entrega
// Modal con keypad numérico de 6 dígitos para que el driver ingrese el PIN
// entregado por el comercio (pickup) o por el comprador (delivery).
// Diseñado para uso en calle: botones grandes, feedback háptico, tolerante a
// errores (backspace, paste desde portapapeles, instrucciones claras).
import { useEffect, useState, useCallback } from "react";
import { KeyRound, X, Delete, Loader2, AlertCircle, CheckCircle, MapPin } from "lucide-react";

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
}

const PIN_LENGTH = 6;

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
}: PinKeypadProps) {
    const [pin, setPin] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
    const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
    const [success, setSuccess] = useState(false);

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
        }
    }, [isOpen]);

    const title = pinType === "pickup" ? "PIN de retiro" : "PIN de entrega";
    const subtitle =
        pinType === "pickup"
            ? `Pedile al comercio${counterpartName ? ` (${counterpartName})` : ""} el código de 6 dígitos`
            : `Pedile al comprador${counterpartName ? ` (${counterpartName})` : ""} el código de 6 dígitos`;

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
            // Auto-submit cuando se alcanzan los 6 dígitos
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

                {/* 6-digit display */}
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
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-4px); }
                    40%, 80% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>
        </div>
    );
}
