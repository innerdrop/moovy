import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
    stages: [
        { duration: '1m', target: 10 },   // Warm-up: 10 usuarios
        { duration: '3m', target: 50 },   // Rampa: 50 usuarios
        { duration: '5m', target: 100 },  // Pico: 100 usuarios
        { duration: '3m', target: 50 },   // Bajada gradual
        { duration: '1m', target: 0 },    // Cool-down
    ],
    thresholds: {
        'http_req_duration': ['p(95)<2000'], // 95% de requests < 2s
        'http_req_failed': ['rate<0.05'],    // < 5% de errores
        'errors': ['rate<0.1'],              // < 10% de errores personalizados
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Simular navegación de cliente
export default function () {
    const scenarios = [
        browseHomePage,
        searchMerchants,
        viewMerchantProducts,
        addToCart,
        checkout,
    ];

    // Ejecutar escenario aleatorio
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    scenario();

    sleep(Math.random() * 3 + 1); // 1-4 segundos entre acciones
}

function browseHomePage() {
    const res = http.get(`${BASE_URL}/`);
    const success = check(res, {
        'homepage status 200': (r) => r.status === 200,
        'homepage loads in <2s': (r) => r.timings.duration < 2000,
    });
    errorRate.add(!success);
}

function searchMerchants() {
    const res = http.get(`${BASE_URL}/api/merchants`);
    const success = check(res, {
        'merchants API status 200': (r) => r.status === 200,
        'merchants response valid JSON': (r) => {
            try {
                JSON.parse(r.body);
                return true;
            } catch {
                return false;
            }
        },
    });
    errorRate.add(!success);
}

function viewMerchantProducts() {
    // Primero obtener lista de comercios
    const merchantsRes = http.get(`${BASE_URL}/api/merchants`);
    if (merchantsRes.status !== 200) {
        errorRate.add(true);
        return;
    }

    const merchants = JSON.parse(merchantsRes.body);
    if (merchants.length === 0) {
        return;
    }

    // Seleccionar comercio aleatorio
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const res = http.get(`${BASE_URL}/tienda/${merchant.slug}`);

    const success = check(res, {
        'merchant page status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
}

function addToCart() {
    // Simular agregar producto al carrito
    const payload = JSON.stringify({
        productId: Math.floor(Math.random() * 10) + 1,
        quantity: Math.floor(Math.random() * 3) + 1,
    });

    const res = http.post(`${BASE_URL}/api/cart`, payload, {
        headers: { 'Content-Type': 'application/json' },
    });

    const success = check(res, {
        'add to cart status 2xx': (r) => r.status >= 200 && r.status < 300,
    });
    errorRate.add(!success);
}

function checkout() {
    const payload = JSON.stringify({
        deliveryAddress: 'Av. Maipú 1234, Ushuaia',
        paymentMethod: 'CASH',
        deliveryLat: -54.8019 + (Math.random() - 0.5) * 0.02,
        deliveryLng: -68.303 + (Math.random() - 0.5) * 0.02,
    });

    const res = http.post(`${BASE_URL}/api/orders`, payload, {
        headers: { 'Content-Type': 'application/json' },
    });

    const success = check(res, {
        'checkout status 2xx or 4xx': (r) => (r.status >= 200 && r.status < 300) || r.status === 400,
    });
    errorRate.add(!success);
}
