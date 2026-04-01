import type { Metadata } from "next";
import { Suspense } from "react";

import { TeamWorkspace } from "@/components/team/screens/TeamWorkspace";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Team Workspace",
  description:
    "Arma y ajusta tu roster para Blaze Black 2 Redux y Volt White 2 Redux con analisis de cobertura, roles y checkpoints.",
  keywords: [
    ...siteConfig.keywords,
    "pokemon redux team workspace",
    "blaze black 2 redux roster planner",
    "volt white 2 redux team analysis",
  ],
  alternates: {
    canonical: absoluteUrl("/team"),
  },
};

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <TeamWorkspace />
    </Suspense>
  );
}
