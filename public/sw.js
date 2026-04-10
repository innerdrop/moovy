// MOOVY Service Worker v2
// Handles: push notifications + offline caching + offline fallback

const CACHE_NAME = 'moovy-cache-v1';
const OFFLINE_URL = '/offline.html';

// Resources to pre-cache on install (app shell)
const PRECACHE_URLS = [
    OFFLINE_URL,
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/favicon.png',
];

// ─── INSTALL ──────────────────────────────────────────────
self.addEventListener('install', function (event) {
    console.log('[SW] Installing Service Worker v2');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('[SW] Pre-caching app shell');
            return cache.addAll(PRECACHE_URLS);
        }).then(function () {
            self.skipWaiting(); // Activate immediately
        })
    );
});

// ─── ACTIVATE ─────────────────────────────────────────────
self.addEventListener('activate', function (event) {
    console.log('[SW] Activating Service Worker v2');
    event.waitUntil(
        // Clean up old caches
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function (name) { return name !== CACHE_NAME; })
                    .map(function (name) {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(function () {
            return clients.claim(); // Take control of all pages
        })
    );
});

// ─── FETCH ────────────────────────────────────────────────
self.addEventListener('fetch', function (event) {
    const request = event.request;

    // Only handle GET requests
    if (request.method !== 'GET') return;

    // Skip non-http(s) requests (chrome-extension://, etc.)
    if (!request.url.startsWith('http')) return;

    // Skip API calls and auth routes — always go to network
    const url = new URL(request.url);
    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/auth/') ||
        url.pathname.startsWith('/_next/webpack-hmr')
    ) {
        return;
    }

    // Navigation requests: Network-first with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(function (response) {
                    // Cache successful navigation responses
                    if (response.ok) {
                        var responseClone = response.clone();
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(function () {
                    // Try cache first, then offline fallback
                    return caches.match(request).then(function (cached) {
                        return cached || caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    // Static assets: Cache-first strategy
    if (
        url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/fonts/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf)$/)
    ) {
        event.respondWith(
            caches.match(request).then(function (cached) {
                if (cached) return cached;
                return fetch(request).then(function (response) {
                    if (response.ok) {
                        var responseClone = response.clone();
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Next.js static assets (_next/static): Cache-first (immutable, hashed)
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(
            caches.match(request).then(function (cached) {
                if (cached) return cached;
                return fetch(request).then(function (response) {
                    if (response.ok) {
                        var responseClone = response.clone();
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }
});

// ─── PUSH NOTIFICATIONS ──────────────────────────────────
self.addEventListener('push', function (event) {
    console.log('[SW] Push notification received:', event);

    var data = { title: 'MOOVY', body: '¡Nueva notificación!' };

    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        console.error('[SW] Error parsing push data:', e);
    }

    var options = {
        body: data.body || '¡Nueva oferta de entrega disponible!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: data.tag || 'moovy-notification',
        requireInteraction: true,
        renotify: true,
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

// ─── NOTIFICATION CLICK ──────────────────────────────────
self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification clicked:', event.action);
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // V-SW FIX: Validate URL from push notification data (prevent phishing redirects)
    var rawUrl = event.notification.data?.url || '/repartidor/dashboard';
    var urlToOpen = rawUrl;
    try {
        // Only allow same-origin URLs or relative paths
        if (rawUrl.startsWith('/')) {
            urlToOpen = rawUrl; // Relative path — safe
        } else {
            var parsed = new URL(rawUrl);
            var allowed = [self.location.hostname, 'somosmoovy.com', 'www.somosmoovy.com'];
            if (!allowed.includes(parsed.hostname)) {
                console.warn('[SW] Blocked redirect to untrusted URL:', rawUrl);
                urlToOpen = '/';
            }
        }
    } catch (e) {
        urlToOpen = '/';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Try to find any existing app window to reuse
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if ('focus' in client) {
                    client.focus();
                    client.navigate(urlToOpen);
                    return;
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// ─── NOTIFICATION CLOSE ──────────────────────────────────
self.addEventListener('notificationclose', function (event) {
    console.log('[SW] Notification closed');
});
