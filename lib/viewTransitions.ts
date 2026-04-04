"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return () => {};
  }

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.addEventListener("visibilitychange", callback);
  reducedMotionQuery.addEventListener("change", callback);

  return () => {
    document.removeEventListener("visibilitychange", callback);
    reducedMotionQuery.removeEventListener("change", callback);
  };
}

function getSnapshot() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return true;
  }

  return (
    document.visibilityState === "visible" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useSafeTransitionTypes(types?: string[]) {
  const shouldUseTransitions = useSyncExternalStore(subscribe, getSnapshot, () => true);
  return shouldUseTransitions ? types : undefined;
}
