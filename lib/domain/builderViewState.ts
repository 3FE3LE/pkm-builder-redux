export type BuilderViewState = {
  isWorkspaceRoute: boolean;
  needsTeamCore: boolean;
  needsCopilotAnalysis: boolean;
  needsCaptureRecommendations: boolean;
  needsCompareResolution: boolean;
};

export function getBuilderViewState(
  pathname: string,
  workspaceTab: string | null | undefined,
  toolTab: string | null | undefined,
): BuilderViewState {
  const normalizedWorkspaceTab = workspaceTab ?? "builder";
  const normalizedToolTab = toolTab ?? "compare";
  const isWorkspaceRoute = pathname === "/team" || pathname.startsWith("/team/pokemon/");

  return {
    isWorkspaceRoute,
    needsTeamCore: isWorkspaceRoute,
    needsCopilotAnalysis: pathname === "/team" && normalizedWorkspaceTab === "copilot",
    needsCaptureRecommendations: pathname === "/team",
    needsCompareResolution: pathname === "/team/tools" && normalizedToolTab === "compare",
  };
}
