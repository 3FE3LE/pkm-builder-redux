import type { Stats } from "@/lib/domain/battle";
import { calculateEffectiveStats, getNatureEffect } from "@/lib/domain/battle";
import {
  getRepresentativeIv,
  inferIvForObservedStat,
} from "@/lib/domain/ivCalculator";

import type {
  Candidate,
  PerfectSpecimen,
  StatKey,
  StatSpread,
} from "@/components/team/tools/grind-pool/types";
import {
  statOrder,
} from "@/components/team/tools/grind-pool/types";
import { createEmptySpread } from "@/components/team/tools/grind-pool/factories";

export function getDistance(current: StatSpread, target: StatSpread) {
  return statOrder.reduce(
    (total, stat) => total + Math.abs(current[stat.key] - target[stat.key]),
    0,
  );
}

export function getExactMatches(current: StatSpread, target: StatSpread) {
  return statOrder.reduce(
    (total, stat) => total + (current[stat.key] === target[stat.key] ? 1 : 0),
    0,
  );
}

export function getPercent(current: StatSpread, target: StatSpread) {
  const baseline = Math.max(
    1,
    statOrder.reduce((total, stat) => total + Math.max(target[stat.key], 1), 0),
  );
  const distance = getDistance(current, target);
  return Math.max(0, Math.round(100 - (distance / baseline) * 100));
}

export function getPriorityScore(
  candidate: Candidate,
  target: PerfectSpecimen,
) {
  const natureEffect = getNatureEffect(candidate.nature);
  let score = 0;

  for (const preferredStat of target.preferredNatureStats) {
    const value = candidate.stats[preferredStat];

    if (value >= 31) {
      score += 120;
    } else if (value >= 30) {
      score += 96;
    } else if (value >= 28) {
      score += 72;
    } else if (value >= 25) {
      score += 44;
    }

    if (natureEffect.up === preferredStat) {
      score += 110;
    }

    if (natureEffect.down === preferredStat) {
      score -= 140;
    }

    if (value >= 31 && natureEffect.up === preferredStat) {
      score += 90;
    }
  }

  for (const stat of statOrder) {
    if (candidate.stats[stat.key] >= 31) {
      score += 14;
    }
  }

  if (target.ability && candidate.ability === target.ability) {
    score += 120;
  } else if (target.ability) {
    score -= 120;
  }

  if (target.gender !== "unknown" && candidate.gender === target.gender) {
    score += 90;
  } else if (target.gender !== "unknown") {
    score -= 90;
  }

  return score;
}

export function getEstimatedIvs(
  candidate: Candidate,
  baseStats: Stats | undefined,
): StatSpread {
  if (!baseStats) {
    return createEmptySpread();
  }

  const next = createEmptySpread();

  for (const stat of statOrder) {
    const inference = inferIvForObservedStat({
      baseStats,
      level: candidate.level,
      nature: candidate.nature,
      stat: stat.key,
      observed: candidate.stats[stat.key],
    });

    next[stat.key] =
      inference.candidates.length > 0 ? getRepresentativeIv(inference) : 0;
  }

  return next;
}

export function getMinimumObservedStats(
  baseStats: Stats | undefined,
  level: number,
  nature: string,
): StatSpread | null {
  if (!baseStats) {
    return null;
  }

  const minimum = calculateEffectiveStats(
    baseStats,
    level,
    nature,
    createEmptySpread(0),
    createEmptySpread(0),
  );

  return {
    hp: minimum.hp,
    atk: minimum.atk,
    def: minimum.def,
    spa: minimum.spa,
    spd: minimum.spd,
    spe: minimum.spe,
  };
}

export function applyMinimumObservedStats<
  T extends { stats: StatSpread },
>(
  draft: T,
  minimumObservedStats: StatSpread | null,
): T {
  if (!minimumObservedStats) {
    return draft;
  }

  return {
    ...draft,
    stats: {
      hp: Math.max(draft.stats.hp, minimumObservedStats.hp),
      atk: Math.max(draft.stats.atk, minimumObservedStats.atk),
      def: Math.max(draft.stats.def, minimumObservedStats.def),
      spa: Math.max(draft.stats.spa, minimumObservedStats.spa),
      spd: Math.max(draft.stats.spd, minimumObservedStats.spd),
      spe: Math.max(draft.stats.spe, minimumObservedStats.spe),
    },
  };
}

export function getObservedStatIssues(
  draft: { level: number; nature: string; stats: StatSpread },
  baseStats: Stats | undefined,
) {
  const issues: Partial<Record<StatKey, string>> = {};

  if (!baseStats) {
    return issues;
  }

  for (const stat of statOrder) {
    const observed = draft.stats[stat.key];
    if (observed <= 0) {
      continue;
    }

    const inference = inferIvForObservedStat({
      baseStats,
      level: draft.level,
      nature: draft.nature,
      stat: stat.key,
      observed,
    });

    if (inference.issue === "evs") {
      issues[stat.key] =
        "No cuadra: sugiere EVs o valor fuera del rango natural.";
      continue;
    }

    if (inference.issue === "range" || inference.candidates.length === 0) {
      issues[stat.key] = "No cuadra con nivel, naturaleza e IV posible.";
    }
  }

  return issues;
}
