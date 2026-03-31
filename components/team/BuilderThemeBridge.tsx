"use client";

import { useEffect } from "react";

import { useBuilderStore } from "@/lib/builderStore";

export function BuilderThemeBridge() {
  const theme = useBuilderStore((state) => state.run.preferences.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return null;
}
