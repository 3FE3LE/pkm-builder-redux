import { getTypedSurfaceStyle } from "@/lib/ui/typeSurface";
import { normalizeName } from "@/lib/domain/names";

export const DEX_TABS = ["pokemon", "moves", "abilities", "items"] as const;
export const DEX_POKEMON_MODES = [
  "national",
  "gen1",
  "gen2",
  "gen3",
  "gen4",
  "gen5",
] as const;

export type DexTab = (typeof DEX_TABS)[number];
export type DexPokemonMode = (typeof DEX_POKEMON_MODES)[number];

export const DEX_MODE_LABELS: Record<DexPokemonMode, string> = {
  national: "Nacional",
  gen1: "Gen 1",
  gen2: "Gen 2",
  gen3: "Gen 3",
  gen4: "Gen 4",
  gen5: "Gen 5",
};

export const RESULT_LIMIT = 80;
export const INITIAL_RESULTS = 10;
export const RESULT_BATCH_SIZE = 10;
export const DEX_SCROLL_RESTORE_KEY = "dex-scroll-restore";

export function getSearchPlaceholder(tab: DexTab) {
  if (tab === "pokemon") {
    return "Buscar Pokemon, tipo, habilidad o area";
  }
  if (tab === "moves") {
    return "Buscar movimiento o efecto";
  }
  if (tab === "abilities") {
    return "Buscar habilidad o efecto";
  }
  return "Buscar objeto, categoria o efecto";
}

export function matchesDexMode(dex: number, mode: DexPokemonMode) {
  if (mode === "national") {
    return true;
  }
  if (mode === "gen1") {
    return dex >= 1 && dex <= 151;
  }
  if (mode === "gen2") {
    return dex >= 152 && dex <= 251;
  }
  if (mode === "gen3") {
    return dex >= 252 && dex <= 386;
  }
  if (mode === "gen4") {
    return dex >= 387 && dex <= 493;
  }
  return dex >= 494 && dex <= 649;
}

export function matchesTypeSlotFilters(
  types: string[] | undefined,
  primaryTypeFilter: string,
  secondaryTypeFilter: string,
) {
  const normalizedTypes = types?.map((type) => normalizeName(type)) ?? [];

  if (primaryTypeFilter && secondaryTypeFilter) {
    return (
      normalizedTypes[0] === primaryTypeFilter &&
      normalizedTypes[1] === secondaryTypeFilter
    );
  }

  if (primaryTypeFilter) {
    return normalizedTypes.includes(primaryTypeFilter);
  }

  if (secondaryTypeFilter) {
    return normalizedTypes.includes(secondaryTypeFilter);
  }

  return true;
}

export function buildDexStateQuery({
  tab,
  query,
  pokemonMode,
  typeChangesOnly,
  statChangesOnly,
  abilityChangesOnly,
  addsNewTeamTypeOnly,
  allTypesNewToTeamOnly,
  primaryTypeFilter,
  secondaryTypeFilter,
}: {
  tab?: DexTab | null;
  query?: string | null;
  pokemonMode?: DexPokemonMode | null;
  typeChangesOnly?: boolean;
  statChangesOnly?: boolean;
  abilityChangesOnly?: boolean;
  addsNewTeamTypeOnly?: boolean;
  allTypesNewToTeamOnly?: boolean;
  primaryTypeFilter?: string | null;
  secondaryTypeFilter?: string | null;
}) {
  const params = new URLSearchParams();

  if (tab && tab !== "pokemon") {
    params.set("tab", tab);
  }
  if (query) {
    params.set("q", query);
  }
  if (pokemonMode && pokemonMode !== "national") {
    params.set("dexMode", pokemonMode);
  }
  if (typeChangesOnly) {
    params.set("typeChanges", "1");
  }
  if (statChangesOnly) {
    params.set("statChanges", "1");
  }
  if (abilityChangesOnly) {
    params.set("abilityChanges", "1");
  }
  if (addsNewTeamTypeOnly) {
    params.set("addsNewTeamType", "1");
  }
  if (allTypesNewToTeamOnly) {
    params.set("allTypesNewToTeam", "1");
  }
  if (primaryTypeFilter) {
    params.set("type1", primaryTypeFilter);
  }
  if (secondaryTypeFilter) {
    params.set("type2", secondaryTypeFilter);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export function getDexTransitionName(part: string, slug: string) {
  return `dex-${part}-${slug}`;
}

export function getDexAnchorId(slug: string) {
  return `dex-entry-${slug}`;
}

export function getDexSearchHref(tab: DexTab, query: string) {
  return `/team/dex?tab=${tab}&q=${encodeURIComponent(query)}`;
}

export function formatBstLabel(current?: number, baseline?: number) {
  if (typeof current !== "number") {
    return "BST -";
  }

  if (typeof baseline !== "number" || baseline === current) {
    return `BST ${current}`;
  }

  const delta = current - baseline;
  return `BST ${current} (${delta > 0 ? `+${delta}` : delta})`;
}

export function formatEvolutionSummary(summary: string) {
  return summary
    .replace(/ · /g, "\n")
    .replace(/Metodo no detallado en la data local\./g, "Sin detalle");
}

export function resolveDexMoveCardData(
  entry: { move: string },
  moveDetailsByName?: Map<
    string,
    {
      name: string;
      type: string;
      damageClass: string;
      power?: number | null;
      accuracy?: number | null;
      pp?: number | null;
      priority?: number | null;
      description?: string;
    }
  >,
) {
  const fallback = {
    name: entry.move,
    type: "Normal",
    damageClass: "status",
    description: "Sin descripcion registrada.",
  } as const;

  if (!moveDetailsByName) {
    return fallback;
  }

  return moveDetailsByName.get(normalizeName(entry.move)) ?? fallback;
}

export function dedupeStrings(values?: string[] | null) {
  return Array.from(new Set((values ?? []).filter(Boolean)));
}

export function getDexSpriteShellStyle(types: string[]) {
  return getTypedSurfaceStyle(types, {
    primaryGlowMix: 18,
    secondaryGlowMix: 16,
    primaryBodyMix: 12,
    secondaryBodyMix: 10,
  });
}

export function sanitizeAbilityList(abilities: string[] = []) {
  return abilities.filter((ability) => {
    const trimmed = ability.trim();
    return trimmed.length > 0 && trimmed !== "-";
  });
}
