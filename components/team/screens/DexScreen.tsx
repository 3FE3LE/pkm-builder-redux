"use client";

import clsx from "clsx";
import Link from "next/link";
import {
  useCallback,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import useSWR from "swr";

import { ItemSprite } from "@/components/builder-shared/ItemSprite";
import { PokemonSprite } from "@/components/builder-shared/PokemonSprite";
import { TypeBadge } from "@/components/builder-shared/TypeBadge";
import { DefenseSection } from "@/components/team/editor/DefenseSection";
import { StatBar } from "@/components/team/shared/StatWidgets";
import { MoveSlotSurface } from "@/components/team/UI";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBuilderStore } from "@/lib/builderStore";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import {
  extractEncounterSpecies,
  extractGiftSpecies,
  parseItemLocationDetail,
} from "@/lib/domain/sourceData";
import { getBaseSpeciesName } from "@/lib/forms";
import { markNavigationStart } from "@/lib/perf";
import { getTypedSurfaceStyle } from "@/lib/ui/typeSurface";
import { useSafeTransitionTypes } from "@/lib/viewTransitions";
import type { getDexListPageData } from "@/lib/builderPageData";

const DEX_TABS = ["pokemon", "moves", "abilities", "items"] as const;
const DEX_POKEMON_MODES = ["national", "gen5"] as const;
type DexTab = (typeof DEX_TABS)[number];
type DexPokemonMode = (typeof DEX_POKEMON_MODES)[number];
const RESULT_LIMIT = 80;
const INITIAL_RESULTS = 10;
const RESULT_BATCH_SIZE = 10;
const DEX_SCROLL_RESTORE_KEY = "dex-scroll-restore";
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

