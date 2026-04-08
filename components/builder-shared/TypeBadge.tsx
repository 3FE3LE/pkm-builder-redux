"use client";

import { type ReactNode } from "react";
import clsx from "clsx";

import { getTypeSurfaceStyle } from "@/lib/domain/typeChart";

export function TypeBadge({
  type,
  trailing,
  emphasis = "normal",
  size,
  className,
}: {
  type: string;
  trailing?: ReactNode;
  emphasis?: "normal" | "danger" | "positive";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      style={getTypeSurfaceStyle(type, "var(--line)")}
      className={clsx(
        typeBadgeClass(type, size),
        className,
        emphasis === "danger" && "danger-glow-badge",
        emphasis === "positive" && "positive-glow-badge",
      )}
    >
      <span>{type}</span>
      {trailing ? <span className="micro-label opacity-90">{trailing}</span> : null}
    </span>
  );
}

function typeBadgeClass(_type: string, size?: "sm" | "md" | "lg") {
  const base =
    "type-badge-surface pixel-face inline-flex items-center justify-center rounded-[0.55rem_0.35rem_0.55rem_0.35rem] border border-white/12 text-center leading-none font-normal";

  if (size === "sm") {
    return `${base} min-w-[3.5rem] gap-1 px-1.5 py-0.5 text-[10px] tracking-[0.05em]`;
  }

  if (size === "md") {
    return `${base} min-w-[4.75rem] gap-1 px-1.5 py-1 text-[12px] tracking-[0.06em]`;
  }

  if (size === "lg") {
    return `${base} min-w-[8.5rem] gap-2 px-3 py-1 text-[16px] tracking-[0.12em]`;
  }

  return `${base} w-[4.75rem] gap-1 px-1.5 py-1 text-[12px] tracking-[0.06em] sm:w-[5.75rem] sm:px-2 sm:text-[13px] md:w-[6.75rem] md:px-2.5 md:text-[14px] lg:w-[8.5rem] lg:gap-2 lg:px-3 lg:py-1.5 lg:text-[16px] lg:tracking-[0.12em]`;
}
