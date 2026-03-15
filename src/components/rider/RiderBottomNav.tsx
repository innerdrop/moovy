"use client";

import React, { memo } from "react";
import { Home, Wallet, History, HeadphonesIcon, User } from "lucide-react";
import { useColorScheme } from "@/hooks/useColorScheme";

type TabId = "dashboard" | "earnings" | "history" | "support" | "profile";

interface RiderBottomNavProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    unreadSupport?: number;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Inicio", icon: Home },
    { id: "earnings", label: "Ganancias", icon: Wallet },
    { id: "history", label: "Historial", icon: History },
    { id: "support", label: "Soporte", icon: HeadphonesIcon },
    { id: "profile", label: "Perfil", icon: User },
];

function RiderBottomNavInner({ activeTab, onTabChange, unreadSupport = 0 }: RiderBottomNavProps) {
    const isDark = useColorScheme() === "dark";
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
                    background: isDark ? "rgba(22, 24, 32, 0.92)" : "rgba(255, 255, 255, 0.92)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
                    boxShadow: isDark ? "0 -4px 24px rgba(0, 0, 0, 0.3)" : "0 -4px 24px rgba(0, 0, 0, 0.06)",
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
                                    className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 relative ${isActive
                                        ? "scale-110"
                                        : "group-active:scale-90"
                                        }`}
                                >
                                    <Icon
                                        className={`w-[22px] h-[22px] transition-colors duration-300 ${isActive
                                            ? "text-[#e60012]"
                                            : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                                            }`}
                                        strokeWidth={isActive ? 2.5 : 1.8}
                                    />
                                    {tab.id === "support" && unreadSupport > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#e60012] rounded-full text-[8px] text-white font-bold flex items-center justify-center animate-bounce shadow-lg shadow-red-500/30">
                                            {unreadSupport > 9 ? "9+" : unreadSupport}
                                        </span>
                                    )}
                                </div>

                                <span
                                    className={`text-[10px] mt-0.5 font-semibold tracking-wide transition-colors duration-300 ${isActive
                                        ? "text-[#e60012]"
                                        : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
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
