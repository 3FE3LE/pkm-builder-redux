import { Suspense } from "react";

import { TeamEditorRoute } from "@/components/team/TeamEditorRoute";
import { TeamWorkspace } from "@/components/team/TeamApp";

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
