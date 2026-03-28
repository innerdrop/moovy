"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Crown,
  Flame,
  Sparkles,
  Image as ImageIcon,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowRight,
  BadgePercent,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  Copy,
  Building2,
} from "lucide-react";
import { toast } from "@/store/toast";
import { confirm } from "@/store/confirm";

interface AdPlacement {
  id: string;
  type: string;
  status: string;
  amount: number;
  originalAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  notes: string | null;
  rejectionReason: string | null;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

interface AdTypeConfig {
  label: string;
  priceField: string;
}

interface Pricing {
  placements: AdPlacement[];
  pricing: Record<string, number>;
  adTypes: Record<string, AdTypeConfig>;
  settings: {
    adLaunchDiscountPercent?: number;
  };
}

const TYPE_ICONS: Record<string, any> = {
  DESTACADO_PLATINO: Crown,
  DESTACADO_DESTACADO: Flame,
  DESTACADO_PREMIUM: Sparkles,
  HERO_BANNER: ImageIcon,
  BANNER_PROMO: Megaphone,
  PRODUCTO: ShoppingBag,
};

const TYPE_COLORS: Record<
  string,
  { bg: string; border: string; text: string; badge: string }
> = {
  DESTACADO_PLATINO: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800",
  },
  DESTACADO_DESTACADO: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-800",
  },
  DESTACADO_PREMIUM: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800",
  },
  HERO_BANNER: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
  },
  BANNER_PROMO: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-800",
  },
  PRODUCTO: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    badge: "bg-green-100 text-green-800",
  },
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  DESTACADO_PLATINO:
    "Sección Destacados en la home — Posición #1 garantizada. Tu comercio aparece primero en la sección premium con badge dorado ⭐ y borde luminoso.",
  DESTACADO_DESTACADO:
    "Sección Destacados en la home — Entre los primeros 3. Tu comercio aparece con badge 🔥 y borde naranja destacado.",
  DESTACADO_PREMIUM:
    "Sección Destacados en la home — Posición preferencial con badge ✨ Premium y borde azul.",
  HERO_BANNER:
    "Banner principal rotativo — Full-width en la parte superior de la home. Tu imagen promocional (1200x500px) con texto y botón de acción.",
  BANNER_PROMO:
    "Banner promocional — Full-width debajo de las categorías. Imagen personalizada (1200x400px) con texto overlay y CTA.",
  PRODUCTO:
    "Sección 'Lo más pedido' — Tu producto aparece con badge 'Destacado' en la grid de productos populares de la home.",
};

const TYPE_BENEFITS: Record<string, string[]> = {
  DESTACADO_PLATINO: [
    "Posición #1 garantizada en la sección destacados",
    "Badge premium visible para todos los compradores",
    "Máxima visibilidad y confianza premium",
    "Aparecés primero en recomendaciones",
  ],
  DESTACADO_DESTACADO: [
    "Posición entre los primeros 3 destacados",
    "Badge 🔥 visible en tu comercio",
    "Mayor visibilidad que la versión Premium",
    "Destacado en categorías principales",
  ],
  DESTACADO_PREMIUM: [
    "Posición preferencial en la sección destacados",
    "Badge ✨ Premium en tu perfil",
    "Mayor visibilidad en búsquedas",
    "Atrae a compradores dispuestos a gastar más",
  ],
  HERO_BANNER: [
    "Banner full-width en la parte superior de la home",
    "Máxima visibilidad (above the fold)",
    "Diseño personalizado con tu marca y CTA",
    "Máximo 3 comercios simultáneos — garantía de impacto",
  ],
  BANNER_PROMO: [
    "Banner horizontal en zona estratégica de la home",
    "Visible para 100% de los usuarios que acceden",
    "Ideal para promociones, ofertas y lanzamientos",
    "CTA directo a tu comercio",
  ],
  PRODUCTO: [
    "Tu producto en la sección 'Lo más pedido'",
    "Badge 'Destacado' llamativo en la grilla",
    "Hasta 12 productos simultáneos en catálogo",
    "Ideal para lanzamientos, ofertas y liquidaciones",
  ],
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  PENDING: {
    label: "Pendiente",
    icon: Clock,
    color: "text-amber-600 bg-amber-50",
  },
  APPROVED: {
    label: "Aprobada",
    icon: CheckCircle2,
    color: "text-blue-600 bg-blue-50",
  },
  ACTIVE: {
    label: "Activo",
    icon: CheckCircle2,
    color: "text-green-600 bg-green-50",
  },
  EXPIRED: {
    label: "Expirado",
    icon: AlertCircle,
    color: "text-gray-500 bg-gray-50",
  },
  CANCELLED: {
    label: "Cancelado",
    icon: XCircle,
    color: "text-gray-500 bg-gray-50",
  },
  REJECTED: {
    label: "Rechazado",
    icon: XCircle,
    color: "text-red-600 bg-red-50",
  },
};

