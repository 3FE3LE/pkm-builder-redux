"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

import { consumeNavigationTrace, isPerfDebugEnabled } from "@/lib/perf";

type LayoutShiftSource = {
  node?: Node;
  currentRect?: DOMRectReadOnly;
  previousRect?: DOMRectReadOnly;
};

type LayoutShiftEntry = PerformanceEntry & {
  value?: number;
  hadRecentInput?: boolean;
  sources?: LayoutShiftSource[];
};

function describeShiftNode(node: Node | undefined) {
  if (!(node instanceof Element)) {
    return null;
  }

  const className =
    typeof node.className === "string"
      ? node.className
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 4)
          .join(".")
      : "";

  return {
    tag: node.tagName.toLowerCase(),
    id: node.id || undefined,
    className: className || undefined,
    text: node.textContent?.trim().slice(0, 60) || undefined,
    rect: node.getBoundingClientRect
      ? {
          x: node.getBoundingClientRect().x,
          y: node.getBoundingClientRect().y,
          width: node.getBoundingClientRect().width,
          height: node.getBoundingClientRect().height,
        }
      : undefined,
  };
}

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

    if (typeof PerformanceObserver === "undefined") {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        if (entry.hadRecentInput || !entry.value) {
          continue;
        }

        console.info("[perf:layout-shift]", {
          route: routeKey,
          value: entry.value,
          sources: (entry.sources ?? []).map((source) => ({
            node: describeShiftNode(source.node),
            currentRect: source.currentRect
              ? {
                  x: source.currentRect.x,
                  y: source.currentRect.y,
                  width: source.currentRect.width,
                  height: source.currentRect.height,
                }
              : undefined,
            previousRect: source.previousRect
              ? {
                  x: source.previousRect.x,
                  y: source.previousRect.y,
                  width: source.previousRect.width,
                  height: source.previousRect.height,
                }
              : undefined,
          })),
        });
        console.info(
          "[perf:layout-shift:sources]",
          JSON.stringify(
            (entry.sources ?? []).map((source) => ({
              node: describeShiftNode(source.node),
              currentRect: source.currentRect
                ? {
                    x: source.currentRect.x,
                    y: source.currentRect.y,
                    width: source.currentRect.width,
                    height: source.currentRect.height,
                  }
                : undefined,
              previousRect: source.previousRect
                ? {
                    x: source.previousRect.x,
                    y: source.previousRect.y,
                    width: source.previousRect.width,
                    height: source.previousRect.height,
                  }
                : undefined,
            })),
          ),
        );
      }
    });

    observer.observe({
      type: "layout-shift",
      buffered: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [routeKey]);

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
