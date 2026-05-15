"use client";

// feat/propinas-y-ratings-post-entrega (2026-05-08): modal unificado que se
// dispara post-entrega con TODAS las acciones pendientes que el buyer puede
// hacer en un solo flujo:
//   1. Calificar al comercio (1-5 estrellas + comentario opcional, max 500c).
//   2. Calificar al seller marketplace si aplica (idem).
//   3. Calificar al repartidor (1-5 estrellas + comentario opcional, max 300c).
//   4. Declarar propina al repartidor (efectivo / transferencia / esta vez no).
//
// El modal solo renderiza las secciones que estan pendientes (si el buyer ya
// califico al comercio antes, esa seccion no aparece). Si las 4 acciones ya
// fueron hechas, el modal no se monta.
//
// Botones:
// - "Enviar y cerrar" → primary, dispara los fetches en paralelo y cierra.
// - "Calificar después" → secondary, cierra el modal SIN persistir nada y la
//   proxima vez que el buyer abra el pedido vuelve a aparecer (logica esta
//   en la pagina /mis-pedidos/[orderId]).
//
// Sobre la propina: si el driver tiene bankAlias cargado, ofrecemos 3 opciones
// (efectivo, transferencia con alias copiable, esta vez no). Si no, solo
// efectivo y esta vez no — ademas mostramos un hint de que el driver no cargo
// alias bancario asi que la opcion transferencia no esta disponible (pueden
// arreglar por chat o en mano).

import { useState, useEffect, useRef } from "react";
import { Star, X, Loader2, Check, Copy, Banknote, ArrowRightLeft, AlertCircle } from "lucide-react";

interface PostDeliveryRatingModalProps {
    orderId: string;
    orderNumber: string;
    // Comercio (siempre presente para pedidos de comercio; null para marketplace puro)
    merchant: { name: string } | null;
    needsMerchantRating: boolean;
    // Seller (solo si el pedido es marketplace)
    seller: { displayName: string } | null;
    needsSellerRating: boolean;
    // Repartidor (siempre presente si hubo entrega)
    driver: { name: string; bankAlias: string | null } | null;
    needsDriverRating: boolean;
    needsTipDeclaration: boolean;
    onClose: () => void;
    onSuccess: () => void;
    // Permite al usuario cerrar el modal sin enviar nada (re-aparece en otra visita).
    onPostpone: () => void;
}

const COMMENT_LIMIT_DRIVER = 300;
const COMMENT_LIMIT_MERCHANT = 500;
const COMMENT_LIMIT_SELLER = 500;

const RATING_LABELS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

