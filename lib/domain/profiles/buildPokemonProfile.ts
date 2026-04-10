import type { Stats } from "../battle";
import type { TypeName, AbilityEffect, MoveEffect, PowerBand } from "../effects/types";
import { toPowerBand } from "../effects/types";
import { resolveAbilityEffects } from "../effects/abilityMap";
import { resolveAllMoveEffects } from "../effects/moveMap";
import { resolveItemEffects } from "../effects/itemMap";
import { evaluateSynergies } from "../effects/synergyRules";
import { getTypeEffectiveness } from "../typeChart";
import { TYPE_ORDER } from "../typeChart";
import type { PokemonProfile, RoleKey, RoleVector, ReduxFlags, SpeedTier } from "./types";
import { toSpeedTier } from "./types";

export type PokemonProfileInput = {
  id: string;
  name: string;
  types: string[];
  stats: Stats;
  ability?: string | null;
  abilities?: string[];
  moves?: { name: string; type?: string; damageClass?: string | null; power?: number | null }[];
  item?: string | null;
  reduxFlags?: ReduxFlags;
  terminalTypes?: string[];
  terminalStats?: Stats;
  terminalAbility?: string | null;
  terminalAbilities?: string[];
  terminalMoves?: { name: string; type?: string; damageClass?: string | null; power?: number | null }[];
};

export function buildPokemonProfile(input: PokemonProfileInput): PokemonProfile {
  const types = input.types as TypeName[];
  const stats = input.stats;
  const moves = input.moves ?? [];

  const abilityEffects = resolveAbilityEffects(input.ability, input.abilities);
  const moveEffects = resolveAllMoveEffects(moves);
  const itemEffects = resolveItemEffects(input.item);
  const synergies = evaluateSynergies(abilityEffects, moveEffects, itemEffects);

  const stabTypes = extractStabTypes(types, moves);
  const bestPhysicalPower = bestPowerForCategory(moveEffects, "physical");
  const bestSpecialPower = bestPowerForCategory(moveEffects, "special");

  const roleVector = computeRoleVector(stats, moveEffects, abilityEffects);
  const [primaryRole, secondaryRole] = topRoles(roleVector);

  const floorScore = computeFloorScore(stats, types, moveEffects, abilityEffects);
  const ceilingScore = computeCeilingScore(stats, synergies, moveEffects);

  const reduxFlags = input.reduxFlags ?? {
    hasTypeChanges: false,
    hasAbilityChanges: false,
    hasStatChanges: false,
  };
  const reduxScore = computeReduxScore(reduxFlags);

  // Terminal evolution projections
  let terminalCeiling: number | undefined;
  let evolutionGrowth = 0;
  const terminalTypes = input.terminalTypes as TypeName[] | undefined;
  const terminalStats = input.terminalStats;

  if (terminalStats) {
    evolutionGrowth = Math.min((terminalStats.bst - stats.bst) / 55, 5);
    if (evolutionGrowth < 0) evolutionGrowth = 0;

    const terminalAbilityEffects = resolveAbilityEffects(
      input.terminalAbility,
      input.terminalAbilities,
    );
    const terminalMoveEffects = resolveAllMoveEffects(input.terminalMoves ?? []);
    const terminalItemEffects = itemEffects;
    const terminalSynergies = evaluateSynergies(
      terminalAbilityEffects,
      terminalMoveEffects,
      terminalItemEffects,
    );
    terminalCeiling = computeCeilingScore(terminalStats, terminalSynergies, terminalMoveEffects);
  }

  return {
    id: input.id,
    name: input.name,
    types,
    stats,
    speedTier: toSpeedTier(stats.spe),
    offensivePressure: computeOffensivePressure(stats, moveEffects, abilityEffects),
    defensiveSolidity: computeDefensiveSolidity(stats, types, abilityEffects),
    roleVector,
    primaryRole,
    secondaryRole,
    abilityEffects,
    moveEffects,
    itemEffects,
    synergies,
    synergyTags: synergies.map((s) => s.tag),
    floorScore,
    ceilingScore,
    volatility: round(ceilingScore - floorScore, 1),
    terminalTypes,
    terminalStats,
    terminalCeiling,
    evolutionGrowth: round(Math.max(evolutionGrowth, 0), 1),
    reduxFlags,
    reduxScore,
    stabTypes,
    bestPhysicalPower,
    bestSpecialPower,
  };
}

// ── Floor Score (0-10) ──

