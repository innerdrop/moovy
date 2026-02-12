"use client";

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff, X, CheckCircle2, AlertCircle } from 'lucide-react';

export function PushNotificationManager() {
    const {
        isSupported,
        permission,
        isSubscribed,
        loading,
        error,
        requestPermission,
        unsubscribe
    } = usePushNotifications();

    const [showBanner, setShowBanner] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Show banner if supported but not subscribed and not denied
        if (isSupported && !isSubscribed && permission !== 'denied' && !dismissed) {
            const timer = setTimeout(() => setShowBanner(true), 2000);
            return () => clearTimeout(timer);
        } else {
            setShowBanner(false);
        }
    }, [isSupported, isSubscribed, permission, dismissed]);

    if (!isSupported || dismissed) return null;

    const handleRequest = async () => {
        const success = await requestPermission();
        if (success) {
            // Give user feedback before hiding
            setTimeout(() => setShowBanner(false), 2000);
        }
    };

    if (!showBanner && !isSubscribed) return null;

    // Mini indicator if subscribed
    if (isSubscribed) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Notificaciones activas</span>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-lg border border-blue-500/30 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Bell className="w-5 h-5 text-white animate-bounce" />
                </div>

                <div className="flex-1">
                    <h3 className="font-bold text-sm mb-0.5">Activar Notificaciones</h3>
                    <p className="text-xs text-blue-100 leading-relaxed">
                        Recibe alertas instantáneas de nuevos pedidos, incluso con el navegador cerrado.
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                        <button
                            onClick={handleRequest}
                            disabled={loading}
                            className="bg-white text-blue-700 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-50 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Activando...' : 'Activar Ahora'}
                        </button>
                        <button
                            onClick={() => setDismissed(true)}
                            className="text-xs text-blue-200 hover:text-white transition-colors"
                        >
                            Quizás más tarde
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setDismissed(true)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-blue-200" />
                </button>
            </div>

            {error && (
                <div className="mt-3 flex items-center gap-2 text-[10px] bg-red-500/20 p-2 rounded-lg border border-red-500/30">
                    <AlertCircle className="w-3 h-3 text-red-200" />
                    <span className="text-red-100">{error}</span>
                </div>
            )}

            {/* Background decoration */}
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
        </div>
    );
}
