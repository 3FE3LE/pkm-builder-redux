"use client";

import { SlidersHorizontal } from "lucide-react";

import { FilterCombobox } from "@/components/builder-shared/FilterCombobox";
import { ItemSprite } from "@/components/builder-shared/ItemSprite";
import { TypeBadge } from "@/components/builder-shared/TypeBadge";
import { PokemonDexCard } from "@/components/team/screens/dex/PokemonDexCard";
import { DexCollectionLoadingSkeleton, DexFilterToggle, DexIncrementalGrid, SegmentedOwnerCollapsible } from "@/components/team/screens/dex/DexShared";
import { DexMoveEntryCard } from "@/components/team/screens/dex/DexInfoBlocks";
import { DEX_MODE_LABELS, DEX_POKEMON_MODES } from "@/components/team/screens/dex/utils";
import { TYPE_ORDER } from "@/lib/domain/typeChart";
import { normalizeName } from "@/lib/domain/names";

export function DexPokemonPanel({ model }: { model: any }) {
  return (
    <>
      <div className="mb-5 rounded-[1rem] border border-line-soft bg-surface-3/75 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-faint">Dex:</span>
            <div className="flex flex-wrap gap-2">
              {DEX_POKEMON_MODES.map((mode) => (
                <DexFilterToggle key={mode} active={model.resolvedPokemonMode === mode} onClick={() => model.setPokemonMode(mode)} tone="warning" compact>
                  {DEX_MODE_LABELS[mode]}
                </DexFilterToggle>
              ))}
            </div>
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
              href={`/team/dex/pokemon/${pokemon.slug}${model.dexQuery}`}
            />
          );
        }}
      />
    </>
  );
}

export function DexSecondaryPanels({ model }: { model: any }) {
  if (model.tab === "moves") {
    if (!model.movesPayload) return <DexCollectionLoadingSkeleton />;
    return <DexIncrementalGrid key={`moves:${model.query}`} items={model.filteredMoves} emptyLabel="No encontré movimientos con ese filtro." loadingLabel="Cargando mas movimientos..." renderItem={(move: any) => (
      <article key={move.name} className="panel-strong panel-frame rounded-[1rem] p-4">
        <DexMoveEntryCard move={move} />
        <SegmentedOwnerCollapsible label="Pokemon que lo aprenden" dexBySpecies={model.dexBySpecies} sections={[{ title: "Por level up", values: model.ownersByMove.get(normalizeName(move.name))?.levelUp ?? [] }, { title: "Por MT / Tutor", values: model.ownersByMove.get(normalizeName(move.name))?.machines ?? [] }]} emptyLabel="Sin usuarios listados." closedLabel="Ver usuarios" count={(model.ownersByMove.get(normalizeName(move.name))?.levelUp?.length ?? 0) + (model.ownersByMove.get(normalizeName(move.name))?.machines?.length ?? 0)} />
      </article>
    )} />;
  }

  if (model.tab === "abilities") {
    if (!model.abilitiesPayload) return <DexCollectionLoadingSkeleton />;
    return <DexIncrementalGrid key={`abilities:${model.query}`} items={model.filteredAbilities} emptyLabel="No encontré habilidades con ese filtro." loadingLabel="Cargando mas habilidades..." renderItem={(ability: any) => (
      <article key={ability.name} className="panel-strong panel-frame rounded-[1rem] p-4">
        <h2 className="display-face text-sm text-text">{ability.name}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{ability.effect || "Sin efecto registrado."}</p>
        <SegmentedOwnerCollapsible label="Pokemon que la poseen" dexBySpecies={model.dexBySpecies} sections={[{ title: "Habilidad normal", values: model.ownersByAbility.get(normalizeName(ability.name))?.regular ?? [] }, { title: "Habilidad oculta", values: model.ownersByAbility.get(normalizeName(ability.name))?.hidden ?? [] }]} emptyLabel="Sin usuarios listados." closedLabel="Ver usuarios" count={(model.ownersByAbility.get(normalizeName(ability.name))?.regular.length ?? 0) + (model.ownersByAbility.get(normalizeName(ability.name))?.hidden.length ?? 0)} />
      </article>
    )} />;
  }

  if (!model.itemsPayload) return <DexCollectionLoadingSkeleton />;
  return <DexIncrementalGrid key={`items:${model.query}`} items={model.filteredItems} emptyLabel="No encontré objetos con ese filtro." loadingLabel="Cargando mas objetos..." renderItem={(item: any) => {
    const locations = model.locationsByItem.get(normalizeName(item.name)) ?? [];
    return (
      <article key={item.name} className="panel-strong panel-frame rounded-[1rem] p-4">
        <div className="flex items-start gap-3">
          <ItemSprite name={item.name} sprite={item.sprite} />
          <div className="min-w-0">
            <h2 className="display-face text-sm text-text">{item.name}</h2>
            {item.category ? <p className="mt-1 text-xs uppercase tracking-[0.14em] text-text-faint">{item.category}</p> : null}
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">{item.effect || "Sin efecto registrado."}</p>
        <div className="mt-4 border-t border-line-soft pt-3">
          <p className="micro-label text-text-faint">Obtencion en BW2 Redux</p>
          {locations.length ? (
            <div className="mt-2 flex flex-col gap-2">
              {locations.slice(0, 6).map((location: any) => <div key={`${item.name}-${location.area}-${location.detail}`} className="rounded-[0.8rem] border border-line-soft bg-surface-3 px-3 py-2"><p className="text-sm text-text">{location.area}</p><p className="mt-1 text-xs leading-5 text-muted">{location.detail}</p></div>)}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No encontré una ubicacion directa en la data parseada del hack.</p>
          )}
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
