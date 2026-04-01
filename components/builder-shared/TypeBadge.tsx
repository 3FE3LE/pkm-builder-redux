"use client";

import { type ReactNode } from "react";
import clsx from "clsx";

import { getTypeSurfaceStyle } from "@/lib/domain/typeChart";

export function TypeBadge({
  type,
  trailing,
  emphasis = "normal",
  className,
}: {
  type: string;
  trailing?: ReactNode;
  emphasis?: "normal" | "danger" | "positive";
  className?: string;
}) {
  return (
    <span
      style={getTypeSurfaceStyle(type, "var(--line)")}
      className={clsx(
        typeBadgeClass(type),
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

function typeBadgeClass(_type: string) {
  return "type-badge-surface pixel-face inline-flex w-[4.75rem] items-center justify-center gap-1 rounded-[0.55rem_0.35rem_0.55rem_0.35rem] border border-white/12 px-1.5 py-1 text-center text-[12px] leading-none tracking-[0.06em] font-normal sm:w-[5.75rem] sm:px-2 sm:text-[13px] md:w-[6.75rem] md:px-2.5 md:text-[14px] lg:w-[8.5rem] lg:gap-2 lg:px-3 lg:py-1.5 lg:text-[16px] lg:tracking-[0.12em]";
}
