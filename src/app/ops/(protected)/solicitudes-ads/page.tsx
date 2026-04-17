"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/store/toast";
import { confirm } from "@/store/confirm";
import {
  Megaphone,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Play,
  ThumbsUp,
  ThumbsDown,
  Ban,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  CreditCard,
  ExternalLink,
  MessageCircle,
} from "lucide-react";

interface Merchant {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  isPremium: boolean;
  premiumTier: string | null;
  premiumUntil: string | null;
  phone: string | null;
  email: string | null;
  whatsappNumber: string | null;
}

interface AdPlacement {
  id: string;
  merchantId: string;
  type: string;
  status: string;
  amount: number;
  originalAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  notes: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  paymentStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  approvedAt: string | null;
  activatedAt: string | null;
  merchant: Merchant;
}

interface AdType {
  id: string;
  name: string;
  label: string;
  location: string;
  format: string;
  price: number;
  maxSlots: number;
  color: string;
  bgColor: string;
  textColor: string;
}

const AD_TYPES: Record<string, AdType> = {
  DESTACADO_PLATINO: {
    id: "DESTACADO_PLATINO",
    name: "Destacado Platino",
    label: "Platino",
    location: "Top de la sección Destacados en el home",
    format: "Logo + nombre (120x120px)",
    price: 150000,
    maxSlots: 1,
    color: "from-amber-500 to-yellow-500",
    bgColor: "bg-amber-100",
    textColor: "text-amber-800",
  },
  DESTACADO_DESTACADO: {
    id: "DESTACADO_DESTACADO",
    name: "Destacado Premium",
    label: "Destacado",
    location: "Posición 2-3 en sección Destacados",
    format: "Logo + nombre (100x100px)",
    price: 95000,
    maxSlots: 2,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
  },
  DESTACADO_PREMIUM: {
    id: "DESTACADO_PREMIUM",
    name: "Destacado Plus",
    label: "Premium",
    location: "Sección Premium con badge",
    format: "Logo + badge (80x80px)",
    price: 55000,
    maxSlots: 5,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
  },
  HERO_BANNER: {
    id: "HERO_BANNER",
    name: "Hero Banner",
    label: "Hero Banner",
    location: "Sección superior full-width (above the fold)",
    format: "Full-width responsive (1200x400px)",
    price: 250000,
    maxSlots: 3,
    color: "from-red-600 to-rose-600",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
  },
  BANNER_PROMO: {
    id: "BANNER_PROMO",
    name: "Banner Promocional",
    label: "Banner Promo",
    location: "Sección media con CTA prominente",
    format: "Full-width con botón (1200x300px)",
    price: 180000,
    maxSlots: 4,
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-100",
    textColor: "text-pink-800",
  },
  PRODUCTO: {
    id: "PRODUCTO",
    name: "Producto Destacado",
    label: "Producto",
    location: "Zona de Productos recomendados",
    format: "Card con imagen (280x300px)",
    price: 25000,
    maxSlots: 12,
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-100",
    textColor: "text-violet-800",
  },
};

const TYPE_LABELS: Record<string, string> = {
  DESTACADO_PLATINO: "Platino",
  DESTACADO_DESTACADO: "Destacado",
  DESTACADO_PREMIUM: "Premium",
  HERO_BANNER: "Hero Banner",
  BANNER_PROMO: "Banner Promo",
  PRODUCTO: "Producto",
};

