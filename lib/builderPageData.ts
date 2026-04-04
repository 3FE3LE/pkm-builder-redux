import { cache } from "react";

import { parseDocumentation } from "@/lib/docs";
import {
  getCanonicalPokemonIndex,
  getLocalAbilityIndex,
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

export const getBuilderPageData = cache(function getBuilderPageData() {
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

  return {
    docs,
    speciesOptions,
    speciesCatalog,
    moveIndex,
    canonicalPokemonIndex,
    pokemonIndex,
    abilityCatalog,
    itemCatalog,
  };
});

export const getDexPageData = cache(function getDexPageData() {
  const dexDocs = getLocalDexDocs();
  const docs = {
    moveReplacements: [],
    moveTypeChanges: [],
    moveTypeOverrides: [],
    moveDetails: [],
    typeChanges: [],
    itemLocations: dexDocs.itemLocations,
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

  return {
    docs,
    speciesOptions,
    speciesCatalog,
    moveIndex,
    canonicalPokemonIndex,
    pokemonIndex,
    abilityCatalog,
    itemCatalog,
  };
});

export const getDexListPageData = cache(function getDexListPageData(perfDebug = false) {
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
});
