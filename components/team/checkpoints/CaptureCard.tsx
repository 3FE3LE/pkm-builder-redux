"use client";

import clsx from "clsx";
import Link from "next/link";
import { CircleSlash2, Gauge, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import { PokeballMark } from "@/components/team/shared/PokeballMark";
import { buildSpriteUrls } from "@/lib/domain/names";
import { getCaptureVerdictLabel, getReduxCardLabel } from "@/lib/domain/scoring/capturePresentation";
import type { EnrichedCaptureRecommendation } from "@/lib/domain/scoring/enrichRecommendations";
import { markNavigationStart } from "@/lib/perf";
import { getTypedSurfaceStyle } from "@/lib/ui/typeSurface";
import { useSafeTransitionTypes } from "@/lib/viewTransitions";

const recommendationCaptureCardClassName =
  "relative overflow-hidden rounded-[1.4rem] border border-line-soft/80 px-3 py-3 shadow-[0_18px_40px_hsl(0_0%_0%_/_0.18)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary-line-emphasis hover:shadow-[0_24px_54px_hsl(0_0%_0%_/_0.24)]";
const recommendationCaptureHeaderClassName = "flex items-start gap-3";
const recommendationCaptureSpriteShellClassName =
  "relative flex h-24 items-center justify-center overflow-hidden rounded-[1.15rem] border border-white/8 bg-[linear-gradient(180deg,hsl(0_0%_100%_/_0.06),transparent_65%)]";
const recommendationCaptureBandClassName = "grid grid-cols-2 gap-2";
const recommendationCaptureMetricClassName = "rounded-[0.95rem] bg-[hsl(0_0%_0%_/_0.12)] px-2.5 py-2";
const recommendationCaptureMetricLabelClassName = "flex h-4 items-center justify-center text-text-faint";
const recommendationCaptureMetricValueClassName = "pixel-face mt-1 text-xs text-text";
const recommendationCaptureActionClassName =
  "group inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[hsl(0_0%_0%_/_0.18)] text-accent transition hover:border-primary-line-emphasis hover:bg-primary-fill hover:text-primary-soft";
const recommendationCaptureMobileMetricClassName = "rounded-[0.95rem] bg-[hsl(0_0%_0%_/_0.12)] px-2.5 py-2";

export function CaptureCard({
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
  const reduxLabel = getReduxCardLabel(recommendation);
  const roleLabel = recommendation.role;
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
      {captureAction ? <div className="absolute right-3 top-3 z-10 hidden md:block">{captureAction}</div> : null}
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
          <CaptureMetric kind="score" value={scoreLabel} tone={score.verdict} />
          <CaptureMetric kind="verdict" value={getCaptureVerdictLabel(score.verdict)} tone={score.verdict} multiline />
          <CaptureMetric kind="role" value={roleLabel} tone="role" />
          <CaptureMetric kind="redux" value={reduxLabel} tone="redux" />
        </div>

        <div className="grid grid-cols-2 gap-2 md:hidden">
          <div className={recommendationCaptureMobileMetricClassName}>
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
          <div className={recommendationCaptureMobileMetricClassName}>
            <CaptureMetricIcon kind="verdict" />
            <p
              className={clsx(
                recommendationCaptureMetricValueClassName,
                "flex items-center justify-center",
                score.verdict === "strong" ? "text-accent-soft" : score.verdict === "solid" ? "text-primary-soft" : "text-text-faint",
              )}
            >
              <CaptureVerdictIcon verdict={score.verdict} />
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {recommendation.candidateMember.resolvedTypes.map((type) => (
            <TypeBadge key={`${recommendation.id}-${type}`} type={type} size="sm" className="type-badge-capture-responsive" />
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function CaptureMetric({
  kind,
  value,
  tone,
  multiline = false,
}: {
  kind: "score" | "verdict" | "role" | "redux";
  value: string;
  tone: EnrichedCaptureRecommendation["score"]["verdict"] | "role" | "redux";
  multiline?: boolean;
}) {
  return (
    <div className={recommendationCaptureMetricClassName}>
      <CaptureMetricHeader kind={kind} />
      <p
        className={clsx(
          recommendationCaptureMetricValueClassName,
          multiline && "whitespace-normal break-words text-[11px] leading-snug tracking-[0.03em]",
          tone === "strong"
            ? "text-accent-soft"
            : tone === "solid"
              ? "text-primary-soft"
              : tone === "situational"
                ? "text-text-faint"
                : tone === "redux"
                  ? "text-primary-soft"
                  : "text-info-soft",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CaptureMetricIcon({ kind }: { kind: "score" | "verdict" | "role" | "redux" }) {
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
  if (kind === "role") {
    return (
      <span className={recommendationCaptureMetricLabelClassName} aria-label="Rol" title="Rol">
        <ShieldCheck className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className={recommendationCaptureMetricLabelClassName} aria-label="Redux" title="Redux">
      <Sparkles className="h-3.5 w-3.5" />
    </span>
  );
}

function CaptureMetricHeader({ kind }: { kind: "score" | "verdict" | "role" | "redux" }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <CaptureMetricIcon kind={kind} />
      <span className="display-face micro-text-8 tracking-ui-wide text-text-faint">
        {kind === "score" ? "Score" : kind === "verdict" ? "Veredicto" : kind === "role" ? "Rol" : "Redux"}
      </span>
    </div>
  );
}

function CaptureVerdictIcon({ verdict }: { verdict: EnrichedCaptureRecommendation["score"]["verdict"] }) {
  if (verdict === "strong") {
    return (
      <span className="inline-flex items-center justify-center" aria-label="Excelente" title="Excelente">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (verdict === "solid") {
    return (
      <span className="inline-flex items-center justify-center" aria-label="Sólido" title="Sólido">
        <ShieldCheck className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (verdict === "situational") {
    return (
      <span className="inline-flex items-center justify-center" aria-label="Situacional" title="Situacional">
        <TriangleAlert className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center" aria-label="Limitado" title="Limitado">
      <CircleSlash2 className="h-3.5 w-3.5" />
    </span>
  );
}
