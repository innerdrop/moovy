"use client";

import { useCallback, useEffect, useState } from "react";
import { GoogleMap, Marker, Circle } from "@react-google-maps/api";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { MapPin, Plus, Pencil, Trash2, Power, PowerOff, AlertTriangle, Loader2, X, Save } from "lucide-react";

interface ExcludedZone {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radiusKm: number;
    reason: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ZoneDraft {
    id: string | null; // null = nueva
    name: string;
    lat: number;
    lng: number;
    radiusKm: number;
    reason: string;
    active: boolean;
}

const USHUAIA_CENTER = { lat: -54.8019, lng: -68.3030 };
const MAP_CONTAINER_STYLE = { width: "100%", height: "360px", borderRadius: "0.75rem" };
const DEFAULT_RADIUS_KM = 0.3;
const MIN_RADIUS_KM = 0.1;
const MAX_RADIUS_KM = 3.0;
const RADIUS_STEP = 0.05;

function emptyDraft(): ZoneDraft {
    return {
        id: null,
        name: "",
        lat: USHUAIA_CENTER.lat,
        lng: USHUAIA_CENTER.lng,
        radiusKm: DEFAULT_RADIUS_KM,
        reason: "",
        active: true,
    };
}

export default function ExcludedZonesClient() {
    const { isLoaded } = useGoogleMaps();
    const [zones, setZones] = useState<ExcludedZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [draft, setDraft] = useState<ZoneDraft>(emptyDraft());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchZones = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/ops/settings/excluded-zones");
            if (!res.ok) throw new Error("Error al cargar zonas");
            const data = await res.json();
            setZones(data.zones || []);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Error al cargar zonas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchZones();
    }, [fetchZones]);

    function openCreate() {
        setDraft(emptyDraft());
        setError(null);
        setModalOpen(true);
    }

    function openEdit(zone: ExcludedZone) {
        setDraft({
            id: zone.id,
            name: zone.name,
            lat: zone.lat,
            lng: zone.lng,
            radiusKm: zone.radiusKm,
            reason: zone.reason,
            active: zone.active,
        });
        setError(null);
        setModalOpen(true);
    }

    function closeModal() {
        if (saving) return;
        setModalOpen(false);
        setError(null);
    }

    async function saveZone() {
        if (saving) return;
        setError(null);

        // Validación cliente (el backend también valida)
        if (draft.name.trim().length < 1 || draft.name.length > 50) {
            setError("El nombre debe tener entre 1 y 50 caracteres");
            return;
        }
        if (draft.reason.trim().length < 1 || draft.reason.length > 200) {
            setError("La razón debe tener entre 1 y 200 caracteres");
            return;
        }
        if (draft.radiusKm < MIN_RADIUS_KM || draft.radiusKm > MAX_RADIUS_KM) {
            setError(`El radio debe estar entre ${MIN_RADIUS_KM * 1000}m y ${MAX_RADIUS_KM}km`);
            return;
        }

        setSaving(true);
        try {
            const isEdit = !!draft.id;
            const url = isEdit
                ? `/api/ops/settings/excluded-zones/${draft.id}`
                : `/api/ops/settings/excluded-zones`;
            const method = isEdit ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: draft.name.trim(),
                    lat: draft.lat,
                    lng: draft.lng,
                    radiusKm: draft.radiusKm,
                    reason: draft.reason.trim(),
                    active: draft.active,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Error al guardar zona");
            }
            await fetchZones();
            setModalOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar");
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(zone: ExcludedZone) {
        try {
            const res = await fetch(`/api/ops/settings/excluded-zones/${zone.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !zone.active }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al cambiar estado");
            }
            await fetchZones();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Error al cambiar estado");
        }
    }

    async function deleteZone(zone: ExcludedZone) {
        if (!confirm(`¿Eliminar la zona "${zone.name}"? Esta acción no se puede deshacer.`)) return;
        try {
            const res = await fetch(`/api/ops/settings/excluded-zones/${zone.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al eliminar");
            }
            await fetchZones();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Error al eliminar");
        }
    }

    const radiusMeters = Math.round(draft.radiusKm * 1000);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <MapPin className="w-7 h-7 text-red-600" />
                        Zonas Excluidas
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Bloquean pedidos a direcciones dentro del círculo. Útil para barrios sin cobertura (ej: sin señal celular).
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition w-full sm:w-auto justify-center flex-shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Nueva zona
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard label="Zonas totales" value={zones.length} />
                <StatCard
                    label="Activas (bloquean)"
                    value={zones.filter((z) => z.active).length}
                    tone="danger"
                />
                <StatCard
                    label="Pausadas"
                    value={zones.filter((z) => !z.active).length}
                    tone="muted"
                />
            </div>

            {/* Mapa general con todas las zonas activas */}
            <div className="bg-white rounded-xl shadow p-4 sm:p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Mapa general</h2>
                {!isLoaded ? (
                    <div style={MAP_CONTAINER_STYLE} className="flex items-center justify-center bg-gray-100 rounded-xl">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <GoogleMap
                        mapContainerStyle={MAP_CONTAINER_STYLE}
                        center={USHUAIA_CENTER}
                        zoom={12}
                        options={{
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: false,
                        }}
                    >
                        {zones.map((z) => (
                            <Circle
                                key={z.id}
                                center={{ lat: z.lat, lng: z.lng }}
                                radius={z.radiusKm * 1000}
                                options={{
                                    fillColor: z.active ? "#ef4444" : "#9ca3af",
                                    fillOpacity: z.active ? 0.25 : 0.15,
                                    strokeColor: z.active ? "#dc2626" : "#6b7280",
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                }}
                            />
                        ))}
                        {zones.map((z) => (
                            <Marker
                                key={`m-${z.id}`}
                                position={{ lat: z.lat, lng: z.lng }}
                                title={z.name}
                            />
                        ))}
                    </GoogleMap>
                )}
            </div>

            {/* Lista de zonas */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-4 sm:p-6 border-b">
                    <h2 className="text-sm font-semibold text-gray-700">Zonas configuradas</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </div>
                ) : zones.length === 0 ? (
                    <div className="p-8 text-center">
                        <MapPin className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm">
                            No hay zonas excluidas configuradas. Los pedidos no se bloquean por zona.
                        </p>
                        <button
                            onClick={openCreate}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Crear la primera zona
                        </button>
                    </div>
                ) : (
                    <ul className="divide-y">
                        {zones.map((zone) => (
                            <li key={zone.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                                        {zone.active ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                                <AlertTriangle className="w-3 h-3" />
                                                Bloquea
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                                                Pausada
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-500">
                                            Radio {Math.round(zone.radiusKm * 1000)}m
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{zone.reason}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {zone.lat.toFixed(5)}, {zone.lng.toFixed(5)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => toggleActive(zone)}
                                        className="p-2 rounded-lg border hover:bg-gray-50 transition"
                                        title={zone.active ? "Pausar" : "Activar"}
                                    >
                                        {zone.active ? (
                                            <PowerOff className="w-4 h-4 text-gray-600" />
                                        ) : (
                                            <Power className="w-4 h-4 text-green-600" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => openEdit(zone)}
                                        className="p-2 rounded-lg border hover:bg-gray-50 transition"
                                        title="Editar"
                                    >
                                        <Pencil className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button
                                        onClick={() => deleteZone(zone)}
                                        className="p-2 rounded-lg border hover:bg-red-50 transition"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Modal crear/editar */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
                        {/* Header modal */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
                            <h3 className="text-lg font-semibold">
                                {draft.id ? "Editar zona" : "Nueva zona excluida"}
                            </h3>
                            <button
                                onClick={closeModal}
                                disabled={saving}
                                className="p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 sm:p-6 space-y-4">
                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la zona *
                                </label>
                                <input
                                    type="text"
                                    value={draft.name}
                                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                    maxLength={50}
                                    placeholder="Ej: Costa Susana"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">{draft.name.length}/50</p>
                            </div>

                            {/* Razón */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Razón (visible al buyer) *
                                </label>
                                <textarea
                                    value={draft.reason}
                                    onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
                                    maxLength={200}
                                    rows={2}
                                    placeholder="Ej: Sin señal celular para repartidor"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">{draft.reason.length}/200</p>
                            </div>

                            {/* Mapa */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Centro y radio de la zona
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Arrastrá el pin para mover el centro. Usá el slider para ajustar el radio.
                                </p>
                                {!isLoaded ? (
                                    <div style={MAP_CONTAINER_STYLE} className="flex items-center justify-center bg-gray-100 rounded-xl">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : (
                                    <GoogleMap
                                        mapContainerStyle={MAP_CONTAINER_STYLE}
                                        center={{ lat: draft.lat, lng: draft.lng }}
                                        zoom={14}
                                        options={{
                                            streetViewControl: false,
                                            mapTypeControl: false,
                                            fullscreenControl: false,
                                        }}
                                        onClick={(e) => {
                                            if (!e.latLng) return;
                                            setDraft({
                                                ...draft,
                                                lat: e.latLng.lat(),
                                                lng: e.latLng.lng(),
                                            });
                                        }}
                                    >
                                        <Marker
                                            position={{ lat: draft.lat, lng: draft.lng }}
                                            draggable
                                            onDragEnd={(e) => {
                                                if (!e.latLng) return;
                                                setDraft({
                                                    ...draft,
                                                    lat: e.latLng.lat(),
                                                    lng: e.latLng.lng(),
                                                });
                                            }}
                                        />
                                        <Circle
                                            center={{ lat: draft.lat, lng: draft.lng }}
                                            radius={draft.radiusKm * 1000}
                                            options={{
                                                fillColor: "#ef4444",
                                                fillOpacity: 0.25,
                                                strokeColor: "#dc2626",
                                                strokeOpacity: 0.8,
                                                strokeWeight: 2,
                                                clickable: false,
                                            }}
                                        />
                                    </GoogleMap>
                                )}
                            </div>

                            {/* Radio slider */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Radio
                                    </label>
                                    <span className="text-sm font-mono text-gray-600">
                                        {radiusMeters < 1000
                                            ? `${radiusMeters} m`
                                            : `${(radiusMeters / 1000).toFixed(2)} km`}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={MIN_RADIUS_KM}
                                    max={MAX_RADIUS_KM}
                                    step={RADIUS_STEP}
                                    value={draft.radiusKm}
                                    onChange={(e) =>
                                        setDraft({ ...draft, radiusKm: Number(e.target.value) })
                                    }
                                    className="w-full accent-red-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>{MIN_RADIUS_KM * 1000}m</span>
                                    <span>{MAX_RADIUS_KM}km</span>
                                </div>
                            </div>

                            {/* Coords manuales */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Latitud
                                    </label>
                                    <input
                                        type="number"
                                        step="0.00001"
                                        value={draft.lat}
                                        onChange={(e) =>
                                            setDraft({ ...draft, lat: Number(e.target.value) })
                                        }
                                        className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Longitud
                                    </label>
                                    <input
                                        type="number"
                                        step="0.00001"
                                        value={draft.lng}
                                        onChange={(e) =>
                                            setDraft({ ...draft, lng: Number(e.target.value) })
                                        }
                                        className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Bloqueo activo</p>
                                    <p className="text-xs text-gray-500">
                                        Si está apagado, la zona queda guardada pero NO bloquea pedidos.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDraft({ ...draft, active: !draft.active })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition flex-shrink-0 ${
                                        draft.active ? "bg-red-600" : "bg-gray-300"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                            draft.active ? "translate-x-6" : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 p-4 sm:p-6 border-t bg-gray-50 rounded-b-xl">
                            <button
                                onClick={closeModal}
                                disabled={saving}
                                className="px-4 py-2 rounded-lg border hover:bg-white transition disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveZone}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {draft.id ? "Guardar cambios" : "Crear zona"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({
    label,
    value,
    tone = "default",
}: {
    label: string;
    value: number;
    tone?: "default" | "danger" | "muted";
}) {
    const toneClass =
        tone === "danger"
            ? "text-red-600"
            : tone === "muted"
            ? "text-gray-500"
            : "text-gray-900";
    return (
        <div className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl sm:text-3xl font-bold mt-1 ${toneClass}`}>{value}</p>
        </div>
    );
}
