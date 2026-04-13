import { cache } from "react";

import { buildDexStateQuery, matchesDexMode, matchesTypeSlotFilters } from "@/components/team/screens/dex/utils";
import { getDexPageData } from "@/lib/builderPageData";
import {
  buildAcquisitionIndex,
  type GiftAcquisition,
  type TradeAcquisition,
  type WildAcquisition,
} from "@/lib/domain/sourceData";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import { getAvailableFormsForSpecies } from "@/lib/forms";
import {
  getHistoricalCanonicalTypes,
  getLocalDexDataVersion,
  getPokemonAbilitySlots,
  type PokemonAbilitySlots,
} from "@/lib/localDex";

type SearchParamsInput = Record<string, string | string[] | undefined>;

type DexSpeciesEntry = ReturnType<typeof getDexPageData>["speciesCatalog"][number];
type DexPokemonEntry = NonNullable<ReturnType<typeof getDexPageData>["pokemonIndex"][string]>;
type DexRuntimeData = {
  pageData: ReturnType<typeof getDexPageData>;
  speciesLookup: ReturnType<typeof getSpeciesLookup>;
  formsBySlug: Map<string, Array<any>>;
  evolutionsBySlug: Map<string, Array<Array<any>>>;
  detailBaseBySlug: Map<string, any>;
};

let dexRuntimeCache: DexRuntimeData | null = null;
let dexRuntimeCacheVersion: string | null = null;

export type DexDetailPageData = {
  pokemon: {
    dex: number;
    name: string;
    slug: string;
    types: string[];
    spriteUrl?: string;
    animatedSpriteUrl?: string;
    stats?: DexPokemonEntry["stats"];
    generation?: DexPokemonEntry["generation"];
    category?: DexPokemonEntry["category"];
    height?: DexPokemonEntry["height"];
    weight?: DexPokemonEntry["weight"];
    flavorText?: DexPokemonEntry["flavorText"];
    canonicalStats?: DexPokemonEntry["stats"];
    abilities: string[];
    abilitySlots: PokemonAbilitySlots;
    nextEvolutions: string[];
    evolutionDetails: NonNullable<DexPokemonEntry["evolutionDetails"]>;
    learnsets?: DexPokemonEntry["learnsets"];
  };
  previousSpecies: { name: string; slug: string } | null;
  nextSpecies: { name: string; slug: string } | null;
  closeHref: string;
  dexQuery: string;
  forms: Array<{
    name: string;
    slug: string;
    types: string[];
    spriteUrl?: string;
    animatedSpriteUrl?: string;
    abilities: string[];
    abilitySlots: PokemonAbilitySlots;
    stats?: DexPokemonEntry["stats"];
  }>;
  evolutions: Array<
    Array<{
      name: string;
      slug: string;
      spriteUrl?: string;
      animatedSpriteUrl?: string;
      summaryFromPrevious?: string;
      current?: boolean;
    }>
  >;
  wildEncounters: WildAcquisition[];
  gifts: GiftAcquisition[];
  trades: TradeAcquisition[];
  moveDetailsByName: Record<string, ReturnType<typeof getDexPageData>["moveIndex"][string]>;
};

export function getDexPokemonDetailPageData(
  slug: string,
  searchParams: SearchParamsInput = {},
): DexDetailPageData | null {
  return getDexPokemonDetailPageDataCached(slug, serializeSearchParams(searchParams));
}

export function getDexSpeciesRouteEntry(slug: string) {
  const runtime = getDexRuntimeData();
  const resolvedSlug = normalizeValue(slug);
  return runtime.speciesLookup.bySlug.get(resolvedSlug) ?? runtime.speciesLookup.byNormalizedName.get(resolvedSlug) ?? null;
}

