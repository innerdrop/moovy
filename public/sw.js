// MOOVY Push Notification Service Worker
// Handles push notifications even when browser is in background

self.addEventListener('push', function (event) {
    console.log('[SW] Push notification received:', event);

    let data = { title: 'MOOVY', body: '¡Nueva notificación!' };

    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        console.error('[SW] Error parsing push data:', e);
    }

    const options = {
        body: data.body || '¡Nueva oferta de entrega disponible!',
        icon: '/icons/moovy-icon-192.png',
        badge: '/icons/moovy-badge-72.png',
        vibrate: [200, 100, 200, 100, 200], // Pattern: vibrate, pause, vibrate...
        tag: data.tag || 'moovy-notification',
        requireInteraction: true, // Keep notification until user interacts
        renotify: true, // Notify even if same tag exists
        data: {
            url: data.url || '/repartidor/dashboard',
            orderId: data.orderId,
            timestamp: Date.now()
        },
        actions: data.actions || [
            { action: 'view', title: 'Ver oferta' },
            { action: 'dismiss', title: 'Ignorar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || '🚀 MOOVY', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification clicked:', event.action);
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/repartidor/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Check if there's already a window/tab with the app
            for (const client of clientList) {
                if (client.url.includes('/repartidor') && 'focus' in client) {
                    client.focus();
                    client.navigate(urlToOpen);
                    return;
                }
            }
            // If no existing window, open new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', function (event) {
    console.log('[SW] Notification closed');
});

// Service Worker install
self.addEventListener('install', function (event) {
    console.log('[SW] Service Worker installed');
    self.skipWaiting(); // Activate immediately
});

// Service Worker activate
self.addEventListener('activate', function (event) {
    console.log('[SW] Service Worker activated');
    event.waitUntil(clients.claim()); // Take control of all pages
});
