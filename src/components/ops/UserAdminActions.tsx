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
  ChevronDown,
  ChevronUp,
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
  merchant?: {
    id: string;
    commissionOverride: number | null;
    commissionOverrideReason: string | null;
    loyaltyTier: string;
    loyaltyTierLocked: boolean;
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
  merchant,
  onRefresh,
}: UserAdminActionsProps) {
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [merchantLoading, setMerchantLoading] = useState(false);

  // Suspension form state
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendType, setSuspendType] = useState<"permanent" | "temporary">(
    "permanent"
  );
  const [suspendUntilDate, setSuspendUntilDate] = useState("");

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

    const ok = await confirm({
      title: "Suspender cuenta",
      message: `¿Suspender a ${userName}?${
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
        }),
      });

      if (res.ok) {
        toast.success("Cuenta suspendida correctamente");
        setSuspendReason("");
        setSuspendType("permanent");
        setSuspendUntilDate("");
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

  const handleUnsuspend = async () => {
    const ok = await confirm({
      title: "Reactivar cuenta",
      message: `¿Reactivar la cuenta de ${userName}?`,
      confirmLabel: "Reactivar",
      variant: "default",
    });

    if (!ok) return;

    setSuspendLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/unsuspend`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Cuenta reactivada correctamente");
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

  return (
    <div className="space-y-6">
      {/* Suspension Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-600" /> Suspensión
        </h3>

        {isSuspended ? (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900 font-semibold mb-2">
              ⚠️ Cuenta suspendida
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
              onClick={handleUnsuspend}
              disabled={suspendLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-lg transition"
            >
              {suspendLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              Reactivar cuenta
            </button>
          </div>
        ) : (
          <>
            {!showSuspendForm ? (
              <button
                onClick={() => setShowSuspendForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
              >
                <Lock className="w-4 h-4" /> Suspender cuenta
              </button>
            ) : (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
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
          </>
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
    </div>
  );
}
