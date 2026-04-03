"use client";

import { useState, useCallback, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import Link from "next/link";
import { Star, Clock, MapPin, Navigation } from "lucide-react";
import { cleanEncoding } from "@/lib/utils/stringUtils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MapMerchant {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  isOpen: boolean;
  rating: number | null;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  description: string | null;
}

interface ExploraUshuaiaMapProps {
  merchants: MapMerchant[];
}

// ─── Category → color mapping for legend ────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  "Panadería": "#F59E0B",
  "Restaurante": "#EF4444",
  "Farmacia": "#10B981",
  "Kiosco": "#8B5CF6",
  "Cafetería": "#D97706",
  "Heladería": "#06B6D4",
  "Supermercado": "#3B82F6",
  "Otro": "#6B7280",
};

function getCategoryColor(category: string | null): string {
  if (!category) return CATEGORY_COLORS.Otro;
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (category.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return CATEGORY_COLORS.Otro;
}

// Build a simple colored pin SVG as a data URL
function buildPinIcon(color: string, isOpen: boolean) {
  const opacity = isOpen ? 1 : 0.5;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${color}" fill-opacity="${opacity}" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="16" r="7" fill="white" fill-opacity="0.9"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ─── Ushuaia center coordinates ─────────────────────────────────────────────

const USHUAIA_CENTER = { lat: -54.8019, lng: -68.3030 };
const MAP_ZOOM = 14;

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
  borderRadius: "1rem",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function ExploraUshuaiaMap({ merchants }: ExploraUshuaiaMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    id: "moovy-maps",
  });

  const [selectedMerchant, setSelectedMerchant] = useState<MapMerchant | null>(null);

  // Only show merchants that have coordinates
  const mappableMerchants = useMemo(
    () => merchants.filter((m) => m.latitude && m.longitude),
    [merchants]
  );

  const handleMarkerClick = useCallback((merchant: MapMerchant) => {
    setSelectedMerchant((prev) => (prev?.id === merchant.id ? null : merchant));
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedMerchant(null);
  }, []);

  // Map options — defined inside component so `google` is available
  const mapOptions = useMemo(() => {
    if (!isLoaded) return {};
    return {
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      styles: [
        { featureType: "poi" as const, elementType: "labels" as const, stylers: [{ visibility: "off" as const }] },
        { featureType: "transit" as const, stylers: [{ visibility: "off" as const }] },
      ],
    };
  }, [isLoaded]);

  if (mappableMerchants.length === 0) {
    return null;
  }

  return (
    <section className="py-6 lg:py-10 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1 h-5 rounded-full bg-[#e60012]" />
          <Navigation className="w-5 h-5 text-[#e60012]" />
          <h2 className="text-lg lg:text-xl font-black text-gray-900">
            Explorá Ushuaia
          </h2>
        </div>
        <p className="text-sm text-gray-500 mb-4 lg:mb-5">
          Tocá un pin para ver el comercio
        </p>

        {/* Map container */}
        <div className="relative w-full h-[300px] lg:h-[420px] rounded-2xl overflow-hidden shadow-lg border border-gray-200">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={USHUAIA_CENTER}
              zoom={MAP_ZOOM}
              onClick={handleMapClick}
              options={mapOptions}
            >
              {/* Markers */}
              {mappableMerchants.map((merchant) => (
                <Marker
                  key={merchant.id}
                  position={{
                    lat: merchant.latitude!,
                    lng: merchant.longitude!,
                  }}
                  onClick={() => handleMarkerClick(merchant)}
                  icon={{
                    url: buildPinIcon(
                      getCategoryColor(merchant.category),
                      merchant.isOpen
                    ),
                    scaledSize: new google.maps.Size(32, 42),
                    anchor: new google.maps.Point(16, 42),
                  }}
                  title={merchant.name}
                />
              ))}

              {/* Info popup for selected merchant */}
              {selectedMerchant && selectedMerchant.latitude && selectedMerchant.longitude && (
                <InfoWindow
                  position={{
                    lat: selectedMerchant.latitude,
                    lng: selectedMerchant.longitude,
                  }}
                  onCloseClick={() => setSelectedMerchant(null)}
                  options={{ maxWidth: 260, pixelOffset: new google.maps.Size(0, -42) }}
                >
                  <div className="min-w-[220px]">
                    {/* Image */}
                    <div className="relative h-[90px] -mx-2 -mt-2 mb-2 overflow-hidden">
                      {selectedMerchant.image ? (
                        <img
                          src={selectedMerchant.image}
                          alt={selectedMerchant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <MapPin className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                      {!selectedMerchant.isOpen && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Cerrado</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm text-gray-900 truncate">
                        {cleanEncoding(selectedMerchant.name)}
                      </h3>
                      {selectedMerchant.rating ? (
                        <div className="flex items-center gap-0.5 text-xs text-gray-600 flex-shrink-0">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {selectedMerchant.rating.toFixed(1)}
                        </div>
                      ) : null}
                    </div>

                    {selectedMerchant.description && (
                      <p className="text-gray-400 text-xs line-clamp-1 mb-2">
                        {cleanEncoding(selectedMerchant.description)}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {selectedMerchant.deliveryTimeMin}-{selectedMerchant.deliveryTimeMax} min
                      </span>
                      <Link
                        href={`/tienda/${selectedMerchant.slug}`}
                        className="text-xs font-bold text-[#e60012] hover:underline"
                      >
                        Ver menú →
                      </Link>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            /* Loading state */
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-[#e60012] rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>

        {/* Category legend */}
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {Object.entries(CATEGORY_COLORS)
            .filter(([key]) => key !== "Otro")
            .map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] text-gray-500">{cat}</span>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
