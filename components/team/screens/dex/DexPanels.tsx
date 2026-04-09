"use client";

import clsx from "clsx";
import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { FilterCombobox } from "@/components/builder-shared/FilterCombobox";
import { ItemSprite } from "@/components/builder-shared/ItemSprite";
import { TypeBadge } from "@/components/builder-shared/TypeBadge";
import { PokemonDexCard } from "@/components/team/screens/dex/PokemonDexCard";
import {
  DexCollectionLoadingSkeleton,
  DexFilterToggle,
  DexIncrementalGrid,
  SegmentedOwnerCollapsible,
  dexPanelCardClassName,
  dexStatChipClassName,
} from "@/components/team/screens/dex/DexShared";
import { DexMoveEntryCard, InfoBlock } from "@/components/team/screens/dex/DexInfoBlocks";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DEX_MODE_LABELS, DEX_MODE_SHORT_LABELS, DEX_POKEMON_MODES } from "@/components/team/screens/dex/utils";
import { TYPE_ORDER } from "@/lib/domain/typeChart";
import { normalizeName } from "@/lib/domain/names";

export function DexPokemonPanel({ model }: { model: any }) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <>
      <div className="mb-2 sm:mb-3">
        <div className="sm:hidden">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <FilterCombobox value={model.primaryTypeFilter} options={["", ...TYPE_ORDER]} placeholder="Cualquiera" searchable={false} coordinationGroup="dex-type-filters" onChange={model.setPrimaryTypeFilter} renderOption={(option) => option ? <TypeBadge type={option} /> : <span className="text-sm text-text-faint">Cualquiera</span>} />
            </div>
            <div className="min-w-0">
              <FilterCombobox value={model.secondaryTypeFilter} options={["", ...TYPE_ORDER]} placeholder="Cualquiera" searchable={false} coordinationGroup="dex-type-filters" onChange={model.setSecondaryTypeFilter} renderOption={(option) => option ? <TypeBadge type={option} /> : <span className="text-sm text-text-faint">Cualquiera</span>} />
            </div>
          </div>
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 text-left">
              <div>
                <p className="micro-label text-text-faint">Filtros Dex</p>
                {model.activePokemonFilterCount ? (
                  <p className="mt-1 text-xs text-muted">{model.activePokemonFilterCount} activos</p>
                ) : null}
              </div>
              <span className="app-icon-button inline-flex items-center justify-center h-8 w-8 rounded-full text-text-faint">
                <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="grid gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-text-faint">Dex:</span>
                  <DexModeSegmentedControl value={model.resolvedPokemonMode} onChange={model.setPokemonMode} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-text-faint">Cambios:</span>
                  <DexFilterToggle active={model.typeChangesOnly === "1"} onClick={() => model.setTypeChangesOnly(model.typeChangesOnly === "1" ? "0" : "1")} tone="warning" compact>Tipos</DexFilterToggle>
                  <DexFilterToggle active={model.statChangesOnly === "1"} onClick={() => model.setStatChangesOnly(model.statChangesOnly === "1" ? "0" : "1")} tone="info" compact>Stats</DexFilterToggle>
                  <DexFilterToggle active={model.abilityChangesOnly === "1"} onClick={() => model.setAbilityChangesOnly(model.abilityChangesOnly === "1" ? "0" : "1")} tone="accent" compact>Habs</DexFilterToggle>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-text-faint">Sinergia:</span>
                  <DexFilterToggle active={model.addsNewTeamTypeOnly === "1"} onClick={() => model.setAddsNewTeamTypeOnly(model.addsNewTeamTypeOnly === "1" ? "0" : "1")} tone="primary" compact>+Tipo</DexFilterToggle>
                  <DexFilterToggle active={model.allTypesNewToTeamOnly === "1"} onClick={() => model.setAllTypesNewToTeamOnly(model.allTypesNewToTeamOnly === "1" ? "0" : "1")} tone="accent" compact>Nuevo</DexFilterToggle>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-faint">Dex:</span>
            <DexModeSegmentedControl value={model.resolvedPokemonMode} onChange={model.setPokemonMode} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-faint">Tipo 1:</span>
            <div className="w-36">
              <FilterCombobox value={model.primaryTypeFilter} options={["", ...TYPE_ORDER]} placeholder="Cualquiera" searchable={false} coordinationGroup="dex-type-filters" onChange={model.setPrimaryTypeFilter} renderOption={(option) => option ? <TypeBadge type={option} /> : <span className="text-sm text-text-faint">Cualquiera</span>} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-faint">Tipo 2:</span>
            <div className="w-36">
              <FilterCombobox value={model.secondaryTypeFilter} options={["", ...TYPE_ORDER]} placeholder="Cualquiera" searchable={false} coordinationGroup="dex-type-filters" onChange={model.setSecondaryTypeFilter} renderOption={(option) => option ? <TypeBadge type={option} /> : <span className="text-sm text-text-faint">Cualquiera</span>} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-faint">Cambios:</span>
            <DexFilterToggle active={model.typeChangesOnly === "1"} onClick={() => model.setTypeChangesOnly(model.typeChangesOnly === "1" ? "0" : "1")} tone="warning" compact>Tipos</DexFilterToggle>
            <DexFilterToggle active={model.statChangesOnly === "1"} onClick={() => model.setStatChangesOnly(model.statChangesOnly === "1" ? "0" : "1")} tone="info" compact>Stats</DexFilterToggle>
            <DexFilterToggle active={model.abilityChangesOnly === "1"} onClick={() => model.setAbilityChangesOnly(model.abilityChangesOnly === "1" ? "0" : "1")} tone="accent" compact>Habs</DexFilterToggle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-faint">Sinergia:</span>
            <DexFilterToggle active={model.addsNewTeamTypeOnly === "1"} onClick={() => model.setAddsNewTeamTypeOnly(model.addsNewTeamTypeOnly === "1" ? "0" : "1")} tone="primary" compact>+Tipo</DexFilterToggle>
            <DexFilterToggle active={model.allTypesNewToTeamOnly === "1"} onClick={() => model.setAllTypesNewToTeamOnly(model.allTypesNewToTeamOnly === "1" ? "0" : "1")} tone="accent" compact>Nuevo</DexFilterToggle>
          </div>
        </div>
      </div>
      <DexIncrementalGrid
        key={`pokemon:${model.dexQuery}`}
        items={model.filteredPokemon}
        emptyLabel="No encontré Pokemon con ese filtro."
        loadingLabel="Cargando mas Pokemon..."
        gridClassName="grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        renderItem={(pokemon: any) => {
          const speciesKey = normalizeName(pokemon.name);
          return (
            <PokemonDexCard
              key={pokemon.slug}
              pokemon={pokemon}
              abilityEffects={model.abilityEffects}
              moveDetailsByName={model.moveDetailsByName}
              wildEncounters={model.acquisitionBySpecies.wildBySpecies.get(speciesKey) ?? []}
              gifts={model.acquisitionBySpecies.giftsBySpecies.get(speciesKey) ?? []}
              trades={model.acquisitionBySpecies.tradesBySpecies.get(speciesKey) ?? []}
              captured={model.capturedSpecies.has(speciesKey)}
              suggested={model.suggestedSpecies.has(speciesKey)}
              href={`/team/dex/pokemon/${pokemon.slug}${model.dexQuery}`}
            />
          );
        }}
      />
    </>
  );
}

