"use client";

import clsx from "clsx";
import { type ReactNode } from "react";
import { motion } from "motion/react";
import { useDroppable } from "@dnd-kit/core";

const compareDropZoneShellClassName =
  "min-w-0 space-y-1.5 rounded-2xl border border-dashed border-transparent p-0.5 transition-all sm:p-2";
const compareDropZoneHeaderClassName = "flex items-center justify-between gap-2 px-1 micro-copy text-muted";

export function CompareDropZone({
  slot,
  pulseToken,
  hasSpecies,
  onClear,
  children,
}: {
  slot: 0 | 1;
  pulseToken: number | null;
  hasSpecies: boolean;
  onClear: (slot: 0 | 1) => void;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `compare-slot-${slot}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        compareDropZoneShellClassName,
        isOver &&
          "border-primary-line-emphasis bg-primary-fill primary-outline-shadow",
      )}
    >
      <div className={compareDropZoneHeaderClassName}>
        <span className="display-face text-accent">slot {slot + 1}</span>
        {hasSpecies ? (
          <>
            <button type="button" onClick={() => onClear(slot)} className="text-danger sm:hidden">
              x
            </button>
            <button type="button" onClick={() => onClear(slot)} className="hidden text-danger sm:inline">
              limpiar
            </button>
          </>
        ) : (
          <span className={clsx("hidden sm:inline", isOver && "text-primary-soft")}>
            {isOver ? "Suelta para comparar" : "Arrastra un Pokemon del roster aqui"}
          </span>
        )}
      </div>
      <motion.div
        key={pulseToken ? `compare-drop-${slot}-${pulseToken}` : `compare-drop-${slot}`}
        initial={false}
        animate={
          pulseToken
            ? {
                scale: [0.92, 1.035, 1],
                filter: [
                  "saturate(0.96) brightness(0.96)",
                  "saturate(1.08) brightness(1.04)",
                  "saturate(1) brightness(1)",
                ],
              }
            : { scale: 1, filter: "saturate(1) brightness(1)" }
        }
        transition={{
          duration: pulseToken ? 0.34 : 0.18,
          times: pulseToken ? [0, 0.55, 1] : undefined,
          ease: "easeOut",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
