// MOOVY Service Worker v5
// Handles: push notifications + smart caching + offline fallback + on-demand activation
//
// ESTRATEGIA DE CACHE:
// - Navegación (HTML): Network-first con fallback offline
// - Imágenes propias (/images/, /icons/): Stale-while-revalidate (sirve cache + actualiza en background)
// - Imágenes de productos (externas, uploads): Stale-while-revalidate con TTL de 1 hora
// - _next/static/*: Cache-first (archivos hasheados por Next.js, inmutables)
// - API, auth: Siempre network (nunca se cachean)
//
// VERSIONAMIENTO:
// El CACHE_VERSION se actualiza en cada deploy. El build script lo puede inyectar,
// o se cambia manualmente. Al activarse un nuevo SW, borra todos los caches anteriores.

var CACHE_VERSION = '5';
var CACHE_NAME = 'moovy-v' + CACHE_VERSION;
var OFFLINE_URL = '/offline.html';

// Resources to pre-cache on install (app shell minimal)
var PRECACHE_URLS = [
    OFFLINE_URL,
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/favicon.png',
];

// Max age for image cache entries (1 hour in ms)
var IMAGE_CACHE_MAX_AGE = 60 * 60 * 1000;

// Max entries in image cache (prevent unbounded growth)
var IMAGE_CACHE_MAX_ENTRIES = 200;

// ─── INSTALL ──────────────────────────────────────────────
self.addEventListener('install', function (event) {
    console.log('[SW] Installing Service Worker v' + CACHE_VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('[SW] Pre-caching app shell');
            return cache.addAll(PRECACHE_URLS);
        })
        // NO self.skipWaiting() automático — se activa bajo demanda
        // cuando el usuario hace click en "Actualizar" en el banner.
        // Ver el message listener 'SKIP_WAITING' más abajo.
    );
});

// ─── ACTIVATE ─────────────────────────────────────────────
self.addEventListener('activate', function (event) {
    console.log('[SW] Activating Service Worker v' + CACHE_VERSION);
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function (name) { return name !== CACHE_NAME; })
                    .map(function (name) {
                        console.log('[SW] Purging old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(function () {
            // Tomar control de las páginas abiertas inmediatamente
            // (solo se llega acá si el usuario pidió la actualización via SKIP_WAITING)
            return self.clients.claim();
        })
    );
});

// ─── MESSAGE HANDLER (on-demand skipWaiting) ──────────────
self.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] User requested update — activating new version');
        self.skipWaiting();
    }
});

// ─── FETCH ────────────────────────────────────────────────
self.addEventListener('fetch', function (event) {
    var request = event.request;

    // Only handle GET requests
    if (request.method !== 'GET') return;

    // Skip non-http(s) requests (chrome-extension://, etc.)
    if (!request.url.startsWith('http')) return;

    var url = new URL(request.url);

    // Skip API calls, auth routes, and HMR — always go to network
    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/auth/') ||
        url.pathname.startsWith('/_next/webpack-hmr')
    ) {
        return;
    }

    // ── Navigation requests: Network-first with offline fallback ──
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(function (response) {
                    if (response.ok) {
                        var responseClone = response.clone();
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(function () {
                    return caches.match(request).then(function (cached) {
                        return cached || caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    // ── Next.js static assets (_next/static/): Cache-first (hashed, immutable) ──
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

    // ── Cross-origin requests: pass-through al navegador ──
    // Si interceptamos imágenes de otros dominios (ej: Cloudflare R2 en pub-*.r2.dev),
    // el fetch del SW aplica políticas CORS que <img> no aplicaría, y si el servidor
    // no responde con Access-Control-Allow-Origin la imagen aparece rota en mobile.
    // Solución: no tocar requests cross-origin — que el browser los maneje directo.
    if (url.origin !== self.location.origin) {
        return;
    }

    // ── Images and fonts: Stale-while-revalidate ──
    // Sirve la versión cacheada de inmediato (rápido) pero busca
    // la versión nueva en background. En la próxima visita, el
    // usuario ve el contenido actualizado.
    var isImage = url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/fonts/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf)$/);

    if (isImage) {
        event.respondWith(
            caches.open(CACHE_NAME).then(function (cache) {
                return cache.match(request).then(function (cached) {
                    // Siempre lanzar fetch en background para actualizar
                    var fetchPromise = fetch(request).then(function (networkResponse) {
                        if (networkResponse.ok) {
                            cache.put(request, networkResponse.clone());
                            // Limpieza periódica del cache de imágenes
                            trimImageCache(cache);
                        }
                        return networkResponse;
                    }).catch(function () {
                        // Network failed — return cached or nothing
                        return cached;
                    });

                    // Devolver cached inmediatamente si existe, sino esperar network
                    return cached || fetchPromise;
                });
            })
        );
        return;
    }
});

// ─── Cache maintenance ───────────────────────────────────
// Evita que el cache crezca sin límite en dispositivos con poco storage
function trimImageCache(cache) {
    cache.keys().then(function (keys) {
        var imageKeys = keys.filter(function (req) {
            return req.url.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf)$/);
        });
        if (imageKeys.length > IMAGE_CACHE_MAX_ENTRIES) {
            // Borrar las más viejas (las primeras en el array)
            var toDelete = imageKeys.slice(0, imageKeys.length - IMAGE_CACHE_MAX_ENTRIES);
            toDelete.forEach(function (req) {
                cache.delete(req);
            });
            console.log('[SW] Trimmed ' + toDelete.length + ' old image cache entries');
        }
    });
}

// ─── PUSH NOTIFICATIONS ──────────────────────────────────
self.addEventListener('push', function (event) {
    console.log('[SW] Push notification received:', event);

    var data = { title: 'MOOVY', body: 'Nueva notificacion!' };

    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        console.error('[SW] Error parsing push data:', e);
    }

    var options = {
        body: data.body || 'Nueva oferta de entrega disponible!',
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
        self.registration.showNotification(data.title || 'MOOVY', options)
    );
});

// ─── NOTIFICATION CLICK ──────────────────────────────────
self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification clicked:', event.action);
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Validate URL from push notification data (prevent phishing redirects)
    var rawUrl = event.notification.data?.url || '/repartidor/dashboard';
    var urlToOpen = rawUrl;
    try {
        if (rawUrl.startsWith('/')) {
            urlToOpen = rawUrl;
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
