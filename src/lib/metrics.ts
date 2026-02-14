import { register, collectDefaultMetrics, Counter, Histogram } from "prom-client";

// In development, Next.js clears the cache on HMR. We use global to persist metrics.
const g = global as any;

if (!g._prometheus_metrics_initialized) {
    collectDefaultMetrics({ register });
    g._prometheus_metrics_initialized = true;
}

// Define metrics and check if they already exist to avoid "metric already registered" errors
export const httpRequestsTotal = (g._http_requests_total || new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
    registers: [register],
}));
g._http_requests_total = httpRequestsTotal;

export const httpRequestDuration = (g._http_request_duration_ms || new Histogram({
    name: "http_request_duration_ms",
    help: "Duration of HTTP requests in ms",
    labelNames: ["method", "route", "status"],
    buckets: [50, 100, 200, 500, 1000, 2000, 5000],
    registers: [register],
}));
g._http_request_duration_ms = httpRequestDuration;

export const metricsRegister = register;
