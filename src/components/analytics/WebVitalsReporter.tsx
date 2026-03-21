"use client";

import { useEffect } from "react";
import type { Metric } from "web-vitals";

export default function WebVitalsReporter() {
  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import("web-vitals").then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      const reportMetric = (metric: Metric) => {
        // Log to console in dev
        if (process.env.NODE_ENV !== "production") {
          const color =
            metric.rating === "good"
              ? "green"
              : metric.rating === "needs-improvement"
                ? "orange"
                : "red";
          console.log(
            `%c[WebVitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
            `color: ${color}; font-weight: bold`
          );
        }

        // Send to analytics API in production
        if (process.env.NODE_ENV === "production") {
          // Use sendBeacon for reliability (doesn't block page unload)
          const body = JSON.stringify({
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            id: metric.id,
            url: window.location.pathname,
            timestamp: Date.now(),
          });

          if (navigator.sendBeacon) {
            navigator.sendBeacon("/api/analytics/vitals", body);
          } else {
            fetch("/api/analytics/vitals", {
              method: "POST",
              body,
              headers: { "Content-Type": "application/json" },
              keepalive: true,
            }).catch(() => {
              // Silently fail - don't block user experience
            });
          }
        }
      };

      onCLS(reportMetric);
      onFCP(reportMetric);
      onINP(reportMetric);
      onLCP(reportMetric);
      onTTFB(reportMetric);
    });
  }, []);

  return null; // This component doesn't render anything
}