export default function PostDeliveryRatingModal({
    orderId,
    orderNumber,
    merchant,
    needsMerchantRating,
    seller,
    needsSellerRating,
    driver,
    needsDriverRating,
    needsTipDeclaration,
    onClose,
    onSuccess,
    onPostpone,
}: PostDeliveryRatingModalProps) {
    // Estado de cada rating
    const [merchantRating, setMerchantRating] = useState(0);
    const [merchantComment, setMerchantComment] = useState("");
    const [sellerRating, setSellerRating] = useState(0);
    const [sellerComment, setSellerComment] = useState("");
    const [driverRating, setDriverRating] = useState(0);
    const [driverComment, setDriverComment] = useState("");

    // Estado de la propina
    type TipMethod = "CASH" | "TRANSFER" | "NONE";
    const [tipMethod, setTipMethod] = useState<TipMethod | null>(null);
    const [tipAmount, setTipAmount] = useState("");
    const [aliasCopied, setAliasCopied] = useState(false);

    // Estado de submit
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Body scroll lock mientras el modal esta abierto.
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    // Si ninguna seccion aplica, no montamos.
    const hasAnything =
        needsMerchantRating ||
        needsSellerRating ||
        needsDriverRating ||
        needsTipDeclaration;
    if (!hasAnything) return null;

    function copyAlias() {
        if (!driver?.bankAlias) return;
        navigator.clipboard.writeText(driver.bankAlias).then(() => {
            setAliasCopied(true);
            setTimeout(() => setAliasCopied(false), 2500);
        }).catch(() => {});
    }

    async function handleSubmit() {
        setError(null);

        // Validar: si la seccion esta marcada needs*, hay que tener el rating.
        if (needsMerchantRating && merchantRating === 0) {
            setError("Calificá al comercio para continuar");
            return;
        }
        if (needsSellerRating && sellerRating === 0) {
            setError("Calificá al vendedor para continuar");
            return;
        }
        if (needsDriverRating && driverRating === 0) {
            setError("Calificá al repartidor para continuar");
            return;
        }
        // La propina puede quedar sin elegir — no es bloqueante.

        setSubmitting(true);

        // Tracking de exitos/errores parciales para mejor UX (si solo el comercio
        // falla, no perdemos el rating al driver).
        const tasks: Promise<{ ok: boolean; target: string; message?: string }>[] = [];

        if (needsMerchantRating) {
            tasks.push(
                fetch(`/api/orders/${orderId}/rate-merchant`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ rating: merchantRating, comment: merchantComment.trim() }),
                }).then(async (r) => ({
                    ok: r.ok,
                    target: "comercio",
                    message: r.ok ? undefined : (await r.json().catch(() => ({}))).error,
                }))
            );
        }
        if (needsSellerRating) {
            tasks.push(
                fetch(`/api/orders/${orderId}/rate-seller`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ rating: sellerRating, comment: sellerComment.trim() }),
                }).then(async (r) => ({
                    ok: r.ok,
                    target: "vendedor",
                    message: r.ok ? undefined : (await r.json().catch(() => ({}))).error,
                }))
            );
        }
        if (needsDriverRating) {
            tasks.push(
                fetch(`/api/orders/${orderId}/rate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ rating: driverRating, comment: driverComment.trim() }),
                }).then(async (r) => ({
                    ok: r.ok,
                    target: "repartidor",
                    message: r.ok ? undefined : (await r.json().catch(() => ({}))).error,
                }))
            );
        }
        if (needsTipDeclaration && tipMethod) {
            const amount = tipMethod === "NONE" ? null : (parseFloat(tipAmount) || null);
            tasks.push(
                fetch(`/api/orders/${orderId}/tip`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ method: tipMethod, amount }),
                }).then(async (r) => ({
                    ok: r.ok,
                    target: "propina",
                    message: r.ok ? undefined : (await r.json().catch(() => ({}))).error,
                }))
            );
        }

        const results = await Promise.all(tasks);
        const failures = results.filter(r => !r.ok);

        setSubmitting(false);

        if (failures.length === 0) {
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1800);
        } else {
            setError(`No pudimos guardar: ${failures.map(f => f.target).join(", ")}. ${failures[0]?.message || ""}`);
        }
    }

    // Pantalla de exito (igual estilo que los modales individuales)
    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">¡Gracias!</h3>
                    <p className="text-gray-600">Tu calificación nos ayuda a mejorar Moovy</p>
                </div>
            </div>
        );
    }

    // fix/modal-calificacion-tapado-por-bottomnav (2026-05-13): el BottomNav del
    // layout (z-50, fixed bottom-0) estaba tapando el footer del modal cuando el
    // modal usaba items-end + max-h-[92vh] en mobile. El footer quedaba donde
    // aparece el BottomNav y aunque z-[60] del modal era mayor, por stacking
    // context el BottomNav se renderizaba arriba, ocultando los botones
    // "Calificar despues" / "Enviar y cerrar". Sin esos botones la calificacion
    // no se podia guardar.
    //
    // Fix: subir a z-[100], centrar el modal siempre (sin items-end mobile),
    // bajar max-h a 85vh para dejar margen arriba y abajo. Patron estandar de
    // modales sobre apps con bottom nav.
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Tu pedido fue entregado</h2>
                        <p className="text-xs text-gray-500">#{orderNumber} · ayudanos a calificar</p>
                    </div>
                    <button
                        onClick={onPostpone}
                        disabled={submitting}
                        aria-label="Cerrar"
                        className="p-1.5 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div ref={scrollRef} className="overflow-y-auto px-5 py-4 space-y-6 flex-1">
                    {/* Comercio */}
                    {needsMerchantRating && merchant && (
                        <RatingSection
                            label="Comercio"
                            entityName={merchant.name}
                            rating={merchantRating}
                            onRatingChange={setMerchantRating}
                            comment={merchantComment}
                            onCommentChange={setMerchantComment}
                            commentLimit={COMMENT_LIMIT_MERCHANT}
                            placeholder="¿Cómo fue tu experiencia con el comercio? Atención, calidad, packaging..."
                            disabled={submitting}
                        />
                    )}

                    {/* Seller marketplace */}
                    {needsSellerRating && seller && (
                        <RatingSection
                            label="Vendedor"
                            entityName={seller.displayName}
                            rating={sellerRating}
                            onRatingChange={setSellerRating}
                            comment={sellerComment}
                            onCommentChange={setSellerComment}
                            commentLimit={COMMENT_LIMIT_SELLER}
                            placeholder="¿Cómo fue tu experiencia con el vendedor?"
                            disabled={submitting}
                        />
                    )}

                    {/* Repartidor */}
                    {needsDriverRating && driver && (
                        <RatingSection
                            label="Repartidor"
                            entityName={driver.name}
                            rating={driverRating}
                            onRatingChange={setDriverRating}
                            comment={driverComment}
                            onCommentChange={setDriverComment}
                            commentLimit={COMMENT_LIMIT_DRIVER}
                            placeholder="¿Cómo te trató el repartidor?"
                            disabled={submitting}
                        />
                    )}

                    {/* Propina al driver */}
                    {needsTipDeclaration && driver && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Propina al repartidor</h3>
                            <p className="text-xs text-gray-500 mb-3">
                                100% para {driver.name}. Moovy no procesa esta transacción — la coordinás directo con el repartidor.
                            </p>

                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setTipMethod("CASH")}
                                    disabled={submitting}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition active:scale-[0.99] ${
                                        tipMethod === "CASH"
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 bg-white hover:bg-gray-50"
                                    }`}
                                >
                                    <Banknote className={`w-5 h-5 flex-shrink-0 ${tipMethod === "CASH" ? "text-green-600" : "text-gray-400"}`} />
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-semibold text-gray-900">En efectivo</p>
                                        <p className="text-xs text-gray-500">Lo arreglás en mano con el repartidor</p>
                                    </div>
                                </button>

                                {/* Transferencia: solo si el driver tiene alias */}
                                {driver.bankAlias ? (
                                    <button
                                        type="button"
                                        onClick={() => setTipMethod("TRANSFER")}
                                        disabled={submitting}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition active:scale-[0.99] ${
                                            tipMethod === "TRANSFER"
                                                ? "border-green-500 bg-green-50"
                                                : "border-gray-200 bg-white hover:bg-gray-50"
                                        }`}
                                    >
                                        <ArrowRightLeft className={`w-5 h-5 flex-shrink-0 ${tipMethod === "TRANSFER" ? "text-green-600" : "text-gray-400"}`} />
                                        <div className="text-left flex-1">
                                            <p className="text-sm font-semibold text-gray-900">Transferencia</p>
                                            <p className="text-xs text-gray-500">Alias del repartidor más abajo</p>
                                        </div>
                                    </button>
                                ) : (
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                                        <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-gray-500">
                                            El repartidor todavía no cargó su alias bancario.
                                            Si querés transferir, podés coordinar por el chat del pedido.
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setTipMethod("NONE")}
                                    disabled={submitting}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition active:scale-[0.99] ${
                                        tipMethod === "NONE"
                                            ? "border-gray-400 bg-gray-50"
                                            : "border-gray-200 bg-white hover:bg-gray-50"
                                    }`}
                                >
                                    <X className={`w-5 h-5 flex-shrink-0 ${tipMethod === "NONE" ? "text-gray-600" : "text-gray-400"}`} />
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-semibold text-gray-900">Esta vez no</p>
                                        <p className="text-xs text-gray-500">Sin propina en este pedido</p>
                                    </div>
                                </button>
                            </div>

                            {/* Detalle de transferencia: alias copiable + monto opcional */}
                            {tipMethod === "TRANSFER" && driver.bankAlias && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl space-y-2">
                                    <div>
                                        <p className="text-xs font-semibold text-green-900 mb-1">Alias para transferir</p>
                                        <div className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-green-200">
                                            <span className="text-sm font-mono font-bold text-gray-900 flex-1 truncate">{driver.bankAlias}</span>
                                            <button
                                                type="button"
                                                onClick={copyAlias}
                                                className="px-2.5 py-1 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 transition flex items-center gap-1"
                                            >
                                                {aliasCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                {aliasCopied ? "Copiado" : "Copiar"}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-green-900 mb-1">
                                            Monto (opcional)
                                        </label>
                                        <input
                                            type="number"
                                            value={tipAmount}
                                            onChange={(e) => setTipAmount(e.target.value)}
                                            placeholder="500"
                                            min={0}
                                            step={50}
                                            className="w-full px-3 py-2 text-sm bg-white border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Monto opcional cuando es CASH */}
                            {tipMethod === "CASH" && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                                        Monto que vas a dejar (opcional)
                                    </label>
                                    <input
                                        type="number"
                                        value={tipAmount}
                                        onChange={(e) => setTipAmount(e.target.value)}
                                        placeholder="500"
                                        min={0}
                                        step={50}
                                        className="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onPostpone}
                        disabled={submitting}
                        className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition disabled:opacity-50"
                    >
                        Calificar después
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 px-4 py-2.5 text-sm font-bold rounded-lg bg-[#e60012] text-white hover:bg-[#cc000f] transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {submitting ? "Enviando..." : "Enviar y cerrar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-componente: una sección de rating con estrellas + textarea ──────────

interface RatingSectionProps {
    label: string;
    entityName: string;
    rating: number;
    onRatingChange: (n: number) => void;
    comment: string;
    onCommentChange: (s: string) => void;
    commentLimit: number;
    placeholder: string;
    disabled: boolean;
}

function RatingSection({
    label,
    entityName,
    rating,
    onRatingChange,
    comment,
    onCommentChange,
    commentLimit,
    placeholder,
    disabled,
}: RatingSectionProps) {
    const [hoveredRating, setHoveredRating] = useState(0);
    const displayRating = hoveredRating || rating;

    return (
        <div>
            <div className="mb-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-bold text-gray-900 truncate">{entityName}</p>
            </div>

            {/* Estrellas */}
            <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onRatingChange(n)}
                        onMouseEnter={() => setHoveredRating(n)}
                        onMouseLeave={() => setHoveredRating(0)}
                        disabled={disabled}
                        className="p-0.5 hover:scale-110 transition disabled:opacity-50"
                        aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
                    >
                        <Star
                            className={`w-7 h-7 ${
                                n <= displayRating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                            }`}
                        />
                    </button>
                ))}
                {displayRating > 0 && (
                    <span className="ml-2 text-xs font-semibold text-gray-600">{RATING_LABELS[displayRating]}</span>
                )}
            </div>

            {/* Comentario opcional */}
            <textarea
                value={comment}
                onChange={(e) => onCommentChange(e.target.value.slice(0, commentLimit))}
                disabled={disabled}
                placeholder={placeholder}
                rows={2}
                maxLength={commentLimit}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 disabled:bg-gray-50 resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">
                {comment.length} / {commentLimit}
            </p>
        </div>
    );
}
