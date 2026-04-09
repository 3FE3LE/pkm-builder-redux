"use client";

import { useRef } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";

import {
  FilterCombobox,
  InfoHint,
  ItemSprite,
  PokemonSprite,
  SpeciesCombobox,
  TypeBadge,
} from "@/components/BuilderShared";
import { EffectiveStatsRadar } from "@/components/team/shared/StatRadar";
import { StatCard } from "@/components/team/UI";
import { Input } from "@/components/ui/Input";
import { normalizeName } from "@/lib/domain/names";
import { natureOptions } from "@/lib/builderForm";
import type { EditableMember } from "@/lib/builderStore";

import { reconcileAbilitySelection, type State } from "./state";
import type { ItemCatalogEntry, SpeciesCatalogEntry } from "./types";

export function MemberPanel({
  index,
  state,
  speciesCatalog,
  heldItemCatalog,
  onChangeMember,
}: {
  index: 0 | 1;
  state: State;
  speciesCatalog: SpeciesCatalogEntry[];
  heldItemCatalog: ItemCatalogEntry[];
  onChangeMember: (index: 0 | 1, next: EditableMember) => void;
}) {
  const {
    member,
    resolved,
    abilityDetails,
    itemDetails,
    effectiveStats,
    statModifiers,
    natureEffect,
    abilityOptions,
  } = state;
  const abilitySyncKeyRef = useRef<string | null>(null);
  const resolvedAbilities = resolved?.abilities?.filter(Boolean) ?? [];
  const nextReconciledAbility = member.species.trim() && resolvedAbilities.length
    ? reconcileAbilitySelection(member.ability, resolvedAbilities)
    : member.ability;
  const shouldReconcileAbility = nextReconciledAbility !== member.ability;
  if (shouldReconcileAbility) {
    const syncKey = `${index}|${member.species}|${member.ability}|${resolvedAbilities.join("|")}|${nextReconciledAbility}`;
    if (abilitySyncKeyRef.current !== syncKey) {
      abilitySyncKeyRef.current = syncKey;
      queueMicrotask(() => {
        onChangeMember(index, { ...member, ability: nextReconciledAbility });
      });
    }
  } else {
    abilitySyncKeyRef.current = null;
  }

  return (
    <div className="rounded-[0.9rem] px-0.5 py-0.5 sm:px-1 sm:py-1">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="order-2 min-w-0 flex-1 sm:order-1">
          <div>
            <div className="sm:hidden">
              <SpeciesCombobox
                value={member.species}
                speciesCatalog={speciesCatalog}
                coordinationGroup="compare-species"
                portal
                onChange={(species) =>
                  onChangeMember(index, {
                    ...member,
                    species,
                    nickname:
                      normalizeName(member.nickname) === normalizeName(member.species) ||
                      !member.nickname
                        ? species
                        : member.nickname,
                  })
                }
              />
            </div>
            <div className="hidden sm:block">
              <SpeciesCombobox
                value={member.species}
                speciesCatalog={speciesCatalog}
                coordinationGroup="compare-species"
                portal
                onChange={(species) =>
                  onChangeMember(index, {
                    ...member,
                    species,
                    nickname:
                      normalizeName(member.nickname) === normalizeName(member.species) ||
                      !member.nickname
                        ? species
                        : member.nickname,
                  })
                }
              />
            </div>
          </div>
          <div
            className={clsx(
              "mt-1.5 grid gap-1",
              (resolved?.resolvedTypes?.length ?? 0) > 1
                ? "grid-cols-2"
                : "grid-cols-1",
              "sm:flex sm:flex-wrap sm:gap-2",
            )}
          >
            {resolved?.resolvedTypes?.map((type) => (
              <TypeBadge
                key={`compare-${index}-${type}`}
                type={type}
                className="w-full min-w-0 px-1! py-0.5! text-[9px]! tracking-[0.04em]! sm:w-auto sm:px-2! sm:py-1! sm:text-[11px]!"
              />
            ))}
          </div>
        </div>
        <div className="order-1 flex justify-center sm:order-2 sm:justify-end">
          <div className="sm:hidden">
            <div className="scale-[0.82]">
              <PokemonSprite
                species={resolved?.species ?? member.species ?? "Pokemon"}
                spriteUrl={resolved?.spriteUrl}
                animatedSpriteUrl={resolved?.animatedSpriteUrl}
                size="default"
                chrome="plain"
              />
            </div>
          </div>
          <div className="hidden sm:block">
            <PokemonSprite
              species={resolved?.species ?? member.species ?? "Pokemon"}
              spriteUrl={resolved?.spriteUrl}
              animatedSpriteUrl={resolved?.animatedSpriteUrl}
              size="large"
              chrome="plain"
            />
          </div>
        </div>
      </div>

      <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:mt-3 sm:grid-cols-2 sm:gap-2">
        <StatCard label="BST" value={String(resolved?.resolvedStats?.bst ?? "-")} />
        <div className="hidden sm:block">
          <StatCard label="Spe" value={String(state.summaryStats?.spe ?? "-")} />
        </div>
      </div>

      <div className="mt-3 hidden gap-2 sm:grid sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Lv</span>
          <Input
            type="number"
            min={1}
            max={100}
            value={member.level}
            onChange={(event) =>
              onChangeMember(index, {
                ...member,
                level: Math.max(1, Math.min(100, Number(event.target.value || 1))),
              })
            }
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Naturaleza</span>
          <FilterCombobox
            value={member.nature}
            options={natureOptions}
            placeholder="Naturaleza"
            renderOption={(nature, selected) => (
              <div className="flex w-full items-center justify-between gap-3">
                <span>{nature}</span>
                {selected ? <Check className="h-4 w-4 text-accent" /> : null}
              </div>
            )}
            onChange={(nature) => onChangeMember(index, { ...member, nature })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 flex items-center gap-2 text-muted">
            Habilidad
            <InfoHint text={abilityDetails?.effect} />
          </span>
          <FilterCombobox
            value={member.ability}
            options={abilityOptions}
            placeholder={resolved?.abilities?.[0] ?? "Ability"}
            searchable={false}
            onChange={(ability) => onChangeMember(index, { ...member, ability })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 flex items-center gap-2 text-muted">
            Objeto
            <InfoHint text={itemDetails?.effect} />
          </span>
          <FilterCombobox
            value={member.item}
            options={heldItemCatalog.map((item) => item.name)}
            placeholder="Held item"
            renderOption={(itemName, selected) => {
              const details = heldItemCatalog.find((entry) => entry.name === itemName);
              return (
                <div className="flex w-full items-start gap-3">
                  <ItemSprite name={itemName} sprite={details?.sprite} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-text">{itemName}</div>
                  </div>
                  {selected ? (
                    <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                  ) : null}
                </div>
              );
            }}
            onChange={(item) => onChangeMember(index, { ...member, item })}
          />
        </label>
      </div>

      <div className="mt-3 hidden gap-2 sm:grid sm:grid-cols-2">
        <StatCard label="BST base" value={String(resolved?.resolvedStats?.bst ?? "-")} />
        <StatCard label="Nivel" value={String(member.level)} />
      </div>

      {effectiveStats && resolved?.resolvedStats ? (
        <div className="mt-3 hidden rounded-xl px-1 py-1 sm:block">
          <EffectiveStatsRadar
            effectiveStats={effectiveStats}
            baseStats={resolved.resolvedStats}
            level={member.level}
            nature={member.nature}
            ivs={member.ivs}
            evs={member.evs}
            statModifiers={statModifiers}
            natureEffect={natureEffect}
          />
        </div>
      ) : (
        <div className="mt-3 px-1 py-1 text-sm text-muted">
          Selecciona una especie válida para comparar.
        </div>
      )}
    </div>
  );
}
