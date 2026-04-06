"use client";

import { DexScreenView } from "@/components/team/screens/dex/DexScreenView";
import { PokemonDexCard } from "@/components/team/screens/dex/PokemonDexCard";
import {
  buildDexStateQuery,
  matchesDexMode,
  matchesTypeSlotFilters,
} from "@/components/team/screens/dex/utils";
import type { getDexListPageData } from "@/lib/builderPageData";

export { PokemonDexCard, buildDexStateQuery, matchesDexMode, matchesTypeSlotFilters };

export function DexScreen({
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
  return <DexScreenView data={data} />;
}
