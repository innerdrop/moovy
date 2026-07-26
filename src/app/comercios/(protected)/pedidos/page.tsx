"use client";

// Merchant Orders Page - Panel de Pedidos del Comercio
// Uses dedicated endpoints: confirm, reject, ready (not generic PATCH)
import { useState, useEffect, useCallback, useRef } from "react";
import { formatPrice } from "@/lib/delivery";
import { formatTime } from "@/lib/timezone";
import { formatPinForDisplay } from "@/lib/pin";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { toast } from "@/store/toast";
// fix/panel-comercio-auditoria: modal Moovy (regla #24). Alias para no chocar
// con el window.confirm global.
import { confirm as confirmModal } from "@/store/confirm";
import {
    ShoppingBag,
    Clock,
    CheckCircle,
    Package,
    Truck,
    XCircle,
    Loader2,
    RefreshCw,
    Bell,
    AlertTriangle,
    Wifi,
    WifiOff,
    SlidersHorizontal,
    KeyRound,
    X,
    Calendar,
    ChevronDown,
    Printer
} from "lucide-react";
import OrderChatPanel from "@/components/orders/OrderChatPanel";
import StorePauseCard from "@/components/comercios/StorePauseCard";

interface SubOrder {
    id: string;
    merchantId: string | null;
    deliveryStatus: string | null;
    pickupPin: string | null;
    // Rama feat/comercio-ux-guardar-y-totales: necesitamos el subtotal del subOrder
    // para mostrar "Tu venta" en multi-vendor (cada merchant ve su parte).
    subtotal?: number;
    merchantCommissionRate?: number | null;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod?: string;
    total: number;
    // Rama feat/comercio-ux-guardar-y-totales: campos financieros que el endpoint
    // ya devolvía vía include(). Necesarios para mostrar "Tu venta" (subtotal) en
    // lugar del total (que incluye delivery fee — no es plata del comercio).
    subtotal?: number;
    deliveryFee?: number;
    createdAt: string;
    items: Array<{ id: string; name: string; quantity: number; price: number }>;
    address: { street: string; number: string; city: string } | null;
    user: { name: string | null; phone: string | null } | null;
    driver?: { user: { name: string | null; phone: string | null } | null } | null;
    pickupPin: string | null;
    deliveryStatus: string | null;
    subOrders?: SubOrder[];
    cancelReason?: string | null;
    // fix/merchant-flow-pedidos: campos que el backend ya tiene pero la UI no consumía.
    isPickup?: boolean;
    deliveryType?: string;
    scheduledSlotStart?: string | null;
    scheduledSlotEnd?: string | null;
}

/**
 * Rama feat/comercio-ux-guardar-y-totales.
 *
 * Devuelve el monto que efectivamente le corresponde al comercio por este pedido
 * (lo que llamamos "Tu venta"):
 *   - Multi-vendor: suma de los subtotales de SUS subOrders (el backend ya filtró).
 *   - Single-vendor: el subtotal del Order.
 *   - Fallback legacy: order.total − deliveryFee.
 *
 * IMPORTANTE: NO usar order.total — incluye el delivery fee que cobra el repartidor,
 * no es plata del comercio. Esto evita el bug donde el comercio veía "$5.200" y
 * pensaba que iba a recibir eso cuando en realidad $1.800 era el envío.
 */
function getMerchantSale(order: Order): number {
    // Multi-vendor: sumar los subOrders del merchant (backend ya filtró)
    if (order.subOrders && order.subOrders.length > 0) {
        const sum = order.subOrders.reduce((acc, sub) => acc + (sub.subtotal ?? 0), 0);
        if (sum > 0) return sum;
    }
    // Single-vendor: subtotal del Order
    if (typeof order.subtotal === "number" && order.subtotal > 0) {
        return order.subtotal;
    }
    // Fallback legacy: total − deliveryFee
    return Math.max(0, order.total - (order.deliveryFee ?? 0));
}

/**
 * Devuelve { payout, commissionPercent } para mostrar el neto post-comisión
 * que efectivamente cobra el comercio. Toma el `merchantCommissionRate` del primer
 * subOrder (snapshot inmutable) o cae a fallback 8% si no está persistido.
 */
function getMerchantPayoutInfo(order: Order): { payout: number; commissionPercent: number } | null {
    const sale = getMerchantSale(order);
    if (sale <= 0) return null;
    const rate = order.subOrders?.[0]?.merchantCommissionRate;
    if (typeof rate !== "number") return null;
    const payout = sale * (1 - rate);
    return { payout, commissionPercent: Math.round(rate * 1000) / 10 };
}

/**
 * Tarjeta prominente con el PIN de retiro.
 * Se muestra sólo cuando el driver llegó al comercio (DRIVER_ARRIVED).
 * El comerciante debe leer este código al driver antes de entregar el pedido.
 */
