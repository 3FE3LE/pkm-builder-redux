export function getTeamEditorTransitionName(
  part: "card" | "sprite" | "title" | "types",
  memberId: string,
) {
  return `team-editor-${part}-${memberId}`;
}
