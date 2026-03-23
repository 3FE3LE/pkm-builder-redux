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

export function getBuilderPageData() {
  const docs = parseDocumentation() as ReturnType<typeof parseDocumentation> & {
    worldData: ReturnType<typeof getWorldData>;
  };
  docs.worldData = getWorldData();

  const speciesCatalog = getLocalSpeciesList();
  const moveIndex = getLocalMoveIndex() as Record<string, RemoteMove>;
  const pokemonIndex = getLocalPokemonIndex() as Record<string, RemotePokemon>;
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
  const moveHighlights = docs.moveDetails.slice(0, 12).map((move) => ({
    move: move.move,
    changes: move.changes.slice(0, 2).map((change) =>
      change.from
        ? `${change.field}: ${change.from} -> ${change.to}${change.tag ? ` ${change.tag}` : ""}`
        : change.to,
    ),
  }));

  return {
    docs,
    moveHighlights,
    speciesOptions,
    speciesCatalog,
    moveIndex,
    pokemonIndex,
    abilityCatalog,
    itemCatalog,
  };
}
