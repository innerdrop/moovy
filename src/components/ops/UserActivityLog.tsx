"use client";

import { useState, useEffect } from "react";
import {
  LogIn,
  LogOut,
  ShoppingBag,
  Settings,
  Lock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface ActivityLogEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface UserActivityLogProps {
  userId: string;
}

const ACTION_ICONS: Record<string, { icon: any; color: string }> = {
  LOGIN: { icon: LogIn, color: "text-green-600" },
  LOGOUT: { icon: LogOut, color: "text-gray-600" },
  ORDER_CREATED: { icon: ShoppingBag, color: "text-blue-600" },
  SETTINGS_UPDATED: { icon: Settings, color: "text-purple-600" },
  PASSWORD_CHANGED: { icon: Lock, color: "text-red-600" },
  ACCOUNT_SUSPENDED: { icon: AlertCircle, color: "text-red-600" },
  ACCOUNT_ARCHIVED: { icon: AlertCircle, color: "text-orange-600" },
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Inicio de sesión",
  LOGOUT: "Cierre de sesión",
  ORDER_CREATED: "Pedido creado",
  PRODUCT_ADDED: "Producto agregado",
  PASSWORD_CHANGED: "Contraseña cambiada",
  SETTINGS_UPDATED: "Configuración actualizada",
  ACCOUNT_SUSPENDED: "Cuenta suspendida",
  ACCOUNT_ARCHIVED: "Cuenta archivada",
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins}min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es-AR");
}

export function UserActivityLog({ userId }: UserActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const LIMIT = 20;

  useEffect(() => {
    fetchActivities();
  }, [page, selectedAction]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString(),
        ...(selectedAction && { action: selectedAction }),
      });

      const res = await fetch(
        `/api/admin/users/${userId}/activity?${params.toString()}`
      );

      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const uniqueActions = Array.from(
    new Set(activities.map((a) => a.action))
  ).sort();

  const getActionIcon = (action: string) => {
    const config = ACTION_ICONS[action];
    if (!config) return { icon: AlertCircle, color: "text-gray-600" };
    return config;
  };

  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action] || action;
  };

  const parseMetadata = (metadata: string | null): Record<string, any> => {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#e60012]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Filtrar por acción
        </label>
        <select
          value={selectedAction}
          onChange={(e) => {
            setSelectedAction(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#e60012] focus:border-transparent"
        >
          <option value="">Todas las acciones</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {getActionLabel(action)}
            </option>
          ))}
        </select>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No hay actividad registrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          {activities.map((activity) => {
            const { icon: IconComponent, color } = getActionIcon(
              activity.action
            );
            const metadata = parseMetadata(activity.metadata);
            const isExpanded = expandedId === activity.id;

            return (
              <div key={activity.id} className="p-6 hover:bg-slate-50">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 ${color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-4 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {getActionLabel(activity.action)}
                      </h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {getRelativeTime(activity.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      {activity.entityType && (
                        <>
                          <span>{activity.entityType}</span>
                          {activity.entityId && (
                            <>
                              <span className="text-gray-400">•</span>
                              <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono text-gray-700">
                                {activity.entityId}
                              </code>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {/* Metadata Preview */}
                    {Object.keys(metadata).length > 0 && (
                      <div>
                        <button
                          onClick={() =>
                            setExpandedId(
                              isExpanded ? null : activity.id
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs text-[#e60012] hover:text-red-700 font-semibold"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" /> Ocultar detalles
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" /> Ver detalles
                            </>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                            {Object.entries(metadata).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="text-gray-600">
                                  <strong>{key}:</strong>
                                </span>
                                <div className="mt-1 p-2 bg-white rounded border border-slate-200 font-mono text-gray-700 break-all">
                                  {typeof value === "string"
                                    ? value
                                    : JSON.stringify(value, null, 2)}
                                </div>
                              </div>
                            ))}
                            {activity.ipAddress && (
                              <div className="text-xs pt-2 border-t border-slate-300">
                                <span className="text-gray-600">
                                  <strong>IP:</strong> {activity.ipAddress}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {activities.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-900 font-bold rounded-lg transition"
          >
            Anterior
          </button>

          <span className="text-sm text-gray-600">Página {page}</span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={activities.length < LIMIT || loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-900 font-bold rounded-lg transition"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
