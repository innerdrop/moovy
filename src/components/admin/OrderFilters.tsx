"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce"; // Assuming we have this, or I'll just use timeout

export default function OrderFilters({ currentStatus, currentSearch }: { currentStatus: string, currentSearch: string }) {
    const router = useRouter();
    const [search, setSearch] = useState(currentSearch);

    // Simple debounce implementation inside component to avoid external dependency for now
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== currentSearch) {
                updateParams({ q: search, page: "1" });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const updateParams = (updates: Record<string, string>) => {
        const params = new URLSearchParams(window.location.search);
        Object.entries(updates).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        router.push(`?${params.toString()}`);
    };

    const statuses = [
        { value: "ALL", label: "Todos" },
        { value: "PENDING", label: "Pendientes" },
        { value: "CONFIRMED", label: "Confirmados" },
        { value: "PREPARING", label: "En Preparación" },
        { value: "READY", label: "Listos" },
        { value: "IN_DELIVERY", label: "En Camino" },
        { value: "DELIVERED", label: "Entregados" },
        { value: "CANCELLED", label: "Cancelados" },
    ];

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                {statuses.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => updateParams({ status: s.value, page: "1" })}
                        className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentStatus === s.value
                                ? "bg-slate-900 text-white shadow-md"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                            }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar orden, cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e60012]/50 focus:border-[#e60012]"
                />
                {search && (
                    <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
