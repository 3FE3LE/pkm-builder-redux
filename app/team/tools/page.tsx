import type { Metadata } from "next";
import { Suspense } from "react";

import { TeamToolsScreen } from "@/components/team/TeamToolsScreen";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Team Tools",
  description:
    "Herramientas del builder para comparar Pokemon, calcular IVs y revisar type tiers ofensivos y defensivos dentro de tu run de Blaze Black 2 Redux y Volt White 2 Redux.",
  keywords: [
    ...siteConfig.keywords,
    "pokemon compare tool",
    "pokemon iv calculator redux",
    "pokemon type tier list",
    "volt white 2 redux tools",
  ],
  alternates: {
    canonical: absoluteUrl("/team/tools"),
  },
};

export default function TeamToolsPage() {
  return (
    <Suspense fallback={null}>
      <TeamToolsScreen />
    </Suspense>
  );
}
