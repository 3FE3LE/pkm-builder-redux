import type { ParsedDocs } from "@/lib/docsSchema";
import type {
  FullStatKey as DomainFullStatKey,
  StatKey as DomainStatKey,
  StatSpread as DomainStatSpread,
  Stats,
} from "@/lib/domain/battle";
import { buildSpriteUrls, formatName, normalizeName, toTitleCase } from "@/lib/domain/names";
import type { PokemonGender } from "@/lib/builder";

export {
  buildSpriteUrls,
  formatName,
  normalizeName,
  toTitleCase,
} from "@/lib/domain/names";
export {
  TYPE_COLORS,
  TYPE_ORDER,
  TYPE_STYLES,
  getMultiplierBucket,
  getMultiplierLabel,
  getTypeEffectiveness,
} from "@/lib/domain/typeChart";
export type { MultiplierBucket } from "@/lib/domain/typeChart";
export {
  applyStatModifiers,
  buildAverageStats,
  buildCoverageSummary,
  buildDefensiveSections,
  buildDefensiveSummary,
  buildThreatSummary,
  calculateEffectiveStats,
  getNatureEffect,
  getStatModifiers,
} from "@/lib/domain/battle";
export {
  applyMovePowerModifiers,
  getHiddenPowerResult,
  getMovePowerModifiers,
  normalizeMoveLookupName,
  resolveMovePower,
  resolveMoveType,
} from "@/lib/domain/moves";

export type RemotePokemon = {
  id: number;
  name: string;
  types: string[];
  stats: Stats;
  abilities: string[];
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
  supportsGender: boolean;
  dexNumber?: number;
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
    description?: string;
  }[];
};

