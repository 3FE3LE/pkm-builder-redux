"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowLeftRight, Check } from "lucide-react";

import {
  FilterCombobox,
  InfoHint,
  ItemSprite,
  PokemonSprite,
  SpeciesCombobox,
  TypeBadge,
} from "@/components/BuilderShared";
import { CoverageBadge, StatCard } from "@/components/team/UI";
import { buildSummaryStats, EffectiveStatsRadar } from "@/components/team/Radar";
import { Input } from "@/components/ui/Input";
import { reconcileAbilitySelection } from "@/lib/domain/abilities";
import {
  applyStatModifiers,
  type BattleWeather,
  buildDefensiveSummary,
  calculateEffectiveStats,
  getNatureEffect,
  getStatModifiers,
} from "@/lib/domain/battle";
import { normalizeName } from "@/lib/domain/names";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import { natureOptions } from "@/lib/builderForm";
import type { EditableMember } from "@/lib/builderStore";

type SpeciesCatalogEntry = {
  name: string;
  slug: string;
  dex: number;
  types: string[];
};

type AbilityCatalogEntry = { name: string; effect?: string };

type ItemCatalogEntry = {
  name: string;
  category?: string;
  effect?: string;
  sprite?: string | null;
};

export type State = ReturnType<typeof buildState>;

