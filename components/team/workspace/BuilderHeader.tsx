"use client";

import { MoonStar, Sun, Sunrise, Sunset } from "lucide-react";

import type { BuilderLocalTime } from "@/hooks/useBuilderUiState";
import type { Milestone } from "@/lib/builder";
import { getSeasonFromMonth, type RecommendationSeason } from "@/lib/domain/scoring/season";

function getSeasonLabel(season: RecommendationSeason) {
  if (season === "spring") {
    return "Spring";
  }

  if (season === "summer") {
    return "Summer";
  }

  if (season === "autumn") {
    return "Autumn";
  }

  return "Winter";
}

export function BuilderHeader({
  milestoneId: _milestoneId,
  milestones: _milestones,
  localTime,
}: {
  milestoneId: string;
  milestones: Milestone[];
  localTime: BuilderLocalTime;
}) {
  const season = getSeasonFromMonth(new Date().getMonth());
  const TimeIcon =
    localTime.phase === "dawn"
      ? Sunrise
      : localTime.phase === "dusk"
        ? Sunset
        : localTime.phase === "day"
          ? Sun
          : MoonStar;

  return (
    <div className="mb-3 flex justify-center">
      <div className="inline-flex w-full min-w-0 items-center justify-center gap-2 px-1 py-1 sm:gap-3 lg:w-auto">
        <TimeIcon className="h-10 w-10 shrink-0 text-accent sm:h-14 sm:w-14" />
        <div className="min-w-0 text-center">
          <div className="display-face text-xs uppercase tracking-display-xwide text-accent">
            {localTime.period === "day" ? "Day Time" : "Night Time"}
          </div>
          <div className="pixel-face text-[2.4rem] leading-none tracking-display-wide font-normal text-text sm:text-[3.4rem] lg:text-[4.2rem]">
            {localTime.ready ? localTime.label : "SYNC..."}
          </div>
          <div className="mt-1 display-face text-[0.7rem] uppercase tracking-display-xwide text-muted sm:text-xs">
            {getSeasonLabel(season)} Season
          </div>
        </div>
      </div>
    </div>
  );
}
