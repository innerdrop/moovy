"use client";

/**
 * DriverOfferMapPreview
 *
 * Mini mapa estático que se muestra en el modal de oferta del driver
 * (rama feat/driver-offer-map-and-timer). El driver lo ve POR ~30 SEG
 * antes de aceptar/rechazar la oferta — no necesita turn-by-turn ni
 * tracking en vivo (eso es trabajo de RiderMiniMap durante la entrega).
 *
 * Por qué un componente NUEVO en vez de reusar RiderMiniMap:
 *   - RiderMiniMap es 1000+ líneas optimizadas para navegación activa
 *     (Routes API, off-route detection, polyline matching, head-up camera).
 *   - Acá necesitamos algo simple: 2 markers + línea recta + auto-fit.
 *   - Polyline recta evita 1 llamada extra a Routes API por cada oferta.
 *     Driver puede recibir 10-20 ofertas/hora — el costo sumaría rápido.
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { GoogleMap, Polyline } from "@react-google-maps/api";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { Loader2 } from "lucide-react";

interface DriverOfferMapPreviewProps {
    merchantLat: number;
    merchantLng: number;
    customerLat: number;
    customerLng: number;
    /** Altura del contenedor — default "150px" para que entre cómodo en el modal */
    height?: string;
}

const DEFAULT_USHUAIA = { lat: -54.8019, lng: -68.3030 };

// Estilos minimalistas: oculta POIs y transit para no distraer al driver
// del par origen-destino. Mismo styling spirit que RiderMiniMap pero más simple.
const minimalStyles: google.maps.MapTypeStyle[] = [
    { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];

function DriverOfferMapPreview({
    merchantLat,
    merchantLng,
    customerLat,
    customerLng,
    height = "150px",
}: DriverOfferMapPreviewProps) {
    const { isLoaded } = useGoogleMaps();
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

    const merchantPos = useMemo(
        () => ({ lat: merchantLat, lng: merchantLng }),
        [merchantLat, merchantLng],
    );
    const customerPos = useMemo(
        () => ({ lat: customerLat, lng: customerLng }),
        [customerLat, customerLng],
    );

    // Auto-fit a los 2 puntos cuando el mapa carga o cambian las coords
    useEffect(() => {
        if (!mapInstance || typeof google === "undefined") return;
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(merchantPos);
        bounds.extend(customerPos);
        // Padding generoso para que los markers no queden pegados al borde
        mapInstance.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });
    }, [mapInstance, merchantPos, customerPos]);

    // Crear los markers usando AdvancedMarkerElement (no deprecated).
    // Comercio = azul (origen), Cliente = rojo (destino).
    useEffect(() => {
        if (!mapInstance || typeof google === "undefined") return;
        if (!google.maps?.marker?.AdvancedMarkerElement) return;

        const buildPin = (color: string, label: string) => {
            const div = document.createElement("div");
            div.style.position = "relative";
            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.justifyContent = "center";
            div.innerHTML = `
                <div style="
                    width: 28px;
                    height: 28px;
                    background: ${color};
                    border: 2.5px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                ">
                    <span style="color: white; font-size: 11px; font-weight: 800;">${label}</span>
                </div>
            `;
            return div;
        };

        const merchantMarker = new google.maps.marker.AdvancedMarkerElement({
            map: mapInstance,
            position: merchantPos,
            title: "Comercio",
            content: buildPin("#3b82f6", "A"),
        });

        const customerMarker = new google.maps.marker.AdvancedMarkerElement({
            map: mapInstance,
            position: customerPos,
            title: "Cliente",
            content: buildPin("#ef4444", "B"),
        });

        return () => {
            merchantMarker.map = null;
            customerMarker.map = null;
        };
    }, [mapInstance, merchantPos, customerPos]);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        setMapInstance(map);
    }, []);

    const mapOptions = useMemo<google.maps.MapOptions>(() => {
        const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
        const opts: google.maps.MapOptions = {
            disableDefaultUI: true,
            zoomControl: false,
            scrollwheel: false,        // Driver no debería cambiar zoom en preview
            gestureHandling: "none",   // Mapa estático para visualización rápida
            clickableIcons: false,
            keyboardShortcuts: false,
            draggable: false,
        };
        if (mapId) {
            opts.mapId = mapId;
        } else {
            opts.styles = minimalStyles;
        }
        return opts;
    }, []);

    if (!isLoaded) {
        return (
            <div
                className="w-full bg-gray-100 dark:bg-[#22252f] rounded-2xl flex items-center justify-center"
                style={{ height }}
            >
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div
            className="w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10"
            style={{ height }}
        >
            <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={DEFAULT_USHUAIA}
                zoom={13}
                onLoad={onMapLoad}
                options={mapOptions}
            >
                {/* Línea recta dashed entre comercio y cliente. Sin Routes API
                    para no gastar API calls por cada oferta — es solo orientación
                    visual del driver, no una ruta real. */}
                <Polyline
                    path={[merchantPos, customerPos]}
                    options={{
                        strokeColor: "#f97316",  // orange-500 (color brand de oferta)
                        strokeOpacity: 0,        // base línea invisible
                        strokeWeight: 0,
                        icons: [
                            {
                                icon: {
                                    path: "M 0,-1 0,1",
                                    strokeOpacity: 1,
                                    strokeColor: "#f97316",
                                    strokeWeight: 3,
                                    scale: 4,
                                },
                                offset: "0",
                                repeat: "12px",
                            },
                        ],
                    }}
                />
            </GoogleMap>
        </div>
    );
}

export default React.memo(DriverOfferMapPreview);
