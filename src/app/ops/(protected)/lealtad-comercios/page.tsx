"use client";

/**
 * Admin: Merchant Loyalty Management
 *
 * View all merchants with their loyalty tiers.
 * Configure tier thresholds and benefits.
 * Manually override merchant tiers if needed.
 */

import { useEffect, useState } from "react";
import { Edit2, Settings, TrendingUp, Award, RefreshCw, Save, X, Loader2 } from "lucide-react";
import { toast } from "@/store/toast";

interface MerchantWithTier {
  id: string;
  name: string;
  email: string;
  loyaltyTier: string;
  loyaltyOrderCount: number;
  loyaltyUpdatedAt: string;
}

interface TierConfig {
  id: string;
  tier: string;
  minOrdersPerMonth: number;
  commissionRate: number;
  badgeText: string;
  badgeColor: string;
  benefitsJson: string;
}

export default function MerchantLoyaltyPage() {
  const [merchants, setMerchants] = useState<MerchantWithTier[]>([]);
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);

  const [showTierEdit, setShowTierEdit] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [merchantsRes, tiersRes] = await Promise.all([
        fetch("/api/ops/merchant-loyalty/merchants"),
        fetch("/api/ops/merchant-loyalty/tiers"),
      ]);

      if (merchantsRes.ok) {
        const data = await merchantsRes.json();
        setMerchants(data);
      }

      if (tiersRes.ok) {
        const data = await tiersRes.json();
        setTiers(data);
      }
    } catch (error) {
      toast.error("Error loading loyalty data");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const response = await fetch("/api/ops/merchant-loyalty/recalculate", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to recalculate");
      const result = await response.json();

      toast.success(`Updated ${result.changedCount} merchant tiers`);
      fetchData();
    } catch (error) {
      toast.error("Failed to recalculate tiers");
    } finally {
      setRecalculating(false);
    }
  };

  const tierBgClasses: Record<string, string> = {
    BRONCE: "bg-amber-100 text-amber-700",
    PLATA: "bg-slate-100 text-slate-700",
    ORO: "bg-yellow-100 text-yellow-700",
    DIAMANTE: "bg-purple-100 text-purple-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-8 h-8" style={{ color: "#e60012" }} />
            Lealtad de Comercios
          </h1>
          <p className="text-gray-600 mt-1">Gestiona los tiers de lealtad y comisiones dinámicas</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {recalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Recalcular
          </button>
          <button
            onClick={() => setShowTierEdit(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90"
            style={{ backgroundColor: "#e60012" }}
          >
            <Settings className="w-5 h-5" />
            Configurar Tiers
          </button>
        </div>
      </div>

      {/* Tier Configuration */}
      {showTierEdit && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Configuración de Tiers</h2>
            <button onClick={() => setShowTierEdit(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {tiers.map((tier) => (
              <TierEditCard key={tier.id} tier={tier} onUpdated={fetchData} />
            ))}
          </div>
        </div>
      )}

      {/* Merchants List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Comercios ({merchants.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Comercio</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Pedidos 30d</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actualizado</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {merchants.map((merchant) => (
                <tr key={merchant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{merchant.name}</p>
                      <p className="text-sm text-gray-500">{merchant.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${tierBgClasses[merchant.loyaltyTier]}`}>
                      {merchant.loyaltyTier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 font-medium">{merchant.loyaltyOrderCount}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(merchant.loyaltyUpdatedAt).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-gray-400 hover:text-gray-600 transition">
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Tier Edit Card Component
 */
function TierEditCard({ tier, onUpdated }: { tier: TierConfig; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(tier);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/ops/merchant-loyalty/tiers/${tier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success("Tier updated");
      setEditing(false);
      onUpdated();
    } catch (error) {
      toast.error("Error saving tier");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <p className="font-bold text-gray-900">{tier.tier}</p>
          <p className="text-sm text-gray-600">
            {tier.minOrdersPerMonth}+ pedidos → {tier.commissionRate}% comisión
          </p>
        </div>
        <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-600">
          <Edit2 className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Orders/Month</label>
          <input
            type="number"
            value={form.minOrdersPerMonth}
            onChange={(e) => setForm({ ...form, minOrdersPerMonth: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
          <input
            type="number"
            step="0.5"
            value={form.commissionRate}
            onChange={(e) => setForm({ ...form, commissionRate: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
        <input
          type="text"
          value={form.badgeText}
          onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#e60012" }}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar
        </button>
        <button
          onClick={() => setEditing(false)}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
