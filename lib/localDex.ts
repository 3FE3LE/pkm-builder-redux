import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { GiftPokemon, ItemLocation, ItemShop, TradePokemon, WildArea } from "@/lib/docsSchema";

const DATA_DIR = path.join(process.cwd(), "data", "local-dex");
const REFERENCE_DIR = path.join(process.cwd(), "data", "reference");

type PokemonIndex = Record<string, unknown>;
type MoveIndex = Record<string, unknown>;
type ItemIndex = Record<string, unknown>;
type AbilityIndex = Record<string, unknown>;
type SpeciesList = Array<{ name: string; slug: string; dex: number; types: string[] }>;
type DexList = Array<{
  dex: number;
  name: string;
  slug: string;
  types: string[];
  abilities: string[];
  isLegendaryOrUnique?: boolean;
  hasTypeChanges: boolean;
  hasStatChanges: boolean;
  hasAbilityChanges: boolean;
}>;
type DexDocs = {
  wildAreas: WildArea[];
  gifts: GiftPokemon[];
  trades: TradePokemon[];
  itemLocations: ItemLocation[];
  itemShops?: ItemShop[];
};
export type PokemonAbilitySlots = {
  regular: string[];
  hidden: string[];
};

let pokemonIndexCache: PokemonIndex | null = null;
let canonicalPokemonIndexCache: PokemonIndex | null = null;
let canonicalPokemonReferenceCache: Record<string, any> | null = null;
let moveIndexCache: MoveIndex | null = null;
let itemIndexCache: ItemIndex | null = null;
let abilityIndexCache: AbilityIndex | null = null;
let speciesListCache: SpeciesList | null = null;
let dexListCache: DexList | null = null;
let dexDocsCache: DexDocs | null = null;
let reduxOverridesCache: Record<string, any> | null = null;
let pokemonAbilitySlotsCache: Map<string, PokemonAbilitySlots> | null = null;
let localDexDataVersionCache: string | null = null;

const GEN5_PRE_FAIRY_TYPES: Record<string, string[]> = {
  cleffa: ["Normal"],
  clefairy: ["Normal"],
  clefable: ["Normal"],
  igglybuff: ["Normal"],
  jigglypuff: ["Normal"],
  wigglytuff: ["Normal"],
  togepi: ["Normal"],
  togetic: ["Normal", "Flying"],
  togekiss: ["Normal", "Flying"],
  azurill: ["Normal"],
  marill: ["Water"],
  azumarill: ["Water"],
  "mime-jr": ["Psychic"],
  "mime-jr.": ["Psychic"],
  "mr-mime": ["Psychic"],
  "mr-mime.": ["Psychic"],
  snubbull: ["Normal"],
  granbull: ["Normal"],
  ralts: ["Psychic"],
  kirlia: ["Psychic"],
  gardevoir: ["Psychic"],
  mawile: ["Steel"],
  cottonee: ["Grass"],
  whimsicott: ["Grass"],
};

const LOCAL_DEX_VERSION_FILES = [
  path.join(DATA_DIR, "pokemon-index.json"),
  path.join(DATA_DIR, "species-list.json"),
  path.join(DATA_DIR, "dex-list.json"),
  path.join(DATA_DIR, "dex-docs.json"),
  path.join(DATA_DIR, "move-index.json"),
  path.join(DATA_DIR, "item-index.json"),
  path.join(DATA_DIR, "ability-index.json"),
  path.join(REFERENCE_DIR, "pokemon-canonical-gen5.json"),
  path.join(REFERENCE_DIR, "pokemon-redux-overrides-gen5.json"),
  path.join(REFERENCE_DIR, "pokemon-canonical-learnsets-gen5.json"),
  path.join(REFERENCE_DIR, "moves-canonical.json"),
  path.join(REFERENCE_DIR, "items-canonical.json"),
  path.join(REFERENCE_DIR, "item-redux-overrides.json"),
  path.join(REFERENCE_DIR, "abilities-canonical.json"),
  path.join(REFERENCE_DIR, "ability-redux-overrides.json"),
] as const;

function getFileVersionPart(filePath: string) {
  if (!existsSync(filePath)) {
    return `${filePath}:missing`;
  }

  const stats = statSync(filePath);
  return `${filePath}:${stats.mtimeMs}:${stats.size}`;
}

