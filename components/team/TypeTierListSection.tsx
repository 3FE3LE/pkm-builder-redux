"use client";

import { useMemo } from "react";

import { TypeBadge } from "@/components/BuilderShared";
import { MiniPill } from "@/components/team/UI";
import {
  buildDefensiveTypeTierList,
  buildOffensiveTypeTierList,
  rankRosterByTyping,
} from "@/lib/domain/typeTierList";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

export function TypeTierListSection({
  resolvedTeam,
}: {
  resolvedTeam: ResolvedTeamMember[];
}) {
  const offensiveTierList = useMemo(() => buildOffensiveTypeTierList().slice(0, 12), []);
  const defensiveTierList = useMemo(() => buildDefensiveTypeTierList().slice(0, 12), []);
  const rankedRoster = useMemo(
    () =>
      rankRosterByTyping(
        resolvedTeam.map((member) => ({
          key: member.key,
          species: member.species,
          nickname: member.species,
          resolvedTypes: member.resolvedTypes,
        })),
      ),
    [resolvedTeam],
  );

  return (
    <section className="space-y-4">
      <div>
        <p className="display-face text-sm text-accent">Type Tiers</p>
        <h1 className="pixel-face mt-2 text-2xl text-text">Ofensiva, defensa y ranking del roster</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Ranking local construido desde la type chart del proyecto. Ambas lecturas se normalizan a score 0-100: ofensiva mide qué tan bien una combinación de STAB presiona el pool de typings; defensa mide resistencias, inmunidades y castigo por debilidades.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,0.9fr)]">
        <TierCard
          title="Top cobertura ofensiva"
          subtitle="Mejores combinaciones de tipos para presionar el mayor número de typings rivales."
          entries={offensiveTierList}
          valueLabel="0-100"
        />
        <TierCard
          title="Top aguante defensivo"
          subtitle="Mejores combinaciones de tipos para absorber daño, sumar resistencias e inmunidades."
          entries={defensiveTierList}
          valueLabel="0-100"
        />
        <RosterTypingCard rankedRoster={rankedRoster} />
      </div>
    </section>
  );
}

function TierCard({
  title,
  subtitle,
  entries,
  valueLabel,
}: {
  title: string;
  subtitle: string;
  entries: ReturnType<typeof buildOffensiveTypeTierList>;
  valueLabel: string;
}) {
  return (
    <div className="rounded-[1rem] border border-line bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="display-face text-sm text-accent">{title}</p>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <MiniPill>Top 12</MiniPill>
      </div>
      <div className="mt-4 space-y-2">
        {entries.map((entry) => (
          <div key={entry.combo.id} className="rounded-[0.8rem] border border-line bg-surface-3 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="display-face text-xs text-accent">
                  #{entry.rank} · tier {entry.tier}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {entry.combo.types.map((type) => (
                    <TypeBadge key={`${entry.combo.id}-${type}`} type={type} />
                  ))}
                </div>
              </div>
              <MiniPill>{valueLabel} {entry.score}</MiniPill>
            </div>
            <p className="mt-2 text-xs text-muted">
              raw {entry.rawScore} ·
              {" "}
              x4 {entry.breakdown.x4} · x2 {entry.breakdown.x2} · x0 {entry.breakdown.x0}
              {" · "}
              x0.5 {entry.breakdown["x0.5"]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RosterTypingCard({
  rankedRoster,
}: {
  rankedRoster: ReturnType<typeof rankRosterByTyping>;
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
                <MiniPill>overall {member.overallScore}/100</MiniPill>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {member.types.map((type) => (
                  <TypeBadge key={`${member.memberId}-${type}`} type={type} />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Ofensiva {member.offense.score}/100 · Defensa {member.defense.score}/100
              </p>
              <p className="mt-1 text-xs text-muted">
                Rank ofensivo #{member.offense.rank} tier {member.offense.tier} · Rank defensivo #{member.defense.rank} tier {member.defense.tier}
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
