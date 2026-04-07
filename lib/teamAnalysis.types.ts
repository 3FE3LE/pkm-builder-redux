import type { PokemonGender } from "@/lib/builder";
import type {
  FullStatKey as DomainFullStatKey,
  StatKey as DomainStatKey,
  StatSpread as DomainStatSpread,
  Stats,
} from "@/lib/domain/battle";

export type RemotePokemon = {
  id: number;
  name: string;
  types: string[];
  stats: Stats;
  abilities: string[];
  generation?: string | null;
  category?: string | null;
  height?: number | null;
  weight?: number | null;
  flavorText?: string | null;
  nextEvolutions?: string[];
  evolutionDetails?: RemoteEvolutionDetail[];
  learnsets?: {
    levelUp: {
      level: number;
      move: string;
      details?: RemoteMove | null;
    }[];
    machines: {
      source: string;
      move: string;
      tab: "tm" | "hm" | "tutor";
      machineNumber?: number | null;
      details?: RemoteMove | null;
    }[];
  };
};

export type RemoteEvolutionDetail = {
  target: string;
  trigger?: string | null;
  minLevel?: number | null;
  item?: string | null;
  heldItem?: string | null;
  knownMove?: string | null;
  knownMoveType?: string | null;
  minHappiness?: number | null;
  minBeauty?: number | null;
  minAffection?: number | null;
  partySpecies?: string | null;
  partyType?: string | null;
  tradeSpecies?: string | null;
  timeOfDay?: string | null;
  location?: string | null;
  gender?: number | null;
  relativePhysicalStats?: number | null;
  needsOverworldRain?: boolean;
  turnUpsideDown?: boolean;
};

export type RemoteMove = {
  name: string;
  type: string;
  damageClass: string;
  power?: number | null;
  accuracy?: number | null;
  pp?: number | null;
  priority?: number | null;
  description?: string;
};

export type RemoteItem = {
  name: string;
  category?: string;
  effect?: string;
  sprite?: string | null;
};

export type RemoteAbility = {
  name: string;
  generation?: string | null;
  effect?: string;
};

export type StatKey = DomainStatKey;
export type FullStatKey = DomainFullStatKey;
export type StatSpread = DomainStatSpread;

export type ResolvedTeamMember = {
  key: string;
  species: string;
  shiny?: boolean;
  supportsGender: boolean;
  dexNumber?: number;
  generation?: string | null;
  category?: string | null;
  height?: number | null;
  weight?: number | null;
  flavorText?: string | null;
  spriteUrl?: string;
  animatedSpriteUrl?: string;
  resolvedTypes: string[];
  resolvedStats?: RemotePokemon["stats"];
  summaryStats?: RemotePokemon["stats"];
  effectiveStats?: RemotePokemon["stats"];
  level?: number;
  gender?: PokemonGender;
  nature?: string;
  natureEffect?: {
    up?: StatKey;
    down?: StatKey;
  };
  statModifiers?: { source: string; stat: FullStatKey; multiplier: number; label: string }[];
  abilities: string[];
  nextEvolutions?: string[];
  evolutionDetails?: RemoteEvolutionDetail[];
  evolutionHints?: {
    target: string;
    method: string;
    summary: string;
  }[];
  item?: string;
  itemDetails?: RemoteItem | null;
  ability?: string;
  abilityDetails?: RemoteAbility | null;
  learnsets?: RemotePokemon["learnsets"];
  moves: {
    name: string;
    type?: string;
    hasStab?: boolean;
    damageClass?: string;
    power?: number | null;
    adjustedPower?: number | null;
    powerModifiers?: { source: string; multiplier: number; label: string }[];
    accuracy?: number | null;
    pp?: number | null;
    priority?: number | null;
    description?: string;
  }[];
};
