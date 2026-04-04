"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

import { consumeNavigationTrace, isPerfDebugEnabled } from "@/lib/perf";

export function PerfMonitor() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useReportWebVitals((metric) => {
    if (!isPerfDebugEnabled()) {
      return;
    }

    console.info("[perf:web-vitals]", {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
    });
  });

  useEffect(() => {
    if (!isPerfDebugEnabled()) {
      return;
    }

    const trace = consumeNavigationTrace();
    if (!trace) {
      console.info("[perf:route]", {
        route: routeKey,
        type: "route-settled",
      });
      return;
    }

    const duration = performance.now() - trace.startedAt;
    console.info("[perf:route]", {
      label: trace.label,
      href: trace.href,
      route: routeKey,
      duration,
    });
  }, [routeKey]);

  return null;
}
