"use client";

import { useMemo } from "react";
import { AlertCircle } from "lucide-react";

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

/**
 * Vendor schedule for a single day.
 * null = closed that day.
 */
interface DaySchedule {
    open: string; // "09:00"
    close: string; // "21:00"
}

/**
 * Weekly schedule: keys "1" (Monday) to "7" (Sunday).
 * Value is DaySchedule or null (closed).
 */
export type VendorSchedule = Record<string, DaySchedule | null>;

interface TimeSlotPickerProps {
    onSelect: (slotStart: string, slotEnd: string) => void;
    selectedStart?: string;
    /** Merged vendor schedule from /api/delivery/vendor-schedules */
    vendorSchedule?: VendorSchedule | null;
    /** Loading state while fetching vendor schedules */
    loading?: boolean;
}

const SLOT_HOURS = 2;

/** Default schedule si no hay vendor schedule — alineado con SettingsForm */
const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "21:00";

function parseHour(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h + (m || 0) / 60;
}

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

/**
 * Get the JS day-of-week (0=Sun..6=Sat) converted to schedule format (1=Mon..7=Sun)
 */
function jsToScheduleDay(jsDay: number): string {
    // JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    // Schedule: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
    return jsDay === 0 ? "7" : String(jsDay);
}

function generateSlots(vendorSchedule?: VendorSchedule | null): DayGroup[] {
    const now = new Date();
    const groups: Map<string, DayGroup> = new Map();

    // Start from 2 hours from now minimum
    const startHour = now.getHours() + 2;
    const cursor = new Date(now);
    cursor.setMinutes(0, 0, 0);
    cursor.setHours(startHour);

    const endLimit = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Get schedule for a specific day
    const getScheduleForDay = (date: Date): { openHour: number; closeHour: number } | null => {
        const scheduleKey = jsToScheduleDay(date.getDay());

        if (vendorSchedule) {
            const daySchedule = vendorSchedule[scheduleKey];
            if (!daySchedule) return null; // Vendor closed this day
            return {
                openHour: parseHour(daySchedule.open),
                closeHour: parseHour(daySchedule.close),
            };
        }

        // Default: 9-22 every day
        return {
            openHour: parseHour(DEFAULT_OPEN),
            closeHour: parseHour(DEFAULT_CLOSE),
        };
    };

    // Initialize cursor to first valid position
    const firstDaySchedule = getScheduleForDay(cursor);
    if (firstDaySchedule) {
        if (cursor.getHours() < firstDaySchedule.openHour) {
            cursor.setHours(Math.ceil(firstDaySchedule.openHour));
        }
        if (cursor.getHours() >= firstDaySchedule.closeHour) {
            cursor.setDate(cursor.getDate() + 1);
            cursor.setHours(0); // Will be adjusted in loop
        }
    }

    // Round to even hour for clean slots
    if (cursor.getHours() % SLOT_HOURS !== 0) {
        cursor.setHours(cursor.getHours() + (SLOT_HOURS - (cursor.getHours() % SLOT_HOURS)));
    }

    let iterations = 0;
    const MAX_ITERATIONS = 200; // Safety valve

    while (cursor < endLimit && iterations < MAX_ITERATIONS) {
        iterations++;
        const daySchedule = getScheduleForDay(cursor);

        // Day is closed - skip to next day
        if (!daySchedule) {
            cursor.setDate(cursor.getDate() + 1);
            cursor.setHours(0);
            // Find next day's open hour
            const nextSchedule = getScheduleForDay(cursor);
            if (nextSchedule) {
                cursor.setHours(Math.ceil(nextSchedule.openHour));
                if (cursor.getHours() % SLOT_HOURS !== 0) {
                    cursor.setHours(cursor.getHours() + (SLOT_HOURS - (cursor.getHours() % SLOT_HOURS)));
                }
            }
            continue;
        }

        const { openHour, closeHour } = daySchedule;

        // Before opening - move to opening
        if (cursor.getHours() < openHour) {
            cursor.setHours(Math.ceil(openHour));
            if (cursor.getHours() % SLOT_HOURS !== 0) {
                cursor.setHours(cursor.getHours() + (SLOT_HOURS - (cursor.getHours() % SLOT_HOURS)));
            }
            continue;
        }

        // Past closing - move to next day
        if (cursor.getHours() >= closeHour) {
            cursor.setDate(cursor.getDate() + 1);
            cursor.setHours(0);
            const nextSchedule = getScheduleForDay(cursor);
            if (nextSchedule) {
                cursor.setHours(Math.ceil(nextSchedule.openHour));
                if (cursor.getHours() % SLOT_HOURS !== 0) {
                    cursor.setHours(cursor.getHours() + (SLOT_HOURS - (cursor.getHours() % SLOT_HOURS)));
                }
            }
            continue;
        }

        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor);
        slotEnd.setHours(slotEnd.getHours() + SLOT_HOURS);

        // Only add if slot end doesn't exceed closing time
        if (slotEnd.getHours() <= closeHour || (slotEnd.getHours() === closeHour && slotEnd.getMinutes() === 0)) {
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
        }

        cursor.setHours(cursor.getHours() + SLOT_HOURS);
    }

    return Array.from(groups.values());
}

export default function TimeSlotPicker({ onSelect, selectedStart, vendorSchedule, loading }: TimeSlotPickerProps) {
    const dayGroups = useMemo(() => generateSlots(vendorSchedule), [vendorSchedule]);

    if (loading) {
        return (
            <div className="text-center py-4 lg:py-6">
                <div className="w-5 h-5 lg:w-6 lg:h-6 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin mx-auto mb-2 lg:mb-3" />
                <p className="text-sm lg:text-base text-gray-400">Cargando horarios disponibles...</p>
            </div>
        );
    }

    // Check if ALL days in the next 48h are closed
    const allClosed = dayGroups.length === 0;

    return (
        <div className="space-y-4 lg:space-y-6">
            <p className="text-sm lg:text-base text-gray-500">
                Elegí un horario de entrega en las próximas 48 horas
            </p>

            {allClosed && (
                <div className="flex items-start gap-3 p-3 lg:p-4 bg-amber-50 border border-amber-200 rounded-lg lg:rounded-xl">
                    <AlertCircle className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm lg:text-base text-amber-800">
                        No hay horarios de entrega programada disponibles en las próximas 48 horas para este vendedor. Podés elegir entrega inmediata.
                    </p>
                </div>
            )}

            {dayGroups.map((group) => (
                <div key={group.date}>
                    <h4 className="text-sm lg:text-base font-semibold text-gray-700 mb-2 lg:mb-3 capitalize">
                        {group.label}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
                        {group.slots.map((slot) => {
                            const isoStart = slot.start.toISOString();
                            const isSelected = selectedStart === isoStart;

                            return (
                                <button
                                    key={isoStart}
                                    type="button"
                                    onClick={() => onSelect(isoStart, slot.end.toISOString())}
                                    className={`
                                        px-3 py-2.5 lg:px-4 lg:py-3 rounded-lg lg:rounded-xl text-sm lg:text-base font-medium lg:font-semibold transition-all border
                                        ${isSelected
                                            ? "bg-red-500 text-white border-red-500 shadow-md lg:shadow-lg"
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
        </div>
    );
}
