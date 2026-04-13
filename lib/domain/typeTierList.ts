import { TYPE_ORDER, getMultiplierBucket, getTypeEffectiveness, type MultiplierBucket } from "./typeChart";

type TypeName = (typeof TYPE_ORDER)[number];

export type TypeCombo = {
  id: string;
  label: string;
  types: string[];
};

export type TypeTierEntry = {
  combo: TypeCombo;
  score: number;
  rawScore: number;
  rank: number;
  tier: "S" | "A" | "B" | "C";
  breakdown: Record<MultiplierBucket, number>;
};

export type RankedRosterMember = {
  memberId: string;
  label: string;
  species: string;
  types: string[];
  offense: Pick<TypeTierEntry, "score" | "rank" | "tier">;
  defense: Pick<TypeTierEntry, "score" | "rank" | "tier">;
  overallScore: number;
};

export type TypeCoverageSummary = {
  attackerType: TypeName;
  defenderTypes: TypeName[];
  multiplier: number;
  superEffectiveTargets: number;
  neutralTargets: number;
  resistedTargets: number;
  immuneTargets: number;
  bestTargets: Array<TypeCombo & { multiplier: number }>;
};

type RosterMember = {
  key?: string;
  species: string;
  nickname?: string;
  resolvedTypes: string[];
};

const DEFENDER_COMBOS = buildTypeCombinations();
const SCORE_SCALE_MAX = 100;

export function buildTypeCombinations() {
  const singleTypes = TYPE_ORDER.map((type) => ({
    id: type.toLowerCase(),
    label: type,
    types: [type],
  }));
  const dualTypes = TYPE_ORDER.flatMap((left, leftIndex) =>
    TYPE_ORDER.slice(leftIndex + 1).map((right) => ({
      id: `${left.toLowerCase()}-${right.toLowerCase()}`,
      label: `${left} / ${right}`,
      types: [left, right],
    })),
  );

  return [...singleTypes, ...dualTypes];
}

export function buildOffensiveTypeTierList() {
  return buildRankedTierList(DEFENDER_COMBOS, scoreOffensiveCombo);
}

export function buildDefensiveTypeTierList() {
  return buildRankedTierList(DEFENDER_COMBOS, scoreDefensiveCombo);
}

export function rankRosterByTyping(team: RosterMember[]) {
  const offenseTierList = buildOffensiveTypeTierList();
  const defenseTierList = buildDefensiveTypeTierList();
  const offenseById = new Map(offenseTierList.map((entry) => [entry.combo.id, entry]));
  const defenseById = new Map(defenseTierList.map((entry) => [entry.combo.id, entry]));

  return team
    .filter((member) => member.species.trim() && member.resolvedTypes.length)
    .map((member) => {
      const comboId = member.resolvedTypes
        .slice()
        .sort(
          (left, right) =>
            TYPE_ORDER.indexOf(left as TypeName) - TYPE_ORDER.indexOf(right as TypeName),
        )
        .map((type) => type.toLowerCase())
        .join("-");
      const offense = offenseById.get(comboId);
      const defense = defenseById.get(comboId);
      return {
        memberId: member.key ?? member.species,
        label: member.nickname?.trim() || member.species,
        species: member.species,
        types: member.resolvedTypes,
        offense: pickTierMeta(offense),
        defense: pickTierMeta(defense),
        overallScore: round(((offense?.score ?? 0) + (defense?.score ?? 0)) / 2, 1),
      };
    })
    .sort((left, right) => right.overallScore - left.overallScore || left.label.localeCompare(right.label));
}