function computeFloorScore(
  stats: Stats,
  types: TypeName[],
  moveEffects: MoveEffect[],
  abilityEffects: AbilityEffect[],
): number {
  let floor = 5.0;

  // Bulk contributes to floor
  const bulkIndex = (stats.hp * stats.def * stats.spd) / 1_000_000;
  floor += clamp(bulkIndex * 2.5, 0, 2.0);

  // Reliable STAB damage (no setup, no self-drop)
  const hasReliableDamage = moveEffects.some(
    (e) => e.kind === "damage" && e.powerBand >= 3,
  );
  if (hasReliableDamage) floor += 1.0;

  // Recovery raises floor
  if (moveEffects.some((e) => e.kind === "recovery")) floor += 0.8;

  // Draining provides lesser sustain
  if (moveEffects.some((e) => e.kind === "draining")) floor += 0.3;

  // Pivot raises floor (escape bad matchups)
  if (moveEffects.some((e) => e.kind === "pivot")) floor += 0.5;

  // Setup dependency lowers floor
  const setupCount = moveEffects.filter((e) => e.kind === "setup").length;
  if (setupCount >= 2) floor -= 1.5;
  else if (setupCount === 1) floor -= 0.5;

  // Self-drop without inversion lowers floor
  const hasSelfDrop = moveEffects.some((e) => e.kind === "selfDropDamage");
  const hasInvert = abilityEffects.some((e) => e.kind === "invertStatChanges");
  if (hasSelfDrop && !hasInvert) floor -= 0.8;

  // Type weakness count
  const weaknessCount = countTypeWeaknesses(types);
  if (weaknessCount >= 5) floor -= 1.5;
  else if (weaknessCount >= 4) floor -= 0.8;

  // Immunities raise floor
  const immunityCount = abilityEffects.filter(
    (e) => e.kind === "immunity" || e.kind === "typeNullify",
  ).length;
  floor += immunityCount * 0.3;

  return clamp(round(floor, 1), 0, 10);
}

// ── Ceiling Score (0-10) ──

function computeCeilingScore(
  stats: Stats,
  synergies: { score: number }[],
  moveEffects: MoveEffect[],
): number {
  let ceiling = 3.0;

  // Synergy total (the core of ceiling evaluation)
  const synergyTotal = synergies.reduce((sum, s) => sum + s.score, 0);
  ceiling += Math.min(synergyTotal, 7.0);

  // Raw offensive potential (independent of synergies)
  const bestPower = maxPowerBand(moveEffects);
  if (bestPower >= 4) ceiling += 0.5;

  // High speed + offense = closing potential
  const offensiveStat = Math.max(stats.atk, stats.spa);
  if (stats.spe >= 96 && offensiveStat >= 100) ceiling += 0.6;

  return clamp(round(ceiling, 1), 0, 10);
}

// ── Offensive Pressure (0-100) ──

function computeOffensivePressure(
  stats: Stats,
  moveEffects: MoveEffect[],
  abilityEffects: AbilityEffect[],
): number {
  const mainAtk = Math.max(stats.atk, stats.spa);
  let pressure = clamp((mainAtk - 50) / 1.1, 0, 50);

  const bestPower = maxPowerBand(moveEffects);
  pressure += bestPower * 8;

  // Offensive multiplier abilities
  if (abilityEffects.some((e) => e.kind === "offensiveMultiplier")) {
    pressure += 15;
  }

  // Setup potential
  if (moveEffects.some((e) => e.kind === "setup")) {
    pressure += 8;
  }

  return clamp(round(pressure, 0), 0, 100);
}

// ── Defensive Solidity (0-100) ──

function computeDefensiveSolidity(
  stats: Stats,
  types: TypeName[],
  abilityEffects: AbilityEffect[],
): number {
  const bulkIndex = (stats.hp * ((stats.def + stats.spd) / 2)) / 10_000;
  let solidity = clamp(bulkIndex * 1.2, 0, 50);

  // Fewer weaknesses = more solid
  const weaknesses = countTypeWeaknesses(types);
  const resistances = countTypeResistances(types);
  solidity += resistances * 3;
  solidity -= weaknesses * 4;

  // Ability-granted immunities
  const immunityCount = abilityEffects.filter(
    (e) => e.kind === "immunity" || e.kind === "typeNullify",
  ).length;
  solidity += immunityCount * 5;

  // Intimidate
  if (abilityEffects.some((e) => e.kind === "intimidate")) solidity += 6;

  return clamp(round(solidity, 0), 0, 100);
}

// ── Role Vector ──

const ALL_ROLES: RoleKey[] = [
  "wallbreaker", "setupSweeper", "cleaner", "revengeKiller",
  "speedControl", "bulkyPivot", "support", "defensiveGlue",
];