function DexModeSegmentedControl({
  value,
  onChange,
}: {
  value: (typeof DEX_POKEMON_MODES)[number];
  onChange: (mode: (typeof DEX_POKEMON_MODES)[number]) => void;
}) {
  return (
    <div className="app-control-surface grid w-full max-w-72 grid-cols-6 rounded-[0.9rem] p-1 sm:w-auto">
      {DEX_POKEMON_MODES.map((mode) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            title={DEX_MODE_LABELS[mode]}
            onClick={() => onChange(mode)}
            className={clsx(
              "pixel-face inline-flex min-w-0 items-center justify-center rounded-4xl px-1.5 py-1.5 text-[11px] transition sm:text-xs",
              active
                ? "bg-warning-fill text-[hsl(39_100%_82%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-muted hover:bg-surface-2 hover:text-text",
            )}
          >
            {DEX_MODE_SHORT_LABELS[mode]}
          </button>
        );
      })}
    </div>
  );
}

export function DexSecondaryPanels({ model }: { model: any }) {
  if (model.tab === "moves") {
    if (!model.movesPayload) return <DexCollectionLoadingSkeleton />;
    return <DexIncrementalGrid key={`moves:${model.query}`} items={model.filteredMoves} emptyLabel="No encontré movimientos con ese filtro." loadingLabel="Cargando mas movimientos..." gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" renderItem={(move: any) => (
      <article key={move.name} className={dexPanelCardClassName}>
        <div className="space-y-3">
          <div>
            <p className="micro-label text-text-faint">Movimiento</p>
            <h2 className="mt-1 display-face text-sm text-text">{move.name}</h2>
          </div>
          <DexMoveEntryCard move={move} compact />
          <InfoBlock label="Detalles">
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              <span className={dexStatChipClassName}>
                {move.damageClass || "Status"}
              </span>
              {move.power ? (
                <span className={dexStatChipClassName}>
                  Pot {move.power}
                </span>
              ) : null}
              {move.accuracy ? (
                <span className={dexStatChipClassName}>
                  Acc {move.accuracy}%
                </span>
              ) : null}
              {move.pp ? (
                <span className={dexStatChipClassName}>
                  PP {move.pp}
                </span>
              ) : null}
              {move.priority ? (
                <span className="rounded-2xl border border-warning-line px-2 py-1 text-warning-strong">
                  Pri {move.priority > 0 ? `+${move.priority}` : move.priority}
                </span>
              ) : null}
            </div>
          </InfoBlock>
          <InfoBlock label="Efecto">
            <p className="text-sm leading-6 text-muted">{move.description || "Sin descripcion registrada."}</p>
          </InfoBlock>
          <SegmentedOwnerCollapsible label="Pokemon que lo aprenden" dexBySpecies={model.dexBySpecies} sections={[{ title: "Por level up", values: model.ownersByMove.get(normalizeName(move.name))?.levelUp ?? [] }, { title: "Por MT / Tutor", values: model.ownersByMove.get(normalizeName(move.name))?.machines ?? [] }]} emptyLabel="Sin usuarios listados." closedLabel="Ver usuarios" count={(model.ownersByMove.get(normalizeName(move.name))?.levelUp?.length ?? 0) + (model.ownersByMove.get(normalizeName(move.name))?.machines?.length ?? 0)} />
        </div>
      </article>
    )} />;
  }

  if (model.tab === "abilities") {
    if (!model.abilitiesPayload) return <DexCollectionLoadingSkeleton />;
    return <DexIncrementalGrid key={`abilities:${model.query}`} items={model.filteredAbilities} emptyLabel="No encontré habilidades con ese filtro." loadingLabel="Cargando mas habilidades..." gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" renderItem={(ability: any) => (
      <article key={ability.name} className={dexPanelCardClassName}>
        <div className="space-y-3">
          <div>
            <p className="micro-label text-text-faint">Habilidad</p>
            <h2 className="mt-1 display-face text-sm text-text">{ability.name}</h2>
          </div>
          <InfoBlock label="Efecto">
            <p className="text-sm leading-6 text-muted">{ability.effect || "Sin efecto registrado."}</p>
          </InfoBlock>
          <SegmentedOwnerCollapsible label="Pokemon que la poseen" dexBySpecies={model.dexBySpecies} sections={[{ title: "Habilidad normal", values: model.ownersByAbility.get(normalizeName(ability.name))?.regular ?? [] }, { title: "Habilidad oculta", values: model.ownersByAbility.get(normalizeName(ability.name))?.hidden ?? [] }]} emptyLabel="Sin usuarios listados." closedLabel="Ver usuarios" count={(model.ownersByAbility.get(normalizeName(ability.name))?.regular.length ?? 0) + (model.ownersByAbility.get(normalizeName(ability.name))?.hidden.length ?? 0)} />
        </div>
      </article>
    )} />;
  }

  if (!model.itemsPayload) return <DexCollectionLoadingSkeleton />;
  return <DexIncrementalGrid key={`items:${model.query}`} items={model.filteredItems} emptyLabel="No encontré objetos con ese filtro." loadingLabel="Cargando mas objetos..." gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" renderItem={(item: any) => {
    const locations = item.sources?.locations ?? [];
    const shopLocations = item.sources?.shops ?? [];
    return (
      <article key={item.name} className={dexPanelCardClassName}>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <ItemSprite name={item.name} sprite={item.sprite} />
            <div className="min-w-0">
              <p className="micro-label text-text-faint">Objeto</p>
              <h2 className="mt-1 display-face text-sm text-text">{item.name}</h2>
              {item.category ? <p className="mt-1 text-xs uppercase tracking-[0.14em] text-text-faint">{item.category}</p> : null}
            </div>
          </div>
          <InfoBlock label="Efecto">
            <p className="text-sm leading-6 text-muted">{item.effect || "Sin efecto registrado."}</p>
          </InfoBlock>
          <InfoBlock label="Obtencion en BW2 Redux">
            {locations.length || shopLocations.length ? (
              <div className="flex flex-col gap-3">
                {locations.length ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-text-faint">Mapa</p>
                    {locations.slice(0, 6).map((location: any) => <div key={`${item.name}-${location.area}-${location.detail}`} className="app-soft-panel rounded-[0.8rem] px-3 py-2"><p className="text-sm text-text">{location.area}</p><p className="mt-1 text-xs leading-5 text-muted">{location.detail}</p></div>)}
                  </div>
                ) : null}
                {shopLocations.length ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-text-faint">Tiendas</p>
                    {shopLocations.slice(0, 6).map((location: any) => <div key={`${item.name}-shop-${location.area}-${location.detail}`} className="app-soft-panel rounded-[0.8rem] px-3 py-2"><p className="text-sm text-text">{location.area}</p><p className="mt-1 text-xs leading-5 text-muted">{location.detail}</p></div>)}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted">No encontré una ubicacion directa en la data parseada del hack.</p>
            )}
          </InfoBlock>
        </div>
      </article>
    );
  }} />;
}

