"use client";

import { startTransition, useLayoutEffect, useMemo, useOptimistic } from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import useSWR from "swr";

import { useBuilderStore } from "@/lib/builderStore";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import {
  buildAcquisitionIndex,
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
    priority?: number | null;
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
    sources?: {
      locations?: Array<{ area: string; detail: string }>;
      shops?: Array<{ area: string; detail: string }>;
    };
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
  const queryDrivenPokemonFilters = useMemo(
    () => ({
      pokemonMode: resolvedPokemonMode,
      typeChangesOnly: typeChangesOnly === "1" ? "1" : "0",
      statChangesOnly: statChangesOnly === "1" ? "1" : "0",
      abilityChangesOnly: abilityChangesOnly === "1" ? "1" : "0",
      addsNewTeamTypeOnly: addsNewTeamTypeOnly === "1" ? "1" : "0",
      allTypesNewToTeamOnly: allTypesNewToTeamOnly === "1" ? "1" : "0",
      primaryTypeFilter,
      secondaryTypeFilter,
    }),
    [
      resolvedPokemonMode,
      typeChangesOnly,
      statChangesOnly,
      abilityChangesOnly,
      addsNewTeamTypeOnly,
      allTypesNewToTeamOnly,
      primaryTypeFilter,
      secondaryTypeFilter,
    ],
  );
  const [pokemonFilterState, setPokemonFilterState] = useOptimistic(
    queryDrivenPokemonFilters,
    (
      current,
      patch: Partial<typeof queryDrivenPokemonFilters>,
    ) => ({
      ...current,
      ...patch,
    }),
  );
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
    return buildAcquisitionIndex(data.docs.wildAreas, data.docs.gifts, data.docs.trades, pokemonNames);
  }, [data.docs.gifts, data.docs.trades, data.docs.wildAreas, pokemonNames, tab]);

  const pokemonSearchIndex = useMemo(() => {
    if (tab !== "pokemon") return new Map();
    return new Map(
      pokemonEntries.map((pokemon) => {
        const key = normalizeName(pokemon.name);
        const acquisitionTerms = [
          ...(acquisitionBySpecies.wildBySpecies.get(key) ?? []).flatMap((entry: any) => [entry.area, entry.method, entry.rate ?? ""]),
          ...(acquisitionBySpecies.giftsBySpecies.get(key) ?? []).map((entry: any) => entry.location),
          ...(acquisitionBySpecies.tradesBySpecies.get(key) ?? []).flatMap((entry: any) => [entry.location, entry.requested]),
        ];
        return [key, normalizeName([pokemon.name, ...pokemon.types, ...pokemon.abilities, ...acquisitionTerms].join(" "))] as const;
      }),
    );
  }, [acquisitionBySpecies.giftsBySpecies, acquisitionBySpecies.tradesBySpecies, acquisitionBySpecies.wildBySpecies, pokemonEntries, tab]);

  const ownersByMove = useMemo(() => (tab !== "moves" ? new Map() : new Map(Object.entries(movesPayload?.ownersByMove ?? {}))), [movesPayload, tab]);
  const ownersByAbility = useMemo(() => (tab !== "abilities" ? new Map() : new Map(Object.entries(abilitiesPayload?.ownersByAbility ?? {}))), [abilitiesPayload, tab]);

  const normalizedQuery = normalizeName(query);
  const normalizedPrimaryTypeFilter = normalizeName(pokemonFilterState.primaryTypeFilter);
  const normalizedSecondaryTypeFilter = normalizeName(pokemonFilterState.secondaryTypeFilter);
  const activePokemonFilterCount =
    (pokemonFilterState.typeChangesOnly === "1" ? 1 : 0) +
    (pokemonFilterState.statChangesOnly === "1" ? 1 : 0) +
    (pokemonFilterState.abilityChangesOnly === "1" ? 1 : 0) +
    (pokemonFilterState.addsNewTeamTypeOnly === "1" ? 1 : 0) +
    (pokemonFilterState.allTypesNewToTeamOnly === "1" ? 1 : 0) +
    (pokemonFilterState.primaryTypeFilter ? 1 : 0) +
    (pokemonFilterState.secondaryTypeFilter ? 1 : 0);

  const filteredPokemon = useMemo(() => {
    if (tab !== "pokemon") return [];
    return pokemonEntries.filter((pokemon) => {
      if (!matchesDexMode(pokemon.dex, pokemonFilterState.pokemonMode)) return false;
      if (pokemonFilterState.typeChangesOnly === "1" && !pokemon.hasTypeChanges) return false;
      if (pokemonFilterState.statChangesOnly === "1" && !pokemon.hasStatChanges) return false;
      if (pokemonFilterState.abilityChangesOnly === "1" && !pokemon.hasAbilityChanges) return false;
      if (!matchesTypeSlotFilters(pokemon.types, normalizedPrimaryTypeFilter, normalizedSecondaryTypeFilter)) return false;
      if (pokemonFilterState.addsNewTeamTypeOnly === "1" && !pokemon.types.some((type: string) => !currentTeamTypes.has(normalizeName(type)))) return false;
      if (pokemonFilterState.allTypesNewToTeamOnly === "1" && !pokemon.types.every((type: string) => !currentTeamTypes.has(normalizeName(type)))) return false;
      if (!normalizedQuery) return true;
      return (pokemonSearchIndex.get(normalizeName(pokemon.name)) ?? "").includes(normalizedQuery);
    });
  }, [currentTeamTypes, normalizedPrimaryTypeFilter, normalizedQuery, normalizedSecondaryTypeFilter, pokemonEntries, pokemonFilterState, pokemonSearchIndex, tab]);

  const dexQuery = useMemo(() => buildDexStateQuery({
    tab,
    query,
    pokemonMode: pokemonFilterState.pokemonMode,
    typeChangesOnly: pokemonFilterState.typeChangesOnly === "1",
    statChangesOnly: pokemonFilterState.statChangesOnly === "1",
    abilityChangesOnly: pokemonFilterState.abilityChangesOnly === "1",
    addsNewTeamTypeOnly: pokemonFilterState.addsNewTeamTypeOnly === "1",
    allTypesNewToTeamOnly: pokemonFilterState.allTypesNewToTeamOnly === "1",
    primaryTypeFilter: pokemonFilterState.primaryTypeFilter,
    secondaryTypeFilter: pokemonFilterState.secondaryTypeFilter,
  }), [pokemonFilterState, query, tab]);

  function updatePokemonMode(next: DexPokemonMode) {
    startTransition(() => setPokemonFilterState({ pokemonMode: next }));
    void setPokemonMode(next);
  }

  function updateTypeChangesOnly(next: "0" | "1") {
    startTransition(() => setPokemonFilterState({ typeChangesOnly: next }));
    void setTypeChangesOnly(next);
  }

  function updateStatChangesOnly(next: "0" | "1") {
    startTransition(() => setPokemonFilterState({ statChangesOnly: next }));
    void setStatChangesOnly(next);
  }

  function updateAbilityChangesOnly(next: "0" | "1") {
    startTransition(() => setPokemonFilterState({ abilityChangesOnly: next }));
    void setAbilityChangesOnly(next);
  }

  function updateAddsNewTeamTypeOnly(next: "0" | "1") {
    startTransition(() => setPokemonFilterState({ addsNewTeamTypeOnly: next }));
    void setAddsNewTeamTypeOnly(next);
  }

  function updateAllTypesNewToTeamOnly(next: "0" | "1") {
    startTransition(() => setPokemonFilterState({ allTypesNewToTeamOnly: next }));
    void setAllTypesNewToTeamOnly(next);
  }

  function updatePrimaryTypeFilter(next: string) {
    startTransition(() => setPokemonFilterState({ primaryTypeFilter: next }));
    void setPrimaryTypeFilter(next);
  }

  function updateSecondaryTypeFilter(next: string) {
    startTransition(() => setPokemonFilterState({ secondaryTypeFilter: next }));
    void setSecondaryTypeFilter(next);
  }

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
    resolvedPokemonMode: pokemonFilterState.pokemonMode,
    setPokemonMode: updatePokemonMode,
    typeChangesOnly: pokemonFilterState.typeChangesOnly,
    setTypeChangesOnly: updateTypeChangesOnly,
    statChangesOnly: pokemonFilterState.statChangesOnly,
    setStatChangesOnly: updateStatChangesOnly,
    abilityChangesOnly: pokemonFilterState.abilityChangesOnly,
    setAbilityChangesOnly: updateAbilityChangesOnly,
    addsNewTeamTypeOnly: pokemonFilterState.addsNewTeamTypeOnly,
    setAddsNewTeamTypeOnly: updateAddsNewTeamTypeOnly,
    allTypesNewToTeamOnly: pokemonFilterState.allTypesNewToTeamOnly,
    setAllTypesNewToTeamOnly: updateAllTypesNewToTeamOnly,
    primaryTypeFilter: pokemonFilterState.primaryTypeFilter,
    setPrimaryTypeFilter: updatePrimaryTypeFilter,
    secondaryTypeFilter: pokemonFilterState.secondaryTypeFilter,
    setSecondaryTypeFilter: updateSecondaryTypeFilter,
    activePokemonFilterCount,
    dexBySpecies,
    acquisitionBySpecies,
    abilityEffects,
    moveDetailsByName,
    ownersByMove,
    ownersByAbility,
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
