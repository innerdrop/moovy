"use client";

import { useState, useCallback } from "react";
import {
  Truck, DollarSign, Gift, Banknote, Clock, Calendar,
  Shield, ChevronDown, ChevronUp, Save, AlertTriangle,
  Info, Calculator, Snowflake, CloudRain, Sun, Zap, Megaphone,
} from "lucide-react";
import { toast as globalToast } from "@/store/toast";
import { confirm } from "@/store/confirm";
import type { FullOpsConfig } from "@/lib/ops-config";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  initialConfig: FullOpsConfig;
}

type SectionKey = "delivery" | "commissions" | "points" | "cashProtocol" | "scheduledDelivery" | "timeouts" | "advertising";

// ─── Toast ──────────────────────────────────────────────────────────────────────

// ─── Info Tooltip ──────────────────────────────────────────────────────────────

function InfoTip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
      >
        <Info className="w-3 h-3 text-slate-500" />
      </button>
      {show && (
        <div className="absolute z-40 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 -mt-1" />
        </div>
      )}
    </span>
  );
}

// ─── Number Input ──────────────────────────────────────────────────────────────

function NumInput({
  label, name, value, onChange, min, max, step, unit, info,
}: {
  label: string; name: string; value: number; onChange: (name: string, value: number) => void;
  min?: number; max?: number; step?: number; unit?: string; info?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
        {label}
        {info && <InfoTip text={info} />}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(name, parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step || 1}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{unit}</span>
        )}
      </div>
    </div>
  );
}

// ─── String Input ──────────────────────────────────────────────────────────────

function StrInput({
  label, name, value, onChange, info,
}: {
  label: string; name: string; value: string; onChange: (name: string, value: string) => void; info?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
        {label}
        {info && <InfoTip text={info} />}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
      />
    </div>
  );
}

// ─── Section Wrapper ───────────────────────────────────────────────────────────

