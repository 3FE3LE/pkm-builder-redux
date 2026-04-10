import type { TypeName } from "../effects/types";
import { TYPE_ORDER } from "../typeChart";
import { getTypeEffectiveness } from "../typeChart";
import type { EncounterProfile, SpeedTier } from "./types";
import { toSpeedTier } from "./types";

type EncounterMon = {
  name: string;
  types: string[];
  stats?: { spe: number };
  moves?: { name: string; type?: string }[];
};

type EncounterInput = {
  id: string;
  label: string;
  team: EncounterMon[];
};

export function buildEncounterProfile(input: EncounterInput): EncounterProfile {
  const { id, label, team } = input;

  // Collect all threat types
  const threatTypeSet = new Set<TypeName>();
  for (const mon of team) {
    for (const t of mon.types) threatTypeSet.add(t as TypeName);
  }
  const threatTypes = Array.from(threatTypeSet);

  // Collect STAB types (types the opponent can hit with STAB)
  const stabTypeSet = new Set<TypeName>();
  for (const mon of team) {
    const monTypes = new Set(mon.types);
    for (const move of mon.moves ?? []) {
      if (move.type && monTypes.has(move.type)) {
        stabTypeSet.add(move.type as TypeName);
      }
    }
    // If no moves data, assume STAB from their types
    if (!mon.moves?.length) {
      for (const t of mon.types) stabTypeSet.add(t as TypeName);
    }
  }
  const threatSTABTypes = Array.from(stabTypeSet);

  // Speed analysis
  let maxSpeed = 0;
  for (const mon of team) {
    if (mon.stats?.spe && mon.stats.spe > maxSpeed) {
      maxSpeed = mon.stats.spe;
    }
  }
  const threatSpeedTier = toSpeedTier(maxSpeed);

  // Valuable offense types: what hits the encounter team super-effectively
  const valuableOffenseTypes: TypeName[] = [];
  for (const attackType of TYPE_ORDER) {
    let hitsAny = false;
    for (const mon of team) {
      const mult = getTypeEffectiveness(attackType, mon.types);
      if (mult > 1) {
        hitsAny = true;
        break;
      }
    }
    if (hitsAny) valuableOffenseTypes.push(attackType as TypeName);
  }

  // Valuable resist types: opponent STAB types we want to resist
  const valuableResistTypes = threatSTABTypes;

  return {
    id,
    label,
    threatTypes,
    threatSTABTypes,
    maxThreatSpeed: maxSpeed,
    threatSpeedTier,
    valuableOffenseTypes,
    valuableResistTypes,
  };
}