function PickupPinBadge({ pin, driverName }: { pin: string; driverName?: string | null }) {
    return (
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 mb-3 shadow-lg ring-2 ring-red-300">
            <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
                    <KeyRound className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-100 uppercase tracking-wide mb-1">
                        PIN de retiro
                    </p>
                    <p className="text-3xl font-mono font-black text-white tracking-widest">
                        {formatPinForDisplay(pin)}
                    </p>
                    <p className="text-xs text-red-50 mt-2 leading-relaxed">
                        Dale este código al repartidor{driverName ? ` (${driverName})` : ""} antes de entregar el pedido.
                        Sin este código no podrá marcarlo como retirado.
                    </p>
                </div>
            </div>
        </div>
    );
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    PENDING: { label: "Nuevo", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: <Bell className="w-5 h-5" /> },
    AWAITING_PAYMENT: { label: "Esperando pago", color: "text-amber-600", bgColor: "bg-amber-100", icon: <Clock className="w-5 h-5" /> },
    SCHEDULED: { label: "Programado", color: "text-violet-600", bgColor: "bg-violet-100", icon: <Calendar className="w-5 h-5" /> },
    SCHEDULED_CONFIRMED: { label: "Programado · confirmado", color: "text-violet-700", bgColor: "bg-violet-100", icon: <Calendar className="w-5 h-5" /> },
    CONFIRMED: { label: "Confirmado", color: "text-blue-600", bgColor: "bg-blue-100", icon: <CheckCircle className="w-5 h-5" /> },
    // feat/asignacion-reintento-y-reembolso: el pedido pagado está buscando repartidor
    // (no murió). Es estado ACTIVO, no fallido — el comercio sabe que sigue vivo.
    SEARCHING_DRIVER: { label: "Buscando repartidor", color: "text-amber-700", bgColor: "bg-amber-100", icon: <Clock className="w-5 h-5" /> },
    PREPARING: { label: "Preparando", color: "text-red-600", bgColor: "bg-red-100", icon: <Package className="w-5 h-5" /> },
    READY: { label: "Listo", color: "text-indigo-600", bgColor: "bg-indigo-100", icon: <Package className="w-5 h-5" /> },
    DRIVER_ASSIGNED: { label: "Rider asignado", color: "text-cyan-600", bgColor: "bg-cyan-100", icon: <Truck className="w-5 h-5" /> },
    PICKED_UP: { label: "Recogido", color: "text-orange-600", bgColor: "bg-orange-100", icon: <Truck className="w-5 h-5" /> },
    IN_DELIVERY: { label: "En camino", color: "text-orange-600", bgColor: "bg-orange-100", icon: <Truck className="w-5 h-5" /> },
    DELIVERED: { label: "Entregado", color: "text-green-600", bgColor: "bg-green-100", icon: <CheckCircle className="w-5 h-5" /> },
    CANCELLED: { label: "Cancelado", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="w-5 h-5" /> },
    // Status de fallo que antes caían en el default "Nuevo" amarillo — ahora tienen
    // etiqueta y color propios para que el comercio los identifique en el tab "Fallidos".
    UNASSIGNABLE: { label: "Sin repartidor", color: "text-red-700", bgColor: "bg-red-100", icon: <AlertTriangle className="w-5 h-5" /> },
    REJECTED: { label: "Rechazado", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="w-5 h-5" /> },
};

/**
 * Ticket de identificación del pedido (founder 07-26) — NO fiscal.
 * Formato 80mm (impresora térmica) pero imprime en cualquier impresora:
 * abre una ventanita con el ticket y dispara el diálogo de impresión del
 * sistema. Etapa 1 del plan de impresión (etapa 2 post-piloto: auto-print
 * al entrar un pedido pagado; etapa 3: térmicas cloud tipo Asia).
 */
