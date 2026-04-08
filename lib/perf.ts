"use client";

const NAVIGATION_TRACE_KEY = "pkm-builder-redux:nav-trace";

type NavigationTrace = {
  href: string;
  label: string;
  startedAt: number;
};

function canUseBrowserPerf() {
  return typeof window !== "undefined" && typeof performance !== "undefined";
}

export function isPerfDebugEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return true;
}

export function markNavigationStart(label: string, href: string) {
  if (!canUseBrowserPerf()) {
    return;
  }

  const trace: NavigationTrace = {
    href,
    label,
    startedAt: performance.now(),
  };

  window.sessionStorage.setItem(NAVIGATION_TRACE_KEY, JSON.stringify(trace));
}

export function consumeNavigationTrace() {
  if (!canUseBrowserPerf()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(NAVIGATION_TRACE_KEY);
  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(NAVIGATION_TRACE_KEY);

  try {
    return JSON.parse(raw) as NavigationTrace;
  } catch {
    return null;
  }
}
