"use client";

import { Info } from "lucide-react";

export function InfoHint({ text }: { text?: string | null }) {
  if (!text) {
    return null;
  }

  return (
    <span className="group relative inline-flex">
      <span className="icon-surface h-5 w-5 text-muted">
        <Info className="h-3 w-3" />
      </span>
      <span className="status-popover tooltip-card tooltip-offset-below pointer-events-none absolute left-1/2 z-20 hidden w-72 -translate-x-1/2 group-hover:block">
        {text}
      </span>
    </span>
  );
}
