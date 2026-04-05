"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo } from "react";

import { useTeamCatalogs } from "@/components/BuilderProvider";
import {
  buildDexStateQuery,
  matchesDexMode,
  matchesTypeSlotFilters,
  PokemonDexCard,
} from "@/components/team/screens/DexScreen";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import { getAvailableFormsForSpecies } from "@/lib/forms";
import { markNavigationStart } from "@/lib/perf";
import { entryMatchesSpecies, giftMatchesSpecies } from "@/lib/domain/sourceData";
import { useSafeTransitionTypes } from "@/lib/viewTransitions";

export function DexPokemonDetailScreen({ slug }: { slug: string }) {
  const catalogs = useTeamCatalogs();
  const searchParams = useSearchParams();
  const abilityEffects = useMemo(
    () =>
      new Map(
        catalogs.abilityCatalog.map((ability) => [
          normalizeName(ability.name),
          ability.effect ?? "Sin efecto registrado.",
        ]),
      ),
    [catalogs.abilityCatalog],
  );
  const moveDetailsByName = useMemo(
    () =>
      new Map(
        Object.values(catalogs.moveIndex).map((move) => [
          normalizeName(move.name),
          move,
        ]),
      ),
    [catalogs.moveIndex],
  );

  const species = useMemo(
    () =>
      catalogs.speciesCatalog.find((entry) => entry.slug === slug) ??
      catalogs.speciesCatalog.find((entry) => normalizeName(entry.name) === slug),
    [catalogs.speciesCatalog, slug],
  );
  const pokemon =
    catalogs.pokemonIndex[slug] ??
    (species ? catalogs.pokemonIndex[normalizeName(species.name)] : undefined);

  if (!species) {
    return null;
  }

  const sprites = buildSpriteUrls(species.name, species.dex);
  const rawDexMode = searchParams.get("dexMode");
  const dexMode =
    rawDexMode === "gen1" ||
    rawDexMode === "gen2" ||
    rawDexMode === "gen3" ||
    rawDexMode === "gen4" ||
    rawDexMode === "gen5"
      ? rawDexMode
      : "national";
  const typeChangesOnly = searchParams.get("typeChanges") === "1";
  const statChangesOnly = searchParams.get("statChanges") === "1";
  const abilityChangesOnly = searchParams.get("abilityChanges") === "1";
  const primaryTypeFilter = normalizeName(searchParams.get("type1") ?? "");
  const secondaryTypeFilter = normalizeName(searchParams.get("type2") ?? "");
  const orderedSpecies = useMemo(
    () =>
      [...catalogs.speciesCatalog]
        .filter((entry) => {
          const canonicalPokemon =
            catalogs.canonicalPokemonIndex[entry.slug] ??
            catalogs.canonicalPokemonIndex[normalizeName(entry.name)];
          const currentPokemon =
            catalogs.pokemonIndex[entry.slug] ??
            catalogs.pokemonIndex[normalizeName(entry.name)];
          const hasTypeChanges = !sameStringList(
            entry.types ?? [],
            canonicalPokemon?.types ?? [],
          );
          const hasStatChanges = !sameStats(currentPokemon?.stats, canonicalPokemon?.stats);
          const hasAbilityChanges = !sameStringList(
            currentPokemon?.abilities ?? [],
            canonicalPokemon?.abilities ?? [],
          );

          if (!matchesDexMode(entry.dex, dexMode)) {
            return false;
          }
          if (typeChangesOnly && !hasTypeChanges) {
            return false;
          }
          if (statChangesOnly && !hasStatChanges) {
            return false;
          }
          if (abilityChangesOnly && !hasAbilityChanges) {
            return false;
          }
          if (
            !matchesTypeSlotFilters(
              entry.types,
              primaryTypeFilter,
              secondaryTypeFilter,
            )
          ) {
            return false;
          }
          return true;
        })
        .sort((left, right) => left.dex - right.dex || left.name.localeCompare(right.name)),
    [
      abilityChangesOnly,
      catalogs.canonicalPokemonIndex,
      catalogs.pokemonIndex,
      catalogs.speciesCatalog,
      dexMode,
      primaryTypeFilter,
      secondaryTypeFilter,
      statChangesOnly,
      typeChangesOnly,
    ],
  );
  const currentIndex = orderedSpecies.findIndex((entry) => entry.slug === species.slug);
  const previousSpecies = currentIndex > 0 ? orderedSpecies[currentIndex - 1] : null;
  const nextSpecies =
    currentIndex >= 0 && currentIndex < orderedSpecies.length - 1
      ? orderedSpecies[currentIndex + 1]
      : null;
  const backTransition = useSafeTransitionTypes(["dex-back"]);
  const forwardTransition = useSafeTransitionTypes(["dex-forward"]);
  const dexQuery = buildDexStateQuery({
    tab: (searchParams.get("tab") as "pokemon" | "moves" | "abilities" | "items" | null) ?? "pokemon",
    query: searchParams.get("q"),
    pokemonMode: dexMode,
    typeChangesOnly,
    statChangesOnly,
    abilityChangesOnly,
    primaryTypeFilter: searchParams.get("type1"),
    secondaryTypeFilter: searchParams.get("type2"),
  });
  const pokemonNames = useMemo(
    () => catalogs.speciesCatalog.map((entry) => entry.name),
    [catalogs.speciesCatalog],
  );
  const pokemonEntry = {
    dex: species.dex,
    name: species.name,
    slug: species.slug,
    types: species.types,
    spriteUrl: sprites.spriteUrl,
    animatedSpriteUrl: sprites.animatedSpriteUrl,
    stats: pokemon?.stats,
    generation: pokemon?.generation,
    category: pokemon?.category,
    height: pokemon?.height,
    weight: pokemon?.weight,
    canonicalStats:
      catalogs.canonicalPokemonIndex[species.slug]?.stats ??
      catalogs.canonicalPokemonIndex[normalizeName(species.name)]?.stats,
    abilities: pokemon?.abilities ?? [],
    nextEvolutions: pokemon?.nextEvolutions ?? [],
    evolutionDetails: pokemon?.evolutionDetails ?? [],
    learnsets: pokemon?.learnsets,
  };
  const wildEncounters = useMemo(
    () => collectWildEncounters(catalogs.docs.wildAreas, species.name, pokemonNames),
    [catalogs.docs.wildAreas, pokemonNames, species.name],
  );
  const gifts = useMemo(
    () => collectGifts(catalogs.docs.gifts, species.name, pokemonNames),
    [catalogs.docs.gifts, pokemonNames, species.name],
  );
  const trades = useMemo(
    () => collectTrades(catalogs.docs.trades, species.name),
    [catalogs.docs.trades, species.name],
  );
  const forms = useMemo(
    () =>
      getAvailableFormsForSpecies(species.name)
        .map((formName) => {
          const formKey = normalizeName(formName);
          const formPokemon = catalogs.pokemonIndex[formKey] as
            | (typeof catalogs.pokemonIndex)[string] & { dex?: number; slug?: string }
            | undefined;
          if (!formPokemon) {
            return null;
          }

          const formSprites = buildSpriteUrls(formName, formPokemon.dex ?? species.dex);
          return {
            name: formPokemon.name ?? formName,
            slug: formPokemon.slug ?? formKey,
            types: formPokemon.types ?? [],
            spriteUrl: formSprites.spriteUrl,
            animatedSpriteUrl: formSprites.animatedSpriteUrl,
            abilities: formPokemon.abilities ?? [],
            stats: formPokemon.stats,
          };
        })
        .filter((form): form is NonNullable<typeof form> => Boolean(form)),
    [catalogs.pokemonIndex, species.dex, species.name],
  );
  const evolutions = useMemo(
    () => buildEvolutionChains(catalogs, species.slug),
    [catalogs, species.slug],
  );

  return (
    <main className="relative overflow-visible px-4 py-5 sm:px-6 lg:px-8">
      {previousSpecies ? (
        <Link
          href={`/team/dex/pokemon/${previousSpecies.slug}${dexQuery}`}
          prefetch
          transitionTypes={backTransition}
          aria-label={`Pokemon anterior: ${previousSpecies.name}`}
          className="fixed left-1.5 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line-soft bg-surface-2/88 text-text shadow-[0_18px_42px_hsl(0_0%_0%_/_0.24)] backdrop-blur-[16px] transition-colors hover:border-warning-line hover:bg-surface-3 sm:left-2"
          style={{ left: "max(0.375rem, env(safe-area-inset-left))" }}
          onClick={() =>
            markNavigationStart(
              "dex-detail-to-previous",
              `/team/dex/pokemon/${previousSpecies.slug}${dexQuery}`,
            )
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {nextSpecies ? (
        <Link
          href={`/team/dex/pokemon/${nextSpecies.slug}${dexQuery}`}
          prefetch
          transitionTypes={forwardTransition}
          aria-label={`Pokemon siguiente: ${nextSpecies.name}`}
          className="fixed right-1.5 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line-soft bg-surface-2/88 text-text shadow-[0_18px_42px_hsl(0_0%_0%_/_0.24)] backdrop-blur-[16px] transition-colors hover:border-warning-line hover:bg-surface-3 sm:right-2"
          style={{ right: "max(0.375rem, env(safe-area-inset-right))" }}
          onClick={() =>
            markNavigationStart(
              "dex-detail-to-next",
              `/team/dex/pokemon/${nextSpecies.slug}${dexQuery}`,
            )
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
      <section className="mx-auto max-w-6xl">
        <PokemonDexCard
          pokemon={pokemonEntry}
          abilityEffects={abilityEffects}
          moveDetailsByName={moveDetailsByName}
          wildEncounters={wildEncounters}
          gifts={gifts}
          trades={trades}
          forms={forms.length > 1 ? forms : undefined}
          evolutions={evolutions.length ? evolutions : undefined}
          dexQuery={dexQuery}
          expanded
          headerAction={(
            <Link
              href={`/team/dex${dexQuery}#dex-entry-${species.slug}`}
              prefetch
              transitionTypes={backTransition}
              aria-label="Cerrar ficha"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-soft bg-surface-2/80 text-text transition-colors hover:border-warning-line hover:bg-surface-3"
              onClick={() =>
                markNavigationStart(
                  "dex-detail-to-list",
                  `/team/dex${dexQuery}#dex-entry-${species.slug}`,
                )
              }
            >
              <X className="h-4 w-4" />
            </Link>
          )}
        />
      </section>
    </main>
  );
}

function sameStringList(left: string[] = [], right: string[] = []) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => normalizeName(value) === normalizeName(right[index] ?? ""));
}

function sameStats(
  left?:
    | { hp: number; atk: number; def: number; spa: number; spd: number; spe: number; bst: number }
    | undefined,
  right?:
    | { hp: number; atk: number; def: number; spa: number; spd: number; spe: number; bst: number }
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

function buildEvolutionChains(
  catalogs: ReturnType<typeof useTeamCatalogs>,
  currentSlug: string,
) {
  const entriesBySlug = new Map(catalogs.speciesCatalog.map((entry) => [entry.slug, entry]));
  const entriesByName = new Map(catalogs.speciesCatalog.map((entry) => [normalizeName(entry.name), entry]));
  const nextBySlug = new Map<string, string[]>();
  const prevBySlug = new Map<string, string[]>();
  const detailByEdge = new Map<string, ReturnType<typeof getEvolutionDetail>>();

  catalogs.speciesCatalog.forEach((entry) => {
    const pokemon =
      catalogs.pokemonIndex[entry.slug] ??
      catalogs.pokemonIndex[normalizeName(entry.name)];
    const next = (pokemon?.nextEvolutions ?? [])
      .map((targetName) => entriesByName.get(normalizeName(targetName))?.slug)
      .filter((value): value is string => Boolean(value));

    nextBySlug.set(entry.slug, next);

    next.forEach((targetSlug) => {
      prevBySlug.set(targetSlug, [...(prevBySlug.get(targetSlug) ?? []), entry.slug]);
      detailByEdge.set(
        `${entry.slug}->${targetSlug}`,
        getEvolutionDetail(pokemon?.evolutionDetails, entriesBySlug.get(targetSlug)?.name ?? targetSlug),
      );
    });
  });

  const component = new Set<string>();
  const queue = [currentSlug];
  while (queue.length) {
    const slug = queue.shift();
    if (!slug || component.has(slug)) {
      continue;
    }
    component.add(slug);
    [...(nextBySlug.get(slug) ?? []), ...(prevBySlug.get(slug) ?? [])].forEach((neighbor) => {
      if (!component.has(neighbor)) {
        queue.push(neighbor);
      }
    });
  }

  const roots = [...component].filter((slug) =>
    (prevBySlug.get(slug) ?? []).every((parent) => !component.has(parent)),
  );
  const chains: Array<Array<{
    name: string;
    slug: string;
    spriteUrl?: string;
    animatedSpriteUrl?: string;
    summaryFromPrevious?: string;
    current?: boolean;
  }>> = [];

  const buildNode = (slug: string, summaryFromPrevious?: string) => {
    const entry = entriesBySlug.get(slug);
    if (!entry) {
      return null;
    }
    const sprites = buildSpriteUrls(entry.name, entry.dex);
    return {
      name: entry.name,
      slug: entry.slug,
      spriteUrl: sprites.spriteUrl,
      animatedSpriteUrl: sprites.animatedSpriteUrl,
      summaryFromPrevious,
      current: entry.slug === currentSlug,
    };
  };

  const visit = (slug: string, path: NonNullable<ReturnType<typeof buildNode>>[]) => {
    const children = (nextBySlug.get(slug) ?? []).filter((child) => component.has(child));
    if (!children.length) {
      chains.push(path);
      return;
    }

    children.forEach((child) => {
      const node = buildNode(child, summarizeEvolution(detailByEdge.get(`${slug}->${child}`)));
      if (!node) {
        return;
      }
      visit(child, [...path, node]);
    });
  };

  roots.forEach((root) => {
    const node = buildNode(root);
    if (!node) {
      return;
    }
    visit(root, [node]);
  });

  return chains.filter((chain) => chain.some((node) => node.current));
}

function getEvolutionDetail(
  details:
    | {
        target: string;
        minLevel?: number | null;
        item?: string | null;
        heldItem?: string | null;
        knownMove?: string | null;
        knownMoveType?: string | null;
        timeOfDay?: string | null;
        location?: string | null;
        trigger?: string | null;
      }[]
    | undefined,
  targetName: string,
) {
  return details?.find((entry) => normalizeName(entry.target) === normalizeName(targetName));
}

function summarizeEvolution(
  detail:
    | {
        minLevel?: number | null;
        item?: string | null;
        heldItem?: string | null;
        knownMove?: string | null;
        knownMoveType?: string | null;
        timeOfDay?: string | null;
        location?: string | null;
        trigger?: string | null;
      }
    | undefined,
) {
  if (!detail) {
    return "Metodo no detallado en la data local.";
  }

  const parts = [
    detail.minLevel ? `Lv ${detail.minLevel}` : null,
    detail.trigger,
    detail.item ? `Usa ${detail.item}` : null,
    detail.heldItem ? `Con ${detail.heldItem}` : null,
    detail.knownMove ? `Sabiendo ${detail.knownMove}` : null,
    detail.knownMoveType ? `Movimiento ${detail.knownMoveType}` : null,
    detail.timeOfDay ? `Tiempo ${detail.timeOfDay}` : null,
    detail.location ? `En ${detail.location}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "Metodo no detallado en la data local.";
}

function collectWildEncounters(
  wildAreas: {
    area: string;
    methods: { method: string; encounters: { species: string }[] }[];
  }[],
  species: string,
  pokemonNames: string[],
) {
  return wildAreas.flatMap((area) =>
    area.methods.flatMap((method) =>
      method.encounters
        .filter((entry) => entryMatchesSpecies(entry.species, species, pokemonNames))
        .map(() => ({ area: area.area, method: method.method })),
    ),
  );
}

function collectGifts(
  gifts: {
    name: string;
    location: string;
    level: string;
    notes?: string[];
  }[],
  species: string,
  pokemonNames: string[],
) {
  return gifts.filter((gift) => giftMatchesSpecies(gift, species, pokemonNames));
}

function collectTrades(
  trades: {
    received: string;
    location: string;
    requested: string;
  }[],
  species: string,
) {
  const key = normalizeName(species);
  return trades.filter((trade) => normalizeName(trade.received) === key);
}