export function getLocalDexDataVersion() {
  return LOCAL_DEX_VERSION_FILES.map(getFileVersionPart).join("|");
}

function resetLocalDexCaches() {
  pokemonIndexCache = null;
  canonicalPokemonIndexCache = null;
  canonicalPokemonReferenceCache = null;
  moveIndexCache = null;
  itemIndexCache = null;
  abilityIndexCache = null;
  speciesListCache = null;
  dexListCache = null;
  dexDocsCache = null;
  reduxOverridesCache = null;
  pokemonAbilitySlotsCache = null;
}

function ensureLocalDexCachesFresh() {
  const nextVersion = getLocalDexDataVersion();
  if (localDexDataVersionCache === nextVersion) {
    return;
  }

  localDexDataVersionCache = nextVersion;
  resetLocalDexCaches();
}

function sortSpeciesList(list: SpeciesList) {
  return [...list].sort((left, right) => left.dex - right.dex || left.name.localeCompare(right.name));
}

function readJson(fileName: string) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!existsSync(filePath)) {
    if (fileName === "species-list.json") {
      return [];
    }
    return {};
  }
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readReferenceJson(fileName: string) {
  const filePath = path.join(REFERENCE_DIR, fileName);
  if (!existsSync(filePath)) {
    return null;
  }
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function getReduxOverrides() {
  if (!reduxOverridesCache) {
    reduxOverridesCache =
      (readReferenceJson("pokemon-redux-overrides-gen5.json") as Record<string, any> | null) ?? {};
  }

  return reduxOverridesCache;
}

function getCanonicalPokemonReference() {
  if (!canonicalPokemonReferenceCache) {
    canonicalPokemonReferenceCache =
      (readReferenceJson("pokemon-canonical-gen5.json") as Record<string, any> | null) ?? {};
  }

  return canonicalPokemonReferenceCache;
}

function normalize(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-");
}

function dedupeAbilityNames(values: string[] = []) {
  const seen = new Set<string>();
  const next: string[] = [];

  values.forEach((value) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed || trimmed === "-") {
      return;
    }
    const key = normalize(trimmed);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    next.push(trimmed);
  });

  return next;
}

function sanitizeAbilityNames(values: string[] = []) {
  return values
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0 && value !== "-");
}

function partitionAbilitySlots(rawAbilities: string[] = [], availableAbilities?: string[]): PokemonAbilitySlots {
  const available =
    availableAbilities && availableAbilities.length
      ? dedupeAbilityNames(availableAbilities)
      : dedupeAbilityNames(rawAbilities);
  const availableKeys = new Set(available.map((ability) => normalize(ability)));

  const filterAvailable = (values: string[]) =>
    dedupeAbilityNames(values).filter((ability) => availableKeys.has(normalize(ability)));

  if (rawAbilities.length >= 3) {
    return {
      regular: filterAvailable(rawAbilities.slice(0, 2)),
      hidden: filterAvailable(rawAbilities.slice(2, 3)),
    };
  }

  if (rawAbilities.length === 2) {
    return {
      regular: filterAvailable(rawAbilities.slice(0, 1)),
      hidden: filterAvailable(rawAbilities.slice(1, 2)),
    };
  }

  return {
    regular: filterAvailable(rawAbilities.slice(0, 1)),
    hidden: [],
  };
}

function mergeMachines(canonical: any[] = [], redux: any[] = []) {
  return Array.from(
    new Map(
      [...canonical, ...redux].map((entry) => [
        `${entry.tab ?? "tm"}:${entry.source ?? ""}:${normalize(entry.move ?? "")}`,
        entry,
      ])
    ).values()
  );
}

function mergePokemonIndexes(
  fallbackIndex: Record<string, any>,
  localIndex: Record<string, any>,
) {
  if (!Object.keys(fallbackIndex).length) {
    return localIndex;
  }

  const merged = { ...fallbackIndex };

  for (const [key, localEntry] of Object.entries(localIndex)) {
    const fallbackEntry = fallbackIndex[key];
    merged[key] = fallbackEntry
      ? {
          ...fallbackEntry,
          ...localEntry,
          // Core dex/battle data must come from the fallback index because it is
          // rebuilt from canonical data plus Redux overrides. Local JSON can lag behind.
          types: fallbackEntry.types ?? localEntry.types ?? [],
          abilities: fallbackEntry.abilities ?? localEntry.abilities ?? [],
          stats: fallbackEntry.stats ?? localEntry.stats ?? null,
          learnsets: fallbackEntry.learnsets ?? localEntry.learnsets ?? null,
          nextEvolutions: localEntry.nextEvolutions ?? fallbackEntry.nextEvolutions ?? [],
          evolutionDetails: localEntry.evolutionDetails ?? fallbackEntry.evolutionDetails ?? [],
        }
      : localEntry;
  }

  return merged;
}