export function buildState(
  member: EditableMember,
  resolved: ResolvedTeamMember | undefined,
  abilityCatalog: AbilityCatalogEntry[],
  heldItemCatalog: ItemCatalogEntry[],
  weather: BattleWeather,
) {
  const natureEffect = getNatureEffect(member.nature);
  const itemDetails =
    heldItemCatalog.find((item) => item.name === member.item) ??
    resolved?.itemDetails ??
    null;
  const abilityDetails =
    abilityCatalog.find((ability) => ability.name === member.ability) ??
    resolved?.abilityDetails ??
    null;
  const statModifiers = resolved?.resolvedStats
    ? getStatModifiers({
        itemName: member.item,
        itemEffect: itemDetails?.effect,
        abilityName: member.ability,
        abilityEffect: abilityDetails?.effect,
        canEvolve: Boolean(resolved.nextEvolutions?.length),
        weather,
        resolvedTypes: resolved?.resolvedTypes,
      })
    : [];
  const summaryStats = resolved?.resolvedStats
    ? buildSummaryStats(resolved.resolvedStats, natureEffect, statModifiers)
    : undefined;
  const effectiveStats = resolved?.resolvedStats
    ? applyStatModifiers(
        calculateEffectiveStats(
          resolved.resolvedStats,
          member.level,
          member.nature,
          member.ivs,
          member.evs,
        ),
        statModifiers,
      )
    : undefined;
  const abilityOptions = Array.from(
    new Set(
      resolved?.abilities?.length
        ? resolved.abilities
        : member.ability
          ? [member.ability]
          : [],
    ),
  );
  const defensiveSummary = resolved?.resolvedTypes?.length
    ? buildDefensiveSummary([resolved])
    : [];
  const weaknesses = defensiveSummary.filter(
    (entry) => entry.buckets.x4 > 0 || entry.buckets.x2 > 0,
  );
  const resistances = defensiveSummary.filter(
    (entry) =>
      entry.buckets["x0.5"] > 0 ||
      entry.buckets["x0.25"] > 0 ||
      entry.buckets.x0 > 0,
  );

  return {
    member,
    resolved,
    natureEffect,
    itemDetails,
    abilityDetails,
    statModifiers,
    summaryStats,
    effectiveStats,
    abilityOptions,
    weaknesses,
    resistances,
  };
}

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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const speciesRef = useRef<HTMLDivElement | null>(null);
  const [speciesPanelMetrics, setSpeciesPanelMetrics] = useState({
    viewportWidth: 0,
    viewportLeft: 0,
    viewportTop: 0,
  });

  useEffect(() => {
    function updateMetrics() {
      const panel = panelRef.current;
      const speciesNode = speciesRef.current;
      if (!panel || !speciesNode) {
        return;
      }

      const rect = speciesNode.getBoundingClientRect();
      setSpeciesPanelMetrics({
        viewportWidth: window.innerWidth,
        viewportLeft: rect.left,
        viewportTop: rect.bottom + 8,
      });
    }

    updateMetrics();
    const observer = new ResizeObserver(updateMetrics);
    if (panelRef.current) {
      observer.observe(panelRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const resolvedAbilities = resolved?.abilities?.filter(Boolean) ?? [];
    if (!member.species.trim() || !resolvedAbilities.length) {
      return;
    }

    const nextAbility = reconcileAbilitySelection(member.ability, resolvedAbilities);
    if (nextAbility === member.ability) {
      return;
    }

    onChangeMember(index, { ...member, ability: nextAbility });
  }, [index, member, onChangeMember, resolved?.abilities]);

  return (
    <div ref={panelRef} className="rounded-[0.9rem] px-0.5 py-0.5 sm:px-1 sm:py-1">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 order-2 sm:order-1">
          <div ref={speciesRef}>
          <div className="sm:hidden">
            <SpeciesCombobox
              value={member.species}
              speciesCatalog={speciesCatalog}
              coordinationGroup="compare-species"
              portal
              panelStyle={
                speciesPanelMetrics.viewportWidth
                  ? (() => {
                      const width = Math.min(
                        Math.max(speciesPanelMetrics.viewportWidth - 24, 0),
                        672,
                      );
                      const idealLeft = speciesPanelMetrics.viewportLeft;
                      const minLeft = 12;
                      const maxLeft = Math.max(12, speciesPanelMetrics.viewportWidth - 12 - width);
                      const left = Math.min(Math.max(idealLeft, minLeft), maxLeft);

                      return {
                        position: "fixed",
                        top: `${speciesPanelMetrics.viewportTop}px`,
                        width: `${width}px`,
                        left: `${left}px`,
                        background: "var(--floating-panel-bg)",
                        backdropFilter: "none",
                      };
                    })()
                  : undefined
              }
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
              panelStyle={
                speciesPanelMetrics.viewportWidth
                  ? (() => {
                      const width = Math.min(
                        Math.max(speciesPanelMetrics.viewportWidth - 24, 0),
                        672,
                      );
                      const idealLeft = speciesPanelMetrics.viewportLeft;
                      const minLeft = 12;
                      const maxLeft = Math.max(12, speciesPanelMetrics.viewportWidth - 12 - width);
                      const left = Math.min(Math.max(idealLeft, minLeft), maxLeft);

                      return {
                        position: "fixed",
                        top: `${speciesPanelMetrics.viewportTop}px`,
                        width: `${width}px`,
                        left: `${left}px`,
                        background: "var(--floating-panel-bg)",
                        backdropFilter: "none",
                      };
                    })()
                  : undefined
              }
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
              (resolved?.resolvedTypes?.length ?? 0) > 1 ? "grid-cols-2" : "grid-cols-1",
              "sm:flex sm:flex-wrap sm:gap-2",
            )}
          >
            {resolved?.resolvedTypes?.map((type) => (
              <TypeBadge
                key={`compare-${index}-${type}`}
                type={type}
                className="w-full min-w-0 !px-1 !py-0.5 !text-[9px] !tracking-[0.04em] sm:w-auto sm:!px-2 sm:!py-1 sm:!text-[11px]"
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
        <div className="mt-3 hidden rounded-[0.75rem] px-1 py-1 sm:block">
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

export function Summary({
  left,
  right,
}: {
  left: State;
  right: State;
}) {
  const summaryDiffs = [
    { label: "BST base", left: left.resolved?.resolvedStats?.bst, right: right.resolved?.resolvedStats?.bst },
    { label: "HP", left: left.summaryStats?.hp, right: right.summaryStats?.hp },
    { label: "Atk", left: left.summaryStats?.atk, right: right.summaryStats?.atk },
    { label: "Def", left: left.summaryStats?.def, right: right.summaryStats?.def },
    { label: "SpA", left: left.summaryStats?.spa, right: right.summaryStats?.spa },
    { label: "SpD", left: left.summaryStats?.spd, right: right.summaryStats?.spd },
    { label: "Spe", left: left.summaryStats?.spe, right: right.summaryStats?.spe },
  ];

  return (
    <div className="rounded-[0.9rem] px-1 py-1">
      <div className="flex items-center justify-center gap-2">
        <ArrowLeftRight className="h-5 w-5 text-accent" />
        <p className="display-face text-sm text-accent">Vs</p>
      </div>
      <div className="mt-3 grid gap-2 sm:space-y-0">
        <article className="rounded-[0.75rem] px-1 py-1">
          <p className="display-face text-center text-xs text-danger">Debilidades</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ComparisonBucket entries={left.weaknesses} fallback="Sin debilidades" />
            <ComparisonBucket entries={right.weaknesses} fallback="Sin debilidades" />
          </div>
        </article>

        <article className="rounded-[0.75rem] px-1 py-1">
          <p className="display-face text-center text-xs text-info">Resistencias</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ComparisonBucket
              entries={left.resistances}
              fallback="Sin resistencias"
              pickBucket={(entry) =>
                entry.buckets.x0 > 0 ? "x0" : entry.buckets["x0.25"] > 0 ? "x0.25" : "x0.5"
              }
            />
            <ComparisonBucket
              entries={right.resistances}
              fallback="Sin resistencias"
              pickBucket={(entry) =>
                entry.buckets.x0 > 0 ? "x0" : entry.buckets["x0.25"] > 0 ? "x0.25" : "x0.5"
              }
            />
          </div>
        </article>
      </div>
      <div className="mt-3 grid gap-1.5 sm:gap-2">
        {summaryDiffs.map((entry) => {
          const leftValue = entry.left ?? null;
          const rightValue = entry.right ?? null;
          const delta =
            typeof leftValue === "number" && typeof rightValue === "number"
              ? leftValue - rightValue
              : null;

          return (
            <div
              key={`compare-diff-${entry.label}`}
              className="rounded-[0.625rem] px-2 py-1.5"
            >
              <div className="display-face text-[10px] text-muted sm:text-[11px]">{entry.label}</div>
              <div className="mt-1 flex items-center justify-between gap-1.5 text-xs sm:gap-2 sm:text-sm">
                <span
                  className={clsx(
                    typeof leftValue === "number" &&
                      typeof rightValue === "number" &&
                      leftValue > rightValue &&
                      "text-primary",
                  )}
                >
                  {leftValue ?? "-"}
                </span>
                <span
                  className={clsx(
                    "display-face text-xs",
                    delta === null
                      ? "text-muted"
                      : delta !== 0
                        ? "text-primary"
                        : "text-muted",
                  )}
                >
                  {delta === null ? "-" : delta > 0 ? `+${delta}` : String(delta)}
                </span>
                <span
                  className={clsx(
                    typeof leftValue === "number" &&
                      typeof rightValue === "number" &&
                      rightValue > leftValue &&
                      "text-primary",
                  )}
                >
                  {rightValue ?? "-"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComparisonBucket({
  entries,
  fallback,
  pickBucket = (entry) => (entry.buckets.x4 > 0 ? "x4" : "x2"),
}: {
  entries: State["weaknesses"];
  fallback: string;
  pickBucket?: (entry: State["weaknesses"][number]) => "x4" | "x2" | "x0" | "x0.25" | "x0.5";
}) {
  return (
    <div className="rounded-[0.625rem] px-1 py-1.5">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {entries.length ? (
          entries.map((entry) => (
            <CoverageBadge
              key={entry.attackType}
              type={entry.attackType}
              label={entry.attackType}
              bucket={pickBucket(entry)}
            />
          ))
        ) : (
          <span className="text-xs text-muted">{fallback}</span>
        )}
      </div>
    </div>
  );
}
