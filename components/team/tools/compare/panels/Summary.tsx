"use client";

import clsx from "clsx";
import { ArrowLeftRight } from "lucide-react";

import { CoverageBadge } from "@/components/team/UI";

import type { State } from "./state";

export function Summary({
  left,
  right,
}: {
  left: State;
  right: State;
}) {
  const summaryDiffs = [
    {
      label: "BST base",
      left: left.resolved?.resolvedStats?.bst,
      right: right.resolved?.resolvedStats?.bst,
    },
    { label: "HP", left: left.summaryStats?.hp, right: right.summaryStats?.hp },
    { label: "Atk", left: left.summaryStats?.atk, right: right.summaryStats?.atk },
    { label: "Def", left: left.summaryStats?.def, right: right.summaryStats?.def },
    { label: "SpA", left: left.summaryStats?.spa, right: right.summaryStats?.spa },
    { label: "SpD", left: left.summaryStats?.spd, right: right.summaryStats?.spd },
    { label: "Spe", left: left.summaryStats?.spe, right: right.summaryStats?.spe },
  ];

  return (
    <div className="rounded-[0.9rem] px-1 py-1">
      <div className="flex items-center justify-center gap-2">
        <ArrowLeftRight className="h-5 w-5 text-accent" />
        <p className="display-face text-sm text-accent">Vs</p>
      </div>
      <div className="mt-3 grid gap-2 sm:space-y-0">
        <article className="rounded-xl px-1 py-1">
          <p className="display-face text-center text-xs text-danger">Debilidades</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ComparisonBucket entries={left.weaknesses} fallback="Sin debilidades" />
            <ComparisonBucket entries={right.weaknesses} fallback="Sin debilidades" />
          </div>
        </article>

        <article className="rounded-xl px-1 py-1">
          <p className="display-face text-center text-xs text-info">Resistencias</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ComparisonBucket
              entries={left.resistances}
              fallback="Sin resistencias"
              pickBucket={(entry) =>
                entry.buckets.x0 > 0
                  ? "x0"
                  : entry.buckets["x0.25"] > 0
                    ? "x0.25"
                    : "x0.5"
              }
            />
            <ComparisonBucket
              entries={right.resistances}
              fallback="Sin resistencias"
              pickBucket={(entry) =>
                entry.buckets.x0 > 0
                  ? "x0"
                  : entry.buckets["x0.25"] > 0
                    ? "x0.25"
                    : "x0.5"
              }
            />
          </div>
        </article>
      </div>
      <div className="mt-3 grid gap-1.5 sm:gap-2">
        {summaryDiffs.map((entry) => {
          const leftValue = entry.left ?? null;
          const rightValue = entry.right ?? null;
          const delta =
            typeof leftValue === "number" && typeof rightValue === "number"
              ? leftValue - rightValue
              : null;

          return (
            <div
              key={`compare-diff-${entry.label}`}
              className="rounded-[0.625rem] px-2 py-1.5"
            >
              <div className="display-face text-[10px] text-muted sm:text-[11px]">
                {entry.label}
              </div>
              <div className="mt-1 flex items-center justify-between gap-1.5 text-xs sm:gap-2 sm:text-sm">
                <span
                  className={clsx(
                    typeof leftValue === "number" &&
                      typeof rightValue === "number" &&
                      leftValue > rightValue &&
                      "text-primary",
                  )}
                >
                  {leftValue ?? "-"}
                </span>
                <span
                  className={clsx(
                    "display-face text-xs",
                    delta === null
                      ? "text-muted"
                      : delta !== 0
                        ? "text-primary"
                        : "text-muted",
                  )}
                >
                  {delta === null ? "-" : delta > 0 ? `+${delta}` : String(delta)}
                </span>
                <span
                  className={clsx(
                    typeof leftValue === "number" &&
                      typeof rightValue === "number" &&
                      rightValue > leftValue &&
                      "text-primary",
                  )}
                >
                  {rightValue ?? "-"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComparisonBucket({
  entries,
  fallback,
  pickBucket = (entry) => (entry.buckets.x4 > 0 ? "x4" : "x2"),
}: {
  entries: State["weaknesses"];
  fallback: string;
  pickBucket?: (
    entry: State["weaknesses"][number],
  ) => "x4" | "x2" | "x0" | "x0.25" | "x0.5";
}) {
  return (
    <div className="rounded-[0.625rem] px-1 py-1.5">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {entries.length ? (
          entries.map((entry) => (
            <CoverageBadge
              key={entry.attackType}
              type={entry.attackType}
              label={entry.attackType}
              bucket={pickBucket(entry)}
            />
          ))
        ) : (
          <span className="text-xs text-muted">{fallback}</span>
        )}
      </div>
    </div>
  );
}
