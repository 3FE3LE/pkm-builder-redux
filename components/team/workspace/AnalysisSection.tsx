"use client";

import {
  CoveragePanel,
  DefensiveThreatsPanel,
  TeamAverageStatsPanel,
  TeamRosterReadingPanel,
} from "@/components/team/AnalysisPanels";
import { RecommendedCapturesPanel } from "@/components/team/CheckpointPanels";
import type { RunEncounterDefinition } from "@/lib/runEncounters";

type CheckpointRisk = ReturnType<
  typeof import("@/lib/domain/checkpointScoring").buildCheckpointRiskSnapshot
>;
type CaptureRecommendation = ReturnType<
  typeof import("@/lib/domain/contextualRecommendations").buildCaptureRecommendations
>[number];
type DefensiveSections = ReturnType<typeof import("@/lib/teamAnalysis").buildDefensiveSections>;

export function AnalysisSection({
  averageStats,
  coveredCoverage,
  uncoveredCoverage,
  defensiveSections,
  checkpointRisk,
  teamSize,
  captureRecommendations,
  nextEncounter,
  speciesCatalog,
  onSendCaptureToIvCalc,
}: {
  averageStats: ReturnType<typeof import("@/lib/teamAnalysis").buildAverageStats> | null;
  coveredCoverage: {
    defenseType: string;
    bucket: "x0" | "x0.25" | "x0.5" | "x1" | "x2" | "x4";
  }[];
  uncoveredCoverage: {
    defenseType: string;
    bucket: "x0" | "x0.25" | "x0.5" | "x1" | "x2" | "x4";
  }[];
  defensiveSections: DefensiveSections;
  checkpointRisk: CheckpointRisk;
  teamSize: number;
  captureRecommendations: CaptureRecommendation[];
  nextEncounter: RunEncounterDefinition | null;
  speciesCatalog: { name: string; dex: number }[];
  onSendCaptureToIvCalc?: (species: string) => void;
}) {
  return (
    <section className="space-y-2">
      <TeamAverageStatsPanel averageStats={averageStats} />
      <TeamRosterReadingPanel checkpointRisk={checkpointRisk} />
      <RecommendedCapturesPanel
        teamSize={teamSize}
        captureRecommendations={captureRecommendations}
        swapOpportunities={[]}
        supportsContextualSwaps={false}
        nextEncounter={nextEncounter}
        speciesCatalog={speciesCatalog}
        showSwaps={false}
        onSendToIvCalc={onSendCaptureToIvCalc}
      />
      <div className="grid gap-3 xl:grid-cols-2">
        <CoveragePanel
          coveredCoverage={coveredCoverage}
          uncoveredCoverage={uncoveredCoverage}
        />
        <DefensiveThreatsPanel defensiveSections={defensiveSections} />
      </div>
    </section>
  );
}
