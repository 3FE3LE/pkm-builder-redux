"use client";

import clsx from "clsx";
import { ArrowRightLeft } from "lucide-react";
import { motion } from "motion/react";

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import type { SwapOpportunity } from "@/lib/domain/swapOpportunities";

const recommendationSwapHeaderRowClassName = "flex flex-wrap items-start justify-between gap-3";
const recommendationSwapSummaryClassName = "token-card px-3 py-2 text-right";
const recommendationScoreDeltaClassName = "display-face micro-label-wide text-muted";
const recommendationSwapSideTitleClassName = "display-face micro-copy text-muted";
const recommendationCompactStatLabelClassName = "display-face micro-label text-muted";
const recommendationSwapOutgoingCardClassName = "panel-card border-line bg-surface-2";
const recommendationStatCardClassName = "token-card px-3 py-2";

export function SuggestedSwapCard({ opportunity }: { opportunity: SwapOpportunity }) {
  const currentStats = opportunity.currentMember.summaryStats ?? opportunity.currentMember.resolvedStats;
  const candidateStats = opportunity.candidateMember.summaryStats ?? opportunity.candidateMember.resolvedStats;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="panel-card"
    >
      <div className={recommendationSwapHeaderRowClassName}>
        <div>
          <p className="display-face text-sm text-accent">
            {opportunity.replacedSpecies} to {opportunity.candidateSpecies}
          </p>
          <p className="mt-1 text-xs text-muted">
            {opportunity.source} {opportunity.area ? `· ${opportunity.area}` : ""}
          </p>
        </div>
        <div className={recommendationSwapSummaryClassName}>
          <p className="display-face text-sm text-accent-soft">-{opportunity.riskDelta.toFixed(1)} risk</p>
          <p className={recommendationScoreDeltaClassName}>score +{opportunity.scoreDelta.toFixed(1)}</p>
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
    <div className={clsx("panel-card", tone === "incoming" ? "incoming-panel" : recommendationSwapOutgoingCardClassName)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={recommendationSwapSideTitleClassName}>{title}</p>
          <p className="display-face mt-1 text-sm">{species}</p>
          {role ? <p className="mt-1 text-xs text-muted">{role}</p> : null}
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
    <div className={recommendationStatCardClassName}>
      <p className={recommendationCompactStatLabelClassName}>{label}</p>
      <p className="display-face mt-1 text-sm text-text">{value ?? "-"}</p>
    </div>
  );
}
