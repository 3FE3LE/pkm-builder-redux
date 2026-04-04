"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  if (typeof document === "undefined") {
    return () => {};
  }

  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function getSnapshot() {
  if (typeof document === "undefined") {
    return true;
  }

  return document.visibilityState === "visible";
}

export function useSafeTransitionTypes(types?: string[]) {
  const shouldUseTransitions = useSyncExternalStore(subscribe, getSnapshot, () => true);
  return shouldUseTransitions ? types : undefined;
}
