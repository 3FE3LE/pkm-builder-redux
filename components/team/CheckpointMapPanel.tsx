"use client";

import { AreaSourceCard, type AreaSource } from "@/components/team/UI";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

export function CheckpointMapPanel({
  activeMember,
  sourceCards,
}: {
  activeMember?: ResolvedTeamMember;
  sourceCards: AreaSource[];
}) {
  return (
    <div className="px-1 py-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="display-face text-sm text-accent">Mapa del checkpoint</p>
          <p className="mt-2 text-sm text-muted">
            Fuentes locales sacadas de `wild`, `gift`, `trade` e `item locations` para este tramo.
          </p>
        </div>
        <div className="rounded-[6px] border border-line px-4 py-2 text-xs text-muted">
          {activeMember?.species ? `slot activo: ${activeMember.species}` : "sin slot activo"}
        </div>
      </div>
      <div className="scrollbar-thin mt-4 max-h-[34rem] space-y-3 overflow-auto">
        {sourceCards.length ? (
          sourceCards.map((source) => (
            <AreaSourceCard
              key={source.area}
              source={source}
              activeSpecies={activeMember?.species}
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