function formatPrice(amount: number): string {
  return `$${amount.toLocaleString("es-AR")}`;
}

function daysRemaining(endsAt: string): number {
  return Math.max(
    0,
    Math.ceil(
      (new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface RequestModalProps {
  type: string;
  price: number;
  originalPrice: number | null;
  config: AdTypeConfig;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string, paymentMethod: string) => void;
  isLoading: boolean;
}

function BankInfoCard({ bankInfo, amount }: { bankInfo: { bankName: string; bankAccountHolder: string; bankCbu: string; bankAlias: string; bankCuit: string }; amount: number }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3 space-y-3">
      <div className="flex items-center gap-2 text-blue-800">
        <Building2 className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wide">Datos para transferencia</span>
      </div>

      <div className="space-y-2">
        {bankInfo.bankName && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-700">Banco</span>
            <span className="text-xs font-semibold text-blue-900">{bankInfo.bankName}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-xs text-blue-700">Titular</span>
          <span className="text-xs font-semibold text-blue-900">{bankInfo.bankAccountHolder}</span>
        </div>
        {bankInfo.bankCbu && (
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs text-blue-700">CBU</span>
            <button
              onClick={() => copyToClipboard(bankInfo.bankCbu, "cbu")}
              className="flex items-center gap-1.5 text-xs font-mono font-semibold text-blue-900 hover:text-blue-700 transition"
            >
              {bankInfo.bankCbu}
              <Copy className="w-3 h-3 flex-shrink-0" />
              {copied === "cbu" && <span className="text-[10px] text-green-600 font-sans">Copiado</span>}
            </button>
          </div>
        )}
        {bankInfo.bankAlias && (
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs text-blue-700">Alias</span>
            <button
              onClick={() => copyToClipboard(bankInfo.bankAlias, "alias")}
              className="flex items-center gap-1.5 text-xs font-mono font-semibold text-blue-900 hover:text-blue-700 transition"
            >
              {bankInfo.bankAlias}
              <Copy className="w-3 h-3 flex-shrink-0" />
              {copied === "alias" && <span className="text-[10px] text-green-600 font-sans">Copiado</span>}
            </button>
          </div>
        )}
        {bankInfo.bankCuit && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-700">CUIT</span>
            <span className="text-xs font-semibold text-blue-900">{bankInfo.bankCuit}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-blue-200">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-blue-800">Monto a transferir</span>
          <span className="text-sm font-black text-blue-900">{formatPrice(amount)}</span>
        </div>
        <p className="text-[10px] text-blue-600 mt-1">
          Incluí tu nombre de comercio en el concepto de la transferencia para que podamos identificarla rápidamente.
        </p>
      </div>
    </div>
  );
}

function RequestModal({
  type,
  price,
  originalPrice,
  config,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: RequestModalProps) {
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mercadopago");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
        <div>
          <h3 className="text-lg font-black text-gray-900">
            Confirmar solicitud
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {config.label}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-600">Precio mensual:</span>
            <div className="text-right">
              <span className="text-xl font-black text-gray-900">
                {formatPrice(price)}
              </span>
              {originalPrice && (
                <p className="text-xs text-gray-400 line-through">
                  {formatPrice(originalPrice)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Método de pago */}
        <div>
          <label className="text-sm font-bold text-gray-900 mb-2 block">
            Método de pago
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("mercadopago")}
              className={`p-3 rounded-xl border-2 text-left transition ${
                paymentMethod === "mercadopago"
                  ? "border-[#e60012] bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-bold text-gray-900">MercadoPago</p>
              <p className="text-[11px] text-green-600 font-medium mt-0.5">Activación inmediata</p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("transferencia")}
              className={`p-3 rounded-xl border-2 text-left transition ${
                paymentMethod === "transferencia"
                  ? "border-[#e60012] bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-bold text-gray-900">Transferencia</p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Activa al confirmar pago</p>
            </button>
          </div>
          {paymentMethod === "transferencia" && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mt-2">
              Al elegir transferencia, tu anuncio se activará una vez que nuestro equipo confirme la recepción del pago.
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-bold text-gray-900 mb-2 block">
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contanos más sobre tu idea o incluí cualquier detalle que consideres relevante..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e60012]"
          />
          <p className="text-xs text-gray-400 mt-1">
            {notes.length}/500
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(notes, paymentMethod)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#e60012] text-white rounded-xl text-sm font-bold hover:bg-[#cc000f] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Solicitar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <span className="font-bold text-sm text-gray-900">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-700 space-y-2">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicidadPage() {
  const [data, setData] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/merchant/ad-placements");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestClick = (type: string) => {
    setSelectedType(type);
    setModalOpen(true);
  };

  const handleConfirmRequest = async (notes: string, paymentMethod: string) => {
    if (!selectedType) return;

    setRequesting(selectedType);
    setMessage(null);

    try {
      const res = await fetch("/api/merchant/ad-placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType, notes: notes || undefined, paymentMethod }),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: result.message || "Solicitud enviada correctamente",
        });
        setModalOpen(false);
        setSelectedType(null);
        fetchData();
      } else {
        setMessage({
          type: "error",
          text: result.error || "Error al enviar solicitud",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setRequesting(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleCancelPlacement = async (placementId: string) => {
    const ok = await confirm({
      title: "Cancelar solicitud",
      message: "¿Cancelar esta solicitud de publicidad? Podrás solicitar un nuevo espacio cuando quieras.",
      confirmLabel: "Sí, cancelar",
      variant: "danger",
    });
    if (!ok) return;

    setCancellingId(placementId);
    try {
      const res = await fetch(`/api/merchant/ad-placements/${placementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || "Solicitud cancelada");
        fetchData();
      } else {
        toast.error(result.error || "Error al cancelar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-semibold">No se pudo cargar la información</p>
      </div>
    );
  }

  const { placements, pricing, adTypes, settings, bankInfo } = data;
  const discountPercent = settings?.adLaunchDiscountPercent ?? 0;

  const activePlacements = placements.filter((p) => p.status === "ACTIVE");
  const pendingPlacements = placements.filter((p) =>
    ["PENDING", "APPROVED"].includes(p.status)
  );
  const pastPlacements = placements.filter((p) =>
    ["EXPIRED", "CANCELLED", "REJECTED"].includes(p.status)
  );

  const occupiedTypes = new Set(
    placements
      .filter((p) => ["PENDING", "APPROVED", "ACTIVE"].includes(p.status))
      .map((p) => p.type)
  );

  return (
    <div className="space-y-8 max-w-6xl">
      {/* SECTION A: Header con stats */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e60012] to-[#cc000f] flex items-center justify-center shadow-lg">
            <Megaphone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Tu Publicidad</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
              Espacios publicitarios para tu comercio
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-bold uppercase">
              Activos
            </p>
            <p className="text-2xl font-black text-green-600 mt-1">
              {activePlacements.length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-bold uppercase">
              Pendientes
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {pendingPlacements.length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-bold uppercase">
              Todos
            </p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {placements.length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-bold uppercase">
              Gasto mensual
            </p>
            <p className="text-2xl font-black text-[#e60012] mt-1">
              {formatPrice(
                activePlacements.reduce((sum, p) => sum + p.amount, 0)
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Discount banner */}
      {discountPercent > 0 && (
        <div className="bg-gradient-to-r from-[#e60012] to-[#ff4d5e] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <BadgePercent className="w-6 h-6" />
            <h3 className="font-black text-lg">
              Descuento de lanzamiento: {discountPercent}% OFF
            </h3>
          </div>
          <p className="text-white/80 text-sm">
            Por ser de los primeros comercios en MOOVY, todos los espacios
            publicitarios tienen un {discountPercent}% de descuento durante los
            primeros 3 meses.
          </p>
        </div>
      )}

      {/* SECTION B: Active Placements */}
      {activePlacements.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Tus Espacios Activos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePlacements.map((p) => {
              const colors = TYPE_COLORS[p.type] || TYPE_COLORS.PRODUCTO;
              const Icon = TYPE_ICONS[p.type] || ShoppingBag;
              const days = p.endsAt ? daysRemaining(p.endsAt) : 0;
              const totalDays = p.startsAt && p.endsAt
                ? Math.ceil(
                    (new Date(p.endsAt).getTime() -
                      new Date(p.startsAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 30;
              const progressPercent = ((totalDays - days) / totalDays) * 100;

              return (
                <div
                  key={p.id}
                  className={`${colors.bg} border ${colors.border} rounded-2xl p-5`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-lg ${colors.badge} flex items-center justify-center`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">
                          {adTypes[p.type]?.label || p.type}
                        </h3>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      ✓ Activo
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-gray-600">
                        {days} día{days !== 1 ? "s" : ""} restante{days !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(progressPercent)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${colors.text}`}
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {p.startsAt && formatDate(p.startsAt)} -{" "}
                      {p.endsAt && formatDate(p.endsAt)}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-300 border-opacity-30">
                    <p className="text-xs text-gray-600">
                      Inversión: <span className="font-bold">{formatPrice(p.amount)}/mes</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION C: Ad Catalog */}
      <div>
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Catálogo de Espacios Publicitarios
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(adTypes).map(([type, config]) => {
            const colors =
              TYPE_COLORS[type] || TYPE_COLORS.PRODUCTO;
            const Icon = TYPE_ICONS[type] || ShoppingBag;
            const originalPrice = pricing[type] ?? 0;
            const finalPrice =
              discountPercent > 0
                ? Math.round(originalPrice * (1 - discountPercent / 100))
                : originalPrice;
            const benefits = TYPE_BENEFITS[type] || [];
            const description = TYPE_DESCRIPTIONS[type] || "";
            const isOccupied = occupiedTypes.has(type);
            const isRequesting = requesting === type;

            return (
              <div
                key={type}
                className={`${colors.bg} border ${colors.border} rounded-2xl p-5 flex flex-col`}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl ${colors.badge} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-gray-900 break-words">
                      {config.label}
                    </h3>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-gray-900">
                      {formatPrice(finalPrice)}
                    </span>
                    <span className="text-xs text-gray-500">/mes</span>
                  </div>
                  {discountPercent > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-gray-700 mb-4 leading-relaxed bg-white/60 rounded-lg p-2.5">
                  {description}
                </p>

                {/* Benefits */}
                <ul className="space-y-1.5 mb-5 flex-1">
                  {benefits.map((b, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-700 flex items-start gap-2"
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${colors.text}`}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isOccupied ? (
                  <div className="text-center py-2.5 text-xs font-bold text-gray-400 bg-gray-100 rounded-xl">
                    Ya solicitado
                  </div>
                ) : (
                  <button
                    onClick={() => handleRequestClick(type)}
                    disabled={isRequesting}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-1.5 ${
                      isRequesting
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-[#e60012] hover:bg-[#cc000f] active:scale-[0.98]"
                    }`}
                  >
                    {isRequesting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Solicitar
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION D: How it works */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="font-black text-lg text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#e60012]" />
          ¿Cómo funciona?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "1",
              title: "Elegí tu espacio",
              desc: "Explorá el catálogo y seleccioná el tipo que mejor se adapte a tu negocio",
            },
            {
              step: "2",
              title: "Enviá tu solicitud",
              desc: "Nuestro equipo revisa y aprueba tu solicitud",
            },
            {
              step: "3",
              title: "Coordinamos el pago",
              desc: "Pagá con MercadoPago (activación inmediata) o transferencia bancaria",
            },
            {
              step: "4",
              title: "Tu anuncio se activa",
              desc: "Recibís notificación y tu comercio gana visibilidad inmediata",
            },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#e60012] text-white font-black text-sm flex items-center justify-center mx-auto mb-3 shadow-md">
                {s.step}
              </div>
              <h4 className="font-bold text-sm text-gray-900 mb-2">
                {s.title}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION E: Pending Requests */}
      {pendingPlacements.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Solicitudes Pendientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPlacements.map((p) => {
              const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusCfg.icon;
              const colors =
                TYPE_COLORS[p.type] || TYPE_COLORS.PRODUCTO;

              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-gray-900">
                      {adTypes[p.type]?.label || p.type}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusCfg.color}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {p.status === "APPROVED" && p.paymentMethod === "transferencia"
                      ? "Aprobada — realizá la transferencia para activar tu anuncio"
                      : p.status === "APPROVED"
                      ? "Aprobada — coordinando pago con el equipo MOOVY"
                      : "Nuestro equipo está revisando tu solicitud"}
                  </p>

                  {/* Card datos bancarios para transferencia APPROVED */}
                  {p.status === "APPROVED" && p.paymentMethod === "transferencia" && bankInfo && (
                    <BankInfoCard bankInfo={bankInfo} amount={p.amount} />
                  )}

                  <div className="flex items-baseline justify-between pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500">Monto:</span>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">
                        {formatPrice(p.amount)}/mes
                      </p>
                      {p.originalAmount && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(p.originalAmount)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón cancelar — solo para PENDING */}
                  {p.status === "PENDING" && (
                    <button
                      onClick={() => handleCancelPlacement(p.id)}
                      disabled={cancellingId === p.id}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition disabled:opacity-50"
                    >
                      {cancellingId === p.id ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelando...</>
                      ) : (
                        <><XCircle className="w-3.5 h-3.5" /> Cancelar solicitud</>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION F: History */}
      {pastPlacements.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
            Historial
          </h2>
          <div className="space-y-2">
            {pastPlacements.map((p) => {
              const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.EXPIRED;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div>
                    <span className="font-medium text-sm text-gray-700">
                      {adTypes[p.type]?.label || p.type}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(p.createdAt)}
                      {p.rejectionReason && ` — ${p.rejectionReason}`}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${statusCfg.color}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION G: Terms */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
          Términos de Publicidad
        </h2>
        <div className="space-y-2">
          <AccordionItem title="Duración mínima según plan contratado">
            <p>
              La duración mínima de cada espacio publicitario es de 1 mes. Los
              descuentos de lanzamiento aplican para los primeros 3 meses de
              contratación. Después de finalizado el período, podés renovar tu
              publicidad en cualquier momento.
            </p>
          </AccordionItem>

          <AccordionItem title="Cancelación gratuita dentro de 48 horas">
            <p>
              Si cambias de opinión, podés cancelar tu solicitud sin costo
              durante las primeras 48 horas después de enviarla. Después de ese
              período, se aplican las políticas de cancelación estándar.
            </p>
          </AccordionItem>

          <AccordionItem title="No se garantizan ventas o conversiones">
            <p>
              Los espacios publicitarios están diseñados para aumentar la
              visibilidad de tu comercio. Sin embargo, no podemos garantizar
              aumentos específicos en ventas o conversiones. Los resultados
              dependen de diversos factores como la calidad de tu ofertas, la
              competencia y el comportamiento del mercado.
            </p>
          </AccordionItem>

          <AccordionItem title="Aprobación y rechazo de solicitudes">
            <p>
              MOOVY se reserva el derecho de aprobar, rechazar o cancelar
              cualquier solicitud de publicidad. Podemos rechazar aquellas que
              violen nuestras políticas de contenido, marca o que tengan
              inconsistencias con nuestras normativas de calidad.
            </p>
          </AccordionItem>

          <AccordionItem title="Contenido y marca">
            <p>
              Todo contenido publicitario debe ser propiedad tuya o tener
              licencia para usarlo. Tu comercio es responsable de que las
              imágenes, textos y CTA cumplan con la ley y nuestras políticas.
              MOOVY no se hace responsable de violaciones de marca o copyright.
            </p>
          </AccordionItem>

          <AccordionItem title="Modificaciones en las políticas">
            <p>
              MOOVY puede cambiar estas políticas en cualquier momento. Te
              notificaremos de cambios significativos con al menos 30 días de
              anticipación. El continuar usando nuestros servicios de publicidad
              implica aceptación de los nuevos términos.
            </p>
          </AccordionItem>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs text-blue-700">
            Para más información, consultá nuestros{" "}
            <a
              href="/terminos-comercio"
              className="font-bold underline hover:text-blue-800"
            >
              términos y condiciones de publicidad
            </a>
            .
          </p>
        </div>
      </div>

      {/* Request Modal */}
      {selectedType && (
        <RequestModal
          type={selectedType}
          price={
            discountPercent > 0
              ? Math.round(
                  (pricing[selectedType] ?? 0) *
                    (1 - discountPercent / 100)
                )
              : pricing[selectedType] ?? 0
          }
          originalPrice={discountPercent > 0 ? (pricing[selectedType] ?? null) : null}
          config={adTypes[selectedType] || { label: selectedType, priceField: "" }}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedType(null);
          }}
          onConfirm={handleConfirmRequest}
          isLoading={requesting === selectedType}
        />
      )}
    </div>
  );
}