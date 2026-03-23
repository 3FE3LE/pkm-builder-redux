import type { RoleId } from "./roleAnalysis";
import { calculateEffectiveStats, buildCoverageSummary } from "./battle";
import { buildCheckpointRiskSnapshot } from "./checkpointScoring";
import { getTypeEffectiveness } from "./typeChart";

type CandidateSuggestion = {
  id: string;
  species: string;
  source: string;
  reason: string;
  role: string;
  canonicalRole: RoleId;
  roleLabel: string;
  teamFitNote: string;
  roleReason: string;
  area?: string;
};

type CandidatePokemon = {
  id: number;
  name: string;
  types: string[];
  stats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
    bst: number;
  };
  abilities?: string[];
  learnsets?: {
    levelUp?: {
      level: number;
      move: string;
    }[];
  };
};

type CandidateMove = {
  name: string;
  type?: string;
  damageClass?: string;
  power?: number | null;
  accuracy?: number | null;
  pp?: number | null;
  description?: string;
};

export type DecisionDeltaTeamMember = {
  species: string;
  locked?: boolean;
  resolvedTypes: string[];
  resolvedStats?: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
    bst: number;
  };
  summaryStats?: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
    bst: number;
  };
  effectiveStats?: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
    bst: number;
  };
  level?: number;
  item?: string;
  statModifiers?: { stat: string; multiplier: number }[];
  moves: {
    name: string;
    type?: string;
    hasStab?: boolean;
    damageClass?: string;
    power?: number | null;
    adjustedPower?: number | null;
    accuracy?: number | null;
  }[];
};

export type DecisionDelta = {
  id: string;
  species: string;
  source: string;
  reason: string;
  role: string;
  canonicalRole: RoleId;
  roleLabel: string;
  teamFitNote: string;
  roleReason: string;
  area?: string;
  action: "add" | "replace" | "skip";
  replacedSlot?: string;
  scoreDelta: number;
  riskDelta: number;
  projectedRisk: number;
  offenseDelta: number;
  defenseDelta: number;
  speedDelta: number;
  rolesDelta: number;
  consistencyDelta: number;
  gains: string[];
  losses: string[];
  projectedMoves: string[];
};

export function buildDecisionDeltas({
  team,
  checkpointId,
  candidates,
  pokemonByName,
  moveIndex,
}: {
  team: DecisionDeltaTeamMember[];
  checkpointId: string;
  candidates: CandidateSuggestion[];
  pokemonByName: Record<string, CandidatePokemon | null | undefined>;
  moveIndex: Record<string, CandidateMove | null | undefined>;
}): DecisionDelta[] {
  const currentTeam = team.filter((member) => member.species.trim());
  const baseline = buildCheckpointRiskSnapshot({ team: currentTeam, checkpointId });
  const projectedLevel = inferProjectedLevel(currentTeam, checkpointId);
  const uncoveredTypes = buildCoverageSummary(currentTeam)
    .filter((entry) => entry.multiplier <= 1)
    .map((entry) => entry.defenseType);

  return candidates
    .map((candidate) =>
      buildCandidateDelta({
        candidate,
        currentTeam,
        checkpointId,
        projectedLevel,
        uncoveredTypes,
        baseline,
        pokemonByName,
        moveIndex,
      }),
    )
    .filter((entry): entry is DecisionDelta => Boolean(entry))
    .sort(
      (left, right) =>
        right.riskDelta - left.riskDelta ||
        right.scoreDelta - left.scoreDelta ||
        left.species.localeCompare(right.species),
    );
}

