import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

export type SpeciesCatalogEntry = {
  name: string;
  slug: string;
  dex: number;
  types: string[];
};

export type RankedRoster = ReturnType<
  typeof import("@/lib/domain/typeTierList").rankRosterByTyping
>;

export type TypeTierMetric = "offense" | "defense";

export type TypeTierSectionProps = {
  resolvedTeam: ResolvedTeamMember[];
  speciesCatalog: SpeciesCatalogEntry[];
};
