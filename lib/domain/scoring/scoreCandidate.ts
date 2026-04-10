import type { TypeName } from "../effects/types";
import { TYPE_ORDER } from "../typeChart";
import { getTypeEffectiveness } from "../typeChart";
import type {
  PokemonProfile,
  TeamSnapshot,
  EncounterProfile,
  CheckpointProfile,
  ScoringPreferences,
  CandidateScore,
  DimensionScore,
  SpeedTier,
} from "../profiles/types";
import { toSpeedTier } from "../profiles/types";

// ── Weights ──

const WEIGHTS = {
  teamImpact: 0.28,
  contextAdvantage: 0.22,
  stabilityFloor: 0.15,
  powerCeiling: 0.18,
  preferenceAffinity: 0.07,
  reduxValue: 0.10,
} as const;

// ── Main Scorer ──

export function scoreCandidate(
  candidate: PokemonProfile,
  team: TeamSnapshot,
  encounter: EncounterProfile | null,
  checkpoint: CheckpointProfile,
  preferences: ScoringPreferences,
): CandidateScore {
  const teamImpact = computeTeamImpact(candidate, team, checkpoint);
  const contextAdvantage = computeContextAdvantage(candidate, encounter, checkpoint);
  const stabilityFloor = computeStabilityFloor(candidate);
  const powerCeiling = computePowerCeiling(candidate);
  const preferenceAffinity = computePreferenceAffinity(candidate, preferences);
  const reduxValue = computeReduxValue(candidate);

  teamImpact.weighted = round(teamImpact.raw * WEIGHTS.teamImpact, 1);
  contextAdvantage.weighted = round(contextAdvantage.raw * WEIGHTS.contextAdvantage, 1);
  stabilityFloor.weighted = round(stabilityFloor.raw * WEIGHTS.stabilityFloor, 1);
  powerCeiling.weighted = round(powerCeiling.raw * WEIGHTS.powerCeiling, 1);
  preferenceAffinity.weighted = round(preferenceAffinity.raw * WEIGHTS.preferenceAffinity, 1);
  reduxValue.weighted = round(reduxValue.raw * WEIGHTS.reduxValue, 1);

  const finalScore = round(
    teamImpact.weighted +
      contextAdvantage.weighted +
      stabilityFloor.weighted +
      powerCeiling.weighted +
      preferenceAffinity.weighted +
      reduxValue.weighted,
    1,
  );

  const breakdown = {
    teamImpact,
    contextAdvantage,
    stabilityFloor,
    powerCeiling,
    preferenceAffinity,
    reduxValue,
  };

  return {
    finalScore,
    rank: 0, // assigned after sorting
    breakdown,
    topSignals: extractTopSignals(breakdown),
    synergyTags: candidate.synergyTags,
    verdict: classifyVerdict(finalScore),
  };
}

/**
 * Score and rank a list of candidates. Returns sorted by finalScore descending.
 */
export function scoreCandidates(
  candidates: PokemonProfile[],
  team: TeamSnapshot,
  encounter: EncounterProfile | null,
  checkpoint: CheckpointProfile,
  preferences: ScoringPreferences,
): CandidateScore[] {
  const scored = candidates.map((c) =>
    scoreCandidate(c, team, encounter, checkpoint, preferences),
  );
  scored.sort((a, b) => b.finalScore - a.finalScore);
  for (let i = 0; i < scored.length; i++) {
    scored[i].rank = i + 1;
  }
  return scored;
}

// ── 1. Team Impact (0-100) ──

