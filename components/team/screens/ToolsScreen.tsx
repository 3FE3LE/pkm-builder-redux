"use client";

import { useSearchParams } from "next/navigation";
import { parseAsStringEnum, useQueryState } from "nuqs";

import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { LoadingState } from "@/components/team/screens/LoadingState";
import { TeamScreenHeader, TeamScreenShell } from "@/components/team/screens/ScreenShell";
import { CompositionsSection } from "@/components/team/collection/CompositionsSection";
import { WorkspaceSection } from "@/components/team/tools/compare/Section";
import { IvCalculatorSection } from "@/components/team/tools/iv-calculator/Section";
import { TypeTierListSection } from "@/components/team/tools/type-tiers/Section";
import {
  useTeamCatalogs,
  useTeamCompare,
  useTeamRoster,
  useTeamSession,
} from "@/components/BuilderProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createEditable } from "@/lib/builderStore";

const TOOL_TABS = ["compare", "ivcalc", "types", "compositions"] as const;
type ToolTab = (typeof TOOL_TABS)[number];

export function ToolsScreen() {
  const searchParams = useSearchParams();
  const [toolTab, setToolTab] = useQueryState(
    "tool",
    parseAsStringEnum<ToolTab>([...TOOL_TABS]).withDefault("compare"),
  );
  const session = useTeamSession();
  const catalogs = useTeamCatalogs();
  const team = useTeamRoster();
  const compare = useTeamCompare();
  const speciesPrefill = searchParams.get("species") ?? "";

  if (!session.hydrated) {
    return <LoadingState />;
  }

  if (!session.builderStarted) {
    return <OnboardingScreen />;
  }

  function clearCompareMember(slot: 0 | 1) {
    compare.actions.updateMember(slot, createEditable());
  }

  return (
    <TeamScreenShell overflow="visible">
      <TeamScreenHeader title="Tools" />

      <Tabs
        value={toolTab}
        onValueChange={(value) => setToolTab(value as ToolTab)}
        className="screen-tab-stack"
      >
        <TabsList className="tab-strip scrollbar-thin">
          <TabsTrigger
            value="compare"
            className="tab-trigger-soft"
          >
            Compare
          </TabsTrigger>
          <TabsTrigger
            value="ivcalc"
            className="tab-trigger-soft"
          >
            IV Calc
          </TabsTrigger>
          <TabsTrigger
            value="types"
            className="tab-trigger-soft"
          >
            Type Tiers
          </TabsTrigger>
          <TabsTrigger
            value="compositions"
            className="tab-trigger-soft"
          >
            Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compare" className="tab-panel">
          {toolTab === "compare" ? (
            <WorkspaceSection
              members={compare.members}
              resolvedMembers={compare.resolvedMembers}
              speciesCatalog={catalogs.speciesCatalog}
              abilityCatalog={catalogs.abilityCatalog}
              itemCatalog={catalogs.itemCatalog}
              battleWeather={session.battleWeather}
              dropPulse={null}
              onChangeMember={compare.actions.updateMember}
              onClearMember={clearCompareMember}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="ivcalc" className="tab-panel">
          {toolTab === "ivcalc" ? (
            <IvCalculatorSection
              key={`ivcalc-${speciesPrefill || "none"}`}
              speciesCatalog={catalogs.speciesCatalog}
              pokemonIndex={catalogs.pokemonIndex}
              prefillSpecies={speciesPrefill}
              onAddPreparedMember={(member) => team.actions.addPreparedMember(member)}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="types" className="tab-panel">
          {toolTab === "types" ? (
            <TypeTierListSection
              resolvedTeam={team.resolvedTeam}
              speciesCatalog={catalogs.speciesCatalog}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="compositions" className="tab-panel">
          {toolTab === "compositions" ? (
            <CompositionsSection
              compositions={team.compositions}
              members={team.pokemonLibrary}
              speciesCatalog={catalogs.speciesCatalog}
              activeCompositionId={team.activeCompositionId}
              onCreateComposition={() => {
                team.actions.createComposition();
              }}
              onSelectComposition={team.actions.setActiveCompositionId}
              onRenameComposition={team.actions.renameComposition}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </TeamScreenShell>
  );
}
