"use client";

import { Info } from "lucide-react";

export function InfoHint({ text }: { text?: string | null }) {
  if (!text) {
    return null;
  }

  return (
    <span className="group relative inline-flex">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg border border-line bg-surface-4 text-muted">
        <Info className="h-3 w-3" />
      </span>
      <span className="status-popover tooltip-card pointer-events-none absolute left-1/2 top-[calc(100%+0.5rem)] z-20 hidden w-72 -translate-x-1/2 group-hover:block">
        {text}
      </span>
    </span>
  );
}
