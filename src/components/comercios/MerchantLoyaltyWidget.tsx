/**
 * Merchant Loyalty Widget
 *
 * Displays the merchant's current tier, progress to next tier,
 * commission rate, and benefits.
 * Shows on merchant dashboard.
 */

"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Award, TrendingUp, Zap } from "lucide-react";

interface LoyaltyData {
  currentTier: string;
  currentTierInfo: {
    tier: string;
    commissionRate: number;
    badgeText: string;
    badgeColor: string;
    minOrdersPerMonth: number;
    benefits: string[];
  };
  recentOrderCount: number;
  nextTier: {
    tier: string;
    minOrders: number;
    ordersNeeded: number;
    commission: number;
    badgeText: string;
    benefits: string[];
  } | null;
  lastUpdatedAt: string;
}

const tierBadgeClasses: Record<string, string> = {
  BRONCE: "bg-amber-100 text-amber-700 border-amber-300",
  PLATA: "bg-slate-100 text-slate-700 border-slate-300",
  ORO: "bg-yellow-100 text-yellow-700 border-yellow-300",
  DIAMANTE: "bg-purple-100 text-purple-700 border-purple-300",
};

const tierBadgeColors: Record<string, string> = {
  BRONCE: "text-amber-600",
  PLATA: "text-slate-600",
  ORO: "text-yellow-600",
  DIAMANTE: "text-purple-600",
};

export default function MerchantLoyaltyWidget({ merchantId }: { merchantId: string }) {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoyalty = async () => {
      try {
        const response = await fetch(`/api/merchant/loyalty?merchantId=${merchantId}`);
        if (!response.ok) throw new Error("Failed to fetch loyalty data");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading loyalty data");
      } finally {
        setLoading(false);
      }
    };

    fetchLoyalty();
  }, [merchantId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-red-50 rounded-2xl p-6 border border-purple-200 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-4" />
        <div className="h-12 bg-gray-300 rounded w-full mb-4" />
        <div className="h-6 bg-gray-300 rounded w-2/3" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 rounded-2xl p-6 border border-red-200 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-red-900">Error</h3>
          <p className="text-sm text-red-700">{error || "No se pudo cargar información de lealtad"}</p>
        </div>
      </div>
    );
  }

  const progressPercent = data.nextTier
    ? Math.min(100, (data.recentOrderCount / data.nextTier.minOrders) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Current Tier Card */}
      <div className="bg-gradient-to-br from-purple-50 to-red-50 rounded-2xl p-6 border border-purple-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Tu Nivel Actual</p>
            <h2 className="text-3xl font-bold text-gray-900">{data.currentTier}</h2>
          </div>
          <div className={`flex items-center justify-center w-16 h-16 rounded-full ${tierBadgeClasses[data.currentTier]}`}>
            <Award className={`w-8 h-8 ${tierBadgeColors[data.currentTier]}`} />
          </div>
        </div>

        {data.currentTierInfo && (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Comisión Actual</span>
                <span className="text-2xl font-bold" style={{ color: "#e60012" }}>
                  {data.currentTierInfo.commissionRate}%
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Ganas el {Math.round((100 - data.currentTierInfo.commissionRate) * 10) / 10}% de tus ventas
              </p>
            </div>

            {data.currentTierInfo.benefits && data.currentTierInfo.benefits.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Beneficios</p>
                <div className="space-y-1">
                  {data.currentTierInfo.benefits.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#e60012" }} />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress to Next Tier */}
      {data.nextTier && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Próximo Nivel</p>
              <h3 className="text-2xl font-bold text-gray-900">{data.nextTier.tier}</h3>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>

          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progreso</span>
                <span className="text-sm font-bold text-gray-900">
                  {data.recentOrderCount} de {data.nextTier.minOrders} pedidos
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%`, backgroundColor: "#e60012" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Te faltan {data.nextTier.ordersNeeded} pedido{data.nextTier.ordersNeeded !== 1 ? "s" : ""} para
                llegar a <strong>{data.nextTier.tier}</strong>
              </p>
            </div>

            {/* Next Tier Benefits */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900">Comisión en {data.nextTier.tier}</span>
                <span className="text-lg font-bold text-purple-600">{data.nextTier.commission}%</span>
              </div>
              <p className="text-xs text-purple-800">
                Ahorrarías {((data.currentTierInfo?.commissionRate || 8) - data.nextTier.commission).toFixed(1)}% en
                comisiones
              </p>

              {data.nextTier.benefits && data.nextTier.benefits.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-purple-200 pt-3">
                  {data.nextTier.benefits.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-purple-900">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tier Explained */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h4 className="font-bold text-gray-900 mb-3 text-sm">Cómo Funciona</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            🎯 Tu nivel se recalcula <strong>cada 30 días</strong> según la cantidad de pedidos completados.
          </p>
          <p>
            💰 Cada nivel te da una <strong>comisión más baja</strong>, así ganas más de cada venta.
          </p>
          <p>
            👑 Los niveles altos también te dan <strong>mejor visibilidad</strong> en la app.
          </p>
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-gray-500 text-center">
        Actualizado: {new Date(data.lastUpdatedAt).toLocaleDateString("es-AR")}
      </p>
    </div>
  );
}
