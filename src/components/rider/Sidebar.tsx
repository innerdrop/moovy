"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Bike,
    History,
    DollarSign,
    HelpCircle,
    User,
    Settings,
    LogOut,
    X,
    ChevronRight,
    MapPin,
    Package
} from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    userName?: string;
    onNavigate: (view: string) => void;
    notificationCounts?: { [key: string]: number };
    signOut: () => Promise<void> | void;
}

export default function Sidebar({ isOpen, onClose, userName, signOut, onNavigate, notificationCounts = {} }: SidebarProps) {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const menuItems = [
        { icon: Bike, label: "Dashboard", href: "/repartidor/dashboard", view: "dashboard" },
        { icon: History, label: "Historial", href: "#", view: "history" },
        { icon: DollarSign, label: "Mis ganancias", href: "#", view: "earnings" },
        { icon: HelpCircle, label: "Soporte", href: "#", view: "support" },
        { icon: User, label: "Mi Perfil", href: "#", view: "profile" },
        { icon: Settings, label: "Configuración", href: "#", view: "settings" }
    ];

    if (!isMounted) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-[320px] max-w-[85vw] bg-[#0a0e1a] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-r border-white/5 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 left-6 w-9 h-9 flex items-center justify-center bg-[#12182b] border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a2139] hover:border-gray-500 transition-all group z-10"
                >
                    <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                </button>

                {/* User Section */}
                <div className="pt-20 px-7 pb-8 bg-gradient-to-b from-[#12182b] to-[#0a0e1a] border-b border-white/5 relative overflow-hidden">
                    {/* Glow Effect */}
                    <div className="absolute top-0 left-0 right-0 h-[120px] bg-[radial-gradient(ellipse_at_center_top,rgba(230,0,18,0.15),transparent)] pointer-events-none" />

                    <div className="flex items-center gap-4 relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e60012] to-[#ff1a2e] flex items-center justify-center shadow-[0_8px_24px_rgba(230,0,18,0.3)] relative group cursor-default">
                            <div className="absolute inset-[-2px] bg-gradient-to-br from-[#e60012] to-[#ff1a2e] rounded-[18px] opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10" />
                            <User className="w-7 h-7 text-white" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#10b981] border-[3px] border-[#0a0e1a] rounded-full shadow-[0_0_0_2px_rgba(16,185,129,0.2)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-[#e60012] uppercase tracking-[1px] mb-1 font-mono">Repartidor</p>
                            <h3 className="text-xl font-semibold text-[#e8eaf0] tracking-tight truncate leading-none font-sans">
                                {userName || "Moover"}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-3 py-4 space-y-1">
                    {menuItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                            <button
                                key={item.label}
                                onClick={() => {
                                    onNavigate(item.view);
                                    onClose();
                                }}
                                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden text-left ${isActive
                                    ? "text-[#e60012]"
                                    : "text-[#9ca3b8] hover:text-[#e8eaf0] hover:bg-[#1a2139]"
                                    }`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Active Background Glow */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-[rgba(230,0,18,0.15)] to-[rgba(230,0,18,0.02)] -z-10" />
                                )}

                                <item.icon
                                    className={`w-5 h-5 transition-all duration-200 flex-shrink-0 ${isActive ? "text-[#e60012]" : "text-[#9ca3b8] group-hover:text-[#e8eaf0] group-hover:scale-110"
                                        }`}
                                />
                                <span className={`text-[15px] tracking-tight transition-colors duration-200 font-sans ${isActive ? "font-semibold" : "font-medium"
                                    }`}>
                                    {item.label}
                                </span>

                                {/* Notification Badge */}
                                {notificationCounts[item.view] > 0 && (
                                    <span className="ml-auto bg-[#e60012] text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center animate-in zoom-in duration-300">
                                        {notificationCounts[item.view]}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Section */}
                <div className="p-3 pt-6 mt-auto border-t border-white/5 absolute bottom-0 left-0 right-0 bg-[#0a0e1a]">
                    <button
                        onClick={() => {
                            onClose();
                            signOut();
                        }}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-[rgba(230,0,18,0.08)] border border-[rgba(230,0,18,0.1)] text-[#e60012] hover:bg-[rgba(230,0,18,0.15)] hover:border-[rgba(230,0,18,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                        <span className="text-[15px] font-semibold tracking-tight font-sans">Cerrar Sesión</span>
                    </button>
                    <p className="text-center text-[10px] text-gray-600 mt-4 font-mono uppercase tracking-widest opacity-40">
                        v2.4.0 • Moovy Driver
                    </p>
                </div>
            </div>
        </>
    );
}