const getDexPokemonDetailPageDataCached = cache(
  (slug: string, serializedSearchParams: string): DexDetailPageData | null => {
    const runtime = getDexRuntimeData();
    const searchParams = deserializeSearchParams(serializedSearchParams);
    const resolvedSlug = normalizeValue(slug);
    const species =
      runtime.speciesLookup.bySlug.get(resolvedSlug) ??
      runtime.speciesLookup.byNormalizedName.get(resolvedSlug);

    if (!species) {
      return null;
    }

    const dexMode = getDexMode(searchParams.dexMode);
    const typeChangesOnly = normalizeValue(searchParams.typeChanges) === "1";
    const statChangesOnly = normalizeValue(searchParams.statChanges) === "1";
    const abilityChangesOnly = normalizeValue(searchParams.abilityChanges) === "1";
    const primaryTypeFilter = normalizeValue(searchParams.type1);
    const secondaryTypeFilter = normalizeValue(searchParams.type2);
    const orderedSpecies = getFilteredOrderedSpecies(
      dexMode,
      typeChangesOnly,
      statChangesOnly,
      abilityChangesOnly,
      primaryTypeFilter,
      secondaryTypeFilter,
    );

    const currentIndex = orderedSpecies.findIndex((entry) => entry.slug === species.slug);
    const previousSpecies = currentIndex > 0 ? toNavEntry(orderedSpecies[currentIndex - 1]) : null;
    const nextSpecies =
      currentIndex >= 0 && currentIndex < orderedSpecies.length - 1
        ? toNavEntry(orderedSpecies[currentIndex + 1])
        : null;
    const baseDetail = runtime.detailBaseBySlug.get(species.slug);
    if (!baseDetail) {
      return null;
    }
    const dexQuery = buildDexStateQuery({
      tab: normalizeTab(searchParams.tab),
      query: normalizeValue(searchParams.q) || undefined,
      pokemonMode: dexMode,
      typeChangesOnly,
      statChangesOnly,
      abilityChangesOnly,
      primaryTypeFilter: normalizeValue(searchParams.type1) || undefined,
      secondaryTypeFilter: normalizeValue(searchParams.type2) || undefined,
    });

    return {
      pokemon: baseDetail.pokemon,
      previousSpecies,
      nextSpecies,
      closeHref: `/team/dex${dexQuery}#dex-entry-${species.slug}`,
      dexQuery,
      forms: baseDetail.forms,
      evolutions: baseDetail.evolutions,
      wildEncounters: baseDetail.wildEncounters,
      gifts: baseDetail.gifts,
      trades: baseDetail.trades,
      moveDetailsByName: baseDetail.moveDetailsByName,
    };
  },
);

const getFilteredOrderedSpecies = cache(
  (
    dexMode: string,
    typeChangesOnly: boolean,
    statChangesOnly: boolean,
    abilityChangesOnly: boolean,
    primaryTypeFilter: string,
    secondaryTypeFilter: string,
  ) => {
    const runtime = getDexRuntimeData();
    return runtime.pageData.speciesCatalog
      .filter((entry) => {
        const normalizedName = normalizeName(entry.name);
        const canonicalPokemon =
          runtime.pageData.canonicalPokemonIndex[entry.slug] ??
          runtime.pageData.canonicalPokemonIndex[normalizedName];
        const currentPokemon =
          runtime.pageData.pokemonIndex[entry.slug] ??
          runtime.pageData.pokemonIndex[normalizedName];
        const hasTypeChanges = !sameStringList(
          entry.types ?? [],
          getHistoricalCanonicalTypes(canonicalPokemon),
        );
        const hasStatChanges = !sameStats(currentPokemon?.stats, canonicalPokemon?.stats);
        const hasAbilityChanges = !sameStringList(currentPokemon?.abilities ?? [], canonicalPokemon?.abilities ?? []);

        if (!matchesDexMode(entry.dex, dexMode as ReturnType<typeof getDexMode>)) return false;
        if (typeChangesOnly && !hasTypeChanges) return false;
        if (statChangesOnly && !hasStatChanges) return false;
        if (abilityChangesOnly && !hasAbilityChanges) return false;
        return matchesTypeSlotFilters(entry.types, primaryTypeFilter, secondaryTypeFilter);
      })
      .sort((left, right) => left.dex - right.dex || left.name.localeCompare(right.name));
  },
);

