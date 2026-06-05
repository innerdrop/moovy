"use client";

/**
 * OPS Logistics Configuration Panel — v2
 *
 * fix/asignacion-y-logistica (2026-06-05): se removieron los tabs Velocidades de
 * Vehículo, Cola de Prioridad y Calculador de ETA — eran config fantasma / código
 * muerto (el runtime usa consts, no esas keys). Quedan 5 secciones:
 *   1. Configuración Global (MoovyConfig keys)
 *   2. Categorías de Paquete (PackageCategory)
 *   3. Tipos de Envío (ShipmentType)
 *   4. Dashboard SLA en Vivo
 *   5. Tarifas de Envío (DeliveryRate + Shipping Defaults)
 *
 * Cada campo tiene un botón (i) que abre un tooltip con explicación detallada.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { toast as globalToast } from "@/store/toast";
import { confirm } from "@/store/confirm";
import {
  Settings,
  Package,
  Truck,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Globe,
  Flame,
  Snowflake,
  FileText,
  ShieldAlert,
  Box,
  Clock,
  Info,
  X,
  BarChart3,
  AlertTriangle,
  // fix/asignacion-y-logistica (2026-06-05): Gauge/Timer/Zap se usaban solo en los
  // tabs Vehículos/ETA/Prioridad eliminados — imports removidos.
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface MoovyConfigItem {
  id: string;
  key: string;
  value: string;
  description: string;
}

interface PackageCategoryItem {
  id: string;
  name: string;
  maxWeightGrams: number;
  maxLengthCm: number;
  maxWidthCm: number;
  maxHeightCm: number;
  volumeScore: number;
  allowedVehicles: string[];
  displayOrder: number;
}

interface ShipmentTypeConfig {
  code: string;
  name: string;
  label: string;
  icon: string;
  maxDeliveryMinutes: number;
  priorityWeight: number;
  surchargeArs: number;
  allowedVehicles: string[];
  requiresThermalBag: boolean;
  requiresColdChain: boolean;
  requiresCarefulHandle: boolean;
}

// fix/asignacion-y-logistica (2026-06-05): removidas VehicleSpeedConfig,
// PriorityQueueConfig y ETACalcConfig (tabs/config eliminados).

interface ShippingDefaultsConfig {
  [key: string]: { basePriceArs: number; pricePerKmArs: number };
}

interface SLADashboardData {
  orders: SLAOrder[];
  kpis: {
    totalActive: number;
    criticalCount: number;
    urgentCount: number;
    normalCount: number;
    withoutDriver: number;
    exceedingSLA: number;
    avgWaitMin: number;
    slaComplianceRate: number;
    recentDelivered: number;
    recentTotal: number;
  };
}

interface SLAOrder {
  id: string;
  orderNumber: string;
  status: string;
  deliveryStatus: string | null;
  merchantName: string;
  createdAt: string;
  elapsedMin: number;
  shipmentTypeCode: string;
  shipmentTypeName: string;
  shipmentTypeIcon: string;
  slaMinutes: number;
  slaPercent: number;
  exceedsSLA: boolean;
  priority: number;
  hasDriver: boolean;
  assignmentAttempts: number;
  distanceKm: number | null;
}

type DeliveryRateItem = {
  id: string;
  categoryId: string;
  basePriceArs: number;
  pricePerKmArs: number;
  category: { name: string; displayOrder: number };
};

// ─── Constants ──────────────────────────────────────────────────────────────────

// Campos que solo viven en MoovyConfig (assignment engine, crons).
// Timeouts y comisiones se manejan desde Biblia Financiera (StoreSettings)
// y se sincronizan automáticamente a MoovyConfig al guardar.
const GLOBAL_CONFIG_FIELDS = [
  { key: "max_delivery_distance_km", label: "Distancia máx. delivery", unit: "km", min: 1, max: 200 },
  { key: "min_order_amount_ars", label: "Monto mínimo pedido", unit: "ARS", min: 0, max: 999999 },
  { key: "max_assignment_attempts", label: "Intentos máx. asignación", unit: "", min: 1, max: 20 },
  { key: "assignment_rating_radius_meters", label: "Radio rating asignación", unit: "m", min: 100, max: 50000 },
  // fix/asignacion-y-logistica (2026-06-05): radio de búsqueda de drivers, editable.
  { key: "driver_search_radius_meters", label: "Radio búsqueda repartidor", unit: "m", min: 1000, max: 50000 },
  { key: "scheduled_notify_before_minutes", label: "Notificar antes (prog.)", unit: "min", min: 1, max: 120 },
  { key: "scheduled_cancel_if_no_confirm_minutes", label: "Cancelar sin confirmación", unit: "min", min: 1, max: 120 },
];

const GLOBAL_CONFIG_INFO: Record<string, string> = {
  // Timeouts y comisiones movidos a Biblia Financiera (con sync automático a MoovyConfig)
  max_delivery_distance_km:
    "Distancia máxima en kilómetros entre el comercio y el cliente para aceptar un pedido con delivery. Pedidos que excedan esta distancia solo podrán ser retiro en local. Para Ushuaia se recomienda 15-25km.",
  min_order_amount_ars:
    "Monto mínimo del carrito (sin contar el envío) para poder hacer un pedido con delivery. Pedidos menores solo permiten retiro. Valor estándar: $500-$1000.",
  max_assignment_attempts:
    "Cantidad máxima de repartidores a los que se les ofrece el pedido antes de marcarlo como sin repartidor. Cada intento espera el driver_response_timeout antes de pasar al siguiente.",
  assignment_rating_radius_meters:
    "Radio (en metros) dentro del cual se priorizan repartidores por rating. Fuera de este radio, se priorizan por cercanía. Un radio de 3000m busca primero los mejores repartidores dentro de 3km.",
  driver_search_radius_meters:
    "Radio máximo (en metros) para buscar repartidores disponibles alrededor del comercio. Repartidores fuera de este radio no reciben la oferta. Para Ushuaia se recomienda 15000m (15km), que cubre toda la ciudad.",
  scheduled_notify_before_minutes:
    "Cuántos minutos antes de la hora programada se notifica al repartidor asignado para que se prepare. Valor estándar: 15-30 min.",
  scheduled_cancel_if_no_confirm_minutes:
    "Si un pedido programado no es confirmado por el comercio en estos minutos, se cancela automáticamente. Valor estándar: 30-60 min.",
};

const VEHICLE_OPTIONS = ["BIKE", "MOTO", "CAR", "TRUCK"] as const;
const VEHICLE_LABELS: Record<string, string> = { BIKE: "🚲 Bici", MOTO: "🏍️ Moto", CAR: "🚗 Auto", TRUCK: "🚛 Camión" };

const SHIPMENT_TYPE_ICONS: Record<string, typeof Flame> = {
  HOT: Flame,
  FRESH: Snowflake,
  FRAGILE: ShieldAlert,
  DOCUMENT: FileText,
  STANDARD: Box,
};

const SHIPMENT_TYPE_COLORS: Record<string, string> = {
  HOT: "text-red-500 bg-red-50",
  FRESH: "text-cyan-500 bg-cyan-50",
  FRAGILE: "text-amber-500 bg-amber-50",
  DOCUMENT: "text-blue-500 bg-blue-50",
  STANDARD: "text-slate-500 bg-slate-50",
};

// ─── Info texts from logistics-config ────────────────────────────────────────

const INFO_TEXTS: Record<string, { label: string; description: string; example?: string }> = {
  shipmentType_maxDeliveryMinutes: {
    label: "SLA máximo (minutos)",
    description: "Tiempo máximo permitido para completar la entrega desde que se crea el pedido. Si se excede, el pedido aparece como CRÍTICO en el dashboard.",
    example: "HOT = 45 min (comida caliente), STANDARD = 480 min (mismo día)",
  },
  shipmentType_priorityWeight: {
    label: "Peso de prioridad",
    description: "Cuántos puntos de prioridad aporta este tipo en la cola de asignación. Mayor número = se asigna primero.",
    example: "HOT = 100, FRESH = 80, FRAGILE = 30, STANDARD = 0",
  },
  shipmentType_surchargeArs: {
    label: "Recargo (ARS)",
    description: "Monto extra que se suma al costo de envío por la naturaleza especial del producto. Se cobra al comprador.",
    example: "FRESH = $200 (cadena de frío), FRAGILE = $150",
  },
  shipmentType_allowedVehicles: {
    label: "Vehículos permitidos",
    description: "Tipos de vehículo que pueden transportar este envío. Se intersecta con los permitidos por la categoría de paquete.",
    example: "HOT permite BIKE, MOTO, CAR (no TRUCK). FRAGILE solo CAR y TRUCK.",
  },
  shipmentType_requiresThermalBag: {
    label: "Requiere bolsa térmica",
    description: "Si está activo, solo se asignan repartidores que tengan declarada una bolsa térmica.",
  },
  shipmentType_requiresColdChain: {
    label: "Requiere cadena de frío",
    description: "Si está activo, solo se asignan repartidores con equipamiento de frío.",
  },
  shipmentType_requiresCarefulHandle: {
    label: "Requiere manipulación cuidadosa",
    description: "Indica que el paquete es frágil y necesita cuidado especial.",
  },
  vehicleSpeed: {
    label: "Velocidad promedio (km/h)",
    description: "Velocidad promedio en zona urbana usada para calcular el ETA. Afecta directamente el tiempo estimado.",
    example: "MOTO = 25 km/h, BIKE = 12 km/h",
  },
  priority_maxWaitPriority: {
    label: "Prioridad máxima por espera",
    description: "Tope máximo de puntos por tiempo esperando. Evita que pedidos viejos monopolicen la cola.",
    example: "Con valor 60, un pedido nunca gana más de 60 puntos por espera.",
  },
  priority_waitPriorityPerMinute: {
    label: "Puntos por minuto de espera",
    description: "Cuántos puntos gana un pedido por cada minuto sin ser asignado. Mayor valor = pedidos viejos suben más rápido.",
    example: "Con valor 2, un pedido de 10 min tiene +20 puntos.",
  },
  priority_retryPriorityPerAttempt: {
    label: "Puntos por reintento fallido",
    description: "Puntos extra cada vez que un repartidor rechaza o no responde.",
    example: "Con valor 15, un pedido rechazado 3 veces tiene +45 puntos.",
  },
  priority_scheduledPenalty: {
    label: "Penalidad para programados",
    description: "Puntos que se RESTAN a pedidos programados cuyo horario es en más de 30 min. Los inmediatos tienen prioridad.",
    example: "Con valor -50, un pedido programado para dentro de 1 hora pierde 50 puntos.",
  },
  eta_defaultDriverWaitTimeMin: {
    label: "Espera de repartidor (min)",
    description: "Tiempo promedio que tarda en asignarse un repartidor. Se suma al ETA antes de pagar.",
    example: "Con valor 5, el ETA incluye 5 min de espera por repartidor.",
  },
  eta_pickupTimeMin: {
    label: "Tiempo de retiro (min)",
    description: "Tiempo promedio que el repartidor tarda en retirar el pedido una vez que llega al comercio.",
    example: "Con valor 3, se suman 3 min al ETA por el retiro.",
  },
  eta_bufferPercent: {
    label: "Buffer de imprevistos (%)",
    description: "Porcentaje extra sobre el tiempo de viaje para cubrir imprevistos (tráfico, semáforos).",
    example: "Con 0.15, un viaje de 20 min se estima en 23 min (20 + 15%).",
  },
  eta_rangeMinus: {
    label: "Margen inferior del rango (min)",
    description: "Minutos que se restan al ETA para dar el extremo optimista. El comprador ve un rango.",
    example: "ETA 35 min con margen 5 = comprador ve '30-45 min'.",
  },
  eta_rangePlus: {
    label: "Margen superior del rango (min)",
    description: "Minutos que se suman al ETA para dar el extremo pesimista.",
    example: "ETA 35 min con margen 10 = comprador ve '30-45 min'.",
  },
  shipping_basePriceArs: {
    label: "Tarifa base (ARS)",
    description: "Costo fijo mínimo de envío sin contar distancia. Fallback si DeliveryRate no tiene datos.",
    example: "MICRO = $400 (sobre), XL = $1200 (mueble grande)",
  },
  shipping_pricePerKmArs: {
    label: "Precio por km (ARS)",
    description: "Costo adicional por cada kilómetro de distancia. Fallback si DeliveryRate no tiene datos.",
    example: "MICRO = $150/km, XL = $500/km",
  },
};

// ─── Info Button Component ──────────────────────────────────────────────────────

function InfoButton({ infoKey }: { infoKey: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const info = INFO_TEXTS[infoKey] || GLOBAL_CONFIG_INFO[infoKey];

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const description = typeof info === "string" ? info : info?.description;
  const example = typeof info === "string" ? undefined : info?.example;

  if (!description) return null;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-5 h-5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-500 flex items-center justify-center transition-colors ml-1 flex-shrink-0"
        aria-label="Información"
      >
        <Info className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-xl p-4 shadow-xl animate-fadeIn">
          <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-gray-400 hover:text-white">
            <X className="w-3 h-3" />
          </button>
          <p className="leading-relaxed">{description}</p>
          {example && (
            <p className="mt-2 text-gray-400 text-[10px] italic border-t border-gray-700 pt-2">
              Ejemplo: {example}
            </p>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

// ─── Toast Component ────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fadeIn text-sm font-bold ${
        type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      {message}
    </div>
  );
}

// ─── Section Card Wrapper ───────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  accentColor,
  saving,
  onSave,
  children,
}: {
  icon: typeof Settings;
  iconColor: string;
  title: string;
  subtitle: string;
  accentColor: string;
  saving?: boolean;
  onSave?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-[2rem] p-5 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 ${accentColor} -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform duration-500`} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${iconColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-gray-900 leading-tight truncate">{title}</h2>
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
          </div>
        </div>
        {onSave && (
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-600/20 w-full sm:w-auto flex-shrink-0"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

// ─── Tab Button ─────────────────────────────────────────────────────────────────

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
        active
          ? "bg-gray-900 text-white shadow-md"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ConfigLogisticaPage() {
  const showToast = useCallback((message: string, type: "success" | "error") => {
    type === "success" ? globalToast.success(message) : globalToast.error(message);
  }, []);

  // Active tab
  const [activeTab, setActiveTab] = useState(0);

  // ── Section 1: Global Config
  const [configs, setConfigs] = useState<MoovyConfigItem[]>([]);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [savingConfigs, setSavingConfigs] = useState(false);

  // ── Section 2: Package Categories
  const [categories, setCategories] = useState<PackageCategoryItem[]>([]);
  const [editedCategories, setEditedCategories] = useState<Record<string, Partial<PackageCategoryItem>>>({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [savingCategories, setSavingCategories] = useState(false);

  // ── Section 3: Shipment Types
  const [shipmentTypes, setShipmentTypes] = useState<Record<string, ShipmentTypeConfig>>({});
  const [loadingShipment, setLoadingShipment] = useState(true);
  const [savingShipment, setSavingShipment] = useState(false);

  // fix/asignacion-y-logistica (2026-06-05): removido el estado de Vehicle Speeds,
  // Priority Queue y ETA Calculator (tabs/config eliminados por ser fantasma/muertos).

  // ── Section: SLA Dashboard
  const [slaData, setSlaData] = useState<SLADashboardData | null>(null);
  const [loadingSLA, setLoadingSLA] = useState(true);

  // ── Section old: Delivery Rates
  const [rates, setRates] = useState<DeliveryRateItem[]>([]);
  const [editedRates, setEditedRates] = useState<Record<string, Partial<DeliveryRateItem>>>({});
  const [loadingRates, setLoadingRates] = useState(true);
  const [savingRates, setSavingRates] = useState(false);
  const [simDistance, setSimDistance] = useState(5);

  // ── Shipping Defaults (fallback config)
  const [shippingDefaults, setShippingDefaults] = useState<ShippingDefaultsConfig>({});
  const [loadingShippingDef, setLoadingShippingDef] = useState(true);
  const [savingShippingDef, setSavingShippingDef] = useState(false);

  // ─── Load all data ────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      // fix/asignacion-y-logistica (2026-06-05): removidos los fetch de
      // vehicle-speeds, priority-queue y eta-calculator (configs eliminadas).
      const results = await Promise.allSettled([
        fetch("/api/ops/config/global").then((r) => r.ok ? r.json() : null),
        fetch("/api/ops/config/categories").then((r) => r.ok ? r.json() : null),
        fetch("/api/ops/config/rates").then((r) => r.ok ? r.json() : null),
        fetch("/api/ops/config/shipment-types").then((r) => r.ok ? r.json() : null),
        fetch("/api/ops/config/shipping-defaults").then((r) => r.ok ? r.json() : null),
        fetch("/api/ops/logistics/sla-dashboard").then((r) => r.ok ? r.json() : null),
      ]);

      // 1. Global config
      if (results[0].status === "fulfilled" && results[0].value) {
        const data = results[0].value;
        setConfigs(data.configs || []);
        const map: Record<string, string> = {};
        for (const c of data.configs || []) map[c.key] = c.value;
        setConfigValues(map);
      }
      setLoadingConfigs(false);

      // 2. Categories
      if (results[1].status === "fulfilled" && results[1].value) {
        setCategories(results[1].value.categories || []);
      }
      setLoadingCategories(false);

      // 3. Rates
      if (results[2].status === "fulfilled" && results[2].value) {
        setRates(results[2].value.rates || []);
      }
      setLoadingRates(false);

      // 4. Shipment types
      if (results[3].status === "fulfilled" && results[3].value) {
        setShipmentTypes(results[3].value.config || {});
      }
      setLoadingShipment(false);

      // 5. Shipping defaults
      if (results[4].status === "fulfilled" && results[4].value) {
        setShippingDefaults(results[4].value.config || {});
      }
      setLoadingShippingDef(false);

      // 6. SLA Dashboard
      if (results[5].status === "fulfilled" && results[5].value) {
        setSlaData(results[5].value);
      }
      setLoadingSLA(false);
    }
    loadAll();
  }, []);

  // ─── Refresh SLA (auto-refresh every 30s when on that tab) ─────────────
  // fix/asignacion-y-logistica: SLA pasó de tab 6 a tab 3 tras la limpieza.
  useEffect(() => {
    if (activeTab !== 3) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/ops/logistics/sla-dashboard");
        if (res.ok) setSlaData(await res.json());
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // ─── Save: Global Config ───────────────────────────────────────────────
  async function saveGlobalConfig() {
    const ok = await confirm({ title: "Guardar configuración global", message: "Estos cambios afectan el motor logístico en producción. ¿Confirmar?", confirmLabel: "Guardar", variant: "warning" });
    if (!ok) return;
    setSavingConfigs(true);
    try {
      for (const field of GLOBAL_CONFIG_FIELDS) {
        const currentVal = configValues[field.key] ?? "";
        const existingConfig = configs.find((c) => c.key === field.key);
        if (existingConfig && existingConfig.value === currentVal) continue;
        if (!existingConfig && currentVal === "") continue;
        const res = await fetch("/api/ops/config/global", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: field.key, value: currentVal }),
        });
        if (!res.ok) throw new Error(`Error guardando ${field.key}`);
      }
      const refreshRes = await fetch("/api/ops/config/global");
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setConfigs(data.configs || []);
      }
      showToast("Configuración global guardada", "success");
    } catch {
      showToast("Error al guardar configuración global", "error");
    } finally {
      setSavingConfigs(false);
    }
  }

  // ─── Save: Categories ──────────────────────────────────────────────────
  async function saveCategories() {
    const ok = await confirm({ title: "Guardar categorías", message: "¿Guardar cambios en categorías de paquete?", confirmLabel: "Guardar", variant: "warning" });
    if (!ok) return;
    setSavingCategories(true);
    try {
      for (const [id, fields] of Object.entries(editedCategories)) {
        if (Object.keys(fields).length === 0) continue;
        const res = await fetch("/api/ops/config/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...fields }),
        });
        if (!res.ok) throw new Error(`Error guardando categoría ${id}`);
      }
      const refreshRes = await fetch("/api/ops/config/categories");
      if (refreshRes.ok) setCategories((await refreshRes.json()).categories || []);
      setEditedCategories({});
      showToast("Categorías de paquete guardadas", "success");
    } catch {
      showToast("Error al guardar categorías", "error");
    } finally {
      setSavingCategories(false);
    }
  }

  // ─── Save: Rates ───────────────────────────────────────────────────────
  async function saveRates() {
    const ok = await confirm({ title: "Guardar tarifas", message: "¿Guardar cambios en tarifas de envío?", confirmLabel: "Guardar", variant: "warning" });
    if (!ok) return;
    setSavingRates(true);
    try {
      for (const [id, fields] of Object.entries(editedRates)) {
        if (Object.keys(fields).length === 0) continue;
        const res = await fetch("/api/ops/config/rates", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...fields }),
        });
        if (!res.ok) throw new Error(`Error guardando tarifa ${id}`);
      }
      const refreshRes = await fetch("/api/ops/config/rates");
      if (refreshRes.ok) setRates((await refreshRes.json()).rates || []);
      setEditedRates({});
      showToast("Tarifas de envío guardadas", "success");
    } catch {
      showToast("Error al guardar tarifas", "error");
    } finally {
      setSavingRates(false);
    }
  }

  // ─── Save: Shipment Types ─────────────────────────────────────────────
  async function saveShipmentTypes() {
    const ok = await confirm({ title: "Guardar tipos de envío", message: "¿Confirmar cambios en tipos de envío?", confirmLabel: "Guardar", variant: "warning" });
    if (!ok) return;
    setSavingShipment(true);
    try {
      const res = await fetch("/api/ops/config/shipment-types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shipmentTypes),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error");
      }
      showToast("Tipos de envío guardados", "success");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al guardar tipos de envío", "error");
    } finally {
      setSavingShipment(false);
    }
  }

  // fix/asignacion-y-logistica (2026-06-05): removidos saveVehicleSpeeds,
  // savePriorityConfig y saveETAConfig (configs eliminadas — eran fantasma/muertas).

  // ─── Save: Shipping Defaults ──────────────────────────────────────────
  async function saveShippingDefaults() {
    const ok = await confirm({ title: "Guardar tarifas por defecto", message: "¿Confirmar cambios en tarifas por defecto?", confirmLabel: "Guardar", variant: "warning" });
    if (!ok) return;
    setSavingShippingDef(true);
    try {
      const res = await fetch("/api/ops/config/shipping-defaults", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shippingDefaults),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error");
      }
      showToast("Tarifas por defecto guardadas", "success");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al guardar tarifas", "error");
    } finally {
      setSavingShippingDef(false);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────
  function getCategoryValue<K extends keyof PackageCategoryItem>(cat: PackageCategoryItem, field: K): PackageCategoryItem[K] {
    const edited = editedCategories[cat.id];
    if (edited && field in edited) return edited[field] as PackageCategoryItem[K];
    return cat[field];
  }

  function updateCategory(id: string, field: string, value: unknown) {
    setEditedCategories((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function updateRate(id: string, field: string, value: number) {
    setEditedRates((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setRates((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function updateShipmentField(code: string, field: string, value: unknown) {
    setShipmentTypes((prev) => ({
      ...prev,
      [code]: { ...prev[code], [field]: value },
    }));
  }

  // ─── Loading state ────────────────────────────────────────────────────
  const anyLoading = loadingConfigs || loadingCategories || loadingRates || loadingShipment;
  if (anyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-moovy" />
      </div>
    );
  }

  // ─── Tab definitions ──────────────────────────────────────────────────
  // fix/asignacion-y-logistica (2026-06-05): removidos los tabs "Vehículos"
  // (vehicle_speeds_config), "Prioridad" (order_priority_config) y "ETA"
  // (eta_calculator_config) — eran config fantasma / código muerto. Los índices
  // de los tabs restantes se recompactaron (SLA en Vivo y Tarifas bajan de 6/7 a 3/4).
  const TABS = [
    "Global",
    "Paquetes",
    "Tipos de Envío",
    "SLA en Vivo",
    "Tarifas",
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3 italic">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20 not-italic flex-shrink-0">
            <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          Motor Logístico
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-1">
          Configuración completa del sistema de delivery y asignación
        </p>
      </div>

      {/* Tabs: scrollable horizontally on mobile, wrap on larger screens */}
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
        <div className="flex gap-2 sm:flex-wrap min-w-max sm:min-w-0 pb-1">
          {TABS.map((tab, i) => (
            <TabButton key={tab} label={tab} active={activeTab === i} onClick={() => setActiveTab(i)} />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 0 — Configuración Global
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        <SectionCard
          icon={Globe}
          iconColor="bg-blue-50 text-blue-600"
          title="Configuración Global"
          subtitle="Parámetros clave del sistema"
          accentColor="bg-blue-500/5"
          saving={savingConfigs}
          onSave={saveGlobalConfig}
        >
          <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              <strong>Timeouts, comisiones y delivery</strong> se configuran desde la{" "}
              <a href="/ops/config-biblia" className="underline font-bold hover:text-blue-900">
                Biblia Financiera
              </a>
              . Los cambios se sincronizan automáticamente.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GLOBAL_CONFIG_FIELDS.map((field) => (
              <div key={field.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-colors">
                <div className="flex items-center mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {field.label}
                  </label>
                  <InfoButton infoKey={field.key} />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.key.includes("pct") ? "0.1" : "1"}
                    value={configValues[field.key] ?? ""}
                    onChange={(e) => setConfigValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-14"
                  />
                  {field.unit && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase">
                      {field.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 1 — Categorías de Paquete
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <SectionCard
          icon={Package}
          iconColor="bg-amber-50 text-amber-600"
          title="Categorías de Paquete"
          subtitle="Dimensiones y vehículos por tamaño"
          accentColor="bg-amber-500/5"
          saving={savingCategories}
          onSave={saveCategories}
        >
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-black text-gray-900 mb-4">{cat.name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { field: "maxWeightGrams", label: "Peso máx (g)", min: 0 },
                    { field: "maxLengthCm", label: "Largo máx (cm)", min: 0 },
                    { field: "maxWidthCm", label: "Ancho máx (cm)", min: 0 },
                    { field: "maxHeightCm", label: "Alto máx (cm)", min: 0 },
                  ].map(({ field, label, min }) => (
                    <div key={field}>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        {label}
                      </label>
                      <input
                        type="number"
                        min={min}
                        value={getCategoryValue(cat, field as keyof PackageCategoryItem) as number}
                        onChange={(e) => updateCategory(cat.id, field, Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Vehículos permitidos
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {VEHICLE_OPTIONS.map((v) => {
                      const allowed = (getCategoryValue(cat, "allowedVehicles") as string[]) || [];
                      const isSelected = allowed.includes(v);
                      return (
                        <button
                          key={v}
                          onClick={() => {
                            const newList = isSelected ? allowed.filter((x) => x !== v) : [...allowed, v];
                            updateCategory(cat.id, "allowedVehicles", newList);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-amber-500 text-white shadow-md"
                              : "bg-white border border-slate-200 text-slate-500 hover:border-amber-300"
                          }`}
                        >
                          {VEHICLE_LABELS[v]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 2 — Tipos de Envío (ShipmentType)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 2 && (
        <SectionCard
          icon={Flame}
          iconColor="bg-red-50 text-red-600"
          title="Tipos de Envío"
          subtitle="SLA, prioridad, recargos y restricciones"
          accentColor="bg-red-500/5"
          saving={savingShipment}
          onSave={saveShipmentTypes}
        >
          <div className="space-y-4">
            {Object.entries(shipmentTypes).map(([code, st]) => {
              const IconComp = SHIPMENT_TYPE_ICONS[code] || Box;
              const colorClass = SHIPMENT_TYPE_COLORS[code] || "text-slate-500 bg-slate-50";
              return (
                <div key={code} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900">{st.name || code}</h3>
                      <p className="text-[10px] text-slate-400">{st.label}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {/* SLA */}
                    <div>
                      <div className="flex items-center mb-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SLA (min)</label>
                        <InfoButton infoKey="shipmentType_maxDeliveryMinutes" />
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={st.maxDeliveryMinutes}
                        onChange={(e) => updateShipmentField(code, "maxDeliveryMinutes", Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                    </div>
                    {/* Priority Weight */}
                    <div>
                      <div className="flex items-center mb-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prioridad</label>
                        <InfoButton infoKey="shipmentType_priorityWeight" />
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={st.priorityWeight}
                        onChange={(e) => updateShipmentField(code, "priorityWeight", Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                    </div>
                    {/* Surcharge */}
                    <div>
                      <div className="flex items-center mb-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recargo $</label>
                        <InfoButton infoKey="shipmentType_surchargeArs" />
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={st.surchargeArs}
                        onChange={(e) => updateShipmentField(code, "surchargeArs", Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Vehicles */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vehículos</label>
                      <InfoButton infoKey="shipmentType_allowedVehicles" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {VEHICLE_OPTIONS.map((v) => {
                        const isSelected = st.allowedVehicles?.includes(v);
                        return (
                          <button
                            key={v}
                            onClick={() => {
                              const newList = isSelected
                                ? st.allowedVehicles.filter((x) => x !== v)
                                : [...(st.allowedVehicles || []), v];
                              updateShipmentField(code, "allowedVehicles", newList);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? "bg-red-500 text-white shadow-md"
                                : "bg-white border border-slate-200 text-slate-500 hover:border-red-300"
                            }`}
                          >
                            {VEHICLE_LABELS[v]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Flags */}
                  <div className="flex gap-4 flex-wrap">
                    {[
                      { field: "requiresThermalBag", label: "Bolsa térmica", infoKey: "shipmentType_requiresThermalBag" },
                      { field: "requiresColdChain", label: "Cadena de frío", infoKey: "shipmentType_requiresColdChain" },
                      { field: "requiresCarefulHandle", label: "Frágil", infoKey: "shipmentType_requiresCarefulHandle" },
                    ].map(({ field, label, infoKey }) => (
                      <label key={field} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!(st as unknown as Record<string, unknown>)[field]}
                          onChange={(e) => updateShipmentField(code, field, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-500"
                        />
                        <span className="text-xs font-bold text-slate-600">{label}</span>
                        <InfoButton infoKey={infoKey} />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 3 — Dashboard SLA en Vivo
          (fix/asignacion-y-logistica: era el tab 6; subió a 3 tras remover
          Vehículos/Prioridad/ETA)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 3 && (
        <SectionCard
          icon={BarChart3}
          iconColor="bg-rose-50 text-rose-600"
          title="Dashboard SLA en Vivo"
          subtitle="Estado de pedidos activos en tiempo real (auto-refresh 30s)"
          accentColor="bg-rose-500/5"
        >
          {loadingSLA ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : slaData ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Activos", value: slaData.kpis.totalActive, color: "text-gray-900" },
                  { label: "Críticos", value: slaData.kpis.criticalCount, color: "text-red-600" },
                  { label: "Urgentes", value: slaData.kpis.urgentCount, color: "text-amber-600" },
                  { label: "Sin repartidor", value: slaData.kpis.withoutDriver, color: "text-orange-600" },
                  { label: "Exceden SLA", value: slaData.kpis.exceedingSLA, color: "text-red-600" },
                  { label: "Espera prom.", value: `${slaData.kpis.avgWaitMin} min`, color: "text-blue-600" },
                  { label: "SLA 24h", value: `${slaData.kpis.slaComplianceRate}%`, color: slaData.kpis.slaComplianceRate > 80 ? "text-green-600" : "text-red-600" },
                  { label: "Entregados 24h", value: `${slaData.kpis.recentDelivered}/${slaData.kpis.recentTotal}`, color: "text-slate-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-4 bg-slate-50 rounded-xl text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className={`text-2xl font-black ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Orders table */}
              {slaData.orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                  <p className="font-bold">No hay pedidos activos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="text-left py-2 px-3">Pedido</th>
                        <th className="text-left py-2 px-3">Tipo</th>
                        <th className="text-left py-2 px-3">Comercio</th>
                        <th className="text-center py-2 px-3">Espera</th>
                        <th className="text-center py-2 px-3">SLA</th>
                        <th className="text-center py-2 px-3">Prioridad</th>
                        <th className="text-center py-2 px-3">Driver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slaData.orders.map((order) => (
                        <tr
                          key={order.id}
                          className={`border-t border-slate-100 ${
                            order.exceedsSLA
                              ? "bg-red-50"
                              : order.slaPercent > 80
                                ? "bg-amber-50"
                                : ""
                          }`}
                        >
                          <td className="py-3 px-3 font-bold text-gray-900">#{order.orderNumber}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${SHIPMENT_TYPE_COLORS[order.shipmentTypeCode] || "bg-slate-50 text-slate-500"}`}>
                              {order.shipmentTypeIcon} {order.shipmentTypeCode}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">{order.merchantName}</td>
                          <td className="py-3 px-3 text-center font-bold">
                            {order.elapsedMin} min
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    order.slaPercent > 100
                                      ? "bg-red-500"
                                      : order.slaPercent > 80
                                        ? "bg-amber-500"
                                        : "bg-green-500"
                                  }`}
                                  style={{ width: `${Math.min(order.slaPercent, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">{order.slaPercent}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-black text-purple-600">{order.priority}</td>
                          <td className="py-3 px-3 text-center">
                            {order.hasDriver ? (
                              <span className="text-green-500 font-bold text-xs">Asignado</span>
                            ) : (
                              <span className="flex items-center justify-center gap-1 text-orange-500 font-bold text-xs">
                                <AlertTriangle className="w-3 h-3" />
                                {order.assignmentAttempts > 0 ? `${order.assignmentAttempts} intentos` : "Pendiente"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-slate-400 py-8">Error al cargar dashboard SLA</p>
          )}
        </SectionCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 4 — Tarifas de Envío (DeliveryRate + Shipping Defaults)
          (fix/asignacion-y-logistica: era el tab 7; bajó a 4)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 4 && (
        <>
          {/* Delivery Rates from DB */}
          <SectionCard
            icon={Truck}
            iconColor="bg-indigo-50 text-indigo-600"
            title="Tarifas de Envío (DB)"
            subtitle="Tarifas por categoría de paquete desde DeliveryRate"
            accentColor="bg-indigo-500/5"
            saving={savingRates}
            onSave={saveRates}
          >
            <div className="space-y-3">
              {rates.map((rate) => (
                <div key={rate.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-3 gap-4 items-center">
                  <div>
                    <span className="text-sm font-black text-gray-900">{rate.category.name}</span>
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base (ARS)</label>
                      <InfoButton infoKey="shipping_basePriceArs" />
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={rate.basePriceArs}
                      onChange={(e) => updateRate(rate.id, "basePriceArs", Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">$/km</label>
                      <InfoButton infoKey="shipping_pricePerKmArs" />
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={rate.pricePerKmArs}
                      onChange={(e) => updateRate(rate.id, "pricePerKmArs", Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Simulator */}
            <div className="mt-6 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Simulador de costos</h4>
              <div className="flex items-center gap-3 mb-4">
                <label className="text-xs font-bold text-slate-600">Distancia:</label>
                <input
                  type="number"
                  min={0.5}
                  max={50}
                  step={0.5}
                  value={simDistance}
                  onChange={(e) => setSimDistance(Number(e.target.value))}
                  className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-400">km</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {rates.map((rate) => {
                  const total = Math.round(rate.basePriceArs + rate.pricePerKmArs * simDistance);
                  return (
                    <div key={rate.id} className="bg-white p-3 rounded-xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase">{rate.category.name}</p>
                      <p className="text-lg font-black text-indigo-600">${total.toLocaleString("es-AR")}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {/* Shipping Defaults (fallback) */}
          <SectionCard
            icon={Clock}
            iconColor="bg-orange-50 text-orange-600"
            title="Tarifas Fallback"
            subtitle="Se usan si la tabla DeliveryRate no tiene datos para la categoría"
            accentColor="bg-orange-500/5"
            saving={savingShippingDef}
            onSave={saveShippingDefaults}
          >
            <div className="space-y-3">
              {Object.entries(shippingDefaults).map(([cat, values]) => (
                <div key={cat} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-3 gap-4 items-center">
                  <span className="text-sm font-black text-gray-900">{cat}</span>
                  <div>
                    <div className="flex items-center mb-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base (ARS)</label>
                      <InfoButton infoKey="shipping_basePriceArs" />
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={values.basePriceArs}
                      onChange={(e) =>
                        setShippingDefaults((prev) => ({
                          ...prev,
                          [cat]: { ...prev[cat], basePriceArs: Number(e.target.value) },
                        }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">$/km</label>
                      <InfoButton infoKey="shipping_pricePerKmArs" />
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={values.pricePerKmArs}
                      onChange={(e) =>
                        setShippingDefaults((prev) => ({
                          ...prev,
                          [cat]: { ...prev[cat], pricePerKmArs: Number(e.target.value) },
                        }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
