"use client";

// OPS Client: Zonas de Delivery con Multiplicador
// Rama: feat/zonas-delivery-multiplicador
//
// Permite al admin dibujar polígonos en el mapa de Ushuaia para definir zonas
// con multiplicador de delivery fee (1.0 default Centro, 1.15 zonas intermedias,
// 1.35 zonas alejadas, etc.) + bonus al driver.
//
// UX de dibujo (3 etapas):
//   1. drawing: cada click en el mapa agrega un vértice (Marker numerado +
//      Polyline provisoria conectándolos). Botones flotantes: Deshacer último
//      punto / Limpiar / Cerrar polígono / Cancelar.
//   2. pending: el polígono cerrado se muestra editable in-place — vértices
//      arrastrables (movés cualquiera), click derecho borra vértice, doble
//      click en edge agrega vértice. Botones: Re-dibujar / Confirmar / Cancelar.
//   3. modal: form de metadata (nombre, color, multiplicador, bonus driver).
//
// Pattern inspirado en Mapbox Studio + ArcGIS / Glovo backoffice.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, Polygon, Marker, Polyline } from "@react-google-maps/api";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import {
    Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, Save,
    Map as MapIcon, AlertTriangle, Undo2, Eraser, Check, RotateCcw, MousePointer, Brush,
} from "lucide-react";

// ─── Douglas-Peucker: simplificación de polígonos ──────────────────────────
// Reduce un trazo de cientos de puntos (modo pintar) a ~10-15 vértices
// preservando la forma. Tolerance en grados (~0.0001 ≈ 11 metros en Ushuaia).

function perpendicularDistance(
    p: { lat: number; lng: number },
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
): number {
    const dx = b.lng - a.lng;
    const dy = b.lat - a.lat;
    if (dx === 0 && dy === 0) return Math.hypot(p.lng - a.lng, p.lat - a.lat);
    const t = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / (dx * dx + dy * dy);
    const tc = Math.max(0, Math.min(1, t));
    return Math.hypot(p.lng - (a.lng + tc * dx), p.lat - (a.lat + tc * dy));
}

function douglasPeucker(
    points: { lat: number; lng: number }[],
    epsilon: number
): { lat: number; lng: number }[] {
    if (points.length < 3) return points.slice();
    let maxDist = 0;
    let maxIdx = 0;
    const first = points[0];
    const last = points[points.length - 1];
    for (let i = 1; i < points.length - 1; i++) {
        const d = perpendicularDistance(points[i], first, last);
        if (d > maxDist) { maxDist = d; maxIdx = i; }
    }
    if (maxDist > epsilon) {
        const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
        const right = douglasPeucker(points.slice(maxIdx), epsilon);
        return [...left.slice(0, -1), ...right];
    }
    return [first, last];
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface DeliveryZone {
    id: string;
    name: string;
    color: string;
    multiplier: number;
    driverBonus: number;
    displayOrder: number;
    isActive: boolean;
    polygon: [number, number][] | null;
}

interface ZoneDraft {
    id: string | null;
    name: string;
    color: string;
    multiplier: number;
    driverBonus: number;
    displayOrder: number;
    polygon: [number, number][] | null;
}

const USHUAIA_CENTER = { lat: -54.8019, lng: -68.3030 };
const MAP_CONTAINER_STYLE = { width: "100%", height: "500px", borderRadius: "0.75rem" };
const DEFAULT_COLOR = "#22c55e";

const PRESET_COLORS = [
    "#22c55e", // verde — zona base
    "#eab308", // amarillo — intermedia
    "#f97316", // naranja — alta
    "#ef4444", // rojo — muy alta
    "#3b82f6", // azul — premium/centro comercial
    "#a855f7", // violeta — custom
];

function emptyDraft(): ZoneDraft {
    return {
        id: null,
        name: "",
        color: DEFAULT_COLOR,
        multiplier: 1.0,
        driverBonus: 0,
        displayOrder: 0,
        polygon: null,
    };
}

// Convierte LatLng[] de Google Maps al formato GeoJSON [lng, lat] cerrado
function googleLatLngsToGeoJson(latLngs: google.maps.LatLng[]): [number, number][] {
    const ring: [number, number][] = latLngs.map((p) => [p.lng(), p.lat()]);
    // Cerrar el polígono: el primero debe igualar al último (GeoJSON spec).
    if (ring.length > 0) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
            ring.push([first[0], first[1]]);
        }
    }
    return ring;
}

