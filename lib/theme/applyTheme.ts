import type { BuilderTheme } from "@/lib/runState";

export function resolveAppliedTheme(
  theme: BuilderTheme,
  hour24 = new Date().getHours(),
) {
  if (theme === "auto") {
    return hour24 >= 6 && hour24 < 18 ? "light" : "dark";
  }

  return theme;
}

export function applyTheme(theme: BuilderTheme, hour24?: number) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const appliedTheme = resolveAppliedTheme(theme, hour24);
  root.classList.remove("light", "dark");
  root.classList.add(appliedTheme);
}
