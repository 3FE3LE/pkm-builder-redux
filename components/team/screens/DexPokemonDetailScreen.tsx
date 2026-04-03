"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { useTeamCatalogs } from "@/components/BuilderProvider";
import { PokemonDexCard } from "@/components/team/screens/DexScreen";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";

export function DexPokemonDetailScreen({ slug }: { slug: string }) {
  const catalogs = useTeamCatalogs();
  const abilityEffects = new Map(
    catalogs.abilityCatalog.map((ability) => [normalizeName(ability.name), ability.effect ?? "Sin efecto registrado."]),
  );

  const species =
    catalogs.speciesCatalog.find((entry) => entry.slug === slug) ??
    catalogs.speciesCatalog.find((entry) => normalizeName(entry.name) === slug);
  const pokemon =
    catalogs.pokemonIndex[slug] ??
    (species ? catalogs.pokemonIndex[normalizeName(species.name)] : undefined);

  if (!species) {
    return null;
  }

  const sprites = buildSpriteUrls(species.name, species.dex);
  const pokemonEntry = {
    dex: species.dex,
    name: species.name,
    slug: species.slug,
    types: species.types,
    spriteUrl: sprites.spriteUrl,
    animatedSpriteUrl: sprites.animatedSpriteUrl,
    stats: pokemon?.stats,
    abilities: pokemon?.abilities ?? [],
    nextEvolutions: pokemon?.nextEvolutions ?? [],
    evolutionDetails: pokemon?.evolutionDetails ?? [],
    learnsets: pokemon?.learnsets,
  };
  const wildEncounters = collectWildEncounters(catalogs.docs.wildAreas, species.name);
  const gifts = collectGifts(catalogs.docs.gifts, species.name);
  const trades = collectTrades(catalogs.docs.trades, species.name);

  return (
    <main className="relative overflow-visible px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-4">
          <Link
            href="/team/dex"
            transitionTypes={["dex-back"]}
            className="inline-flex items-center gap-2 rounded-full border border-line-soft bg-surface-2/80 px-3 py-2 text-sm text-text transition-colors hover:border-warning-line hover:bg-surface-3"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a Dex
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="display-face text-sm text-[hsl(39_100%_78%)]">Pokemon Redux Dex</p>
            <h1 className="pixel-face mt-2 text-2xl text-text">{species.name}</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Ficha dedicada con el resumen util para builder, routing y consulta rapida del hack.
            </p>
          </div>
        </div>

        <PokemonDexCard
          pokemon={pokemonEntry}
          abilityEffects={abilityEffects}
          wildEncounters={wildEncounters}
          gifts={gifts}
          trades={trades}
          expanded
        />
      </section>
    </main>
  );
}

function collectWildEncounters(
  wildAreas: {
    area: string;
    methods: { method: string; encounters: { species: string }[] }[];
  }[],
  species: string,
) {
  const key = normalizeName(species);
  return wildAreas.flatMap((area) =>
    area.methods.flatMap((method) =>
      method.encounters
        .filter((entry) => normalizeName(entry.species) === key)
        .map(() => ({ area: area.area, method: method.method })),
    ),
  );
}

function collectGifts(
  gifts: {
    name: string;
    location: string;
    level: string;
  }[],
  species: string,
) {
  const key = normalizeName(species);
  return gifts.filter((gift) => normalizeName(gift.name) === key);
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
