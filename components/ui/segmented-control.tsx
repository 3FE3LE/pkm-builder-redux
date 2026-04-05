"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const segmentedControlListClassName =
  "flex flex-wrap items-center gap-1 rounded-[0.8rem] border border-line-soft bg-surface-2 p-1";
export const segmentedControlItemClassName =
  "pixel-face inline-flex h-auto items-center justify-center gap-0 rounded-[0.6rem] border border-transparent bg-transparent px-3 py-1.5 text-xs leading-none whitespace-nowrap transition";
export const segmentedControlItemInactiveClassName =
  "text-text-soft hover:bg-surface-4 hover:text-text";
export const segmentedControlItemActiveClassName =
  "bg-warning-fill text-[hsl(39_100%_82%)]";

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
