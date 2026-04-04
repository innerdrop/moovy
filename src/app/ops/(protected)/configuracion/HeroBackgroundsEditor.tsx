"use client";

import { useState } from "react";
import { Sunrise, Sun, Sunset, Moon } from "lucide-react";

// Default Tailwind-equivalent colors for each time slot
const DEFAULT_BACKGROUNDS: Record<string, { from: string; via: string; to: string }> = {
    morning:   { from: "#fef3c7", via: "#fff7ed", to: "#fefce8" },    // amber-100/orange-50/yellow-50
    lunch:     { from: "#fef2f2", via: "#fff7ed", to: "#fffbeb" },    // red-50/orange-50/amber-50
    afternoon: { from: "#f0f9ff", via: "#eff6ff", to: "#eef2ff" },    // sky-50/blue-50/indigo-50
    dinner:    { from: "#ede9fe", via: "#faf5ff", to: "#eef2ff" },    // violet-100/purple-50/indigo-50
    night:     { from: "#1e293b", via: "#111827", to: "#0f172a" },    // slate-800/gray-900/slate-900
};

const SLOTS = [
    { id: "morning",   label: "Mañana",     hours: "6:00 – 11:00",  icon: Sunrise, iconColor: "text-amber-500" },
    { id: "lunch",     label: "Mediodía",   hours: "11:00 – 15:00", icon: Sun,     iconColor: "text-orange-500" },
    { id: "afternoon", label: "Tarde",      hours: "15:00 – 20:00", icon: Sun,     iconColor: "text-sky-500" },
    { id: "dinner",    label: "Cena",       hours: "20:00 – 23:00", icon: Sunset,  iconColor: "text-violet-500" },
    { id: "night",     label: "Noche",      hours: "23:00 – 6:00",  icon: Moon,    iconColor: "text-slate-400" },
] as const;

interface HeroBackgroundsEditorProps {
    initialValue: string; // JSON string from DB
}

export default function HeroBackgroundsEditor({ initialValue }: HeroBackgroundsEditorProps) {
    const parsed = (() => {
        try {
            const v = JSON.parse(initialValue || "{}");
            return typeof v === "object" && v !== null ? v : {};
        } catch {
            return {};
        }
    })();

    const [backgrounds, setBackgrounds] = useState<Record<string, { from: string; via: string; to: string }>>(() => {
        const result: Record<string, { from: string; via: string; to: string }> = {};
        for (const slot of SLOTS) {
            result[slot.id] = {
                from: parsed[slot.id]?.from || DEFAULT_BACKGROUNDS[slot.id].from,
                via:  parsed[slot.id]?.via  || DEFAULT_BACKGROUNDS[slot.id].via,
                to:   parsed[slot.id]?.to   || DEFAULT_BACKGROUNDS[slot.id].to,
            };
        }
        return result;
    });

    const updateColor = (slotId: string, field: "from" | "via" | "to", value: string) => {
        setBackgrounds(prev => ({
            ...prev,
            [slotId]: { ...prev[slotId], [field]: value },
        }));
    };

    const resetSlot = (slotId: string) => {
        setBackgrounds(prev => ({
            ...prev,
            [slotId]: { ...DEFAULT_BACKGROUNDS[slotId] },
        }));
    };

    // Hidden input carries the JSON value for ConfigForm submission
    const jsonValue = JSON.stringify(backgrounds);

    return (
        <div>
            <input type="hidden" name="heroBackgroundsJson" value={jsonValue} />

            <div className="space-y-3">
                {SLOTS.map(slot => {
                    const Icon = slot.icon;
                    const bg = backgrounds[slot.id];
                    return (
                        <div key={slot.id} className="p-4 rounded-2xl border border-gray-100 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <Icon className={`w-5 h-5 ${slot.iconColor}`} />
                                    <div>
                                        <h4 className="font-extrabold text-gray-900 text-sm">{slot.label}</h4>
                                        <p className="text-[10px] text-slate-400 font-medium">{slot.hours}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => resetSlot(slot.id)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider transition"
                                >
                                    Reset
                                </button>
                            </div>

                            {/* Preview gradient */}
                            <div
                                className="h-12 rounded-xl mb-3 border border-gray-200"
                                style={{
                                    background: `linear-gradient(135deg, ${bg.from}, ${bg.via}, ${bg.to})`,
                                }}
                            />

                            {/* Color pickers */}
                            <div className="grid grid-cols-3 gap-3">
                                {(["from", "via", "to"] as const).map(field => (
                                    <div key={field} className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={bg[field]}
                                            onChange={e => updateColor(slot.id, field, e.target.value)}
                                            className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">{field === "from" ? "Inicio" : field === "via" ? "Medio" : "Final"}</p>
                                            <p className="text-[10px] font-mono text-gray-600 truncate">{bg[field]}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
