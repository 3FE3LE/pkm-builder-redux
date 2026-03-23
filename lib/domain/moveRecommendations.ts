import type { BattleWeather } from "./battle";
import { applyMovePowerModifiers, getMovePowerModifiers, getWeatherAdjustedMove } from "./moves";
import { getTypeEffectiveness } from "./typeChart";
import { normalizeMoveLookupName } from "./moves";

type LearnsetEntry = {
  move: string;
  level?: number;
  source?: string;
  details?: {
    type?: string;
    damageClass?: string;
    power?: number | null;
    accuracy?: number | null;
    description?: string;
  } | null;
};

type RecommendationMember = {
  resolvedTypes: string[];
  level?: number;
  item?: string;
  itemDetails?: {
    effect?: string;
  } | null;
  ability?: string;
  abilityDetails?: {
    effect?: string;
  } | null;
  effectiveStats?: {
    atk: number;
    spa: number;
    def: number;
    spd: number;
  };
  moves: { name: string }[];
  learnsets?: {
    levelUp: LearnsetEntry[];
    machines: LearnsetEntry[];
  };
};

export type MoveRecommendation = {
  move: string;
  source: string;
  type?: string;
  damageClass?: string;
  power?: number | null;
  adjustedPower?: number | null;
  score: number;
  reasons: string[];
};

export function getMoveRecommendations({
  member,
  uncoveredTypes,
  weather = "clear",
  limit = 6,
  maxLevelDelta = 5,
}: {
  member?: RecommendationMember;
  uncoveredTypes: string[];
  weather?: BattleWeather;
  limit?: number;
  maxLevelDelta?: number;
}) {
  if (!member?.learnsets) {
    return [];
  }

  const currentMoves = new Set(member.moves.map((move) => normalizeMoveLookupName(move.name)));
  const candidates = [
    ...(member.learnsets.levelUp ?? []).map((entry) => ({
      ...entry,
      source: `Lv ${entry.level ?? 1}`,
    })),
    ...(member.learnsets.machines ?? []).map((entry) => ({
      ...entry,
      source: entry.source ?? "TM",
    })),
  ];

  const byMove = new Map<string, MoveRecommendation>();

  for (const entry of candidates) {
    const normalizedMove = normalizeMoveLookupName(entry.move);
    if (currentMoves.has(normalizedMove)) {
      continue;
    }
    if (
      typeof entry.level === "number" &&
      typeof member.level === "number" &&
      entry.level > member.level + maxLevelDelta
    ) {
      continue;
    }

    const type = entry.details?.type;
    const damageClass = entry.details?.damageClass;
    const power = entry.details?.power ?? null;
    const baseMove = {
      name: entry.move,
      type,
      damageClass,
      power,
      accuracy: entry.details?.accuracy,
      description: entry.details?.description,
    };
    const move = getWeatherAdjustedMove(baseMove, weather);
    const powerModifiers = getMovePowerModifiers({
      move,
      itemName: member.item,
      itemEffect: member.itemDetails?.effect,
      abilityName: member.ability,
      abilityEffect: member.abilityDetails?.effect,
      weather,
    });
    const adjustedPower = applyMovePowerModifiers(power, powerModifiers);
    const score = scoreMove(member, type, damageClass, adjustedPower, uncoveredTypes);
    const reasons = describeMoveFit(member, type, damageClass, adjustedPower, uncoveredTypes);
    const recommendation = {
      move: entry.move,
      source: entry.source ?? "TM",
      type: move.type ?? type,
      damageClass,
      power: move.power,
      adjustedPower,
      score,
      reasons,
    };

    const existing = byMove.get(normalizedMove);
    if (!existing || existing.score < recommendation.score) {
      byMove.set(normalizedMove, recommendation);
    }
  }

  return [...byMove.values()]
    .sort((left, right) => right.score - left.score || left.move.localeCompare(right.move))
    .slice(0, limit);
}

function scoreMove(
  member: RecommendationMember,
  type: string | undefined,
  damageClass: string | undefined,
  power: number | null,
  uncoveredTypes: string[],
) {
  let score = 0;

  if (type && member.resolvedTypes.some((memberType) => memberType === type)) {
    score += 32;
  }

  if (damageClass === "physical" && member.effectiveStats && member.effectiveStats.atk >= member.effectiveStats.spa) {
    score += 18;
  }

  if (damageClass === "special" && member.effectiveStats && member.effectiveStats.spa >= member.effectiveStats.atk) {
    score += 18;
  }

  if (power) {
    score += Math.min(28, Math.round(power / 4));
  }

  if (type) {
    for (const uncoveredType of uncoveredTypes.slice(0, 6)) {
      const effectiveness = getTypeEffectiveness(type, [uncoveredType]);
      if (effectiveness > 1) {
        score += effectiveness >= 4 ? 18 : 10;
      }
    }
  }

  if (damageClass === "status") {
    score -= 18;
  }

  return score;
}

function describeMoveFit(
  member: RecommendationMember,
  type: string | undefined,
  damageClass: string | undefined,
  power: number | null,
  uncoveredTypes: string[],
) {
  const reasons: string[] = [];

  if (type && member.resolvedTypes.some((memberType) => memberType === type)) {
    reasons.push("STAB");
  }

  if (damageClass === "physical" && member.effectiveStats && member.effectiveStats.atk >= member.effectiveStats.spa) {
    reasons.push("fits Atk");
  }

  if (damageClass === "special" && member.effectiveStats && member.effectiveStats.spa >= member.effectiveStats.atk) {
    reasons.push("fits SpA");
  }

  if (type) {
    const covered = uncoveredTypes.filter((uncoveredType) => getTypeEffectiveness(type, [uncoveredType]) > 1);
    if (covered.length) {
      reasons.push(`covers ${covered.slice(0, 2).join(" / ")}`);
    }
  }

  if (power && power >= 80) {
    reasons.push("high power");
  }

  if (!reasons.length && damageClass === "status") {
    reasons.push("utility");
  }

  return reasons;
}
