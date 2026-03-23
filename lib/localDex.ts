import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data", "local-dex");
const REFERENCE_DIR = path.join(process.cwd(), "data", "reference");

type PokemonIndex = Record<string, unknown>;
type MoveIndex = Record<string, unknown>;
type ItemIndex = Record<string, unknown>;
type AbilityIndex = Record<string, unknown>;
type SpeciesList = Array<{ name: string; slug: string; dex: number; types: string[] }>;

let pokemonIndexCache: PokemonIndex | null = null;
let moveIndexCache: MoveIndex | null = null;
let itemIndexCache: ItemIndex | null = null;
let abilityIndexCache: AbilityIndex | null = null;
let speciesListCache: SpeciesList | null = null;

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

const SYNTHETIC_FORM_ENTRIES = {
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
} satisfies Record<string, any>;

export function getLocalPokemonIndex(): PokemonIndex {
  if (!pokemonIndexCache) {
    const localIndex = readJson("pokemon-index.json");
    if (Object.keys(localIndex).length) {
      pokemonIndexCache = localIndex;
    } else {
      const canonical = readReferenceJson("pokemon-canonical-gen5.json") as Record<string, any> | null;
      const reduxOverrides = readReferenceJson("pokemon-redux-overrides-gen5.json") as Record<string, any> | null;
      const canonicalLearnsets =
        (readReferenceJson("pokemon-canonical-learnsets-gen5.json") as Record<string, any> | null) ?? {};
      pokemonIndexCache = canonical ? buildPokemonIndex(canonical, reduxOverrides, canonicalLearnsets) : {};
    }
  }
  return pokemonIndexCache ?? {};
}

export function getLocalMoveIndex(): MoveIndex {
  if (!moveIndexCache) {
    const localIndex = readJson("move-index.json");
    if (Object.keys(localIndex).length) {
      moveIndexCache = localIndex;
    } else {
      moveIndexCache = (readReferenceJson("moves-canonical.json") as MoveIndex | null) ?? {};
    }
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
    if (localList.length) {
      speciesListCache = sortSpeciesList(localList);
    } else {
      const canonical = readReferenceJson("pokemon-canonical-gen5.json") as Record<string, any> | null;
      speciesListCache = canonical
        ? sortSpeciesList(
            [
              ...Object.values(canonical).map((entry: any) => ({
                name: entry.name,
                slug: normalize(entry.slug ?? entry.name),
                dex: entry.dex ?? entry.id ?? 0,
                types: reduxOverridesTypes(entry, canonical),
              })),
              ...Object.values(SYNTHETIC_FORM_ENTRIES).map((entry) => ({
                name: entry.name,
                slug: normalize(entry.slug ?? entry.name),
                dex: entry.dex ?? entry.id ?? 0,
                types: entry.types,
              })),
            ]
          )
        : [];
    }
  }
  return speciesListCache ?? [];
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

    const standardNameAlias = normalize(String(entry.name ?? "").replace(/\s+standard$/i, ""));
    const standardSlugAlias = normalize(String(entry.slug ?? "").replace(/-standard$/i, ""));
    for (const alias of [standardNameAlias, standardSlugAlias]) {
      if (alias && alias !== key && !index[alias]) {
        index[alias] = hydrated;
      }
    }
  }

  const standardDarmanitan = index["darmanitan"] ?? index["darmanitan-standard"];
  if (standardDarmanitan) {
    index["darmanitan-zen"] = {
      ...standardDarmanitan,
      ...SYNTHETIC_FORM_ENTRIES["darmanitan-zen"],
      learnsets: standardDarmanitan.learnsets,
    };
    index["darmanitan zen"] = index["darmanitan-zen"];
  }

  return index;
}
