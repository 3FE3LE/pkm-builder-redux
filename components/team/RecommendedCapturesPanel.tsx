"use client";

import clsx from "clsx";
import { ArrowRightLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import type { SwapOpportunity } from "@/lib/domain/swapOpportunities";
import type { RunEncounterDefinition } from "@/lib/runEncounters";

export function RecommendedCapturesPanel({
  swapOpportunities,
  copilotSupportsRecommendations,
  nextEncounter,
}: {
  swapOpportunities: SwapOpportunity[];
  copilotSupportsRecommendations: boolean;
  nextEncounter: RunEncounterDefinition | null;
}) {
  return (
    <div className="rounded-[1rem] p-6">
      <p className="display-face text-sm text-accent">Suggested Swaps</p>
      <p className="mt-2 text-sm text-muted">
        Cambios de slot calculados desde fuentes reales del tramo actual y medidos contra el siguiente combate.
      </p>
      <div className="mt-5 grid gap-4">
        {!copilotSupportsRecommendations ? (
          <p className="rounded-[0.75rem] border border-line px-4 py-3 text-sm text-muted">
            {nextEncounter
              ? `Tu run ya va por ${nextEncounter.label}. Aun falta extender fuentes de captura para esta zona del juego.`
              : "No hay rutas de pivot soportadas para este punto del run."}
          </p>
        ) : swapOpportunities.length ? (
          <AnimatePresence mode="popLayout">
            {swapOpportunities.map((opportunity) => (
              <SuggestedSwapCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </AnimatePresence>
        ) : (
          <p className="rounded-[0.75rem] border border-line px-4 py-3 text-sm text-muted">
            No hay un swap claro para este checkpoint con las fuentes disponibles del tramo.
          </p>
        )}
      </div>
    </div>
  );
}

function SuggestedSwapCard({ opportunity }: { opportunity: SwapOpportunity }) {
  const currentStats = opportunity.currentMember.summaryStats ?? opportunity.currentMember.resolvedStats;
  const candidateStats = opportunity.candidateMember.summaryStats ?? opportunity.candidateMember.resolvedStats;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="surface-panel-accent rounded-[1rem] border border-accent-line-faint p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="display-face text-base text-accent">
            {opportunity.replacedSpecies} to {opportunity.candidateSpecies}
          </p>
          <p className="mt-1 text-sm text-muted">
            {opportunity.source} {opportunity.area ? `· ${opportunity.area}` : ""}
          </p>
        </div>
        <div className="accent-badge rounded-[0.7rem] px-3 py-2 text-right">
          <p className="display-face text-sm text-accent-soft">-{opportunity.riskDelta.toFixed(1)} risk</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">score +{opportunity.scoreDelta.toFixed(1)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] xl:items-stretch">
        <SwapSide
          tone="current"
          title="Sale"
          species={opportunity.replacedSpecies}
          role={opportunity.replacedRole}
          types={opportunity.currentMember.resolvedTypes}
          bst={opportunity.currentMember.resolvedStats?.bst}
          speed={currentStats?.spe}
        />
        <div className="flex items-center justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-3">
            <ArrowRightLeft className="h-5 w-5 text-accent" />
          </div>
        </div>
        <SwapSide
          tone="incoming"
          title="Entra"
          species={opportunity.candidateSpecies}
          role={opportunity.candidateRole}
          types={opportunity.candidateMember.resolvedTypes}
          bst={opportunity.candidateMember.resolvedStats?.bst}
          speed={candidateStats?.spe}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <DeltaChip label="Off" value={opportunity.offenseDelta} />
        <DeltaChip label="Def" value={opportunity.defenseDelta} />
        <DeltaChip label="Spe" value={opportunity.speedDelta} />
        <DeltaChip label="Roles" value={opportunity.rolesDelta} />
        <DeltaChip label="Cons" value={opportunity.consistencyDelta} />
      </div>

      {opportunity.attackUpsides.length ? (
        <div className="mt-4">
          <p className="display-face text-[11px] tracking-[0.14em] text-accent">Pressure</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {opportunity.attackUpsides.map((type) => (
              <TypeBadge key={`${opportunity.id}-attack-${type}`} type={type} emphasis="positive" />
            ))}
          </div>
        </div>
      ) : null}

      {opportunity.defenseUpsides.length ? (
        <div className="mt-4">
          <p className="display-face text-[11px] tracking-[0.14em] text-accent">Safer Into</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {opportunity.defenseUpsides.map((type) => (
              <TypeBadge key={`${opportunity.id}-defense-${type}`} type={type} emphasis="positive" />
            ))}
          </div>
        </div>
      ) : null}

      {opportunity.projectedMoves.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {opportunity.projectedMoves.map((move) => (
            <span
              key={`${opportunity.id}-${move}`}
              className="rounded-[6px] border border-line bg-surface-3 px-3 py-1 text-xs text-muted"
            >
              {move}
            </span>
          ))}
        </div>
      ) : null}
    </motion.article>
  );
}

function SwapSide({
  tone,
  title,
  species,
  role,
  types,
  bst,
  speed,
}: {
  tone: "current" | "incoming";
  title: string;
  species: string;
  role?: string;
  types: string[];
  bst?: number;
  speed?: number;
}) {
  return (
    <div
      className={clsx(
        "rounded-[0.9rem] border p-4",
        tone === "incoming"
          ? "incoming-panel"
          : "border-line bg-surface-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="display-face text-[11px] tracking-[0.14em] text-muted">{title}</p>
          <p className="display-face mt-1 text-base">{species}</p>
          {role ? (
            <p className="mt-1 text-xs text-muted">{role}</p>
          ) : null}
        </div>
        <PokemonSprite species={species} size="default" chrome="plain" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {types.map((type) => (
          <TypeBadge key={`${title}-${species}-${type}`} type={type} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <CompactStat label="BST" value={bst} />
        <CompactStat label="Spe" value={speed} />
      </div>
    </div>
  );
}

function CompactStat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="surface-panel-dark-soft rounded-[0.65rem] border border-line px-3 py-2">
      <p className="display-face text-[10px] tracking-[0.12em] text-muted">{label}</p>
      <p className="display-face mt-1 text-sm text-text">{value ?? "-"}</p>
    </div>
  );
}

function DeltaChip({ label, value }: { label: string; value: number }) {
  return (
    <span
      className={clsx(
        "rounded-[6px] border px-2.5 py-1 text-[11px]",
        value >= 4
          ? "border-accent-line bg-accent-fill-strong text-accent-soft"
          : value > 0
            ? "border-info-line bg-info-fill text-info-soft"
            : "border-line bg-surface-3 text-muted",
      )}
    >
      {label} {value >= 0 ? "+" : ""}
      {value.toFixed(1)}
    </span>
  );
}
