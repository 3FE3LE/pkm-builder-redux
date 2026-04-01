"use client";

import { TypeBadge } from "@/components/BuilderShared";
import { MiniPill } from "@/components/team/UI";

import type { RankedRoster } from "@/components/team/tools/type-tiers/types";

export function RosterTypingCard({
  rankedRoster,
}: {
  rankedRoster: RankedRoster;
}) {
  return (
    <div className="rounded-[1rem] border border-line bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="display-face text-sm text-accent">Ranking del roster</p>
          <p className="mt-1 text-sm text-muted">
            Lectura tipada del equipo actual. No usa moveset; solo la combinación de tipos de cada slot.
          </p>
        </div>
        <MiniPill>{rankedRoster.length} slots</MiniPill>
      </div>
      <div className="mt-4 space-y-2">
        {rankedRoster.length ? (
          rankedRoster.map((member, index) => (
            <div key={member.memberId} className="rounded-[0.8rem] border border-line bg-surface-3 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="display-face text-xs text-accent">
                    #{index + 1} · {member.label}
                  </p>
                  <p className="mt-1 text-xs text-muted">{member.species}</p>
                </div>
                <MiniPill>{member.overallScore}/100</MiniPill>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {member.types.map((type) => (
                  <TypeBadge key={`${member.memberId}-${type}`} type={type} />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Ofensiva {member.offense.score}/100 · Defensa {member.defense.score}/100
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">Carga especies válidas en el roster para rankear sus typings.</p>
        )}
      </div>
    </div>
  );
}
