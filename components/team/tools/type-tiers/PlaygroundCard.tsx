"use client";

import { useMemo, useState } from "react";

import { FilterCombobox, TypeBadge } from "@/components/BuilderShared";
import { TYPE_ORDER, getMultiplierBucket, getMultiplierLabel } from "@/lib/domain/typeChart";
import { buildTypeCoverageSummary } from "@/lib/domain/typeTierList";

const playgroundPanelClassName = "rounded-2xl border border-line bg-surface-2 p-4";
const playgroundCardClassName = "surface-card p-3";
const playgroundFieldClassName = "space-y-1.5";
const playgroundFieldLabelClassName = "display-face text-xs text-muted";
const playgroundMetricCardClassName = "token-card px-3 py-2";

export function PlaygroundCard() {
  const [attackerType, setAttackerType] = useState<(typeof TYPE_ORDER)[number]>("Electric");
  const [defenderType1, setDefenderType1] = useState<(typeof TYPE_ORDER)[number]>("Water");
  const [defenderType2, setDefenderType2] = useState<"" | (typeof TYPE_ORDER)[number]>("Flying");

  const defenderTypes = useMemo(
    () => [defenderType1, defenderType2].filter(Boolean) as (typeof TYPE_ORDER)[number][],
    [defenderType1, defenderType2],
  );
  const summary = useMemo(
    () => buildTypeCoverageSummary(attackerType, defenderTypes),
    [attackerType, defenderTypes],
  );
  const multiplierBucket = getMultiplierBucket(summary.multiplier);

  return (
    <div className={playgroundPanelClassName}>
      <div>
        <p className="display-face text-sm text-accent">Typing playground</p>
        <p className="mt-1 text-sm text-muted">
          Sandbox rápido para probar matchups y leer coverage por tipo atacante.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <TypeSelect
          label="Tipo atacante"
          value={attackerType}
          onChange={(value) => setAttackerType(value as (typeof TYPE_ORDER)[number])}
          options={TYPE_ORDER}
        />
        <TypeSelect
          label="Defensor 1"
          value={defenderType1}
          onChange={(value) => setDefenderType1(value as (typeof TYPE_ORDER)[number])}
          options={TYPE_ORDER}
        />
        <TypeSelect
          label="Defensor 2"
          value={defenderType2}
          onChange={(value) => setDefenderType2(value as "" | (typeof TYPE_ORDER)[number])}
          options={["", ...TYPE_ORDER]}
          emptyLabel="Sin segundo tipo"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className={playgroundCardClassName}>
          <p className="display-face text-xs text-accent">Effectiveness</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TypeBadge type={attackerType} />
            <span className="text-sm text-muted">vs</span>
            {defenderTypes.map((type) => (
              <TypeBadge key={`defender-${type}`} type={type} />
            ))}
          </div>
          <p className="display-face mt-4 text-3xl text-text">x{summary.multiplier}</p>
          <p className="mt-1 text-sm text-muted">{getMultiplierLabel(multiplierBucket)}</p>
        </div>

        <div className={playgroundCardClassName}>
          <p className="display-face text-xs text-accent">Coverage</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <CoverageStat label="SE combos" value={String(summary.superEffectiveTargets)} />
            <CoverageStat label="Neutral" value={String(summary.neutralTargets)} />
            <CoverageStat label="Resisted" value={String(summary.resistedTargets)} />
            <CoverageStat label="Immunes" value={String(summary.immuneTargets)} />
          </div>

          <div className="mt-4">
            <p className="display-face text-xs text-accent">Best targets</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.bestTargets.map((target) => (
                <span
                  key={`${attackerType}-${target.id}`}
                  className="token-card inline-flex items-center gap-2 px-2.5 py-1.5 text-xs text-text"
                >
                  <span>{target.label}</span>
                  <span className="text-accent-soft">x{target.multiplier}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeSelect({
  label,
  value,
  onChange,
  options,
  emptyLabel = "Any",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  emptyLabel?: string;
}) {
  return (
    <div className={playgroundFieldClassName}>
      <p className={playgroundFieldLabelClassName}>{label}</p>
      <FilterCombobox
        value={value}
        options={options}
        searchable={false}
        placeholder={emptyLabel}
        onChange={onChange}
        renderOption={(option, selected) =>
          option ? (
            <div className="flex w-full items-center justify-between gap-3">
              <TypeBadge type={option} />
              {selected ? <span className="display-face text-[0.65rem] uppercase tracking-ui-wide text-accent">Active</span> : null}
            </div>
          ) : (
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-sm text-text">{emptyLabel}</span>
              {selected ? <span className="display-face text-[0.65rem] uppercase tracking-ui-wide text-accent">Active</span> : null}
            </div>
          )
        }
      />
    </div>
  );
}

function CoverageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={playgroundMetricCardClassName}>
      <p className="display-face text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm text-text">{value}</p>
    </div>
  );
}
