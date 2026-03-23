"use client";

import { TypeBadge } from "@/components/BuilderShared";
import { CoverageBadge, StatBar } from "@/components/team/UI";
import clsx from "clsx";

type CoverageEntry = {
  defenseType: string;
  bucket: "x0" | "x0.25" | "x0.5" | "x1" | "x2" | "x4";
};

type DefensiveSections = ReturnType<typeof import("@/lib/teamAnalysis").buildDefensiveSections>;

export function TeamAverageStatsPanel({
  averageStats,
}: {
  averageStats: ReturnType<typeof import("@/lib/teamAnalysis").buildAverageStats> | null;
}) {
  return (
    <div className="rounded-[1rem] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="display-face text-sm text-accent">Promedio del equipo</p>
        {averageStats ? (
          <span className="display-face text-xs text-muted">
            BST promedio <span className="ml-2 text-accent">{averageStats.bst}</span>
          </span>
        ) : null}
      </div>
      {averageStats ? (
        <div className="mt-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <StatBar label="HP promedio" value={averageStats.hp} />
            <StatBar label="Atk promedio" value={averageStats.atk} />
            <StatBar label="Def promedio" value={averageStats.def} />
            <StatBar label="SpA promedio" value={averageStats.spa} />
            <StatBar label="SpD promedio" value={averageStats.spd} />
            <StatBar label="Spe promedio" value={averageStats.spe} />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Completa especies válidas para calcular promedios.
        </p>
      )}
    </div>
  );
}

export function CoveragePanel({
  coveredCoverage,
  uncoveredCoverage,
}: {
  coveredCoverage: CoverageEntry[];
  uncoveredCoverage: CoverageEntry[];
}) {
  return (
    <div className="rounded-[1rem] p-3 sm:p-4">
      <p className="display-face text-sm text-accent">Cobertura ofensiva</p>
      <p className="mt-1 text-sm text-muted">
        El label se calcula con el mejor multiplicador que tu moveset actual consigue contra cada tipo.
      </p>
      <div className="mt-3 space-y-3">
        <CompactBadgeRow
          title="Cubiertos"
          emptyLabel="Todavía no hay cobertura super efectiva clara."
          items={coveredCoverage.map((entry) => (
            <CoverageBadge
              key={entry.defenseType}
              type={entry.defenseType}
              label={entry.defenseType}
              bucket={entry.bucket}
            />
          ))}
        />
        <CompactBadgeRow
          title="Sin cubrir"
          items={uncoveredCoverage.map((entry) => (
            <CoverageBadge
              key={entry.defenseType}
              type={entry.defenseType}
              label={entry.defenseType}
              bucket={entry.bucket}
              compact
            />
          ))}
        />
      </div>
    </div>
  );
}

export function DefensiveThreatsPanel({
  defensiveSections,
}: {
  defensiveSections: DefensiveSections;
}) {
  const weakItems = defensiveSections.netWeak;
  const resistItems = defensiveSections.netResist;

  return (
    <div className="rounded-[1rem] p-3 sm:p-4">
      <p className="display-face text-sm text-accent">Amenazas defensivas</p>
      <p className="mt-1 text-sm text-muted">
        Balance neto por tipo: resistencias menos debilidades. Si el resultado queda en cero, ese tipo se omite por estar compensado.
      </p>
      <div className="mt-3 space-y-3">
        <CompactBadgeRow
          title="Debil"
          emptyLabel="No aparece una amenaza defensiva clara por tipos en el equipo actual."
          items={weakItems.map((item) => (
            <TypeBadge
              key={item.attackType}
              type={item.attackType}
              emphasis={item.severe ? "danger" : "normal"}
              trailing={item.count}
            />
          ))}
        />
        <CompactBadgeRow
          title="Resiste"
          emptyLabel="Todavía no aparece una defensa tipada clara."
          items={resistItems.map((item) => (
            <TypeBadge
              key={item.attackType}
              type={item.attackType}
              emphasis="positive"
              trailing={item.count}
            />
          ))}
        />
      </div>
    </div>
  );
}

function StatMicroCard({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: number;
  wide?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-[0.75rem] border border-line bg-surface-2 px-3 py-2",
        wide && "sm:col-span-2 xl:col-span-3"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="display-face text-[10px] text-muted">{label}</span>
        <span className="display-face text-base text-accent">{value}</span>
      </div>
    </div>
  );
}

function CompactBadgeRow({
  title,
  items,
  emptyLabel = "Sin datos.",
}: {
  title: string;
  items: React.ReactNode[];
  emptyLabel?: string;
}) {
  return (
    <div>
      <p className="display-face mb-2 text-[11px] text-accent">{title}</p>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {items.length ? items : <span className="col-span-2 text-sm text-muted">{emptyLabel}</span>}
      </div>
    </div>
  );
}
