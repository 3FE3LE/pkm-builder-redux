import type { StatSpread } from "@/lib/teamAnalysis";
import type { EditableMember } from "@/lib/builderStore/types";

const DEFAULT_IVS: StatSpread = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};

const DEFAULT_EVS: StatSpread = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};

export function createEditable(species = "", locked = false): EditableMember {
  return {
    id: crypto.randomUUID(),
    species,
    nickname: species,
    locked,
    shiny: false,
    level: 5,
    gender: "unknown",
    nature: "Serious",
    ability: "",
    item: "",
    moves: [],
    ivs: { ...DEFAULT_IVS },
    evs: { ...DEFAULT_EVS },
  };
}