function Section({
  title, subtitle, icon: Icon, color, children, sectionKey, expanded, onToggle, dirty, saving, onSave,
}: {
  title: string; subtitle: string; icon: any; color: string; children: React.ReactNode;
  sectionKey: SectionKey; expanded: boolean; onToggle: () => void; dirty: boolean; saving: boolean; onSave: () => void;
}) {
  const colorMap: Record<string, string> = {
    red: "bg-red-50 text-red-600 border-red-100",
    green: "bg-green-50 text-green-600 border-green-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };
  const iconBg = colorMap[color] || colorMap.slate;

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden transition-all">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-black text-gray-900 leading-none flex items-center gap-2">
              {title}
              {dirty && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-slate-100">
          <div className="pt-6 space-y-6">
            {children}
          </div>
          {dirty && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/20 transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Climate Selector ──────────────────────────────────────────────────────────

function ClimateSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { key: "normal", label: "Normal", icon: Sun, color: "text-amber-500" },
    { key: "lluvia", label: "Lluvia", icon: CloudRain, color: "text-blue-500" },
    { key: "nieve", label: "Nieve", icon: Snowflake, color: "text-cyan-500" },
    { key: "extremo", label: "Extremo", icon: Zap, color: "text-red-500" },
  ];

  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
        Condición climática activa
        <InfoTip text="Seleccioná la condición climática actual en Ushuaia. Afecta el multiplicador del delivery fee en tiempo real." />
      </label>
      <div className="grid grid-cols-4 gap-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-bold ${
              value === opt.key
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-slate-200 hover:border-slate-300 text-slate-500"
            }`}
          >
            <opt.icon className={`w-5 h-5 ${value === opt.key ? "text-red-500" : opt.color}`} />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Delivery Fee Simulator ────────────────────────────────────────────────────

function DeliverySimulator({ config }: { config: FullOpsConfig["delivery"] }) {
  const [simDist, setSimDist] = useState(3);
  const [simZone, setSimZone] = useState("ZONA_A");
  const [simSubtotal, setSimSubtotal] = useState(8000);

  const zoneMult = config.zoneMultipliers[simZone] ?? 1.0;
  const climateMult = config.climateMultipliers[config.activeClimateCondition] ?? 1.0;
  const costPerKm = config.fuelPricePerLiter * config.fuelConsumptionPerKm * 2;
  const basePlusDist = config.baseDeliveryFee + (costPerKm * simDist);
  const withMaint = basePlusDist * config.maintenanceFactor;
  const withMults = withMaint * zoneMult * climateMult;
  const opCost = simSubtotal * (config.operationalCostPercent / 100);
  const totalFee = Math.ceil(withMults + opCost);
  const riderEarns = Math.round(totalFee * (config.riderCommissionPercent / 100));
  const moovyKeeps = totalFee - riderEarns;

  return (
    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
      <h3 className="text-sm font-black text-slate-700 flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4 text-red-500" />
        Simulador de delivery fee
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">Distancia</label>
          <div className="flex items-center gap-1">
            <input
              type="range"
              min={0.5}
              max={15}
              step={0.5}
              value={simDist}
              onChange={(e) => setSimDist(parseFloat(e.target.value))}
              className="flex-1 accent-red-500"
            />
            <span className="text-xs font-bold text-slate-700 w-10 text-right">{simDist} km</span>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">Zona</label>
          <select
            value={simZone}
            onChange={(e) => setSimZone(e.target.value)}
            className="w-full px-2 py-1 text-xs font-semibold border border-slate-200 rounded-lg"
          >
            {Object.keys(config.zoneMultipliers).map((z) => (
              <option key={z} value={z}>{z.replace("ZONA_", "Zona ")} (×{config.zoneMultipliers[z]})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">Subtotal</label>
          <input
            type="number"
            value={simSubtotal}
            onChange={(e) => setSimSubtotal(parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1 text-xs font-semibold border border-slate-200 rounded-lg"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Fee total</p>
          <p className="text-lg font-black text-red-600">${totalFee.toLocaleString("es-AR")}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Repartidor ({config.riderCommissionPercent}%)</p>
          <p className="text-lg font-black text-green-600">${riderEarns.toLocaleString("es-AR")}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Moovy ({100 - config.riderCommissionPercent}%)</p>
          <p className="text-lg font-black text-violet-600">${moovyKeeps.toLocaleString("es-AR")}</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-2 text-center">
        Base ${Math.round(config.baseDeliveryFee)} + Dist ${Math.round(costPerKm * simDist)} × Mant {config.maintenanceFactor} × Zona {zoneMult} × Clima {climateMult} + Op ${Math.round(opCost)}
      </p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function BibliaConfigClient({ initialConfig }: Props) {
  const [config, setConfig] = useState<FullOpsConfig>(initialConfig);
  const [expanded, setExpanded] = useState<SectionKey | null>(null);
  const [dirty, setDirty] = useState<Set<SectionKey>>(new Set());
  const [saving, setSaving] = useState<SectionKey | null>(null);
  const toggle = (key: SectionKey) => setExpanded((prev) => (prev === key ? null : key));

  const updateField = useCallback((section: SectionKey, field: string, value: number | string) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
    setDirty((prev) => new Set(prev).add(section));
  }, []);

  const saveSection = useCallback(async (section: SectionKey) => {
    const ok = await confirm({ title: "Guardar sección", message: "Los cambios en la Biblia Financiera se aplican de inmediato. ¿Confirmar?", confirmLabel: "Guardar", variant: "warning" });
    if (!ok) return;
    setSaving(section);
    try {
      const res = await fetch("/api/admin/ops-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data: config[section] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error desconocido");

      setConfig(json.config);
      setDirty((prev) => {
        const next = new Set(prev);
        next.delete(section);
        return next;
      });
      globalToast.success("Configuración guardada correctamente");
    } catch (err: any) {
      globalToast.error(err.message || "Error al guardar");
    } finally {
      setSaving(null);
    }
  }, [config]);

  // Helper to update nested zone/climate multipliers
  const updateMultiplier = (section: "delivery", mapKey: "zoneMultipliers" | "climateMultipliers", subKey: string, value: number) => {
    setConfig((prev) => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        [mapKey]: { ...prev.delivery[mapKey], [subKey]: value },
      },
    }));
    setDirty((prev) => new Set(prev).add("delivery"));
  };

  return (
    <div className="space-y-4">
      {/* ═══ DELIVERY ═══ */}
      <Section
        title="Delivery & Logística"
        subtitle="Tarifas, zonas, clima, comisión repartidor"
        icon={Truck}
        color="red"
        sectionKey="delivery"
        expanded={expanded === "delivery"}
        onToggle={() => toggle("delivery")}
        dirty={dirty.has("delivery")}
        saving={saving === "delivery"}
        onSave={() => saveSection("delivery")}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumInput label="Tarifa base" name="baseDeliveryFee" value={config.delivery.baseDeliveryFee}
            onChange={(n, v) => updateField("delivery", n, v)} min={0} max={10000} unit="ARS"
            info="Monto fijo mínimo que se cobra por delivery, antes de agregar distancia." />
          <NumInput label="Precio combustible" name="fuelPricePerLiter" value={config.delivery.fuelPricePerLiter}
            onChange={(n, v) => updateField("delivery", n, v)} min={100} max={5000} unit="ARS/L"
            info="Precio actual del litro de nafta en Ushuaia." />
          <NumInput label="Consumo por km" name="fuelConsumptionPerKm" value={config.delivery.fuelConsumptionPerKm}
            onChange={(n, v) => updateField("delivery", n, v)} min={0.01} max={0.5} step={0.01} unit="L/km"
            info="Litros de combustible por kilómetro (0.06 = moto, 0.10 = auto)." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumInput label="Factor mantenimiento" name="maintenanceFactor" value={config.delivery.maintenanceFactor}
            onChange={(n, v) => updateField("delivery", n, v)} min={1} max={3} step={0.05} unit="×"
            info="Multiplicador por desgaste del vehículo + margen. 1.35 = +35%." />
          <NumInput label="Distancia máxima" name="maxDeliveryDistance" value={config.delivery.maxDeliveryDistance}
            onChange={(n, v) => updateField("delivery", n, v)} min={1} max={50} unit="km"
            info="Radio máximo de entrega desde el comercio." />
          <NumInput label="Costo operativo" name="operationalCostPercent" value={config.delivery.operationalCostPercent}
            onChange={(n, v) => updateField("delivery", n, v)} min={0} max={20} step={0.5} unit="%"
            info="Porcentaje del subtotal que se agrega al fee para cubrir MercadoPago (3.81%) + margen Moovy. Se cobra dentro del delivery fee." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumInput label="Comisión repartidor" name="riderCommissionPercent" value={config.delivery.riderCommissionPercent}
            onChange={(n, v) => updateField("delivery", n, v)} min={50} max={95} step={1} unit="%"
            info="Porcentaje del delivery fee que se le paga al repartidor. El resto es para Moovy." />
          <NumInput label="Envío gratis desde" name="freeDeliveryMinimum" value={config.delivery.freeDeliveryMinimum ?? 0}
            onChange={(n, v) => updateField("delivery", n, v)} min={0} max={100000} unit="ARS"
            info="Monto mínimo del pedido para envío gratis. 0 = desactivado." />
        </div>

        {/* Zone Multipliers */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
            Multiplicadores por zona
            <InfoTip text="Cada zona de Ushuaia tiene un multiplicador. Zona A (centro) = 1.0, Zona B (intermedia) = 1.15, Zona C (faldeo/alta) = 1.35." />
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(config.delivery.zoneMultipliers).map(([zone, mult]) => (
              <div key={zone} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">{zone.replace("ZONA_", "Zona ")}</label>
                <input
                  type="number"
                  value={mult}
                  onChange={(e) => updateMultiplier("delivery", "zoneMultipliers", zone, parseFloat(e.target.value) || 1)}
                  step={0.05}
                  min={0.5}
                  max={3}
                  className="w-full px-3 py-1.5 text-sm font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/30"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Climate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ClimateSelector
            value={config.delivery.activeClimateCondition}
            onChange={(v) => updateField("delivery", "activeClimateCondition", v)}
          />
          <div>
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
              Multiplicadores climáticos
              <InfoTip text="Recargo por condiciones climáticas adversas en Ushuaia." />
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(config.delivery.climateMultipliers).map(([cond, mult]) => (
                <div key={cond} className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 capitalize block mb-0.5">{cond}</label>
                  <input
                    type="number"
                    value={mult}
                    onChange={(e) => updateMultiplier("delivery", "climateMultipliers", cond, parseFloat(e.target.value) || 1)}
                    step={0.05}
                    min={0.5}
                    max={3}
                    className="w-full px-2 py-1 text-xs font-bold border border-slate-200 rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Simulator */}
        <DeliverySimulator config={config.delivery} />
      </Section>

      {/* ═══ COMMISSIONS ═══ */}
      <Section
        title="Comisiones"
        subtitle="Merchant, seller, marketplace"
        icon={DollarSign}
        color="green"
        sectionKey="commissions"
        expanded={expanded === "commissions"}
        onToggle={() => toggle("commissions")}
        dirty={dirty.has("commissions")}
        saving={saving === "commissions"}
        onSave={() => saveSection("commissions")}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumInput label="Comisión merchant (defecto)" name="defaultMerchantCommission" value={config.commissions.defaultMerchantCommission}
            onChange={(n, v) => updateField("commissions", n, v)} min={1} max={30} step={0.5} unit="%"
            info="Comisión base para comercios nuevos (BRONCE). Se reduce con fidelización: PLATA 7%, ORO 6%, DIAMANTE 5%." />
          <NumInput label="Comisión seller" name="defaultSellerCommission" value={config.commissions.defaultSellerCommission}
            onChange={(n, v) => updateField("commissions", n, v)} min={1} max={30} step={0.5} unit="%"
            info="Comisión para vendedores del marketplace." />
          <NumInput label="Comisión repartidor" name="riderCommissionPercent" value={config.commissions.riderCommissionPercent}
            onChange={(n, v) => updateField("commissions", n, v)} min={50} max={95} step={1} unit="%"
            info="% del delivery fee que se paga al repartidor. Resto = Moovy." />
        </div>

        {/* Merchant Tiers Display */}
        {config.merchantTiers.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Tiers de fidelización (configurables en Fidelización Merchants)
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {config.merchantTiers.map((tier) => (
                <div key={tier.tier} className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{tier.tier}</p>
                  <p className="text-xl font-black text-slate-700">{tier.commissionRate}%</p>
                  <p className="text-[10px] text-slate-400">{tier.minOrdersPerMonth}+ pedidos/mes</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revenue Calculator */}
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <h3 className="text-sm font-black text-green-700 flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4" />
            Ejemplo: Pedido $10.000 (merchant BRONCE, 3km, Zona A)
          </h3>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-[10px] font-bold text-slate-400">Comisión Moovy</p>
              <p className="font-black text-green-600">${Math.round(10000 * config.commissions.defaultMerchantCommission / 100).toLocaleString("es-AR")}</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-[10px] font-bold text-slate-400">Pago merchant</p>
              <p className="font-black text-slate-700">${Math.round(10000 * (1 - config.commissions.defaultMerchantCommission / 100)).toLocaleString("es-AR")}</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-[10px] font-bold text-slate-400">Fee delivery est.</p>
              <p className="font-black text-red-600">
                ${Math.ceil((config.delivery.baseDeliveryFee + config.delivery.fuelPricePerLiter * config.delivery.fuelConsumptionPerKm * 2 * 3) * config.delivery.maintenanceFactor + 10000 * config.delivery.operationalCostPercent / 100).toLocaleString("es-AR")}
              </p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-[10px] font-bold text-slate-400">Ingreso Moovy total</p>
              <p className="font-black text-violet-600">
                ${Math.round(10000 * config.commissions.defaultMerchantCommission / 100 + Math.ceil((config.delivery.baseDeliveryFee + config.delivery.fuelPricePerLiter * config.delivery.fuelConsumptionPerKm * 2 * 3) * config.delivery.maintenanceFactor + 10000 * config.delivery.operationalCostPercent / 100) * (1 - config.commissions.riderCommissionPercent / 100)).toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ POINTS / MOOVER ═══ */}
      <Section
        title="Programa MOOVER"
        subtitle="Puntos, bonos, descuentos, niveles"
        icon={Gift}
        color="violet"
        sectionKey="points"
        expanded={expanded === "points"}
        onToggle={() => toggle("points")}
        dirty={dirty.has("points")}
        saving={saving === "points"}
        onSave={() => saveSection("points")}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumInput label="Puntos por peso gastado" name="pointsPerDollar" value={config.points.pointsPerDollar}
            onChange={(n, v) => updateField("points", n, v)} min={0.01} max={100} step={0.1} unit="pts/$"
            info="Cuántos puntos gana el comprador por cada $1 gastado. 1 = 1 punto por peso." />
          <NumInput label="Valor del punto" name="pointsValue" value={config.points.pointsValue}
            onChange={(n, v) => updateField("points", n, v)} min={0.001} max={1} step={0.001} unit="ARS"
            info="Cuántos ARS vale cada punto al canjear. 0.015 = 1.5 centavos por punto." />
          <NumInput label="Máx descuento" name="maxDiscountPercent" value={config.points.maxDiscountPercent}
            onChange={(n, v) => updateField("points", n, v)} min={1} max={100} step={1} unit="%"
            info="Porcentaje máximo del pedido que se puede pagar con puntos." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumInput label="Mín puntos para canjear" name="minPointsToRedeem" value={config.points.minPointsToRedeem}
            onChange={(n, v) => updateField("points", n, v)} min={0} max={10000} unit="pts"
            info="Cantidad mínima de puntos que debe tener el usuario para poder usarlos." />
          <NumInput label="Mín compra para puntos" name="minPurchaseForPoints" value={config.points.minPurchaseForPoints}
            onChange={(n, v) => updateField("points", n, v)} min={0} max={100000} unit="ARS"
            info="Monto mínimo de compra para que se otorguen puntos. 0 = siempre." />
          <NumInput label="Ventana de niveles" name="tierWindowDays" value={config.points.tierWindowDays}
            onChange={(n, v) => updateField("points", n, v)} min={30} max={365} unit="días"
            info="Período en días para evaluar el nivel del comprador. 90 = últimos 3 meses." />
        </div>

        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Bonos</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <NumInput label="Bono registro" name="signupBonus" value={config.points.signupBonus}
            onChange={(n, v) => updateField("points", n, v)} min={0} max={10000} unit="pts"
            info="Puntos pendientes al registrarse. Se activan con la primera compra calificada." />
          <NumInput label="Bono referidor" name="referralBonus" value={config.points.referralBonus}
            onChange={(n, v) => updateField("points", n, v)} min={0} max={10000} unit="pts"
            info="Puntos que gana quien refiere cuando el referido hace su primera compra." />
          <NumInput label="Bono referido" name="refereeBonus" value={config.points.refereeBonus}
            onChange={(n, v) => updateField("points", n, v)} min={0} max={10000} unit="pts"
            info="Puntos extra para el usuario referido." />
          <NumInput label="Bono reseña" name="reviewBonus" value={config.points.reviewBonus}
            onChange={(n, v) => updateField("points", n, v)} min={0} max={1000} unit="pts"
            info="Puntos que gana el comprador al dejar una reseña." />
        </div>

        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Activación de bonos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumInput label="Compra mín para activar bono" name="minPurchaseForBonus" value={config.points.minPurchaseForBonus}
            onChange={(n, v) => updateField("points", n, v)} min={0} max={100000} unit="ARS"
            info="Monto mínimo de la primera compra para que se activen los bonos pendientes." />
          <NumInput label="Compra mín para referido" name="minReferralPurchase" value={config.points.minReferralPurchase}
            onChange={(n, v) => updateField("points", n, v)} min={0} max={100000} unit="ARS"
            info="Monto mínimo de compra del referido para que cuente el referral." />
        </div>

        {/* Points Simulator */}
        <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
          <h3 className="text-sm font-black text-violet-700 flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4" />
            Simulador: Compra de $8.000
          </h3>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-[10px] font-bold text-slate-400">Puntos ganados</p>
              <p className="font-black text-violet-600">{Math.floor(8000 * config.points.pointsPerDollar)}</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-[10px] font-bold text-slate-400">Valor en ARS</p>
              <p className="font-black text-green-600">
                ${(Math.floor(8000 * config.points.pointsPerDollar) * config.points.pointsValue).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-[10px] font-bold text-slate-400">Máx descuento</p>
              <p className="font-black text-amber-600">${Math.round(8000 * config.points.maxDiscountPercent / 100)}</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-[10px] font-bold text-slate-400">Cashback %</p>
              <p className="font-black text-blue-600">{(config.points.pointsPerDollar * config.points.pointsValue * 100).toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ CASH PROTOCOL ═══ */}
      <Section
        title="Protocolo de Efectivo"
        subtitle="Confianza progresiva, límites, seguridad"
        icon={Banknote}
        color="amber"
        sectionKey="cashProtocol"
        expanded={expanded === "cashProtocol"}
        onToggle={() => toggle("cashProtocol")}
        dirty={dirty.has("cashProtocol")}
        saving={saving === "cashProtocol"}
        onSave={() => saveSection("cashProtocol")}
      >
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
          <p className="text-xs text-amber-700 font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Los primeros pedidos del repartidor son solo MercadoPago. Después se desbloquea efectivo con límites progresivos.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumInput label="Entregas solo MP antes de efectivo" name="cashMpOnlyDeliveries" value={config.cashProtocol.cashMpOnlyDeliveries}
            onChange={(n, v) => updateField("cashProtocol", n, v)} min={0} max={100} unit="entregas"
            info="Cantidad de entregas que el repartidor debe completar con MercadoPago antes de poder recibir pedidos en efectivo." />
          <NumInput label="Límite nivel 1 (nuevos)" name="cashLimitL1" value={config.cashProtocol.cashLimitL1}
            onChange={(n, v) => updateField("cashProtocol", n, v)} min={0} max={200000} unit="ARS"
            info="Máximo efectivo acumulable para repartidores nuevos (primeras 50 entregas)." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumInput label="Límite nivel 2 (regulares)" name="cashLimitL2" value={config.cashProtocol.cashLimitL2}
            onChange={(n, v) => updateField("cashProtocol", n, v)} min={0} max={200000} unit="ARS"
            info="Máximo efectivo para repartidores regulares (50-200 entregas)." />
          <NumInput label="Límite nivel 3 (veteranos)" name="cashLimitL3" value={config.cashProtocol.cashLimitL3}
            onChange={(n, v) => updateField("cashProtocol", n, v)} min={0} max={200000} unit="ARS"
            info="Máximo efectivo para repartidores veteranos (200+ entregas)." />
        </div>
      </Section>

      {/* ═══ SCHEDULED DELIVERY ═══ */}
      <Section
        title="Delivery Programado"
        subtitle="Slots, capacidad, horarios"
        icon={Calendar}
        color="blue"
        sectionKey="scheduledDelivery"
        expanded={expanded === "scheduledDelivery"}
        onToggle={() => toggle("scheduledDelivery")}
        dirty={dirty.has("scheduledDelivery")}
        saving={saving === "scheduledDelivery"}
        onSave={() => saveSection("scheduledDelivery")}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumInput label="Máx pedidos por slot" name="maxOrdersPerSlot" value={config.scheduledDelivery.maxOrdersPerSlot}
            onChange={(n, v) => updateField("scheduledDelivery", n, v)} min={1} max={100} unit="pedidos"
            info="Cantidad máxima de pedidos programados que se aceptan en cada franja horaria." />
          <NumInput label="Duración del slot" name="slotDurationMinutes" value={config.scheduledDelivery.slotDurationMinutes}
            onChange={(n, v) => updateField("scheduledDelivery", n, v)} min={30} max={360} unit="min"
            info="Duración de cada franja horaria en minutos. 120 = slots de 2 horas." />
          <NumInput label="Anticipación mínima" name="minAnticipationHours" value={config.scheduledDelivery.minAnticipationHours}
            onChange={(n, v) => updateField("scheduledDelivery", n, v)} min={0.5} max={24} step={0.5} unit="horas"
            info="Mínimo de horas de anticipación para programar un delivery." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumInput label="Anticipación máxima" name="maxAnticipationHours" value={config.scheduledDelivery.maxAnticipationHours}
            onChange={(n, v) => updateField("scheduledDelivery", n, v)} min={12} max={168} step={1} unit="horas"
            info="Máximo de horas en el futuro que se puede programar." />
          <StrInput label="Horario apertura" name="operatingHoursStart" value={config.scheduledDelivery.operatingHoursStart}
            onChange={(n, v) => updateField("scheduledDelivery", n, v)}
            info="Hora de inicio de operaciones (formato HH:MM)." />
          <StrInput label="Horario cierre" name="operatingHoursEnd" value={config.scheduledDelivery.operatingHoursEnd}
            onChange={(n, v) => updateField("scheduledDelivery", n, v)}
            info="Hora de cierre de operaciones (formato HH:MM)." />
        </div>
      </Section>

      {/* ═══ TIMEOUTS ═══ */}
      <Section
        title="Timeouts"
        subtitle="Tiempos de espera para merchant y driver"
        icon={Clock}
        color="slate"
        sectionKey="timeouts"
        expanded={expanded === "timeouts"}
        onToggle={() => toggle("timeouts")}
        dirty={dirty.has("timeouts")}
        saving={saving === "timeouts"}
        onSave={() => saveSection("timeouts")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumInput label="Timeout confirmación merchant" name="merchantConfirmTimeoutSec" value={config.timeouts.merchantConfirmTimeoutSec}
            onChange={(n, v) => updateField("timeouts", n, v)} unit="seg"
            info="Segundos que tiene el merchant para confirmar un pedido antes de que se cancele automáticamente." />
          <NumInput label="Timeout respuesta driver" name="driverResponseTimeoutSec" value={config.timeouts.driverResponseTimeoutSec}
            onChange={(n, v) => updateField("timeouts", n, v)} unit="seg"
            info="Segundos que tiene el driver para aceptar o rechazar un pedido antes de pasar al siguiente." />
        </div>
      </Section>

      {/* ═══ ADVERTISING ═══ */}
      <Section
        title="📢 Publicidad y Destacados"
        subtitle="Tarifas, slots, descuentos de lanzamiento"
        icon={Megaphone}
        color="violet"
        sectionKey="advertising"
        expanded={expanded === "advertising"}
        onToggle={() => toggle("advertising")}
        dirty={dirty.has("advertising")}
        saving={saving === "advertising"}
        onSave={() => saveSection("advertising")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumInput label="Platino — Precio mensual" name="adPricePlatino" value={config.advertising.adPricePlatino}
            onChange={(n, v) => updateField("advertising", n, v)} min={0} max={500000} unit="ARS"
            info="Posición #1 garantizada + push + badge premium" />
          <NumInput label="Destacado — Precio mensual" name="adPriceDestacado" value={config.advertising.adPriceDestacado}
            onChange={(n, v) => updateField("advertising", n, v)} min={0} max={500000} unit="ARS"
            info="Top 3 + featured en categorías" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumInput label="Premium — Precio mensual" name="adPricePremium" value={config.advertising.adPricePremium}
            onChange={(n, v) => updateField("advertising", n, v)} min={0} max={500000} unit="ARS"
            info="Badge + posición preferencial" />
          <NumInput label="Hero Banner — Precio mensual" name="adPriceHeroBanner" value={config.advertising.adPriceHeroBanner}
            onChange={(n, v) => updateField("advertising", n, v)} min={0} max={500000} unit="ARS"
            info="Full-width, above the fold" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumInput label="Banner Promocional — Precio mensual" name="adPriceBannerPromo" value={config.advertising.adPriceBannerPromo}
            onChange={(n, v) => updateField("advertising", n, v)} min={0} max={500000} unit="ARS"
            info="Banner con CTA" />
          <NumInput label="Producto Destacado — Precio mensual" name="adPriceProducto" value={config.advertising.adPriceProducto}
            onChange={(n, v) => updateField("advertising", n, v)} min={0} max={500000} unit="ARS"
            info="Por producto individual" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumInput label="Descuento de lanzamiento" name="adLaunchDiscountPercent" value={config.advertising.adLaunchDiscountPercent}
            onChange={(n, v) => updateField("advertising", n, v)} min={0} max={100} step={1} unit="%"
            info="Aplicar a primeros comercios" />
          <NumInput label="Máx. slots Hero Banner" name="adMaxHeroBannerSlots" value={config.advertising.adMaxHeroBannerSlots}
            onChange={(n, v) => updateField("advertising", n, v)} min={1} max={20} unit="slots"
            info="Cantidad máxima de banners hero simultáneos" />
          <NumInput label="Máx. slots Destacados" name="adMaxDestacadosSlots" value={config.advertising.adMaxDestacadosSlots}
            onChange={(n, v) => updateField("advertising", n, v)} min={1} max={50} unit="slots"
            info="Cantidad máxima de comercios destacados simultáneos" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <NumInput label="Máx. slots Productos" name="adMaxProductosSlots" value={config.advertising.adMaxProductosSlots}
            onChange={(n, v) => updateField("advertising", n, v)} min={1} max={100} unit="slots"
            info="Cantidad máxima de productos destacados simultáneos" />
        </div>
        
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider pt-4 border-t border-slate-200">Descuentos por contrato</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumInput label="Duración mínima de contrato" name="adMinDurationDays" value={config.advertising.adMinDurationDays}
            onChange={(n, v) => updateField("advertising", n, v)} min={1} max={90} unit="días"
            info="Duración mínima requerida para contratar publicidad" />
          <NumInput label="Descuento contrato 3 meses" name="adDiscount3Months" value={config.advertising.adDiscount3Months}
            onChange={(n, v) => updateField("advertising", n, v)} min={0} max={50} step={1} unit="%"
            info="Descuento aplicable a contratos de 3 meses" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumInput label="Descuento contrato 6 meses" name="adDiscount6Months" value={config.advertising.adDiscount6Months}
            onChange={(n, v) => updateField("advertising", n, v)} min={0} max={70} step={1} unit="%"
            info="Descuento aplicable a contratos de 6 meses" />
          <NumInput label="Cargo admin por cancelación tardía" name="adCancellationAdminFeePercent" value={config.advertising.adCancellationAdminFeePercent}
            onChange={(n, v) => updateField("advertising", n, v)} min={0} max={50} step={1} unit="%"
            info="Porcentaje de cargo si se cancela fuera de las 48 horas" />
        </div>

        {/* Datos bancarios para transferencias */}
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider pt-4 border-t border-slate-200">Datos bancarios para transferencias</p>
        <p className="text-xs text-gray-500 -mt-2 mb-2">Se muestran a comercios cuando eligen pagar por transferencia</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
            <input type="text" value={config.advertising.bankName || ""} onChange={(e) => updateField("advertising", "bankName", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Ej: Banco Nación, Brubank, Mercado Pago" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titular de la cuenta</label>
            <input type="text" value={config.advertising.bankAccountHolder || ""} onChange={(e) => updateField("advertising", "bankAccountHolder", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Nombre completo del titular" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CBU</label>
            <input type="text" value={config.advertising.bankCbu || ""} onChange={(e) => updateField("advertising", "bankCbu", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="22 dígitos" maxLength={22} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alias</label>
            <input type="text" value={config.advertising.bankAlias || ""} onChange={(e) => updateField("advertising", "bankAlias", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Ej: moovy.publicidad" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CUIT</label>
            <input type="text" value={config.advertising.bankCuit || ""} onChange={(e) => updateField("advertising", "bankCuit", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="XX-XXXXXXXX-X" maxLength={13} />
          </div>
        </div>
      </Section>

    </div>
  );
}