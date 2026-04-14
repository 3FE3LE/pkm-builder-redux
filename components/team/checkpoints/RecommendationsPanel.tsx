"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

import { normalizeName } from "@/lib/domain/names";
import type { EnrichedCaptureRecommendation } from "@/lib/domain/scoring/enrichRecommendations";
import type { SwapOpportunity } from "@/lib/domain/swapOpportunities";
import type { RunEncounterDefinition } from "@/lib/runEncounters";
import { CaptureCard } from "@/components/team/checkpoints/CaptureCard";
import { CaptureDetailSheet } from "@/components/team/checkpoints/CaptureDetailSheet";
import { SuggestedSwapCard } from "@/components/team/checkpoints/SuggestedSwapCard";

const recommendationSectionEyebrowClassName = "display-face px-1 micro-copy text-accent";
const recommendationEmptyStateClassName = "soft-card-dashed px-3 py-4 text-sm text-muted";

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
        key={activeCapture?.id ?? "empty"}
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
