import { register, collectDefaultMetrics, Counter, Histogram } from "prom-client";
import { NextResponse } from "next/server";

// Initialize metrics collection
collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
});

const httpRequestDuration = new Histogram({
    name: "http_request_duration_ms",
    help: "Duration of HTTP requests in ms",
    labelNames: ["method", "route", "status"],
    buckets: [50, 100, 200, 500, 1000, 2000, 5000],
});

export async function GET() {
    try {
        const metrics = await register.metrics();
        return new NextResponse(metrics, {
            headers: {
                "Content-Type": register.contentType,
            },
        });
    } catch (error) {
        console.error("Error collecting metrics:", error);
        return new NextResponse("Error collecting metrics", { status: 500 });
    }
}
