"use client";

import type { ReactNode } from "react";

import { useBuilderStore } from "@/lib/builderStore";

export function BuilderThemeShell({ children }: { children: ReactNode }) {
  const theme = useBuilderStore((state) => state.run.preferences.theme);

  return (
    <div className={theme} style={{ colorScheme: theme }}>
      {children}
    </div>
  );
}
