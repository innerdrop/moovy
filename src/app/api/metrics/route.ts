import { NextResponse } from "next/server";
import { metricsRegister, httpRequestsTotal, httpRequestDuration } from "@/lib/metrics";

export async function GET() {
    const start = Date.now();
    try {
        // Track the metrics collection request itself
        httpRequestsTotal.inc({ method: "GET", route: "/api/metrics", status: "200" });

        const metrics = await metricsRegister.metrics();

        const duration = Date.now() - start;
        httpRequestDuration.observe({ method: "GET", route: "/api/metrics", status: "200" }, duration);

        return new NextResponse(metrics, {
            headers: {
                "Content-Type": metricsRegister.contentType,
            },
        });
    } catch (error) {
        console.error("Error collecting metrics:", error);
        return new NextResponse("Error collecting metrics", { status: 500 });
    }
}
