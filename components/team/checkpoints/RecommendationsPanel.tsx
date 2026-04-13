"use client";

import clsx from "clsx";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  CircleSlash2,
  Gauge,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import { PokeballMark } from "@/components/team/shared/PokeballMark";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import type { EnrichedCaptureRecommendation } from "@/lib/domain/scoring/enrichRecommendations";
import type { SwapOpportunity } from "@/lib/domain/swapOpportunities";
import type { DimensionScore } from "@/lib/domain/profiles/types";
import { markNavigationStart } from "@/lib/perf";
import type { RunEncounterDefinition } from "@/lib/runEncounters";
import { getTypedSurfaceStyle } from "@/lib/ui/typeSurface";
import { useSafeTransitionTypes } from "@/lib/viewTransitions";

const recommendationSectionEyebrowClassName = "display-face px-1 micro-copy text-accent";
const recommendationTokenPillClassName = "token-card px-2.5 py-1.5 text-xs text-muted";
const recommendationEmptyStateClassName = "soft-card-dashed px-3 py-4 text-sm text-muted";
const recommendationSwapHeaderRowClassName = "flex flex-wrap items-start justify-between gap-3";
const recommendationSwapSummaryClassName = "token-card px-3 py-2 text-right";
const recommendationScoreDeltaClassName = "display-face micro-label-wide text-muted";
const recommendationSwapSideTitleClassName = "display-face micro-copy text-muted";
const recommendationCompactStatLabelClassName = "display-face micro-label text-muted";
const recommendationSwapOutgoingCardClassName = "panel-card border-line bg-surface-2";
const recommendationRiskPillClassName = "token-card px-2.5 py-1.5 text-xs";
const recommendationStatCardClassName = "token-card px-3 py-2";
const recommendationCaptureCardClassName =
  "relative overflow-hidden rounded-[1.4rem] border border-line-soft/80 px-3 py-3 shadow-[0_18px_40px_hsl(0_0%_0%_/_0.18)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary-line-emphasis hover:shadow-[0_24px_54px_hsl(0_0%_0%_/_0.24)]";
const recommendationCaptureHeaderClassName = "flex items-start gap-3";
const recommendationCaptureSpriteShellClassName =
  "relative flex h-24 items-center justify-center overflow-hidden rounded-[1.15rem] border border-white/8 bg-[linear-gradient(180deg,hsl(0_0%_100%_/_0.06),transparent_65%)]";
const recommendationCaptureBandClassName =
  "grid grid-cols-2 gap-2";
const recommendationCaptureMetricClassName =
  "rounded-[0.95rem] bg-[hsl(0_0%_0%_/_0.12)] px-2.5 py-2";
const recommendationCaptureMetricLabelClassName =
  "flex h-4 items-center justify-center text-text-faint";
const recommendationCaptureMetricValueClassName = "pixel-face mt-1 text-xs text-text";
const recommendationCaptureActionClassName =
  "group inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[hsl(0_0%_0%_/_0.18)] text-accent transition hover:border-primary-line-emphasis hover:bg-primary-fill hover:text-primary-soft";
const recommendationCaptureMobileMetricClassName =
  "rounded-[0.95rem] bg-[hsl(0_0%_0%_/_0.12)] px-2.5 py-2";
const recommendationCaptureSheetCardClassName =
  "app-soft-panel rounded-xl px-3 py-3";

