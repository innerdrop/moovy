import http from 'k6/http';
import { check, sleep } from 'k6';

// SPIKE TEST: Simula un pico repentino de tráfico
// Ejemplo: horario de almuerzo (12-14hs) con 10x tráfico normal

export const options = {
    stages: [
        { duration: '2m', target: 20 },    // Tráfico normal
        { duration: '30s', target: 200 },  // Spike repentino (almuerzo)
        { duration: '5m', target: 200 },   // Mantener pico
        { duration: '30s', target: 20 },   // Vuelta a normal
        { duration: '2m', target: 0 },     // Cool-down
    ],
    thresholds: {
        'http_req_duration': ['p(95)<3000'], // Más permisivo en spike
        'http_req_failed': ['rate<0.1'],     // Hasta 10% error aceptable
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
    // Simular hora pico: más búsquedas y pedidos
    const actions = [
        () => http.get(`${BASE_URL}/`),
        () => http.get(`${BASE_URL}/api/merchants`),
        () => http.get(`${BASE_URL}/tienda`),
        () => http.post(`${BASE_URL}/api/orders`, JSON.stringify({
            deliveryAddress: 'Test Address',
            paymentMethod: 'CASH',
            deliveryLat: -54.8019,
            deliveryLng: -68.303,
        }), {
            headers: { 'Content-Type': 'application/json' },
        }),
    ];

    // 3-5 acciones por usuario en hora pico
    const numActions = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < numActions; i++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const res = action();

        check(res, {
            'status 2xx or 4xx': (r) => (r.status >= 200 && r.status < 300) || (r.status >= 400 && r.status < 500),
        });

        sleep(Math.random() * 2); // Menos tiempo entre acciones en hora pico
    }
}