type DexMovesPayload = {
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

type DexAbilitiesPayload = {
  entries: Array<{ name: string; effect?: string }>;
  ownersByAbility: Record<string, { regular: string[]; hidden: string[] }>;
};

type DexItemsPayload = {
  entries: Array<{
    name: string;
    category?: string;
    effect?: string;
    sprite?: string | null;
  }>;
};

export function DexScreen({
  data,
}: {
  data: ReturnType<typeof getDexListPageData>;
}) {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringEnum<DexTab>([...DEX_TABS]).withDefault("pokemon"),
  );
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [pokemonMode, setPokemonMode] = useQueryState(
    "dexMode",
    parseAsStringEnum<DexPokemonMode>([...DEX_POKEMON_MODES]).withDefault("national"),
  );
  const [typeChangesOnly, setTypeChangesOnly] = useQueryState(
    "typeChanges",
    parseAsStringEnum(["0", "1"]).withDefault("0"),
  );
  const [statChangesOnly, setStatChangesOnly] = useQueryState(
    "statChanges",
    parseAsStringEnum(["0", "1"]).withDefault("0"),
  );
  const [abilityChangesOnly, setAbilityChangesOnly] = useQueryState(
    "abilityChanges",
    parseAsStringEnum(["0", "1"]).withDefault("0"),
  );
  const [addsNewTeamTypeOnly, setAddsNewTeamTypeOnly] = useQueryState(
    "addsNewTeamType",
    parseAsStringEnum(["0", "1"]).withDefault("0"),
  );
  const [allTypesNewToTeamOnly, setAllTypesNewToTeamOnly] = useQueryState(
    "allTypesNewToTeam",
    parseAsStringEnum(["0", "1"]).withDefault("0"),
  );
  const deferredQuery = useDeferredValue(query);
  const forwardTransition = useSafeTransitionTypes(["dex-forward"]);
  const currentTeam = useBuilderStore((state) => state.run.roster.currentTeam);
  const { data: movesPayload } = useSWR<DexMovesPayload>(
    tab === "moves" || tab === "pokemon" ? "/api/dex?movesList=1" : null,
    fetcher,
  );
  const { data: abilitiesPayload } = useSWR<DexAbilitiesPayload>(
    tab === "abilities" || tab === "pokemon" ? "/api/dex?abilitiesList=1" : null,
    fetcher,
  );
  const { data: itemsPayload } = useSWR<DexItemsPayload>(
    tab === "items" ? "/api/dex?itemsList=1" : null,
    fetcher,
  );

  const moveEntries = useMemo(
    () => movesPayload?.entries ?? [],
    [movesPayload],
  );
  const abilityEntries = useMemo(
    () => abilitiesPayload?.entries ?? [],
    [abilitiesPayload],
  );
  const itemEntries = useMemo(
    () => itemsPayload?.entries ?? [],
    [itemsPayload],
  );
  const abilityEffects = useMemo(
    () => {
      if (tab !== "pokemon") {
        return new Map();
      }

      return new Map(
        abilityEntries.map((ability) => [
          normalizeName(ability.name),
          ability.effect ?? "Sin efecto registrado.",
        ]),
      );
    },
    [abilityEntries, tab],
  );
  const moveDetailsByName = useMemo(
    () => {
      if (tab !== "pokemon") {
        return new Map();
      }

      return new Map(moveEntries.map((move) => [normalizeName(move.name), move]));
    },
    [moveEntries, tab],
  );
  const pokemonEntries = useMemo(
    () =>
      data.pokemonList.map((pokemon) => {
        const sprites = buildSpriteUrls(pokemon.name, pokemon.dex);

        return {
          ...pokemon,
          types: dedupeStrings(pokemon.types),
          abilities: dedupeStrings(pokemon.abilities),
          spriteUrl: sprites.spriteUrl,
          animatedSpriteUrl: sprites.animatedSpriteUrl,
          nextEvolutions: [],
          evolutionDetails: [],
        };
      }),
    [data.pokemonList],
  );
  const dexBySpecies = useMemo(() => {
    const next: Record<string, number> = {};

    data.speciesCatalog.forEach((species) => {
      next[normalizeName(species.name)] = species.dex;
      next[normalizeName(getBaseSpeciesName(species.name))] = species.dex;
    });

    return next;
  }, [data.speciesCatalog]);
  const pokemonEntriesBySlug = useMemo(
    () =>
      new Map(
        pokemonEntries.flatMap((entry) => [
          [entry.slug, entry],
          [normalizeName(entry.name), entry],
        ]),
      ),
    [pokemonEntries],
  );
  const currentTeamTypes = useMemo(() => {
    const next = new Set<string>();

    currentTeam.forEach((member) => {
      const speciesName = String(member.species ?? "").trim();
      if (!speciesName) {
        return;
      }

      const normalizedSpecies = normalizeName(speciesName);
      const pokemon =
        pokemonEntriesBySlug.get(normalizedSpecies) ??
        pokemonEntriesBySlug.get(normalizeName(getBaseSpeciesName(speciesName)));
      const speciesEntry =
        data.speciesCatalog.find((entry) => entry.slug === normalizedSpecies) ??
        data.speciesCatalog.find((entry) => normalizeName(entry.name) === normalizedSpecies) ??
        data.speciesCatalog.find(
          (entry) => normalizeName(getBaseSpeciesName(entry.name)) === normalizedSpecies,
        );
      const resolvedTypes = dedupeStrings(pokemon?.types ?? speciesEntry?.types ?? []);

      resolvedTypes.forEach((type) => {
        next.add(normalizeName(type));
      });
    });

    return next;
  }, [currentTeam, data.speciesCatalog, pokemonEntriesBySlug]);
  const pokemonNames = useMemo(
    () => pokemonEntries.map((entry) => entry.name),
    [pokemonEntries],
  );
  const acquisitionBySpecies = useMemo(() => {
    if (tab !== "pokemon") {
      return {
        wildBySpecies: new Map<string, { area: string; method: string }[]>(),
        giftsBySpecies: new Map<string, { location: string; level: string }[]>(),
        tradesBySpecies: new Map<string, { location: string; requested: string }[]>(),
      };
    }

    const wildBySpecies = new Map<string, { area: string; method: string }[]>();
    const giftsBySpecies = new Map<
      string,
      { location: string; level: string }[]
    >();
    const tradesBySpecies = new Map<
      string,
      { location: string; requested: string }[]
    >();

    data.docs.wildAreas.forEach((area) => {
      area.methods.forEach((method) => {
        method.encounters.forEach((entry) => {
          extractEncounterSpecies(entry.species, pokemonNames).forEach(
            (species) => {
              const key = normalizeName(species);
              wildBySpecies.set(key, [
                ...(wildBySpecies.get(key) ?? []),
                { area: area.area, method: method.method },
              ]);
            },
          );
        });
      });
    });

    data.docs.gifts.forEach((gift) => {
      extractGiftSpecies(gift.name, gift.notes ?? [], pokemonNames).forEach(
        (species) => {
          const key = normalizeName(species);
          giftsBySpecies.set(key, [
            ...(giftsBySpecies.get(key) ?? []),
            { location: gift.location, level: gift.level },
          ]);
        },
      );
    });

    data.docs.trades.forEach((trade) => {
      const key = normalizeName(trade.received);
      if (!key) {
        return;
      }

      tradesBySpecies.set(key, [
        ...(tradesBySpecies.get(key) ?? []),
        { location: trade.location, requested: trade.requested },
      ]);
    });

    return { wildBySpecies, giftsBySpecies, tradesBySpecies };
  }, [
    data.docs.gifts,
    data.docs.trades,
    data.docs.wildAreas,
    pokemonNames,
    tab,
  ]);
  const pokemonSearchIndex = useMemo(
    () => {
      if (tab !== "pokemon") {
        return new Map();
      }

      return new Map(
        pokemonEntries.map((pokemon) => {
          const key = normalizeName(pokemon.name);
          const acquisitionTerms = [
            ...(acquisitionBySpecies.wildBySpecies.get(key) ?? []).map(
              (entry) => `${entry.area} ${entry.method}`,
            ),
            ...(acquisitionBySpecies.giftsBySpecies.get(key) ?? []).map(
              (entry) => entry.location,
            ),
            ...(acquisitionBySpecies.tradesBySpecies.get(key) ?? []).flatMap(
              (entry) => [entry.location, entry.requested],
            ),
          ];

          return [
            key,
            normalizeName(
              [
                pokemon.name,
                ...pokemon.types,
                ...pokemon.abilities,
                ...acquisitionTerms,
              ].join(" "),
            ),
          ] as const;
        }),
      );
    },
    [
      acquisitionBySpecies.giftsBySpecies,
      acquisitionBySpecies.tradesBySpecies,
      acquisitionBySpecies.wildBySpecies,
      pokemonEntries,
      tab,
    ],
  );

  const ownersByMove = useMemo(() => {
    if (tab !== "moves") {
      return new Map<
        string,
        {
          levelUp: string[];
          machines: string[];
        }
      >();
    }

    const next = new Map<
      string,
      {
        levelUp: string[];
        machines: string[];
      }
    >();

    Object.entries(movesPayload?.ownersByMove ?? {}).forEach(([key, value]) => {
      next.set(key, value);
    });

    return next;
  }, [movesPayload, tab]);

  const ownersByAbility = useMemo(() => {
    if (tab !== "abilities") {
      return new Map<
        string,
        {
          regular: string[];
          hidden: string[];
        }
      >();
    }

    const next = new Map<
      string,
      {
        regular: string[];
        hidden: string[];
      }
    >();

    Object.entries(abilitiesPayload?.ownersByAbility ?? {}).forEach(([key, value]) => {
      next.set(key, value);
    });

    return next;
  }, [abilitiesPayload, tab]);

  const locationsByItem = useMemo(() => {
    if (tab !== "items") {
      return new Map<string, { area: string; detail: string }[]>();
    }

    const next = new Map<string, { area: string; detail: string }[]>();

    data.docs.itemLocations.forEach((location) => {
      location.items.forEach((detail) => {
        const parsed = parseItemLocationDetail(detail);

        itemEntries.forEach((item) => {
          const itemKey = normalizeName(item.name);
          const replacementKey = normalizeName(parsed.replacement ?? "");
          if (!itemKey || itemKey !== replacementKey) {
            return;
          }

          next.set(itemKey, [
            ...(next.get(itemKey) ?? []),
            { area: location.area, detail: parsed.display },
          ]);
        });
      });
    });

    return next;
  }, [data.docs.itemLocations, itemEntries, tab]);

  const normalizedQuery = normalizeName(deferredQuery);
  const filteredPokemon = useMemo(
    () => {
      if (tab !== "pokemon") {
        return [];
      }

      return pokemonEntries.filter((pokemon) => {
        if (pokemonMode === "gen5" && (pokemon.dex < 494 || pokemon.dex > 649)) {
          return false;
        }
        if (typeChangesOnly === "1" && !pokemon.hasTypeChanges) {
          return false;
        }
        if (statChangesOnly === "1" && !pokemon.hasStatChanges) {
          return false;
        }
        if (abilityChangesOnly === "1" && !pokemon.hasAbilityChanges) {
          return false;
        }
        if (addsNewTeamTypeOnly === "1") {
          const addsAtLeastOneNewType = pokemon.types.some(
            (type) => !currentTeamTypes.has(normalizeName(type)),
          );
          if (!addsAtLeastOneNewType) {
            return false;
          }
        }
        if (allTypesNewToTeamOnly === "1") {
          const allTypesAreNew = pokemon.types.every(
            (type) => !currentTeamTypes.has(normalizeName(type)),
          );
          if (!allTypesAreNew) {
            return false;
          }
        }
        if (!normalizedQuery) {
          return true;
        }

        return (
          pokemonSearchIndex.get(normalizeName(pokemon.name)) ?? ""
        ).includes(normalizedQuery);
      });
    },
    [
      abilityChangesOnly,
      addsNewTeamTypeOnly,
      currentTeamTypes,
      data,
      normalizedQuery,
      allTypesNewToTeamOnly,
      pokemonEntries,
      pokemonMode,
      pokemonSearchIndex,
      statChangesOnly,
      tab,
      typeChangesOnly,
    ],
  );
  const dexQuery = useMemo(
    () =>
      buildDexStateQuery({
        tab,
        query,
        pokemonMode,
        typeChangesOnly: typeChangesOnly === "1",
        statChangesOnly: statChangesOnly === "1",
        abilityChangesOnly: abilityChangesOnly === "1",
        addsNewTeamTypeOnly: addsNewTeamTypeOnly === "1",
        allTypesNewToTeamOnly: allTypesNewToTeamOnly === "1",
      }),
    [
      abilityChangesOnly,
      addsNewTeamTypeOnly,
      allTypesNewToTeamOnly,
      pokemonMode,
      query,
      statChangesOnly,
      tab,
      typeChangesOnly,
    ],
  );
  const filteredMoves = useMemo(
    () => {
      if (tab !== "moves") {
        return [];
      }

      return moveEntries.filter((move) => {
        if (!normalizedQuery) {
          return true;
        }
        return (
          normalizeName(move.name).includes(normalizedQuery) ||
          normalizeName(move.description ?? "").includes(normalizedQuery)
        );
      });
    },
    [moveEntries, normalizedQuery, tab],
  );
  const filteredAbilities = useMemo(
    () => {
      if (tab !== "abilities") {
        return [];
      }

      return abilityEntries.filter((ability) => {
        if (!normalizedQuery) {
          return true;
        }
        return (
          normalizeName(ability.name).includes(normalizedQuery) ||
          normalizeName(ability.effect ?? "").includes(normalizedQuery)
        );
      });
    },
    [abilityEntries, normalizedQuery, tab],
  );
  const filteredItems = useMemo(
    () => {
      if (tab !== "items") {
        return [];
      }

      return itemEntries.filter((item) => {
        if (!normalizedQuery) {
          return true;
        }
        return (
          normalizeName(item.name).includes(normalizedQuery) ||
          normalizeName(item.effect ?? "").includes(normalizedQuery) ||
          normalizeName(item.category ?? "").includes(normalizedQuery)
        );
      });
    },
    [itemEntries, normalizedQuery, tab],
  );

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.sessionStorage.getItem(DEX_SCROLL_RESTORE_KEY);
    if (!raw || !window.location.hash) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        anchorId?: string;
        topOffset?: number;
      };
      const hashId = window.location.hash.replace(/^#/, "");
      if (
        !parsed.anchorId ||
        parsed.anchorId !== hashId ||
        typeof parsed.topOffset !== "number"
      ) {
        return;
      }

      const anchor = document.getElementById(parsed.anchorId);
      if (!anchor) {
        return;
      }

      const currentTop = anchor.getBoundingClientRect().top;
      const nextScrollTop = window.scrollY + currentTop - parsed.topOffset;
      window.scrollTo({ top: Math.max(0, nextScrollTop), behavior: "auto" });
    } finally {
      window.sessionStorage.removeItem(DEX_SCROLL_RESTORE_KEY);
    }
  }, []);

  return (
    <main className="relative overflow-visible px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="panel panel-frame overflow-hidden">
          <div className="relative border-b border-line-soft px-5 py-5 sm:px-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,199,107,0.16),transparent_38%),radial-gradient(circle_at_80%_30%,rgba(81,255,204,0.12),transparent_34%)]" />
            <div className="relative">
              <p className="display-face text-sm text-[hsl(39_100%_78%)]">
                Redux Dex
              </p>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as DexTab)}
              className="gap-4"
            >
              <div className="flex flex-col gap-3">
                <div className="relative w-full max-w-xl">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={getSearchPlaceholder(tab)}
                    className={query ? "pr-20" : undefined}
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center rounded-full border border-line-soft bg-surface-5 px-2 py-1 text-[11px] font-medium text-muted transition hover:border-line hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fill-hover"
                      aria-label="Clear search"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <TabsList className="tab-strip scrollbar-thin">
                  <TabsTrigger value="pokemon" className="tab-trigger-soft">
                    Pokemon
                  </TabsTrigger>
                  <TabsTrigger value="moves" className="tab-trigger-soft">
                    Moves
                  </TabsTrigger>
                  <TabsTrigger value="abilities" className="tab-trigger-soft">
                    Abilities
                  </TabsTrigger>
                  <TabsTrigger value="items" className="tab-trigger-soft">
                    Items
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="pokemon" className="tab-panel">
                <div className="mb-4 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPokemonMode("national")}
                      className={clsx(
                        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition",
                        pokemonMode === "national"
                          ? "border-warning-line bg-warning-line/10 text-[hsl(39_100%_82%)]"
                          : "border-line-soft bg-surface-3 text-muted hover:border-line hover:text-text",
                      )}
                    >
                      Dex nacional
                    </button>
                    <button
                      type="button"
                      onClick={() => setPokemonMode("gen5")}
                      className={clsx(
                        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition",
                        pokemonMode === "gen5"
                          ? "border-warning-line bg-warning-line/10 text-[hsl(39_100%_82%)]"
                          : "border-line-soft bg-surface-3 text-muted hover:border-line hover:text-text",
                      )}
                    >
                      BW2 Gen 5
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <DexFilterToggle
                      active={typeChangesOnly === "1"}
                      onClick={() =>
                        setTypeChangesOnly(typeChangesOnly === "1" ? "0" : "1")
                      }
                    >
                      Tipos cambiados
                    </DexFilterToggle>
                    <DexFilterToggle
                      active={statChangesOnly === "1"}
                      onClick={() =>
                        setStatChangesOnly(statChangesOnly === "1" ? "0" : "1")
                      }
                    >
                      Stats cambiados
                    </DexFilterToggle>
                    <DexFilterToggle
                      active={abilityChangesOnly === "1"}
                      onClick={() =>
                        setAbilityChangesOnly(abilityChangesOnly === "1" ? "0" : "1")
                      }
                    >
                      Habilidades nuevas/cambiadas
                    </DexFilterToggle>
                    <DexFilterToggle
                      active={addsNewTeamTypeOnly === "1"}
                      onClick={() =>
                        setAddsNewTeamTypeOnly(addsNewTeamTypeOnly === "1" ? "0" : "1")
                      }
                    >
                      Aporta tipo nuevo al team
                    </DexFilterToggle>
                    <DexFilterToggle
                      active={allTypesNewToTeamOnly === "1"}
                      onClick={() =>
                        setAllTypesNewToTeamOnly(allTypesNewToTeamOnly === "1" ? "0" : "1")
                      }
                    >
                      Todos sus tipos son nuevos
                    </DexFilterToggle>
                  </div>
                </div>
                <DexIncrementalGrid
                  key={`pokemon:${normalizedQuery}`}
                  items={filteredPokemon}
                  emptyLabel="No encontré Pokemon con ese filtro."
                  loadingLabel="Cargando mas Pokemon..."
                  renderItem={(pokemon) => {
                    const speciesKey = normalizeName(pokemon.name);
                    const wildEncounters =
                      acquisitionBySpecies.wildBySpecies.get(speciesKey) ?? [];
                    const gifts =
                      acquisitionBySpecies.giftsBySpecies.get(speciesKey) ?? [];
                    const trades =
                      acquisitionBySpecies.tradesBySpecies.get(speciesKey) ??
                      [];

                    return (
                      <PokemonDexCard
                        key={pokemon.slug}
                        pokemon={pokemon}
                        abilityEffects={abilityEffects}
                        moveDetailsByName={moveDetailsByName}
                        wildEncounters={wildEncounters}
                        gifts={gifts}
                        trades={trades}
                        href={`/team/dex/pokemon/${pokemon.slug}${dexQuery}`}
                      />
                    );
                  }}
                />
              </TabsContent>

              <TabsContent value="moves" className="tab-panel">
                <DexIncrementalGrid
                  key={`moves:${normalizedQuery}`}
                  items={filteredMoves}
                  emptyLabel="No encontré movimientos con ese filtro."
                  loadingLabel="Cargando mas movimientos..."
                  renderItem={(move) => (
                    <article
                      key={move.name}
                      className="panel-strong panel-frame rounded-[1rem] p-4"
                    >
                      <DexMoveEntryCard move={move} />
                      <SegmentedOwnerCollapsible
                        label="Pokemon que lo aprenden"
                        dexBySpecies={dexBySpecies}
                        sections={[
                          {
                            title: "Por level up",
                            values:
                              ownersByMove.get(normalizeName(move.name))
                                ?.levelUp ?? [],
                          },
                          {
                            title: "Por MT / Tutor",
                            values:
                              ownersByMove.get(normalizeName(move.name))
                                ?.machines ?? [],
                          },
                        ]}
                        emptyLabel="Sin usuarios listados."
                        closedLabel="Ver usuarios"
                        count={
                          (ownersByMove.get(normalizeName(move.name))?.levelUp
                            ?.length ?? 0) +
                          (ownersByMove.get(normalizeName(move.name))?.machines
                            ?.length ?? 0)
                        }
                      />
                    </article>
                  )}
                />
              </TabsContent>

              <TabsContent value="abilities" className="tab-panel">
                <DexIncrementalGrid
                  key={`abilities:${normalizedQuery}`}
                  items={filteredAbilities}
                  emptyLabel="No encontré habilidades con ese filtro."
                  loadingLabel="Cargando mas habilidades..."
                  renderItem={(ability) => (
                    <article
                      key={ability.name}
                      className="panel-strong panel-frame rounded-[1rem] p-4"
                    >
                      <h2 className="display-face text-sm text-text">
                        {ability.name}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-muted">
                        {ability.effect || "Sin efecto registrado."}
                      </p>
                      <SegmentedOwnerCollapsible
                        label="Pokemon que la poseen"
                        dexBySpecies={dexBySpecies}
                        sections={[
                          {
                            title: "Habilidad normal",
                            values:
                              ownersByAbility.get(normalizeName(ability.name))
                                ?.regular ?? [],
                          },
                          {
                            title: "Habilidad oculta",
                            values:
                              ownersByAbility.get(normalizeName(ability.name))
                                ?.hidden ?? [],
                          },
                        ]}
                        emptyLabel="Sin usuarios listados."
                        closedLabel="Ver usuarios"
                        count={
                          (ownersByAbility.get(normalizeName(ability.name))
                            ?.regular.length ?? 0) +
                          (ownersByAbility.get(normalizeName(ability.name))
                            ?.hidden.length ?? 0)
                        }
                      />
                    </article>
                  )}
                />
              </TabsContent>

              <TabsContent value="items" className="tab-panel">
                <DexIncrementalGrid
                  key={`items:${normalizedQuery}`}
                  items={filteredItems}
                  emptyLabel="No encontré objetos con ese filtro."
                  loadingLabel="Cargando mas objetos..."
                  renderItem={(item) => {
                    const locations =
                      locationsByItem.get(normalizeName(item.name)) ?? [];

                    return (
                      <article
                        key={item.name}
                        className="panel-strong panel-frame rounded-[1rem] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <ItemSprite name={item.name} sprite={item.sprite} />
                          <div className="min-w-0">
                            <h2 className="display-face text-sm text-text">
                              {item.name}
                            </h2>
                            {item.category ? (
                              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-text-faint">
                                {item.category}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted">
                          {item.effect || "Sin efecto registrado."}
                        </p>
                        <div className="mt-4 border-t border-line-soft pt-3">
                          <p className="micro-label text-text-faint">
                            Obtencion en BW2 Redux
                          </p>
                          {locations.length ? (
                            <div className="mt-2 flex flex-col gap-2">
                              {locations.slice(0, 6).map((location) => (
                                <div
                                  key={`${item.name}-${location.area}-${location.detail}`}
                                  className="rounded-[0.8rem] border border-line-soft bg-surface-3 px-3 py-2"
                                >
                                  <p className="text-sm text-text">
                                    {location.area}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-muted">
                                    {location.detail}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-muted">
                              No encontré una ubicacion directa en la data
                              parseada del hack.
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </main>
  );
}

function DexSectionHeader({
  count,
  limit,
  emptyLabel,
}: {
  count: number;
  limit: number;
  emptyLabel: string;
}) {
  if (!count) {
    return <p className="mb-3 text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted">
        {count > limit
          ? `Mostrando ${limit} de ${count} resultados.`
          : `${count} resultados.`}
      </p>
      <p className="text-xs text-text-faint">Busca por nombre o efecto.</p>
    </div>
  );
}

function DexIncrementalGrid<T>({
  items,
  emptyLabel,
  loadingLabel,
  renderItem,
}: {
  items: T[];
  emptyLabel: string;
  loadingLabel: string;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_RESULTS);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );
  const setSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node || visibleCount >= items.length) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) {
            return;
          }

          setVisibleCount((current) =>
            Math.min(current + RESULT_BATCH_SIZE, items.length),
          );
        },
        { rootMargin: "320px 0px" },
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [items.length, visibleCount],
  );

  return (
    <>
      <DexSectionHeader
        count={items.length}
        limit={visibleCount}
        emptyLabel={emptyLabel}
      />
      <div className="grid gap-3 xl:grid-cols-2">
        {visibleItems.map((item, index) => renderItem(item, index))}
      </div>
      {visibleCount < items.length ? (
        <div
          ref={setSentinelRef}
          className="mt-4 flex justify-center"
          aria-hidden="true"
        >
          <span className="rounded-full border border-line-soft bg-surface-3 px-3 py-1 text-xs text-text-faint">
            {loadingLabel}
          </span>
        </div>
      ) : null}
    </>
  );
}

function SegmentedOwnerCollapsible({
  label,
  dexBySpecies,
  sections,
  count,
  closedLabel,
  emptyLabel,
}: {
  label: string;
  dexBySpecies: Record<string, number>;
  sections: Array<{ title: string; values: string[] }>;
  count: number;
  closedLabel: string;
  emptyLabel: string;
}) {
  const nonEmptySections = sections.filter((section) => section.values.length);

  return (
    <div className="mt-4 border-t border-line-soft pt-3">
      <p className="micro-label text-text-faint">{label}</p>
      {count ? (
        <Collapsible className="mt-2 rounded-[0.7rem] border border-line-soft bg-surface-3 px-2 py-1.5">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
            <div>
              <p className="display-face text-[11px] text-text">
                {closedLabel}
              </p>
              <p className="mt-1 text-xs text-muted">{count} Pokemon</p>
            </div>
            <span className="text-xs text-text-faint transition-transform data-[panel-open]:rotate-180">
              ⌄
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {nonEmptySections.map((section) => (
              <div key={`${label}-${section.title}`} className="space-y-1">
                <p className="display-face text-[10px] text-text-faint">
                  {section.title}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {section.values.map((value, index) => (
                    <OwnerSpriteChip
                      key={`${section.title}-${value}-${index}`}
                      species={value}
                      dexBySpecies={dexBySpecies}
                    />
                  ))}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <p className="mt-2 text-sm text-muted">{emptyLabel}</p>
      )}
    </div>
  );
}

function OwnerSpriteChip({
  species,
  dexBySpecies,
}: {
  species: string;
  dexBySpecies: Record<string, number>;
}) {
  const dex =
    dexBySpecies[normalizeName(species)] ??
    dexBySpecies[normalizeName(getBaseSpeciesName(species))];
  const sprites = buildSpriteUrls(species, dex);

  return (
    <span
      className="inline-flex rounded-[0.6rem] border border-line-soft bg-surface-2 p-1"
      title={species}
      aria-label={species}
    >
      <PokemonSprite
        species={species}
        spriteUrl={sprites.spriteUrl}
        animatedSpriteUrl={sprites.animatedSpriteUrl}
        size="tiny"
        chrome="plain"
      />
    </span>
  );
}

function StatChip({ label }: { label: string }) {
  return (
    <span
      className={clsx(
        "rounded-full border border-line-soft bg-surface-3 px-2.5 py-1 text-xs text-text-faint",
      )}
    >
      {label}
    </span>
  );
}

function sanitizeAbilityList(abilities: string[] = []) {
  return abilities.filter((ability) => {
    const trimmed = ability.trim();
    return trimmed.length > 0 && trimmed !== "-";
  });
}

function DexFilterToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition",
        active
          ? "border-accent-line bg-accent/10 text-accent"
          : "border-line-soft bg-surface-3 text-muted hover:border-line hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

function getSearchPlaceholder(tab: DexTab) {
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

export function PokemonDexCard({
  pokemon,
  abilityEffects,
  wildEncounters,
  gifts,
  trades,
  href,
  transitionTypes,
  expanded = false,
  headerAction,
  forms,
  evolutions,
  moveDetailsByName,
  dexQuery = "",
}: {
  pokemon: {
    dex: number;
    name: string;
    slug: string;
    types: string[];
    spriteUrl?: string;
    animatedSpriteUrl?: string;
    stats?: {
      hp: number;
      atk: number;
      def: number;
      spa: number;
      spd: number;
      spe: number;
      bst: number;
    };
    generation?: string | null;
    category?: string | null;
    height?: number | null;
    weight?: number | null;
    canonicalStats?: {
      hp: number;
      atk: number;
      def: number;
      spa: number;
      spd: number;
      spe: number;
      bst: number;
    };
    abilities: string[];
    flavorText?: string | null;
    nextEvolutions: string[];
    evolutionDetails: {
      target: string;
      minLevel?: number | null;
      item?: string | null;
      heldItem?: string | null;
      knownMove?: string | null;
      knownMoveType?: string | null;
      timeOfDay?: string | null;
      location?: string | null;
      trigger?: string | null;
    }[];
    learnsets?: {
      levelUp: { level: number; move: string }[];
      machines: { source: string; move: string }[];
    };
  };
  abilityEffects: Map<string, string>;
  wildEncounters: { area: string; method: string }[];
  gifts: { location: string; level: string }[];
  trades: { location: string; requested: string }[];
  href?: string;
  transitionTypes?: string[];
  expanded?: boolean;
  headerAction?: React.ReactNode;
  forms?: Array<{
    name: string;
    slug: string;
    types: string[];
    spriteUrl?: string;
    animatedSpriteUrl?: string;
    abilities: string[];
    stats?: {
      hp: number;
      atk: number;
      def: number;
      spa: number;
      spd: number;
      spe: number;
      bst: number;
    };
  }>;
  evolutions?: Array<
    Array<{
      name: string;
      slug: string;
      spriteUrl?: string;
      animatedSpriteUrl?: string;
      summaryFromPrevious?: string;
      current?: boolean;
    }>
  >;
  moveDetailsByName?: Map<
    string,
    {
      name: string;
      type: string;
      damageClass: string;
      power?: number | null;
      accuracy?: number | null;
      description?: string;
    }
  >;
  dexQuery?: string;
}) {
  const cardForwardTransition = useSafeTransitionTypes(
    transitionTypes ?? ["dex-forward"],
  );
  const evolutionForwardTransition = useSafeTransitionTypes(["dex-forward"]);
  const hasEvolutionChain = Boolean(
    evolutions?.some((chain) => chain.length > 1),
  );
  const evolutionChains = hasEvolutionChain ? evolutions ?? [] : [];
  const spriteShellStyle = getDexSpriteShellStyle(pokemon.types);
  const anchorId = getDexAnchorId(pokemon.slug);
  const acquisitionGroups = [
    {
      title: "Wild",
      values: wildEncounters.map((entry) => `${entry.area} · ${entry.method}`),
    },
    {
      title: "Gift",
      values: gifts.map((entry) => `${entry.location} · Lv ${entry.level}`),
    },
    {
      title: "Trade",
      values: trades.map(
        (entry) => `${entry.location} · por ${entry.requested}`,
      ),
    },
  ].filter((group) => group.values.length);
  const cardBody = (
    <ViewTransition name={getDexTransitionName("card", pokemon.slug)}>
      <article
        id={!expanded ? anchorId : undefined}
        className={clsx(
          "panel-strong panel-frame relative overflow-hidden rounded-[1rem] p-3 transition-[transform,border-color,background-color] duration-200",
          !expanded && "scroll-mt-24",
          href && "group hover:border-warning-line hover:bg-surface-2/90",
          expanded && "p-4 sm:p-5",
        )}
        style={
          expanded
            ? undefined
            : {
                contentVisibility: "auto",
                containIntrinsicSize: "320px",
              }
        }
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,214,120,0.12),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(89,181,255,0.12),transparent_28%)]" />
        <div className="relative">
          {expanded && headerAction ? (
            <div className="mb-3 flex justify-end">{headerAction}</div>
          ) : null}
          <div className={clsx("flex items-start gap-4", expanded && "gap-4")}>
            <ViewTransition name={getDexTransitionName("sprite", pokemon.slug)}>
              <div
                className={clsx(
                  "relative flex items-center justify-center overflow-hidden border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                  expanded
                    ? "h-36 w-36 rounded-[1rem]"
                    : "h-14 w-14 rounded-[0.75rem]",
                )}
                style={spriteShellStyle}
              >
                <PokemonSprite
                  species={pokemon.name}
                  spriteUrl={pokemon.spriteUrl}
                  animatedSpriteUrl={
                    expanded ? pokemon.animatedSpriteUrl : undefined
                  }
                  size={expanded ? "large" : "small"}
                  chrome="plain"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_38%,rgba(0,0,0,0.12))]" />
              </div>
            </ViewTransition>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pixel-face text-xs text-text-faint">
                  #{String(pokemon.dex).padStart(3, "0")}
                </span>
                <h2
                  className={clsx(
                    "display-face text-sm text-text",
                    expanded && "text-base",
                  )}
                >
                  {pokemon.name}
                </h2>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {pokemon.types.map((type, index) => (
                  <TypeBadge
                    key={`${pokemon.slug}-${type}-${index}`}
                    type={type}
                  />
                ))}
              </div>
              {expanded ? (
                <>
                  {(pokemon.generation || pokemon.category || pokemon.height || pokemon.weight) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {pokemon.generation ? <StatChip label={pokemon.generation} /> : null}
                      {pokemon.category ? <StatChip label={pokemon.category} /> : null}
                      {typeof pokemon.height === "number" ? (
                        <StatChip label={`Height ${pokemon.height.toFixed(1)} m`} />
                      ) : null}
                      {typeof pokemon.weight === "number" ? (
                        <StatChip label={`Weight ${pokemon.weight.toFixed(1)} kg`} />
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatChip
                      label={formatBstLabel(
                        pokemon.stats?.bst,
                        pokemon.canonicalStats?.bst,
                      )}
                    />
                  </div>
                  {pokemon.flavorText ? (
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {pokemon.flavorText}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {expanded ? (
            <div
              className={clsx(
                "mt-3 grid gap-2.5 lg:grid-cols-2",
                expanded && "xl:grid-cols-2",
              )}
            >
              <InfoBlock label="Habilidades">
                {sanitizeAbilityList(pokemon.abilities).length ? (
                  <div className="flex flex-wrap gap-2">
                    {sanitizeAbilityList(pokemon.abilities).map((ability, index) => (
                      <Link
                        key={`${pokemon.slug}-${ability}-${index}`}
                        href={getDexSearchHref("abilities", ability)}
                        className="display-face rounded-full border border-line-soft bg-surface-3 px-2.5 py-1.5 text-[11px] text-text transition-colors hover:border-warning-line hover:text-[hsl(39_100%_78%)]"
                      >
                        {ability}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    Sin habilidades registradas.
                  </p>
                )}
              </InfoBlock>

              {hasEvolutionChain ? (
                <InfoBlock label="Evolucion">
                  <div className=" pb-1">
                    {evolutionChains.map((chain, chainIndex) => (
                      <div key={`${pokemon.slug}-chain-${chainIndex}`}>
                        <div className="mx-auto flex w-max min-w-max items-center justify-between gap-4">
                          {chain.map((node, nodeIndex) => (
                            <div
                              key={`${node.slug}-${nodeIndex}`}
                              className="contents"
                            >
                              {nodeIndex > 0 ? (
                                <div className="flex flex-col items-center gap-0 text-center">
                                  <span className="text-[10px] text-text-faint">
                                    →
                                  </span>
                                  {node.summaryFromPrevious ? (
                                    <span className="whitespace-pre-line text-[9px] leading-3 text-muted">
                                      {formatEvolutionSummary(
                                        node.summaryFromPrevious,
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}
                              {node.current ? (
                                <div className="flex w-14 shrink-0 flex-col items-center gap-0.5 text-center text-[hsl(39_100%_78%)]">
                                  <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[0.65rem] border border-white/10 bg-surface-1">
                                    <PokemonSprite
                                      species={node.name}
                                      spriteUrl={node.spriteUrl}
                                      animatedSpriteUrl={undefined}
                                      size="small"
                                      chrome="plain"
                                    />
                                  </div>
                                  <span className="display-face text-[10px] leading-3 text-current">
                                    {node.name}
                                  </span>
                                </div>
                              ) : (
                                <Link
                                  href={`/team/dex/pokemon/${node.slug}${dexQuery}`}
                                  transitionTypes={evolutionForwardTransition}
                                  className="group flex w-14 shrink-0 flex-col items-center gap-0.5 text-center text-text transition-colors hover:text-[hsl(39_100%_78%)]"
                                >
                                  <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[0.65rem] border border-white/10 bg-surface-1">
                                    <PokemonSprite
                                      species={node.name}
                                      spriteUrl={node.spriteUrl}
                                      animatedSpriteUrl={undefined}
                                      size="small"
                                      chrome="plain"
                                    />
                                  </div>
                                  <span className="display-face text-[10px] leading-3 text-current">
                                    {node.name}
                                  </span>
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </InfoBlock>
              ) : null}

              {pokemon.stats ? (
                <InfoBlock label="Stats">
                  <div className="space-y-1.5">
                    <StatBar
                      label="HP"
                      value={pokemon.stats.hp}
                      baselineValue={pokemon.canonicalStats?.hp}
                      max={160}
                      transitionName="dex-stat-hp"
                    />
                    <StatBar
                      label="Atk"
                      value={pokemon.stats.atk}
                      baselineValue={pokemon.canonicalStats?.atk}
                      max={160}
                      transitionName="dex-stat-atk"
                    />
                    <StatBar
                      label="Def"
                      value={pokemon.stats.def}
                      baselineValue={pokemon.canonicalStats?.def}
                      max={160}
                      transitionName="dex-stat-def"
                    />
                    <StatBar
                      label="SpA"
                      value={pokemon.stats.spa}
                      baselineValue={pokemon.canonicalStats?.spa}
                      max={160}
                      transitionName="dex-stat-spa"
                    />
                    <StatBar
                      label="SpD"
                      value={pokemon.stats.spd}
                      baselineValue={pokemon.canonicalStats?.spd}
                      max={160}
                      transitionName="dex-stat-spd"
                    />
                    <StatBar
                      label="Spe"
                      value={pokemon.stats.spe}
                      baselineValue={pokemon.canonicalStats?.spe}
                      max={160}
                      transitionName="dex-stat-spe"
                    />
                  </div>
                </InfoBlock>
              ) : null}

              {pokemon.types.length ? (
                <InfoBlock label="Typing">
                  <DefenseSection types={pokemon.types} />
                </InfoBlock>
              ) : null}

              {acquisitionGroups.length ? (
                <InfoBlock label="Obtencion en Redux">
                  <div className="space-y-1.5">
                    {acquisitionGroups.map((group) => (
                      <AcquisitionList
                        key={`${pokemon.slug}-${group.title}`}
                        title={group.title}
                        values={group.values}
                      />
                    ))}
                  </div>
                </InfoBlock>
              ) : null}

              {forms?.length ? (
                <InfoBlock label="Formas">
                  <div className="space-y-1.5">
                    {forms.map((form) => (
                      <div
                        key={form.slug}
                        className="flex items-start gap-2.5 rounded-[0.7rem] border border-line-soft bg-surface-3 px-2.5 py-2"
                      >
                        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[0.7rem] border border-white/10 bg-surface-2">
                          <PokemonSprite
                            species={form.name}
                            spriteUrl={form.spriteUrl}
                            animatedSpriteUrl={undefined}
                            size="small"
                            chrome="plain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="display-face text-[11px] text-text">
                              {form.name}
                            </p>
                            {getBaseSpeciesName(form.name) === form.name ? (
                              <span className="rounded-full border border-line-soft bg-surface-2 px-2 py-0.5 text-[10px] text-text-faint">
                                Base
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {form.types.map((type) => (
                              <TypeBadge
                                key={`${form.slug}-${type}`}
                                type={type}
                              />
                            ))}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {sanitizeAbilityList(form.abilities).map((ability) => (
                              <span
                                key={`${form.slug}-${ability}`}
                                className="rounded-full border border-line-soft bg-surface-2 px-2.5 py-1 text-[11px] text-text-faint"
                              >
                                {ability}
                              </span>
                            ))}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            <StatChip label={`BST ${form.stats?.bst ?? "-"}`} />
                            <StatChip label={`Spe ${form.stats?.spe ?? "-"}`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </InfoBlock>
              ) : null}

              {pokemon.learnsets?.levelUp?.length ||
              pokemon.learnsets?.machines?.length ? (
                <InfoBlock label="Learnset">
                  <Collapsible className="rounded-[0.7rem] border border-line-soft bg-surface-3 px-2 py-1.5">
                    <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 text-left">
                      <div>
                        <p className="display-face text-[11px] text-text">
                          Ver movimientos
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {pokemon.learnsets?.levelUp?.length ?? 0} level up ·{" "}
                          {pokemon.learnsets?.machines?.length ?? 0} machines
                        </p>
                      </div>
                      <span className="text-xs text-text-faint transition-transform data-[panel-open]:rotate-180">
                        ⌄
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                      {(pokemon.learnsets?.levelUp?.length ?? 0) ? (
                        <div className="space-y-1">
                          <p className="display-face text-[10px] text-text-faint">
                            Level up
                          </p>
                          <div className="space-y-1">
                            {(pokemon.learnsets?.levelUp ?? []).map(
                              (entry, index) => (
                                <Link
                                  key={`${pokemon.slug}-levelup-${entry.move}-${index}`}
                                  href={getDexSearchHref("moves", entry.move)}
                                  className="block"
                                >
                                  <DexMoveEntryCard
                                    move={resolveDexMoveCardData(
                                      entry,
                                      moveDetailsByName,
                                    )}
                                    eyebrow={`Lv ${entry.level}`}
                                    compact
                                  />
                                </Link>
                              ),
                            )}
                          </div>
                        </div>
                      ) : null}
                      {(pokemon.learnsets?.machines?.length ?? 0) ? (
                        <div className="space-y-1">
                          <p className="display-face text-[10px] text-text-faint">
                            Machines
                          </p>
                          <div className="space-y-1">
                            {(pokemon.learnsets?.machines ?? []).map(
                              (entry, index) => (
                                <Link
                                  key={`${pokemon.slug}-machine-${entry.move}-${index}`}
                                  href={getDexSearchHref("moves", entry.move)}
                                  className="block"
                                >
                                  <DexMoveEntryCard
                                    move={resolveDexMoveCardData(
                                      entry,
                                      moveDetailsByName,
                                    )}
                                    eyebrow={entry.source}
                                    compact
                                  />
                                </Link>
                              ),
                            )}
                          </div>
                        </div>
                      ) : null}
                    </CollapsibleContent>
                  </Collapsible>
                </InfoBlock>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
    </ViewTransition>
  );

  if (!href) {
    return cardBody;
  }

  return (
      <Link
        href={href}
        transitionTypes={cardForwardTransition}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-line"
        onClick={(event) => {
        if (typeof window === "undefined") {
          return;
        }
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        markNavigationStart("dex-card-to-detail", href);

        const card = document.getElementById(anchorId);
        if (!card) {
          return;
        }

        window.sessionStorage.setItem(
          DEX_SCROLL_RESTORE_KEY,
          JSON.stringify({
            anchorId,
            topOffset: card.getBoundingClientRect().top,
          }),
        );
      }}
    >
      {cardBody}
    </Link>
  );
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[0.8rem] border border-line-soft bg-surface-2/85 px-2.5 py-2.5">
      <p className="micro-label text-text-faint">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function DexMoveEntryCard({
  move,
  eyebrow,
  compact = false,
}: {
  move: {
    name: string;
    type: string;
    damageClass: string;
    power?: number | null;
    accuracy?: number | null;
    description?: string;
  };
  eyebrow?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-[0.7rem]",
        compact ? "" : "border border-line-soft bg-surface-3 p-3",
      )}
    >
      {eyebrow ? (
        <p className="mb-1 micro-label text-text-faint">{eyebrow}</p>
      ) : null}
      <MoveSlotSurface
        move={{
          name: move.name,
          type: move.type,
          hasStab: false,
          damageClass: move.damageClass,
          power: move.power,
          adjustedPower: move.power,
        }}
        className={clsx("w-full", compact && "px-2 py-1")}
      />
      {!compact ? (
        <p className="mt-3 text-sm leading-6 text-muted">
          {move.description || "Sin descripcion registrada."}
        </p>
      ) : null}
    </div>
  );
}

function AcquisitionList({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  const sliced = values.slice(0, 4);

  return (
    <div>
      <p className="display-face text-[10px] text-text-faint">{title}</p>
      {sliced.length ? (
        <div className="mt-1 flex flex-col gap-1.5">
          {sliced.map((value, index) => (
            <div
              key={`${title}-${value}-${index}`}
              className="rounded-[0.7rem] border border-line-soft bg-surface-3 px-2.5 py-1.5 text-xs leading-5 text-text"
            >
              {value}
            </div>
          ))}
          {values.length > sliced.length ? (
            <p className="text-xs text-text-faint">
              +{values.length - sliced.length} entradas mas
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">Sin registro.</p>
      )}
    </div>
  );
}

function getDexTransitionName(part: string, slug: string) {
  return `dex-${part}-${slug}`;
}

function getDexAnchorId(slug: string) {
  return `dex-entry-${slug}`;
}

function getDexSearchHref(tab: DexTab, query: string) {
  return `/team/dex?tab=${tab}&q=${encodeURIComponent(query)}`;
}

function formatBstLabel(current?: number, baseline?: number) {
  if (typeof current !== "number") {
    return "BST -";
  }

  if (typeof baseline !== "number" || baseline === current) {
    return `BST ${current}`;
  }

  const delta = current - baseline;
  return `BST ${current} (${delta > 0 ? `+${delta}` : delta})`;
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
}: {
  tab?: DexTab | null;
  query?: string | null;
  pokemonMode?: DexPokemonMode | null;
  typeChangesOnly?: boolean;
  statChangesOnly?: boolean;
  abilityChangesOnly?: boolean;
  addsNewTeamTypeOnly?: boolean;
  allTypesNewToTeamOnly?: boolean;
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

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

function sameStringList(left: string[] = [], right: string[] = []) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (value, index) => normalizeName(value) === normalizeName(right[index] ?? ""),
  );
}

function sameStats(
  left?:
    | {
        hp: number;
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
        bst: number;
      }
    | undefined,
  right?:
    | {
        hp: number;
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
        bst: number;
      }
    | undefined,
) {
  if (!left || !right) {
    return left === right;
  }

  return (
    left.hp === right.hp &&
    left.atk === right.atk &&
    left.def === right.def &&
    left.spa === right.spa &&
    left.spd === right.spd &&
    left.spe === right.spe &&
    left.bst === right.bst
  );
}

function formatEvolutionSummary(summary: string) {
  const parts = summary
    .split(/\s+·\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const normalized = parts.flatMap((part) => {
    if (/^level-up$/i.test(part) || /^use-item$/i.test(part)) {
      return [];
    }

    if (/^use item\s+/i.test(part)) {
      const item = part.replace(/^use item\s+/i, "").trim();
      return item ? ["Usa", item] : ["Usa"];
    }

    if (/^use\s+/i.test(part)) {
      const item = part.replace(/^use\s+/i, "").trim();
      return item ? ["Usa", item] : ["Usa"];
    }

    if (/^item\s+/i.test(part)) {
      const item = part.replace(/^item\s+/i, "").trim();
      return item ? ["Usa", item] : ["Usa"];
    }

    if (/^lv\s+\d+$/i.test(part)) {
      return [part.replace(/^lv/i, "Lv")];
    }

    return [part];
  });

  return normalized
    .map((part) => part.split(/\s+/).filter(Boolean).join("\n"))
    .join("\n");
}

function resolveDexMoveCardData(
  entry: {
    move: string;
    details?: {
      name?: string;
      type?: string;
      damageClass?: string;
      power?: number | null;
      accuracy?: number | null;
      description?: string;
    } | null;
  },
  moveDetailsByName?: Map<
    string,
    {
      name: string;
      type: string;
      damageClass: string;
      power?: number | null;
      accuracy?: number | null;
      description?: string;
    }
  >,
) {
  const resolved =
    entry.details ?? moveDetailsByName?.get(normalizeName(entry.move));

  return {
    name: resolved?.name ?? entry.move,
    type: resolved?.type ?? "Normal",
    damageClass: resolved?.damageClass ?? "status",
    power: resolved?.power,
    accuracy: resolved?.accuracy,
    description: resolved?.description,
  };
}

function dedupeStrings(values?: string[] | null) {
  return Array.from(new Set((values ?? []).filter(Boolean)));
}

function getDexSpriteShellStyle(types: string[]) {
  return getTypedSurfaceStyle(types, {
    primaryGlowMix: 24,
    secondaryGlowMix: 22,
    primaryBodyMix: 12,
    secondaryBodyMix: 11,
  });
}
