"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Phone } from "lucide-react";

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
}

const COUNTRY_CODES = [
    { code: "+54", flag: "🇦🇷", name: "Argentina" },
    { code: "+56", flag: "🇨🇱", name: "Chile" },
    { code: "+55", flag: "🇧🇷", name: "Brasil" },
    { code: "+598", flag: "🇺🇾", name: "Uruguay" },
    { code: "+595", flag: "🇵🇾", name: "Paraguay" },
    { code: "+1", flag: "🇺🇸", name: "USA" },
];

export default function PhoneInput({ value, onChange, error }: PhoneInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[0]);
    const [phoneNumber, setPhoneNumber] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initialize from value if present
    useEffect(() => {
        if (value) {
            // Simple logic to try detecting code, otherwise default to AR
            const foundCode = COUNTRY_CODES.find(c => value.startsWith(c.code));
            if (foundCode) {
                setSelectedCode(foundCode);
                setPhoneNumber(value.replace(foundCode.code, "").trim());
            } else {
                setPhoneNumber(value);
            }
        }
    }, []);

    // Update parent when parts change
    const updateValue = (code: string, number: string) => {
        onChange(`${code} ${number}`.trim());
    };

    const handleCodeSelect = (country: typeof COUNTRY_CODES[0]) => {
        setSelectedCode(country);
        setIsOpen(false);
        updateValue(country.code, phoneNumber);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, ""); // Num only
        setPhoneNumber(val);
        updateValue(selectedCode.code, val);
    };

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <div className={`flex items-center border rounded-lg overflow-hidden bg-white transition-colors ${error ? "border-red-300 ring-2 ring-red-100" : "border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"}`}>

                {/* Code Selector */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-3 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition min-w-[90px]"
                >
                    <span className="text-lg">{selectedCode.flag}</span>
                    <span className="text-sm font-medium text-gray-700">{selectedCode.code}</span>
                    <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Number Input */}
                <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Phone className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handleNumberChange}
                        placeholder="11 1234 5678"
                        className="w-full py-3 pl-10 pr-4 text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto animate-fadeIn">
                    {COUNTRY_CODES.map((country) => (
                        <button
                            key={country.code}
                            type="button"
                            onClick={() => handleCodeSelect(country)}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left transition"
                        >
                            <span className="text-xl">{country.flag}</span>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{country.name}</p>
                                <p className="text-xs text-gray-500">{country.code}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
