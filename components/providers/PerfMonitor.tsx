"use client";

import { useReportWebVitals } from "next/web-vitals";

import { isPerfDebugEnabled } from "@/lib/perf";

export function PerfMonitor() {
  useReportWebVitals((metric) => {
    if (!isPerfDebugEnabled()) {
      return;
    }

    if (metric.name !== "TTFB" && metric.name !== "LCP") {
      return;
    }

    console.info("[perf:web-vitals]", {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
    });
  });

  return null;
}
