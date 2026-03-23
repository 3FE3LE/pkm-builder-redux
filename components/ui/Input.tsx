"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-[6px] border border-line bg-surface-4 px-3 py-2 text-sm text-text shadow-none outline-none transition-[border-color,box-shadow,background-color] file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-faint disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-primary-line-emphasis focus-visible:bg-surface-6 focus-visible:ring-2 focus-visible:ring-primary-fill-hover aria-invalid:border-danger-line-emphasis aria-invalid:ring-2 aria-invalid:ring-danger-fill-hover",
        className
      )}
      {...props}
    />
  );
}

export { Input };