function computeTeamImpact(
  candidate: PokemonProfile,
  team: TeamSnapshot,
  checkpoint: CheckpointProfile,
): DimensionScore {
  const signals: string[] = [];
  let score = 30;

  // Coverage gain: types the candidate can hit that the team can't
  const coverageGains: TypeName[] = [];
  for (const stabType of candidate.stabTypes) {
    for (const defType of TYPE_ORDER) {
      const mult = getTypeEffectiveness(stabType, [defType]);
      if (mult > 1 && team.uncoveredTypes.includes(defType as TypeName)) {
        coverageGains.push(defType as TypeName);
      }
    }
  }
  const uniqueCoverage = [...new Set(coverageGains)];
  score += uniqueCoverage.length * 8;
  if (uniqueCoverage.length > 0) {
    signals.push(`Cubre ${uniqueCoverage.slice(0, 3).join(", ")} que el equipo no tiene.`);
  }

  // Checkpoint preferred coverage
  const preferredHits = candidate.stabTypes.filter((t) =>
    checkpoint.preferredCoverage.includes(t),
  );
  score += preferredHits.length * 6;

  // Resistance gain: opponent types the candidate resists that the team doesn't
  const resistGains: TypeName[] = [];
  for (const threat of team.unresistedTypes) {
    const mult = getTypeEffectiveness(threat, candidate.types);
    if (mult < 1) resistGains.push(threat);
  }
  score += resistGains.length * 7;
  if (resistGains.length > 0) {
    signals.push(`Resiste ${resistGains.slice(0, 3).join(", ")} que amenaza al equipo.`);
  }

  // Role fit
  if (team.missingRoles.includes(candidate.primaryRole)) {
    score += 14;
    signals.push(`Llena el rol de ${candidate.primaryRole} que falta.`);
  } else if (team.redundantRoles.includes(candidate.primaryRole)) {
    score -= 8;
    signals.push(`Rol de ${candidate.primaryRole} ya está cubierto.`);
  }

  // Type overlap penalty
  const typeSignature = [...candidate.types].sort().join("|");
  if (team.typeSignatures.has(typeSignature)) {
    score -= 15;
    signals.push("Typing duplicado con miembro existente.");
  }

  // Phys/Spec balance
  const candidateLean =
    candidate.bestPhysicalPower > candidate.bestSpecialPower ? -1 : 1;
  if (
    Math.sign(candidateLean) !== Math.sign(team.physSpecBalance) ||
    Math.abs(team.physSpecBalance) > 0.3
  ) {
    score += 5;
  }

  return { raw: clamp(score, 0, 100), weighted: 0, signals };
}

// ── 2. Context Advantage (0-100) ──

function computeContextAdvantage(
  candidate: PokemonProfile,
  encounter: EncounterProfile | null,
  checkpoint: CheckpointProfile,
): DimensionScore {
  const signals: string[] = [];
  let score = 25;

  if (!encounter) {
    const speedOK =
      candidate.speedTier >=
      speedTierFromPressure(checkpoint.speedPressure);
    if (speedOK) {
      score += 15;
      signals.push("Speed adecuado para este tramo.");
    }
    return { raw: clamp(score, 0, 100), weighted: 0, signals };
  }

  // Offensive value: STAB types that hit encounter mon types SE
  const hitsSuper = candidate.stabTypes.filter((t) =>
    encounter.valuableOffenseTypes.includes(t),
  );
  score += hitsSuper.length * 15;
  if (hitsSuper.length > 0) {
    signals.push(
      `STAB super-efectivo contra encounter (${hitsSuper.join(", ")}).`,
    );
  }

  // Defensive value: resists encounter STAB
  const resistsThreats: TypeName[] = [];
  for (const threat of encounter.valuableResistTypes) {
    const mult = getTypeEffectiveness(threat, candidate.types);
    if (mult < 1) resistsThreats.push(threat);
  }
  score += resistsThreats.length * 8;
  if (resistsThreats.length > 0) {
    signals.push(`Resiste amenazas del encounter (${resistsThreats.slice(0, 2).join(", ")}).`);
  }

  // Speed check
  if (candidate.speedTier >= encounter.threatSpeedTier) {
    score += 12;
    signals.push("Outspeedea a las amenazas del encounter.");
  } else if (candidate.moveEffects.some((e) => e.kind === "priority")) {
    score += 8;
    signals.push("Tiene prioridad para compensar speed.");
  }

  // Utility value
  const hasUtility = candidate.moveEffects.some(
    (e) =>
      e.kind === "status" ||
      e.kind === "screen" ||
      e.kind === "speedControl",
  );
  if (hasUtility) score += 5;

  return { raw: clamp(score, 0, 100), weighted: 0, signals };
}

