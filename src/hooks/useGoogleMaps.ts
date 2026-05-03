"use client";

/**
 * Hook centralizado para cargar Google Maps JS API.
 *
 * REGLA: Toda la app DEBE usar este hook en vez de llamar useJsApiLoader directamente.
 * Google Maps JS API solo puede cargarse UNA VEZ con las mismas opciones.
 * Si dos componentes usan useJsApiLoader con opciones diferentes, explota.
 *
 * Este hook incluye TODAS las libraries que usa Moovy: places, geometry, maps.
 *
 * Última actualización: 2026-04-03
 */

import { useJsApiLoader } from "@react-google-maps/api";

// Ref estable fuera del componente para evitar re-renders.
// "drawing" agregado en rama feat/zonas-delivery-multiplicador para que el panel
// /ops/zonas-delivery pueda dibujar polígonos con DrawingManager.
const LIBRARIES: ("places" | "geometry" | "marker" | "drawing")[] = ["places", "geometry", "marker", "drawing"];

export function useGoogleMaps() {
    return useJsApiLoader({
        id: "moovy-maps",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: LIBRARIES,
        language: "es",
        region: "AR",
    });
}
