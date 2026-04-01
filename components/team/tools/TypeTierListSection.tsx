"use client";

import { useMemo, useState } from "react";
import { Shield, Swords } from "lucide-react";

import { TypeBadge } from "@/components/BuilderShared";
import { MiniPill } from "@/components/team/UI";
import { Button } from "@/components/ui/Button";
import {
  buildDefensiveTypeTierList,
  buildOffensiveTypeTierList,
  rankRosterByTyping,
} from "@/lib/domain/typeTierList";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

type SpeciesCatalogEntry = {
  name: string;
  slug: string;
  dex: number;
  types: string[];
};

export function TypeTierListSection({
  resolvedTeam,
  speciesCatalog,
}: {
  resolvedTeam: ResolvedTeamMember[];
  speciesCatalog: SpeciesCatalogEntry[];
}) {
  const [metric, setMetric] = useState<"offense" | "defense">("offense");
  const [showAll, setShowAll] = useState(false);
  const offensiveTierList = useMemo(() => buildOffensiveTypeTierList(), []);
  const defensiveTierList = useMemo(() => buildDefensiveTypeTierList(), []);
  const activeTierList = metric === "offense" ? offensiveTierList : defensiveTierList;
  const visibleTierList = showAll ? activeTierList : activeTierList.slice(0, 10);
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
        <h1 className="pixel-face mt-2 text-2xl text-text">Typing rank y roster</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Una sola lista ordenable por ofensiva o defensa. El score va de 0 a 100 y cada combinación sugiere una especie real de la dex local cuando existe.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <div className="rounded-[1rem] border border-line bg-surface-2 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="display-face text-sm text-accent">Tier list de typings</p>
              <p className="mt-1 text-sm text-muted">
                {metric === "offense"
                  ? "Ordenada por presión ofensiva de STAB."
                  : "Ordenada por resistencias, inmunidades y castigo por debilidades."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MetricToggle metric={metric} onChange={setMetric} />
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAll((current) => !current)}>
                {showAll ? "Top 10" : "Ver toda la lista"}
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {visibleTierList.map((entry) => {
              const suggestedSpecies = findSpeciesForTypes(speciesCatalog, entry.combo.types);
              return (
                <div key={`${metric}-${entry.combo.id}`} className="rounded-[0.8rem] border border-line bg-surface-3 p-3">
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
                    <MiniPill>{entry.score}/100</MiniPill>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {metric === "offense"
                      ? `x4 ${entry.breakdown.x4} · x2 ${entry.breakdown.x2} · x0 ${entry.breakdown.x0}`
                      : `x0 ${entry.breakdown.x0} · x0.25 ${entry.breakdown["x0.25"]} · x0.5 ${entry.breakdown["x0.5"]} · x4 ${entry.breakdown.x4}`}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {suggestedSpecies ? `Ejemplo local: ${suggestedSpecies.name} (#${suggestedSpecies.dex})` : "Sin especie exacta en la dex local."}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <RosterTypingCard rankedRoster={rankedRoster} />
      </div>
    </section>
  );
}

function MetricToggle({
  metric,
  onChange,
}: {
  metric: "offense" | "defense";
  onChange: (next: "offense" | "defense") => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-[0.8rem] border border-line bg-surface-3 p-1">
      <Button
        type="button"
        variant={metric === "offense" ? "default" : "ghost"}
        size="icon-sm"
        onClick={() => onChange("offense")}
        aria-label="Orden ofensivo"
        title="Orden ofensivo"
      >
        <Swords className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={metric === "defense" ? "default" : "ghost"}
        size="icon-sm"
        onClick={() => onChange("defense")}
        aria-label="Orden defensivo"
        title="Orden defensivo"
      >
        <Shield className="h-4 w-4" />
      </Button>
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

function findSpeciesForTypes(speciesCatalog: SpeciesCatalogEntry[], types: string[]) {
  const normalizedTarget = types.slice().sort().join("|");
  return speciesCatalog.find((entry) => entry.types.slice().sort().join("|") === normalizedTarget) ?? null;
}
