"use client";

import { Info } from "lucide-react";
import { useState } from "react";

export default function InfoTooltip({ text }: { text: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative inline-block ml-2 align-middle">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                className="focus:outline-none"
            >
                <Info className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-help transition-colors" />
            </button>

            <div
                className={`
                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 
                    bg-gray-800 text-white text-xs rounded-lg shadow-lg text-center z-50 
                    transition-all duration-200
                    ${isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-1"}
                `}
            >
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
            </div>
        </div>
    );
}