function computeRoleVector(
  stats: Stats,
  moveEffects: MoveEffect[],
  abilityEffects: AbilityEffect[],
): RoleVector {
  const vec = Object.fromEntries(ALL_ROLES.map((r) => [r, 0])) as RoleVector;
  const mainAtk = Math.max(stats.atk, stats.spa);
  const bulk = (stats.hp + stats.def + stats.spd) / 3;
  const hasSetup = moveEffects.some((e) => e.kind === "setup");
  const hasPivot = moveEffects.some((e) => e.kind === "pivot");
  const hasRecovery = moveEffects.some((e) => e.kind === "recovery" || e.kind === "draining");
  const hasStatus = moveEffects.some((e) => e.kind === "status" || e.kind === "screen" || e.kind === "hazard");
  const hasPriority = moveEffects.some((e) => e.kind === "priority");
  const hasSpeedControl = moveEffects.some((e) => e.kind === "speedControl");

  // Wallbreaker: high offense, power moves
  if (mainAtk >= 90) vec.wallbreaker += 0.5;
  if (mainAtk >= 110) vec.wallbreaker += 0.3;
  if (maxPowerBand(moveEffects) >= 4) vec.wallbreaker += 0.2;

  // Setup Sweeper: setup + decent speed/offense
  if (hasSetup && mainAtk >= 75) vec.setupSweeper += 0.5;
  if (hasSetup && stats.spe >= 80) vec.setupSweeper += 0.3;
  if (hasSetup && mainAtk >= 100) vec.setupSweeper += 0.2;

  // Cleaner: fast + strong
  if (stats.spe >= 95 && mainAtk >= 85) vec.cleaner += 0.6;
  if (stats.spe >= 110) vec.cleaner += 0.2;

  // Revenge Killer: very fast or priority
  if (stats.spe >= 105) vec.revengeKiller += 0.5;
  if (hasPriority) vec.revengeKiller += 0.4;

  // Speed Control: Thunder Wave, Tailwind, Icy Wind
  if (hasSpeedControl) vec.speedControl += 0.6;
  if (hasPriority) vec.speedControl += 0.2;

  // Bulky Pivot: bulk + pivot + recovery
  if (hasPivot && bulk >= 75) vec.bulkyPivot += 0.5;
  if (hasPivot && hasRecovery) vec.bulkyPivot += 0.3;
  if (abilityEffects.some((e) => e.kind === "pivotRecovery")) vec.bulkyPivot += 0.3;

  // Support: status + utility
  if (hasStatus) vec.support += 0.5;
  if (moveEffects.some((e) => e.kind === "hazard")) vec.support += 0.3;
  if (moveEffects.some((e) => e.kind === "screen")) vec.support += 0.2;

  // Defensive Glue: high bulk + recovery/resistances
  if (bulk >= 90) vec.defensiveGlue += 0.4;
  if (hasRecovery && bulk >= 80) vec.defensiveGlue += 0.4;
  if (bulk >= 100) vec.defensiveGlue += 0.2;

  // Normalize so max is 1.0
  const maxVal = Math.max(...Object.values(vec), 0.01);
  for (const role of ALL_ROLES) {
    vec[role] = round(vec[role] / maxVal, 2);
  }

  return vec;
}

function topRoles(vec: RoleVector): [RoleKey, RoleKey | null] {
  const sorted = (Object.entries(vec) as [RoleKey, number][])
    .sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][0];
  const secondary = sorted[1][1] >= 0.4 ? sorted[1][0] : null;
  return [primary, secondary];
}

// ── Redux Score ──

function computeReduxScore(flags: ReduxFlags): number {
  let score = 0;
  if (flags.hasTypeChanges) score += 3;
  if (flags.hasAbilityChanges) score += 2;
  if (flags.hasStatChanges) score += 1;
  return score;
}

// ── STAB Types ──

function extractStabTypes(
  types: TypeName[],
  moves: { name: string; type?: string }[],
): TypeName[] {
  const typeSet = new Set(types);
  const stab = new Set<TypeName>();
  for (const move of moves) {
    if (move.type && typeSet.has(move.type as TypeName)) {
      stab.add(move.type as TypeName);
    }
  }
  return Array.from(stab);
}

// ── Helpers ──

function maxPowerBand(effects: MoveEffect[]): PowerBand {
  let best: PowerBand = 1;
  for (const e of effects) {
    if ("powerBand" in e && (e as { powerBand: PowerBand }).powerBand > best) {
      best = (e as { powerBand: PowerBand }).powerBand;
    }
  }
  return best;
}

function bestPowerForCategory(
  effects: MoveEffect[],
  category: "physical" | "special",
): PowerBand {
  let best: PowerBand = 1;
  for (const e of effects) {
    if (
      "category" in e &&
      "powerBand" in e &&
      (e as { category: string }).category === category &&
      (e as { powerBand: PowerBand }).powerBand > best
    ) {
      best = (e as { powerBand: PowerBand }).powerBand;
    }
  }
  return best;
}

function countTypeWeaknesses(types: TypeName[]): number {
  let count = 0;
  for (const attackType of TYPE_ORDER) {
    const mult = getTypeEffectiveness(attackType, types);
    if (mult > 1) count++;
  }
  return count;
}

function countTypeResistances(types: TypeName[]): number {
  let count = 0;
  for (const attackType of TYPE_ORDER) {
    const mult = getTypeEffectiveness(attackType, types);
    if (mult < 1 && mult > 0) count++;
  }
  return count;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
