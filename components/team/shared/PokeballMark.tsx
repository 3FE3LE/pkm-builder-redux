"use client";

import { cn } from "@/lib/utils";

const pokeballMarkShellClassName =
  "relative block h-5 w-5 rounded-full border border-[rgba(255,255,255,0.16)] bg-[linear-gradient(180deg,#d44b52_0%,#d44b52_46%,#1d2328_46%,#1d2328_54%,#f5f7fa_54%,#f5f7fa_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]";
const pokeballMarkCenterClassName =
  "absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(17,24,28,0.75)] bg-white";

export function PokeballMark({
  className,
  centerClassName,
}: {
  className?: string;
  centerClassName?: string;
}) {
  return (
    <span
      className={cn(
        pokeballMarkShellClassName,
        className,
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          pokeballMarkCenterClassName,
          centerClassName,
        )}
      />
    </span>
  );
}
