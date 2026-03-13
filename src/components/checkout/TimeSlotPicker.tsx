"use client";

import { useMemo } from "react";

interface TimeSlot {
    start: Date;
    end: Date;
    label: string;
}

interface DayGroup {
    label: string;
    date: string; // YYYY-MM-DD
    slots: TimeSlot[];
}

interface TimeSlotPickerProps {
    onSelect: (slotStart: string, slotEnd: string) => void;
    selectedStart?: string;
}

/** Business hours window */
const OPEN_HOUR = 9;
const CLOSE_HOUR = 22;
const SLOT_HOURS = 2;

function formatTime(date: Date): string {
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getDayLabel(date: Date, today: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const t = new Date(today);
    t.setHours(0, 0, 0, 0);

    const diffDays = Math.round((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Mañana";
    if (diffDays === 2) return "Pasado mañana";

    return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" });
}

function generateSlots(): DayGroup[] {
    const now = new Date();
    const groups: Map<string, DayGroup> = new Map();

    // Start from next even hour (minimum 1 hour from now)
    const startHour = now.getHours() + 2; // At least 2 hours from now
    const cursor = new Date(now);
    cursor.setMinutes(0, 0, 0);
    cursor.setHours(startHour);

    // If start is before business hours, move to OPEN_HOUR
    if (cursor.getHours() < OPEN_HOUR) {
        cursor.setHours(OPEN_HOUR);
    }

    // If start is past close, move to next day OPEN_HOUR
    if (cursor.getHours() >= CLOSE_HOUR) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(OPEN_HOUR);
    }

    // Round to even hour for clean 2-hour blocks
    if (cursor.getHours() % SLOT_HOURS !== 0) {
        cursor.setHours(cursor.getHours() + (SLOT_HOURS - (cursor.getHours() % SLOT_HOURS)));
    }

    const endLimit = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    while (cursor < endLimit) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor);
        slotEnd.setHours(slotEnd.getHours() + SLOT_HOURS);

        // Skip if outside business hours
        if (slotStart.getHours() < OPEN_HOUR || slotStart.getHours() >= CLOSE_HOUR) {
            cursor.setDate(cursor.getDate() + 1);
            cursor.setHours(OPEN_HOUR);
            continue;
        }

        if (slotEnd.getHours() > CLOSE_HOUR + SLOT_HOURS) {
            // Move to next day
            cursor.setDate(cursor.getDate() + 1);
            cursor.setHours(OPEN_HOUR);
            continue;
        }

        const dateKey = slotStart.toISOString().split("T")[0];
        if (!groups.has(dateKey)) {
            groups.set(dateKey, {
                label: getDayLabel(slotStart, now),
                date: dateKey,
                slots: [],
            });
        }

        groups.get(dateKey)!.slots.push({
            start: slotStart,
            end: slotEnd,
            label: `${formatTime(slotStart)} - ${formatTime(slotEnd)}`,
        });

        cursor.setHours(cursor.getHours() + SLOT_HOURS);
    }

    return Array.from(groups.values());
}

export default function TimeSlotPicker({ onSelect, selectedStart }: TimeSlotPickerProps) {
    const dayGroups = useMemo(() => generateSlots(), []);

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">
                Elegí un horario de entrega en las próximas 48 horas
            </p>

            {dayGroups.map((group) => (
                <div key={group.date}>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                        {group.label}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {group.slots.map((slot) => {
                            const isoStart = slot.start.toISOString();
                            const isSelected = selectedStart === isoStart;

                            return (
                                <button
                                    key={isoStart}
                                    type="button"
                                    onClick={() => onSelect(isoStart, slot.end.toISOString())}
                                    className={`
                                        px-3 py-2.5 rounded-lg text-sm font-medium transition-all border
                                        ${isSelected
                                            ? "bg-red-500 text-white border-red-500 shadow-md"
                                            : "bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50"
                                        }
                                    `}
                                >
                                    {slot.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {dayGroups.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                    No hay horarios disponibles en este momento
                </p>
            )}
        </div>
    );
}
