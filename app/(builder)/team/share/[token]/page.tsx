import type { Metadata } from "next";
import { Suspense } from "react";

import { WorkspaceRoute } from "@/components/team/screens/WorkspaceRoute";
import { getBuilderPageData } from "@/lib/builderPageData";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import { inspectPokemonTransfer } from "@/lib/pokemonTransfer";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const shared = inspectPokemonTransfer(token);

  if (!shared) {
    return {
      title: "Pokemon compartido",
      description: "Importa este Pokemon directamente en tu caja del builder.",
    };
  }

  const data = getBuilderPageData();
  const speciesMeta = data.speciesCatalog.find((entry) => normalizeName(entry.name) === normalizeName(shared.species));
  const sprites = buildSpriteUrls(shared.species, speciesMeta?.dex, { shiny: shared.shiny });
  const title = `${shared.nickname || shared.species} · ${shared.species}`;
  const description = [
    `Lv. ${shared.level}`,
    shared.ability ? `Habilidad: ${shared.ability}` : "",
    shared.item ? `Item: ${shared.item}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const ogImage = absoluteUrl(`/team/share/${token}/opengraph-image`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: absoluteUrl(`/team/share/${token}`),
    },
    other: sprites.spriteUrl ? { "og:image:secure_url": sprites.spriteUrl } : undefined,
  };
}

export default function TeamSharePage() {
  return (
    <Suspense fallback={null}>
      <WorkspaceRoute />
    </Suspense>
  );
}
