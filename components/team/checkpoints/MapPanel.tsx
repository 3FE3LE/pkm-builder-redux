"use client";

import { AreaSourceCard, type AreaSource } from "@/components/team/UI";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

export function MapPanel({
  activeMember,
  sourceCards,
  speciesCatalog,
  itemCatalog,
}: {
  activeMember?: ResolvedTeamMember;
  sourceCards: AreaSource[];
  speciesCatalog: { name: string; dex: number }[];
  itemCatalog: { name: string; effect?: string; sprite?: string | null }[];
}) {
  const visibleSources = sourceCards.filter(
    (source) =>
      source.encounters.length ||
      source.gifts.length ||
      source.trades.length ||
      source.items.length,
  );

  return (
    <div className="min-w-0 overflow-x-hidden px-1 py-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="display-face text-sm text-accent">Locations</p>
        </div>
      </div>
      <div className="scrollbar-thin mt-3 max-h-[34rem] space-y-2.5 overflow-y-auto overflow-x-hidden">
        {visibleSources.length ? (
          visibleSources.map((source) => (
            <AreaSourceCard
              key={source.area}
              source={source}
              activeSpecies={activeMember?.species}
              speciesCatalog={speciesCatalog}
              itemCatalog={itemCatalog}
            />
          ))
        ) : (
          <div className="px-1 py-1 text-sm text-muted">
            No hay fuentes registradas para este checkpoint en el dataset actual.
          </div>
        )}
      </div>
    </div>
  );
}
