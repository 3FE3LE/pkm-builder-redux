"use client";

import { useMemo } from 'react';

import { RoleAxesCard } from '@/components/team/shared/RoleAxes';
import {
  buildSummaryStats,
  EffectiveStatsRadar,
} from '@/components/team/shared/StatRadar';
import {
  MetaBadge,
  MiniPill,
  SpreadInput,
  StatBar,
} from '@/components/team/UI';
import { statKeys } from '@/lib/builderForm';
import {
  applyStatModifiers,
  BattleWeather,
  calculateEffectiveStats,
  getNatureEffect,
  getStatModifiers,
} from '@/lib/domain/battle';

import type {
  AbilityCatalogEntry,
  IssueGetter,
  ItemCatalogEntry,
  Update,
} from "@/components/team/editor/types";
import type { MemberRoleRecommendation } from "@/lib/domain/roleAnalysis";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import type { EditableMember } from "@/lib/builderStore";

const editorSectionTitleClassName = "display-face text-sm text-accent";
const editorSectionHeaderRowClassName = "flex flex-wrap items-center justify-between gap-3";
const editorSpreadRowClassName =
  "mt-3 flex flex-nowrap items-center justify-between gap-1 lg:flex-col lg:gap-2";

function clampEvValue(
  currentEvs: EditableMember["evs"],
  key: (typeof statKeys)[number],
  next: number,
) {
  const clampedNext = Math.max(0, Math.min(252, next));
  const otherTotal = statKeys.reduce(
    (sum, statKey) =>
      sum + (statKey === key ? 0 : Number(currentEvs[statKey] ?? 0)),
    0,
  );
  return Math.max(0, Math.min(clampedNext, 510 - otherTotal));
}