export function RecommendationsPanel({
  teamSize,
  captureRecommendations,
  swapOpportunities,
  supportsContextualSwaps,
  nextEncounter,
  speciesCatalog,
  showCaptures = true,
  showSwaps = true,
  onSendToIvCalc,
  ivCalcHrefBuilder,
}: {
  teamSize: number;
  captureRecommendations: EnrichedCaptureRecommendation[];
  swapOpportunities: SwapOpportunity[];
  supportsContextualSwaps: boolean;
  nextEncounter: RunEncounterDefinition | null;
  speciesCatalog: { name: string; dex: number }[];
  showCaptures?: boolean;
  showSwaps?: boolean;
  onSendToIvCalc?: (species: string) => void;
  ivCalcHrefBuilder?: (species: string) => string;
}) {
  const shouldShowCaptures = showCaptures && teamSize < 6;
  const shouldShowSwaps = showSwaps && teamSize >= 5;
  const [activeCaptureId, setActiveCaptureId] = useState<string | null>(null);
  const dexByName = useMemo(
    () =>
      Object.fromEntries(
        speciesCatalog.map((entry) => [normalizeName(entry.name), entry.dex]),
      ) as Record<string, number>,
    [speciesCatalog],
  );
  const activeCapture = captureRecommendations.find((entry) => entry.id === activeCaptureId) ?? null;

  return (
    <>
    <div className="rounded-2xl px-2 py-3 sm:px-3 sm:py-4 lg:px-4 lg:py-5">
      <div className="space-y-4">
        {shouldShowCaptures ? (
          <section className="space-y-2">
            <p className={recommendationSectionEyebrowClassName}>Capturas nuevas</p>
            {captureRecommendations.length ? (
              <motion.div layout className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <AnimatePresence mode="popLayout">
                  {captureRecommendations.map((recommendation) => (
                    <CaptureCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      dexNumber={dexByName[normalizeName(recommendation.species)]}
                      onSendToIvCalc={onSendToIvCalc}
                      ivCalcHrefBuilder={ivCalcHrefBuilder}
                      onOpenDetails={() => setActiveCaptureId(recommendation.id)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <p className={recommendationEmptyStateClassName}>
                {nextEncounter
                  ? `No hay una captura nueva claramente mejor para ${nextEncounter.label} con las fuentes activas.`
                  : "No hay capturas nuevas relevantes en este punto del run."}
              </p>
            )}
          </section>
        ) : null}

        {shouldShowSwaps ? (
          <section className="space-y-2">
            <p className={recommendationSectionEyebrowClassName}>Swaps del tramo</p>
            {supportsContextualSwaps && swapOpportunities.length ? (
              <AnimatePresence mode="popLayout">
                {swapOpportunities.map((opportunity) => (
                  <SuggestedSwapCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </AnimatePresence>
            ) : (
              <p className={recommendationEmptyStateClassName}>
                No hay un swap claro para este checkpoint con las fuentes disponibles del tramo.
              </p>
            )}
          </section>
        ) : null}
      </div>
    </div>
    <CaptureDetailSheet
      recommendation={activeCapture}
      dexNumber={activeCapture ? dexByName[normalizeName(activeCapture.species)] : undefined}
      open={Boolean(activeCapture)}
      onOpenChange={(open) => {
        if (!open) {
          setActiveCaptureId(null);
        }
      }}
      onSendToIvCalc={onSendToIvCalc}
      ivCalcHrefBuilder={ivCalcHrefBuilder}
    />
    </>
  );
}

function CaptureCard({
  recommendation,
  dexNumber,
  onSendToIvCalc,
  ivCalcHrefBuilder,
  onOpenDetails,
}: {
  recommendation: EnrichedCaptureRecommendation;
  dexNumber?: number;
  onSendToIvCalc?: (species: string) => void;
  ivCalcHrefBuilder?: (species: string) => string;
  onOpenDetails: () => void;
}) {
  const sprites = buildSpriteUrls(recommendation.species, dexNumber);
  const ivCalcHref = ivCalcHrefBuilder?.(recommendation.species);
  const toolForwardTransition = useSafeTransitionTypes(["tool-forward"]);
  const cardStyle = getTypedSurfaceStyle(recommendation.candidateMember.resolvedTypes ?? [], {
    primaryGlowMix: 16,
    secondaryGlowMix: 14,
    primaryBodyMix: 7,
    secondaryBodyMix: 6,
  });
  const score = recommendation.score;
  const scoreLabel = score.finalScore.toFixed(0);
  const floorLabel = recommendation.profile.floorScore.toFixed(1);
  const ceilingLabel = recommendation.profile.ceilingScore.toFixed(1);
  const captureAction = ivCalcHref ? (
    <Link
      href={ivCalcHref}
      prefetch
      transitionTypes={toolForwardTransition}
      aria-label={`Mandar ${recommendation.species} al IV Calc`}
      className={recommendationCaptureActionClassName}
      onPointerDown={(event) => {
        event.stopPropagation();
        markNavigationStart("capture-recommendation-to-ivcalc", ivCalcHref);
      }}
      onClick={(event) => {
        event.stopPropagation();
        markNavigationStart("capture-recommendation-to-ivcalc", ivCalcHref);
      }}
    >
      <PokeballMark />
    </Link>
  ) : onSendToIvCalc ? (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSendToIvCalc(recommendation.species);
      }}
      aria-label={`Mandar ${recommendation.species} al IV Calc`}
      className={recommendationCaptureActionClassName}
    >
      <PokeballMark />
    </button>
  ) : null;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={clsx(recommendationCaptureCardClassName, "cursor-pointer")}
      style={cardStyle}
      onClick={onOpenDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenDetails();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,hsl(0_0%_100%_/_0.08),transparent)]" />
      {captureAction ? (
        <div className="absolute right-3 top-3 z-10 hidden md:block">
          {captureAction}
        </div>
      ) : null}
      <div className="relative flex flex-col gap-3">
        <div className={clsx(recommendationCaptureHeaderClassName, captureAction && "md:pr-12")}>
          <div className="min-w-0 flex-1">
            <p className="display-face truncate text-base text-text">{recommendation.species}</p>
            <p className="mt-1 text-xs text-muted">
              {recommendation.source} · {recommendation.area}
            </p>
          </div>
        </div>

        <div className={recommendationCaptureSpriteShellClassName}>
          <div className="absolute inset-x-6 bottom-3 h-6 rounded-full bg-[hsl(0_0%_0%_/_0.18)] blur-xl" />
          <div className="relative h-full w-full">
            <PokemonSprite
              species={recommendation.species}
              spriteUrl={sprites.spriteUrl}
              animatedSpriteUrl={sprites.animatedSpriteUrl}
              size="fill"
              chrome="plain"
            />
          </div>
        </div>

        <div className={clsx(recommendationCaptureBandClassName, "hidden md:grid")}>
          <div className={recommendationCaptureMetricClassName}>
            <CaptureMetricIcon kind="score" />
            <p
              className={clsx(
                recommendationCaptureMetricValueClassName,
                score.verdict === "strong" ? "text-accent-soft" : score.verdict === "solid" ? "text-primary-soft" : "text-info-soft",
              )}
            >
              {scoreLabel}
            </p>
          </div>
          <div className={recommendationCaptureMetricClassName}>
            <CaptureMetricIcon kind="verdict" />
            <p
              className={clsx(
                recommendationCaptureMetricValueClassName,
                "whitespace-normal break-words text-[11px] leading-snug tracking-[0.03em]",
                score.verdict === "strong"
                  ? "text-accent-soft"
                  : score.verdict === "solid"
                    ? "text-primary-soft"
                    : "text-text-faint",
              )}
            >
              {getCaptureVerdictLabel(score.verdict)}
            </p>
          </div>
          <div className={recommendationCaptureMetricClassName}>
            <CaptureMetricIcon kind="floor" />
            <p className={clsx(recommendationCaptureMetricValueClassName, "text-info-soft")}>
              {floorLabel}
            </p>
          </div>
          <div className={recommendationCaptureMetricClassName}>
            <CaptureMetricIcon kind="ceiling" />
            <p className={clsx(recommendationCaptureMetricValueClassName, "text-primary-soft")}>
              {ceilingLabel}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:hidden">
          <div className={recommendationCaptureMobileMetricClassName}>
            <CaptureMetricIcon kind="score" />
            <p className={clsx(
              recommendationCaptureMetricValueClassName,
              score.verdict === "strong" ? "text-accent-soft" : score.verdict === "solid" ? "text-primary-soft" : "text-info-soft",
            )}>
              {scoreLabel}
            </p>
          </div>
          <div className={recommendationCaptureMobileMetricClassName}>
            <CaptureMetricIcon kind="verdict" />
            <p className={clsx(
              recommendationCaptureMetricValueClassName,
              "flex items-center justify-center",
              score.verdict === "strong" ? "text-accent-soft" : score.verdict === "solid" ? "text-primary-soft" : "text-text-faint",
            )}>
              <CaptureVerdictIcon verdict={score.verdict} />
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {recommendation.candidateMember.resolvedTypes.map((type) => (
            <TypeBadge
              key={`${recommendation.id}-${type}`}
              type={type}
              size="sm"
              className="type-badge-capture-responsive"
            />
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function CaptureDetailSheet({
  recommendation,
  dexNumber,
  open,
  onOpenChange,
  onSendToIvCalc,
  ivCalcHrefBuilder,
}: {
  recommendation: EnrichedCaptureRecommendation | null;
  dexNumber?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendToIvCalc?: (species: string) => void;
  ivCalcHrefBuilder?: (species: string) => string;
}) {
  const toolForwardTransition = useSafeTransitionTypes(["tool-forward"]);

  if (!recommendation) {
    return null;
  }

  const sprites = buildSpriteUrls(recommendation.species, dexNumber);
  const ivCalcHref = ivCalcHrefBuilder?.(recommendation.species);
  const score = recommendation.score;
  const profile = recommendation.profile;
  const { breakdown } = score;

  const dimensionRows: { key: string; label: string; dim: DimensionScore }[] = [
    { key: "team", label: "Team Impact", dim: breakdown.teamImpact },
    { key: "ctx", label: "Contexto", dim: breakdown.contextAdvantage },
    { key: "floor", label: "Piso", dim: breakdown.stabilityFloor },
    { key: "ceil", label: "Techo", dim: breakdown.powerCeiling },
    { key: "pref", label: "Afinidad", dim: breakdown.preferenceAffinity },
    { key: "redux", label: "Redux", dim: breakdown.reduxValue },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" onRequestClose={() => onOpenChange(false)} className="max-h-[85vh] rounded-t-[1.6rem] px-4 pb-5 pt-0">
        <SheetHeader className="px-0 pt-4 pb-0">
          <p className="micro-label text-text-faint">Motivos de la recomendación</p>
          <SheetTitle className="display-face mt-1 text-lg text-text">{recommendation.species}</SheetTitle>
          <p className="mt-1 text-sm text-muted">
            {recommendation.source} · {recommendation.area}
          </p>
        </SheetHeader>

        <div className="space-y-3 overflow-y-auto pb-2">
          <div className={recommendationCaptureSheetCardClassName}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={recommendationCaptureMetricLabelClassName}>Score unificado</p>
                <p className={clsx(
                  "display-face mt-1 text-xl",
                  score.verdict === "strong" ? "text-accent-soft" : score.verdict === "solid" ? "text-primary-soft" : "text-info-soft",
                )}>
                  {score.finalScore.toFixed(0)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {score.verdict === "strong" ? "Excelente opción" : score.verdict === "solid" ? "Opción sólida" : score.verdict === "situational" ? "Opción situacional" : "Opción limitada"}
                </p>
              </div>
              <PokemonSprite
                species={recommendation.species}
                spriteUrl={sprites.spriteUrl}
                animatedSpriteUrl={sprites.animatedSpriteUrl}
                size="default"
                chrome="plain"
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <CompactReasonMetric label="Piso" value={profile.floorScore.toFixed(1)} />
              <CompactReasonMetric label="Techo" value={profile.ceilingScore.toFixed(1)} />
              <CompactReasonMetric label="Volat." value={profile.volatility.toFixed(1)} />
            </div>
          </div>

          <div className={recommendationCaptureSheetCardClassName}>
            <p className="display-face micro-copy text-accent">Desglose</p>
            <div className="mt-3 space-y-2.5">
              {dimensionRows.map(({ key, label, dim }) => (
                <DimensionBar key={key} label={label} raw={dim.raw} weighted={dim.weighted} recId={recommendation.id} dimKey={key} />
              ))}
            </div>
          </div>

          {score.topSignals.length ? (
            <div className={recommendationCaptureSheetCardClassName}>
              <p className="display-face micro-copy text-accent">Por qué entra</p>
              <div className="mt-3 space-y-2">
                {score.topSignals.map((signal, index) => (
                  <p key={`${recommendation.id}-signal-${index}`} className="text-sm leading-6 text-text-soft">
                    {signal}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {score.synergyTags.length ? (
            <div className={recommendationCaptureSheetCardClassName}>
              <p className="display-face micro-copy text-accent">Sinergias</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {score.synergyTags.map((tag) => (
                  <span key={`${recommendation.id}-tag-${tag}`} className="app-soft-chip app-chip-xs text-text-soft">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {recommendation.projectedMoves.length ? (
            <div className={recommendationCaptureSheetCardClassName}>
              <p className="display-face micro-copy text-accent">Moves proyectados</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {recommendation.projectedMoves.map((move) => (
                  <span key={`${recommendation.id}-${move}`} className="app-soft-chip app-chip-xs text-text-soft">
                    {move}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className={recommendationCaptureSheetCardClassName}>
            <div className="flex flex-wrap gap-2">
              {recommendation.candidateMember.resolvedTypes.map((type) => (
                <TypeBadge key={`${recommendation.id}-sheet-${type}`} type={type} />
              ))}
            </div>
          </div>

          {ivCalcHref ? (
            <Link
              href={ivCalcHref}
              prefetch
              transitionTypes={toolForwardTransition}
              className="primary-badge flex h-11 items-center justify-center rounded-xl"
              onClick={() => {
                markNavigationStart("capture-recommendation-to-ivcalc", ivCalcHref);
                onOpenChange(false);
              }}
            >
              Mandar al IV Calc
            </Link>
          ) : onSendToIvCalc ? (
            <button
              type="button"
              onClick={() => {
                onSendToIvCalc(recommendation.species);
                onOpenChange(false);
              }}
              className="primary-badge flex h-11 w-full items-center justify-center rounded-xl"
            >
              Mandar al IV Calc
            </button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CaptureMetricIcon({
  kind,
}: {
  kind: "score" | "verdict" | "floor" | "ceiling";
}) {
  if (kind === "score") {
    return (
      <span className={recommendationCaptureMetricLabelClassName} aria-label="Score" title="Score">
        <Gauge className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (kind === "verdict") {
    return (
      <span className={recommendationCaptureMetricLabelClassName} aria-label="Veredicto" title="Veredicto">
        <span className="display-face micro-text-8 tracking-ui-wide">Veredicto</span>
      </span>
    );
  }

  if (kind === "floor") {
    return (
      <span className={recommendationCaptureMetricLabelClassName} aria-label="Piso" title="Piso">
        <ArrowDown className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <span className={recommendationCaptureMetricLabelClassName} aria-label="Techo" title="Techo">
      <ArrowUp className="h-3.5 w-3.5" />
    </span>
  );
}

function CaptureVerdictIcon({
  verdict,
}: {
  verdict: EnrichedCaptureRecommendation["score"]["verdict"];
}) {
  if (verdict === "strong") {
    return (
      <span
        className="inline-flex items-center justify-center"
        aria-label="Excelente"
        title="Excelente"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (verdict === "solid") {
    return (
      <span
        className="inline-flex items-center justify-center"
        aria-label="Sólido"
        title="Sólido"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (verdict === "situational") {
    return (
      <span
        className="inline-flex items-center justify-center"
        aria-label="Situacional"
        title="Situacional"
      >
        <TriangleAlert className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center"
      aria-label="Limitado"
      title="Limitado"
    >
      <CircleSlash2 className="h-3.5 w-3.5" />
    </span>
  );
}

function getCaptureVerdictLabel(
  verdict: EnrichedCaptureRecommendation["score"]["verdict"],
) {
  if (verdict === "strong") {
    return "Excelente";
  }

  if (verdict === "solid") {
    return "Sólido";
  }

  if (verdict === "situational") {
    return "Situacional";
  }

  return "Limitado";
}

function CompactReasonMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line-soft bg-surface-3 px-2 py-2 text-center">
      <p className={recommendationCaptureMetricLabelClassName}>{label}</p>
      <p className="display-face mt-1 text-sm text-text">{value}</p>
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
    <div
      className={clsx(
        "panel-card",
        tone === "incoming"
          ? "incoming-panel"
          : recommendationSwapOutgoingCardClassName,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={recommendationSwapSideTitleClassName}>{title}</p>
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
    <div className={recommendationStatCardClassName}>
      <p className={recommendationCompactStatLabelClassName}>{label}</p>
      <p className="display-face mt-1 text-sm text-text">{value ?? "-"}</p>
    </div>
  );
}

function DimensionBar({
  label,
  raw,
  weighted,
  recId,
  dimKey,
}: {
  label: string;
  raw: number;
  weighted: number;
  recId: string;
  dimKey: string;
}) {
  const pct = Math.min(Math.max(raw, 0), 100);
  return (
    <div key={`${recId}-dim-${dimKey}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="micro-label text-text-faint">{label}</p>
        <p className="display-face micro-label text-text-soft">{raw.toFixed(0)}<span className="text-text-faint">/{weighted.toFixed(1)}</span></p>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            pct >= 70 ? "bg-accent" : pct >= 40 ? "bg-primary" : "bg-info",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
