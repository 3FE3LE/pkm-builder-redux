"use client";

import { useEffect, useRef, useState } from "react";

import {
  CheckpointIntelligencePanel,
  CheckpointMapPanel,
  RecommendedCapturesPanel,
  RunPathPanel,
} from "@/components/team/CheckpointPanels";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import type { RunEncounterDefinition } from "@/lib/runEncounters";
import type { StarterKey } from "@/lib/builder";

type CheckpointRisk = ReturnType<
  typeof import("@/lib/domain/checkpointScoring").buildCheckpointRiskSnapshot
>;
type SwapOpportunity = ReturnType<
  typeof import("@/lib/domain/swapOpportunities").buildSwapOpportunities
>[number];
type CaptureRecommendation = ReturnType<
  typeof import("@/lib/domain/contextualRecommendations").buildCaptureRecommendations
>[number];
type MoveRecommendation = ReturnType<
  typeof import("@/lib/domain/moveRecommendations").getMoveRecommendations
>[number];

export function CheckpointCopilotSection({
  activeMember,
  teamSize,
  milestoneId: _milestoneId,
  checkpointRisk,
  supportsContextualSwaps,
  nextEncounter,
  swapOpportunities,
  captureRecommendations,
  moveRecommendations: _moveRecommendations,
  sourceCards,
  encounterCatalog,
  completedEncounterIds,
  speciesCatalog,
  itemCatalog,
  starterKey,
  onToggleEncounter,
  onSendCaptureToIvCalc,
}: {
  activeMember?: ResolvedTeamMember;
  teamSize: number;
  milestoneId: string;
  checkpointRisk: CheckpointRisk;
  supportsContextualSwaps: boolean;
  nextEncounter: RunEncounterDefinition | null;
  swapOpportunities: SwapOpportunity[];
  captureRecommendations: CaptureRecommendation[];
  moveRecommendations: MoveRecommendation[];
  sourceCards: ReturnType<typeof import("@/lib/builder").buildAreaSources>;
  encounterCatalog: RunEncounterDefinition[];
  completedEncounterIds: string[];
  speciesCatalog: { name: string; dex: number }[];
  itemCatalog: { name: string; effect?: string; sprite?: string | null }[];
  starterKey: StarterKey;
  onToggleEncounter: (id: string) => void;
  onSendCaptureToIvCalc?: (species: string) => void;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [timelineHeight, setTimelineHeight] = useState<number | null>(null);

  useEffect(() => {
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setTimelineHeight(Math.round(entry.contentRect.height));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="min-w-0 space-y-2 overflow-x-hidden">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
        <div ref={contentRef} className="min-w-0 space-y-2 overflow-x-hidden">
          <div className="xl:hidden">
            <RunPathPanel
              encounters={encounterCatalog}
              completedEncounterIds={completedEncounterIds}
              speciesCatalog={speciesCatalog}
              starterKey={starterKey}
              onToggleEncounter={onToggleEncounter}
              variant="mobile-summary"
            />
          </div>
          <CheckpointIntelligencePanel
            teamSize={teamSize}
            supportsContextualSwaps={supportsContextualSwaps}
            checkpointRisk={checkpointRisk}
            swapOpportunities={swapOpportunities}
          />
          <CheckpointMapPanel
            activeMember={activeMember}
            sourceCards={sourceCards}
            speciesCatalog={speciesCatalog}
            itemCatalog={itemCatalog}
          />
          <RecommendedCapturesPanel
            teamSize={teamSize}
            swapOpportunities={swapOpportunities}
            captureRecommendations={captureRecommendations}
            supportsContextualSwaps={supportsContextualSwaps}
            nextEncounter={nextEncounter}
            speciesCatalog={speciesCatalog}
            showCaptures={false}
            onSendToIvCalc={onSendCaptureToIvCalc}
          />
        </div>
        <aside className="hidden xl:block">
          <RunPathPanel
            encounters={encounterCatalog}
            completedEncounterIds={completedEncounterIds}
            speciesCatalog={speciesCatalog}
            starterKey={starterKey}
            onToggleEncounter={onToggleEncounter}
            maxHeight={timelineHeight ?? undefined}
          />
        </aside>
      </div>
    </section>
  );
}
