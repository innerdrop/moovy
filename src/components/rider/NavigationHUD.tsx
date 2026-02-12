"use client";

import React from "react";
import {
    ArrowUp,
    ArrowUpRight,
    ArrowRight,
    ArrowUpLeft,
    ArrowLeft,
    RotateCcw,
    Navigation,
    MapPin,
    Clock,
    Flag
} from "lucide-react";

interface NavigationStep {
    instruction: string;
    distance: string;
    duration: string;
    maneuver?: string;
}

interface NavigationHUDProps {
    currentStep: NavigationStep | null;
    nextStep: NavigationStep | null;
    totalDistance: string;
    totalDuration: string;
    stepsRemaining: number;
    destinationName: string;
    isPickedUp: boolean;
}

// Map maneuver strings to icons
function getManeuverIcon(maneuver?: string) {
    if (!maneuver) return <ArrowUp className="w-7 h-7" />;

    if (maneuver.includes("left") && maneuver.includes("sharp"))
        return <ArrowLeft className="w-7 h-7" />;
    if (maneuver.includes("left"))
        return <ArrowUpLeft className="w-7 h-7" />;
    if (maneuver.includes("right") && maneuver.includes("sharp"))
        return <ArrowRight className="w-7 h-7" />;
    if (maneuver.includes("right"))
        return <ArrowUpRight className="w-7 h-7" />;
    if (maneuver.includes("uturn") || maneuver.includes("u-turn"))
        return <RotateCcw className="w-7 h-7" />;

    return <ArrowUp className="w-7 h-7" />;
}

// Strip HTML tags from Google's instruction text
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
}

export default function NavigationHUD({
    currentStep,
    nextStep,
    totalDistance,
    totalDuration,
    stepsRemaining,
    destinationName,
    isPickedUp,
}: NavigationHUDProps) {
    if (!currentStep) return null;

    return (
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            {/* Current Step Card */}
            <div className="mx-3 mb-3 pointer-events-auto">
                {/* Main instruction */}
                <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    {/* Current turn instruction */}
                    <div className="flex items-center gap-4 p-4">
                        {/* Maneuver icon */}
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                            {getManeuverIcon(currentStep.maneuver)}
                        </div>

                        {/* Instruction text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-base leading-tight line-clamp-2">
                                {stripHtml(currentStep.instruction)}
                            </p>
                            <p className="text-green-400 font-bold text-sm mt-1">
                                {currentStep.distance}
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/10" />

                    {/* Bottom row: ETA + Destination */}
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="text-white/90 text-xs font-semibold">{totalDuration}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Navigation className="w-4 h-4 text-blue-400" />
                                <span className="text-white/70 text-xs">{totalDistance}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {isPickedUp ? (
                                <Flag className="w-4 h-4 text-red-400" />
                            ) : (
                                <MapPin className="w-4 h-4 text-blue-400" />
                            )}
                            <span className="text-white/70 text-xs font-medium truncate max-w-[120px]">
                                {destinationName}
                            </span>
                        </div>
                    </div>

                    {/* Next step preview */}
                    {nextStep && stepsRemaining > 1 && (
                        <>
                            <div className="h-px bg-white/5" />
                            <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5">
                                <div className="flex-shrink-0 text-white/40">
                                    {getManeuverIcon(nextStep.maneuver)}
                                </div>
                                <p className="text-white/50 text-xs truncate">
                                    Luego: {stripHtml(nextStep.instruction)}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
