import { parseDocumentation } from "@/lib/docs";
import {
  getCanonicalPokemonIndex,
  getLocalAbilityIndex,
  getLocalDexDataVersion,
  getLocalDexDocs,
  getLocalDexList,
  getLocalItemIndex,
  getLocalMoveIndex,
  getLocalPokemonIndex,
  getLocalSpeciesList,
} from "@/lib/localDex";
import type { RemoteMove, RemotePokemon } from "@/lib/teamAnalysis";
import { getWorldData } from "@/lib/worldData";

function stripPokemonDexNotes(entry: RemotePokemon): RemotePokemon {
  return entry;
}

function normalizeSpeciesKey(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-");
}

function estimateJsonBytes(value: unknown) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function logDexServerPerf(
  label: string,
  timings: Record<string, number>,
  payload: unknown,
  counts: Record<string, number>,
) {
  console.info(`[perf:server:${label}]`, {
    timings,
    counts,
    payloadBytes: estimateJsonBytes(payload),
  });
}

let builderPageDataCache: { version: string; data: ReturnType<typeof buildBuilderPageData> } | null = null;
let dexPageDataCache: { version: string; data: ReturnType<typeof buildDexPageData> } | null = null;

function buildBuilderPageData() {
  const docs = parseDocumentation() as ReturnType<typeof parseDocumentation> & {
    worldData: ReturnType<typeof getWorldData>;
  };
  docs.worldData = getWorldData();

  const speciesCatalog = getLocalSpeciesList();
  const moveIndex = getLocalMoveIndex() as Record<string, RemoteMove>;
  const canonicalPokemonIndex = Object.fromEntries(
    Object.entries(getCanonicalPokemonIndex() as Record<string, RemotePokemon>).map(([key, entry]) => [
      key,
      stripPokemonDexNotes(entry),
    ]),
  ) as Record<string, RemotePokemon>;
  const pokemonIndex = Object.fromEntries(
    Object.entries(getLocalPokemonIndex() as Record<string, RemotePokemon>).map(([key, entry]) => [
      key,
      stripPokemonDexNotes(entry),
    ]),
  ) as Record<string, RemotePokemon>;
  const speciesOptions = speciesCatalog.map((entry) => entry.name);
  const abilityCatalog = Object.values(
    getLocalAbilityIndex() as Record<string, { name: string; effect?: string }>,
  ).sort((left, right) => left.name.localeCompare(right.name));
  const itemCatalog = Object.values(
    getLocalItemIndex() as Record<
      string,
      { name: string; category?: string; effect?: string; sprite?: string | null }
    >,
  ).sort((left, right) => left.name.localeCompare(right.name));
  const reduxBySpecies = Object.fromEntries(
    getLocalDexList().flatMap((entry) => {
      const value = {
        hasTypeChanges: entry.hasTypeChanges,
        hasAbilityChanges: entry.hasAbilityChanges,
        hasStatChanges: entry.hasStatChanges,
      };

      return [
        [normalizeSpeciesKey(entry.name), value],
        [normalizeSpeciesKey(entry.slug), value],
      ];
    }),
  ) as Record<
    string,
    {
      hasTypeChanges: boolean;
      hasAbilityChanges: boolean;
      hasStatChanges: boolean;
    }
  >;

  return {
    docs,
    speciesOptions,
    speciesCatalog,
    moveIndex,
    canonicalPokemonIndex,
    pokemonIndex,
    abilityCatalog,
    itemCatalog,
    reduxBySpecies,
  };
}

export function getBuilderPageData() {
  const version = getLocalDexDataVersion();
  if (!builderPageDataCache || builderPageDataCache.version !== version) {
    builderPageDataCache = {
      version,
      data: buildBuilderPageData(),
    };
  }

  return builderPageDataCache.data;
}

