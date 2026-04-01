"use client";

import { TypeBadge } from "@/components/BuilderShared";
import { MiniPill } from "@/components/team/UI";
import { Button } from "@/components/ui/Button";
import { MetricToggle } from "@/components/team/tools/type-tiers/MetricToggle";
import type { SpeciesCatalogEntry, TypeTierMetric } from "@/components/team/tools/type-tiers/types";

type TierEntry = ReturnType<typeof import("@/lib/domain/typeTierList").buildOffensiveTypeTierList>[number];

export function TierListCard({
  metric,
  setMetric,
  showAll,
  setShowAll,
  visibleTierList,
  speciesCatalog,
}: {
  metric: TypeTierMetric;
  setMetric: (next: TypeTierMetric) => void;
  showAll: boolean;
  setShowAll: (next: boolean) => void;
  visibleTierList: TierEntry[];
  speciesCatalog: SpeciesCatalogEntry[];
}) {
  return (
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
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>
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
  );
}

function findSpeciesForTypes(speciesCatalog: SpeciesCatalogEntry[], types: string[]) {
  const normalizedTarget = types.slice().sort().join("|");
  return speciesCatalog.find((entry) => entry.types.slice().sort().join("|") === normalizedTarget) ?? null;
}
