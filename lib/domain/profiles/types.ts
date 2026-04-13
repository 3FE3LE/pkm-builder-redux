import type { Stats } from "../battle";
import type {
  TypeName,
  AbilityEffect,
  MoveEffect,
  ItemEffect,
  SynergyMatch,
  PowerBand,
} from "../effects/types";

// ── Speed Tiers ──

/**
 * Heuristica interna del proyecto basada en base Speed.
 * No es una categoria oficial de Pokemon ni un promedio del meta.
 *
 * 0: ≤55    (muy lentos)
 * 1: 56-75  (lentos)
 * 2: 76-95  (medios)
 * 3: 96-115 (rapidos)
 * 4: >115   (muy rapidos)
 */
export type SpeedTier = 0 | 1 | 2 | 3 | 4;

export function toSpeedTier(speed: number): SpeedTier {
  if (speed <= 55) return 0;
  if (speed <= 75) return 1;
  if (speed <= 95) return 2;
  if (speed <= 115) return 3;
  return 4;
}

// ── Roles ──

export type RoleKey =
  | "wallbreaker"
  | "setupSweeper"
  | "cleaner"
  | "revengeKiller"
  | "speedControl"
  | "bulkyPivot"
  | "support"
  | "defensiveGlue";

export type RoleVector = Record<RoleKey, number>;

// ── Redux Flags ──

export type ReduxFlags = {
  hasTypeChanges: boolean;
  hasAbilityChanges: boolean;
  hasStatChanges: boolean;
};

// ── Pokemon Profile (precomputed per species) ──

export type PokemonProfile = {
  id: string;
  name: string;
  types: TypeName[];
  stats: Stats;

  speedTier: SpeedTier;
  offensivePressure: number;
  defensiveSolidity: number;

  roleVector: RoleVector;
  primaryRole: RoleKey;
  secondaryRole: RoleKey | null;

  abilityEffects: AbilityEffect[];
  moveEffects: MoveEffect[];
  itemEffects: ItemEffect[];

  synergies: SynergyMatch[];
  synergyTags: string[];

  floorScore: number;
  ceilingScore: number;
  volatility: number;

  terminalTypes?: TypeName[];
  terminalStats?: Stats;
  terminalCeiling?: number;
  evolutionGrowth: number;

  reduxFlags: ReduxFlags;
  reduxScore: number;

  stabTypes: TypeName[];
  bestPhysicalPower: PowerBand;
  bestSpecialPower: PowerBand;
};

// ── Team Snapshot (precomputed per team change) ──

export type TeamSnapshot = {
  members: PokemonProfile[];
  size: number;

  offensiveCoverage: Map<TypeName, number>;
  uncoveredTypes: TypeName[];
  defensiveResistance: Map<TypeName, number>;
  unresistedTypes: TypeName[];
  immunities: TypeName[];

  filledRoles: Set<RoleKey>;
  missingRoles: RoleKey[];
  redundantRoles: RoleKey[];

  averageFloor: number;
  averageCeiling: number;
  physSpecBalance: number;
  averageSpeedTier: number;
  typeSignatures: Set<string>;

  stabTypesOnTeam: Set<TypeName>;
  speedTiersOnTeam: SpeedTier[];
};

export type TeamPlanContext = {
  coreSpecies: Set<string>;
  flexSpecies: Set<string>;
  lockedSpecies: Set<string>;
  coreSlots: number;
  coreSnapshot: TeamSnapshot | null;
};

// ── Encounter Profile (precomputed per encounter) ──

export type EncounterProfile = {
  id: string;
  label: string;

  threatTypes: TypeName[];
  threatSTABTypes: TypeName[];
  maxThreatSpeed: number;
  threatSpeedTier: SpeedTier;

  valuableOffenseTypes: TypeName[];
  valuableResistTypes: TypeName[];
};

// ── Checkpoint Profile (static, 10 entries) ──

export type CheckpointProfile = {
  id: string;
  label: string;
  preferredCoverage: TypeName[];
  preferredResists: TypeName[];
  speedPressure: "low" | "medium" | "high";
  speedThreshold: number;
  projectedLevel: number;
};

// ── Scoring Output ──

export type DimensionScore = {
  raw: number;
  weighted: number;
  signals: string[];
};

export type CandidateScore = {
  finalScore: number;
  rank: number;

  breakdown: {
    teamImpact: DimensionScore;
    contextAdvantage: DimensionScore;
    stabilityFloor: DimensionScore;
    powerCeiling: DimensionScore;
    preferenceAffinity: DimensionScore;
    reduxValue: DimensionScore;
  };

  topSignals: string[];
  synergyTags: string[];
  verdict: "strong" | "solid" | "situational" | "weak";
};

export type ScoringPreferences = {
  preferReduxUpgrades: boolean;
  excludeOtherStarters: boolean;
  excludeExactTypeDuplicates: boolean;
  excludeLegendaries: boolean;
  excludePseudoLegendaries: boolean;
  playstyle: "balanced" | "aggressive" | "defensive" | "technical";
  favoriteTypes: TypeName[];
  avoidedTypes: TypeName[];
  preferredRoles: RoleKey[];
  preferredTypes?: TypeName[];
  currentSeason?: "spring" | "summer" | "autumn" | "winter";
};