function buildCandidateDelta({
  candidate,
  currentTeam,
  checkpointId,
  projectedLevel,
  uncoveredTypes,
  baseline,
  pokemonByName,
  moveIndex,
}: {
  candidate: CandidateSuggestion;
  currentTeam: DecisionDeltaTeamMember[];
  checkpointId: string;
  projectedLevel: number;
  uncoveredTypes: string[];
  baseline: ReturnType<typeof buildCheckpointRiskSnapshot>;
  pokemonByName: Record<string, CandidatePokemon | null | undefined>;
  moveIndex: Record<string, CandidateMove | null | undefined>;
}): DecisionDelta | null {
  const projected = projectCandidateMember({
    species: candidate.species,
    level: projectedLevel,
    uncoveredTypes,
    pokemonByName,
    moveIndex,
  });

  if (!projected) {
    return null;
  }

  const options =
    currentTeam.length < 6
      ? [
          {
            action: "add" as const,
            replacedSlot: undefined,
            nextTeam: [...currentTeam, projected],
          },
        ]
      : currentTeam
          .map((member, index) =>
            member.locked
              ? null
              : {
                  action: "replace" as const,
                  replacedSlot: member.species,
                  nextTeam: currentTeam.map((entry, entryIndex) => (entryIndex === index ? projected : entry)),
                }
          )
          .filter((entry): entry is { action: "replace"; replacedSlot: string; nextTeam: DecisionDeltaTeamMember[] } => Boolean(entry));

  const ranked = options
    .map((option) => {
      const snapshot = buildCheckpointRiskSnapshot({
        team: option.nextTeam,
        checkpointId,
      });

      return {
        action: option.action,
        replacedSlot: option.replacedSlot,
        snapshot,
        scoreDelta: round(snapshot.totalScore - baseline.totalScore, 1),
        riskDelta: round(baseline.totalRisk - snapshot.totalRisk, 1),
        offenseDelta: round(snapshot.offense.score - baseline.offense.score, 1),
        defenseDelta: round(snapshot.defense.score - baseline.defense.score, 1),
        speedDelta: round(snapshot.speed.score - baseline.speed.score, 1),
        rolesDelta: round(snapshot.roles.score - baseline.roles.score, 1),
        consistencyDelta: round(snapshot.consistency.score - baseline.consistency.score, 1),
      };
    })
    .sort(
      (left, right) =>
        right.riskDelta - left.riskDelta ||
        right.scoreDelta - left.scoreDelta ||
        Number(left.action === "add") - Number(right.action === "add"),
    );

  const best = ranked[0];
  if (!best) {
    return {
      id: candidate.id,
      species: candidate.species,
      source: candidate.source,
      reason: candidate.reason,
      role: candidate.role,
      canonicalRole: candidate.canonicalRole,
      roleLabel: candidate.roleLabel,
      teamFitNote: candidate.teamFitNote,
      roleReason: candidate.roleReason,
      area: candidate.area,
      action: "skip",
      scoreDelta: -999,
      riskDelta: -999,
      projectedRisk: baseline.totalRisk,
      offenseDelta: 0,
      defenseDelta: 0,
      speedDelta: 0,
      rolesDelta: 0,
      consistencyDelta: 0,
      gains: [],
      losses: ["Todos los slots elegibles estan locked."],
      projectedMoves: projected.moves.slice(0, 4).map((move) => move.name),
    };
  }

  return {
    id: candidate.id,
    species: candidate.species,
    source: candidate.source,
    reason: candidate.reason,
    role: candidate.role,
    canonicalRole: candidate.canonicalRole,
    roleLabel: candidate.roleLabel,
    teamFitNote: candidate.teamFitNote,
    roleReason: candidate.roleReason,
    area: candidate.area,
    action: best.action,
    replacedSlot: best.replacedSlot,
    scoreDelta: best.scoreDelta,
    riskDelta: best.riskDelta,
    projectedRisk: best.snapshot.totalRisk,
    offenseDelta: best.offenseDelta,
    defenseDelta: best.defenseDelta,
    speedDelta: best.speedDelta,
    rolesDelta: best.rolesDelta,
    consistencyDelta: best.consistencyDelta,
    gains: buildDeltaSignals(best, "gain"),
    losses: buildDeltaSignals(best, "loss"),
    projectedMoves: projected.moves.slice(0, 4).map((move) => move.name),
  };
}

export function projectCandidateMember({
  species,
  level,
  uncoveredTypes,
  pokemonByName,
  moveIndex,
}: {
  species: string;
  level: number;
  uncoveredTypes: string[];
  pokemonByName: Record<string, CandidatePokemon | null | undefined>;
  moveIndex: Record<string, CandidateMove | null | undefined>;
}): DecisionDeltaTeamMember | null {
  const normalizedSpecies = normalize(species);
  const candidate = pokemonByName[normalizedSpecies];
  if (!candidate?.stats) {
    return null;
  }

  const effectiveStats = calculateEffectiveStats(candidate.stats, level, "Serious");
  const moves = buildProjectedMoves({
    candidate,
    level,
    uncoveredTypes,
    effectiveStats,
    moveIndex,
  });

  return {
    species: candidate.name ?? species,
    resolvedTypes: candidate.types ?? [],
    resolvedStats: candidate.stats,
    summaryStats: effectiveStats,
    effectiveStats,
    level,
    item: "",
    statModifiers: [],
    moves,
  };
}

