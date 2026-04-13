"use client";

import { AnimatePresence, motion } from "motion/react";

import { SpreadInput } from "@/components/team/UI";
import { statKeys } from "@/lib/builderForm";

import type { IvInferenceByStat, IvObservedState } from "@/components/team/tools/iv-calculator/types";

const ivObservedErrorClassName = "micro-copy text-danger";
const ivObservedEstimateLabelClassName = "display-face micro-label text-muted";
const ivObservedEstimateSeedClassName = "mt-1 hidden micro-label text-muted sm:block";
const ivObservedCardClassName = "app-soft-panel flex min-h-[9.5rem] flex-col justify-between rounded-xl px-2.5 py-2.5";
const ivObservedFeedbackClassName = "mt-2 min-h-14";

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
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {statKeys.map((stat) => (
          <motion.div
            key={`iv-calc-${stat}`}
            layout
            className={ivObservedCardClassName}
          >
            <SpreadInput
              label={stat.toUpperCase()}
              value={Number(observedStats[stat] || 0)}
              max={999}
              orientation="responsive"
              onChange={(next) => onChangeStat(stat, next)}
            />
            <div className={ivObservedFeedbackClassName}>
              <AnimatePresence mode="popLayout">
                {observedStats[stat].trim() ? (
                  <motion.div
                    key={`${stat}-${observedStats[stat]}`}
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="token-card h-full bg-surface-2/60 px-2.5 py-2"
                  >
                    {!inferenceByStat[stat] || !inferenceByStat[stat]?.candidates.length ? (
                      <p className={ivObservedErrorClassName}>
                        {inferenceByStat[stat]?.issue === "evs"
                          ? "Stats sugieren EVs invertidos"
                          : "IV range inconsistente"}
                      </p>
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
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
