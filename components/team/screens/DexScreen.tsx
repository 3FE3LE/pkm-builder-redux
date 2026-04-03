"use client";

import { ViewTransition, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";

import { useTeamCatalogs } from "@/components/BuilderProvider";
import { ItemSprite } from "@/components/builder-shared/ItemSprite";
import { PokemonSprite } from "@/components/builder-shared/PokemonSprite";
import { TypeBadge } from "@/components/builder-shared/TypeBadge";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import { getTypedSurfaceStyle } from "@/lib/ui/typeSurface";

const DEX_TABS = ["pokemon", "moves", "abilities", "items"] as const;
type DexTab = (typeof DEX_TABS)[number];
const RESULT_LIMIT = 80;

export function DexScreen() {
  const catalogs = useTeamCatalogs();
  const [tab, setTab] = useState<DexTab>("pokemon");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const moveEntries = useMemo(
    () => Object.values(catalogs.moveIndex).sort((left, right) => left.name.localeCompare(right.name)),
    [catalogs.moveIndex],
  );
  const abilityEntries = useMemo(
    () => [...catalogs.abilityCatalog].sort((left, right) => left.name.localeCompare(right.name)),
    [catalogs.abilityCatalog],
  );
  const itemEntries = useMemo(
    () => [...catalogs.itemCatalog].sort((left, right) => left.name.localeCompare(right.name)),
    [catalogs.itemCatalog],
  );
  const abilityEffects = useMemo(
    () =>
      new Map(
        abilityEntries.map((ability) => [normalizeName(ability.name), ability.effect ?? "Sin efecto registrado."]),
      ),
    [abilityEntries],
  );
  const pokemonEntries = useMemo(() => {
    return catalogs.speciesCatalog
      .map((species) => {
        const pokemon =
          catalogs.pokemonIndex[species.slug] ??
          catalogs.pokemonIndex[normalizeName(species.name)];
        const sprites = buildSpriteUrls(species.name, species.dex);

        return {
          dex: species.dex,
          name: species.name,
          slug: species.slug,
          types: dedupeStrings(species.types),
          spriteUrl: sprites.spriteUrl,
          animatedSpriteUrl: sprites.animatedSpriteUrl,
          stats: pokemon?.stats,
          abilities: dedupeStrings(pokemon?.abilities ?? []),
          nextEvolutions: dedupeStrings(pokemon?.nextEvolutions ?? []),
          evolutionDetails: pokemon?.evolutionDetails ?? [],
          learnsets: pokemon?.learnsets,
        };
      })
      .sort((left, right) => left.dex - right.dex || left.name.localeCompare(right.name));
  }, [catalogs.pokemonIndex, catalogs.speciesCatalog]);

  const ownersByMove = useMemo(() => {
    const next = new Map<string, string[]>();

    Object.values(catalogs.pokemonIndex).forEach((pokemon) => {
      const seen = new Set<string>();
      [...(pokemon.learnsets?.levelUp ?? []), ...(pokemon.learnsets?.machines ?? [])].forEach((entry) => {
        const key = normalizeName(entry.move);
        if (!key || seen.has(key)) {
          return;
        }
        seen.add(key);
        next.set(key, [...(next.get(key) ?? []), pokemon.name]);
      });
    });

    next.forEach((value, key) => {
      next.set(key, value.sort((left, right) => left.localeCompare(right)));
    });

    return next;
  }, [catalogs.pokemonIndex]);

  const ownersByAbility = useMemo(() => {
    const next = new Map<string, string[]>();

    Object.values(catalogs.pokemonIndex).forEach((pokemon) => {
      (pokemon.abilities ?? []).forEach((ability) => {
        const key = normalizeName(ability);
        if (!key) {
          return;
        }
        next.set(key, [...(next.get(key) ?? []), pokemon.name]);
      });
    });

    next.forEach((value, key) => {
      next.set(key, Array.from(new Set(value)).sort((left, right) => left.localeCompare(right)));
    });

    return next;
  }, [catalogs.pokemonIndex]);

  const locationsByItem = useMemo(() => {
    const next = new Map<string, { area: string; detail: string }[]>();

    catalogs.docs.itemLocations.forEach((location) => {
      location.items.forEach((detail) => {
        const normalizedDetail = normalizeName(detail);

        itemEntries.forEach((item) => {
          const itemKey = normalizeName(item.name);
          if (!itemKey || !normalizedDetail.includes(itemKey)) {
            return;
          }

          next.set(itemKey, [...(next.get(itemKey) ?? []), { area: location.area, detail }]);
        });
      });
    });

    return next;
  }, [catalogs.docs.itemLocations, itemEntries]);

  const normalizedQuery = normalizeName(deferredQuery);
  const filteredPokemon = useMemo(
    () =>
      pokemonEntries.filter((pokemon) => {
        if (!normalizedQuery) {
          return true;
        }

        const acquisitionTerms = [
          ...collectWildEncounters(catalogs.docs.wildAreas, pokemon.name).map((entry) => `${entry.area} ${entry.method}`),
          ...collectGifts(catalogs.docs.gifts, pokemon.name).map((entry) => entry.location),
          ...collectTrades(catalogs.docs.trades, pokemon.name).flatMap((entry) => [entry.location, entry.requested]),
        ];

        return (
          normalizeName(pokemon.name).includes(normalizedQuery) ||
          pokemon.types.some((type) => normalizeName(type).includes(normalizedQuery)) ||
          pokemon.abilities.some((ability) => normalizeName(ability).includes(normalizedQuery)) ||
          acquisitionTerms.some((term) => normalizeName(term).includes(normalizedQuery))
        );
      }),
    [catalogs.docs.gifts, catalogs.docs.trades, catalogs.docs.wildAreas, normalizedQuery, pokemonEntries],
  );
  const filteredMoves = useMemo(
    () =>
      moveEntries.filter((move) => {
        if (!normalizedQuery) {
          return true;
        }
        return (
          normalizeName(move.name).includes(normalizedQuery) ||
          normalizeName(move.description ?? "").includes(normalizedQuery)
        );
      }),
    [moveEntries, normalizedQuery],
  );
  const filteredAbilities = useMemo(
    () =>
      abilityEntries.filter((ability) => {
        if (!normalizedQuery) {
          return true;
        }
        return (
          normalizeName(ability.name).includes(normalizedQuery) ||
          normalizeName(ability.effect ?? "").includes(normalizedQuery)
        );
      }),
    [abilityEntries, normalizedQuery],
  );
  const filteredItems = useMemo(
    () =>
      itemEntries.filter((item) => {
        if (!normalizedQuery) {
          return true;
        }
        return (
          normalizeName(item.name).includes(normalizedQuery) ||
          normalizeName(item.effect ?? "").includes(normalizedQuery) ||
          normalizeName(item.category ?? "").includes(normalizedQuery)
        );
      }),
    [itemEntries, normalizedQuery],
  );

  return (
    <main className="relative overflow-visible px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="panel panel-frame overflow-hidden">
          <div className="relative border-b border-line-soft px-5 py-5 sm:px-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,199,107,0.16),transparent_38%),radial-gradient(circle_at_80%_30%,rgba(81,255,204,0.12),transparent_34%)]" />
            <div className="relative">
              <p className="display-face text-sm text-[hsl(39_100%_78%)]">Redux Dex</p>
              <h1 className="pixel-face mt-2 text-2xl text-text">Pokemon, movimientos, habilidades y objetos</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted">
                Referencia rapida del Redux para consultar especies, efectos, usuarios y ubicaciones sin salir del builder.
              </p>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <Tabs value={tab} onValueChange={(value) => setTab(value as DexTab)} className="gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <TabsList className="tab-strip scrollbar-thin">
                  <TabsTrigger value="pokemon" className="tab-trigger-soft">Pokemon</TabsTrigger>
                  <TabsTrigger value="moves" className="tab-trigger-soft">Moves</TabsTrigger>
                  <TabsTrigger value="abilities" className="tab-trigger-soft">Abilities</TabsTrigger>
                  <TabsTrigger value="items" className="tab-trigger-soft">Items</TabsTrigger>
                </TabsList>
                <div className="w-full max-w-xl">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={getSearchPlaceholder(tab)}
                  />
                </div>
              </div>

              <TabsContent value="pokemon" className="tab-panel">
                <DexSectionHeader
                  count={filteredPokemon.length}
                  limit={RESULT_LIMIT}
                  emptyLabel="No encontré Pokemon con ese filtro."
                />
                <div className="grid gap-3 xl:grid-cols-2">
                  {filteredPokemon.slice(0, RESULT_LIMIT).map((pokemon) => {
                    const wildEncounters = collectWildEncounters(catalogs.docs.wildAreas, pokemon.name);
                    const gifts = collectGifts(catalogs.docs.gifts, pokemon.name);
                    const trades = collectTrades(catalogs.docs.trades, pokemon.name);

                    return (
                      <PokemonDexCard
                        key={pokemon.slug}
                        pokemon={pokemon}
                        abilityEffects={abilityEffects}
                        wildEncounters={wildEncounters}
                        gifts={gifts}
                        trades={trades}
                        href={`/team/dex/pokemon/${pokemon.slug}`}
                      />
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="moves" className="tab-panel">
                <DexSectionHeader
                  count={filteredMoves.length}
                  limit={RESULT_LIMIT}
                  emptyLabel="No encontré movimientos con ese filtro."
                />
                <div className="grid gap-3 xl:grid-cols-2">
                  {filteredMoves.slice(0, RESULT_LIMIT).map((move) => (
                    <article key={move.name} className="panel-strong panel-frame rounded-[1rem] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="display-face text-sm text-text">{move.name}</h2>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <TypeBadge type={move.type} />
                            <StatChip label={move.damageClass} />
                            <StatChip label={`Pow ${move.power ?? "-"}`} />
                            <StatChip label={`Acc ${move.accuracy ?? "-"}`} />
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted">
                        {move.description || "Sin descripcion registrada."}
                      </p>
                      <OwnerBlock
                        label="Pokemon que lo aprenden"
                        values={ownersByMove.get(normalizeName(move.name)) ?? []}
                      />
                    </article>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="abilities" className="tab-panel">
                <DexSectionHeader
                  count={filteredAbilities.length}
                  limit={RESULT_LIMIT}
                  emptyLabel="No encontré habilidades con ese filtro."
                />
                <div className="grid gap-3 xl:grid-cols-2">
                  {filteredAbilities.slice(0, RESULT_LIMIT).map((ability) => (
                    <article key={ability.name} className="panel-strong panel-frame rounded-[1rem] p-4">
                      <h2 className="display-face text-sm text-text">{ability.name}</h2>
                      <p className="mt-3 text-sm leading-6 text-muted">
                        {ability.effect || "Sin efecto registrado."}
                      </p>
                      <OwnerBlock
                        label="Pokemon que la poseen"
                        values={ownersByAbility.get(normalizeName(ability.name)) ?? []}
                      />
                    </article>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="items" className="tab-panel">
                <DexSectionHeader
                  count={filteredItems.length}
                  limit={RESULT_LIMIT}
                  emptyLabel="No encontré objetos con ese filtro."
                />
                <div className="grid gap-3 xl:grid-cols-2">
                  {filteredItems.slice(0, RESULT_LIMIT).map((item) => {
                    const locations = locationsByItem.get(normalizeName(item.name)) ?? [];

                    return (
                      <article key={item.name} className="panel-strong panel-frame rounded-[1rem] p-4">
                        <div className="flex items-start gap-3">
                          <ItemSprite name={item.name} sprite={item.sprite} />
                          <div className="min-w-0">
                            <h2 className="display-face text-sm text-text">{item.name}</h2>
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
                          <p className="micro-label text-text-faint">Obtencion en BW2 Redux</p>
                          {locations.length ? (
                            <div className="mt-2 flex flex-col gap-2">
                              {locations.slice(0, 6).map((location) => (
                                <div key={`${item.name}-${location.area}-${location.detail}`} className="rounded-[0.8rem] border border-line-soft bg-surface-3 px-3 py-2">
                                  <p className="text-sm text-text">{location.area}</p>
                                  <p className="mt-1 text-xs leading-5 text-muted">{location.detail}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-muted">
                              No encontré una ubicacion directa en la data parseada del hack.
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
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
        {count > limit ? `Mostrando ${limit} de ${count} resultados.` : `${count} resultados.`}
      </p>
      <p className="text-xs text-text-faint">Busca por nombre o efecto.</p>
    </div>
  );
}

function OwnerBlock({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-4 border-t border-line-soft pt-3">
      <p className="micro-label text-text-faint">{label}</p>
      {values.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.slice(0, 10).map((value, index) => (
            <span key={`${value}-${index}`} className="rounded-full border border-line-soft bg-surface-3 px-2.5 py-1 text-xs text-text">
              {value}
            </span>
          ))}
          {values.length > 10 ? (
            <span className="rounded-full border border-line-soft bg-surface-3 px-2.5 py-1 text-xs text-text-faint">
              +{values.length - 10} mas
            </span>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">Sin usuarios listados.</p>
      )}
    </div>
  );
}

function StatChip({ label }: { label: string }) {
  return (
    <span className={clsx("rounded-full border border-line-soft bg-surface-3 px-2.5 py-1 text-xs text-text-faint")}>
      {label}
    </span>
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
    abilities: string[];
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
}) {
  const spriteShellStyle = getDexSpriteShellStyle(pokemon.types);
  const cardBody = (
    <ViewTransition name={getDexTransitionName("card", pokemon.slug)}>
      <article
        className={clsx(
          "panel-strong panel-frame relative overflow-hidden rounded-[1rem] p-3 transition-[transform,border-color,background-color] duration-200",
          href && "group hover:border-warning-line hover:bg-surface-2/90",
          expanded && "p-5 sm:p-6",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,214,120,0.12),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(89,181,255,0.12),transparent_28%)]" />
        <div className="relative">
          <div className={clsx("flex items-start gap-4", expanded && "gap-5")}>
            <ViewTransition name={getDexTransitionName("sprite", pokemon.slug)}>
              <div
                className={clsx(
                  "relative flex items-center justify-center overflow-hidden border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                  expanded ? "h-36 w-36 rounded-[1rem]" : "h-14 w-14 rounded-[0.75rem]",
                )}
                style={spriteShellStyle}
              >
                <PokemonSprite
                  species={pokemon.name}
                  spriteUrl={pokemon.spriteUrl}
                  animatedSpriteUrl={pokemon.animatedSpriteUrl}
                  size={expanded ? "large" : "small"}
                  chrome="plain"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_38%,rgba(0,0,0,0.12))]" />
              </div>
            </ViewTransition>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pixel-face text-xs text-text-faint">#{String(pokemon.dex).padStart(3, "0")}</span>
                <ViewTransition name={getDexTransitionName("title", pokemon.slug)}>
                  <h2 className={clsx("display-face text-sm text-text", expanded && "text-base")}>{pokemon.name}</h2>
                </ViewTransition>
              </div>
              <ViewTransition name={getDexTransitionName("types", pokemon.slug)}>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pokemon.types.map((type, index) => (
                    <TypeBadge key={`${pokemon.slug}-${type}-${index}`} type={type} />
                  ))}
                </div>
              </ViewTransition>
              {expanded ? (
                <>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <StatChip label={`HP ${pokemon.stats?.hp ?? "-"}`} />
                    <StatChip label={`Atk ${pokemon.stats?.atk ?? "-"}`} />
                    <StatChip label={`Def ${pokemon.stats?.def ?? "-"}`} />
                    <StatChip label={`SpA ${pokemon.stats?.spa ?? "-"}`} />
                    <StatChip label={`SpD ${pokemon.stats?.spd ?? "-"}`} />
                    <StatChip label={`Spe ${pokemon.stats?.spe ?? "-"}`} />
                  </div>
                  <div className="mt-2">
                    <StatChip label={`BST ${pokemon.stats?.bst ?? "-"}`} />
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {expanded ? (
            <div className={clsx("mt-4 grid gap-3 lg:grid-cols-2", expanded && "xl:grid-cols-2")}>
              <InfoBlock label="Habilidades">
                {pokemon.abilities.length ? (
                  <div className="space-y-2">
                    {pokemon.abilities.map((ability, index) => (
                      <div key={`${pokemon.slug}-${ability}-${index}`} className="rounded-[0.8rem] border border-line-soft bg-surface-3 px-3 py-2">
                        <p className="display-face text-[11px] text-text">{ability}</p>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {abilityEffects.get(normalizeName(ability)) ?? "Sin efecto registrado."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Sin habilidades registradas.</p>
                )}
              </InfoBlock>

              <InfoBlock label="Evolucion">
                {pokemon.nextEvolutions.length ? (
                  <div className="space-y-2">
                    {pokemon.nextEvolutions.map((evolution, index) => {
                      const detail = pokemon.evolutionDetails.find((entry) => normalizeName(entry.target) === normalizeName(evolution));

                      return (
                        <div key={`${pokemon.slug}-${evolution}-${index}`} className="rounded-[0.8rem] border border-line-soft bg-surface-3 px-3 py-2">
                          <p className="display-face text-[11px] text-text">{evolution}</p>
                          <p className="mt-1 text-xs leading-5 text-muted">
                            {summarizeEvolution(detail)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Sin evolucion posterior registrada.</p>
                )}
              </InfoBlock>

              <InfoBlock label="Learnset">
                <div className="space-y-2">
                  <LearnsetStrip
                    label="Level up"
                    values={(pokemon.learnsets?.levelUp ?? []).slice(0, 6).map((entry) => `Lv ${entry.level} · ${entry.move}`)}
                    overflow={(pokemon.learnsets?.levelUp?.length ?? 0) - 6}
                  />
                  <LearnsetStrip
                    label="Machines"
                    values={(pokemon.learnsets?.machines ?? []).slice(0, 6).map((entry) => `${entry.source} · ${entry.move}`)}
                    overflow={(pokemon.learnsets?.machines?.length ?? 0) - 6}
                  />
                </div>
              </InfoBlock>

              <InfoBlock label="Obtencion en Redux">
                <div className="space-y-2">
                  <AcquisitionList
                    title="Wild"
                    values={wildEncounters.map((entry) => `${entry.area} · ${entry.method}`)}
                  />
                  <AcquisitionList
                    title="Gift"
                    values={gifts.map((entry) => `${entry.location} · Lv ${entry.level}`)}
                  />
                  <AcquisitionList
                    title="Trade"
                    values={trades.map((entry) => `${entry.location} · por ${entry.requested}`)}
                  />
                </div>
              </InfoBlock>
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
      transitionTypes={transitionTypes ?? ["dex-forward"]}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-line"
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
    <div className="rounded-[0.9rem] border border-line-soft bg-surface-2/85 px-3 py-3">
      <p className="micro-label text-text-faint">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function LearnsetStrip({
  label,
  values,
  overflow,
}: {
  label: string;
  values: string[];
  overflow: number;
}) {
  return (
    <div>
      <p className="display-face text-[10px] text-text-faint">{label}</p>
      {values.length ? (
        <div className="mt-1.5 flex flex-wrap gap-2">
          {values.map((value, index) => (
            <span key={`${label}-${value}-${index}`} className="rounded-full border border-line-soft bg-surface-3 px-2.5 py-1 text-xs text-text">
              {value}
            </span>
          ))}
          {overflow > 0 ? (
            <span className="rounded-full border border-line-soft bg-surface-3 px-2.5 py-1 text-xs text-text-faint">
              +{overflow} mas
            </span>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">Sin datos.</p>
      )}
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
        <div className="mt-1.5 flex flex-col gap-2">
          {sliced.map((value, index) => (
            <div key={`${title}-${value}-${index}`} className="rounded-[0.8rem] border border-line-soft bg-surface-3 px-3 py-2 text-xs leading-5 text-text">
              {value}
            </div>
          ))}
          {values.length > sliced.length ? (
            <p className="text-xs text-text-faint">+{values.length - sliced.length} entradas mas</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">Sin registro.</p>
      )}
    </div>
  );
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
    detail.trigger,
    detail.minLevel ? `Lv ${detail.minLevel}` : null,
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

function getDexTransitionName(part: string, slug: string) {
  return `dex-${part}-${slug}`;
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getDexSpriteShellStyle(types: string[]) {
  return getTypedSurfaceStyle(types, {
    primaryGlowMix: 24,
    secondaryGlowMix: 22,
    primaryBodyMix: 12,
    secondaryBodyMix: 11,
  });
}
