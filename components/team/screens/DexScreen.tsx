"use client";

import { useDeferredValue, useMemo, useState } from "react";
import clsx from "clsx";

import { useTeamCatalogs } from "@/components/BuilderProvider";
import { ItemSprite } from "@/components/builder-shared/ItemSprite";
import { TypeBadge } from "@/components/builder-shared/TypeBadge";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { normalizeName } from "@/lib/domain/names";

const DEX_TABS = ["moves", "abilities", "items"] as const;
type DexTab = (typeof DEX_TABS)[number];
const RESULT_LIMIT = 80;

export function DexScreen() {
  const catalogs = useTeamCatalogs();
  const [tab, setTab] = useState<DexTab>("moves");
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
              <h1 className="pixel-face mt-2 text-2xl text-text">Movimientos, habilidades y objetos</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted">
                Referencia rapida para consultar efectos, usuarios y ubicaciones sin salir del builder.
              </p>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <Tabs value={tab} onValueChange={(value) => setTab(value as DexTab)} className="gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <TabsList className="tab-strip scrollbar-thin">
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
  if (tab === "moves") {
    return "Buscar movimiento o efecto";
  }
  if (tab === "abilities") {
    return "Buscar habilidad o efecto";
  }
  return "Buscar objeto, categoria o efecto";
}
