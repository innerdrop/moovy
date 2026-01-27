"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, X, Search } from "lucide-react";

interface AddressSuggestion {
    display_name: string;
    lat: string;
    lon: string;
    address: {
        road?: string;
        house_number?: string;
        city?: string;
        town?: string;
        state?: string;
        country?: string;
    };
}

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string, lat?: number, lng?: number) => void;
    placeholder?: string;
    className?: string;
    // Restrict search to a specific area (e.g., Ushuaia)
    boundingBox?: {
        minLat: number;
        maxLat: number;
        minLon: number;
        maxLon: number;
    };
}

// Default bounding box for Ushuaia, Tierra del Fuego
const USHUAIA_BOUNDS = {
    minLat: -54.85,
    maxLat: -54.75,
    minLon: -68.40,
    maxLon: -68.25,
};

/**
 * Address autocomplete component using Nominatim (OpenStreetMap) API
 * Provides address suggestions and geocoding (lat/lng)
 */
export function AddressAutocomplete({
    value,
    onChange,
    placeholder = "Ingresá tu dirección...",
    className = "",
    boundingBox = USHUAIA_BOUNDS,
}: AddressAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Update input when external value changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search for addresses using Nominatim
    const searchAddresses = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Build Nominatim search URL with bounding box
            const params = new URLSearchParams({
                q: query,
                format: "json",
                addressdetails: "1",
                limit: "5",
                countrycodes: "ar", // Restrict to Argentina
                viewbox: `${boundingBox.minLon},${boundingBox.maxLat},${boundingBox.maxLon},${boundingBox.minLat}`,
                bounded: "1", // Strictly within viewbox
            });

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?${params}`,
                {
                    headers: {
                        "Accept-Language": "es",
                        "User-Agent": "Moovy-App/1.0",
                    },
                }
            );

            if (!response.ok) throw new Error("Error en la búsqueda");

            const data: AddressSuggestion[] = await response.json();
            setSuggestions(data);
            setIsOpen(data.length > 0);
        } catch (err) {
            console.error("Geocoding error:", err);
            setError("No se pudo buscar direcciones");
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [boundingBox]);

    // Debounced search
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue); // Update parent without coordinates

        // Debounce the search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchAddresses(newValue);
        }, 400);
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);

        // Extract a cleaner address format
        const parts = [];
        if (suggestion.address.road) parts.push(suggestion.address.road);
        if (suggestion.address.house_number) parts.push(suggestion.address.house_number);

        const cleanAddress = parts.length > 0
            ? parts.join(" ")
            : suggestion.display_name.split(",")[0];

        setInputValue(cleanAddress);
        onChange(cleanAddress, lat, lng);
        setIsOpen(false);
        setSuggestions([]);
    };

    // Clear input
    const handleClear = () => {
        setInputValue("");
        onChange("");
        setSuggestions([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    autoComplete="off"
                />

                {/* Loading/Clear button */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : inputValue ? (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    ) : (
                        <Search className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Suggestions dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-orange-50 focus:bg-orange-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition"
                        >
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {suggestion.address.road || suggestion.display_name.split(",")[0]}
                                        {suggestion.address.house_number && ` ${suggestion.address.house_number}`}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {suggestion.display_name}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Error message */}
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}

            {/* No results message */}
            {isOpen && !isLoading && inputValue.length >= 3 && suggestions.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
                    <p className="text-sm text-gray-500">No se encontraron direcciones</p>
                    <p className="text-xs text-gray-400 mt-1">Probá con otra búsqueda</p>
                </div>
            )}
        </div>
    );
}
