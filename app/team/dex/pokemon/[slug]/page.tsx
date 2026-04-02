import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DexPokemonDetailScreen } from "@/components/team/screens/DexPokemonDetailScreen";
import { getBuilderPageData } from "@/lib/builderPageData";
import { normalizeName } from "@/lib/domain/names";
import { absoluteUrl } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getBuilderPageData();
  const species =
    data.speciesCatalog.find((entry) => entry.slug === slug) ??
    data.speciesCatalog.find((entry) => normalizeName(entry.name) === slug);

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

export default async function TeamDexPokemonPage({ params }: PageProps) {
  const { slug } = await params;
  const data = getBuilderPageData();
  const exists = data.speciesCatalog.some((entry) => entry.slug === slug || normalizeName(entry.name) === slug);

  if (!exists) {
    notFound();
  }

  return <DexPokemonDetailScreen slug={slug} />;
}
