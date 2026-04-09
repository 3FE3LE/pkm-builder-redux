"use client";

import { CopilotSection } from "@/components/team/checkpoints/CopilotSection";
import { AnalysisSection } from "@/components/team/workspace/AnalysisSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WORKSPACE_TABS = ["builder", "copilot"] as const;
export type WorkspaceTab = (typeof WORKSPACE_TABS)[number];

export function WorkspacePanels({
  workspaceTab,
  setWorkspaceTab,
  analysisTeamSize,
  averageStats,
  coveredCoverage,
  uncoveredCoverage,
  defensiveSections,
  checkpointRisk,
  captureRecommendations,
  nextEncounter,
  speciesCatalog,
  onSendCaptureToIvCalc,
  activeMember,
  supportsContextualSwaps,
  swapOpportunities,
  moveRecommendations,
  sourceCards,
  encounterCatalog,
  completedEncounterIds,
  itemCatalog,
  starterKey,
  onToggleEncounter,
  contextualMilestoneId,
}: {
  workspaceTab: WorkspaceTab;
  setWorkspaceTab: (tab: WorkspaceTab) => void;
  analysisTeamSize: number;
  averageStats: Parameters<typeof AnalysisSection>[0]["averageStats"];
  coveredCoverage: Parameters<typeof AnalysisSection>[0]["coveredCoverage"];
  uncoveredCoverage: Parameters<typeof AnalysisSection>[0]["uncoveredCoverage"];
  defensiveSections: Parameters<typeof AnalysisSection>[0]["defensiveSections"];
  checkpointRisk: Parameters<typeof AnalysisSection>[0]["checkpointRisk"];
  captureRecommendations: Parameters<typeof AnalysisSection>[0]["captureRecommendations"];
  nextEncounter: Parameters<typeof AnalysisSection>[0]["nextEncounter"];
  speciesCatalog: Parameters<typeof AnalysisSection>[0]["speciesCatalog"];
  onSendCaptureToIvCalc: Parameters<typeof AnalysisSection>[0]["onSendCaptureToIvCalc"];
  activeMember: Parameters<typeof CopilotSection>[0]["activeMember"];
  supportsContextualSwaps: Parameters<typeof CopilotSection>[0]["supportsContextualSwaps"];
  swapOpportunities: Parameters<typeof CopilotSection>[0]["swapOpportunities"];
  moveRecommendations: Parameters<typeof CopilotSection>[0]["moveRecommendations"];
  sourceCards: Parameters<typeof CopilotSection>[0]["sourceCards"];
  encounterCatalog: Parameters<typeof CopilotSection>[0]["encounterCatalog"];
  completedEncounterIds: Parameters<typeof CopilotSection>[0]["completedEncounterIds"];
  itemCatalog: Parameters<typeof CopilotSection>[0]["itemCatalog"];
  starterKey: Parameters<typeof CopilotSection>[0]["starterKey"];
  onToggleEncounter: Parameters<typeof CopilotSection>[0]["onToggleEncounter"];
  contextualMilestoneId: Parameters<typeof CopilotSection>[0]["milestoneId"];
}) {
  return (
    <section className="mt-3">
      <Tabs
        value={workspaceTab}
        onValueChange={(value) => setWorkspaceTab(value as WorkspaceTab)}
        className="screen-tab-stack"
      >
        <TabsList className="tab-strip scrollbar-thin">
          <TabsTrigger
            value="builder"
            className="tab-trigger-soft"
          >
            Team
          </TabsTrigger>
          <TabsTrigger
            value="copilot"
            className="tab-trigger-soft"
          >
            Checkpoint
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="tab-panel">
          {workspaceTab === "builder" ? (
            <AnalysisSection
              averageStats={averageStats}
              coveredCoverage={coveredCoverage}
              uncoveredCoverage={uncoveredCoverage}
              defensiveSections={defensiveSections}
              checkpointRisk={checkpointRisk}
              teamSize={analysisTeamSize}
              captureRecommendations={captureRecommendations}
              nextEncounter={nextEncounter}
              speciesCatalog={speciesCatalog}
              onSendCaptureToIvCalc={onSendCaptureToIvCalc}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="copilot" className="tab-panel">
          {workspaceTab === "copilot" ? (
            <CopilotSection
              activeMember={activeMember}
              teamSize={analysisTeamSize}
              milestoneId={contextualMilestoneId}
              checkpointRisk={checkpointRisk}
              supportsContextualSwaps={supportsContextualSwaps}
              nextEncounter={nextEncounter}
              swapOpportunities={swapOpportunities}
              captureRecommendations={captureRecommendations}
              moveRecommendations={moveRecommendations}
              sourceCards={sourceCards}
              encounterCatalog={encounterCatalog}
              completedEncounterIds={completedEncounterIds}
              speciesCatalog={speciesCatalog}
              itemCatalog={itemCatalog}
              starterKey={starterKey}
              onToggleEncounter={onToggleEncounter}
              onSendCaptureToIvCalc={onSendCaptureToIvCalc}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </section>
  );
}
