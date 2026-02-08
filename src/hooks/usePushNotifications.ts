"use client";

import { useState, useEffect, useCallback } from 'react';

interface PushNotificationState {
    isSupported: boolean;
    permission: NotificationPermission | 'unsupported';
    isSubscribed: boolean;
    loading: boolean;
    error: string | null;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [state, setState] = useState<PushNotificationState>({
        isSupported: false,
        permission: 'unsupported',
        isSubscribed: false,
        loading: true,
        error: null
    });

    // Check if push notifications are supported
    useEffect(() => {
        const checkSupport = async () => {
            const isSupported =
                'serviceWorker' in navigator &&
                'PushManager' in window &&
                'Notification' in window;

            if (!isSupported) {
                setState(prev => ({
                    ...prev,
                    isSupported: false,
                    permission: 'unsupported',
                    loading: false
                }));
                return;
            }

            // Check current permission
            const permission = Notification.permission;

            // Check if already subscribed
            let isSubscribed = false;
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                isSubscribed = subscription !== null;
            } catch (e) {
                console.error('[Push] Error checking subscription:', e);
            }

            setState({
                isSupported: true,
                permission,
                isSubscribed,
                loading: false,
                error: null
            });
        };

        checkSupport();
    }, []);

    // Register service worker
    const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            console.log('[Push] Service Worker registered:', registration.scope);
            return registration;
        } catch (error) {
            console.error('[Push] Service Worker registration failed:', error);
            setState(prev => ({ ...prev, error: 'Error al registrar Service Worker' }));
            return null;
        }
    }, []);

    // Subscribe to push notifications
    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!state.isSupported || !VAPID_PUBLIC_KEY) {
            console.error('[Push] Not supported or VAPID key missing');
            return false;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            // Register service worker if not already
            let registration = await navigator.serviceWorker.ready;
            if (!registration) {
                registration = await registerServiceWorker() as ServiceWorkerRegistration;
                if (!registration) return false;
            }

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            console.log('[Push] Subscription created:', subscription.endpoint);

            // Send subscription to server
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    p256dh: btoa(String.fromCharCode.apply(null,
                        Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
                    auth: btoa(String.fromCharCode.apply(null,
                        Array.from(new Uint8Array(subscription.getKey('auth')!))))
                })
            });

            if (!response.ok) {
                throw new Error('Error al guardar suscripción');
            }

            setState(prev => ({
                ...prev,
                isSubscribed: true,
                loading: false
            }));

            return true;
        } catch (error: any) {
            console.error('[Push] Subscribe error:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Error al suscribirse'
            }));
            return false;
        }
    }, [state.isSupported, registerServiceWorker]);

    // Request permission and subscribe
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!state.isSupported) {
            console.log('[Push] Not supported');
            return false;
        }

        setState(prev => ({ ...prev, loading: true }));

        try {
            // Register service worker first
            await registerServiceWorker();

            // Request permission
            const permission = await Notification.requestPermission();
            console.log('[Push] Permission result:', permission);

            setState(prev => ({ ...prev, permission }));

            if (permission === 'granted') {
                return await subscribe();
            }

            setState(prev => ({ ...prev, loading: false }));
            return false;
        } catch (error: any) {
            console.error('[Push] Permission error:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Error al solicitar permiso'
            }));
            return false;
        }
    }, [state.isSupported, registerServiceWorker, subscribe]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Notify server
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
            }

            setState(prev => ({ ...prev, isSubscribed: false }));
            return true;
        } catch (error) {
            console.error('[Push] Unsubscribe error:', error);
            return false;
        }
    }, []);

    return {
        ...state,
        requestPermission,
        subscribe,
        unsubscribe
    };
}
