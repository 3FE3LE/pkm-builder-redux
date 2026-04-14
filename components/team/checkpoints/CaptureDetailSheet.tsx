"use client";

import clsx from "clsx";
import Link from "next/link";

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { buildSpriteUrls } from "@/lib/domain/names";
import {
  extractMentionedTypes,
  getOffenseMoves,
  getUtilityMoves,
} from "@/lib/domain/scoring/capturePresentation";
import type { EnrichedCaptureRecommendation } from "@/lib/domain/scoring/enrichRecommendations";
import type { DimensionScore } from "@/lib/domain/profiles/types";
import { markNavigationStart } from "@/lib/perf";
import { useSafeTransitionTypes } from "@/lib/viewTransitions";

const recommendationCaptureMetricLabelClassName = "flex h-4 items-center justify-center text-text-faint";
const recommendationCaptureSheetCardClassName = "app-soft-panel rounded-xl px-3 py-3";

export function CaptureDetailSheet({
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
  const gains = recommendation.delta.gains ?? [];
  const reduxLabels = recommendation.redux?.labels ?? [];
  const reduxScore = recommendation.redux?.score ?? 0;
  const defensiveTypes = extractMentionedTypes([
    ...breakdown.teamImpact.signals,
    ...breakdown.contextAdvantage.signals,
  ]);
  const offenseMoves = getOffenseMoves(recommendation);
  const utilityMoves = getUtilityMoves(recommendation);

  const dimensionRows: { key: string; label: string; dim: DimensionScore }[] = [
    { key: "team", label: "Impacto en equipo", dim: breakdown.teamImpact },
    { key: "ctx", label: "Contexto", dim: breakdown.contextAdvantage },
    { key: "floor", label: "Consistencia", dim: breakdown.stabilityFloor },
    { key: "ceil", label: "Potencial", dim: breakdown.powerCeiling },
    { key: "pref", label: "Preferencias", dim: breakdown.preferenceAffinity },
    { key: "redux", label: "Redux", dim: breakdown.reduxValue },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" onRequestClose={() => onOpenChange(false)} className="max-h-[85vh] rounded-t-[1.6rem] px-4 pb-5 pt-0">
        <SheetHeader className="px-0 pt-4 pb-0">
          <p className="micro-label text-text-faint">Motivos de la recomendación</p>
          <SheetTitle tabIndex={-1} autoFocus className="display-face mt-1 text-lg text-text">
            {recommendation.species}
          </SheetTitle>
          <p className="mt-1 text-sm text-muted">
            {recommendation.source} · {recommendation.area}
          </p>
        </SheetHeader>

        <div className="space-y-3 overflow-y-auto pb-2">
          <div className={recommendationCaptureSheetCardClassName}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={recommendationCaptureMetricLabelClassName}>Score unificado</p>
                <p
                  className={clsx(
                    "display-face mt-1 text-xl",
                    score.verdict === "strong" ? "text-accent-soft" : score.verdict === "solid" ? "text-primary-soft" : "text-info-soft",
                  )}
                >
                  {score.finalScore.toFixed(0)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {score.verdict === "strong"
                    ? "Excelente opción"
                    : score.verdict === "solid"
                      ? "Opción sólida"
                      : score.verdict === "situational"
                        ? "Opción situacional"
                        : "Opción limitada"}
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
              <CompactReasonMetric label="Consistencia" value={profile.floorScore.toFixed(1)} />
              <CompactReasonMetric label="Potencial" value={profile.ceilingScore.toFixed(1)} />
              <CompactReasonMetric label="Volat." value={profile.volatility.toFixed(1)} />
            </div>
          </div>

          <div className={recommendationCaptureSheetCardClassName}>
            <p className="display-face micro-copy text-accent">Desglose</p>
            <div className="mt-3 space-y-2.5">
              {dimensionRows.map(({ key, label, dim }) => (
                <DimensionBar key={key} label={label} raw={dim.raw} recId={recommendation.id} dimKey={key} />
              ))}
            </div>
          </div>

          {defensiveTypes.length ? (
            <div className={recommendationCaptureSheetCardClassName}>
              <p className="display-face micro-copy text-accent">Cobertura defensiva</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {defensiveTypes.map((type) => (
                  <TypeBadge key={`${recommendation.id}-def-${type}`} type={type} />
                ))}
              </div>
            </div>
          ) : null}

          {offenseMoves.length || utilityMoves.length || gains.length ? (
            <div className={recommendationCaptureSheetCardClassName}>
              <p className="display-face micro-copy text-accent">Ataque y utilidad</p>
              {offenseMoves.length ? (
                <div className="mt-3">
                  <p className="micro-label text-text-faint">Moves que empujan presión o cobertura</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {offenseMoves.map((move) => (
                      <span key={`${recommendation.id}-offense-${move.name}`} className="app-soft-chip app-chip-xs text-text-soft">
                        {move.name}
                        {move.type ? ` · ${move.type}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {utilityMoves.length ? (
                <div className="mt-3">
                  <p className="micro-label text-text-faint">Utility y líneas de rol</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {utilityMoves.map((move) => (
                      <span key={`${recommendation.id}-utility-${move.name}`} className="app-soft-chip app-chip-xs text-text-soft">
                        {move.name}
                        {move.type ? ` · ${move.type}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {gains.length ? (
                <div className="mt-3 space-y-2">
                  {gains.map((gain) => (
                    <p key={`${recommendation.id}-gain-${gain}`} className="text-sm leading-6 text-text-soft">
                      {gain}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {score.topSignals.length ? (
            <div className={recommendationCaptureSheetCardClassName}>
              <p className="display-face micro-copy text-accent">Lectura rápida</p>
              <div className="mt-3 space-y-2">
                {score.topSignals.map((signal, index) => (
                  <p key={`${recommendation.id}-signal-${index}`} className="text-sm leading-6 text-text-soft">
                    {signal}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {reduxLabels.length ? (
            <div className={recommendationCaptureSheetCardClassName}>
              <p className="display-face micro-copy text-accent">Valor Redux</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {reduxLabels.map((tag) => (
                  <span key={`${recommendation.id}-tag-${tag}`} className="app-soft-chip app-chip-xs text-text-soft">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-text-soft">
                {reduxScore >= 7
                  ? "La línea gana muchísimo valor por combinar varios cambios Redux."
                  : reduxScore >= 4
                    ? "La línea trae cambios Redux relevantes que justifican priorizarla."
                    : "Hay ajustes Redux presentes, pero no son el motivo principal."}
              </p>
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

function CompactReasonMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line-soft bg-surface-3 px-2 py-2 text-center">
      <p className={recommendationCaptureMetricLabelClassName}>{label}</p>
      <p className="display-face mt-1 text-sm text-text">{value}</p>
    </div>
  );
}

function DimensionBar({
  label,
  raw,
  recId,
  dimKey,
}: {
  label: string;
  raw: number;
  recId: string;
  dimKey: string;
}) {
  const pct = Math.min(Math.max(raw, 0), 100);
  return (
    <div key={`${recId}-dim-${dimKey}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="micro-label text-text-faint">{label}</p>
        <p className="display-face micro-label text-text-soft">{raw.toFixed(0)}</p>
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