export function StatsSection({
  member,
  resolved,
  roleRecommendation,
  currentLevel,
  currentNature,
  currentAbility,
  currentItem,
  weather,
  abilityCatalog,
  itemCatalog,
  hasEvolution,
  getIssue,
  updateEditorMember,
}: {
  member: EditableMember;
  resolved?: ResolvedTeamMember;
  roleRecommendation?: MemberRoleRecommendation;
  currentLevel: number;
  currentNature: string;
  currentAbility: string;
  currentItem: string;
  weather: BattleWeather;
  abilityCatalog: AbilityCatalogEntry[];
  itemCatalog: ItemCatalogEntry[];
  hasEvolution: boolean;
  getIssue: IssueGetter;
  updateEditorMember: Update;
}) {
  const totalEvs = statKeys.reduce(
    (sum, key) => sum + Number(member.evs?.[key] ?? 0),
    0,
  );
  const evError = getIssue("evs");
  const previewIvs = member.ivs as Partial<EditableMember["ivs"]>;
  const previewEvs = member.evs as Partial<EditableMember["evs"]>;
  const previewAbilityDetails =
    abilityCatalog.find((entry) => entry.name === currentAbility) ??
    resolved?.abilityDetails ??
    null;
  const previewItemDetails =
    itemCatalog.find((entry) => entry.name === currentItem) ??
    resolved?.itemDetails ??
    null;
  const previewNatureEffect = getNatureEffect(currentNature);
  const previewStatModifiers = useMemo(
    () =>
      getStatModifiers({
        itemName: currentItem,
        itemEffect: previewItemDetails?.effect,
        abilityName: currentAbility,
        abilityEffect: previewAbilityDetails?.effect,
        canEvolve: hasEvolution,
        weather,
        resolvedTypes: resolved?.resolvedTypes,
      }),
    [
      currentAbility,
      currentItem,
      hasEvolution,
      previewAbilityDetails?.effect,
      previewItemDetails?.effect,
      resolved?.resolvedTypes,
      weather,
    ],
  );
  const previewEffectiveStats = useMemo(() => {
    if (!resolved?.resolvedStats) {
      return undefined;
    }
    return applyStatModifiers(
      calculateEffectiveStats(
        resolved.resolvedStats,
        currentLevel,
        currentNature,
        previewIvs,
        previewEvs,
      ),
      previewStatModifiers,
    );
  }, [
    currentLevel,
    currentNature,
    previewEvs,
    previewIvs,
    previewStatModifiers,
    resolved?.resolvedStats,
  ]);
  const previewSummaryStats = useMemo(() => {
    if (!resolved?.resolvedStats) {
      return undefined;
    }
    return buildSummaryStats(
      resolved.resolvedStats,
      previewNatureEffect,
      previewStatModifiers,
    );
  }, [previewNatureEffect, previewStatModifiers, resolved?.resolvedStats]);
  return (
    <section className="flex flex-col gap-3">
      <div className={editorSectionHeaderRowClassName}>
        <p className={editorSectionTitleClassName}>Perfil del slot</p>
        {resolved?.resolvedStats ? (
          <MiniPill>BST {resolved.resolvedStats.bst}</MiniPill>
        ) : null}
      </div>
      <div className="grid gap-3 lg:grid-cols-4 lg:items-start">
        <div className="lg:self-center">
          <p className={editorSectionTitleClassName}>IV 0-31</p>
          <div className={editorSpreadRowClassName}>
            {statKeys.map((key) => (
              <SpreadInput
                key={`iv-${key}`}
                label={key.toUpperCase()}
                value={Number(member.ivs[key])}
                max={31}
                orientation="responsive"
                onChange={(next) =>
                  updateEditorMember((current) => ({
                    ...current,
                    ivs: {
                      ...current.ivs,
                      [key]: Math.max(0, Math.min(31, next)),
                    },
                  }))
                }
                error={getIssue(`ivs.${key}`)}
              />
            ))}
          </div>
        </div>
        <div className="min-w-0 lg:col-span-2 lg:self-center">
          {previewEffectiveStats && resolved?.resolvedStats ? (
            <EffectiveStatsRadar
              effectiveStats={previewEffectiveStats}
              baseStats={resolved.resolvedStats}
              level={currentLevel}
              nature={currentNature}
              ivs={previewIvs}
              evs={previewEvs}
              statModifiers={previewStatModifiers}
              natureEffect={previewNatureEffect}
            />
          ) : (
            <p className="text-sm text-muted">
              Completa una especie válida para ver el cálculo.
            </p>
          )}
          {resolved?.statModifiers?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {resolved.statModifiers.map((modifier) => (
                <MetaBadge
                  key={`stat-mod-${modifier.source}-${modifier.stat}-${modifier.label}`}
                  label={`${modifier.source}: ${modifier.label}`}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="lg:self-center">
          <p className={editorSectionTitleClassName}>EV {totalEvs}/510</p>
          {evError ? (
            <p className="mt-3 text-sm text-danger">{evError}</p>
          ) : null}
          <div className={editorSpreadRowClassName}>
            {statKeys.map((key) => (
              <SpreadInput
                key={`ev-${key}`}
                label={key.toUpperCase()}
                value={Number(member.evs[key])}
                max={252}
                orientation="responsive"
                onChange={(next) =>
                  updateEditorMember((current) => ({
                    ...current,
                    evs: {
                      ...current.evs,
                      [key]: clampEvValue(current.evs, key, next),
                    },
                  }))
                }
                error={getIssue(`evs.${key}`)}
              />
            ))}
          </div>
        </div>
      </div>
      <div>
        {previewEffectiveStats && resolved?.resolvedStats ? (
          <div className="grid gap-3 pb-4 lg:grid-cols-2 justify-items-stretch lg:items-center">
            <div className="flex justify-center">
              {roleRecommendation ? (
                <RoleAxesCard role={roleRecommendation} />
              ) : null}
            </div>
            <div className="space-y-2">
              <StatBar
                label="HP"
                value={previewSummaryStats?.hp ?? resolved.resolvedStats.hp}
                max={160}
              />
              <StatBar
                label="Atk"
                value={previewSummaryStats?.atk ?? resolved.resolvedStats.atk}
                max={160}
              />
              <StatBar
                label="Def"
                value={previewSummaryStats?.def ?? resolved.resolvedStats.def}
                max={160}
              />
              <StatBar
                label="SpA"
                value={previewSummaryStats?.spa ?? resolved.resolvedStats.spa}
                max={160}
              />
              <StatBar
                label="SpD"
                value={previewSummaryStats?.spd ?? resolved.resolvedStats.spd}
                max={160}
              />
              <StatBar
                label="Spe"
                value={previewSummaryStats?.spe ?? resolved.resolvedStats.spe}
                max={160}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
