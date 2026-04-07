"use client";

import { useDeferredValue, useLayoutEffect, useMemo } from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import useSWR from "swr";

import { useBuilderStore } from "@/lib/builderStore";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import {
  extractEncounterSpecies,
  extractGiftSpecies,
  parseItemLocationDetail,
} from "@/lib/domain/sourceData";
import { getBaseSpeciesName } from "@/lib/forms";
import type { getDexListPageData } from "@/lib/builderPageData";
import {
  buildDexStateQuery,
  DEX_POKEMON_MODES,
  DEX_SCROLL_RESTORE_KEY,
  DEX_TABS,
  dedupeStrings,
  matchesDexMode,
  matchesTypeSlotFilters,
  type DexPokemonMode,
  type DexTab,
} from "@/components/team/screens/dex/utils";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

export type DexMovesPayload = {
  entries: Array<{
    name: string;
    type: string;
    damageClass: string;
    power?: number | null;
    accuracy?: number | null;
    pp?: number | null;
    description?: string;
  }>;
  ownersByMove: Record<string, { levelUp: string[]; machines: string[] }>;
};

export type DexAbilitiesPayload = {
  entries: Array<{ name: string; effect?: string }>;
  ownersByAbility: Record<string, { regular: string[]; hidden: string[] }>;
};

export type DexItemsPayload = {
  entries: Array<{
    name: string;
    category?: string;
    effect?: string;
    sprite?: string | null;
  }>;
};