// Convierte el polígono GeoJSON al formato {lat, lng}[] que necesita Polygon
function geoJsonToGooglePaths(polygon: [number, number][]): { lat: number; lng: number }[] {
    return polygon.map(([lng, lat]) => ({ lat, lng }));
}

// ─── Componente principal ──────────────────────────────────────────────────

export default function ZonesDeliveryClient() {
    const { isLoaded } = useGoogleMaps();
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [draft, setDraft] = useState<ZoneDraft>(emptyDraft());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // ─── Estados del flow de dibujo nuevo (UX pro) ──────────────────────────
    // Tres etapas:
    //   1. drawing: el usuario marca puntos en el mapa (drawingPoints).
    //   2. pending: el polígono está cerrado, visible y editable; se confirma o re-dibuja.
    //   3. modal: se abre el form para metadata (nombre, color, multiplicador, etc).
    //
    // En cualquier momento puede hacer Cancelar y todo vuelve a foja cero.
    const [drawingMode, setDrawingMode] = useState(false);
    const [drawingPoints, setDrawingPoints] = useState<{ lat: number; lng: number }[]>([]);
    const [pendingPolygon, setPendingPolygon] = useState<[number, number][] | null>(null);
    // Modo "pintar": el usuario arrastra el mouse y cada N ms se captura un punto.
    // Al soltar, el polígono se simplifica con Douglas-Peucker.
    const [paintMode, setPaintMode] = useState(false);
    const [isPainting, setIsPainting] = useState(false);
    const lastPaintTimeRef = useRef<number>(0);
    // True si entramos al flow de dibujo desde el modal de edit (re-dibujar polígono).
    // Cuando se confirma el polígono pendiente, se mantiene el draft en vez de resetear.
    const [redrawingFromModal, setRedrawingFromModal] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<DeliveryZone | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    // Warnings de overlap recibidos del backend después de guardar.
    // Si la zona recién guardada se superpone con otras, mostramos modal informativo.
    const [overlapWarning, setOverlapWarning] = useState<{ zoneName: string; overlaps: { id: string; name: string }[] } | null>(null);
    // Edición in-line de polígono: el admin hace click en una zona del listado
    // o desde el modal y los vértices del polygon se vuelven arrastrables
    // directamente en el mapa, sin redibujar desde cero.
    const [inlineEditZoneId, setInlineEditZoneId] = useState<string | null>(null);
    const [inlineEditDraft, setInlineEditDraft] = useState<[number, number][] | null>(null);
    const [savingInline, setSavingInline] = useState(false);
    const pendingPolygonRef = useRef<google.maps.Polygon | null>(null);
    const inlineEditPolygonRef = useRef<google.maps.Polygon | null>(null);

    // ── Fetch ──────────────────────────────────────────────────────────────

    const fetchZones = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/delivery-zones");
            if (!res.ok) throw new Error("Error al cargar zonas");
            const data = await res.json();
            setZones(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar zonas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchZones();
    }, [fetchZones]);

    // Listener global de mouseup mientras se pinta. Necesario porque Google Maps
    // NO dispara onMouseUp si el usuario suelta el botón fuera del área del mapa
    // o sobre un control de UI — y sin mouseUp el modo pintar queda "pegado"
    // capturando puntos para siempre.
    useEffect(() => {
        if (!isPainting) return;
        function handleGlobalMouseUp() {
            if (!isPainting) return;
            setIsPainting(false);
            setDrawingPoints((prev) => {
                if (prev.length < 4) return [];
                const simplified = douglasPeucker(prev, 0.0001);
                const ring: [number, number][] = simplified.map((p) => [p.lng, p.lat]);
                ring.push([ring[0][0], ring[0][1]]);
                setPendingPolygon(ring);
                setDrawingMode(false);
                setPaintMode(false);
                setError(null);
                return [];
            });
        }
        window.addEventListener("mouseup", handleGlobalMouseUp);
        return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }, [isPainting]);

    // ── Drawing flow (paso a paso, con undo y edición post-cierre) ─────────

    /**
     * Click en el mapa durante drawingMode (modo CLICKS): agrega un punto.
     * En modo PINTAR el click no hace nada (se usa mousedown/move/up).
     */
    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (!drawingMode || paintMode || !e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setDrawingPoints((prev) => [...prev, { lat, lng }]);
    }, [drawingMode, paintMode]);

    /**
     * Modo PINTAR: mousedown inicia un trazo. Cada mousemove agrega un punto
     * (con throttling 30ms para no saturar el state). mouseup cierra el trazo
     * y aplica Douglas-Peucker para simplificar a ~10-15 vértices manageables.
     */
    const onMapMouseDown = useCallback((e: google.maps.MapMouseEvent) => {
        if (!drawingMode || !paintMode || !e.latLng) return;
        setIsPainting(true);
        setDrawingPoints([{ lat: e.latLng.lat(), lng: e.latLng.lng() }]);
        lastPaintTimeRef.current = Date.now();
    }, [drawingMode, paintMode]);

    const onMapMouseMove = useCallback((e: google.maps.MapMouseEvent) => {
        if (!isPainting || !e.latLng) return;
        const now = Date.now();
        if (now - lastPaintTimeRef.current < 30) return;
        lastPaintTimeRef.current = now;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setDrawingPoints((prev) => [...prev, { lat, lng }]);
    }, [isPainting]);

    const onMapMouseUp = useCallback(() => {
        if (!isPainting) return;
        setIsPainting(false);
        setDrawingPoints((prev) => {
            if (prev.length < 4) {
                // Trazo demasiado corto, descartar
                return [];
            }
            // Simplificar con Douglas-Peucker.
            // Tolerance 0.0001 grados ≈ 11 metros en Ushuaia (lat -54).
            const simplified = douglasPeucker(prev, 0.0001);
            const ring: [number, number][] = simplified.map((p) => [p.lng, p.lat]);
            ring.push([ring[0][0], ring[0][1]]);
            setPendingPolygon(ring);
            setDrawingMode(false);
            setPaintMode(false);
            setError(null);
            return [];
        });
    }, [isPainting]);

    /** Saca el último punto marcado (Undo) */
    function undoLastPoint() {
        setDrawingPoints((prev) => prev.slice(0, -1));
    }

    /** Limpia todos los puntos del dibujo en curso */
    function clearDrawingPoints() {
        setDrawingPoints([]);
    }

    /**
     * Cierra el polígono con los puntos marcados → pasa a modo "pending"
     * donde el polígono es editable y puede confirmarse o re-dibujarse.
     */
    function closePolygon() {
        if (drawingPoints.length < 3) {
            setError("El polígono necesita al menos 3 vértices.");
            return;
        }
        const ring: [number, number][] = drawingPoints.map((p) => [p.lng, p.lat]);
        // Cerrar el polígono (primer y último punto iguales — convención GeoJSON)
        ring.push([ring[0][0], ring[0][1]]);
        setPendingPolygon(ring);
        setDrawingMode(false);
        setDrawingPoints([]);
        setError(null);
    }

    /**
     * Cuando el usuario arrastra vértices del polígono pendiente, sincronizamos
     * el path en el state. Esto se llama en mouseup sobre el polígono editable.
     */
    function syncPendingFromMap() {
        const polygon = pendingPolygonRef.current;
        if (!polygon) return;
        const path = polygon.getPath().getArray();
        const ring = googleLatLngsToGeoJson(path);
        if (ring.length >= 4) {
            setPendingPolygon(ring);
        }
    }

    /** Confirma el polígono pendiente → abre el modal con form de metadata */
    function confirmPendingPolygon() {
        if (!pendingPolygon) return;
        if (redrawingFromModal) {
            // Mantener el draft existente, solo cambiar el polígono
            setDraft((prev) => ({ ...prev, polygon: pendingPolygon }));
            setRedrawingFromModal(false);
        } else {
            // Crear draft fresh
            setDraft({
                ...emptyDraft(),
                polygon: pendingPolygon,
                color: PRESET_COLORS[zones.length % PRESET_COLORS.length],
                displayOrder: zones.length,
            });
        }
        setPendingPolygon(null);
        setModalOpen(true);
    }

    /** Volver a dibujar — descarta el polígono pendiente y reinicia el dibujo */
    function redrawPending() {
        setPendingPolygon(null);
        setDrawingMode(true);
        setDrawingPoints([]);
        setError(null);
    }

    /** Cancela todo el flow (drawing o pending) y vuelve al estado normal */
    function cancelDrawingFlow() {
        setDrawingMode(false);
        setDrawingPoints([]);
        setPendingPolygon(null);
        setRedrawingFromModal(false);
        setError(null);
    }

    /**
     * Llamado desde el botón "Dibujar polígono" del modal de edit.
     * Cierra el modal pero mantiene el draft, activa drawing mode con flag de
     * "redrawing" para que confirmPendingPolygon haga MERGE en vez de resetear.
     */
    function startRedrawFromModal() {
        setModalOpen(false);
        setError(null);
        setRedrawingFromModal(true);
        setDrawingMode(true);
        setDrawingPoints([]);
        setPaintMode(false);
    }

    /**
     * Inicia edición in-line del polígono de una zona existente: muestra los
     * vértices arrastrables directamente en el mapa, sin redibujar desde cero.
     */
    function startInlineEdit(zone: DeliveryZone) {
        if (!zone.polygon) {
            setError(`${zone.name} no tiene polígono dibujado todavía. Usá "Click por click" o "Pintar" para dibujarlo primero.`);
            return;
        }
        setError(null);
        setModalOpen(false);
        setInlineEditZoneId(zone.id);
        setInlineEditDraft(zone.polygon);
    }

    function syncInlineEditFromMap() {
        const polygon = inlineEditPolygonRef.current;
        if (!polygon) return;
        const path = polygon.getPath().getArray();
        const ring = googleLatLngsToGeoJson(path);
        if (ring.length >= 4) setInlineEditDraft(ring);
    }

    async function saveInlineEdit() {
        if (!inlineEditZoneId || !inlineEditDraft) return;
        setSavingInline(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/delivery-zones/${inlineEditZoneId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ polygon: inlineEditDraft }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Error al guardar");
            }
            const respBody = await res.json().catch(() => ({}));
            const editedZone = zones.find((z) => z.id === inlineEditZoneId);
            await fetchZones();
            setInlineEditZoneId(null);
            setInlineEditDraft(null);
            if (editedZone && Array.isArray(respBody.overlaps) && respBody.overlaps.length > 0) {
                setOverlapWarning({ zoneName: editedZone.name, overlaps: respBody.overlaps });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar");
        } finally {
            setSavingInline(false);
        }
    }

    function cancelInlineEdit() {
        setInlineEditZoneId(null);
        setInlineEditDraft(null);
        setError(null);
    }

    // ── CRUD handlers ──────────────────────────────────────────────────────

    function openCreate() {
        setError(null);
        setPendingPolygon(null);
        setDrawingPoints([]);
        setRedrawingFromModal(false);
        setPaintMode(false);
        setDrawingMode(true);
    }

    function openCreatePaint() {
        setError(null);
        setPendingPolygon(null);
        setDrawingPoints([]);
        setRedrawingFromModal(false);
        setPaintMode(true);
        setDrawingMode(true);
    }

    function openEdit(zone: DeliveryZone) {
        setDraft({
            id: zone.id,
            name: zone.name,
            color: zone.color,
            multiplier: zone.multiplier,
            driverBonus: zone.driverBonus,
            displayOrder: zone.displayOrder,
            polygon: zone.polygon,
        });
        setError(null);
        setModalOpen(true);
    }

    function closeModal() {
        if (saving) return;
        setModalOpen(false);
        setDrawingMode(false);
        setError(null);
    }

    async function saveZone() {
        if (!draft.name || draft.name.length < 2) {
            setError("Nombre muy corto");
            return;
        }
        if (!draft.polygon) {
            setError("Falta dibujar el polígono");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const url = draft.id
                ? `/api/admin/delivery-zones/${draft.id}`
                : `/api/admin/delivery-zones`;
            const method = draft.id ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: draft.name,
                    color: draft.color,
                    multiplier: draft.multiplier,
                    driverBonus: draft.driverBonus,
                    displayOrder: draft.displayOrder,
                    polygon: draft.polygon,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Error al guardar");
            }
            // Capturamos overlaps del response para mostrar warning informativo
            const respBody = await res.json().catch(() => ({}));
            await fetchZones();
            setModalOpen(false);
            if (Array.isArray(respBody.overlaps) && respBody.overlaps.length > 0) {
                setOverlapWarning({
                    zoneName: draft.name,
                    overlaps: respBody.overlaps,
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar");
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(zone: DeliveryZone) {
        try {
            const res = await fetch(`/api/admin/delivery-zones/${zone.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !zone.isActive }),
            });
            if (!res.ok) throw new Error("Error al actualizar");
            await fetchZones();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al actualizar");
        }
    }

    async function deleteZone(zone: DeliveryZone) {
        try {
            const res = await fetch(`/api/admin/delivery-zones/${zone.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                // Regla canónica #26: confirmación textual literal "BORRAR" en el body
                body: JSON.stringify({ confirm: "BORRAR" }),
            });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.error || "Error al borrar");
            }
            setConfirmDelete(null);
            setDeleteConfirmText("");
            await fetchZones();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al borrar");
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────

    const activeZones = useMemo(() => zones.filter((z) => z.isActive && z.polygon), [zones]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <MapIcon className="w-6 h-6 text-[#e60012]" />
                        Zonas de Delivery
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Pintá zonas en el mapa de Ushuaia para aplicar multiplicador al delivery fee y bonus al driver.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openCreatePaint}
                        disabled={!isLoaded || drawingMode || pendingPolygon !== null}
                        title="Pintar el contorno arrastrando el mouse (más rápido para zonas orgánicas)"
                        className="bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-md"
                    >
                        <Brush className="w-4 h-4" />
                        Pintar zona
                    </button>
                    <button
                        onClick={openCreate}
                        disabled={!isLoaded || drawingMode || pendingPolygon !== null}
                        title="Marcar vértices uno por uno con clicks (más control para zonas regulares)"
                        className="bg-[#e60012] hover:bg-[#cc000f] disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-md"
                    >
                        {drawingMode || pendingPolygon ? <MousePointer className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {drawingMode ? "Dibujando…" : pendingPolygon ? "Ajustando…" : "Click por click"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {drawingMode && !paintMode && (
                <div className="p-4 bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl text-sm font-semibold flex items-start gap-2">
                    <MousePointer className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        Hacé click en el mapa para marcar cada vértice del polígono.
                        Cuando tengas al menos 3 puntos, click en <strong>"Cerrar polígono"</strong>.
                        Si te equivocás, usá <strong>Deshacer</strong>.
                    </div>
                </div>
            )}
            {drawingMode && paintMode && (
                <div className="p-4 bg-purple-50 border border-purple-100 text-purple-900 rounded-2xl text-sm font-semibold flex items-start gap-2">
                    <Brush className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        <strong>Modo Pintar:</strong> mantené apretado el botón izquierdo del mouse y
                        arrastrá siguiendo el contorno de la zona. Al soltar, el polígono se cierra
                        automáticamente y se simplifica a vértices manageables.
                    </div>
                </div>
            )}
            {pendingPolygon && (
                <div className="p-4 bg-purple-50 border border-purple-100 text-purple-800 rounded-2xl text-sm font-semibold flex items-start gap-2">
                    <MousePointer className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        El polígono está visible en el mapa con vértices arrastrables.
                        <strong> Movelos para ajustar la zona.</strong> Doble click en una línea para agregar un vértice nuevo.
                        Click derecho sobre un vértice para borrarlo. Cuando estés conforme, click en <strong>"Confirmar zona"</strong>.
                    </div>
                </div>
            )}
            {inlineEditZoneId && (
                <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-sm font-semibold flex items-start gap-2">
                    <MapIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        <strong>Editando polígono en el mapa.</strong> Arrastrá los vértices con
                        el mouse para ajustar la forma. Doble click sobre una línea agrega un vértice.
                        Click derecho sobre un vértice lo borra. Cuando estés conforme, click en <strong>"Aplicar cambios"</strong>.
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Mapa con todas las zonas */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm relative">
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={MAP_CONTAINER_STYLE}
                            center={USHUAIA_CENTER}
                            zoom={13}
                            options={{
                                streetViewControl: false,
                                mapTypeControl: false,
                                // En modo pintar, deshabilitamos el drag del mapa para que
                                // el mousedown+move sirva para dibujar y no para pan.
                                draggable: !(drawingMode && paintMode),
                                draggableCursor: drawingMode && paintMode ? "crosshair" : undefined,
                            }}
                            onClick={onMapClick}
                            onMouseDown={onMapMouseDown}
                            onMouseMove={onMapMouseMove}
                            onMouseUp={onMapMouseUp}
                        >
                            {/* Zonas existentes (siempre visibles).
                                La que está siendo editada in-line se oculta para mostrar
                                en su lugar el polígono editable más abajo. */}
                            {activeZones.filter((z) => z.id !== inlineEditZoneId).map((zone) => (
                                <Polygon
                                    key={zone.id}
                                    paths={geoJsonToGooglePaths(zone.polygon!)}
                                    options={{
                                        fillColor: zone.color,
                                        fillOpacity: 0.3,
                                        strokeColor: zone.color,
                                        strokeOpacity: 0.9,
                                        strokeWeight: 2,
                                        clickable: !drawingMode && !pendingPolygon && !inlineEditZoneId,
                                    }}
                                    onClick={() => {
                                        if (drawingMode || pendingPolygon || inlineEditZoneId) return;
                                        startInlineEdit(zone);
                                    }}
                                />
                            ))}

                            {/* Polígono en edición inline (vértices arrastrables) */}
                            {inlineEditZoneId && inlineEditDraft && (() => {
                                const editedZone = zones.find((z) => z.id === inlineEditZoneId);
                                return (
                                    <Polygon
                                        paths={geoJsonToGooglePaths(inlineEditDraft)}
                                        options={{
                                            fillColor: editedZone?.color || "#7c3aed",
                                            fillOpacity: 0.4,
                                            strokeColor: editedZone?.color || "#7c3aed",
                                            strokeOpacity: 1,
                                            strokeWeight: 3,
                                            editable: true,
                                            draggable: true,
                                            zIndex: 100,
                                        }}
                                        onLoad={(p) => { inlineEditPolygonRef.current = p; }}
                                        onMouseUp={syncInlineEditFromMap}
                                        onDragEnd={syncInlineEditFromMap}
                                    />
                                );
                            })()}

                            {/* Markers numerados de los puntos durante el dibujo */}
                            {drawingMode && drawingPoints.map((p, idx) => (
                                <Marker
                                    key={`pt-${idx}`}
                                    position={p}
                                    label={{
                                        text: String(idx + 1),
                                        color: "#fff",
                                        fontSize: "11px",
                                        fontWeight: "bold",
                                    }}
                                />
                            ))}

                            {/* Polilínea provisoria conectando los puntos durante el dibujo */}
                            {drawingMode && drawingPoints.length >= 2 && (
                                <Polyline
                                    path={drawingPoints}
                                    options={{
                                        strokeColor: "#e60012",
                                        strokeWeight: 2,
                                        strokeOpacity: 0.8,
                                    }}
                                />
                            )}

                            {/* Polígono pendiente — editable in-place */}
                            {pendingPolygon && (
                                <Polygon
                                    paths={geoJsonToGooglePaths(pendingPolygon)}
                                    options={{
                                        fillColor: "#a855f7",
                                        fillOpacity: 0.3,
                                        strokeColor: "#a855f7",
                                        strokeOpacity: 0.95,
                                        strokeWeight: 3,
                                        editable: true,
                                        draggable: true,
                                        clickable: true,
                                    }}
                                    onLoad={(p) => { pendingPolygonRef.current = p; }}
                                    onMouseUp={syncPendingFromMap}
                                    onDragEnd={syncPendingFromMap}
                                />
                            )}
                        </GoogleMap>
                    ) : (
                        <div className="flex items-center justify-center h-[500px] text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    )}

                    {/* Barra flotante durante el dibujo — modo CLICK por CLICK */}
                    {drawingMode && !paintMode && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex items-center gap-1 z-10">
                            <span className="text-xs font-bold text-gray-700 px-3">
                                Puntos: {drawingPoints.length}
                            </span>
                            <button
                                type="button"
                                onClick={undoLastPoint}
                                disabled={drawingPoints.length === 0}
                                title="Deshacer último punto"
                                className="px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 flex items-center gap-1.5"
                            >
                                <Undo2 className="w-3.5 h-3.5" /> Deshacer
                            </button>
                            <button
                                type="button"
                                onClick={clearDrawingPoints}
                                disabled={drawingPoints.length === 0}
                                title="Limpiar todo"
                                className="px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 flex items-center gap-1.5"
                            >
                                <Eraser className="w-3.5 h-3.5" /> Limpiar
                            </button>
                            <button
                                type="button"
                                onClick={closePolygon}
                                disabled={drawingPoints.length < 3}
                                className="px-4 py-2 text-xs font-bold bg-[#e60012] text-white hover:bg-[#cc000f] rounded-lg disabled:opacity-30 flex items-center gap-1.5"
                            >
                                <Check className="w-3.5 h-3.5" /> Cerrar polígono
                            </button>
                            <button
                                type="button"
                                onClick={cancelDrawingFlow}
                                className="px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1.5"
                            >
                                <X className="w-3.5 h-3.5" /> Cancelar
                            </button>
                        </div>
                    )}

                    {/* Barra flotante durante el dibujo — modo PINTAR */}
                    {drawingMode && paintMode && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-purple-200 p-2 flex items-center gap-2 z-10">
                            {isPainting ? (
                                <span className="text-xs font-bold text-purple-700 px-3 flex items-center gap-2">
                                    <Brush className="w-3.5 h-3.5 animate-pulse" />
                                    Pintando… {drawingPoints.length} puntos capturados
                                </span>
                            ) : (
                                <>
                                    <span className="text-xs font-bold text-purple-700 px-3 flex items-center gap-2">
                                        <Brush className="w-3.5 h-3.5" />
                                        Mantené el click y arrastrá para pintar
                                    </span>
                                    <button
                                        type="button"
                                        onClick={cancelDrawingFlow}
                                        className="px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1.5"
                                    >
                                        <X className="w-3.5 h-3.5" /> Cancelar
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Barra flotante durante edición inline de zona existente */}
                    {inlineEditZoneId && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-blue-200 p-2 flex items-center gap-1 z-10">
                            <span className="text-xs font-bold text-blue-700 px-3">
                                Editando: {zones.find((z) => z.id === inlineEditZoneId)?.name}
                            </span>
                            <button
                                type="button"
                                onClick={saveInlineEdit}
                                disabled={savingInline}
                                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {savingInline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Aplicar cambios
                            </button>
                            <button
                                type="button"
                                onClick={cancelInlineEdit}
                                disabled={savingInline}
                                className="px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1.5"
                            >
                                <X className="w-3.5 h-3.5" /> Cancelar
                            </button>
                        </div>
                    )}

                    {/* Barra flotante con polígono pendiente confirmación */}
                    {pendingPolygon && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex items-center gap-1 z-10">
                            <span className="text-xs font-bold text-purple-700 px-3">
                                Ajustá el polígono y confirmá
                            </span>
                            <button
                                type="button"
                                onClick={redrawPending}
                                title="Volver a dibujar desde cero"
                                className="px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-1.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> Re-dibujar
                            </button>
                            <button
                                type="button"
                                onClick={confirmPendingPolygon}
                                className="px-4 py-2 text-xs font-bold bg-[#e60012] text-white hover:bg-[#cc000f] rounded-lg flex items-center gap-1.5"
                            >
                                <Check className="w-3.5 h-3.5" /> Confirmar zona
                            </button>
                            <button
                                type="button"
                                onClick={cancelDrawingFlow}
                                className="px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1.5"
                            >
                                <X className="w-3.5 h-3.5" /> Cancelar
                            </button>
                        </div>
                    )}
                </div>

                {/* Lista lateral */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-700 mb-3">Zonas configuradas ({zones.length})</h2>
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                    ) : zones.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            Sin zonas. Dibujá la primera en el mapa.
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {zones.map((zone) => (
                                <li
                                    key={zone.id}
                                    className={`p-3 rounded-xl border transition ${zone.isActive ? "border-gray-100 bg-white" : "border-gray-100 bg-gray-50 opacity-60"}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ background: zone.color }}
                                                />
                                                <h3 className="font-bold text-sm text-gray-900 truncate">{zone.name}</h3>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                ×{zone.multiplier} {zone.driverBonus > 0 && `· +$${zone.driverBonus} driver`}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                Orden: {zone.displayOrder} · {zone.isActive ? "Activa" : "Inactiva"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => toggleActive(zone)}
                                                title={zone.isActive
                                                    ? "Ocultar (no aplicará a pedidos nuevos, queda en DB)"
                                                    : "Mostrar (volver a activar)"}
                                                className={`p-1.5 hover:bg-gray-100 rounded-lg ${zone.isActive ? "text-green-600" : "text-gray-400"}`}
                                            >
                                                {zone.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => startInlineEdit(zone)}
                                                disabled={!zone.polygon || drawingMode || pendingPolygon !== null || inlineEditZoneId !== null}
                                                title="Editar polígono moviendo vértices en el mapa"
                                                className="p-1.5 hover:bg-gray-100 rounded-lg text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <MapIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openEdit(zone)}
                                                title="Editar metadata (nombre, color, multiplicador, bonus)"
                                                className="p-1.5 hover:bg-gray-100 rounded-lg text-blue-600"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(zone)}
                                                title="Borrar"
                                                className="p-1.5 hover:bg-gray-100 rounded-lg text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Modal de edición/creación */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">
                                {draft.id ? "Editar zona" : "Nueva zona"}
                            </h2>
                            <button onClick={closeModal} disabled={saving} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                            <input
                                type="text"
                                value={draft.name}
                                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                placeholder="Ej. Centro, Zona Alta Norte"
                                className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-semibold"
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Color en el mapa</label>
                            <div className="flex gap-2 flex-wrap">
                                {PRESET_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setDraft({ ...draft, color: c })}
                                        className={`w-9 h-9 rounded-lg border-2 transition ${draft.color === c ? "border-gray-900 scale-110" : "border-transparent"}`}
                                        style={{ background: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Multiplicador <span className="text-gray-400">({draft.multiplier.toFixed(2)}×)</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3.0"
                                    step="0.05"
                                    value={draft.multiplier}
                                    onChange={(e) => setDraft({ ...draft, multiplier: parseFloat(e.target.value) })}
                                    className="w-full"
                                    disabled={saving}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {draft.multiplier < 1 ? "Descuento" : draft.multiplier > 1 ? "Recargo" : "Sin recargo"}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bonus driver ($)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="50"
                                    value={draft.driverBonus}
                                    onChange={(e) => setDraft({ ...draft, driverBonus: parseInt(e.target.value, 10) || 0 })}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-semibold"
                                    disabled={saving}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Extra al repartidor por aceptar pedidos en esta zona
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                Orden de prioridad ({draft.displayOrder})
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={draft.displayOrder}
                                onChange={(e) => setDraft({ ...draft, displayOrder: parseInt(e.target.value, 10) || 0 })}
                                className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-semibold"
                                disabled={saving}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                                Si una dirección cae en varias zonas (overlap), gana la de mayor orden.
                            </p>
                        </div>

                        {/* Polígono — siempre visible. Si no hay todavía, requerir dibujar. */}
                        <div className={`p-3 rounded-xl border ${draft.polygon ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                            <label className={`block text-xs font-bold uppercase mb-1.5 ${draft.polygon ? "text-green-700" : "text-amber-700"}`}>
                                Polígono en el mapa
                            </label>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs text-gray-700 flex-1">
                                    {draft.polygon
                                        ? `Polígono cargado (${draft.polygon.length - 1} vértices)`
                                        : "Esta zona todavía no tiene polígono dibujado. Hacé click en \"Dibujar\" para marcarlo en el mapa."}
                                </p>
                                <button
                                    type="button"
                                    onClick={startRedrawFromModal}
                                    disabled={saving}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 whitespace-nowrap ${
                                        draft.polygon
                                            ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                            : "bg-[#e60012] text-white hover:bg-[#cc000f]"
                                    }`}
                                >
                                    <MapIcon className="w-3.5 h-3.5" />
                                    {draft.polygon ? "Re-dibujar" : "Dibujar"}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={closeModal}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveZone}
                                disabled={saving}
                                className="bg-[#e60012] hover:bg-[#cc000f] disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de warning: overlap detectado al guardar zona */}
            {overlapWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            </div>
                            <h3 className="font-bold text-gray-900">Zonas superpuestas detectadas</h3>
                        </div>
                        <div className="text-sm text-gray-700 space-y-2">
                            <p>
                                <strong>{overlapWarning.zoneName}</strong> se superpone con:
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                                {overlapWarning.overlaps.map((o) => (
                                    <li key={o.id}>{o.name}</li>
                                ))}
                            </ul>
                            <p className="text-xs text-gray-500 pt-2">
                                Los pedidos cuya dirección caiga en el área compartida cobrarán según
                                la zona con <strong>orden de prioridad más alto</strong>. Esto puede ser intencional
                                (ej: una zona "premium" dentro de una más amplia) o un error de dibujo.
                                Si querés que las zonas no se solapen, editá los polígonos desde el panel.
                            </p>
                        </div>
                        <div className="flex items-center justify-end">
                            <button
                                onClick={() => setOverlapWarning(null)}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2 rounded-xl"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación de borrado — confirmación textual obligatoria */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="font-bold text-gray-900">Borrar zona definitivamente</h3>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                            <p>
                                Vas a borrar <strong>{confirmDelete.name}</strong> de la base de datos.
                                Esta acción es <strong>irreversible</strong>.
                            </p>
                            <p className="text-xs text-gray-500">
                                Los pedidos antiguos preservan el nombre de la zona como snapshot histórico
                                (audit fiscal), pero la zona deja de aplicar a pedidos nuevos.
                                Si solo querés ocultarla temporalmente, usá el botón del ojo en vez de borrar.
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                Tipeá <span className="text-red-600 font-mono">BORRAR</span> para confirmar
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="BORRAR"
                                className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold uppercase tracking-wider"
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => { setConfirmDelete(null); setDeleteConfirmText(""); }}
                                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => deleteZone(confirmDelete)}
                                disabled={deleteConfirmText !== "BORRAR"}
                                className="bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold px-5 py-2 rounded-xl flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Borrar definitivamente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
