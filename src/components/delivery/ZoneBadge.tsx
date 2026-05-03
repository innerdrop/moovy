"use client";

// ZoneBadge — Indicador de zona de delivery aplicable a una coordenada
// Rama: feat/zonas-delivery-multiplicador
//
// Componente cliente reutilizable que consulta el endpoint público
// `/api/delivery-zones/check?lat=X&lng=Y` y muestra una pill con el nombre
// de la zona + multiplicador / bonus driver según el `variant`.
//
// USO
// ───
// En checkout (vista comprador):
//   <ZoneBadge lat={destLat} lng={destLng} variant="customer" />
//   → Si multiplier !== 1.0, muestra: "Zona Norte · +15%"
//
// En panel del driver (recepción de pedido):
//   <ZoneBadge lat={destLat} lng={destLng} variant="driver" />
//   → Si driverBonus > 0, muestra: "Zona C · Bonus +$350"
//
// Si la dirección no cae en ninguna zona O si multiplier=1.0 y bonus=0,
// el componente NO renderiza nada (return null) — UX limpia para casos sin recargo.

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

interface ZoneSnapshot {
    zoneCode: string | null;
    zoneMultiplier: number;
    zoneDriverBonus: number;
}

interface ZoneBadgeProps {
    lat: number | null | undefined;
    lng: number | null | undefined;
    /**
     * "customer" muestra el multiplicador (+15% / -5%) — para checkout del comprador.
     * "driver" muestra el bonus al driver (+$350) — para panel del repartidor.
     */
    variant?: "customer" | "driver";
    /** Texto adicional opcional (ej: "Tu dirección"). */
    label?: string;
    className?: string;
}

export default function ZoneBadge({
    lat,
    lng,
    variant = "customer",
    label,
    className = "",
}: ZoneBadgeProps) {
    const [zone, setZone] = useState<ZoneSnapshot | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) {
            setZone(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        fetch(`/api/delivery-zones/check?lat=${lat}&lng=${lng}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (cancelled) return;
                setZone(data);
            })
            .catch(() => {
                if (cancelled) return;
                setZone(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [lat, lng]);

    if (loading || !zone || !zone.zoneCode) return null;

    // Si no hay recargo ni bonus, no mostrar nada (zona neutral)
    const isCustomer = variant === "customer";
    const showCustomer = isCustomer && zone.zoneMultiplier !== 1.0;
    const showDriver = !isCustomer && zone.zoneDriverBonus > 0;
    if (!showCustomer && !showDriver) return null;

    // Tono según el sentido del recargo
    const isPositive = (isCustomer && zone.zoneMultiplier > 1.0) || (!isCustomer && zone.zoneDriverBonus > 0);
    const tone = isCustomer
        ? (zone.zoneMultiplier > 1.0
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-green-50 border-green-200 text-green-800")
        : "bg-blue-50 border-blue-200 text-blue-800";

    let detail: string;
    if (isCustomer) {
        const pct = Math.round((zone.zoneMultiplier - 1.0) * 100);
        detail = pct >= 0 ? `+${pct}%` : `${pct}%`;
    } else {
        detail = `Bonus +$${zone.zoneDriverBonus.toLocaleString("es-AR")}`;
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${tone} ${className}`}
            title={isCustomer ? "Recargo aplicado por la zona del destino" : "Bonus extra al repartidor por aceptar esta zona"}
        >
            <MapPin className="w-3 h-3" />
            {label ? `${label} · ` : ""}
            {zone.zoneCode}
            <span className="opacity-70">·</span>
            <span>{detail}</span>
        </span>
    );
}
