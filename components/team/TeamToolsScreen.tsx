"use client";

import { parseAsStringEnum, useQueryState } from "nuqs";

import {
  CompareWorkspaceSection,
  IvCalculatorSection,
} from "@/components/team/LayoutSections";
import { LoadingScreen } from "@/components/team/LoadingScreen";
import {
  useTeamCatalogs,
  useTeamCompare,
  useTeamRoster,
  useTeamSession,
} from "@/components/BuilderProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createEditable } from "@/lib/builderStore";

const TOOL_TABS = ["compare", "ivcalc"] as const;
type ToolTab = (typeof TOOL_TABS)[number];

export function TeamToolsScreen() {
  const [toolTab, setToolTab] = useQueryState(
    "tool",
    parseAsStringEnum<ToolTab>([...TOOL_TABS]).withDefault("compare"),
  );
  const session = useTeamSession();
  const catalogs = useTeamCatalogs();
  const team = useTeamRoster();
  const compare = useTeamCompare();

  if (!session.hydrated) {
    return <LoadingScreen />;
  }

  function clearCompareMember(slot: 0 | 1) {
    compare.actions.updateMember(slot, createEditable());
  }

  return (
    <main className="relative overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-4">
          <p className="display-face text-sm text-accent">Tools</p>
          <h1 className="pixel-face mt-2 text-2xl text-text">Compare e IV Calc</h1>
        </div>

        <Tabs
          value={toolTab}
          onValueChange={(value) => setToolTab(value as ToolTab)}
          className="gap-0"
        >
          <TabsList className="relative z-10 -mb-px grid w-full grid-cols-2 gap-1 bg-transparent p-0 sm:w-fit">
            <TabsTrigger
              value="compare"
              className="min-w-0 rounded-t-[0.95rem] rounded-b-none border border-line border-b-line bg-surface-3 px-3 py-2 text-sm text-muted transition-all hover:bg-surface-5 data-active:border-line data-active:border-b-tab-seam data-active:bg-tab-active data-active:text-primary-soft data-active:shadow-[0_-1px_0_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.14)]"
            >
              Compare
            </TabsTrigger>
            <TabsTrigger
              value="ivcalc"
              className="min-w-0 rounded-t-[0.95rem] rounded-b-none border border-line border-b-line bg-surface-3 px-3 py-2 text-sm text-muted transition-all hover:bg-surface-5 data-active:border-line data-active:border-b-tab-seam data-active:bg-tab-active data-active:text-primary-soft data-active:shadow-[0_-1px_0_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.14)]"
            >
              IV Calc
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compare" className="rounded-[0_1rem_1rem_1rem] p-0">
            <CompareWorkspaceSection
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
          </TabsContent>

          <TabsContent value="ivcalc" className="rounded-[0_1rem_1rem_1rem] p-0">
            <IvCalculatorSection
              speciesCatalog={catalogs.speciesCatalog}
              pokemonIndex={catalogs.pokemonIndex}
              onAddPreparedMember={team.actions.addPreparedMember}
            />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
