import { cache } from "react";

import { parseDocumentation } from "@/lib/docs";
import {
  getCanonicalPokemonIndex,
  getLocalAbilityIndex,
  getLocalDexDocs,
  getLocalItemIndex,
  getLocalMoveIndex,
  getLocalPokemonIndex,
  getLocalSpeciesList,
} from "@/lib/localDex";
import type { RemoteMove, RemotePokemon } from "@/lib/teamAnalysis";
import { normalizeName } from "@/lib/domain/names";
import { getWorldData } from "@/lib/worldData";

function stripPokemonDexNotes(entry: RemotePokemon): RemotePokemon {
  return entry;
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

export const getDexListPageData = cache(function getDexListPageData() {
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
  const localPokemonIndex = getLocalPokemonIndex() as Record<string, RemotePokemon>;
  const canonicalPokemonIndex = getCanonicalPokemonIndex() as Record<string, RemotePokemon>;

  const pokemonList = speciesCatalog
    .map((species) => {
      const pokemon =
        localPokemonIndex[species.slug] ??
        localPokemonIndex[normalizeName(species.name)];
      const canonicalPokemon =
        canonicalPokemonIndex[species.slug] ??
        canonicalPokemonIndex[normalizeName(species.name)];
      const types = species.types ?? pokemon?.types ?? [];
      const abilities = pokemon?.abilities ?? [];

      return {
        dex: species.dex,
        name: species.name,
        slug: species.slug,
        types,
        abilities,
        hasTypeChanges:
          JSON.stringify(types.map(normalizeName)) !==
          JSON.stringify((canonicalPokemon?.types ?? []).map(normalizeName)),
        hasStatChanges:
          JSON.stringify(pokemon?.stats ?? null) !== JSON.stringify(canonicalPokemon?.stats ?? null),
        hasAbilityChanges:
          JSON.stringify(abilities.map(normalizeName)) !==
          JSON.stringify((canonicalPokemon?.abilities ?? []).map(normalizeName)),
      };
    })
    .sort((left, right) => left.dex - right.dex || left.name.localeCompare(right.name));

  return {
    docs,
    speciesCatalog,
    pokemonList,
  };
});
