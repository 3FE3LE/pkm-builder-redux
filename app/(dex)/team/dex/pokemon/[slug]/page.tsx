import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DexPokemonDetailScreen } from "@/components/team/screens/DexPokemonDetailScreen";
import { getDexPokemonDetailPageData, getDexSpeciesRouteEntry } from "@/lib/dexDetailPageData";
import { absoluteUrl } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const species = getDexSpeciesRouteEntry(slug);

  if (!species) {
    return {
      title: "Pokemon Dex",
      alternates: {
        canonical: absoluteUrl("/team/dex"),
      },
    };
  }

  return {
    title: `${species.name} | Redux Dex`,
    description: `Ficha dedicada de ${species.name} en la Redux Dex del builder.`,
    alternates: {
      canonical: absoluteUrl(`/team/dex/pokemon/${species.slug}`),
    },
  };
}

export default async function TeamDexPokemonPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const detail = getDexPokemonDetailPageData(slug, resolvedSearchParams);
  if (!detail) {
    notFound();
  }

  return <DexPokemonDetailScreen detail={detail} />;
}
