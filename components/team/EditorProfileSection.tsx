"use client";

import { Check, Lock, LockOpen } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  FilterCombobox,
  InfoHint,
  ItemSprite,
  SpeciesCombobox,
} from "@/components/BuilderShared";
import type {
  AbilityCatalogEntry,
  EditorIssueGetter,
  EditorUpdate,
  ItemCatalogEntry,
  SpeciesCatalogEntry,
} from "@/components/team/editorTypes";
import { natureOptions } from "@/lib/builderForm";
import { getNatureEffect } from "@/lib/domain/battle";
import { normalizeName } from "@/lib/domain/names";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import type { EditableMember } from "@/lib/builderStore";

export function EditorProfileSection({
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
  updateEditorMember: EditorUpdate;
  getIssue: EditorIssueGetter;
}) {
  const profileGridRef = useRef<HTMLDivElement | null>(null);
  const natureRef = useRef<HTMLLabelElement | null>(null);
  const abilityRef = useRef<HTMLLabelElement | null>(null);
  const itemRef = useRef<HTMLLabelElement | null>(null);
  const [profilePanelMetrics, setProfilePanelMetrics] = useState({
    width: 0,
    speciesLeft: 0,
    natureLeft: 0,
    abilityLeft: 0,
    itemLeft: 0,
  });
  const speciesRef = useRef<HTMLLabelElement | null>(null);
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

  useEffect(() => {
    const fallbackAbility = resolved?.abilities?.find(Boolean);
    if (!currentSpecies.trim() || currentAbility.trim() || !fallbackAbility) {
      return;
    }

    updateEditorMember((current) => {
      if (current.ability.trim()) {
        return current;
      }

      return {
        ...current,
        ability: fallbackAbility,
      };
    });
  }, [currentAbility, currentSpecies, resolved?.abilities, updateEditorMember]);

  useEffect(() => {
    function updateMetrics() {
      const grid = profileGridRef.current;
      if (!grid) {
        return;
      }

      setProfilePanelMetrics({
        width: grid.getBoundingClientRect().width,
        speciesLeft: speciesRef.current?.offsetLeft ?? 0,
        natureLeft: natureRef.current?.offsetLeft ?? 0,
        abilityLeft: abilityRef.current?.offsetLeft ?? 0,
        itemLeft: itemRef.current?.offsetLeft ?? 0,
      });
    }

    updateMetrics();
    const observer = new ResizeObserver(updateMetrics);
    if (profileGridRef.current) {
      observer.observe(profileGridRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section className="px-0 py-0">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="display-face text-sm text-accent">Perfil base</p>
        <div className="flex flex-col items-end gap-2">
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
      <div ref={profileGridRef} className="grid grid-cols-2 gap-3">
        <label ref={speciesRef} className="min-w-0 text-sm">
          <span className="mb-1 block text-muted">Pokemon</span>
          <SpeciesCombobox
            value={currentSpecies}
            speciesCatalog={speciesCatalog}
            panelClassName="max-w-none left-0"
            panelStyle={
              profilePanelMetrics.width
                ? {
                    width: `${Math.max(profilePanelMetrics.width - 12, 0)}px`,
                    left: `${-profilePanelMetrics.speciesLeft + 6}px`,
                  }
                : undefined
            }
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
        <label ref={natureRef} className="min-w-0 text-sm">
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
        <label ref={abilityRef} className="min-w-0 text-sm">
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
        <label ref={itemRef} className="min-w-0 text-sm">
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