const TYPE_COLORS: Record<string, string> = {
  DESTACADO_PLATINO: "bg-amber-100 text-amber-800",
  DESTACADO_DESTACADO: "bg-orange-100 text-orange-800",
  DESTACADO_PREMIUM: "bg-blue-100 text-blue-800",
  HERO_BANNER: "bg-red-100 text-red-800",
  BANNER_PROMO: "bg-pink-100 text-pink-800",
  PRODUCTO: "bg-violet-100 text-violet-800",
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  PENDING: {
    label: "Pendiente",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  APPROVED: {
    label: "Aprobada",
    icon: ThumbsUp,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  ACTIVE: {
    label: "Activo",
    icon: CheckCircle,
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  EXPIRED: {
    label: "Expirado",
    icon: AlertCircle,
    color: "text-gray-500",
    bg: "bg-gray-50 border-gray-200",
  },
  CANCELLED: {
    label: "Cancelado",
    icon: Ban,
    color: "text-gray-500",
    bg: "bg-gray-50 border-gray-200",
  },
  REJECTED: {
    label: "Rechazado",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
};

const FILTER_OPTIONS = ["ALL", "PENDING", "APPROVED", "ACTIVE", "EXPIRED", "CANCELLED", "REJECTED"] as const;

function formatPrice(amount: number): string {
  return `$${amount.toLocaleString("es-AR")}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysRemaining(endsAt: string): number {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

// Collapsible Ad Guide Section
function AdGuideSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <Megaphone className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Guía de Espacios Publicitarios</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          <p className="text-xs text-gray-500">
            Esta tabla muestra dónde aparece cada espacio publicitario, sus especificaciones técnicas y capacidad máxima.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 uppercase tracking-wider text-xs">
                    Tipo
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 uppercase tracking-wider text-xs">
                    Ubicación
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 uppercase tracking-wider text-xs">
                    Formato
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-900 uppercase tracking-wider text-xs">
                    Precio/mes
                  </th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-900 uppercase tracking-wider text-xs">
                    Máx. Slots
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.values(AD_TYPES).map((type) => (
                  <tr key={type.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[type.id]}`}>
                        {type.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-700">{type.location}</td>
                    <td className="py-3 px-3 text-xs text-gray-700">{type.format}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900 text-xs">{formatPrice(type.price)}</td>
                    <td className="py-3 px-3 text-center text-xs text-gray-700">{type.maxSlots}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-900">
            <p className="font-semibold mb-1">Nota importante:</p>
            <p>
              Los precios mostrados incluyen el descuento de lanzamiento del 50% para los primeros 3 meses. Después de ese
              período, los precios regresan a la tarifa estándar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Ad Placement Card Component
function AdPlacementCard({
  placement,
  durationDays,
  setDurationDays,
  onAction,
  actionLoading,
  rejectionReasons,
  setRejectionReasons,
  paymentMethods,
  setPaymentMethods,
  adminNotes,
  setAdminNotes,
}: {
  placement: AdPlacement;
  durationDays: number;
  setDurationDays: (days: number) => void;
  onAction: (id: string, action: string, extra?: Record<string, any>) => Promise<void>;
  actionLoading: string | null;
  rejectionReasons: Record<string, string>;
  setRejectionReasons: (reasons: Record<string, string>) => void;
  paymentMethods: Record<string, string>;
  setPaymentMethods: (methods: Record<string, string>) => void;
  adminNotes: Record<string, string>;
  setAdminNotes: (notes: Record<string, string>) => void;
}) {
  const statusCfg = STATUS_CONFIG[placement.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;
  const typeColor = TYPE_COLORS[placement.type] || "bg-gray-100 text-gray-800";
  const isExpiringSoon = placement.endsAt && daysRemaining(placement.endsAt) <= 7;
  const daysLeft = placement.endsAt ? daysRemaining(placement.endsAt) : 0;
  const progress = placement.endsAt
    ? Math.max(0, Math.min(100, 100 - (daysRemaining(placement.endsAt) / 30) * 100))
    : 0;

  return (
    <div key={placement.id} className={`border rounded-xl p-5 shadow-sm bg-white ${statusCfg.bg}`}>
      {/* Top row - Merchant info and Status */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {placement.merchant.image ? (
              <img src={placement.merchant.image} alt={placement.merchant.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 truncate">{placement.merchant.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
                {TYPE_LABELS[placement.type] || placement.type}
              </span>
              <span className="text-xs text-gray-500">{formatDate(placement.createdAt)}</span>
            </div>
          </div>
        </div>
        <span
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 whitespace-nowrap ${statusCfg.color}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {statusCfg.label}
        </span>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-xs text-gray-700">
        <div className="flex items-start gap-2">
          <DollarSign className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-600" />
          <div>
            <span className="font-bold text-gray-900">{formatPrice(placement.amount)}</span>/mes
            {placement.originalAmount && (
              <span className="line-through text-gray-400 ml-1 block text-xs">{formatPrice(placement.originalAmount)}</span>
            )}
          </div>
        </div>

        {placement.merchant.whatsappNumber && (
          <a
            href={`https://wa.me/${placement.merchant.whatsappNumber.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-green-600 hover:underline"
          >
            <Phone className="w-4 h-4 flex-shrink-0" />
            WhatsApp
          </a>
        )}
        {placement.merchant.phone && !placement.merchant.whatsappNumber && (
          <span className="flex items-center gap-2">
            <Phone className="w-4 h-4 flex-shrink-0" />
            {placement.merchant.phone}
          </span>
        )}

        {placement.paymentMethod && (
          <span className="flex items-center gap-2 text-gray-600">
            <CreditCard className="w-4 h-4 flex-shrink-0" />
            {placement.paymentMethod}
          </span>
        )}
      </div>

      {/* Dates and progress */}
      {placement.startsAt && placement.endsAt && (
        <div className="mb-4">
          <div className={`text-xs ${isExpiringSoon ? "text-red-600 font-semibold" : "text-gray-600"}`}>
            {formatDate(placement.startsAt)} → {formatDate(placement.endsAt)}
            {placement.status === "ACTIVE" && ` (${daysLeft} días restantes)`}
          </div>
          {placement.status === "ACTIVE" && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-green-500 h-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Notes sections */}
      {placement.notes && (
        <div className="mb-3 p-3 bg-white rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1">Nota del comercio</p>
          <p className="text-xs text-gray-700">{placement.notes}</p>
        </div>
      )}

      {placement.rejectionReason && (
        <div className="mb-3 p-3 bg-red-50 rounded-xl border border-red-100">
          <p className="text-xs font-semibold text-red-900 uppercase tracking-wider mb-1">Motivo del rechazo</p>
          <p className="text-xs text-red-700">{placement.rejectionReason}</p>
        </div>
      )}

      {placement.adminNotes && (
        <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">Nota admin</p>
          <p className="text-xs text-blue-700">{placement.adminNotes}</p>
        </div>
      )}

      {/* Dynamic Actions */}
      <div className="space-y-3">
        {/* PENDING Status */}
        {placement.status === "PENDING" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onAction(placement.id, "approve")}
                disabled={actionLoading === `${placement.id}-approve`}
                className="flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 min-h-[44px]"
              >
                {actionLoading === `${placement.id}-approve` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ThumbsUp className="w-4 h-4" />
                )}
                Aprobar
              </button>

              <button
                onClick={() =>
                  onAction(placement.id, "activate", {
                    durationDays,
                    paymentMethod: paymentMethods[placement.id] || "Transferencia",
                    adminNotes: adminNotes[placement.id] || "",
                  })
                }
                disabled={actionLoading === `${placement.id}-activate`}
                className="flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50 min-h-[44px]"
              >
                {actionLoading === `${placement.id}-activate` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Activar Directo
              </button>
            </div>

            {/* Duration selector for activation */}
            <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-200">
              <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value))}
                className="flex-1 bg-transparent border-0 text-xs font-semibold text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value={7}>7 días</option>
                <option value={15}>15 días</option>
                <option value={30}>30 días (1 mes)</option>
                <option value={60}>60 días (2 meses)</option>
                <option value={90}>90 días (3 meses)</option>
              </select>
            </div>

            {/* Payment method selector */}
            <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-200">
              <CreditCard className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <select
                value={paymentMethods[placement.id] || "Transferencia"}
                onChange={(e) => setPaymentMethods({ ...paymentMethods, [placement.id]: e.target.value })}
                className="flex-1 bg-transparent border-0 text-xs font-semibold text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="Transferencia">Transferencia</option>
                <option value="MercadoPago">MercadoPago</option>
              </select>
            </div>

            {/* Admin notes textarea */}
            <textarea
              value={adminNotes[placement.id] || ""}
              onChange={(e) => setAdminNotes({ ...adminNotes, [placement.id]: e.target.value })}
              placeholder="Notas admin (opcional)..."
              className="w-full text-xs font-medium p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
              rows={2}
            />

            {/* Rejection reason textarea */}
            <textarea
              value={rejectionReasons[placement.id] || ""}
              onChange={(e) => setRejectionReasons({ ...rejectionReasons, [placement.id]: e.target.value })}
              placeholder="Razón del rechazo..."
              className="w-full text-xs font-medium p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
              rows={2}
            />

            <button
              onClick={() =>
                onAction(placement.id, "reject", {
                  rejectionReason: rejectionReasons[placement.id] || "Solicitud rechazada",
                })
              }
              disabled={actionLoading === `${placement.id}-reject`}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 bg-white text-red-600 text-xs font-semibold rounded-xl border border-red-200 hover:bg-red-50 transition disabled:opacity-50 min-h-[44px]"
            >
              {actionLoading === `${placement.id}-reject` ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ThumbsDown className="w-4 h-4" />
              )}
              Rechazar
            </button>
          </div>
        )}

        {/* APPROVED Status */}
        {placement.status === "APPROVED" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() =>
                  onAction(placement.id, "activate", {
                    durationDays,
                    paymentMethod: paymentMethods[placement.id] || "Transferencia",
                    adminNotes: adminNotes[placement.id] || "",
                  })
                }
                disabled={actionLoading === `${placement.id}-activate`}
                className="flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50 min-h-[44px]"
              >
                {actionLoading === `${placement.id}-activate` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Activar ({durationDays}d)
              </button>

              <button
                onClick={() => onAction(placement.id, "cancel")}
                disabled={actionLoading === `${placement.id}-cancel`}
                className="flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 bg-white text-gray-600 text-xs font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50 min-h-[44px]"
              >
                {actionLoading === `${placement.id}-cancel` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                Cancelar
              </button>
            </div>

            {/* Payment method selector */}
            <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-200">
              <CreditCard className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <select
                value={paymentMethods[placement.id] || "Transferencia"}
                onChange={(e) => setPaymentMethods({ ...paymentMethods, [placement.id]: e.target.value })}
                className="flex-1 bg-transparent border-0 text-xs font-semibold text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="Transferencia">Transferencia</option>
                <option value="MercadoPago">MercadoPago</option>
              </select>
            </div>

            {/* Admin notes */}
            <textarea
              value={adminNotes[placement.id] || ""}
              onChange={(e) => setAdminNotes({ ...adminNotes, [placement.id]: e.target.value })}
              placeholder="Notas admin (opcional)..."
              className="w-full text-xs font-medium p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
              rows={2}
            />
          </div>
        )}

        {/* ACTIVE Status */}
        {placement.status === "ACTIVE" && (
          <button
            onClick={() => onAction(placement.id, "cancel")}
            disabled={actionLoading === `${placement.id}-cancel`}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 bg-white text-red-600 text-xs font-semibold rounded-xl border border-red-200 hover:bg-red-50 transition disabled:opacity-50 min-h-[44px]"
          >
            {actionLoading === `${placement.id}-cancel` ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Ban className="w-4 h-4" />
            )}
            Cancelar Publicidad
          </button>
        )}

        {/* EXPIRED, CANCELLED, REJECTED - No actions */}
        {(placement.status === "EXPIRED" ||
          placement.status === "CANCELLED" ||
          placement.status === "REJECTED") && (
          <div className="p-3 bg-gray-50 rounded-xl text-center text-xs text-gray-600">
            No hay acciones disponibles para este estado
          </div>
        )}
      </div>
    </div>
  );
}

export default function SolicitudesAdsPage() {
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // Toast global + ConfirmModal (no more inline messages)
  const [durationDays, setDurationDays] = useState<number>(30);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const url = filter === "ALL" ? "/api/admin/ad-placements" : `/api/admin/ad-placements?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPlacements(data.placements || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ACTION_LABELS: Record<string, { title: string; msg: string; variant: "danger" | "warning" | "default" }> = {
    approve: { title: "Aprobar solicitud", msg: "¿Aprobar esta solicitud de publicidad?", variant: "default" },
    activate: { title: "Activar anuncio", msg: "El anuncio se hará visible de inmediato. ¿Confirmar?", variant: "warning" },
    reject: { title: "Rechazar solicitud", msg: "¿Rechazar esta solicitud? Esta acción no se puede deshacer.", variant: "danger" },
    cancel: { title: "Cancelar anuncio", msg: "¿Cancelar este anuncio activo? Se desactivará de inmediato.", variant: "danger" },
  };

  const handleAction = async (id: string, action: string, extra?: Record<string, any>) => {
    const labels = ACTION_LABELS[action] || { title: "Confirmar acción", msg: `¿Ejecutar "${action}"?`, variant: "warning" as const };
    const ok = await confirm({ title: labels.title, message: labels.msg, confirmLabel: labels.title, variant: labels.variant });
    if (!ok) return;

    setActionLoading(`${id}-${action}`);

    try {
      const res = await fetch(`/api/admin/ad-placements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, durationDays, ...extra }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(result.message || "Acción completada");
        fetchData();
      } else {
        toast.error(result.error || "Error");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate stats
  const pendingCount = placements.filter((p) => p.status === "PENDING").length;
  const activeCount = placements.filter((p) => p.status === "ACTIVE").length;
  const totalRevenue = placements.filter((p) => p.status === "ACTIVE").reduce((sum, p) => sum + p.amount, 0);
  const potentialRevenue = Object.values(AD_TYPES).reduce((sum, type) => sum + type.price * type.maxSlots, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          Gestión de Publicidad
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Administrá solicitudes, espacios y revenue publicitario en la plataforma
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Solicitudes Pendientes</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
          <p className="text-xs text-gray-500 mt-2">Esperando aprobación</p>
        </div>

        {/* Active */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Espacios Activos</p>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          <p className="text-xs text-gray-500 mt-2">En circulación ahora</p>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Revenue Mensual</p>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-2">Ingresos por publicidad</p>
        </div>

        {/* Potential Revenue */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Revenue Potencial</p>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(potentialRevenue)}</p>
          <p className="text-xs text-gray-500 mt-2">Si todos los slots vendidos</p>
        </div>
      </div>

      {/* Ad Guide */}
      <AdGuideSection />

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setLoading(true);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition min-h-[44px] flex items-center ${
              filter === f
                ? "bg-red-600 text-white"
                : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            {f === "ALL" ? "Todos" : STATUS_CONFIG[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      )}

      {/* Empty State */}
      {!loading && placements.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Megaphone className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-bold text-gray-900 text-lg">No hay solicitudes de publicidad</p>
          <p className="text-sm text-gray-500 mt-2">Cuando un comercio solicite un espacio, aparecerá acá.</p>
        </div>
      )}

      {/* Placements List */}
      {!loading && placements.length > 0 && (
        <div className="space-y-4">
          {placements.map((placement) => (
            <AdPlacementCard
              key={placement.id}
              placement={placement}
              durationDays={durationDays}
              setDurationDays={setDurationDays}
              onAction={handleAction}
              actionLoading={actionLoading}
              rejectionReasons={rejectionReasons}
              setRejectionReasons={setRejectionReasons}
              paymentMethods={paymentMethods}
              setPaymentMethods={setPaymentMethods}
              adminNotes={adminNotes}
              setAdminNotes={setAdminNotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
