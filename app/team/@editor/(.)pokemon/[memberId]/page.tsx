import { TeamEditorRoute } from "@/components/team/TeamEditorRoute";

export default async function TeamEditorModalPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;

  return <TeamEditorRoute key={`team-editor-modal-${memberId}`} memberId={memberId} closeMode="back" />;
}
