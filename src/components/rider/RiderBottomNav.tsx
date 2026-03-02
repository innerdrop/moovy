"use client";

import React, { memo } from "react";
import { Home, Wallet, History, User } from "lucide-react";

type TabId = "dashboard" | "earnings" | "history" | "profile";

interface RiderBottomNavProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Inicio", icon: Home },
    { id: "earnings", label: "Ganancias", icon: Wallet },
    { id: "history", label: "Historial", icon: History },
    { id: "profile", label: "Perfil", icon: User },
];

function RiderBottomNavInner({ activeTab, onTabChange }: RiderBottomNavProps) {
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-[70]"
            style={{
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
        >
            {/* Glassmorphism background */}
            <div
                className="mx-auto"
                style={{
                    background: "rgba(255, 255, 255, 0.92)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    borderTop: "1px solid rgba(0, 0, 0, 0.06)",
                    boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.06)",
                }}
            >
                <div className="flex items-center justify-around px-2 py-1">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className="flex flex-col items-center justify-center flex-1 py-2 relative group"
                                style={{ WebkitTapHighlightColor: "transparent" }}
                            >
                                {/* Active indicator dot */}
                                {isActive && (
                                    <div
                                        className="absolute -top-1 w-5 h-[3px] rounded-full"
                                        style={{
                                            background: "linear-gradient(90deg, #e60012, #ff3344)",
                                        }}
                                    />
                                )}

                                <div
                                    className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 ${isActive
                                        ? "scale-110"
                                        : "group-active:scale-90"
                                        }`}
                                >
                                    <Icon
                                        className={`w-[22px] h-[22px] transition-colors duration-300 ${isActive
                                            ? "text-[#e60012]"
                                            : "text-gray-400 group-hover:text-gray-600"
                                            }`}
                                        strokeWidth={isActive ? 2.5 : 1.8}
                                    />
                                </div>

                                <span
                                    className={`text-[10px] mt-0.5 font-semibold tracking-wide transition-colors duration-300 ${isActive
                                        ? "text-[#e60012]"
                                        : "text-gray-400 group-hover:text-gray-600"
                                        }`}
                                >
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}

const RiderBottomNav = memo(RiderBottomNavInner);
export default RiderBottomNav;
