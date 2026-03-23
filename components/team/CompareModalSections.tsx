"use client";

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

export type CompareState = ReturnType<typeof buildCompareState>;

export function buildCompareState(
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

export function CompareMemberPanel({
  index,
  state,
  speciesCatalog,
  heldItemCatalog,
  onChangeMember,
}: {
  index: 0 | 1;
  state: CompareState;
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

  return (
    <div className="rounded-[0.9rem] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <SpeciesCombobox
            value={member.species}
            speciesCatalog={speciesCatalog}
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
          <div className="mt-3 flex flex-wrap gap-2">
            {resolved?.resolvedTypes?.map((type) => (
              <TypeBadge key={`compare-${index}-${type}`} type={type} />
            ))}
          </div>
        </div>
        <PokemonSprite
          species={resolved?.species ?? member.species ?? "Pokemon"}
          spriteUrl={resolved?.spriteUrl}
          animatedSpriteUrl={resolved?.animatedSpriteUrl}
          size="large"
          chrome="plain"
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <StatCard label="BST base" value={String(resolved?.resolvedStats?.bst ?? "-")} />
        <StatCard label="Nivel" value={String(member.level)} />
      </div>

      {effectiveStats && resolved?.resolvedStats ? (
        <div className="rounded-[0.75rem] p-2">
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
        <div className="mt-4 rounded-[0.75rem] border border-line px-4 py-5 text-sm text-muted">
          Selecciona una especie válida para comparar.
        </div>
      )}
    </div>
  );
}

export function ComparisonSummary({
  left,
  right,
}: {
  left: CompareState;
  right: CompareState;
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
    <div className="rounded-[0.9rem] p-4">
      <div className="flex items-center justify-center gap-2">
        <ArrowLeftRight className="h-5 w-5 text-accent" />
        <p className="display-face text-sm text-accent">Vs</p>
      </div>
      <div className="mt-4 space-y-3">
        <article className="rounded-[0.75rem] p-2">
          <p className="display-face text-xs text-danger">Debilidades</p>
          <div className="mt-3 grid gap-3">
            <ComparisonBucket title="Izq" entries={left.weaknesses} fallback="Sin debilidades" />
            <ComparisonBucket title="Der" entries={right.weaknesses} fallback="Sin debilidades" />
          </div>
        </article>

        <article className="rounded-[0.75rem] p-2">
          <p className="display-face text-xs text-info">Resistencias</p>
          <div className="mt-3 grid gap-3">
            <ComparisonBucket
              title="Izq"
              entries={left.resistances}
              fallback="Sin resistencias"
              pickBucket={(entry) =>
                entry.buckets.x0 > 0 ? "x0" : entry.buckets["x0.25"] > 0 ? "x0.25" : "x0.5"
              }
            />
            <ComparisonBucket
              title="Der"
              entries={right.resistances}
              fallback="Sin resistencias"
              pickBucket={(entry) =>
                entry.buckets.x0 > 0 ? "x0" : entry.buckets["x0.25"] > 0 ? "x0.25" : "x0.5"
              }
            />
          </div>
        </article>
      </div>
      <div className="mt-4 grid gap-2">
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
              className="rounded-[0.625rem] px-3 py-2"
            >
              <div className="display-face text-[11px] text-muted">{entry.label}</div>
              <div className="mt-1 flex items-center justify-between gap-2 text-sm">
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
  title,
  entries,
  fallback,
  pickBucket = (entry) => (entry.buckets.x4 > 0 ? "x4" : "x2"),
}: {
  title: string;
  entries: CompareState["weaknesses"];
  fallback: string;
  pickBucket?: (entry: CompareState["weaknesses"][number]) => "x4" | "x2" | "x0" | "x0.25" | "x0.5";
}) {
  return (
    <div className="rounded-[0.625rem] px-2.5 py-2">
      <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-muted">{title}</p>
      <div className="flex flex-wrap gap-2">
        {entries.length ? (
          entries.map((entry) => (
            <CoverageBadge
              key={`${title}-${entry.attackType}`}
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
