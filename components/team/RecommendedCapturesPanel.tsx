"use client";

import clsx from "clsx";
import { ArrowRightLeft, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import type { CaptureRecommendation } from "@/lib/domain/contextualRecommendations";
import type { SwapOpportunity } from "@/lib/domain/swapOpportunities";
import type { RunEncounterDefinition } from "@/lib/runEncounters";

export function RecommendedCapturesPanel({
  teamSize,
  captureRecommendations,
  swapOpportunities,
  supportsContextualSwaps,
  nextEncounter,
}: {
  teamSize: number;
  captureRecommendations: CaptureRecommendation[];
  swapOpportunities: SwapOpportunity[];
  supportsContextualSwaps: boolean;
  nextEncounter: RunEncounterDefinition | null;
}) {
  const showCaptures = teamSize < 6;
  const showSwaps = teamSize >= 5;

  return (
    <div className="rounded-[1rem] px-2 py-3 sm:px-3 sm:py-4 lg:px-4 lg:py-5">
      <p className="display-face text-sm text-accent">
        {showCaptures && showSwaps
          ? "Expandir y optimizar"
          : showSwaps
            ? "Optimizar el roster"
            : "Expandir el roster"}
      </p>
      <p className="mt-1.5 text-sm text-muted">
        {showCaptures && showSwaps
          ? "Con cinco slots, primero se miran entradas nuevas que cierren huecos y luego pivots del tramo que mejoren lo ya armado."
          : showSwaps
            ? "Con el roster completo, esta seccion ya no busca sumar miembros: solo muestra reemplazos que optimicen el siguiente combate."
            : "Mientras el equipo aun no esta lleno, esta seccion prioriza entradas nuevas que cubran carencias reales del roster."}
      </p>

      <div className="mt-4 space-y-4">
        {showCaptures ? (
          <section className="space-y-2">
            <p className="display-face px-1 text-xs text-accent">Capturas nuevas</p>
            {captureRecommendations.length ? (
              <AnimatePresence mode="popLayout">
                {captureRecommendations.map((recommendation) => (
                  <CaptureCard key={recommendation.id} recommendation={recommendation} />
                ))}
              </AnimatePresence>
            ) : (
              <p className="rounded-[0.75rem] px-2 py-2 text-sm text-muted">
                {nextEncounter
                  ? `No hay una captura nueva claramente mejor para ${nextEncounter.label} con las fuentes activas.`
                  : "No hay capturas nuevas relevantes en este punto del run."}
              </p>
            )}
          </section>
        ) : null}

        {showSwaps ? (
          <section className="space-y-2">
            <p className="display-face px-1 text-xs text-accent">Swaps del tramo</p>
            {supportsContextualSwaps && swapOpportunities.length ? (
              <AnimatePresence mode="popLayout">
                {swapOpportunities.map((opportunity) => (
                  <SuggestedSwapCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </AnimatePresence>
            ) : (
              <p className="rounded-[0.75rem] px-2 py-2 text-sm text-muted">
                No hay un swap claro para este checkpoint con las fuentes disponibles del tramo.
              </p>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function CaptureCard({ recommendation }: { recommendation: CaptureRecommendation }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-[0.9rem] border border-accent-line-faint px-3 py-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <p className="display-face text-sm text-accent">{recommendation.species}</p>
          </div>
          <p className="mt-1 text-xs text-muted">
            {recommendation.source} · {recommendation.area}
          </p>
        </div>
        <PokemonSprite
          species={recommendation.species}
          size="default"
          chrome="plain"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {recommendation.candidateMember.resolvedTypes.map((type) => (
          <TypeBadge key={`${recommendation.id}-${type}`} type={type} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-[6px] border border-line bg-surface-3 px-3 py-1 text-xs text-muted">
          rol {recommendation.role}
        </span>
        <span
          className={clsx(
            "rounded-[6px] border px-3 py-1 text-xs",
            recommendation.delta.riskDelta >= 1.5
              ? "border-accent-line bg-accent-fill-strong text-accent-soft"
              : "border-info-line bg-info-fill text-info-soft",
          )}
        >
          risk -{recommendation.delta.riskDelta.toFixed(1)}
        </span>
        <span className="rounded-[6px] border border-line bg-surface-3 px-3 py-1 text-xs text-muted">
          score +{recommendation.delta.scoreDelta.toFixed(1)}
        </span>
      </div>

      {recommendation.projectedMoves.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {recommendation.projectedMoves.map((move) => (
            <span
              key={`${recommendation.id}-${move}`}
              className="rounded-[6px] bg-surface-3 px-2.5 py-1 text-xs text-muted"
            >
              {move}
            </span>
          ))}
        </div>
      ) : null}
    </motion.article>
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
      className="rounded-[0.9rem] border border-accent-line-faint px-3 py-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="display-face text-sm text-accent">
            {opportunity.replacedSpecies} to {opportunity.candidateSpecies}
          </p>
          <p className="mt-1 text-xs text-muted">
            {opportunity.source} {opportunity.area ? `· ${opportunity.area}` : ""}
          </p>
        </div>
        <div className="rounded-[0.7rem] bg-surface-3 px-3 py-2 text-right">
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
        "rounded-[0.9rem] border px-3 py-3",
        tone === "incoming"
          ? "incoming-panel"
          : "border-line bg-surface-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="display-face text-[11px] tracking-[0.14em] text-muted">{title}</p>
          <p className="display-face mt-1 text-sm">{species}</p>
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
    <div className="rounded-[0.65rem] border border-line px-3 py-2">
      <p className="display-face text-[10px] tracking-[0.12em] text-muted">{label}</p>
      <p className="display-face mt-1 text-sm text-text">{value ?? "-"}</p>
    </div>
  );
}
