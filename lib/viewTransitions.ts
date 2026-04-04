"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return () => {};
  }

  const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.addEventListener("visibilitychange", callback);
  coarsePointerQuery.addEventListener("change", callback);
  reducedMotionQuery.addEventListener("change", callback);

  return () => {
    document.removeEventListener("visibilitychange", callback);
    coarsePointerQuery.removeEventListener("change", callback);
    reducedMotionQuery.removeEventListener("change", callback);
  };
}

function getSnapshot() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return true;
  }

  return (
    document.visibilityState === "visible" &&
    !window.matchMedia("(pointer: coarse)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useSafeTransitionTypes(types?: string[]) {
  const shouldUseTransitions = useSyncExternalStore(subscribe, getSnapshot, () => true);
  return shouldUseTransitions ? types : undefined;
}
