"use client";

import { useState } from "react";
import { Clock, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { updateSellerSchedule } from "@/app/vendedor/actions";

/** Un rango horario (turno) dentro de un día */
interface TimeRange {
    open: string;
    close: string;
}

/** Schedule semanal: cada día es un array de turnos o null (cerrado) */
type WeekSchedule = Record<string, TimeRange[] | null>;

const DAY_NAMES: Record<string, string> = {
    "1": "Lunes",
    "2": "Martes",
    "3": "Miércoles",
    "4": "Jueves",
    "5": "Viernes",
    "6": "Sábado",
    "7": "Domingo",
};

const MAX_SHIFTS_PER_DAY = 3;

const DEFAULT_SCHEDULE: WeekSchedule = {
    "1": [{ open: "09:00", close: "20:00" }],
    "2": [{ open: "09:00", close: "20:00" }],
    "3": [{ open: "09:00", close: "20:00" }],
    "4": [{ open: "09:00", close: "20:00" }],
    "5": [{ open: "09:00", close: "20:00" }],
    "6": [{ open: "10:00", close: "14:00" }],
    "7": null,
};

/**
 * Normaliza un schedule de la DB (legacy o nuevo) al formato array.
 * Legacy: { "1": { open, close } } → { "1": [{ open, close }] }
 */
function normalizeScheduleFromDb(raw: Record<string, unknown>): WeekSchedule {
    const result: WeekSchedule = {};
    for (let d = 1; d <= 7; d++) {
        const key = d.toString();
        const val = raw[key];
        if (val === null || val === undefined) {
            result[key] = null;
        } else if (Array.isArray(val)) {
            result[key] = val.filter(
                (r): r is TimeRange =>
                    r && typeof r === "object" && typeof r.open === "string" && typeof r.close === "string"
            );
        } else if (typeof val === "object" && "open" in (val as object) && "close" in (val as object)) {
            result[key] = [{ open: (val as TimeRange).open, close: (val as TimeRange).close }];
        } else {
            result[key] = null;
        }
    }
    return result;
}

interface ScheduleSectionProps {
    initialScheduleEnabled: boolean;
    initialScheduleJson: string | null;
}

export default function ScheduleSection({ initialScheduleEnabled, initialScheduleJson }: ScheduleSectionProps) {
    const [scheduleEnabled, setScheduleEnabled] = useState(initialScheduleEnabled);
    const [schedule, setSchedule] = useState<WeekSchedule>(() => {
        try {
            if (!initialScheduleJson) return DEFAULT_SCHEDULE;
            const raw = JSON.parse(initialScheduleJson);
            return normalizeScheduleFromDb(raw);
        } catch {
            return DEFAULT_SCHEDULE;
        }
    });
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSaveSchedule = async () => {
        setSavingSchedule(true);
        setError("");
        setSuccess("");

        const result = await updateSellerSchedule(
            scheduleEnabled,
            scheduleEnabled ? JSON.stringify(schedule) : null
        );

        if (result?.error) {
            setError(result.error);
        } else {
            setSuccess("Horarios guardados correctamente");
            setTimeout(() => setSuccess(""), 3000);
        }
        setSavingSchedule(false);
    };

    const updateShift = (day: string, shiftIndex: number, field: "open" | "close", value: string) => {
        setSchedule((prev) => {
            const shifts = [...(prev[day] || [{ open: "09:00", close: "20:00" }])];
            shifts[shiftIndex] = { ...shifts[shiftIndex], [field]: value };
            return { ...prev, [day]: shifts };
        });
    };

    const addShift = (day: string) => {
        setSchedule((prev) => {
            const existing = prev[day] || [];
            if (existing.length >= MAX_SHIFTS_PER_DAY) return prev;
            const lastClose = existing.length > 0 ? existing[existing.length - 1].close : "13:00";
            const [h] = lastClose.split(":").map(Number);
            const newOpen = `${String(Math.min(h + 2, 22)).padStart(2, "0")}:00`;
            const newClose = `${String(Math.min(h + 5, 23)).padStart(2, "0")}:00`;
            return { ...prev, [day]: [...existing, { open: newOpen, close: newClose }] };
        });
    };

    const removeShift = (day: string, shiftIndex: number) => {
        setSchedule((prev) => {
            const existing = prev[day] || [];
            if (existing.length <= 1) return prev;
            const updated = existing.filter((_, i) => i !== shiftIndex);
            return { ...prev, [day]: updated };
        });
    };

    const toggleDay = (day: string) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: prev[day] ? null : [{ open: "09:00", close: "20:00" }],
        }));
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-600" />
                Horarios de Despacho
            </h2>

            {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
                    {success}
                </div>
            )}

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                    <p className="text-sm font-medium text-gray-900">Disponibilidad para despacho</p>
                    <p className="text-xs text-gray-500">
                        Configura cuándo estás disponible para que un repartidor retire tus productos vendidos
                    </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-semibold text-gray-600 min-w-16 text-right">
                        {scheduleEnabled ? "Activo" : "Desactivado"}
                    </span>
                    <button
                        type="button"
                        onClick={() => setScheduleEnabled(!scheduleEnabled)}
                        className={`relative w-11 h-6 rounded-full transition ${scheduleEnabled ? "bg-violet-600" : "bg-gray-300"}`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                scheduleEnabled ? "translate-x-5" : ""
                            }`}
                        />
                    </button>
                </label>
            </div>

            {scheduleEnabled && (
                <div className="space-y-3 pt-2">
                    <p className="text-xs text-gray-600">
                        Selecciona los días y horarios en que puedes recibir retiros. Podés agregar turnos partidos (ej: mañana y tarde).
                    </p>

                    {Object.entries(DAY_NAMES).map(([day, name]) => {
                        const shifts = schedule[day];
                        const isOpen = shifts !== null && shifts !== undefined;

                        return (
                            <div key={day} className="p-3 bg-gray-50 rounded-lg space-y-2">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                                            isOpen
                                                ? "bg-violet-600 border-violet-600 text-white"
                                                : "border-gray-300 hover:border-gray-400"
                                        }`}
                                    >
                                        {isOpen && <span className="text-xs font-bold">&#10003;</span>}
                                    </button>

                                    <span
                                        className={`w-20 text-sm font-medium ${
                                            isOpen ? "text-gray-900" : "text-gray-400"
                                        }`}
                                    >
                                        {name}
                                    </span>

                                    {!isOpen && (
                                        <span className="text-sm text-gray-400 italic ml-auto">No disponible</span>
                                    )}
                                </div>

                                {isOpen && shifts && shifts.map((shift, idx) => (
                                    <div key={idx} className="flex items-center gap-2 ml-8">
                                        <input
                                            type="time"
                                            value={shift.open}
                                            onChange={(e) => updateShift(day, idx, "open", e.target.value)}
                                            className="input w-24 text-sm py-1"
                                        />
                                        <span className="text-gray-400 text-sm">a</span>
                                        <input
                                            type="time"
                                            value={shift.close}
                                            onChange={(e) => updateShift(day, idx, "close", e.target.value)}
                                            className="input w-24 text-sm py-1"
                                        />
                                        {shifts.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeShift(day, idx)}
                                                className="text-red-400 hover:text-red-600 transition p-1"
                                                title="Eliminar turno"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {isOpen && shifts && shifts.length < MAX_SHIFTS_PER_DAY && (
                                    <button
                                        type="button"
                                        onClick={() => addShift(day)}
                                        className="ml-8 text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1 transition"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Agregar turno
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={handleSaveSchedule}
                            disabled={savingSchedule}
                            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition disabled:opacity-50 flex items-center gap-2 font-medium text-sm"
                        >
                            {savingSchedule ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Guardar Horarios
                        </button>
                    </div>
                </div>
            )}

            {!scheduleEnabled && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSaveSchedule}
                        disabled={savingSchedule}
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                    >
                        {savingSchedule && <Loader2 className="w-3 h-3 animate-spin" />}
                        Guardar
                    </button>
                </div>
            )}
        </div>
    );
}