export function buildTypeCoverageSummary(
  attackerType: TypeName,
  defenderTypes: TypeName[],
): TypeCoverageSummary {
  const multiplier = getTypeEffectiveness(attackerType, defenderTypes);
  const matchups = DEFENDER_COMBOS.map((combo) => ({
    ...combo,
    multiplier: getTypeEffectiveness(attackerType, combo.types),
  }));

  return {
    attackerType,
    defenderTypes,
    multiplier,
    superEffectiveTargets: matchups.filter((entry) => entry.multiplier > 1).length,
    neutralTargets: matchups.filter((entry) => entry.multiplier === 1).length,
    resistedTargets: matchups.filter((entry) => entry.multiplier > 0 && entry.multiplier < 1).length,
    immuneTargets: matchups.filter((entry) => entry.multiplier === 0).length,
    bestTargets: matchups
      .filter((entry) => entry.multiplier > 1)
      .sort((left, right) => right.multiplier - left.multiplier || left.label.localeCompare(right.label))
      .slice(0, 8),
  };
}

function buildRankedTierList(
  combos: TypeCombo[],
  scorer: (combo: TypeCombo) => Omit<TypeTierEntry, "rank" | "tier" | "score">,
) {
  const rawScored = combos
    .map((combo) => scorer(combo))
    .sort((left, right) => right.rawScore - left.rawScore || left.combo.label.localeCompare(right.combo.label));
  const normalizedScored = normalizeScores(rawScored);

  return normalizedScored.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    tier: getTierForRank(index, normalizedScored.length),
  }));
}

function scoreOffensiveCombo(combo: TypeCombo): Omit<TypeTierEntry, "rank" | "tier" | "score"> {
  const breakdown = createEmptyBreakdown();

  for (const defender of DEFENDER_COMBOS) {
    const bestMultiplier = Math.max(
      ...combo.types.map((attackType) => getTypeEffectiveness(attackType, defender.types)),
    );
    breakdown[getMultiplierBucket(bestMultiplier)] += 1;
  }

  const rawScore =
    breakdown.x4 * 2.6 +
    breakdown.x2 * 1.3 +
    breakdown.x1 * 0.2 -
    breakdown["x0.5"] * 0.8 -
    breakdown["x0.25"] * 1.4 -
    breakdown.x0 * 2.4;

  return {
    combo,
    rawScore: round(rawScore, 2),
    breakdown,
  };
}

function scoreDefensiveCombo(combo: TypeCombo): Omit<TypeTierEntry, "rank" | "tier" | "score"> {
  const breakdown = createEmptyBreakdown();

  for (const attackType of TYPE_ORDER) {
    const multiplier = getTypeEffectiveness(attackType, combo.types);
    breakdown[getMultiplierBucket(multiplier)] += 1;
  }

  const rawScore =
    breakdown.x0 * 3.2 +
    breakdown["x0.25"] * 2.4 +
    breakdown["x0.5"] * 1.4 -
    breakdown.x2 * 1.6 -
    breakdown.x4 * 3.2;

  return {
    combo,
    rawScore: round(rawScore, 2),
    breakdown,
  };
}

function normalizeScores<T extends { rawScore: number }>(entries: T[]) {
  if (!entries.length) {
    return [];
  }

  const maxScore = Math.max(...entries.map((entry) => entry.rawScore));
  const minScore = Math.min(...entries.map((entry) => entry.rawScore));
  const span = maxScore - minScore;

  return entries.map((entry) => ({
    ...entry,
    score: span === 0 ? SCORE_SCALE_MAX : round(((entry.rawScore - minScore) / span) * SCORE_SCALE_MAX, 1),
  }));
}

function createEmptyBreakdown(): Record<MultiplierBucket, number> {
  return {
    x4: 0,
    x2: 0,
    x1: 0,
    "x0.5": 0,
    "x0.25": 0,
    x0: 0,
  };
}

function pickTierMeta(entry?: TypeTierEntry) {
  return {
    score: entry?.score ?? 0,
    rank: entry?.rank ?? 999,
    tier: entry?.tier ?? "C",
  } as const;
}

function getTierForRank(index: number, total: number): TypeTierEntry["tier"] {
  const percentile = (index + 1) / total;
  if (percentile <= 0.1) {
    return "S";
  }
  if (percentile <= 0.3) {
    return "A";
  }
  if (percentile <= 0.6) {
    return "B";
  }
  return "C";
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