function buildDexPageData() {
  const dexDocs = getLocalDexDocs();
  const docs = {
    moveReplacements: [],
    moveTypeChanges: [],
    moveTypeOverrides: [],
    moveDetails: [],
    typeChanges: [],
    itemLocations: dexDocs.itemLocations,
    itemShops: dexDocs.itemShops ?? [],
    itemHighlights: [],
    gifts: dexDocs.gifts,
    trades: dexDocs.trades,
    wildAreas: dexDocs.wildAreas,
    pokemonProfiles: [],
    evolutionChanges: [],
  };
  const speciesCatalog = getLocalSpeciesList();
  const moveIndex = getLocalMoveIndex() as Record<string, RemoteMove>;
  const canonicalPokemonIndex = Object.fromEntries(
    Object.entries(getCanonicalPokemonIndex() as Record<string, RemotePokemon>).map(([key, entry]) => [
      key,
      stripPokemonDexNotes(entry),
    ]),
  ) as Record<string, RemotePokemon>;
  const pokemonIndex = Object.fromEntries(
    Object.entries(getLocalPokemonIndex() as Record<string, RemotePokemon>).map(([key, entry]) => [
      key,
      stripPokemonDexNotes(entry),
    ]),
  ) as Record<string, RemotePokemon>;
  const speciesOptions = speciesCatalog.map((entry) => entry.name);
  const abilityCatalog = Object.values(
    getLocalAbilityIndex() as Record<string, { name: string; effect?: string }>,
  ).sort((left, right) => left.name.localeCompare(right.name));
  const itemCatalog = Object.values(
    getLocalItemIndex() as Record<
      string,
      { name: string; category?: string; effect?: string; sprite?: string | null }
    >,
  ).sort((left, right) => left.name.localeCompare(right.name));
  const reduxBySpecies = Object.fromEntries(
    getLocalDexList().flatMap((entry) => {
      const value = {
        hasTypeChanges: entry.hasTypeChanges,
        hasAbilityChanges: entry.hasAbilityChanges,
        hasStatChanges: entry.hasStatChanges,
      };

      return [
        [normalizeSpeciesKey(entry.name), value],
        [normalizeSpeciesKey(entry.slug), value],
      ];
    }),
  ) as Record<
    string,
    {
      hasTypeChanges: boolean;
      hasAbilityChanges: boolean;
      hasStatChanges: boolean;
    }
  >;

  return {
    docs,
    speciesOptions,
    speciesCatalog,
    moveIndex,
    canonicalPokemonIndex,
    pokemonIndex,
    abilityCatalog,
    itemCatalog,
    reduxBySpecies,
  };
}

export function getDexPageData() {
  const version = getLocalDexDataVersion();
  if (!dexPageDataCache || dexPageDataCache.version !== version) {
    dexPageDataCache = {
      version,
      data: buildDexPageData(),
    };
  }

  return dexPageDataCache.data;
}

export function getDexListPageData(perfDebug = false) {
  const timings: Record<string, number> = {};
  const mark = (name: string) => {
    if (!perfDebug) {
      return () => {};
    }

    const startedAt = performance.now();
    return () => {
      timings[name] = Number((performance.now() - startedAt).toFixed(2));
    };
  };

  const stopDexDocs = mark("getLocalDexDocs");
  const dexDocs = getLocalDexDocs();
  stopDexDocs();
  const docs = {
    moveReplacements: [],
    moveTypeChanges: [],
    moveTypeOverrides: [],
    moveDetails: [],
    typeChanges: [],
    itemLocations: dexDocs.itemLocations,
    itemShops: dexDocs.itemShops ?? [],
    itemHighlights: [],
    gifts: dexDocs.gifts,
    trades: dexDocs.trades,
    wildAreas: dexDocs.wildAreas,
    pokemonProfiles: [],
    evolutionChanges: [],
  };
  const stopDexList = mark("getLocalDexList");
  const pokemonList = getLocalDexList();
  stopDexList();

  const payload = {
    docs,
    pokemonList,
  };

  if (perfDebug) {
    logDexServerPerf("dex-list", timings, payload, {
      pokemonList: pokemonList.length,
      wildAreas: docs.wildAreas.length,
      gifts: docs.gifts.length,
      trades: docs.trades.length,
      itemLocations: docs.itemLocations.length,
    });
  }

  return payload;
}
