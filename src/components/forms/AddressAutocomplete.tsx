"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { MapPin, Loader2, X, Search } from "lucide-react";

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string, lat?: number, lng?: number, street?: string, number?: string) => void;
    placeholder?: string;
    className?: string;
    // We'll use Google's own bounds or restriction
    restrictToArgentina?: boolean;
    required?: boolean;
}

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places", "geometry"];

export function AddressAutocomplete({
    value,
    onChange,
    placeholder = "Ingresá tu dirección...",
    className = "",
    restrictToArgentina = true,
    required = false,
}: AddressAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ["places", "geometry"],
        language: 'es',
        region: 'AR'
    });

    // Update internal state when prop changes (but only if different to avoid cursor jump)
    useEffect(() => {
        if (value !== inputValue) {
            setInputValue(value);
            if (inputRef.current && inputRef.current.value !== value) {
                inputRef.current.value = value;
            }
        }
    }, [value]);

    // Fix: Ensure pac-container z-index is always high enough on mobile
    // Google dynamically creates it, so we need to observe its creation
    useEffect(() => {
        if (!isLoaded) return;

        const fixPacContainer = () => {
            const containers = document.querySelectorAll('.pac-container');
            containers.forEach((container) => {
                (container as HTMLElement).style.zIndex = '10000';
            });
        };

        // Watch for pac-container being added to DOM
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLElement && node.classList.contains('pac-container')) {
                        node.style.zIndex = '10000';
                        // On mobile, prevent touchmove from dismissing the dropdown
                        node.addEventListener('touchend', (e) => {
                            e.stopPropagation();
                        });
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true });
        // Also fix any already existing containers
        fixPacContainer();

        return () => observer.disconnect();
    }, [isLoaded]);

    const onLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete;

        // Restrict to Ushuaia area
        if (typeof window !== 'undefined' && window.google) {
            const ushuaiaBounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(-54.85, -68.45), // Southwest
                new google.maps.LatLng(-54.70, -68.15)  // Northeast
            );
            autocomplete.setBounds(ushuaiaBounds);

            if (restrictToArgentina) {
                autocomplete.setComponentRestrictions({ country: "ar" });
            }
        }
    }, [restrictToArgentina]);

    const onPlaceChanged = useCallback(() => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();

            if (place.formatted_address) {
                const lat = place.geometry?.location?.lat();
                const lng = place.geometry?.location?.lng();

                // Extract a cleaner address (street and number)
                let cleanAddress = place.name || place.formatted_address;

                const addressComponents = place.address_components;
                const streetNumber = addressComponents?.find(c => c.types.includes("street_number"))?.long_name;
                const route = addressComponents?.find(c => c.types.includes("route"))?.long_name;

                if (route) {
                    cleanAddress = streetNumber ? `${route} ${streetNumber}` : route;
                }

                setInputValue(cleanAddress);
                if (inputRef.current) {
                    inputRef.current.value = cleanAddress;
                }
                onChange(cleanAddress, lat, lng, route || cleanAddress, streetNumber || "");
            }
        }
    }, [onChange]);

    const handleClear = useCallback(() => {
        setInputValue("");
        if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.focus();
        }
        onChange("");
    }, [onChange]);

    if (loadError) {
        return <div className="text-red-500 text-sm">Error cargando Google Maps</div>;
    }

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

                {isLoaded ? (
                    <Autocomplete
                        onLoad={onLoad}
                        onPlaceChanged={onPlaceChanged}
                        fields={["address_components", "geometry", "formatted_address", "name"]}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            defaultValue={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                // Clear coordinates when user types manually
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
                    </Autocomplete>
                ) : (
                    <div className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-400">Cargando buscador...</span>
                    </div>
                )}

                {/* Clear button */}
                {inputValue && isLoaded && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                {!inputValue && isLoaded && (
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                )}
            </div>
        </div>
    );
}