// ── 3. Stability Floor (0-100) ──

function computeStabilityFloor(candidate: PokemonProfile): DimensionScore {
  const signals: string[] = [];
  const raw = candidate.floorScore * 10;

  if (candidate.floorScore >= 7) {
    signals.push("Piso alto: confiable sin depender de setup o combos.");
  } else if (candidate.floorScore <= 4) {
    signals.push("Piso bajo: requiere condiciones específicas para rendir.");
  }

  if (candidate.volatility >= 4) {
    signals.push("Alta volatilidad: brecha grande entre piso y techo.");
  }

  return { raw: clamp(raw, 0, 100), weighted: 0, signals };
}

// ── 4. Power Ceiling (0-100) ──

function computePowerCeiling(candidate: PokemonProfile): DimensionScore {
  const signals: string[] = [];

  const effectiveCeiling = candidate.terminalCeiling ?? candidate.ceilingScore;
  let raw = effectiveCeiling * 10;

  // Evolution growth bonus
  if (candidate.evolutionGrowth > 0) {
    raw += Math.min(candidate.evolutionGrowth * 4, 15);
    signals.push(
      `Línea evolutiva crece +${Math.round(candidate.evolutionGrowth * 55)} BST.`,
    );
  }

  // Terminal typing change bonus
  if (
    candidate.terminalTypes &&
    [...candidate.terminalTypes].sort().join() !==
      [...candidate.types].sort().join()
  ) {
    raw += 8;
    signals.push("Typing cambia al evolucionar.");
  }

  // Synergy explanations (top 2)
  for (const syn of candidate.synergies.slice(0, 2)) {
    signals.push(syn.explanation);
  }

  return { raw: clamp(raw, 0, 100), weighted: 0, signals };
}

// ── 5. Preference Affinity (0-100) ──

function computePreferenceAffinity(
  candidate: PokemonProfile,
  preferences: ScoringPreferences,
): DimensionScore {
  const signals: string[] = [];
  let score = 50; // neutral

  if (preferences.preferReduxUpgrades && candidate.reduxFlags.hasTypeChanges) {
    score += 20;
    signals.push("Preferencia por upgrades Redux activa.");
  }

  if (preferences.preferredTypes?.some((t) => candidate.types.includes(t))) {
    score += 15;
    signals.push("Typing coincide con preferencias del jugador.");
  }

  return { raw: clamp(score, 0, 100), weighted: 0, signals };
}

// ── 6. Redux Value (0-100) ──

function computeReduxValue(candidate: PokemonProfile): DimensionScore {
  const signals: string[] = [];
  const raw = candidate.reduxScore * 16; // 6 * 16 = 96 max

  if (candidate.reduxFlags.hasTypeChanges) {
    signals.push("Redux cambió typing.");
  }
  if (candidate.reduxFlags.hasAbilityChanges) {
    signals.push("Redux cambió habilidades.");
  }
  if (candidate.reduxFlags.hasStatChanges) {
    signals.push("Redux ajustó stats.");
  }

  return { raw: clamp(raw, 0, 100), weighted: 0, signals };
}

// ── Helpers ──

function speedTierFromPressure(
  pressure: "low" | "medium" | "high",
): SpeedTier {
  if (pressure === "low") return 1;
  if (pressure === "medium") return 2;
  return 3;
}

function extractTopSignals(
  breakdown: CandidateScore["breakdown"],
): string[] {
  const all = Object.values(breakdown)
    .sort((a, b) => b.weighted - a.weighted)
    .flatMap((d) => d.signals);
  return all.slice(0, 3);
}

function classifyVerdict(
  score: number,
): CandidateScore["verdict"] {
  if (score >= 70) return "strong";
  if (score >= 50) return "solid";
  if (score >= 30) return "situational";
  return "weak";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