const SYNTHETIC_FORM_ENTRIES = {
  "deoxys-attack": {
    id: 10001,
    dex: 386,
    slug: "deoxys-attack",
    name: "Deoxys-Attack",
    types: ["Psychic"],
    abilities: ["Pressure"],
    stats: { hp: 50, atk: 180, def: 20, spa: 180, spd: 20, spe: 150, bst: 600 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "deoxys-defense": {
    id: 10002,
    dex: 386,
    slug: "deoxys-defense",
    name: "Deoxys-Defense",
    types: ["Psychic"],
    abilities: ["Pressure"],
    stats: { hp: 50, atk: 70, def: 160, spa: 70, spd: 160, spe: 90, bst: 600 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "deoxys-speed": {
    id: 10003,
    dex: 386,
    slug: "deoxys-speed",
    name: "Deoxys-Speed",
    types: ["Psychic"],
    abilities: ["Pressure"],
    stats: { hp: 50, atk: 95, def: 90, spa: 95, spd: 90, spe: 180, bst: 600 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "wormadam-sandy": {
    id: 10004,
    dex: 413,
    slug: "wormadam-sandy",
    name: "Wormadam-Sandy",
    types: ["Bug", "Ground"],
    abilities: ["Anticipation", "Overcoat"],
    stats: { hp: 60, atk: 79, def: 105, spa: 59, spd: 85, spe: 36, bst: 424 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "wormadam-trash": {
    id: 10005,
    dex: 413,
    slug: "wormadam-trash",
    name: "Wormadam-Trash",
    types: ["Bug", "Steel"],
    abilities: ["Anticipation", "Overcoat"],
    stats: { hp: 60, atk: 69, def: 95, spa: 69, spd: 95, spe: 36, bst: 424 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "shaymin-sky": {
    id: 10006,
    dex: 492,
    slug: "shaymin-sky",
    name: "Shaymin-Sky",
    types: ["Grass", "Flying"],
    abilities: ["Serene Grace"],
    stats: { hp: 100, atk: 103, def: 75, spa: 120, spd: 75, spe: 127, bst: 600 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "giratina-origin": {
    id: 10007,
    dex: 487,
    slug: "giratina-origin",
    name: "Giratina-Origin",
    types: ["Ghost", "Dragon"],
    abilities: ["Levitate"],
    stats: { hp: 150, atk: 120, def: 100, spa: 120, spd: 100, spe: 90, bst: 680 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  darmanitan: {
    id: 555,
    dex: 555,
    slug: "darmanitan",
    name: "Darmanitan",
    types: ["Fire"],
    abilities: ["Sheer Force", "Zen Mode"],
    stats: {
      hp: 105,
      atk: 140,
      def: 55,
      spa: 30,
      spd: 55,
      spe: 95,
      bst: 480,
    },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "darmanitan-zen": {
    id: 10017,
    dex: 555,
    slug: "darmanitan-zen",
    name: "Darmanitan-Zen",
    types: ["Fire", "Psychic"],
    abilities: ["Zen Mode"],
    stats: {
      hp: 105,
      atk: 30,
      def: 105,
      spa: 140,
      spd: 105,
      spe: 55,
      bst: 540,
    },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "rotom-heat": {
    id: 10008,
    dex: 479,
    slug: "rotom-heat",
    name: "Rotom-Heat",
    types: ["Electric", "Fire"],
    abilities: ["Levitate"],
    stats: { hp: 50, atk: 65, def: 107, spa: 105, spd: 107, spe: 86, bst: 520 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "rotom-wash": {
    id: 10009,
    dex: 479,
    slug: "rotom-wash",
    name: "Rotom-Wash",
    types: ["Electric", "Water"],
    abilities: ["Levitate"],
    stats: { hp: 50, atk: 65, def: 107, spa: 105, spd: 107, spe: 86, bst: 520 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "rotom-frost": {
    id: 10010,
    dex: 479,
    slug: "rotom-frost",
    name: "Rotom-Frost",
    types: ["Electric", "Ice"],
    abilities: ["Levitate"],
    stats: { hp: 50, atk: 65, def: 107, spa: 105, spd: 107, spe: 86, bst: 520 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "rotom-fan": {
    id: 10011,
    dex: 479,
    slug: "rotom-fan",
    name: "Rotom-Fan",
    types: ["Electric", "Flying"],
    abilities: ["Levitate"],
    stats: { hp: 50, atk: 65, def: 107, spa: 105, spd: 107, spe: 86, bst: 520 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "rotom-mow": {
    id: 10012,
    dex: 479,
    slug: "rotom-mow",
    name: "Rotom-Mow",
    types: ["Electric", "Grass"],
    abilities: ["Levitate"],
    stats: { hp: 50, atk: 65, def: 107, spa: 105, spd: 107, spe: 86, bst: 520 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "castform-sunny": {
    id: 10013,
    dex: 351,
    slug: "castform-sunny",
    name: "Castform-Sunny",
    types: ["Fire"],
    abilities: ["Forecast"],
    stats: { hp: 70, atk: 70, def: 70, spa: 70, spd: 70, spe: 70, bst: 420 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "castform-rainy": {
    id: 10014,
    dex: 351,
    slug: "castform-rainy",
    name: "Castform-Rainy",
    types: ["Water"],
    abilities: ["Forecast"],
    stats: { hp: 70, atk: 70, def: 70, spa: 70, spd: 70, spe: 70, bst: 420 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "castform-snowy": {
    id: 10015,
    dex: 351,
    slug: "castform-snowy",
    name: "Castform-Snowy",
    types: ["Ice"],
    abilities: ["Forecast"],
    stats: { hp: 70, atk: 70, def: 70, spa: 70, spd: 70, spe: 70, bst: 420 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "basculin-blue-striped": {
    id: 10016,
    dex: 550,
    slug: "basculin-blue-striped",
    name: "Basculin-Blue-Striped",
    types: ["Water"],
    abilities: ["Reckless", "Adaptability", "Mold Breaker"],
    stats: { hp: 70, atk: 92, def: 65, spa: 80, spd: 55, spe: 98, bst: 460 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "tornadus-therian": {
    id: 10019,
    dex: 641,
    slug: "tornadus-therian",
    name: "Tornadus-Therian",
    types: ["Flying"],
    abilities: ["Regenerator"],
    stats: { hp: 79, atk: 100, def: 80, spa: 110, spd: 90, spe: 121, bst: 580 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "thundurus-therian": {
    id: 10020,
    dex: 642,
    slug: "thundurus-therian",
    name: "Thundurus-Therian",
    types: ["Electric", "Flying"],
    abilities: ["Volt Absorb"],
    stats: { hp: 79, atk: 105, def: 70, spa: 145, spd: 80, spe: 101, bst: 580 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "landorus-therian": {
    id: 10021,
    dex: 645,
    slug: "landorus-therian",
    name: "Landorus-Therian",
    types: ["Ground", "Flying"],
    abilities: ["Intimidate"],
    stats: { hp: 89, atk: 145, def: 90, spa: 105, spd: 80, spe: 91, bst: 600 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "meloetta-pirouette": {
    id: 10018,
    dex: 648,
    slug: "meloetta-pirouette",
    name: "Meloetta-Pirouette",
    types: ["Normal", "Fighting"],
    abilities: ["Serene Grace"],
    stats: { hp: 100, atk: 128, def: 90, spa: 77, spd: 77, spe: 128, bst: 600 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "kyurem-black": {
    id: 10022,
    dex: 646,
    slug: "kyurem-black",
    name: "Kyurem-Black",
    types: ["Dragon", "Ice"],
    abilities: ["Teravolt"],
    stats: { hp: 125, atk: 170, def: 100, spa: 120, spd: 90, spe: 95, bst: 700 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "kyurem-white": {
    id: 10023,
    dex: 646,
    slug: "kyurem-white",
    name: "Kyurem-White",
    types: ["Dragon", "Ice"],
    abilities: ["Turboblaze"],
    stats: { hp: 125, atk: 120, def: 90, spa: 170, spd: 100, spe: 95, bst: 700 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
  "keldeo-resolute": {
    id: 10024,
    dex: 647,
    slug: "keldeo-resolute",
    name: "Keldeo-Resolute",
    types: ["Water", "Fighting"],
    abilities: ["Justified"],
    stats: { hp: 91, atk: 72, def: 90, spa: 129, spd: 90, spe: 108, bst: 580 },
    nextEvolutions: [],
    evolutionDetails: [],
  },
} satisfies Record<string, any>;

const BASE_FORM_SUFFIXES = [
  { name: /\s+standard$/i, slug: /-standard$/i },
  { name: /\s+incarnate$/i, slug: /-incarnate$/i },
  { name: /\s+normal$/i, slug: /-normal$/i },
  { name: /\s+plant$/i, slug: /-plant$/i },
  { name: /\s+land$/i, slug: /-land$/i },
  { name: /\s+altered$/i, slug: /-altered$/i },
  { name: /\s+red-striped$/i, slug: /-red-striped$/i },
  { name: /\s+red striped$/i, slug: /-red-striped$/i },
  { name: /\s+aria$/i, slug: /-aria$/i },
  { name: /\s+ordinary$/i, slug: /-ordinary$/i },
] as const;

export function getLocalPokemonIndex(): PokemonIndex {
  ensureLocalDexCachesFresh();
  if (!pokemonIndexCache) {
    const localIndex = readJson("pokemon-index.json");
    const canonical = getCanonicalPokemonReference();
    const reduxOverrides = getReduxOverrides();
    const canonicalLearnsets =
      (readReferenceJson("pokemon-canonical-learnsets-gen5.json") as Record<string, any> | null) ?? {};
    const fallbackIndex = canonical ? buildPokemonIndex(canonical, reduxOverrides, canonicalLearnsets) : {};

    pokemonIndexCache = Object.keys(localIndex).length
      ? mergePokemonIndexes(fallbackIndex, localIndex as Record<string, any>)
      : fallbackIndex;
  }
  return pokemonIndexCache ?? {};
}

export function getCanonicalPokemonIndex(): PokemonIndex {
  ensureLocalDexCachesFresh();
  if (!canonicalPokemonIndexCache) {
    const canonical = getCanonicalPokemonReference();
    const canonicalLearnsets =
      (readReferenceJson("pokemon-canonical-learnsets-gen5.json") as Record<string, any> | null) ?? {};
    canonicalPokemonIndexCache = canonical ? buildPokemonIndex(canonical, null, canonicalLearnsets) : {};
  }
  return canonicalPokemonIndexCache ?? {};
}

export function getHistoricalCanonicalTypes(canonicalPokemon: {
  name?: string;
  slug?: string;
  types?: string[];
} | null | undefined) {
  const normalizedName = normalize(canonicalPokemon?.name ?? "");
  const normalizedSlug = normalize(canonicalPokemon?.slug ?? "");
  const legacyTypes =
    GEN5_PRE_FAIRY_TYPES[normalizedSlug] ??
    GEN5_PRE_FAIRY_TYPES[normalizedName];

  if (legacyTypes) {
    return legacyTypes;
  }

  return canonicalPokemon?.types ?? [];
}

export function getLocalMoveIndex(): MoveIndex {
  ensureLocalDexCachesFresh();
  if (!moveIndexCache) {
    const localIndex = readJson("move-index.json");
    const canonicalIndex = (readReferenceJson("moves-canonical.json") as MoveIndex | null) ?? {};
    moveIndexCache = Object.keys(localIndex).length
      ? {
          ...canonicalIndex,
          ...localIndex,
        }
      : canonicalIndex;
  }
  return moveIndexCache ?? {};
}

export function getLocalItemIndex(): ItemIndex {
  ensureLocalDexCachesFresh();
  if (!itemIndexCache) {
    const localIndex = readJson("item-index.json");
    if (Object.keys(localIndex).length) {
      itemIndexCache = localIndex;
    } else {
      const canonical = (readReferenceJson("items-canonical.json") as Record<string, any> | null) ?? {};
      const overrides = (readReferenceJson("item-redux-overrides.json") as Record<string, any> | null) ?? {};
      itemIndexCache = Object.fromEntries(
        Object.entries(canonical).map(([key, entry]) => [
          key,
          {
            ...entry,
            ...(overrides[key] ?? {}),
          },
        ])
      );

      for (const [key, entry] of Object.entries(overrides)) {
        if (!(key in itemIndexCache)) {
          itemIndexCache[key] = entry;
        }
      }
    }
  }
  return itemIndexCache ?? {};
}

export function getLocalAbilityIndex(): AbilityIndex {
  ensureLocalDexCachesFresh();
  if (!abilityIndexCache) {
    const localIndex = readJson("ability-index.json");
    if (Object.keys(localIndex).length) {
      abilityIndexCache = localIndex;
    } else {
      const canonical = (readReferenceJson("abilities-canonical.json") as Record<string, any> | null) ?? {};
      const overrides = (readReferenceJson("ability-redux-overrides.json") as Record<string, any> | null) ?? {};
      abilityIndexCache = Object.fromEntries(
        Object.entries(canonical).map(([key, entry]) => [
          key,
          {
            ...entry,
            ...(overrides[key] ?? {}),
          },
        ])
      );

      for (const [key, entry] of Object.entries(overrides)) {
        if (!(key in abilityIndexCache)) {
          abilityIndexCache[key] = entry;
        }
      }
    }
  }
  return abilityIndexCache ?? {};
}

export function getLocalSpeciesList(): SpeciesList {
  ensureLocalDexCachesFresh();
  if (!speciesListCache) {
    const localList = readJson("species-list.json");
    const hasCompleteShape =
      Array.isArray(localList) &&
      localList.every(
        (entry) =>
          entry &&
          typeof entry.name === "string" &&
          typeof entry.slug === "string" &&
          typeof entry.dex === "number" &&
          Array.isArray(entry.types),
      );

    if (hasCompleteShape && localList.length) {
      speciesListCache = sortSpeciesList(localList);
    } else {
      const localPokemonIndex = readJson("pokemon-index.json") as Record<string, any>;
      if (Object.keys(localPokemonIndex).length) {
        speciesListCache = sortSpeciesList(
          Array.from(
            new Map(
              Object.values(localPokemonIndex).map((entry: any) => {
                const name = normalizeDexCatalogName(entry.name);
                const slug = normalizeDexCatalogSlug(entry.slug ?? entry.name);

                return [
                  slug,
                  {
                    name,
                    slug,
                    dex: entry.dex ?? entry.id ?? 0,
                    types: entry.types ?? [],
                  },
                ] as const;
              }),
            ).values(),
          ),
        );
      } else {
        const canonical = getCanonicalPokemonReference();
        speciesListCache = canonical
          ? sortSpeciesList(
              Array.from(
                new Map(
                  Object.values(canonical).map((entry: any) => {
                    const name = normalizeDexCatalogName(entry.name);
                    const slug = normalizeDexCatalogSlug(entry.slug ?? entry.name);

                    return [
                      slug,
                      {
                        name,
                        slug,
                        dex: entry.dex ?? entry.id ?? 0,
                        types: reduxOverridesTypes(entry, canonical),
                      },
                    ] as const;
                  }),
                ).values(),
              ),
            )
          : [];
      }
    }
  }
  return speciesListCache ?? [];
}

export function getLocalDexDocs(): DexDocs {
  ensureLocalDexCachesFresh();
  if (!dexDocsCache) {
    const localDocs = readJson("dex-docs.json") as Partial<DexDocs>;
    dexDocsCache = {
      wildAreas: Array.isArray(localDocs?.wildAreas) ? localDocs.wildAreas : [],
      gifts: Array.isArray(localDocs?.gifts) ? localDocs.gifts : [],
      trades: Array.isArray(localDocs?.trades) ? localDocs.trades : [],
      itemLocations: Array.isArray(localDocs?.itemLocations)
        ? localDocs.itemLocations
        : Array.isArray((localDocs as any)?.locations)
          ? (localDocs as any).locations
          : [],
      itemShops: Array.isArray(localDocs?.itemShops) ? localDocs.itemShops : [],
    };
  }

  return dexDocsCache;
}

export function getLocalDexList(): DexList {
  ensureLocalDexCachesFresh();
  if (!dexListCache) {
    const localDexList = readJson("dex-list.json");
    if (
      Array.isArray(localDexList) &&
      localDexList.every(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          typeof entry.name === "string" &&
          typeof entry.slug === "string" &&
          typeof entry.dex === "number",
      )
    ) {
      dexListCache = localDexList as DexList;
      return dexListCache;
    }

    const speciesList = getLocalSpeciesList();
    const localPokemonIndex = getLocalPokemonIndex() as Record<string, any>;
    const canonical = getCanonicalPokemonReference();

    dexListCache = speciesList.map((species) => {
      const localPokemon =
        localPokemonIndex[normalize(species.slug)] ??
        localPokemonIndex[normalize(species.name)] ??
        null;
      const canonicalPokemon =
        canonical[String(species.dex).padStart(3, "0")] ??
        canonical[normalize(species.slug)] ??
        canonical[normalize(species.name)] ??
        null;
      const currentTypes = species.types ?? [];
      const currentAbilities =
        localPokemon?.abilities ??
        canonicalPokemon?.abilities ??
        [];
      const currentStats =
        localPokemon?.stats ??
        canonicalPokemon?.stats ??
        null;

      return {
        dex: species.dex,
        name: species.name,
        slug: species.slug,
        types: currentTypes,
        abilities: currentAbilities,
        hasTypeChanges: !sameStringList(
          currentTypes,
          getHistoricalCanonicalTypes(canonicalPokemon),
        ),
        hasStatChanges: !sameStats(
          currentStats,
          canonicalPokemon?.stats ?? null,
        ),
        hasAbilityChanges: !sameStringList(
          currentAbilities,
          canonicalPokemon?.abilities ?? [],
        ),
      };
    });
  }

  return dexListCache;
}

export function getPokemonAbilitySlots(speciesOrSlug: string): PokemonAbilitySlots {
  ensureLocalDexCachesFresh();
  const normalizedKey = normalize(speciesOrSlug);
  if (!pokemonAbilitySlotsCache) {
    pokemonAbilitySlotsCache = new Map();
  }
  const cached = pokemonAbilitySlotsCache.get(normalizedKey);
  if (cached) {
    return cached;
  }

  const localPokemonIndex = getLocalPokemonIndex() as Record<string, any>;
  const canonical = getCanonicalPokemonReference();
  const overrides = getReduxOverrides();

  const localPokemon =
    localPokemonIndex[normalizedKey] ??
    localPokemonIndex[normalize(speciesOrSlug)] ??
    null;

  const canonicalPokemon =
    canonical[String(localPokemon?.dex ?? "").padStart(3, "0")] ??
    canonical[normalize(localPokemon?.slug ?? "")] ??
    canonical[normalize(localPokemon?.name ?? "")] ??
    canonical[normalizedKey] ??
    null;

  const override =
    overrides[normalize(localPokemon?.slug ?? "")] ??
    overrides[normalize(localPokemon?.name ?? "")] ??
    overrides[normalizedKey] ??
    null;

  const rawAbilities = dedupeAbilityNames(
    localPokemon?.abilities ?? [],
  );
  const rawSlots = sanitizeAbilityNames(
    override?.complete?.abilities ??
      canonicalPokemon?.abilities ??
      localPokemon?.abilities ??
      [],
  );
  const availableAbilities = dedupeAbilityNames(localPokemon?.abilities ?? rawAbilities);
  const slots = partitionAbilitySlots(rawSlots, availableAbilities);

  if (!slots.regular.length && !slots.hidden.length && availableAbilities.length) {
    const fallbackSlots = availableAbilities.length >= 2
      ? {
          regular: availableAbilities.slice(0, 1),
          hidden: availableAbilities.slice(1),
        }
      : {
          regular: availableAbilities,
          hidden: [],
        };
    pokemonAbilitySlotsCache.set(normalizedKey, fallbackSlots);
    return fallbackSlots;
  }

  pokemonAbilitySlotsCache.set(normalizedKey, slots);
  return slots;
}

function sameStringList(left: string[] = [], right: string[] = []) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (value, index) => normalize(value) === normalize(right[index] ?? ""),
  );
}

function sameStats(
  left:
    | { hp?: number; atk?: number; def?: number; spa?: number; spd?: number; spe?: number; bst?: number }
    | null
    | undefined,
  right:
    | { hp?: number; atk?: number; def?: number; spa?: number; spd?: number; spe?: number; bst?: number }
    | null
    | undefined,
) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function reduxOverridesTypes(entry: any, canonical: Record<string, any> | null) {
  const overrides = getReduxOverrides();
  const key = normalize(entry.slug ?? entry.name);
  return overrides[key]?.complete?.types ?? canonical?.[String(entry.dex).padStart(3, "0")]?.types ?? entry.types ?? [];
}

function buildPokemonIndex(
  canonical: Record<string, any>,
  reduxOverrides: Record<string, any> | null,
  canonicalLearnsets: Record<string, any>,
) {
  const index: Record<string, any> = {};

  for (const entry of Object.values(canonical)) {
    const key = normalize(entry.slug ?? entry.name);
    const hydrated = {
      ...entry,
      types: reduxOverrides?.[key]?.complete?.types ?? entry.types,
      stats: reduxOverrides?.[key]?.complete?.stats ?? entry.stats,
      abilities: reduxOverrides?.[key]?.complete?.abilities ?? entry.abilities,
      learnsets: (() => {
        const canonicalEntryLearnsets = canonicalLearnsets[key] ?? {
          levelUp: [],
          machines: [],
        };
        const reduxLearnsets = reduxOverrides?.[key]?.learnsets ?? {
          levelUp: [],
          machines: [],
        };
        return {
          levelUp:
            reduxLearnsets.levelUp?.length > 0
              ? reduxLearnsets.levelUp
              : canonicalEntryLearnsets.levelUp ?? [],
          machines: mergeMachines(
            canonicalEntryLearnsets.machines ?? [],
            reduxLearnsets.machines ?? [],
          ),
        };
      })(),
    };

    index[key] = hydrated;

    const aliasCandidates = BASE_FORM_SUFFIXES.flatMap((suffix) => [
      normalize(String(entry.name ?? "").replace(suffix.name, "")),
      normalize(String(entry.slug ?? "").replace(suffix.slug, "")),
    ]);
    for (const alias of aliasCandidates) {
      if (alias && alias !== key && !index[alias]) {
        index[alias] = hydrated;
      }
    }
  }

  hydrateSyntheticForms(index);

  return index;
}

function hydrateSyntheticForms(index: Record<string, any>) {
  const copyBaseForm = (baseKey: string, syntheticKey: keyof typeof SYNTHETIC_FORM_ENTRIES) => {
    const base = index[baseKey];
    const synthetic = SYNTHETIC_FORM_ENTRIES[syntheticKey];
    if (!base || !synthetic) {
      return;
    }

    index[syntheticKey] = {
      ...base,
      ...synthetic,
      learnsets: base.learnsets,
    };
    index[normalize(synthetic.name)] = index[syntheticKey];
  };

  copyBaseForm("darmanitan", "darmanitan");
  copyBaseForm("darmanitan", "darmanitan-zen");
  copyBaseForm("deoxys", "deoxys-attack");
  copyBaseForm("deoxys", "deoxys-defense");
  copyBaseForm("deoxys", "deoxys-speed");
  copyBaseForm("wormadam", "wormadam-sandy");
  copyBaseForm("wormadam", "wormadam-trash");
  copyBaseForm("shaymin", "shaymin-sky");
  copyBaseForm("giratina", "giratina-origin");
  copyBaseForm("rotom", "rotom-heat");
  copyBaseForm("rotom", "rotom-wash");
  copyBaseForm("rotom", "rotom-frost");
  copyBaseForm("rotom", "rotom-fan");
  copyBaseForm("rotom", "rotom-mow");
  copyBaseForm("castform", "castform-sunny");
  copyBaseForm("castform", "castform-rainy");
  copyBaseForm("castform", "castform-snowy");
  copyBaseForm("basculin", "basculin-blue-striped");
  copyBaseForm("meloetta", "meloetta-pirouette");
  copyBaseForm("tornadus-incarnate", "tornadus-therian");
  copyBaseForm("thundurus-incarnate", "thundurus-therian");
  copyBaseForm("landorus-incarnate", "landorus-therian");
  copyBaseForm("kyurem", "kyurem-black");
  copyBaseForm("kyurem", "kyurem-white");
  copyBaseForm("keldeo", "keldeo-resolute");
}

function normalizeDexCatalogName(name: string) {
  return BASE_FORM_SUFFIXES.reduce(
    (value, suffix) => value.replace(suffix.name, ""),
    name,
  );
}

function normalizeDexCatalogSlug(slug: string) {
  return BASE_FORM_SUFFIXES.reduce(
    (value, suffix) => value.replace(suffix.slug, ""),
    normalize(slug),
  );
}
