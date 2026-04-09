"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const segmentedControlListClassName =
  "app-control-surface flex flex-wrap items-center gap-1 rounded-lg p-1";
export const segmentedControlItemClassName =
  "app-segmented-item pixel-face inline-flex h-auto items-center justify-center gap-0 bg-transparent px-3 py-1.5 text-xs leading-none whitespace-nowrap";
export const segmentedControlItemInactiveClassName =
  "text-text-soft hover:bg-surface-4 hover:text-text";
export const segmentedControlItemActiveClassName =
  "warning-badge soft-inset-shadow";

export function SegmentedControl({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn(segmentedControlListClassName, className)} {...props}>
      {children}
    </div>
  );
}

export function SegmentedControlItem({
  active = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        segmentedControlItemClassName,
        active
          ? segmentedControlItemActiveClassName
          : segmentedControlItemInactiveClassName,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
