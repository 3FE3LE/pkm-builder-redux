import type { TypeName } from "../effects/types";
import { TYPE_ORDER } from "../typeChart";
import { getTypeEffectiveness } from "../typeChart";
import type { PokemonProfile, TeamSnapshot, RoleKey, SpeedTier } from "./types";

const ROLE_TARGETS: Record<RoleKey, { min: number; max: number }> = {
  wallbreaker:   { min: 1, max: 2 },
  setupSweeper:  { min: 0, max: 1 },
  cleaner:       { min: 1, max: 2 },
  revengeKiller: { min: 1, max: 2 },
  speedControl:  { min: 1, max: 2 },
  bulkyPivot:    { min: 1, max: 2 },
  support:       { min: 1, max: 2 },
  defensiveGlue: { min: 1, max: 2 },
};

const ALL_ROLES = Object.keys(ROLE_TARGETS) as RoleKey[];

export function buildTeamSnapshot(members: PokemonProfile[]): TeamSnapshot {
  const size = members.length;

  // ── Offensive Coverage ──
  const offensiveCoverage = new Map<TypeName, number>();
  for (const type of TYPE_ORDER) {
    let best = 0;
    for (const m of members) {
      for (const stabType of m.stabTypes) {
        const mult = getTypeEffectiveness(stabType, [type]);
        if (mult > best) best = mult;
      }
    }
    offensiveCoverage.set(type, best);
  }

  const uncoveredTypes = TYPE_ORDER.filter(
    (t) => (offensiveCoverage.get(t) ?? 0) <= 1,
  ) as TypeName[];

  // ── Defensive Resistance ──
  const defensiveResistance = new Map<TypeName, number>();
  const immunities: TypeName[] = [];
  for (const attackType of TYPE_ORDER) {
    let bestResist = Infinity;
    for (const m of members) {
      const mult = getTypeEffectiveness(attackType, m.types);
      if (mult < bestResist) bestResist = mult;
    }
    defensiveResistance.set(attackType as TypeName, bestResist);
    if (bestResist === 0) immunities.push(attackType as TypeName);
  }

  const unresistedTypes = TYPE_ORDER.filter(
    (t) => (defensiveResistance.get(t) ?? 1) >= 1,
  ) as TypeName[];

  // ── Roles ──
  const roleCounts = new Map<RoleKey, number>();
  for (const role of ALL_ROLES) roleCounts.set(role, 0);
  for (const m of members) {
    roleCounts.set(m.primaryRole, (roleCounts.get(m.primaryRole) ?? 0) + 1);
    if (m.secondaryRole) {
      roleCounts.set(m.secondaryRole, (roleCounts.get(m.secondaryRole) ?? 0) + 1);
    }
  }

  const filledRoles = new Set<RoleKey>();
  const missingRoles: RoleKey[] = [];
  const redundantRoles: RoleKey[] = [];
  for (const role of ALL_ROLES) {
    const count = roleCounts.get(role) ?? 0;
    const { min, max } = ROLE_TARGETS[role];
    if (count >= min) filledRoles.add(role);
    if (count < min) missingRoles.push(role);
    if (count > max) redundantRoles.push(role);
  }

  // ── Aggregates ──
  const floorSum = members.reduce((s, m) => s + m.floorScore, 0);
  const ceilingSum = members.reduce((s, m) => s + m.ceilingScore, 0);

  let physCount = 0;
  let specCount = 0;
  for (const m of members) {
    if (m.bestPhysicalPower > m.bestSpecialPower) physCount++;
    else if (m.bestSpecialPower > m.bestPhysicalPower) specCount++;
  }
  const total = physCount + specCount || 1;
  const physSpecBalance = (specCount - physCount) / total;

  const stabTypesOnTeam = new Set<TypeName>();
  for (const m of members) {
    for (const t of m.stabTypes) stabTypesOnTeam.add(t);
  }

  const typeSignatures = new Set<string>();
  for (const m of members) {
    typeSignatures.add([...m.types].sort().join("|"));
  }

  const speedTiersOnTeam = members.map((m) => m.speedTier);
  const speedSum = speedTiersOnTeam.reduce<number>((a, b) => a + b, 0);

  return {
    members,
    size,
    offensiveCoverage,
    uncoveredTypes,
    defensiveResistance,
    unresistedTypes,
    immunities,
    filledRoles,
    missingRoles,
    redundantRoles,
    averageFloor: size > 0 ? round(floorSum / size, 1) : 0,
    averageCeiling: size > 0 ? round(ceilingSum / size, 1) : 0,
    physSpecBalance: round(physSpecBalance, 2),
    averageSpeedTier: size > 0 ? round(speedSum / size, 1) : 0,
    typeSignatures,
    stabTypesOnTeam,
    speedTiersOnTeam,
  };
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
