"use client";

import { Search, X } from "lucide-react";

import { TeamScreenHeader, TeamScreenShell } from "@/components/team/screens/ScreenShell";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DexPokemonPanel, DexResultSummary, DexSecondaryPanels } from "@/components/team/screens/dex/DexPanels";
import { getSearchPlaceholder } from "@/components/team/screens/dex/utils";
import { useDexScreenModel } from "@/components/team/screens/dex/useDexScreenModel";
import type { getDexListPageData } from "@/lib/builderPageData";

export function DexScreenView({
  data,
}: {
  data: ReturnType<typeof getDexListPageData> & {
    speciesCatalog?: Array<{
      dex: number;
      name: string;
      slug: string;
      types: string[];
      abilities?: string[];
      hasTypeChanges?: boolean;
      hasStatChanges?: boolean;
      hasAbilityChanges?: boolean;
    }>;
  };
}) {
  const model = useDexScreenModel(data);

  return (
    <TeamScreenShell overflow="visible" density="compact">
        <TeamScreenHeader title="Redux Dex" className="mb-2 sm:mb-4" titleClassName="text-xl sm:text-[2rem]" />
        <Tabs value={model.tab} onValueChange={(value) => model.setTab(value as any)} className="gap-3 sm:gap-4">
          <div className="mb-3 sm:mb-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-text-faint" />
              <Input
                value={model.query}
                onChange={(event) => model.setQuery(event.target.value)}
                placeholder={getSearchPlaceholder(model.tab)}
                className="h-10 rounded-[0.9rem] border-line-emphasis bg-surface-3 pl-12 text-sm shadow-[0_18px_40px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.05)] focus-visible:bg-surface-4 sm:h-12 sm:rounded-2xl sm:text-base"
              />
              {model.query ? (
                <button
                  type="button"
                  onClick={() => model.setQuery("")}
                  className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center text-text-faint transition-colors hover:text-text"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mb-3 flex flex-col gap-2 sm:mb-6 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="tab-strip scrollbar-thin">
              <TabsTrigger value="pokemon" className="tab-trigger-soft">Pokemon</TabsTrigger>
              <TabsTrigger value="moves" className="tab-trigger-soft">Moves</TabsTrigger>
              <TabsTrigger value="abilities" className="tab-trigger-soft">Abilities</TabsTrigger>
              <TabsTrigger value="items" className="tab-trigger-soft">Items</TabsTrigger>
            </TabsList>
            <DexResultSummary model={model} />
          </div>

          <TabsContent value="pokemon" className="mt-0">
            <DexPokemonPanel model={model} />
          </TabsContent>
          <TabsContent value="moves" className="mt-0">
            {model.tab === "moves" ? <DexSecondaryPanels model={model} /> : null}
          </TabsContent>
          <TabsContent value="abilities" className="mt-0">
            {model.tab === "abilities" ? <DexSecondaryPanels model={model} /> : null}
          </TabsContent>
          <TabsContent value="items" className="mt-0">
            {model.tab === "items" ? <DexSecondaryPanels model={model} /> : null}
          </TabsContent>
        </Tabs>
    </TeamScreenShell>
  );
}