function getDexRuntimeData(): DexRuntimeData {
  const version = getLocalDexDataVersion();
  if (dexRuntimeCache && dexRuntimeCacheVersion === version) {
    return dexRuntimeCache;
  }

  const pageData = getDexPageData();
  const speciesLookup = getSpeciesLookup(pageData.speciesCatalog);
  const acquisitions = buildDexAcquisitions(
    pageData.docs.wildAreas,
    pageData.docs.gifts,
    pageData.docs.trades,
    speciesLookup.names,
  );
  const formsBySlug = new Map(
    pageData.speciesCatalog.map((species) => [
      species.slug,
      buildForms(pageData.pokemonIndex, species),
    ]),
  );
  const evolutionsBySlug = new Map(
    pageData.speciesCatalog.map((species) => [
      species.slug,
      buildEvolutionChains(pageData.speciesCatalog, pageData.pokemonIndex, species.slug),
    ]),
  );
  const detailBaseBySlug = new Map(
    pageData.speciesCatalog.map((species) => {
      const normalizedSpeciesName = normalizeName(species.name);
      const pokemon =
        pageData.pokemonIndex[species.slug] ??
        pageData.pokemonIndex[normalizedSpeciesName];
      const canonicalPokemon =
        pageData.canonicalPokemonIndex[species.slug] ??
        pageData.canonicalPokemonIndex[normalizedSpeciesName];
      const sprites = buildSpriteUrls(species.name, species.dex);

      return [
        species.slug,
        {
          pokemon: {
            dex: species.dex,
            name: species.name,
            slug: species.slug,
            types: species.types ?? [],
            spriteUrl: sprites.spriteUrl,
            animatedSpriteUrl: sprites.animatedSpriteUrl,
            stats: pokemon?.stats,
            generation: pokemon?.generation,
            category: pokemon?.category,
            height: pokemon?.height,
            weight: pokemon?.weight,
            flavorText: pokemon?.flavorText ?? undefined,
            canonicalStats: canonicalPokemon?.stats,
            abilities: pokemon?.abilities ?? [],
            abilitySlots: getPokemonAbilitySlots(species.slug),
            nextEvolutions: pokemon?.nextEvolutions ?? [],
            evolutionDetails: pokemon?.evolutionDetails ?? [],
            learnsets: pokemon?.learnsets,
          },
          forms: formsBySlug.get(species.slug) ?? [],
          evolutions: evolutionsBySlug.get(species.slug) ?? [],
          wildEncounters: acquisitions.wildBySpecies.get(normalizedSpeciesName) ?? [],
          gifts: acquisitions.giftsBySpecies.get(normalizedSpeciesName) ?? [],
          trades: acquisitions.tradesBySpecies.get(normalizedSpeciesName) ?? [],
          moveDetailsByName: buildMoveDetailsByName(pageData.moveIndex, pokemon?.learnsets),
        },
      ] as const;
    }),
  );

  const runtime = {
    pageData,
    speciesLookup,
    formsBySlug,
    evolutionsBySlug,
    detailBaseBySlug,
  };

  dexRuntimeCache = runtime;
  dexRuntimeCacheVersion = version;
  return runtime;
}

function getDexMode(rawValue?: string | string[]) {
  const value = normalizeValue(rawValue);
  if (value === "gen1" || value === "gen2" || value === "gen3" || value === "gen4" || value === "gen5") {
    return value;
  }
  return "national";
}

function normalizeTab(rawValue?: string | string[]) {
  const value = normalizeValue(rawValue);
  if (value === "moves" || value === "abilities" || value === "items") {
    return value;
  }
  return "pokemon";
}

function normalizeValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getSpeciesLookup(speciesCatalog: DexSpeciesEntry[]) {
  return {
    bySlug: new Map(speciesCatalog.map((entry) => [entry.slug, entry])),
    byNormalizedName: new Map(speciesCatalog.map((entry) => [normalizeName(entry.name), entry])),
    names: speciesCatalog.map((entry) => entry.name),
  };
}

