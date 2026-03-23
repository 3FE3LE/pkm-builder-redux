"use client";

import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors outline-none",
        checked
          ? "border-primary-line-emphasis bg-primary-fill-strong"
          : "border-line bg-surface-4",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "block h-5 w-5 rounded-full bg-text transition-transform",
          checked ? "translate-x-[1.35rem]" : "translate-x-1",
        )}
      />
    </button>
  );
}