function buildProjectedMoves({
  candidate,
  level,
  uncoveredTypes,
  effectiveStats,
  moveIndex,
}: {
  candidate: CandidatePokemon;
  level: number;
  uncoveredTypes: string[];
  effectiveStats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
    bst: number;
  };
  moveIndex: Record<string, CandidateMove | null | undefined>;
}) {
  const availableLevelMoves = (candidate.learnsets?.levelUp ?? []).filter((entry) => entry.level <= level);
  const fallbackLevelMoves = (candidate.learnsets?.levelUp ?? []).slice(0, 8);
  const pool = (availableLevelMoves.length ? availableLevelMoves : fallbackLevelMoves).map((entry) => {
    const moveDetails = moveIndex[normalize(entry.move)] ?? undefined;
    const type = moveDetails?.type;
    const damageClass = moveDetails?.damageClass;
    const power = moveDetails?.power ?? null;
    const coverageHits = type
      ? uncoveredTypes.filter((targetType) => getCoverageMultiplier(type, targetType) > 1).length
      : 0;
    const utilityBonus =
      damageClass === "status" &&
      ["thunder wave", "will-o-wisp", "protect", "wish", "tailwind", "leech seed"].includes(
        entry.move.toLowerCase(),
      )
        ? 42
        : 0;
    const statFitBonus =
      damageClass === "physical"
        ? effectiveStats.atk >= effectiveStats.spa
          ? 22
          : 8
        : damageClass === "special"
          ? effectiveStats.spa >= effectiveStats.atk
            ? 22
            : 8
          : 0;
    const stabBonus = type && candidate.types.some((memberType) => normalize(memberType) === normalize(type)) ? 34 : 0;

    return {
      name: entry.move,
      type,
      damageClass,
      power,
      adjustedPower: power,
      accuracy: moveDetails?.accuracy ?? null,
      hasStab: Boolean(stabBonus),
      score: (power ?? 0) + coverageHits * 12 + utilityBonus + statFitBonus + stabBonus + entry.level / 4,
    };
  });

  const uniqueMoves = new Map<string, (typeof pool)[number]>();
  for (const move of pool) {
    const key = normalize(move.name);
    const existing = uniqueMoves.get(key);
    if (!existing || existing.score < move.score) {
      uniqueMoves.set(key, move);
    }
  }

  return [...uniqueMoves.values()]
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, 4)
    .map(({ score: _score, ...move }) => move);
}

function buildDeltaSignals(
  delta: {
    offenseDelta: number;
    defenseDelta: number;
    speedDelta: number;
    rolesDelta: number;
    consistencyDelta: number;
  },
  tone: "gain" | "loss",
) {
  const entries = [
    { label: "mejora cobertura y pressure", value: delta.offenseDelta },
    { label: "mejora el lado defensivo", value: delta.defenseDelta },
    { label: "sube el tempo y speed control", value: delta.speedDelta },
    { label: "ordena mejor los roles", value: delta.rolesDelta },
    { label: "reduce dependencia y execution tax", value: delta.consistencyDelta },
  ];

  return entries
    .filter((entry) => (tone === "gain" ? entry.value >= 4 : entry.value <= -4))
    .sort((left, right) =>
      tone === "gain" ? right.value - left.value : left.value - right.value,
    )
    .slice(0, 2)
    .map((entry) => entry.label);
}

export function inferProjectedLevel(team: DecisionDeltaTeamMember[], checkpointId: string) {
  const withLevel = team.filter((member) => typeof member.level === "number" && member.level! > 0);
  if (withLevel.length) {
    return Math.max(
      5,
      Math.round(withLevel.reduce((sum, member) => sum + (member.level ?? 0), 0) / withLevel.length),
    );
  }

  return (
    {
      opening: 11,
      floccesy: 16,
      virbank: 24,
      castelia: 30,
      driftveil: 42,
      mistralton: 55,
      undella: 64,
      humilau: 70,
      league: 78,
      postgame: 90,
    }[checkpointId] ?? 20
  );
}

function getCoverageMultiplier(moveType: string, targetType: string) {
  return getTypeEffectiveness(moveType, [targetType]);
}

function normalize(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function round(value: number, digits: number) {
  return Number(value.toFixed(digits));
}
