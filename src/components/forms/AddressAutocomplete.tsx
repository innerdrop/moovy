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

interface Suggestion {
    description: string;
    mainText: string;
    secondaryText: string;
    placePrediction: any; // google.maps.places.PlacePrediction
}

const USHUAIA_BOUNDS = {
    south: -54.85,
    west: -68.45,
    north: -54.70,
    east: -68.15,
};

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

/**
 * AddressAutocomplete — Places API (New) con Data API
 *
 * Usa AutocompleteSuggestion.fetchAutocompleteSuggestions() de la nueva
 * Places API para obtener sugerencias, y toPlace().fetchFields() para
 * coordenadas y componentes de dirección.
 *
 * Fallback: Si Places API (New) no está habilitada, usa Geocoding API.
 *
 * Requiere: Places API (New) habilitada en Google Cloud Console.
 * Proyecto GCP: 1036892490928. Habilitada: 2026-03-21.
 *
 * Ref: https://developers.google.com/maps/documentation/javascript/place-autocomplete-data
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
    const [usePlacesApi, setUsePlacesApi] = useState<boolean | null>(null); // null = not yet determined

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);
    const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
        language: "es",
        region: "AR",
    });

    // Sync external value
    useEffect(() => {
        if (value !== inputValue) setInputValue(value);
    }, [value]);

    // Detect which API is available
    useEffect(() => {
        if (!isLoaded) return;

        // Check if Places API (New) AutocompleteSuggestion is available
        const hasPlacesNew = !!(
            google.maps.places &&
            (google.maps.places as any).AutocompleteSuggestion
        );

        setUsePlacesApi(hasPlacesNew);

        if (!hasPlacesNew) {
            // Fallback: initialize Geocoder
            geocoderRef.current = new google.maps.Geocoder();
            console.warn("[AddressAutocomplete] Places API (New) not available, using Geocoding fallback");
        } else {
            // Create session token for billing optimization
            sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        }
    }, [isLoaded]);

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

    // ─── Places API (New) suggestions ───
    const fetchPlacesSuggestions = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setLoading(true);
        try {
            const AutocompleteSuggestion = (google.maps.places as any).AutocompleteSuggestion;
            const request: any = {
                input: query,
                locationBias: new google.maps.LatLngBounds(
                    { lat: USHUAIA_BOUNDS.south, lng: USHUAIA_BOUNDS.west },
                    { lat: USHUAIA_BOUNDS.north, lng: USHUAIA_BOUNDS.east }
                ),
                includedPrimaryTypes: ["street_address", "route", "premise", "subpremise"],
                language: "es",
                region: "ar",
            };

            if (restrictToArgentina) {
                request.includedRegionCodes = ["ar"];
            }

            if (sessionTokenRef.current) {
                request.sessionToken = sessionTokenRef.current;
            }

            const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

            const mapped: Suggestion[] = (response.suggestions || []).slice(0, 5).map((s: any) => {
                const pp = s.placePrediction;

                // Extract full text — try multiple paths (JS SDK vs REST structure)
                const fullText =
                    pp?.text?.text ??
                    pp?.text?.toString?.() ??
                    (typeof pp?.text === "string" ? pp.text : "") ??
                    "";

                // Extract structured main/secondary text
                const mainText =
                    pp?.structuredFormat?.mainText?.text ??
                    pp?.mainText?.text ??
                    (typeof pp?.mainText === "string" ? pp.mainText : "") ??
                    fullText.split(",")[0]?.trim() ??
                    "";

                const secondaryText =
                    pp?.structuredFormat?.secondaryText?.text ??
                    pp?.secondaryText?.text ??
                    (typeof pp?.secondaryText === "string" ? pp.secondaryText : "") ??
                    fullText.split(",").slice(1).join(",").trim() ??
                    "";

                return {
                    description: fullText || mainText,
                    mainText: mainText || fullText,
                    secondaryText,
                    placePrediction: pp,
                };
            });

            setSuggestions(mapped);
            setShowSuggestions(mapped.length > 0);
        } catch (err) {
            console.error("[AddressAutocomplete] Places API error, falling back to Geocoding:", err);
            // Auto-fallback to Geocoding on error
            setUsePlacesApi(false);
            geocoderRef.current = new google.maps.Geocoder();
            fetchGeocodingSuggestions(query);
        } finally {
            setLoading(false);
        }
    }, [restrictToArgentina]);

    // ─── Geocoding fallback suggestions ───
    const fetchGeocodingSuggestions = useCallback(async (query: string) => {
        if (!geocoderRef.current || query.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const suffix = ", Ushuaia, Tierra del Fuego, Argentina";
            const result = await geocoderRef.current.geocode({
                address: query + suffix,
                region: "ar",
                bounds: new google.maps.LatLngBounds(
                    { lat: USHUAIA_BOUNDS.south, lng: USHUAIA_BOUNDS.west },
                    { lat: USHUAIA_BOUNDS.north, lng: USHUAIA_BOUNDS.east }
                ),
            });

            const mapped: Suggestion[] = (result.results || []).slice(0, 5).map((r) => ({
                description: r.formatted_address || "",
                mainText: r.formatted_address?.split(",")[0] || "",
                secondaryText: r.formatted_address?.split(",").slice(1).join(",").trim() || "",
                placePrediction: null,
            }));

            setSuggestions(mapped);
            setShowSuggestions(mapped.length > 0);
        } catch {
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Input change handler ───
    const handleInputChange = (val: string) => {
        setInputValue(val);
        onChange(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (usePlacesApi) {
                fetchPlacesSuggestions(val);
            } else {
                fetchGeocodingSuggestions(val);
            }
        }, 300);
    };

    // ─── Select a suggestion ───
    const selectSuggestion = async (suggestion: Suggestion) => {
        setShowSuggestions(false);
        setSuggestions([]);

        // Places API (New): use toPlace().fetchFields()
        if (suggestion.placePrediction && usePlacesApi) {
            try {
                const place = suggestion.placePrediction.toPlace();
                await place.fetchFields({
                    fields: ["addressComponents", "location", "formattedAddress"],
                });

                const lat = place.location?.lat();
                const lng = place.location?.lng();
                const components = place.addressComponents || [];

                let streetNumber = "";
                let route = "";

                for (const c of components) {
                    if (c.types.includes("street_number")) streetNumber = c.longText || "";
                    if (c.types.includes("route")) route = c.longText || "";
                }

                const cleanAddress = route
                    ? streetNumber ? `${route} ${streetNumber}` : route
                    : suggestion.mainText || suggestion.description;

                setInputValue(cleanAddress);
                onChange(cleanAddress, lat, lng, route || cleanAddress, streetNumber);

                // Refresh session token after a selection (billing best practice)
                sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
            } catch (err) {
                console.error("[AddressAutocomplete] fetchFields error:", err);
                setInputValue(suggestion.mainText || suggestion.description);
                onChange(suggestion.mainText || suggestion.description);
            }
            return;
        }

        // Geocoding fallback: re-geocode for coordinates
        if (geocoderRef.current) {
            try {
                const result = await geocoderRef.current.geocode({ address: suggestion.description });
                const place = result.results?.[0];
                if (place) {
                    const lat = place.geometry?.location?.lat();
                    const lng = place.geometry?.location?.lng();
                    const components = place.address_components || [];
                    const streetNumber = components.find((c) => c.types.includes("street_number"))?.long_name || "";
                    const route = components.find((c) => c.types.includes("route"))?.long_name || "";

                    const cleanAddress = route
                        ? streetNumber ? `${route} ${streetNumber}` : route
                        : suggestion.description;

                    setInputValue(cleanAddress);
                    onChange(cleanAddress, lat, lng, route || cleanAddress, streetNumber);
                    return;
                }
            } catch { /* fall through */ }
        }

        setInputValue(suggestion.description);
        onChange(suggestion.description);
    };

    // ─── Enter to confirm ───
    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (suggestions.length > 0) {
                selectSuggestion(suggestions[0]);
            }
        }
        if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    const handleClear = () => {
        setInputValue("");
        setSuggestions([]);
        setShowSuggestions(false);
        onChange("");
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                {isLoaded ? (
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
                ) : (
                    <div className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-400">Cargando...</span>
                    </div>
                )}
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
                {!loading && !inputValue && isLoaded && (
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
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0"
                        >
                            <MapPin className="w-4 h-4 text-[#e60012] mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{s.mainText}</p>
                                {s.secondaryText && (
                                    <p className="text-xs text-gray-500 truncate">{s.secondaryText}</p>
                                )}
                            </div>
                        </button>
                    ))}
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <p className="text-[10px] text-gray-400 text-right">Powered by Google</p>
                    </div>
                </div>
            )}
        </div>
    );
}