export function useDexScreenModel(
  data: ReturnType<typeof getDexListPageData> & {
    speciesCatalog?: Array<{
      dex: number;
      name: string;
      slug: string;
      types: string[];
      abilities?: string[];
      hasTypeChanges?: boolean;
      hasStatChanges?: boolean;
      hasAbilityChanges?: boolean;
    }>;
  },
) {
  const [tab, setTab] = useQueryState("tab", parseAsStringEnum<DexTab>([...DEX_TABS]).withDefault("pokemon"));
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [pokemonMode, setPokemonMode] = useQueryState("dexMode", parseAsStringEnum<DexPokemonMode>([...DEX_POKEMON_MODES]).withDefault("national"));
  const [typeChangesOnly, setTypeChangesOnly] = useQueryState("typeChanges", parseAsStringEnum(["0", "1"]).withDefault("0"));
  const [statChangesOnly, setStatChangesOnly] = useQueryState("statChanges", parseAsStringEnum(["0", "1"]).withDefault("0"));
  const [abilityChangesOnly, setAbilityChangesOnly] = useQueryState("abilityChanges", parseAsStringEnum(["0", "1"]).withDefault("0"));
  const [addsNewTeamTypeOnly, setAddsNewTeamTypeOnly] = useQueryState("addsNewTeamType", parseAsStringEnum(["0", "1"]).withDefault("0"));
  const [allTypesNewToTeamOnly, setAllTypesNewToTeamOnly] = useQueryState("allTypesNewToTeam", parseAsStringEnum(["0", "1"]).withDefault("0"));
  const [primaryTypeFilter, setPrimaryTypeFilter] = useQueryState("type1", parseAsString.withDefault(""));
  const [secondaryTypeFilter, setSecondaryTypeFilter] = useQueryState("type2", parseAsString.withDefault(""));

  const resolvedPokemonMode = DEX_POKEMON_MODES.includes(pokemonMode as DexPokemonMode)
    ? (pokemonMode as DexPokemonMode)
    : "national";
  const deferredQuery = useDeferredValue(query);
  const currentTeam = useBuilderStore((state) => state.run.roster.currentTeam);
  const { data: movesPayload } = useSWR<DexMovesPayload>(tab === "moves" ? "/api/dex?movesList=1" : null, fetcher);
  const { data: abilitiesPayload } = useSWR<DexAbilitiesPayload>(tab === "abilities" ? "/api/dex?abilitiesList=1" : null, fetcher);
  const { data: itemsPayload } = useSWR<DexItemsPayload>(tab === "items" ? "/api/dex?itemsList=1" : null, fetcher);

  const moveEntries = useMemo(() => movesPayload?.entries ?? [], [movesPayload]);
  const abilityEntries = useMemo(() => abilitiesPayload?.entries ?? [], [abilitiesPayload]);
  const itemEntries = useMemo(() => itemsPayload?.entries ?? [], [itemsPayload]);
  const abilityEffects = useMemo(() => new Map(abilityEntries.map((ability) => [normalizeName(ability.name), ability.effect ?? "Sin efecto registrado."])), [abilityEntries]);
  const moveDetailsByName = useMemo(() => new Map(moveEntries.map((move) => [normalizeName(move.name), move])), [moveEntries]);

  const pokemonEntries = useMemo(() => {
    const source = data.pokemonList ?? data.speciesCatalog ?? [];
    const deduped = new Map<string, any>();
    source.forEach((pokemon) => {
      const key = pokemon.slug || normalizeName(pokemon.name);
      if (deduped.has(key)) return;
      const sprites = buildSpriteUrls(pokemon.name, pokemon.dex);
      deduped.set(key, {
        ...pokemon,
        slug: key,
        types: dedupeStrings(pokemon.types),
        abilities: dedupeStrings(pokemon.abilities ?? []),
        spriteUrl: sprites.spriteUrl,
        animatedSpriteUrl: sprites.animatedSpriteUrl,
        nextEvolutions: [],
        evolutionDetails: [],
        hasTypeChanges: pokemon.hasTypeChanges ?? false,
        hasStatChanges: pokemon.hasStatChanges ?? false,
        hasAbilityChanges: pokemon.hasAbilityChanges ?? false,
      });
    });
    return [...deduped.values()];
  }, [data.pokemonList, data.speciesCatalog]);

  const dexBySpecies = useMemo(() => {
    const next: Record<string, number> = {};
    pokemonEntries.forEach((species) => {
      next[normalizeName(species.name)] = species.dex;
      next[normalizeName(getBaseSpeciesName(species.name))] = species.dex;
    });
    return next;
  }, [pokemonEntries]);

  const pokemonEntriesBySlug = useMemo(
    () => new Map(pokemonEntries.flatMap((entry) => [[entry.slug, entry], [normalizeName(entry.name), entry]])),
    [pokemonEntries],
  );

  const currentTeamTypes = useMemo(() => {
    const next = new Set<string>();
    currentTeam.forEach((member) => {
      const speciesName = String(member.species ?? "").trim();
      if (!speciesName) return;
      const normalizedSpecies = normalizeName(speciesName);
      const pokemon =
        pokemonEntriesBySlug.get(normalizedSpecies) ??
        pokemonEntriesBySlug.get(normalizeName(getBaseSpeciesName(speciesName)));
      dedupeStrings(pokemon?.types ?? []).forEach((type) => next.add(normalizeName(type)));
    });
    return next;
  }, [currentTeam, pokemonEntriesBySlug]);

  const pokemonNames = useMemo(() => pokemonEntries.map((entry) => entry.name), [pokemonEntries]);
  const acquisitionBySpecies = useMemo(() => {
    if (tab !== "pokemon") {
      return { wildBySpecies: new Map(), giftsBySpecies: new Map(), tradesBySpecies: new Map() };
    }
    const wildBySpecies = new Map<string, { area: string; method: string }[]>();
    const giftsBySpecies = new Map<string, { location: string; level: string }[]>();
    const tradesBySpecies = new Map<string, { location: string; requested: string }[]>();
    data.docs.wildAreas.forEach((area) => {
      area.methods.forEach((method) => {
        method.encounters.forEach((entry) => {
          extractEncounterSpecies(entry.species, pokemonNames).forEach((species) => {
            const key = normalizeName(species);
            wildBySpecies.set(key, [...(wildBySpecies.get(key) ?? []), { area: area.area, method: method.method }]);
          });
        });
      });
    });
    data.docs.gifts.forEach((gift) => {
      extractGiftSpecies(gift.name, gift.notes ?? [], pokemonNames).forEach((species) => {
        const key = normalizeName(species);
        giftsBySpecies.set(key, [...(giftsBySpecies.get(key) ?? []), { location: gift.location, level: gift.level }]);
      });
    });
    data.docs.trades.forEach((trade) => {
      const key = normalizeName(trade.received);
      if (!key) return;
      tradesBySpecies.set(key, [...(tradesBySpecies.get(key) ?? []), { location: trade.location, requested: trade.requested }]);
    });
    return { wildBySpecies, giftsBySpecies, tradesBySpecies };
  }, [data.docs.gifts, data.docs.trades, data.docs.wildAreas, pokemonNames, tab]);

  const pokemonSearchIndex = useMemo(() => {
    if (tab !== "pokemon") return new Map();
    return new Map(
      pokemonEntries.map((pokemon) => {
        const key = normalizeName(pokemon.name);
        const acquisitionTerms = [
          ...(acquisitionBySpecies.wildBySpecies.get(key) ?? []).map((entry: { area: string; method: string }) => `${entry.area} ${entry.method}`),
          ...(acquisitionBySpecies.giftsBySpecies.get(key) ?? []).map((entry: { location: string }) => entry.location),
          ...(acquisitionBySpecies.tradesBySpecies.get(key) ?? []).flatMap((entry: { location: string; requested: string }) => [entry.location, entry.requested]),
        ];
        return [key, normalizeName([pokemon.name, ...pokemon.types, ...pokemon.abilities, ...acquisitionTerms].join(" "))] as const;
      }),
    );
  }, [acquisitionBySpecies.giftsBySpecies, acquisitionBySpecies.tradesBySpecies, acquisitionBySpecies.wildBySpecies, pokemonEntries, tab]);

  const ownersByMove = useMemo(() => (tab !== "moves" ? new Map() : new Map(Object.entries(movesPayload?.ownersByMove ?? {}))), [movesPayload, tab]);
  const ownersByAbility = useMemo(() => (tab !== "abilities" ? new Map() : new Map(Object.entries(abilitiesPayload?.ownersByAbility ?? {}))), [abilitiesPayload, tab]);

  const locationsByItem = useMemo(() => {
    if (tab !== "items") return new Map<string, { area: string; detail: string }[]>();
    const next = new Map<string, { area: string; detail: string }[]>();
    data.docs.itemLocations.forEach((location) => {
      location.items.forEach((detail) => {
        const parsed = parseItemLocationDetail(detail);
        itemEntries.forEach((item) => {
          const itemKey = normalizeName(item.name);
          if (!itemKey || itemKey !== normalizeName(parsed.replacement ?? "")) return;
          next.set(itemKey, [...(next.get(itemKey) ?? []), { area: location.area, detail: parsed.display }]);
        });
      });
    });
    return next;
  }, [data.docs.itemLocations, itemEntries, tab]);

  const normalizedQuery = normalizeName(deferredQuery);
  const normalizedPrimaryTypeFilter = normalizeName(primaryTypeFilter);
  const normalizedSecondaryTypeFilter = normalizeName(secondaryTypeFilter);
  const activePokemonFilterCount =
    (typeChangesOnly === "1" ? 1 : 0) +
    (statChangesOnly === "1" ? 1 : 0) +
    (abilityChangesOnly === "1" ? 1 : 0) +
    (addsNewTeamTypeOnly === "1" ? 1 : 0) +
    (allTypesNewToTeamOnly === "1" ? 1 : 0) +
    (primaryTypeFilter ? 1 : 0) +
    (secondaryTypeFilter ? 1 : 0);

  const filteredPokemon = useMemo(() => {
    if (tab !== "pokemon") return [];
    return pokemonEntries.filter((pokemon) => {
      if (!matchesDexMode(pokemon.dex, resolvedPokemonMode)) return false;
      if (typeChangesOnly === "1" && !pokemon.hasTypeChanges) return false;
      if (statChangesOnly === "1" && !pokemon.hasStatChanges) return false;
      if (abilityChangesOnly === "1" && !pokemon.hasAbilityChanges) return false;
      if (!matchesTypeSlotFilters(pokemon.types, normalizedPrimaryTypeFilter, normalizedSecondaryTypeFilter)) return false;
      if (addsNewTeamTypeOnly === "1" && !pokemon.types.some((type: string) => !currentTeamTypes.has(normalizeName(type)))) return false;
      if (allTypesNewToTeamOnly === "1" && !pokemon.types.every((type: string) => !currentTeamTypes.has(normalizeName(type)))) return false;
      if (!normalizedQuery) return true;
      return (pokemonSearchIndex.get(normalizeName(pokemon.name)) ?? "").includes(normalizedQuery);
    });
  }, [abilityChangesOnly, addsNewTeamTypeOnly, allTypesNewToTeamOnly, currentTeamTypes, normalizedPrimaryTypeFilter, normalizedQuery, normalizedSecondaryTypeFilter, pokemonEntries, pokemonSearchIndex, resolvedPokemonMode, statChangesOnly, tab, typeChangesOnly]);

  const dexQuery = useMemo(() => buildDexStateQuery({
    tab,
    query,
    pokemonMode: resolvedPokemonMode,
    typeChangesOnly: typeChangesOnly === "1",
    statChangesOnly: statChangesOnly === "1",
    abilityChangesOnly: abilityChangesOnly === "1",
    addsNewTeamTypeOnly: addsNewTeamTypeOnly === "1",
    allTypesNewToTeamOnly: allTypesNewToTeamOnly === "1",
    primaryTypeFilter,
    secondaryTypeFilter,
  }), [abilityChangesOnly, addsNewTeamTypeOnly, allTypesNewToTeamOnly, primaryTypeFilter, query, resolvedPokemonMode, secondaryTypeFilter, statChangesOnly, tab, typeChangesOnly]);

  const filteredMoves = useMemo(() => (tab !== "moves" ? [] : moveEntries.filter((move) => !normalizedQuery || normalizeName(move.name).includes(normalizedQuery) || normalizeName(move.description ?? "").includes(normalizedQuery))), [moveEntries, normalizedQuery, tab]);
  const filteredAbilities = useMemo(() => (tab !== "abilities" ? [] : abilityEntries.filter((ability) => !normalizedQuery || normalizeName(ability.name).includes(normalizedQuery) || normalizeName(ability.effect ?? "").includes(normalizedQuery))), [abilityEntries, normalizedQuery, tab]);
  const filteredItems = useMemo(() => (tab !== "items" ? [] : itemEntries.filter((item) => !normalizedQuery || normalizeName(item.name).includes(normalizedQuery) || normalizeName(item.effect ?? "").includes(normalizedQuery) || normalizeName(item.category ?? "").includes(normalizedQuery))), [itemEntries, normalizedQuery, tab]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(DEX_SCROLL_RESTORE_KEY);
    if (!raw || !window.location.hash) return;
    try {
      const parsed = JSON.parse(raw) as { anchorId?: string; topOffset?: number };
      const hashId = window.location.hash.replace(/^#/, "");
      if (!parsed.anchorId || parsed.anchorId !== hashId || typeof parsed.topOffset !== "number") return;
      const anchor = document.getElementById(parsed.anchorId);
      if (!anchor) return;
      const currentTop = anchor.getBoundingClientRect().top;
      window.scrollTo({ top: Math.max(0, window.scrollY + currentTop - parsed.topOffset), behavior: "auto" });
    } finally {
      window.sessionStorage.removeItem(DEX_SCROLL_RESTORE_KEY);
    }
  }, []);

  return {
    tab,
    setTab,
    query,
    setQuery,
    resolvedPokemonMode,
    setPokemonMode,
    typeChangesOnly,
    setTypeChangesOnly,
    statChangesOnly,
    setStatChangesOnly,
    abilityChangesOnly,
    setAbilityChangesOnly,
    addsNewTeamTypeOnly,
    setAddsNewTeamTypeOnly,
    allTypesNewToTeamOnly,
    setAllTypesNewToTeamOnly,
    primaryTypeFilter,
    setPrimaryTypeFilter,
    secondaryTypeFilter,
    setSecondaryTypeFilter,
    activePokemonFilterCount,
    dexBySpecies,
    acquisitionBySpecies,
    abilityEffects,
    moveDetailsByName,
    ownersByMove,
    ownersByAbility,
    locationsByItem,
    filteredPokemon,
    filteredMoves,
    filteredAbilities,
    filteredItems,
    dexQuery,
    movesPayload,
    abilitiesPayload,
    itemsPayload,
  };
}
