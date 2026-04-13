"use client";

import { useSyncExternalStore } from "react";

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => unknown;
};

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

export function startViewTransition(update: () => void) {
  if (typeof document === "undefined") {
    update();
    return;
  }

  const supportedDocument = document as DocumentWithViewTransition;
  if (typeof supportedDocument.startViewTransition !== "function") {
    update();
    return;
  }

  supportedDocument.startViewTransition(() => {
    update();
  });
}