function buildDexAcquisitions(
  wildAreas: ReturnType<typeof getDexPageData>["docs"]["wildAreas"],
  gifts: ReturnType<typeof getDexPageData>["docs"]["gifts"],
  trades: ReturnType<typeof getDexPageData>["docs"]["trades"],
  pokemonNames: string[],
) {
  return buildAcquisitionIndex(wildAreas, gifts, trades, pokemonNames);
}

function serializeSearchParams(searchParams: SearchParamsInput) {
  return JSON.stringify(
    Object.entries(searchParams)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] ?? "" : value ?? ""]),
  );
}

function deserializeSearchParams(serializedSearchParams: string) {
  return Object.fromEntries(JSON.parse(serializedSearchParams) as Array<[string, string]>) as SearchParamsInput;
}

function toNavEntry(species?: DexSpeciesEntry) {
  return species ? { name: species.name, slug: species.slug } : null;
}

function buildMoveDetailsByName(
  moveIndex: ReturnType<typeof getDexPageData>["moveIndex"],
  learnsets?: DexPokemonEntry["learnsets"],
) {
  const names = new Set<string>();
  learnsets?.levelUp?.forEach((entry) => names.add(normalizeName(entry.move)));
  learnsets?.machines?.forEach((entry) => names.add(normalizeName(entry.move)));

  return Array.from(names).reduce<Record<string, ReturnType<typeof getDexPageData>["moveIndex"][string]>>((accumulator, key) => {
    const move = moveIndex[key];
    if (move) {
      accumulator[key] = move;
    }
    return accumulator;
  }, {});
}

function buildForms(
  pokemonIndex: ReturnType<typeof getDexPageData>["pokemonIndex"],
  species: DexSpeciesEntry,
) {
  return getAvailableFormsForSpecies(species.name)
    .map((formName) => {
      const formKey = normalizeName(formName);
      const formPokemon = pokemonIndex[formKey] as
        | (DexPokemonEntry & { dex?: number; slug?: string })
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
        abilitySlots: getPokemonAbilitySlots(formPokemon.slug ?? formKey),
        stats: formPokemon.stats,
      };
    })
    .filter((form): form is NonNullable<typeof form> => Boolean(form));
}

function buildEvolutionChains(
  speciesCatalog: DexSpeciesEntry[],
  pokemonIndex: ReturnType<typeof getDexPageData>["pokemonIndex"],
  currentSlug: string,
) {
  const entriesBySlug = new Map(speciesCatalog.map((entry) => [entry.slug, entry]));
  const entriesByName = new Map(speciesCatalog.map((entry) => [normalizeName(entry.name), entry]));
  const nextBySlug = new Map<string, string[]>();
  const prevBySlug = new Map<string, string[]>();
  const detailByEdge = new Map<string, NonNullable<DexPokemonEntry["evolutionDetails"]>[number] | undefined>();

  speciesCatalog.forEach((entry) => {
    const pokemon = pokemonIndex[entry.slug] ?? pokemonIndex[normalizeName(entry.name)];
    const next = (pokemon?.nextEvolutions ?? [])
      .map((targetName) => entriesByName.get(normalizeName(targetName))?.slug)
      .filter((value): value is string => Boolean(value));

    nextBySlug.set(entry.slug, next);
    next.forEach((targetSlug) => {
      prevBySlug.set(targetSlug, [...(prevBySlug.get(targetSlug) ?? []), entry.slug]);
      detailByEdge.set(
        `${entry.slug}->${targetSlug}`,
        pokemon?.evolutionDetails?.find((detail) => normalizeName(detail.target) === normalizeName(entriesBySlug.get(targetSlug)?.name ?? targetSlug)),
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

  const roots = [...component].filter((slug) => (prevBySlug.get(slug) ?? []).every((parent) => !component.has(parent)));
  const chains: DexDetailPageData["evolutions"] = [];

  const buildNode = (slug: string, summaryFromPrevious?: string) => {
    const entry = entriesBySlug.get(slug);
    if (!entry) return null;
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
      if (node) {
        visit(child, [...path, node]);
      }
    });
  };

  roots.forEach((root) => {
    const node = buildNode(root);
    if (node) {
      visit(root, [node]);
    }
  });

  return chains.filter((chain) => chain.some((node) => node.current));
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
