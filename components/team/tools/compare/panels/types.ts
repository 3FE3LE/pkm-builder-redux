"use client";

import type { BattleWeather } from "@/lib/domain/battle";
import type { EditableMember } from "@/lib/builderStore";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

export type SpeciesCatalogEntry = {
  name: string;
  slug: string;
  dex: number;
  types: string[];
};

export type AbilityCatalogEntry = { name: string; effect?: string };

export type ItemCatalogEntry = {
  name: string;
  category?: string;
  effect?: string;
  sprite?: string | null;
};

export type BuildStateInput = {
  member: EditableMember;
  resolved: ResolvedTeamMember | undefined;
  abilityCatalog: AbilityCatalogEntry[];
  heldItemCatalog: ItemCatalogEntry[];
  weather: BattleWeather;
};
