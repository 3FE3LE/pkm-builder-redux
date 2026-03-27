import { parseDocumentation } from "@/lib/docs";
import {
  getLocalAbilityIndex,
  getLocalItemIndex,
  getLocalMoveIndex,
  getLocalPokemonIndex,
  getLocalSpeciesList,
} from "@/lib/localDex";
import type { RemoteMove, RemotePokemon } from "@/lib/teamAnalysis";
import { getWorldData } from "@/lib/worldData";

function stripPokemonDexNotes(entry: RemotePokemon): RemotePokemon {
  const { category: _category, height: _height, weight: _weight, flavorText: _flavorText, ...rest } = entry;
  return rest;
}

export function getBuilderPageData() {
  const docs = parseDocumentation() as ReturnType<typeof parseDocumentation> & {
    worldData: ReturnType<typeof getWorldData>;
  };
  docs.worldData = getWorldData();

  const speciesCatalog = getLocalSpeciesList();
  const moveIndex = getLocalMoveIndex() as Record<string, RemoteMove>;
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
      { name: string; effect?: string; sprite?: string | null }
    >,
  ).sort((left, right) => left.name.localeCompare(right.name));

  return {
    docs,
    speciesOptions,
    speciesCatalog,
    moveIndex,
    pokemonIndex,
    abilityCatalog,
    itemCatalog,
  };
}
