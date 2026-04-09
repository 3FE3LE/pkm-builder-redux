"use client";

import { AnimatePresence, motion } from "motion/react";

import { SpreadInput } from "@/components/team/UI";
import { statKeys } from "@/lib/builderForm";

import type { IvInferenceByStat, IvObservedState } from "@/components/team/tools/iv-calculator/types";

const ivObservedErrorClassName = "micro-copy text-danger";
const ivObservedEstimateLabelClassName = "display-face micro-label text-muted";
const ivObservedEstimateSeedClassName = "mt-1 hidden micro-label text-muted sm:block";

export function ObservedStatsPanel({
  observedStats,
  inferenceByStat,
  onChangeStat,
}: {
  observedStats: IvObservedState;
  inferenceByStat: IvInferenceByStat;
  onChangeStat: (stat: (typeof statKeys)[number], value: number) => void;
}) {
  return (
    <div className="px-1 py-1">
      <p className="display-face text-xs text-accent">Observed stats</p>
      <div className="mt-3 flex flex-nowrap items-start justify-between gap-1 lg:flex-col lg:gap-2">
        {statKeys.map((stat) => (
          <motion.div
            key={`iv-calc-${stat}`}
            layout
            className="min-w-0"
          >
            <SpreadInput
              label={stat.toUpperCase()}
              value={Number(observedStats[stat] || 0)}
              max={999}
              orientation="responsive"
              onChange={(next) => onChangeStat(stat, next)}
            />
            <AnimatePresence mode="popLayout">
              {observedStats[stat].trim() ? (
                <motion.div
                  key={`${stat}-${observedStats[stat]}`}
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="token-card mt-2 bg-surface-2/60 px-2.5 py-2"
                >
                  {!inferenceByStat[stat] || !inferenceByStat[stat]?.candidates.length ? (
                    <p className={ivObservedErrorClassName}>No cuadra con EV 0</p>
                  ) : (
                    <>
                      <p className={ivObservedEstimateLabelClassName}>EST. IV</p>
                      <p className="pixel-face mt-1 text-sm text-accent">
                        {inferenceByStat[stat]?.exactIv !== null
                          ? String(inferenceByStat[stat]?.exactIv)
                          : `${inferenceByStat[stat]?.minIv}-${inferenceByStat[stat]?.maxIv}`}
                      </p>
                      <p className={ivObservedEstimateSeedClassName}>
                        {`seed ${inferenceByStat[stat]?.iv0Value} -> 31 ${inferenceByStat[stat]?.iv31Value}`}
                      </p>
                    </>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
