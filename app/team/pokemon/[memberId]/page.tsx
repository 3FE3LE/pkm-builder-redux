import type { Metadata } from "next";
import { Suspense } from "react";

import { TeamEditorRoute } from "@/components/team/TeamEditorRoute";
import { TeamWorkspace } from "@/components/team/TeamApp";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Edit Team Member",
  description: "Editor de Pokemon dentro del team builder.",
  alternates: {
    canonical: absoluteUrl("/team"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TeamPokemonPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;

  return (
    <>
      <Suspense fallback={null}>
        <TeamWorkspace />
      </Suspense>
      <Suspense fallback={null}>
        <TeamEditorRoute key={`team-editor-page-${memberId}`} memberId={memberId} closeMode="replace" />
      </Suspense>
    </>
  );
}