function formatLocationName(input: string) {
  return input
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((segment) => {
      if (segment.length <= 3) {
        return segment.toUpperCase();
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join(" ");
}

const GENDERLESS_SPECIES = new Set(
  [
    "Magnemite",
    "Magneton",
    "Magnezone",
    "Voltorb",
    "Electrode",
    "Staryu",
    "Starmie",
    "Porygon",
    "Porygon2",
    "Porygon-Z",
    "Beldum",
    "Metang",
    "Metagross",
    "Baltoy",
    "Claydol",
    "Bronzor",
    "Bronzong",
    "Klink",
    "Klang",
    "Klinklang",
    "Golett",
    "Golurk",
    "Cryogonal",
    "Ditto",
    "Rotom",
    "Shedinja",
    "Lunatone",
    "Solrock",
    "Unown",
    "Mewtwo",
    "Mew",
    "Articuno",
    "Zapdos",
    "Moltres",
    "Raikou",
    "Entei",
    "Suicune",
    "Lugia",
    "Ho-Oh",
    "Celebi",
    "Regirock",
    "Regice",
    "Registeel",
    "Latias",
    "Latios",
    "Kyogre",
    "Groudon",
    "Rayquaza",
    "Jirachi",
    "Deoxys",
    "Uxie",
    "Mesprit",
    "Azelf",
    "Dialga",
    "Palkia",
    "Heatran",
    "Regigigas",
    "Giratina",
    "Cresselia",
    "Phione",
    "Manaphy",
    "Darkrai",
    "Shaymin",
    "Arceus",
    "Victini",
    "Kobalion",
    "Terrakion",
    "Virizion",
    "Tornadus",
    "Thundurus",
    "Reshiram",
    "Zekrom",
    "Landorus",
    "Kyurem",
    "Meloetta",
    "Genesect",
  ].map(normalizeName),
);

export function supportsPokemonGender(species: string) {
  const normalized = normalizeName(species);
  return Boolean(normalized) && !GENDERLESS_SPECIES.has(normalized);
}

function formatCanonicalEvolutionMethod(detail: RemoteEvolutionDetail) {
  const parts: string[] = [];

  if (detail.item) {
    parts.push(detail.item);
  }
  if (detail.minLevel) {
    parts.push(`Lv ${detail.minLevel}`);
  }

  if (detail.trigger === "trade") {
    if (detail.tradeSpecies) {
      parts.push(`Trade for ${detail.tradeSpecies}`);
    } else if (detail.heldItem) {
      parts.push(`Trade + ${detail.heldItem}`);
    } else {
      parts.push("Trade");
    }
  } else if (detail.heldItem) {
    parts.push(`Hold ${detail.heldItem}`);
  }

  if (detail.minHappiness) {
    parts.push("Friendship");
  }
  if (detail.minBeauty) {
    parts.push(`Beauty ${detail.minBeauty}`);
  }
  if (detail.minAffection) {
    parts.push(`Affection ${detail.minAffection}`);
  }
  if (detail.knownMove) {
    parts.push(`Move: ${detail.knownMove}`);
  }
  if (detail.knownMoveType) {
    parts.push(`Know ${detail.knownMoveType} move`);
  }
  if (detail.partySpecies) {
    parts.push(`Party: ${detail.partySpecies}`);
  }
  if (detail.partyType) {
    parts.push(`Party ${detail.partyType}`);
  }

  if (detail.relativePhysicalStats === 1) {
    parts.push("Atk > Def");
  } else if (detail.relativePhysicalStats === 0) {
    parts.push("Atk = Def");
  } else if (detail.relativePhysicalStats === -1) {
    parts.push("Atk < Def");
  }

  if (detail.gender === 1) {
    parts.push("Female");
  } else if (detail.gender === 2) {
    parts.push("Male");
  }
  if (detail.timeOfDay) {
    parts.push(formatName(detail.timeOfDay));
  }
  if (detail.location) {
    parts.push(formatLocationName(detail.location));
  }
  if (detail.needsOverworldRain) {
    parts.push("Rain");
  }
  if (detail.turnUpsideDown) {
    parts.push("Upside-down");
  }

  if (!parts.length) {
    if (detail.trigger === "use-item") {
      return "Use item";
    }
    if (detail.trigger === "level-up") {
      return "Level up";
    }
    if (detail.trigger === "trade") {
      return "Trade";
    }
    return "Special";
  }

  return parts.join(" · ");
}

function buildDocumentedEvolutionDetail(change: { target: string; method: string }): RemoteEvolutionDetail {
  const detail: RemoteEvolutionDetail = {
    target: change.target,
    trigger: null,
    minLevel: null,
    item: null,
    heldItem: null,
    knownMove: null,
    knownMoveType: null,
    minHappiness: null,
    minBeauty: null,
    minAffection: null,
    partySpecies: null,
    partyType: null,
    tradeSpecies: null,
    timeOfDay: null,
    location: null,
    gender: null,
    relativePhysicalStats: null,
    needsOverworldRain: false,
    turnUpsideDown: false,
  };

  const method = change.method.trim();
  const levelMatch = method.match(/^Lv\s+(\d+)$/i);
  if (levelMatch) {
    detail.trigger = "level-up";
    detail.minLevel = Number(levelMatch[1]);
    return detail;
  }

  if (method.toLowerCase() === "normal method") {
    detail.trigger = "level-up";
    return detail;
  }

  if (/friendship/i.test(method)) {
    detail.trigger = "level-up";
    detail.minHappiness = 220;
    return detail;
  }

  const moveMatch = method.match(/^Move:\s+(.+)$/i);
  if (moveMatch) {
    detail.trigger = "level-up";
    detail.knownMove = moveMatch[1].trim();
    return detail;
  }

  const partyMatch = method.match(/^Party:\s+(.+)$/i);
  if (partyMatch) {
    detail.trigger = "level-up";
    detail.partySpecies = partyMatch[1].trim();
    return detail;
  }

  detail.trigger = "use-item";
  detail.item = method;
  return detail;
}

export function resolvePokemonProfile(
  docs: ParsedDocs,
  species: string,
  remote?: RemotePokemon,
): ResolvedTeamMember | undefined {
  const name = species.trim();
  if (!name) {
    return undefined;
  }

  const normalized = normalizeName(name);
  const profile = docs.pokemonProfiles.find((entry) => normalizeName(entry.species) === normalized);
  const typeChange = docs.typeChanges.find((entry) => normalizeName(entry.pokemon) === normalized);
  const types =
    profile?.types ??
    (typeChange ? typeChange.newType.split("/").map((value) => value.trim()) : undefined) ??
    remote?.types.map(toTitleCase) ??
    [];
  const stats = profile?.stats ?? remote?.stats;
  const dexNumber = profile?.dex ?? remote?.id;
  const abilities = Array.from(
    new Set([...(profile?.abilities ?? []), ...(remote?.abilities ?? [])]),
  );
  const sprites = buildSpriteUrls(profile?.species ?? remote?.name ?? name, dexNumber);

  const documentedEvolutionHints = docs.evolutionChanges
    .filter((entry) => normalizeName(entry.species) === normalized)
    .map((entry) => ({
      target: entry.target,
      method: entry.method,
      summary: entry.summary,
    }));

  const canonicalEvolutionDetails = remote?.evolutionDetails ?? [];
  const canonicalEvolutionHints =
    canonicalEvolutionDetails.map((detail) => {
      const target = formatName(detail.target);
      const method = formatCanonicalEvolutionMethod(detail);
      return {
        target,
        method,
        summary: `${target} evolves via ${method}.`,
      };
    });
  const documentedEvolutionDetails = documentedEvolutionHints.map(buildDocumentedEvolutionDetail);
  const nextEvolutions =
    (documentedEvolutionHints.length
      ? documentedEvolutionHints.map((entry) => formatName(entry.target))
      : remote?.nextEvolutions?.map(formatName)) ?? [];
  const effectiveEvolutionDetails =
    documentedEvolutionDetails.length > 0 ? documentedEvolutionDetails : canonicalEvolutionDetails;

  const evolutionHints = [
    ...documentedEvolutionHints,
    ...canonicalEvolutionHints.filter(
      (hint) =>
        !documentedEvolutionHints.some(
          (documentedHint) => normalizeName(documentedHint.target) === normalizeName(hint.target),
        ),
    ),
    ...nextEvolutions
      .filter(
        (target) =>
          !documentedEvolutionHints.some(
            (hint) => normalizeName(hint.target) === normalizeName(target),
          ) &&
          !canonicalEvolutionHints.some(
            (hint) => normalizeName(hint.target) === normalizeName(target),
          ),
      )
      .map((target) => ({
        target,
        method: "",
        summary: `${target} is the next evolution.`,
      })),
  ];

  return {
    key: normalized,
    species: profile?.species ?? remote?.name ?? formatName(name),
    supportsGender: supportsPokemonGender(profile?.species ?? remote?.name ?? name),
    dexNumber,
    spriteUrl: sprites.spriteUrl,
    animatedSpriteUrl: sprites.animatedSpriteUrl,
    resolvedTypes: types,
    resolvedStats: stats,
    abilities,
    nextEvolutions,
    evolutionDetails: effectiveEvolutionDetails,
    evolutionHints,
    learnsets: remote?.learnsets,
    moves: [],
  };
}
