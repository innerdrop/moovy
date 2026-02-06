"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function SupportNavBadge() {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/comercios/soporte/notificaciones");
            const data = await res.json();
            if (data.count !== undefined) {
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error("Error fetching support notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for real-time updates without WebSockets
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Link
            href="/comercios/soporte"
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition font-medium group"
        >
            <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 flex-shrink-0" />
                <span>Soporte</span>
            </div>

            {unreadCount > 0 && (
                <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-red-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-red-500/30 animate-pulse">
                    {unreadCount}
                </span>
            )}
        </Link>
    );
}

export function SupportNavBadgeMobile() {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/comercios/soporte/notificaciones");
            const data = await res.json();
            if (data.count !== undefined) {
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error("Error fetching support notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Link
            href="/comercios/soporte"
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-gray-400 hover:text-blue-600 active:text-blue-700 transition-colors relative"
        >
            <div className="relative">
                <MessageCircle className="w-6 h-6 mb-0.5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full border border-white">
                        {unreadCount}
                    </span>
                )}
            </div>
            <span className="text-[10px] font-medium leading-tight">
                Soporte
            </span>
        </Link>
    );
}
