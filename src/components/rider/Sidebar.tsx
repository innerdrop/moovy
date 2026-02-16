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
                className={`fixed inset-y-0 left-0 z-50 w-[320px] max-w-[85vw] bg-gradient-to-b from-[#e60012] to-[#b8000e] shadow-2xl rounded-r-[24px] transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Texture Effect */}
                <div className="absolute top-0 left-0 right-0 h-[200px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none" />
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white transition-all group z-20"
                >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>

                {/* User Section */}
                <div className="pt-10 px-6 pb-8 relative z-10 flex flex-col items-start text-left">
                    <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-[20px] text-[10px] font-bold text-white uppercase tracking-[0.5px] mb-4 shadow-sm border border-white/10">
                        Repartidor
                    </span>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-[18px] flex items-center justify-center shadow-lg relative">
                            <User className="w-8 h-8 text-[#e60012]" />
                            <div className="w-3.5 h-3.5 bg-[#00ff88] border-[2px] border-[#e60012] rounded-full absolute -bottom-1 -right-1 shadow-sm" />
                        </div>
                        <div className="text-white text-2xl font-bold tracking-tight leading-none">
                            {userName || "Moover"}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto flex-1 relative z-10">
                    {menuItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                            <button
                                key={item.label}
                                onClick={() => {
                                    onNavigate(item.view);
                                    onClose();
                                }}
                                className={`w-full flex items-center gap-4 px-4 py-4 my-1 rounded-[14px] transition-all duration-300 relative overflow-hidden group text-left ${isActive
                                    ? "bg-white/20 backdrop-blur-md font-semibold text-white shadow-sm"
                                    : "text-white hover:bg-white/10 font-medium"
                                    }`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-md shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                )}

                                <div className="relative z-10 w-6 h-6 flex items-center justify-center">
                                    <item.icon
                                        className={`w-[22px] h-[22px] stroke-[2] transition-transform duration-200 text-white ${isActive ? "" : "group-hover:scale-110"
                                            }`}
                                    />
                                </div>
                                <span className="relative z-10 text-[15px] tracking-tight transition-colors duration-200">
                                    {item.label}
                                </span>

                                {/* Notification Badge */}
                                {notificationCounts[item.view] > 0 && (
                                    <span className="ml-auto bg-white text-[#e60012] text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center animate-in zoom-in duration-300 shadow-sm">
                                        {notificationCounts[item.view]}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Section */}
                <div className="p-6 mt-auto border-t border-white/10 relative z-10">
                    <button
                        onClick={() => {
                            onClose();
                            signOut();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-black/20 text-white hover:bg-black/30 hover:translate-x-1 transition-all duration-300 group font-semibold text-[15px]"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 text-white stroke-[2]" />
                        <span>Cerrar Sesión</span>
                    </button>
                    <p className="text-center text-[10px] text-white/40 mt-4 font-mono uppercase tracking-widest">
                        v2.4.0 • Moovy Driver
                    </p>
                </div>
            </div>
        </>
    );
}
