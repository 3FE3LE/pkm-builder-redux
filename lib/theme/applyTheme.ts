import type { BuilderTheme } from "@/lib/runState";

export function applyTheme(theme: BuilderTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}
