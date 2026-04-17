"use client";

import { useState } from "react";
import {
  Lock,
  Unlock,
  Archive,
  ArchiveRestore,
  DollarSign,
  Award,
  AlertCircle,
  Loader2,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { toast } from "@/store/toast";
import { confirm } from "@/store/confirm";

export interface UserAdminActionsProps {
  userId: string;
  userName: string;
  isSuspended: boolean;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  merchant?: {
    id: string;
    isSuspended: boolean;
    suspendedUntil: string | null;
    suspensionReason: string | null;
    commissionOverride: number | null;
    commissionOverrideReason: string | null;
    loyaltyTier: string;
    loyaltyTierLocked: boolean;
  } | null;
  driver?: {
    id: string;
    isSuspended: boolean;
    suspendedUntil: string | null;
    suspensionReason: string | null;
  } | null;
  seller?: {
    id: string;
    isSuspended: boolean;
    suspendedUntil: string | null;
    suspensionReason: string | null;
  } | null;
  onRefresh: () => void;
}

const LOYALTY_TIERS = ["BRONCE", "PLATA", "ORO", "DIAMANTE"] as const;

export function UserAdminActions({
  userId,
  userName,
  isSuspended,
  suspendedUntil,
  suspensionReason,
  archivedAt,
  deletedAt,
  merchant,
  driver,
  seller,
  onRefresh,
}: UserAdminActionsProps) {
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [merchantLoading, setMerchantLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Suspension form state
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendType, setSuspendType] = useState<"permanent" | "temporary">(
    "permanent"
  );
  const [suspendUntilDate, setSuspendUntilDate] = useState("");
  const [suspendRole, setSuspendRole] = useState<"FULL" | "COMERCIO" | "DRIVER" | "SELLER">(
    "FULL"
  );

  // Commission form state
  const [showCommissionForm, setShowCommissionForm] = useState(false);
  const [commissionValue, setCommissionValue] = useState(
    merchant?.commissionOverride?.toString() || ""
  );
  const [commissionReason, setCommissionReason] = useState(
    merchant?.commissionOverrideReason || ""
  );

  // Loyalty form state
  const [showLoyaltyForm, setShowLoyaltyForm] = useState(false);
  const [selectedTier, setSelectedTier] = useState(merchant?.loyaltyTier || "BRONCE");
  const [tierLocked, setTierLocked] = useState(merchant?.loyaltyTierLocked || false);

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error("Especifica una razón para la suspensión");
      return;
    }

    const roleLabel =
      suspendRole === "FULL"
        ? "toda la cuenta"
        : suspendRole === "COMERCIO"
          ? "el comercio"
          : suspendRole === "DRIVER"
            ? "el rol de repartidor"
            : "el rol de vendedor";

    const ok = await confirm({
      title: "Suspender",
      message: `¿Suspender ${roleLabel} de ${userName}?${
        suspendType === "temporary"
          ? ` Hasta ${new Date(suspendUntilDate).toLocaleDateString("es-AR")}`
          : " (Permanente)"
      }`,
      confirmLabel: "Suspender",
      variant: "danger",
    });

    if (!ok) return;

    setSuspendLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: suspendReason,
          until: suspendType === "temporary" ? suspendUntilDate : null,
          role: suspendRole === "FULL" ? null : suspendRole,
        }),
      });

      if (res.ok) {
        toast.success("Suspensión aplicada correctamente");
        setSuspendReason("");
        setSuspendType("permanent");
        setSuspendUntilDate("");
        setSuspendRole("FULL");
        setShowSuspendForm(false);
        onRefresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al suspender");
      }
    } catch (error) {
      console.error("Error suspending user:", error);
      toast.error("Error de conexión");
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleUnsuspend = async (role?: "COMERCIO" | "DRIVER" | "SELLER") => {
    const roleLabel = !role
      ? "toda la cuenta"
      : role === "COMERCIO"
        ? "el comercio"
        : role === "DRIVER"
          ? "el rol de repartidor"
          : "el rol de vendedor";

    const ok = await confirm({
      title: "Reactivar",
      message: `¿Reactivar ${roleLabel} de ${userName}?`,
      confirmLabel: "Reactivar",
      variant: "default",
    });

    if (!ok) return;

    setSuspendLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/unsuspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role || null,
        }),
      });

      if (res.ok) {
        toast.success("Reactivación completada correctamente");
        onRefresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al reactivar");
      }
    } catch (error) {
      console.error("Error unsuspending user:", error);
      toast.error("Error de conexión");
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleArchive = async () => {
    const ok = await confirm({
      title: "Archivar cuenta",
      message: `¿Archivar la cuenta de ${userName}? Podrás verla en el historial pero no aparecerá en listados activos.`,
      confirmLabel: "Archivar",
      variant: "danger",
    });

    if (!ok) return;

    setArchiveLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unarchive: false }),
      });

      if (res.ok) {
        toast.success("Cuenta archivada correctamente");
        onRefresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al archivar");
      }
    } catch (error) {
      console.error("Error archiving user:", error);
      toast.error("Error de conexión");
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleUnarchive = async () => {
    const ok = await confirm({
      title: "Reactivar cuenta archivada",
      message: `¿Reactivar el archivo de ${userName}?`,
      confirmLabel: "Reactivar",
      variant: "default",
    });

    if (!ok) return;

    setArchiveLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unarchive: true }),
      });

      if (res.ok) {
        toast.success("Archivo eliminado correctamente");
        onRefresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al reactivar");
      }
    } catch (error) {
      console.error("Error unarchiving user:", error);
      toast.error("Error de conexión");
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleSaveCommission = async () => {
    if (!merchant) return;

    const value =
      commissionValue === "" ? null : parseFloat(commissionValue);

    if (value !== null && (isNaN(value) || value < 0 || value > 100)) {
      toast.error("Comisión inválida (0-100)");
      return;
    }

    setMerchantLoading(true);
    try {
      const res = await fetch(`/api/admin/merchants/${merchant.id}/commission`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionOverride: value,
          reason: commissionReason || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Comisión actualizada");
        setShowCommissionForm(false);
        onRefresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al guardar");
      }
    } catch (error) {
      console.error("Error saving commission:", error);
      toast.error("Error de conexión");
    } finally {
      setMerchantLoading(false);
    }
  };

  const handleSaveLoyalty = async () => {
    if (!merchant) return;

    setMerchantLoading(true);
    try {
      const res = await fetch(`/api/admin/merchants/${merchant.id}/loyalty`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedTier,
          locked: tierLocked,
        }),
      });

      if (res.ok) {
        toast.success("Tier de fidelización actualizado");
        setShowLoyaltyForm(false);
        onRefresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al guardar");
      }
    } catch (error) {
      console.error("Error saving loyalty:", error);
      toast.error("Error de conexión");
    } finally {
      setMerchantLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Eliminar cuenta",
      message: `¿Estás seguro de que querés eliminar la cuenta de ${userName}? Esta acción se puede revertir desde el panel de administración.`,
      confirmLabel: "Eliminar",
      variant: "danger",
    });

    if (!ok) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: false }),
      });

      if (res.ok) {
        toast.success("Cuenta eliminada correctamente");
        onRefresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error de conexión");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRestore = async () => {
    const ok = await confirm({
      title: "Restaurar cuenta",
      message: `¿Restaurar la cuenta de ${userName}?`,
      confirmLabel: "Restaurar",
      variant: "default",
    });

    if (!ok) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      });

      if (res.ok) {
        toast.success("Cuenta restaurada correctamente");
        onRefresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al restaurar");
      }
    } catch (error) {
      console.error("Error restoring user:", error);
      toast.error("Error de conexión");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Suspension Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-600" /> Suspensión
        </h3>

        {/* Show current suspensions */}
        <div className="space-y-3 mb-6">
          {isSuspended && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900 font-semibold mb-2">
                ⚠️ Cuenta completamente suspendida
              </p>
              {suspensionReason && (
                <p className="text-sm text-red-800 mb-2">
                  <strong>Razón:</strong> {suspensionReason}
                </p>
              )}
              {suspendedUntil ? (
                <p className="text-sm text-red-800 mb-3">
                  <strong>Hasta:</strong>{" "}
                  {new Date(suspendedUntil).toLocaleDateString("es-AR")}
                </p>
              ) : (
                <p className="text-sm text-red-800 mb-3">
                  <strong>Duración:</strong> Permanente
                </p>
              )}
              <button
                onClick={() => handleUnsuspend()}
                disabled={suspendLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-lg transition"
              >
                {suspendLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                Reactivar cuenta completa
              </button>
            </div>
          )}

          {merchant?.isSuspended && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-900 font-semibold mb-2">
                ⚠️ Comercio suspendido
              </p>
              {merchant.suspensionReason && (
                <p className="text-sm text-orange-800 mb-2">
                  <strong>Razón:</strong> {merchant.suspensionReason}
                </p>
              )}
              {merchant.suspendedUntil ? (
                <p className="text-sm text-orange-800 mb-3">
                  <strong>Hasta:</strong>{" "}
                  {new Date(merchant.suspendedUntil).toLocaleDateString("es-AR")}
                </p>
              ) : (
                <p className="text-sm text-orange-800 mb-3">
                  <strong>Duración:</strong> Permanente
                </p>
              )}
              <button
                onClick={() => handleUnsuspend("COMERCIO")}
                disabled={suspendLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-lg transition"
              >
                {suspendLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                Reactivar comercio
              </button>
            </div>
          )}

          {driver?.isSuspended && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                ⚠️ Repartidor suspendido
              </p>
              {driver.suspensionReason && (
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Razón:</strong> {driver.suspensionReason}
                </p>
              )}
              {driver.suspendedUntil ? (
                <p className="text-sm text-blue-800 mb-3">
                  <strong>Hasta:</strong>{" "}
                  {new Date(driver.suspendedUntil).toLocaleDateString("es-AR")}
                </p>
              ) : (
                <p className="text-sm text-blue-800 mb-3">
                  <strong>Duración:</strong> Permanente
                </p>
              )}
              <button
                onClick={() => handleUnsuspend("DRIVER")}
                disabled={suspendLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-lg transition"
              >
                {suspendLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                Reactivar repartidor
              </button>
            </div>
          )}

          {seller?.isSuspended && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-900 font-semibold mb-2">
                ⚠️ Vendedor suspendido
              </p>
              {seller.suspensionReason && (
                <p className="text-sm text-purple-800 mb-2">
                  <strong>Razón:</strong> {seller.suspensionReason}
                </p>
              )}
              {seller.suspendedUntil ? (
                <p className="text-sm text-purple-800 mb-3">
                  <strong>Hasta:</strong>{" "}
                  {new Date(seller.suspendedUntil).toLocaleDateString("es-AR")}
                </p>
              ) : (
                <p className="text-sm text-purple-800 mb-3">
                  <strong>Duración:</strong> Permanente
                </p>
              )}
              <button
                onClick={() => handleUnsuspend("SELLER")}
                disabled={suspendLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-lg transition"
              >
                {suspendLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                Reactivar vendedor
              </button>
            </div>
          )}
        </div>

        {/* Suspension form */}
        {!showSuspendForm ? (
          <button
            onClick={() => setShowSuspendForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
          >
            <Lock className="w-4 h-4" /> Suspender
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Qué suspender
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="FULL"
                    checked={suspendRole === "FULL"}
                    onChange={(e) =>
                      setSuspendRole(e.target.value as "FULL")
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    Toda la cuenta (bloquear acceso completo)
                  </span>
                </label>
                {merchant && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="COMERCIO"
                      checked={suspendRole === "COMERCIO"}
                      onChange={(e) =>
                        setSuspendRole(e.target.value as "COMERCIO")
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">
                      Solo el comercio
                    </span>
                  </label>
                )}
                {driver && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="DRIVER"
                      checked={suspendRole === "DRIVER"}
                      onChange={(e) =>
                        setSuspendRole(e.target.value as "DRIVER")
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">
                      Solo el rol de repartidor
                    </span>
                  </label>
                )}
                {seller && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="SELLER"
                      checked={suspendRole === "SELLER"}
                      onChange={(e) =>
                        setSuspendRole(e.target.value as "SELLER")
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">
                      Solo el rol de vendedor
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Razón de suspensión
              </label>
              <input
                type="text"
                placeholder="Ej: Violación de términos, actividad fraudulenta"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="permanent"
                    checked={suspendType === "permanent"}
                    onChange={(e) =>
                      setSuspendType(e.target.value as "permanent")
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Permanente</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="temporary"
                    checked={suspendType === "temporary"}
                    onChange={(e) =>
                      setSuspendType(e.target.value as "temporary")
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Temporal</span>
                </label>
              </div>
            </div>

            {suspendType === "temporary" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={suspendUntilDate}
                  onChange={(e) => setSuspendUntilDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSuspend}
                disabled={suspendLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition"
              >
                {suspendLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Suspender"
                )}
              </button>
              <button
                onClick={() => setShowSuspendForm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Archive Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Archive className="w-5 h-5 text-orange-600" /> Archivo
        </h3>

        {archivedAt ? (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-900 font-semibold mb-2">
              📋 Cuenta archivada
            </p>
            <p className="text-sm text-orange-800 mb-3">
              <strong>Archivada el:</strong>{" "}
              {new Date(archivedAt).toLocaleDateString("es-AR")}
            </p>
            <button
              onClick={handleUnarchive}
              disabled={archiveLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-lg transition"
            >
              {archiveLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArchiveRestore className="w-4 h-4" />
              )}
              Reactivar archivo
            </button>
          </div>
        ) : (
          <button
            onClick={handleArchive}
            disabled={archiveLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition"
          >
            {archiveLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
            Archivar cuenta
          </button>
        )}
      </div>

      {/* Merchant-only sections */}
      {merchant && (
        <>
          {/* Commission Override Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" /> Comisión
            </h3>

            {!showCommissionForm ? (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Comisión actual:</strong>
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {merchant.commissionOverride !== null
                      ? `${merchant.commissionOverride}%`
                      : "Usar tarifa de tier"}
                  </p>
                  {merchant.commissionOverride !== null &&
                    merchant.commissionOverrideReason && (
                      <p className="text-xs text-gray-500 mt-1">
                        {merchant.commissionOverrideReason}
                      </p>
                    )}
                </div>
                <button
                  onClick={() => setShowCommissionForm(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition"
                >
                  Editar
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Comisión (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Dejar vacío para usar tarifa de tier"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Razón (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Convenio especial lanzamiento"
                    value={commissionReason}
                    onChange={(e) => setCommissionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveCommission}
                    disabled={merchantLoading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition"
                  >
                    {merchantLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Guardar"
                    )}
                  </button>
                  <button
                    onClick={() => setShowCommissionForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Loyalty Tier Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" /> Fidelización
            </h3>

            {!showLoyaltyForm ? (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Tier actual:</strong>
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-lg font-bold text-gray-900">
                      {selectedTier}
                    </p>
                    {tierLocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                        <Lock className="w-3 h-3" /> Bloqueado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {tierLocked
                      ? "No se recalculará automáticamente"
                      : "Se recalcula automáticamente diariamente"}
                  </p>
                </div>
                <button
                  onClick={() => setShowLoyaltyForm(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition"
                >
                  Editar
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tier
                  </label>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    {LOYALTY_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded border border-slate-200">
                  <input
                    type="checkbox"
                    checked={tierLocked}
                    onChange={(e) => setTierLocked(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Bloquear tier (no recalcular automáticamente)
                  </span>
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveLoyalty}
                    disabled={merchantLoading}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition"
                  >
                    {merchantLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Guardar"
                    )}
                  </button>
                  <button
                    onClick={() => setShowLoyaltyForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8">
        <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" /> Zona de peligro
        </h3>

        {deletedAt ? (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900 font-semibold mb-2">
              🗑️ Cuenta eliminada
            </p>
            <p className="text-sm text-red-800 mb-3">
              <strong>Eliminada el:</strong>{" "}
              {new Date(deletedAt).toLocaleDateString("es-AR")}
            </p>
            <button
              onClick={handleRestore}
              disabled={deleteLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-lg transition"
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Restaurar cuenta
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Eliminar permanentemente esta cuenta de la base de datos. Esta acción puede revertirse desde el panel de administración.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition"
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Eliminar cuenta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
