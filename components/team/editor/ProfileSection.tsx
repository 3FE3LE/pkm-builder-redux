"use client";

import { Check, Lock, LockOpen } from "lucide-react";
import { useMemo, useRef } from "react";

import {
  FilterCombobox,
  InfoHint,
  ItemSprite,
  SpeciesCombobox,
} from "@/components/BuilderShared";
import { TransferActions } from "@/components/team/shared/TransferPanels";
import type {
  AbilityCatalogEntry,
  IssueGetter,
  ItemCatalogEntry,
  SpeciesCatalogEntry,
  Update,
} from "@/components/team/editor/types";
import { natureOptions } from "@/lib/builderForm";
import { reconcileAbilitySelection } from "@/lib/domain/abilities";
import { getNatureEffect } from "@/lib/domain/battle";
import { normalizeName } from "@/lib/domain/names";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import type { EditableMember } from "@/lib/builderStore";

export function ProfileSection({
  member,
  resolved,
  speciesCatalog,
  abilityCatalog,
  itemCatalog,
  nicknameValue,
  currentSpecies,
  currentNature,
  currentAbility,
  currentItem,
  updateEditorMember,
  getIssue,
  onImportToPc: _onImportToPc,
}: {
  member: EditableMember;
  resolved?: ResolvedTeamMember;
  speciesCatalog: SpeciesCatalogEntry[];
  abilityCatalog: AbilityCatalogEntry[];
  itemCatalog: ItemCatalogEntry[];
  nicknameValue: string;
  currentSpecies: string;
  currentNature: string;
  currentAbility: string;
  currentItem: string;
  updateEditorMember: Update;
  getIssue: IssueGetter;
  onImportToPc: (member: EditableMember) => boolean;
}) {
  const shouldAutoFocusSpecies = !currentSpecies.trim();
  const previewAbilityDetails =
    abilityCatalog.find((entry) => entry.name === currentAbility) ??
    resolved?.abilityDetails ??
    null;
  const previewItemDetails =
    itemCatalog.find((entry) => entry.name === currentItem) ??
    resolved?.itemDetails ??
    null;

  const abilityOptions = useMemo(() => {
    const resolvedAbilities = resolved?.abilities?.filter(Boolean) ?? [];
    if (!resolvedAbilities.length) {
      return currentAbility ? [currentAbility] : [];
    }
    return Array.from(
      new Set(currentAbility ? [...resolvedAbilities, currentAbility] : resolvedAbilities),
    );
  }, [currentAbility, resolved?.abilities]);

  const heldItemOptions = useMemo(() => {
    const heldItems = itemCatalog
      .filter((item) => item.category?.toLowerCase().includes("held"))
      .map((item) => item.name);
    return Array.from(new Set(currentItem ? [...heldItems, currentItem] : heldItems));
  }, [currentItem, itemCatalog]);

  const abilitySyncKeyRef = useRef<string | null>(null);
  const resolvedAbilities = resolved?.abilities?.filter(Boolean) ?? [];
  const nextReconciledAbility = currentSpecies.trim() && resolvedAbilities.length
    ? reconcileAbilitySelection(currentAbility, resolvedAbilities)
    : currentAbility;
  const shouldReconcileAbility = nextReconciledAbility !== currentAbility;
  if (shouldReconcileAbility) {
    const syncKey = `${currentSpecies}|${currentAbility}|${resolvedAbilities.join("|")}|${nextReconciledAbility}`;
    if (abilitySyncKeyRef.current !== syncKey) {
      abilitySyncKeyRef.current = syncKey;
      queueMicrotask(() => {
        updateEditorMember((current) => {
          const updatedAbility = reconcileAbilitySelection(current.ability, resolvedAbilities);
          if (updatedAbility === current.ability) {
            return current;
          }
          return { ...current, ability: updatedAbility };
        });
      });
    }
  } else {
    abilitySyncKeyRef.current = null;
  }

  return (
    <section className="px-0 py-0">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="display-face text-sm text-accent">Perfil base</p>
        <div className="flex items-center gap-2">
          <TransferActions member={member.species.trim() ? member : undefined} />
          <button
            type="button"
            onClick={() =>
              updateEditorMember((current) => ({
                ...current,
                locked: !current.locked,
              }))
            }
            className="inline-flex items-center gap-2 rounded-[6px] border border-line bg-surface-3 px-3 py-1.5 text-xs text-muted"
          >
            {member.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="min-w-0 text-sm">
          <span className="mb-1 block text-muted">Pokemon</span>
          <SpeciesCombobox
            value={currentSpecies}
            speciesCatalog={speciesCatalog}
            autoFocus={shouldAutoFocusSpecies}
            panelClassName="max-w-none left-0"
            onChange={(species) => {
              updateEditorMember((current) => {
                const shouldSyncNickname =
                  !nicknameValue ||
                  normalizeName(nicknameValue) === normalizeName(current.species);

                return {
                  ...current,
                  species,
                  nickname: shouldSyncNickname ? species : current.nickname,
                  ability: "",
                };
              });
            }}
          />
          {getIssue("species") ? (
            <span className="mt-2 block text-[11px] text-danger">
              {getIssue("species")}
            </span>
          ) : null}
        </label>
        <label className="min-w-0 text-sm">
          <span className="mb-1 block text-muted">Naturaleza</span>
          <FilterCombobox
            value={currentNature}
            options={natureOptions}
            placeholder="Naturaleza"
            panelClassName=""
            coordinationGroup="editor-profile"
            renderOption={(nature, selected) => {
              const effect = getNatureEffect(nature);
              const up = effect.up ? effect.up.toUpperCase() : null;
              const down = effect.down ? effect.down.toUpperCase() : null;
              return (
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span>{nature}</span>
                    {up || down ? (
                      <span className="text-xs text-muted">
                        {up ? `+${up}` : ""}
                        {up && down ? " / " : ""}
                        {down ? `-${down}` : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">neutral</span>
                    )}
                  </div>
                  {selected ? <Check className="h-4 w-4 text-accent" /> : null}
                </div>
              );
            }}
            onChange={(nature) =>
              updateEditorMember((current) => ({ ...current, nature }))
            }
          />
        </label>
        <label className="min-w-0 text-sm">
          <span className="mb-1 flex items-center gap-2 text-muted">
            Habilidad
            <InfoHint text={previewAbilityDetails?.effect} />
          </span>
          <FilterCombobox
            value={currentAbility}
            options={abilityOptions}
            placeholder="Ability"
            searchable={false}
            panelClassName=""
            coordinationGroup="editor-profile"
            renderOption={(ability, selected) => {
              const details = abilityCatalog.find((entry) => entry.name === ability);
              return (
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-text">{ability}</div>
                    {details?.effect ? (
                      <div className="mt-1 line-clamp-2 text-xs text-muted">
                        {details.effect}
                      </div>
                    ) : null}
                  </div>
                  {selected ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  ) : null}
                </div>
              );
            }}
            onChange={(ability) =>
              updateEditorMember((current) => ({ ...current, ability }))
            }
          />
        </label>
        <label className="min-w-0 text-sm">
          <span className="mb-1 flex items-center gap-2 text-muted">
            Objeto
            <InfoHint text={previewItemDetails?.effect} />
          </span>
          <FilterCombobox
            value={currentItem}
            options={heldItemOptions}
            placeholder="Held item"
            panelClassName=""
            coordinationGroup="editor-profile"
            renderOption={(itemName, selected) => {
              const details = itemCatalog.find((entry) => entry.name === itemName);
              return (
                <div className="flex w-full items-start gap-3">
                  <ItemSprite name={itemName} sprite={details?.sprite} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-text">{itemName}</div>
                    {details?.effect ? (
                      <div className="mt-1 line-clamp-2 text-xs text-muted">
                        {details.effect}
                      </div>
                    ) : null}
                  </div>
                  {selected ? (
                    <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                  ) : null}
                </div>
              );
            }}
            onChange={(item) =>
              updateEditorMember((current) => ({ ...current, item }))
            }
          />
        </label>
      </div>
    </section>
  );
}
