"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, TrendingUp, Clock, Star } from "lucide-react";

interface MerchantStats {
  todayOrdersCount: number;
  todayRevenue: number;
  pendingOrdersCount: number;
  averageRating: number;
  weekOrdersCount: number;
  weekRevenue: number;
}

const KPISkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 sm:gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
        <div className="w-10 h-10 bg-gray-200 rounded-xl mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function KPIDashboard() {
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/merchant/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data: MerchantStats = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching merchant stats:", err);
        setError("No se pudieron cargar las estadísticas");
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <KPISkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-700 font-medium">{error || "Error cargando estadísticas"}</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : "—";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 sm:gap-6">
      {/* Today Orders */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-green-200 transition-colors">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
          <ShoppingCart className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pedidos Hoy</p>
          <p className="text-2xl font-bold text-gray-900">{stats.todayOrdersCount}</p>
          <p className="text-xs text-gray-500 mt-1">pedidos completados</p>
        </div>
      </div>

      {/* Today Revenue */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-red-200 transition-colors">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(230, 0, 18, 0.1)" }}>
          <TrendingUp className="w-5 h-5" style={{ color: "#e60012" }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ingresos Hoy</p>
          <p className="text-xl font-bold text-gray-900 truncate">{formatCurrency(stats.todayRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">pagos aprobados</p>
        </div>
      </div>

      {/* Pending Orders */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-amber-200 transition-colors">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pendientes</p>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingOrdersCount}</p>
          <p className="text-xs text-gray-500 mt-1">requieren acción</p>
        </div>
      </div>

      {/* Rating */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-yellow-200 transition-colors">
        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
          <Star className="w-5 h-5 text-yellow-600 fill-current" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rating</p>
          <p className="text-2xl font-bold text-gray-900">{formatRating(stats.averageRating)}</p>
          <p className="text-xs text-gray-500 mt-1">de tus clientes</p>
        </div>
      </div>

      {/* Week Orders */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-blue-200 transition-colors">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Esta Semana</p>
          <p className="text-2xl font-bold text-gray-900">{stats.weekOrdersCount}</p>
          <p className="text-xs text-gray-500 mt-1">últimos 7 días</p>
        </div>
      </div>

      {/* Week Revenue */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-purple-200 transition-colors">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ingresos Semana</p>
          <p className="text-xl font-bold text-gray-900 truncate">{formatCurrency(stats.weekRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">últimos 7 días</p>
        </div>
      </div>
    </div>
  );
}
