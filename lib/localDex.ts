import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { GiftPokemon, ItemLocation, TradePokemon, WildArea } from "@/lib/docsSchema";

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
  hasTypeChanges: boolean;
  hasStatChanges: boolean;
  hasAbilityChanges: boolean;
}>;
type DexDocs = {
  wildAreas: WildArea[];
  gifts: GiftPokemon[];
  trades: TradePokemon[];
  itemLocations: ItemLocation[];
};

let pokemonIndexCache: PokemonIndex | null = null;
let canonicalPokemonIndexCache: PokemonIndex | null = null;
let moveIndexCache: MoveIndex | null = null;
let itemIndexCache: ItemIndex | null = null;
let abilityIndexCache: AbilityIndex | null = null;
let speciesListCache: SpeciesList | null = null;
let dexListCache: DexList | null = null;
let dexDocsCache: DexDocs | null = null;

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

function normalize(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-");
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
  if (!pokemonIndexCache) {
    const localIndex = readJson("pokemon-index.json");
    const canonical = readReferenceJson("pokemon-canonical-gen5.json") as Record<string, any> | null;
    const reduxOverrides = readReferenceJson("pokemon-redux-overrides-gen5.json") as Record<string, any> | null;
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
  if (!canonicalPokemonIndexCache) {
    const canonical = readReferenceJson("pokemon-canonical-gen5.json") as Record<string, any> | null;
    const canonicalLearnsets =
      (readReferenceJson("pokemon-canonical-learnsets-gen5.json") as Record<string, any> | null) ?? {};
    canonicalPokemonIndexCache = canonical ? buildPokemonIndex(canonical, null, canonicalLearnsets) : {};
  }
  return canonicalPokemonIndexCache ?? {};
}

export function getLocalMoveIndex(): MoveIndex {
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
        const canonical = readReferenceJson("pokemon-canonical-gen5.json") as Record<string, any> | null;
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
  if (!dexDocsCache) {
    const localDocs = readJson("dex-docs.json") as Partial<DexDocs>;
    dexDocsCache = {
      wildAreas: Array.isArray(localDocs?.wildAreas) ? localDocs.wildAreas : [],
      gifts: Array.isArray(localDocs?.gifts) ? localDocs.gifts : [],
      trades: Array.isArray(localDocs?.trades) ? localDocs.trades : [],
      itemLocations: Array.isArray(localDocs?.itemLocations) ? localDocs.itemLocations : [],
    };
  }

  return dexDocsCache;
}

export function getLocalDexList(): DexList {
  if (!dexListCache) {
    const localList = readJson("dex-list.json");
    dexListCache = Array.isArray(localList) ? localList : [];
  }

  return dexListCache;
}

function reduxOverridesTypes(entry: any, canonical: Record<string, any> | null) {
  const overrides = (readReferenceJson("pokemon-redux-overrides-gen5.json") as Record<string, any> | null) ?? {};
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
