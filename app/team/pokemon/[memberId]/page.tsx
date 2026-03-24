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
      <TeamWorkspace />
      <TeamEditorRoute key={`team-editor-page-${memberId}`} memberId={memberId} closeMode="replace" />
    </>
  );
}
