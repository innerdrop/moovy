"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Tag, ChevronDown } from "lucide-react";

const ecosystemApps = [
    {
        id: "tienda",
        label: "Tienda",
        sublabel: "Delivery y comercios",
        href: "/",
        icon: ShoppingBag,
        color: "#e60012",
        gradient: "from-[#e60012] to-[#cc000f]",
        active: true,
    },
    {
        id: "marketplace",
        label: "Marketplace",
        sublabel: "Comprá y vendé",
        href: "/marketplace",
        icon: Tag,
        color: "#7C3AED",
        gradient: "from-[#7C3AED] to-[#5B21B6]",
    },
];

export default function AppSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const isMarketplace = pathname?.startsWith("/marketplace");
    const accent = isMarketplace ? "#7C3AED" : "#e60012";
    const accentBg = isMarketplace ? "hover:bg-violet-50/50" : "hover:bg-red-50/50";

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all ${accentBg}`}
                style={{ color: accent, borderColor: undefined }}
            >
                <div className="grid grid-cols-2 gap-[2px] w-[12px] h-[12px]">
                    <span className="w-[5px] h-[5px] rounded-[1.5px]" style={{ backgroundColor: accent }} />
                    <span className="w-[5px] h-[5px] rounded-[1.5px]" style={{ backgroundColor: accent }} />
                    <span className="w-[5px] h-[5px] rounded-[1.5px]" style={{ backgroundColor: accent }} />
                    <span className="w-[5px] h-[5px] rounded-[1.5px]" style={{ backgroundColor: accent }} />
                </div>
                <span className="hidden sm:inline">{isMarketplace ? "Marketplace" : "Tienda"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-[70] w-[220px] p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {ecosystemApps.map((app) => {
                        const Icon = app.icon;
                        const LinkComp = app.external ? "a" : Link;
                        const extraProps = app.external ? { target: "_blank", rel: "noopener noreferrer" } : {};

                        return (
                            <LinkComp
                                key={app.id}
                                href={app.href}
                                {...extraProps as any}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${app.active
                                    ? "bg-red-50"
                                    : "hover:bg-gray-50"
                                    }`}
                            >
                                <div
                                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${app.gradient} flex items-center justify-center flex-shrink-0`}
                                >
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-gray-900">{app.label}</div>
                                    <div className="text-[10px] text-gray-500">{app.sublabel}</div>
                                </div>
                                {app.badge && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${app.badgeColor}`}>
                                        {app.badge}
                                    </span>
                                )}
                            </LinkComp>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
