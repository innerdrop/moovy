"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, X, Search } from "lucide-react";

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string, lat?: number, lng?: number, street?: string, number?: string) => void;
    placeholder?: string;
    className?: string;
    restrictToArgentina?: boolean;
    required?: boolean;
}

interface Suggestion {
    description: string;
    placeId?: string;
}

/**
 * AddressAutocomplete — Geocoding-based with manual suggestions
 *
 * Uses Google Geocoding API (which is reliably available) instead of Places API
 * (which requires separate enablement and costs more). Provides real-time
 * suggestions as the user types by geocoding partial addresses.
 *
 * Decisión 2026-03-21: Places API (New) no habilitada en el proyecto,
 * legacy deprecada. Geocoding funciona y es más barato.
 */
export function AddressAutocomplete({
    value,
    onChange,
    placeholder = "Ej: San Martín 500, Ushuaia",
    className = "",
    restrictToArgentina = true,
    required = false,
}: AddressAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [geocoderReady, setGeocoderReady] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync external value
    useEffect(() => {
        if (value !== inputValue) setInputValue(value);
    }, [value]);

    // Load Google Maps script manually (lightweight, no Places library needed)
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;

        // Check if already loaded
        if (typeof google !== "undefined" && google.maps?.Geocoder) {
            geocoderRef.current = new google.maps.Geocoder();
            setGeocoderReady(true);
            return;
        }

        // Wait for it to load (might be loading from another component)
        const checkInterval = setInterval(() => {
            if (typeof google !== "undefined" && google.maps?.Geocoder) {
                geocoderRef.current = new google.maps.Geocoder();
                setGeocoderReady(true);
                clearInterval(checkInterval);
            }
        }, 500);

        return () => clearInterval(checkInterval);
    }, []);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Geocode partial address for suggestions
    const fetchSuggestions = useCallback(async (query: string) => {
        if (!geocoderRef.current || query.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const suffix = restrictToArgentina ? ", Ushuaia, Tierra del Fuego, Argentina" : "";
            const result = await geocoderRef.current.geocode({
                address: query + suffix,
                region: "ar",
                bounds: new google.maps.LatLngBounds(
                    { lat: -54.85, lng: -68.45 },
                    { lat: -54.70, lng: -68.15 }
                ),
            });

            if (result.results) {
                const mapped: Suggestion[] = result.results
                    .slice(0, 5)
                    .map((r) => ({
                        description: r.formatted_address || "",
                        placeId: r.place_id,
                    }));
                setSuggestions(mapped);
                setShowSuggestions(mapped.length > 0);
            }
        } catch {
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, [restrictToArgentina]);

    const handleInputChange = (val: string) => {
        setInputValue(val);
        onChange(val); // Keep parent in sync with raw text

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
    };

    const selectSuggestion = async (suggestion: Suggestion) => {
        setShowSuggestions(false);

        if (!geocoderRef.current) {
            setInputValue(suggestion.description);
            onChange(suggestion.description);
            return;
        }

        try {
            // Re-geocode the selected address for precise coordinates
            const result = await geocoderRef.current.geocode({
                address: suggestion.description,
            });

            const place = result.results?.[0];
            if (!place) {
                setInputValue(suggestion.description);
                onChange(suggestion.description);
                return;
            }

            const lat = place.geometry?.location?.lat();
            const lng = place.geometry?.location?.lng();
            const components = place.address_components;

            const streetNumber = components?.find((c) =>
                c.types.includes("street_number")
            )?.long_name || "";
            const route = components?.find((c) =>
                c.types.includes("route")
            )?.long_name || "";

            const cleanAddress = route
                ? streetNumber ? `${route} ${streetNumber}` : route
                : suggestion.description;

            setInputValue(cleanAddress);
            onChange(cleanAddress, lat, lng, route || cleanAddress, streetNumber);
        } catch {
            setInputValue(suggestion.description);
            onChange(suggestion.description);
        }
    };

    const handleClear = () => {
        setInputValue("");
        setSuggestions([]);
        setShowSuggestions(false);
        onChange("");
        inputRef.current?.focus();
    };

    // Allow manual submission on Enter (geocode whatever they typed)
    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            setShowSuggestions(false);

            if (inputValue.trim().length < 3 || !geocoderRef.current) return;

            try {
                const suffix = restrictToArgentina ? ", Ushuaia, Argentina" : "";
                const result = await geocoderRef.current.geocode({
                    address: inputValue.trim() + suffix,
                    region: "ar",
                });

                const place = result.results?.[0];
                if (place) {
                    const lat = place.geometry?.location?.lat();
                    const lng = place.geometry?.location?.lng();
                    const components = place.address_components;
                    const streetNumber = components?.find((c) =>
                        c.types.includes("street_number")
                    )?.long_name || "";
                    const route = components?.find((c) =>
                        c.types.includes("route")
                    )?.long_name || "";

                    const cleanAddress = route
                        ? streetNumber ? `${route} ${streetNumber}` : route
                        : inputValue.trim();

                    setInputValue(cleanAddress);
                    onChange(cleanAddress, lat, lng, route || cleanAddress, streetNumber);
                }
            } catch {
                // Keep the raw input
            }
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e60012]/30 focus:border-[#e60012] transition text-base bg-white"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="search"
                    required={required}
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
                {!loading && inputValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
                {!loading && !inputValue && (
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => selectSuggestion(s)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0"
                        >
                            <MapPin className="w-4 h-4 text-[#e60012] mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 leading-snug">{s.description}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
