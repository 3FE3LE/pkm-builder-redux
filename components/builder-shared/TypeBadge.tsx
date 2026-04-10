"use client";

import { type ReactNode } from "react";
import clsx from "clsx";

import { getTypeSurfaceStyle } from "@/lib/domain/typeChart";

const typeBadgeBaseClassName = "type-badge type-badge-surface pixel-face";
const typeBadgeSmClassName = "type-badge-sm caption-dense tracking-ui-tight";
const typeBadgeMdClassName = "type-badge-md text-xs tracking-ui";
const typeBadgeLgClassName = "type-badge-lg text-base tracking-ui-wide";
const typeBadgeResponsiveClassName =
  "type-badge-responsive text-xs tracking-ui md:text-sm lg:text-base lg:tracking-ui-wide";

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
        typeBadgeClass(size),
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

function typeBadgeClass(size?: "sm" | "md" | "lg") {
  if (size === "sm") {
    return `${typeBadgeBaseClassName} ${typeBadgeSmClassName}`;
  }

  if (size === "md") {
    return `${typeBadgeBaseClassName} ${typeBadgeMdClassName}`;
  }

  if (size === "lg") {
    return `${typeBadgeBaseClassName} ${typeBadgeLgClassName}`;
  }

  return `${typeBadgeBaseClassName} ${typeBadgeResponsiveClassName}`;
}
