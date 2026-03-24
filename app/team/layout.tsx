import type { Metadata } from "next";

import { BuilderProvider } from "@/components/BuilderProvider";
import { getBuilderPageData } from "@/lib/builderPageData";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Team Builder",
  description:
    "Workspace principal para armar tu equipo de Blaze Black 2 Redux y Volt White 2 Redux con roster, checkpoints y analisis.",
  alternates: {
    canonical: absoluteUrl("/team"),
  },
};

export default function TeamLayout({
  children,
  editor,
}: {
  children: React.ReactNode;
  editor: React.ReactNode;
}) {
  const data = getBuilderPageData();

  return (
    <BuilderProvider {...data}>
      {children}
      {editor}
    </BuilderProvider>
  );
}