function printOrderTicket(order: Order) {
    // Seguridad: TODO texto que viene de datos (nombres de cliente/productos,
    // dirección) se escapa antes de entrar al HTML del ticket — un nombre
    // malicioso no puede inyectar código en la ventana del comercio.
    const esc = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const items = order.items
        .map((i) => `<tr><td class="q">${i.quantity}×</td><td>${esc(i.name)}</td><td class="p">${formatPrice(i.price * i.quantity)}</td></tr>`)
        .join("");
    const entrega = order.isPickup
        ? "RETIRA EN LOCAL"
        : order.address
            ? `ENVÍO: ${esc(`${order.address.street} ${order.address.number}, ${order.address.city}`)}`
            : "ENVÍO A DOMICILIO";
    const fecha = new Date(order.createdAt).toLocaleString("es-AR", {
        timeZone: "America/Argentina/Ushuaia",
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(order.orderNumber)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; font-family:'Courier New',monospace; color:#000; }
  body { width:72mm; padding:4mm 3mm; }
  .c { text-align:center; }
  .brand { font-size:16px; font-weight:900; letter-spacing:2px; }
  .num { font-size:26px; font-weight:900; margin:2mm 0 1mm; }
  .meta { font-size:11px; margin-bottom:1mm; }
  hr { border:none; border-top:1px dashed #000; margin:2mm 0; }
  table { width:100%; font-size:12px; border-collapse:collapse; }
  td { padding:0.6mm 0; vertical-align:top; }
  .q { width:9mm; font-weight:bold; }
  .p { text-align:right; white-space:nowrap; }
  .tot { font-size:14px; font-weight:900; display:flex; justify-content:space-between; }
  .entrega { font-size:11.5px; font-weight:bold; margin:1mm 0; }
  .legal { font-size:9px; text-align:center; margin-top:2mm; }
  @media print { body { width:auto; } }
</style></head><body>
  <div class="c brand">MOOVY</div>
  <div class="c num">${esc(order.orderNumber)}</div>
  <div class="c meta">${fecha} hs · ${esc(order.user?.name || "Cliente")}${order.user?.phone ? " · " + esc(order.user.phone) : ""}</div>
  <div class="c entrega">${entrega}</div>
  <hr><table>${items}</table><hr>
  <div class="tot"><span>TOTAL PRODUCTOS</span><span>${formatPrice(getMerchantSale(order))}</span></div>
  <div class="legal">Ticket NO fiscal — solo identificación del pedido.<br>Abrochalo a la bolsa 📎</div>
<script>window.onload = function(){ window.print(); };<\/script>
</body></html>`;
    const w = window.open("", "_blank", "width=340,height=560");
    if (!w) return false; // popup bloqueado — el caller avisa por toast
    w.document.write(html);
    w.document.close();
    return true;
}

const CANCELLATION_REASONS = [
    "Producto no disponible",
    "Falta de stock",
    "Comercio cerrado temporalmente",
    "Pedido duplicado",
    "Problema con el pago",
    "Dirección de entrega incorrecta",
    "Cliente no responde",
    "Tiempo de espera excedido",
    "Error en el pedido",
    "Solicitud del cliente",
];

/** Countdown timer showing remaining time before auto-cancel */
function PendingCountdown({ createdAt, timeoutSeconds = 300, onExpire }: { createdAt: string; timeoutSeconds?: number; onExpire?: () => void }) {
    const [remaining, setRemaining] = useState("");
    const [urgent, setUrgent] = useState(false);
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        const created = new Date(createdAt).getTime();
        const deadline = created + timeoutSeconds * 1000;

        function tick() {
            const diff = deadline - Date.now();
            if (diff <= 0) {
                setRemaining("Expirado");
                setUrgent(true);
                if (!expired) {
                    setExpired(true);
                    onExpire?.();
                }
                return;
            }
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
            setUrgent(diff < 60000); // last minute
        }

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [createdAt, timeoutSeconds]);

    return (
        <div className={`flex items-center gap-1.5 text-xs font-medium mb-3 ${expired ? "text-gray-400" : urgent ? "text-red-600" : "text-yellow-600"}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{expired ? "Tiempo expirado — pedido será cancelado automáticamente" : `Tiempo para confirmar: ${remaining}`}</span>
        </div>
    );
}

/** Sticky banner when socket connection is lost */
function DisconnectionBanner({ since, onRetry }: { since: Date; onRetry: () => void }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        function tick() {
            setElapsed(Math.floor((Date.now() - since.getTime()) / 1000));
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [since]);

    // Only show after 5 seconds of disconnection (avoid flash on brief reconnects)
    if (elapsed < 5) return null;

    const isLong = elapsed > 30;

    return (
        <div className={`rounded-xl p-4 flex items-center justify-between gap-3 ${isLong ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
            <div className="flex items-center gap-3 min-w-0">
                <WifiOff className={`w-5 h-5 flex-shrink-0 ${isLong ? "text-red-500" : "text-amber-500"}`} />
                <div className="min-w-0">
                    <p className={`text-sm font-medium ${isLong ? "text-red-800" : "text-amber-800"}`}>
                        {isLong
                            ? "Conexión perdida — podés perderte pedidos nuevos"
                            : "Reconectando al servidor..."}
                    </p>
                    <p className={`text-xs mt-0.5 ${isLong ? "text-red-600" : "text-amber-600"}`}>
                        {isLong
                            ? `Sin conexión hace ${elapsed > 60 ? `${Math.floor(elapsed / 60)} min` : `${elapsed}s`}. Estamos actualizando por REST cada 10s como respaldo.`
                            : "Reintentando automáticamente..."}
                    </p>
                </div>
            </div>
            <button
                onClick={onRetry}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition ${isLong
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                }`}
            >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar
            </button>
        </div>
    );
}

export default function ComercioPedidosPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [expiredOrders, setExpiredOrders] = useState<Set<string>>(new Set());
    // "failed" agrupa UNASSIGNABLE / CANCELLED / REJECTED (pedidos que NO llegaron
    // al buyer). Antes todos caían en "completed" junto con los DELIVERED, y el
    // merchant no tenía visibilidad de que un pedido había fracasado post-aceptación.
    const [filter, setFilter] = useState<"active" | "completed" | "failed" | "all">("active");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    // ── Tablero KDS (founder 07-26, mockup A+B): acordeón por tarjeta ──
    // Por defecto: los pedidos que PIDEN ACCIÓN llegan ABIERTOS (y latiendo);
    // el resto colapsado. `toggledCards` invierte el default de una tarjeta
    // cuando el comercio la toca (XOR — no hace falta doble estado).
    const [toggledCards, setToggledCards] = useState<Set<string>>(new Set());
    const toggleCard = (id: string) =>
        setToggledCards(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    const [merchantId, setMerchantId] = useState<string | null>(null);
    const [unassignableAlerts, setUnassignableAlerts] = useState<{ orderId: string; orderNumber: string }[]>([]);
    const [confirmTimeout, setConfirmTimeout] = useState(300);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Cancellation modal state
    const [cancelModal, setCancelModal] = useState<{ open: boolean; orderId: string | null; orderNumber: string }>({
        open: false,
        orderId: null,
        orderNumber: "",
    });
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    // Fetch merchant ID for socket room + confirm timeout from config
    useEffect(() => {
        fetch("/api/merchant/me")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.id) setMerchantId(data.id);
            })
            .catch(() => { });
        fetch("/api/config/public?key=merchant_confirm_timeout_seconds")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.value) setConfirmTimeout(parseInt(data.value, 10) || 300);
            })
            .catch(() => { });
    }, []);

    const loadOrders = useCallback(async (silent = false) => {
        try {
            // Fetch orders for the current merchant
            const res = await fetch("/api/merchant/orders");
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    // Real-time order updates via WebSocket
    const { isConnected, disconnectedSince, reconnect } = useRealtimeOrders({
        role: "merchant",
        merchantId: merchantId || undefined,
        enabled: !!merchantId,
        onNewOrder: (order) => {
            // Play notification sound + vibrate
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
            }
            // Vibrate pattern: 3 short pulses (mobile devices)
            if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
            // Show browser notification if page is in background
            if (typeof document !== "undefined" && document.hidden && "Notification" in window && Notification.permission === "granted") {
                new Notification("¡Nuevo pedido en MOOVY!", {
                    body: `Pedido #${order?.orderNumber || "nuevo"} recibido`,
                    icon: "/logo-moovy.svg",
                    tag: "new-order",
                });
            }
            // Reload orders to get full data
            loadOrders(true);
        },
        onStatusChange: (orderId, status) => {
            // Update order in list or reload
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status } : o
            ));
            // ISSUE-001: cuando el driver llega, el backend recién ahora expone el pickupPin.
            // Hacemos un fetch fresco para traerlo (el socket solo manda status, no el PIN).
            if (status === "DRIVER_ARRIVED") {
                loadOrders(true);
            }
        },
        onOrderCancelled: (orderId) => {
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: "CANCELLED" } : o
            ));
        },
        onOrderUnassignable: (orderId, orderNumber) => {
            setUnassignableAlerts(prev => {
                if (prev.some(a => a.orderId === orderId)) return prev;
                return [...prev, { orderId, orderNumber }];
            });
            toast.warning(`No se encontró repartidor para el pedido ${orderNumber}. MOOVY fue notificado.`, 10000);
        },
    });

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Adaptive polling — Bug 5 (rama fix/state-machine-paralela-merchant-driver):
    // antes era 60s con socket conectado, 10s sin. Pero 60s era muy largo:
    // si el socket no entregaba un evento (race condition al login, evento
    // perdido en el dispatcher, server reboot), el merchant esperaba un minuto
    // y refrescaba manual. Bajamos a 10s siempre — el socket sigue siendo el
    // primary path para latencia < 1s, el polling es la red de seguridad.
    // 10s de polling es liviano: 1 query indexada cada 10s por merchant logueado.
    useEffect(() => {
        const intervalId = setInterval(() => loadOrders(true), 10000);
        return () => clearInterval(intervalId);
    }, [loadOrders]);

    // Log visible en consola para debug del socket merchant
    useEffect(() => {
        if (typeof window !== "undefined") {
            console.log(`[MerchantPanel] Socket isConnected=${isConnected}, polling cada 10s como red de seguridad`);
        }
    }, [isConnected]);

    // ─── Dedicated endpoint handlers ────────────────────────────────────────

    const confirmOrder = async (orderId: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/merchant/orders/${orderId}/confirm`, { method: "POST" });
            if (res.ok) {
                loadOrders(true);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Error al confirmar el pedido");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    const rejectOrder = async (orderId: string, reason: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/merchant/orders/${orderId}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });
            if (res.ok) {
                loadOrders(true);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Error al rechazar el pedido");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    const markReady = async (orderId: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/merchant/orders/${orderId}/ready`, { method: "POST" });
            if (res.ok) {
                loadOrders(true);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Error al marcar como listo");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    // fix/merchant-flow-pedidos (2026-04-26): pickup self-contained.
    // Cuando isPickup=true y status=READY, el comercio cierra la operación marcando
    // el pedido como entregado al cliente (READY → DELIVERED, sin driver).
    const markPickedUpByCustomer = async (orderId: string) => {
        // fix/panel-comercio-auditoria: modal Moovy en vez de window.confirm (regla #24).
        const ok = await confirmModal({
            title: "Entregar al cliente",
            message: "¿Confirmás que el cliente vino y retiró este pedido?",
            confirmLabel: "Sí, lo retiró",
            cancelLabel: "Cancelar",
        });
        if (!ok) return;
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/merchant/orders/${orderId}/mark-picked-up`, { method: "POST" });
            if (res.ok) {
                toast.success("Pedido entregado al cliente");
                loadOrders(true);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Error al cerrar el pedido");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    // fix/merchant-flow-pedidos: confirmación de pedidos programados.
    // SCHEDULED → SCHEDULED_CONFIRMED. El cron scheduled-notify pasa después a PENDING
    // 45min antes del slot para arrancar el flow normal.
    const confirmScheduled = async (orderId: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/merchant/orders/${orderId}/confirm-scheduled`, { method: "POST" });
            if (res.ok) {
                toast.success("Reserva confirmada — te avisaremos antes del horario");
                loadOrders(true);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Error al confirmar la reserva");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    const openCancelModal = (orderId: string, orderNumber: string) => {
        setCancelModal({ open: true, orderId, orderNumber });
        setSelectedReason("");
        setCustomReason("");
    };

    const closeCancelModal = () => {
        setCancelModal({ open: false, orderId: null, orderNumber: "" });
        setSelectedReason("");
        setCustomReason("");
    };

    const confirmCancellation = async () => {
        if (!cancelModal.orderId) return;

        const reason = selectedReason === "Otro motivo" ? customReason : selectedReason;
        if (!reason.trim()) {
            toast.warning("Debes seleccionar o escribir un motivo de cancelación");
            return;
        }

        setIsCancelling(true);
        await rejectOrder(cancelModal.orderId, reason);
        setIsCancelling(false);
        closeCancelModal();
    };

    // Tres grupos MUTUAMENTE EXCLUYENTES de status — cada pedido cae en uno solo:
    //   - ACTIVE: en curso desde la perspectiva del merchant (todavía hay que hacer algo).
    //   - COMPLETED: entregado con éxito (DELIVERED).
    //   - FAILED: no llegó al buyer (sin repartidor, cancelado por merchant/buyer/admin, rechazado).
    //
    // PATRÓN INVERTIDO (rama fix/state-machine-paralela-merchant-driver):
    // Antes ACTIVE era una enumeración hardcodeada y cada estado nuevo del flujo
    // (DRIVER_ARRIVED, RETURNING_TO_MERCHANT, WAITING_FOR_CUSTOMER, ...) que se
    // olvidaba quedaba mal clasificado: pedidos en curso aparecían en "Todos"
    // pero NO en "Activos". Bug 4 reportado en smoke test pre-launch.
    //
    // Solución: enumerar SOLO los terminales (chico, estable) y derivar
    // "ACTIVE = NO terminal". Estados nuevos del flujo caen en ACTIVE
    // automáticamente sin tocar este filtro.
    const completedStatuses = ["DELIVERED"];
    const failedStatuses = ["UNASSIGNABLE", "CANCELLED", "REJECTED", "REFUNDED", "EXPIRED", "RETURNED"];
    const isActiveStatus = (s: string) =>
        !completedStatuses.includes(s) && !failedStatuses.includes(s);

    // Semáforo KDS: 3 contadores gigantes estilo pantalla de cocina.
    // NUEVOS = piden una decisión YA (aceptar/confirmar reserva).
    const needsActionStatuses = ["PENDING", "CONFIRMED", "SCHEDULED"];
    const preparingStatuses = ["PREPARING", "SEARCHING_DRIVER", "DRIVER_ASSIGNED", "SCHEDULED_CONFIRMED"];
    const needsAction = (s: string) => needsActionStatuses.includes(s);
    const kdsNew = orders.filter(o => needsAction(o.status)).length;
    const kdsPrep = orders.filter(o => preparingStatuses.includes(o.status)).length;
    const kdsReady = orders.filter(o =>
        isActiveStatus(o.status) && !needsAction(o.status) && !preparingStatuses.includes(o.status)
    ).length;

    /** "hace 3 min" — para que el comercio vea la antigüedad sin pensar. */
    const timeAgo = (iso: string) => {
        const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
        if (mins < 1) return "recién";
        if (mins < 60) return `hace ${mins} min`;
        const h = Math.floor(mins / 60);
        return `hace ${h} h ${mins % 60} min`;
    };

    /** Borde semáforo de la tarjeta (mockup B). */
    const kdsBorder = (s: string) => {
        if (failedStatuses.includes(s)) return "border-l-red-300";
        if (needsAction(s)) return "border-l-[#e60012]";
        if (preparingStatuses.includes(s)) return "border-l-amber-400";
        if (completedStatuses.includes(s)) return "border-l-gray-300";
        return "border-l-green-500";
    };

    const filteredOrders = orders.filter(order => {
        if (filter === "active" && !isActiveStatus(order.status)) return false;
        if (filter === "completed" && !completedStatuses.includes(order.status)) return false;
        if (filter === "failed" && !failedStatuses.includes(order.status)) return false;
        if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            if (new Date(order.createdAt) < from) return false;
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            if (new Date(order.createdAt) > to) return false;
        }
        if (minAmount && order.total < parseFloat(minAmount)) return false;
        if (maxAmount && order.total > parseFloat(maxAmount)) return false;
        return true;
    });

    // Count pending orders for badge
    const pendingCount = orders.filter(o => o.status === "PENDING").length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
                    <p className="text-gray-500">Gestiona los pedidos de tu comercio</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Connection indicator */}
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {isConnected ? "En vivo" : "Reconectando..."}
                    </span>
                    <button
                        onClick={() => loadOrders()}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-600"
                        title="Actualizar"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Pausa rápida (founder 07-26): también acá, donde el comercio vive
                cuando trabaja. selfFetch: esta página es client y no trae merchant. */}
            <StorePauseCard variant="compact" selfFetch />

            {/* Disconnection Banner — sticky warning when socket is down */}
            {!isConnected && disconnectedSince && (
                <DisconnectionBanner
                    since={disconnectedSince}
                    onRetry={() => {
                        reconnect();
                        loadOrders(true);
                    }}
                />
            )}

            {/* Pending Orders Alert */}
            {pendingCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                    <Bell className="w-6 h-6 text-yellow-600" />
                    <p className="text-yellow-800 font-medium">
                        ¡Tenés <span className="font-bold">{pendingCount}</span> pedido{pendingCount > 1 ? "s" : ""} nuevo{pendingCount > 1 ? "s" : ""}!
                    </p>
                </div>
            )}

            {/* Unassignable Orders Alert */}
            {unassignableAlerts.length > 0 && (
                <div className="space-y-2">
                    {unassignableAlerts.map((alert) => (
                        <div key={alert.orderId} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                                <p className="text-orange-800 text-sm font-medium">
                                    No se encontró repartidor para <span className="font-bold">{alert.orderNumber}</span>. El equipo de MOOVY fue notificado.
                                </p>
                            </div>
                            <button
                                onClick={() => setUnassignableAlerts(prev => prev.filter(a => a.orderId !== alert.orderId))}
                                className="text-orange-400 hover:text-orange-600 ml-2 flex-shrink-0"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Contadores KDS (mockup A): el estado de la cocina de un vistazo.
                NUEVOS late en rojo cuando hay pedidos esperando decisión. Tocar
                un contador te lleva a la lista de activos. ── */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    type="button"
                    onClick={() => setFilter("active")}
                    className={`rounded-2xl py-3 px-1 text-center border-2 transition ${
                        kdsNew > 0
                            ? "bg-[#e60012] border-[#e60012] text-white kds-pulse"
                            : "bg-white border-gray-100 text-gray-400"
                    }`}
                >
                    <span className="block text-3xl font-black leading-none">{kdsNew}</span>
                    <span className="block text-[11px] font-extrabold tracking-wide mt-1">NUEVOS</span>
                </button>
                <button
                    type="button"
                    onClick={() => setFilter("active")}
                    className={`rounded-2xl py-3 px-1 text-center border-2 transition ${
                        kdsPrep > 0
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-white border-gray-100 text-gray-400"
                    }`}
                >
                    <span className="block text-3xl font-black leading-none">{kdsPrep}</span>
                    <span className="block text-[11px] font-extrabold tracking-wide mt-1">EN PREPARACIÓN</span>
                </button>
                <button
                    type="button"
                    onClick={() => setFilter("active")}
                    className={`rounded-2xl py-3 px-1 text-center border-2 transition ${
                        kdsReady > 0
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-white border-gray-100 text-gray-400"
                    }`}
                >
                    <span className="block text-3xl font-black leading-none">{kdsReady}</span>
                    <span className="block text-[11px] font-extrabold tracking-wide mt-1">LISTOS · EN CALLE</span>
                </button>
            </div>

            {/* Archivo + filtros: los contadores KDS de arriba son el estado de HOY;
                estas chips son el ARCHIVO (historial de ventas, fallidos, todo) —
                secundarias a propósito (founder 07-26: "ya no merecen protagonismo"). */}
            {/* Vista y filtros (founder 07-26, 3er intento): NADA de chips
                chiquitas con scroll — la vista (Activos/Completados/Fallidos/
                Todos) se elige DENTRO del panel con botones grandes. Afuera solo
                queda el botón y, si no estás en Activos (la cocina), un aviso
                "Viendo: X" con ✕ para volver de un toque. */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition ${
                        showFilters || dateFrom || dateTo || minAmount || maxAmount
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Vista y filtros
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </button>
                {filter !== "active" && (
                    <button
                        onClick={() => setFilter("active")}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-gray-900 text-white"
                        title="Volver a los pedidos activos"
                    >
                        Viendo: {filter === "completed" ? "Completados" : filter === "failed" ? "Fallidos" : "Todos"}
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
                {(dateFrom || dateTo || minAmount || maxAmount) && (
                    <button
                        onClick={() => { setDateFrom(""); setDateTo(""); setMinAmount(""); setMaxAmount(""); }}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition"
                    >
                        <X className="w-3 h-3" /> Limpiar
                    </button>
                )}
            </div>
            {showFilters && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
                    <div>
                        <p className="text-[11px] font-black tracking-wide text-gray-400 mb-2">QUÉ VER</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: "active", label: "Activos", count: orders.filter(o => isActiveStatus(o.status)).length },
                                { key: "completed", label: "Completados", count: orders.filter(o => completedStatuses.includes(o.status)).length },
                                { key: "failed", label: "Fallidos", count: orders.filter(o => failedStatuses.includes(o.status)).length },
                                { key: "all", label: "Todos", count: orders.length },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => { setFilter(tab.key as typeof filter); setShowFilters(false); }}
                                    className={`py-2.5 px-3 rounded-xl text-sm font-bold transition ${
                                        filter === tab.key
                                            ? tab.key === "failed"
                                                ? "bg-red-600 text-white"
                                                : "bg-gray-900 text-white"
                                            : tab.key === "failed" && tab.count > 0
                                                ? "bg-red-50 text-red-600"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Desde</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Monto mínimo</label>
                        <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="$0" min="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Monto máximo</label>
                        <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="$∞" min="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    </div>
                </div>
            )}

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-600 mb-2">
                        {filter === "active" ? "No hay pedidos activos" : "No hay pedidos"}
                    </h2>
                    <p className="text-gray-400 text-sm">Los nuevos pedidos aparecerán aquí automáticamente</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const status = statusConfig[order.status] || statusConfig.PENDING;
                        const isUpdating = updating === order.id;
                        const isPending = order.status === "PENDING";

                        // Acordeón (mockup B): los que piden acción llegan ABIERTOS,
                        // el resto colapsado; toggledCards invierte el default (XOR).
                        const isExpanded = needsAction(order.status) !== toggledCards.has(order.id);
                        const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);

                        return (
                            <div
                                key={order.id}
                                className={`bg-white rounded-2xl overflow-hidden border border-gray-100 border-l-[6px] shadow-sm ${kdsBorder(order.status)} ${
                                    needsAction(order.status) ? "kds-pulse" : ""
                                }`}
                            >
                                {/* Cabecera SIEMPRE visible: número grande · cliente · antigüedad ·
                                    estado. Tocarla abre/cierra el detalle hacia abajo. */}
                                <button
                                    type="button"
                                    onClick={() => toggleCard(order.id)}
                                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-2"
                                >
                                    <div className="min-w-0">
                                        <p className="text-[17px] font-black text-gray-900 truncate">
                                            {order.orderNumber} · {order.user?.name || "Cliente"}
                                        </p>
                                        <p className="text-xs text-gray-400 font-semibold mt-0.5">
                                            {timeAgo(order.createdAt)} · {itemCount} ítem{itemCount === 1 ? "" : "s"} · {formatPrice(getMerchantSale(order))}
                                        </p>
                                    </div>
                                    <span className="flex items-center gap-1.5 flex-shrink-0">
                                        <span className={`inline-flex items-center gap-1 text-[11.5px] font-black px-2.5 py-1 rounded-full ${status.bgColor} ${status.color} ${needsAction(order.status) ? "kds-blink" : ""}`}>
                                            {status.label}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                    </span>
                                </button>

                                {/* Detalle desplegable */}
                                {isExpanded && (
                                <div className="p-4 pt-3 border-t border-dashed border-gray-100">
                                    {/* Banner de fallo: cuando un pedido fue cancelado / rechazado / o no tuvo
                                        repartidor, mostramos un bloque rojo con el motivo para que el comercio
                                        entienda QUÉ pasó sin salir de esta tarjeta. */}
                                    {failedStatuses.includes(order.status) && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-semibold text-red-800">
                                                    {order.status === "UNASSIGNABLE" && "No conseguimos repartidor para este pedido"}
                                                    {order.status === "CANCELLED" && "Pedido cancelado"}
                                                    {order.status === "REJECTED" && "Pedido rechazado"}
                                                </p>
                                                {order.cancelReason && (
                                                    <p className="text-red-700 mt-0.5">{order.cancelReason}</p>
                                                )}
                                                {order.status === "UNASSIGNABLE" && (
                                                    <p className="text-red-700 mt-0.5">
                                                        El equipo de soporte ya está al tanto. Si pagaste con MP, el reembolso se procesa automáticamente.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ISSUE-001: PIN de retiro — visible SOLO cuando el driver llegó.
                                        Single-vendor usa order.pickupPin; multi-vendor usa subOrders[].pickupPin
                                        (el backend ya sanitiza: nunca llega el PIN antes de DRIVER_ARRIVED). */}
                                    {order.pickupPin && order.deliveryStatus === "DRIVER_ARRIVED" && (
                                        <PickupPinBadge
                                            pin={order.pickupPin}
                                            driverName={order.driver?.user?.name ?? null}
                                        />
                                    )}
                                    {order.subOrders?.map((sub) =>
                                        sub.pickupPin && sub.deliveryStatus === "DRIVER_ARRIVED" ? (
                                            <PickupPinBadge
                                                key={sub.id}
                                                pin={sub.pickupPin}
                                                driverName={order.driver?.user?.name ?? null}
                                            />
                                        ) : null
                                    )}

                                    {/* Customer & Time */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900">{order.user?.name || "Cliente"}</p>
                                            {order.user?.phone && (
                                                <a href={`tel:${order.user.phone}`} className="text-sm text-blue-600 hover:underline">
                                                    {order.user.phone}
                                                </a>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {/* Rama feat/comercio-ux-guardar-y-totales: el comercio ve "Tu venta"
                                                (lo que le compraron) y debajo "Cobrás" (neto post-comisión).
                                                NUNCA mostrar order.total porque incluye el envío del repartidor. */}
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tu venta</p>
                                            <p className="text-lg font-bold text-blue-600 leading-tight">{formatPrice(getMerchantSale(order))}</p>
                                            {(() => {
                                                const info = getMerchantPayoutInfo(order);
                                                if (!info) return null;
                                                return (
                                                    <p className="text-[11px] font-semibold text-emerald-700 leading-tight mt-0.5">
                                                        Cobrás {formatPrice(info.payout)}
                                                        <span className="text-gray-400 font-medium ml-1">
                                                            (-{info.commissionPercent}%)
                                                        </span>
                                                    </p>
                                                );
                                            })()}
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatTime(order.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items Summary */}
                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Productos:</p>
                                        <ul className="text-sm text-gray-700 space-y-1">
                                            {order.items.map((item) => (
                                                <li key={item.id} className="flex justify-between">
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span className="text-gray-500">{formatPrice(item.price * item.quantity)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Address */}
                                    {order.address && (
                                        <p className="text-xs text-gray-400 mb-4">
                                            📍 {order.address.street} {order.address.number}, {order.address.city}
                                        </p>
                                    )}

                                    {/* Timeout countdown for PENDING */}
                                    {isPending && (
                                        <PendingCountdown
                                            createdAt={order.createdAt}
                                            timeoutSeconds={confirmTimeout}
                                            onExpire={() => setExpiredOrders(prev => new Set(prev).add(order.id))}
                                        />
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 flex-wrap">
                                        {/* Aceptar — disponible para PENDING (cash) y CONFIRMED (MP-paid).
                                            Para PENDING se valida timeout; para CONFIRMED el pago ya está hecho. */}
                                        {(order.status === "PENDING" || order.status === "CONFIRMED") && !expiredOrders.has(order.id) && (
                                            <button
                                                onClick={() => confirmOrder(order.id)}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                            >
                                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                {order.status === "CONFIRMED" ? "Aceptar y empezar a preparar" : "Aceptar"}
                                            </button>
                                        )}

                                        {/* Confirmar reserva — para pedidos programados aún no confirmados */}
                                        {order.status === "SCHEDULED" && (
                                            <button
                                                onClick={() => confirmScheduled(order.id)}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition flex items-center justify-center gap-2"
                                            >
                                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                                                Confirmar reserva
                                            </button>
                                        )}

                                        {(order.status === "PREPARING" || order.status === "DRIVER_ASSIGNED") && (
                                            <button
                                                onClick={() => markReady(order.id)}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                                            >
                                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                {order.isPickup ? "Listo para que el cliente retire" : "Listo para Retirar"}
                                            </button>
                                        )}

                                        {/* Pickup self-contained: cuando el cliente vino y retiró, cerrar la operación */}
                                        {order.status === "READY" && order.isPickup && (
                                            <button
                                                onClick={() => markPickedUpByCustomer(order.id)}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                                            >
                                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                Marcar entregado al cliente
                                            </button>
                                        )}

                                        {/* Reject — extendido a CONFIRMED (MP-paid) y SCHEDULED/SCHEDULED_CONFIRMED. */}
                                        {["PENDING", "CONFIRMED", "PREPARING", "SCHEDULED", "SCHEDULED_CONFIRMED"].includes(order.status) && (
                                            <button
                                                onClick={() => openCancelModal(order.id, order.orderNumber)}
                                                disabled={isUpdating}
                                                className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                                                title="Rechazar Pedido"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        )}

                                        {/* Imprimir ticket (no fiscal) — para abrochar a la bolsa.
                                            Disponible siempre (reimprimir un entregado también sirve). */}
                                        <button
                                            onClick={() => {
                                                if (!printOrderTicket(order)) {
                                                    toast.error("Permití las ventanas emergentes para poder imprimir el ticket");
                                                }
                                            }}
                                            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                                            title="Imprimir ticket del pedido"
                                        >
                                            <Printer className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Chat con comprador */}
                                    {!["DELIVERED", "CANCELLED"].includes(order.status) && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                                            <OrderChatPanel
                                                orderId={order.id}
                                                orderNumber={order.orderNumber}
                                                chatType="BUYER_MERCHANT"
                                                counterpartName={order.user?.name || "Comprador"}
                                                userRole="merchant"
                                                compact
                                            />
                                            {/* Chat con repartidor — solo si ya fue asignado */}
                                            {order.driver?.user?.name && (
                                                <OrderChatPanel
                                                    orderId={order.id}
                                                    orderNumber={order.orderNumber}
                                                    chatType="DRIVER_MERCHANT"
                                                    counterpartName={order.driver.user.name}
                                                    userRole="merchant"
                                                    compact
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Hidden audio element for notification sound */}
            <audio ref={audioRef} src="/sounds/new-order.wav" preload="auto" />

            {/* Cancellation Modal */}
            {cancelModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Cancelar Pedido</h3>
                                <p className="text-sm text-gray-500">{cancelModal.orderNumber}</p>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-4">
                            Seleccioná el motivo de la cancelación:
                        </p>

                        <div className="space-y-2 mb-4">
                            {CANCELLATION_REASONS.map((reason) => (
                                <label
                                    key={reason}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedReason === reason
                                        ? "border-red-500 bg-red-50"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                        className="text-red-600"
                                    />
                                    <span className="text-sm text-gray-700">{reason}</span>
                                </label>
                            ))}
                            <label
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedReason === "Otro motivo"
                                    ? "border-red-500 bg-red-50"
                                    : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="cancelReason"
                                    value="Otro motivo"
                                    checked={selectedReason === "Otro motivo"}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="text-red-600"
                                />
                                <span className="text-sm text-gray-700">Otro motivo</span>
                            </label>
                        </div>

                        {selectedReason === "Otro motivo" && (
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Escribí el motivo de la cancelación..."
                                rows={3}
                                className="w-full p-3 border border-gray-200 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={closeCancelModal}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium"
                                disabled={isCancelling}
                            >
                                Volver
                            </button>
                            <button
                                onClick={confirmCancellation}
                                disabled={isCancelling || !selectedReason || (selectedReason === "Otro motivo" && !customReason.trim())}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCancelling ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <XCircle className="w-4 h-4" />
                                )}
                                Confirmar Cancelación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