export function DexResultSummary({ model }: { model: any }) {
  const count =
    model.tab === "pokemon"
      ? model.filteredPokemon.length
      : model.tab === "moves"
        ? model.filteredMoves.length
        : model.tab === "abilities"
          ? model.filteredAbilities.length
          : model.filteredItems.length;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="text-text-soft"><span className="display-face text-text">{count}</span> resultados</span>
      {model.tab === "pokemon" && model.activePokemonFilterCount > 0 ? (
        <>
          <span className="text-line-strong">|</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-line-faint bg-accent-fill-soft px-3 py-1 text-xs text-accent-soft">
            <SlidersHorizontal className="h-3 w-3" />
            {model.activePokemonFilterCount} filtro{model.activePokemonFilterCount > 1 ? "s" : ""} activo{model.activePokemonFilterCount > 1 ? "s" : ""}
          </span>
          <button type="button" onClick={() => {
            model.setPokemonMode("national");
            model.setTypeChangesOnly("0");
            model.setStatChangesOnly("0");
            model.setAbilityChangesOnly("0");
            model.setAddsNewTeamTypeOnly("0");
            model.setAllTypesNewToTeamOnly("0");
            model.setPrimaryTypeFilter("");
            model.setSecondaryTypeFilter("");
          }} className="text-sm font-medium text-text-faint transition-colors hover:text-accent-soft">
            Limpiar filtros
          </button>
        </>
      ) : null}
    </div>
  );
}
