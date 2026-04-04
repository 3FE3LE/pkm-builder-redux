import type { Metadata } from "next";

import { DexScreen } from "@/components/team/screens/DexScreen";
import { getDexListPageData } from "@/lib/builderPageData";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Redux Dex",
  description:
    "Referencia rapida de movimientos, habilidades y objetos para Blaze Black 2 Redux y Volt White 2 Redux dentro del builder.",
  keywords: [
    ...siteConfig.keywords,
    "pokemon move dex redux",
    "pokemon ability dex redux",
    "pokemon item locations blaze black 2 redux",
    "volt white 2 redux item locations",
  ],
  alternates: {
    canonical: absoluteUrl("/team/dex"),
  },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeamDexPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const perfDebug = resolvedSearchParams.perf === "1";
  const data = getDexListPageData(perfDebug);

  return <DexScreen data={data} />;
}
