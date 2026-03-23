"use client";

import clsx from "clsx";
import { motion } from "motion/react";

import { normalizeName } from "@/lib/domain/names";
import type { TeamMember } from "@/lib/builder";
type DecisionDelta = ReturnType<typeof import("@/lib/domain/decisionDelta").buildDecisionDeltas>[number];

export type AreaSource = {
  area: string;
  encounters: string[];
  gifts: string[];
  trades: string[];
  items: string[];
};

export function RecommendedCard({
  member,
  delta,
}: {
  member: TeamMember;
  delta?: DecisionDelta;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="panel rounded-3xl p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="display-face text-lg">{member.species}</p>
          <p className="mt-1 text-sm text-muted">{member.reason}</p>
        </div>
        <span className="accent-chip rounded-[6px] px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
          {member.source}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
        <span className="rounded-[6px] border border-accent-line bg-accent-fill px-3 py-1 text-accent-soft">
          {member.roleLabel}
        </span>
        <span className="rounded-[6px] border border-line px-3 py-1">{member.role}</span>
        {member.area ? (
          <span className="rounded-[6px] border border-line px-3 py-1">
            {member.area}
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-xs text-muted">{member.teamFitNote}</p>
        <p className="text-xs text-muted">{member.roleReason}</p>
      </div>
      {delta ? (
        <div className="mt-4 rounded-[0.85rem] border border-accent-line-soft bg-accent-fill-soft p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="display-face text-xs text-accent">
                {delta.action === "add"
                  ? "Mejor como slot nuevo"
                  : delta.action === "skip"
                    ? "No hay slot elegible"
                  : delta.replacedSlot
                    ? `Mejor si reemplaza a ${delta.replacedSlot}`
                    : "Impacto estimado"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {delta.action === "skip"
                  ? "Todos los slots candidatos estan locked o fuera de regla."
                  : delta.riskDelta >= 0
                  ? `Risk ${formatSigned(-delta.riskDelta)} -> ${delta.projectedRisk.toFixed(1)}/10`
                  : `Sube el riesgo ${formatSigned(Math.abs(delta.riskDelta))} si entra ahora`}
              </p>
            </div>
            <div className="rounded-[0.65rem] border border-line bg-surface-3 px-3 py-2 text-right">
              <p className={clsx("display-face text-sm", delta.scoreDelta >= 0 ? "text-accent-soft" : "text-danger-soft")}>
                {delta.action === "skip" ? "locked" : `${formatSigned(delta.scoreDelta)} score`}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={deltaChipClass(delta.offenseDelta)}>Off {formatSigned(delta.offenseDelta)}</span>
            <span className={deltaChipClass(delta.defenseDelta)}>Def {formatSigned(delta.defenseDelta)}</span>
            <span className={deltaChipClass(delta.speedDelta)}>Spe {formatSigned(delta.speedDelta)}</span>
            <span className={deltaChipClass(delta.rolesDelta)}>Rol {formatSigned(delta.rolesDelta)}</span>
            <span className={deltaChipClass(delta.consistencyDelta)}>Cons {formatSigned(delta.consistencyDelta)}</span>
          </div>
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-muted">
              Entra como <span className="text-text">{delta.roleLabel}</span>. {delta.teamFitNote}
            </p>
            <p className="text-xs text-muted">{delta.roleReason}</p>
          </div>
          {delta.gains.length ? (
            <p className="mt-3 text-xs text-muted">Gana: {delta.gains.join(" · ")}</p>
          ) : null}
          {delta.losses.length ? (
            <p className="mt-2 text-xs text-muted">Pierde: {delta.losses.join(" · ")}</p>
          ) : null}
          {delta.projectedMoves.length ? (
            <p className="mt-2 text-xs text-muted">Moves proyectados: {delta.projectedMoves.join(" / ")}</p>
          ) : null}
        </div>
      ) : null}
    </motion.article>
  );
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}

function deltaChipClass(value: number) {
  return clsx(
    "rounded-[6px] border px-2.5 py-1 text-[11px]",
    value >= 4
      ? "border-accent-line bg-accent-fill-strong text-accent-soft"
      : value <= -4
        ? "border-danger-line bg-danger-fill text-danger-soft"
        : "border-line bg-surface-3 text-muted",
  );
}

function SourceCount({
  label,
  count,
  tone = "muted",
}: {
  label: string;
  count: number;
  tone?: "accent" | "muted";
}) {
  return (
    <span
      className={clsx(
        "display-face rounded-[6px] border px-3 py-1 text-[10px] tracking-[0.14em]",
        tone === "accent"
          ? "border-accent-line-strong bg-accent-fill-strong text-accent-soft"
          : "border-line bg-surface-3 text-muted",
      )}
    >
      {label} {count}
    </span>
  );
}

function SourceList({
  title,
  entries,
  activeSpecies,
}: {
  title: string;
  entries: string[];
  activeSpecies?: string;
}) {
  const normalizedActive = normalizeName(activeSpecies ?? "");
  const filtered = entries.filter(Boolean);

  return (
    <div className="rounded-[0.75rem] border border-line bg-surface-1 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="display-face text-xs text-accent">{title}</p>
        <SourceCount label="count" count={filtered.length} />
      </div>
      <div className="flex flex-wrap gap-2">
        {filtered.length ? (
          filtered.map((entry, index) => {
            const isActiveMatch =
              normalizedActive && normalizeName(entry).includes(normalizedActive);
            return (
              <span
                key={`${title}-${index}-${entry}`}
                className={clsx(
                  "rounded-[6px] border px-3 py-1 text-xs",
                  isActiveMatch
                    ? "border-primary-line-strong bg-primary-fill-strong text-primary-soft"
                    : "border-line bg-surface-3 text-muted",
                )}
              >
                {entry}
              </span>
            );
          })
        ) : (
          <span className="text-sm text-muted">Nada registrado.</span>
        )}
      </div>
    </div>
  );
}

export function AreaSourceCard({
  source,
  activeSpecies,
}: {
  source: AreaSource;
  activeSpecies?: string;
}) {
  return (
    <article className="panel-tint-soft rounded-[0.8rem] border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="display-face text-base">{source.area}</p>
          <p className="mt-1 text-sm text-muted">
            Todo lo disponible en este checkpoint para capturar, recibir o desviar la ruta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SourceCount label="wild" count={source.encounters.length} tone="accent" />
          <SourceCount label="gift" count={source.gifts.length} />
          <SourceCount label="trade" count={source.trades.length} />
          <SourceCount label="item" count={source.items.length} />
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <SourceList title="Wild Encounters" entries={source.encounters} activeSpecies={activeSpecies} />
        <SourceList title="Gift Pokemon" entries={source.gifts} activeSpecies={activeSpecies} />
        <SourceList title="In-Game Trades" entries={source.trades} activeSpecies={activeSpecies} />
        <SourceList title="Key Items" entries={source.items} activeSpecies={activeSpecies} />
      </div>
    </article>
  );
}
