import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

// Custom metrics
const wsConnectionErrors = new Rate('ws_connection_errors');
const locationUpdatesSent = new Counter('location_updates_sent');

export const options = {
    vus: 20, // 20 repartidores simultáneos
    duration: '10m',
    thresholds: {
        'ws_connection_errors': ['rate<0.05'], // < 5% error en conexiones
        'ws_session_duration': ['p(95)<300000'], // Sesiones estables > 5min
    },
};

const SOCKET_URL = __ENV.SOCKET_URL || 'ws://localhost:3001';

export default function () {
    const riderId = `rider-${__VU}`; // Virtual User ID como rider ID
    const url = `${SOCKET_URL}?riderId=${riderId}`;

    const res = ws.connect(url, {}, function (socket) {
        socket.on('open', () => {
            console.log(`Rider ${riderId} connected`);

            // Simular ubicación inicial
            socket.send(JSON.stringify({
                type: 'RIDER_LOCATION',
                riderId: riderId,
                lat: -54.8019 + (Math.random() - 0.5) * 0.02,
                lng: -68.303 + (Math.random() - 0.5) * 0.02,
                heading: Math.random() * 360,
                speed: Math.random() * 40, // 0-40 km/h
                timestamp: Date.now(),
            }));

            // Actualizar ubicación cada 5 segundos
            socket.setInterval(() => {
                const lat = -54.8019 + (Math.random() - 0.5) * 0.02;
                const lng = -68.303 + (Math.random() - 0.5) * 0.02;
                const heading = Math.random() * 360;
                const speed = Math.random() * 40;

                socket.send(JSON.stringify({
                    type: 'RIDER_LOCATION',
                    riderId: riderId,
                    lat: lat,
                    lng: lng,
                    heading: heading,
                    speed: speed,
                    timestamp: Date.now(),
                }));

                locationUpdatesSent.add(1);
            }, 5000);
        });

        socket.on('message', (data) => {
            const message = JSON.parse(data);

            // Simular respuestas a pedidos asignados
            if (message.type === 'ORDER_ASSIGNED') {
                console.log(`Rider ${riderId} received order ${message.orderId}`);

                // 80% aceptan, 20% rechazan
                const accept = Math.random() > 0.2;

                sleep(Math.random() * 3 + 1); // 1-4s pensando

                socket.send(JSON.stringify({
                    type: accept ? 'ACCEPT_ORDER' : 'REJECT_ORDER',
                    orderId: message.orderId,
                    riderId: riderId,
                    timestamp: Date.now(),
                }));
            }

            // Simular llegada al comercio
            if (message.type === 'NAVIGATE_TO_MERCHANT') {
                sleep(Math.random() * 30 + 30); // 30-60s para llegar

                socket.send(JSON.stringify({
                    type: 'ARRIVED_AT_MERCHANT',
                    orderId: message.orderId,
                    riderId: riderId,
                    timestamp: Date.now(),
                }));
            }

            // Simular pickup
            if (message.type === 'PICKUP_READY') {
                sleep(Math.random() * 10 + 5); // 5-15s para recoger

                socket.send(JSON.stringify({
                    type: 'ORDER_PICKED_UP',
                    orderId: message.orderId,
                    riderId: riderId,
                    timestamp: Date.now(),
                }));
            }
        });

        socket.on('error', (e) => {
            console.error(`Rider ${riderId} WebSocket error:`, e);
            wsConnectionErrors.add(1);
        });

        socket.on('close', () => {
            console.log(`Rider ${riderId} disconnected`);
        });

        // Mantener conexión viva durante 10 minutos
        socket.setTimeout(() => {
            socket.close();
        }, 600000); // 10 min
    });

    const success = check(res, {
        'WebSocket connection successful': (r) => r && r.status === 101,
    });

    if (!success) {
        wsConnectionErrors.add(1);
    }
}
