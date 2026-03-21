"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { MapPin, Loader2, X, Search } from "lucide-react";

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string, lat?: number, lng?: number, street?: string, number?: string) => void;
    placeholder?: string;
    className?: string;
    restrictToArgentina?: boolean;
    required?: boolean;
}

/**
 * AddressAutocomplete — migrado a PlaceAutocompleteElement (nueva API de Google)
 *
 * La API legacy (google.maps.places.Autocomplete) fue deprecada en marzo 2025
 * y no está disponible para clientes nuevos. Esta versión usa el nuevo Web Component
 * PlaceAutocompleteElement que Google recomienda.
 *
 * Decisión 2026-03-21: Migración urgente para evitar corte de servicio antes del lanzamiento.
 */
export function AddressAutocomplete({
    value,
    onChange,
    placeholder = "Ingresá tu dirección...",
    className = "",
    restrictToArgentina = true,
    required = false,
}: AddressAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value);
    const [isPlaceSelected, setIsPlaceSelected] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const autocompleteElementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const initializedRef = useRef(false);

    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ["places", "geometry"],
        language: "es",
        region: "AR",
    });

    // Sync external value changes
    useEffect(() => {
        if (value !== inputValue) {
            setInputValue(value);
        }
    }, [value]);

    // Initialize PlaceAutocompleteElement when Google Maps is loaded
    useEffect(() => {
        if (!isLoaded || !containerRef.current || initializedRef.current) return;

        // Check if the new API is available
        if (!google.maps.places.PlaceAutocompleteElement) {
            console.warn("[AddressAutocomplete] PlaceAutocompleteElement not available, falling back to legacy");
            initLegacyAutocomplete();
            return;
        }

        try {
            const ushuaiaBounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(-54.85, -68.45),
                new google.maps.LatLng(-54.70, -68.15)
            );

            const autocompleteElement = new google.maps.places.PlaceAutocompleteElement({
                componentRestrictions: restrictToArgentina ? { country: "ar" } : undefined,
                locationBias: ushuaiaBounds,
                types: ["address"],
            });

            // Style the web component to match our design
            autocompleteElement.style.width = "100%";
            autocompleteElement.style.outline = "none";

            // Listen for place selection
            autocompleteElement.addEventListener("gmp-select", async (event: any) => {
                const placePrediction = event.placePrediction;
                if (!placePrediction) return;

                try {
                    const place = placePrediction.toPlace();
                    await place.fetchFields({
                        fields: ["addressComponents", "location", "formattedAddress", "displayName"],
                    });

                    const lat = place.location?.lat();
                    const lng = place.location?.lng();
                    const addressComponents = place.addressComponents;

                    let streetNumber = "";
                    let route = "";

                    if (addressComponents) {
                        for (const component of addressComponents) {
                            if (component.types.includes("street_number")) {
                                streetNumber = component.longText || "";
                            }
                            if (component.types.includes("route")) {
                                route = component.longText || "";
                            }
                        }
                    }

                    const cleanAddress = route
                        ? (streetNumber ? `${route} ${streetNumber}` : route)
                        : (place.displayName || place.formattedAddress || "");

                    setInputValue(cleanAddress);
                    setIsPlaceSelected(true);
                    onChange(cleanAddress, lat, lng, route || cleanAddress, streetNumber || "");
                } catch (err) {
                    console.error("[AddressAutocomplete] Error fetching place details:", err);
                }
            });

            // Clear existing content and append
            const wrapper = containerRef.current;
            // Keep only our custom UI elements, replace the autocomplete slot
            const slot = wrapper.querySelector("[data-autocomplete-slot]");
            if (slot) {
                slot.innerHTML = "";
                slot.appendChild(autocompleteElement);
            }

            autocompleteElementRef.current = autocompleteElement;
            initializedRef.current = true;
        } catch (err) {
            console.error("[AddressAutocomplete] Error creating PlaceAutocompleteElement:", err);
            initLegacyAutocomplete();
        }
    }, [isLoaded, restrictToArgentina, onChange]);

    // Fallback to legacy API if new API isn't available
    const initLegacyAutocomplete = useCallback(() => {
        if (!isLoaded || !inputRef.current || initializedRef.current) return;

        const ushuaiaBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(-54.85, -68.45),
            new google.maps.LatLng(-54.70, -68.15)
        );

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            bounds: ushuaiaBounds,
            componentRestrictions: restrictToArgentina ? { country: "ar" } : undefined,
            fields: ["address_components", "geometry", "formatted_address", "name"],
            types: ["address"],
        });

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.formatted_address) return;

            const lat = place.geometry?.location?.lat();
            const lng = place.geometry?.location?.lng();
            const addressComponents = place.address_components;
            const streetNumber = addressComponents?.find(c => c.types.includes("street_number"))?.long_name;
            const route = addressComponents?.find(c => c.types.includes("route"))?.long_name;

            const cleanAddress = route
                ? (streetNumber ? `${route} ${streetNumber}` : route)
                : (place.name || place.formatted_address);

            setInputValue(cleanAddress);
            setIsPlaceSelected(true);
            if (inputRef.current) inputRef.current.value = cleanAddress;
            onChange(cleanAddress, lat, lng, route || cleanAddress, streetNumber || "");
        });

        initializedRef.current = true;

        // Fix z-index for pac-container
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLElement && node.classList.contains("pac-container")) {
                        node.style.zIndex = "10000";
                        node.addEventListener("touchend", (e) => e.stopPropagation());
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true });

        return () => observer.disconnect();
    }, [isLoaded, restrictToArgentina, onChange]);

    const handleClear = useCallback(() => {
        setInputValue("");
        setIsPlaceSelected(false);
        if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.focus();
        }
        // Reset the PlaceAutocompleteElement if it exists
        if (autocompleteElementRef.current) {
            // Remove and re-create to clear the input
            const slot = containerRef.current?.querySelector("[data-autocomplete-slot]");
            if (slot && autocompleteElementRef.current.parentElement) {
                initializedRef.current = false;
                autocompleteElementRef.current = null;
            }
        }
        onChange("");
    }, [onChange]);

    if (loadError) {
        return <div className="text-red-500 text-sm">Error cargando Google Maps</div>;
    }

    // New API: PlaceAutocompleteElement renders as a web component
    // We render a container for it + a fallback input for the legacy API
    const usesNewApi = isLoaded && typeof google !== "undefined" &&
        google.maps?.places?.PlaceAutocompleteElement;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />

                {isLoaded ? (
                    usesNewApi ? (
                        // New API: Web Component slot
                        <div className="address-autocomplete-new">
                            <div
                                data-autocomplete-slot
                                className="w-full [&_gmp-placeautocomplete]:w-full [&_gmp-placeautocomplete]:border [&_gmp-placeautocomplete]:border-gray-300 [&_gmp-placeautocomplete]:rounded-lg [&_gmp-placeautocomplete]:text-base [&_input]:pl-10 [&_input]:pr-10 [&_input]:py-3"
                            />
                            {/* Clear button for new API */}
                            {isPlaceSelected && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ) : (
                        // Legacy API fallback
                        <>
                            <input
                                ref={inputRef}
                                type="text"
                                defaultValue={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    onChange(e.target.value);
                                }}
                                placeholder={placeholder}
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-base"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                enterKeyHint="search"
                                required={required}
                            />
                            {inputValue && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                            {!inputValue && (
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            )}
                        </>
                    )
                ) : (
                    <div className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-400">Cargando buscador...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
