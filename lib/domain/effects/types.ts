import { TYPE_ORDER } from "../typeChart";

// ── Shared Primitives ──

export type TypeName = (typeof TYPE_ORDER)[number];

/**
 * Discretized power bands to avoid raw number comparisons in runtime.
 *  1: ≤40   (Bullet Punch, Mach Punch)
 *  2: 41-65 (Aqua Jet, Aerial Ace)
 *  3: 66-85 (Earthquake, Ice Beam)
 *  4: 86-110 (Close Combat, Draco Meteor)
 *  5: >110  (Explosion, V-create)
 */
export type PowerBand = 1 | 2 | 3 | 4 | 5;

export type StatusCondition =
  | "paralysis"
  | "burn"
  | "poison"
  | "toxic"
  | "sleep"
  | "freeze";

export type Weather = "clear" | "sun" | "rain" | "sand" | "hail";

export type StatKey = "atk" | "def" | "spa" | "spd" | "spe";

// ── Ability Effects ──

export type AbilityEffect =
  | { kind: "immunity"; immuneTo: TypeName[] }
  | { kind: "typeNullify"; absorbType: TypeName; grants?: "boost" | "heal" }
  | { kind: "invertStatChanges" }
  | { kind: "autoSpeedBoost" }
  | { kind: "lowPowerAmplify"; threshold: number }
  | { kind: "priorityOnStatus" }
  | { kind: "offensiveMultiplier"; stat: "atk" | "spa"; factor: number }
  | { kind: "statusPowerUp"; stat: "atk" }
  | { kind: "pivotRecovery"; fraction: number }
  | { kind: "weatherSet"; weather: Weather }
  | { kind: "weatherSpeed"; weather: Weather }
  | { kind: "contactPunish"; effect: "damage" | "burn" | "poison" | "paralyze" }
  | { kind: "intimidate" }
  | { kind: "adaptability" }
  | { kind: "naturalCure" }
  | { kind: "magicGuard" }
  | { kind: "sturdy" }
  | { kind: "noGuard" }
  | { kind: "moldBreaker" }
  | { kind: "download" }
  | { kind: "sereneGrace" }
  | { kind: "sheerForce" }
  | { kind: "multiscale" }
  | { kind: "magicBounce" }
  | { kind: "other"; tag: string };

// ── Move Effects ──

export type MoveEffect =
  | { kind: "damage"; category: "physical" | "special"; powerBand: PowerBand }
  | {
      kind: "selfDropDamage";
      category: "physical" | "special";
      powerBand: PowerBand;
      droppedStat: StatKey;
      stages: number;
    }
  | {
      kind: "statusBoostedDamage";
      category: "physical" | "special";
      powerBand: PowerBand;
    }
  | { kind: "recoilDamage"; category: "physical" | "special"; powerBand: PowerBand }
  | {
      kind: "draining";
      category: "physical" | "special";
      powerBand: PowerBand;
      drainFraction: number;
    }
  | { kind: "multiHit"; category: "physical" | "special"; hitsRange: [number, number] }
  | { kind: "setup"; stat: StatKey | "multiple"; stages: number }
  | { kind: "priority"; value: number; category: "physical" | "special" }
  | { kind: "pivot"; category?: "physical" | "special" }
  | { kind: "recovery"; fraction: number }
  | { kind: "hazard"; layer: "spikes" | "stealthRock" | "toxicSpikes" | "stickyWeb" }
  | { kind: "hazardRemoval" }
  | { kind: "status"; inflicts: StatusCondition }
  | { kind: "speedControl"; method: "drop" | "paralysis" | "tailwind" }
  | { kind: "protection" }
  | { kind: "screen"; defense: "physical" | "special" | "both" }
  | { kind: "antiSetup"; method: "haze" | "taunt" | "encore" | "whirlwind" }
  | { kind: "trapping" }
  | { kind: "other"; tag: string };

// ── Item Effects ──

export type ItemEffect =
  | { kind: "choiceLock"; stat: "atk" | "spa" | "spe"; factor: number }
  | { kind: "lifeOrb" }
  | { kind: "eviolite" }
  | { kind: "leftovers" }
  | { kind: "focusSash" }
  | { kind: "typeBoost"; type: TypeName; factor: number }
  | { kind: "berryHeal" }
  | { kind: "statusOrb"; inflicts: StatusCondition }
  | { kind: "assaultVest" }
  | { kind: "heavyDutyBoots" }
  | { kind: "other"; tag: string };

// ── Synergy Types ──

export type SynergyRule = {
  id: string;
  requires: {
    abilityKind?: AbilityEffect["kind"][];
    moveKind?: MoveEffect["kind"][];
    minMoveMatches?: number;
    itemKind?: ItemEffect["kind"][];
  };
  score: number;
  tag: string;
  explanation: string;
};

export type SynergyMatch = {
  ruleId: string;
  score: number;
  tag: string;
  explanation: string;
};

// ── Helpers ──

export function toPowerBand(power: number): PowerBand {
  if (power <= 40) return 1;
  if (power <= 65) return 2;
  if (power <= 85) return 3;
  if (power <= 110) return 4;
  return 5;
}

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
