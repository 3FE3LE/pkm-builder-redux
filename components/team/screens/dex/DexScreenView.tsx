"use client";

import { Search, X } from "lucide-react";

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
    <main className="relative overflow-visible px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="panel panel-frame overflow-hidden">
          <div className="relative overflow-hidden border-b border-line-soft px-5 py-5 sm:px-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,199,107,0.18),transparent_34%),radial-gradient(circle_at_75%_18%,rgba(81,255,204,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]" />
            <div className="relative">
              <p className="display-face text-sm text-[hsl(39_100%_78%)]">Redux Dex</p>
              <h1 className="display-face mt-2 text-2xl text-text sm:text-[2rem]">Catalogo alineado al builder</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-soft">
                Busca especies, compara cambios del hack y filtra por cobertura real del team sin salir de la misma data que consume Redux.
              </p>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <Tabs value={model.tab} onValueChange={(value) => model.setTab(value as any)} className="gap-4">
              <div className="mb-6">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-text-faint" />
                  <Input
                    value={model.query}
                    onChange={(event) => model.setQuery(event.target.value)}
                    placeholder={getSearchPlaceholder(model.tab)}
                    className="h-12 rounded-[1rem] border-line-emphasis bg-surface-3 pl-12 text-base shadow-[0_18px_40px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.05)] focus-visible:bg-surface-4"
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

              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="tab-strip scrollbar-thin">
                  <TabsTrigger value="pokemon" className="tab-trigger-soft">Pokemon</TabsTrigger>
                  <TabsTrigger value="moves" className="tab-trigger-soft">Moves</TabsTrigger>
                  <TabsTrigger value="abilities" className="tab-trigger-soft">Abilities</TabsTrigger>
                  <TabsTrigger value="items" className="tab-trigger-soft">Items</TabsTrigger>
                </TabsList>
                <DexResultSummary model={model} />
              </div>

              <TabsContent value="pokemon" className="tab-panel">
                <DexPokemonPanel model={model} />
              </TabsContent>
              <TabsContent value="moves" className="tab-panel">
                {model.tab === "moves" ? <DexSecondaryPanels model={model} /> : null}
              </TabsContent>
              <TabsContent value="abilities" className="tab-panel">
                {model.tab === "abilities" ? <DexSecondaryPanels model={model} /> : null}
              </TabsContent>
              <TabsContent value="items" className="tab-panel">
                {model.tab === "items" ? <DexSecondaryPanels model={model} /> : null}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </main>
  );
}
