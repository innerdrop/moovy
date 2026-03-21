import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store for vitals (in production, use a database or external service)
const vitalsStore: Array<{
  name: string;
  value: number;
  rating: string;
  url: string;
  timestamp: number;
}> = [];

// Rate limiting: simple in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // Max 100 requests per minute per IP

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || typeof data.value !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: name, value" },
        { status: 400 }
      );
    }

    // Store the vital metric
    const vitalRecord = {
      name: data.name,
      value: data.value,
      rating: data.rating || "unknown",
      url: data.url || "unknown",
      timestamp: data.timestamp || Date.now(),
    };

    vitalsStore.push(vitalRecord);

    // Keep only last 1000 metrics in memory
    if (vitalsStore.length > 1000) {
      vitalsStore.shift();
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[WebVitals]", vitalRecord);
    }

    // TODO: In production, send to:
    // - External analytics service (e.g., DataDog, Sentry, Vercel Analytics)
    // - Or database for historical tracking
    // - Or structured logging service

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[WebVitals Error]", error);
    return NextResponse.json(
      { error: "Failed to process vitals" },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve stored vitals (for debugging/admin only)
export async function GET(request: NextRequest) {
  // In production, add authentication check here
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    // Calculate simple statistics
    const metrics = vitalsStore.reduce(
      (acc, vital) => {
        if (!acc[vital.name]) {
          acc[vital.name] = {
            values: [],
            ratings: { good: 0, "needs-improvement": 0, poor: 0 },
          };
        }
        acc[vital.name].values.push(vital.value);
        const ratingKey = vital.rating as "good" | "needs-improvement" | "poor";
        acc[vital.name].ratings[ratingKey]++;
        return acc;
      },
      {} as Record<
        string,
        {
          values: number[];
          ratings: { good: number; "needs-improvement": number; poor: number };
        }
      >
    );

    const stats = Object.entries(metrics).reduce(
      (acc, [name, data]) => {
        const sorted = [...data.values].sort((a, b) => a - b);
        acc[name] = {
          count: data.values.length,
          average: data.values.reduce((a, b) => a + b, 0) / data.values.length,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p75: sorted[Math.floor(sorted.length * 0.75)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          ratings: data.ratings,
        };
        return acc;
      },
      {} as Record<
        string,
        {
          count: number;
          average: number;
          min: number;
          max: number;
          p50: number;
          p75: number;
          p95: number;
          ratings: { good: number; "needs-improvement": number; poor: number };
        }
      >
    );

    return NextResponse.json({ stats, totalRecords: vitalsStore.length });
  } catch (error) {
    console.error("[WebVitals Stats Error]", error);
    return NextResponse.json(
      { error: "Failed to retrieve stats" },
      { status: 500 }
    );
  }
}
