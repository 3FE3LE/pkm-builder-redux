"use client";

import { buildSummaryStats } from "@/components/team/shared/StatRadar";
import { reconcileAbilitySelection } from "@/lib/domain/abilities";
import {
  applyStatModifiers,
  buildDefensiveSummary,
  calculateEffectiveStats,
  getNatureEffect,
  getStatModifiers,
  type BattleWeather,
} from "@/lib/domain/battle";
import type { EditableMember } from "@/lib/builderStore";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

import type { AbilityCatalogEntry, ItemCatalogEntry } from "./types";

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

export { reconcileAbilitySelection };
