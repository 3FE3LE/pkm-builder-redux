import { test, assert } from "vitest";

import { getBuilderViewState } from "../../lib/domain/builderViewState";

test("team route enables team-core calculations but not compare-only work", () => {
  assert.deepEqual(getBuilderViewState("/team", "builder", null), {
    isWorkspaceRoute: true,
    needsTeamCore: true,
    needsCopilotAnalysis: false,
    needsCaptureRecommendations: true,
    needsCompareResolution: false,
  });
});

test("copilot tab enables copilot calculations", () => {
  assert.deepEqual(getBuilderViewState("/team", "copilot", null), {
    isWorkspaceRoute: true,
    needsTeamCore: true,
    needsCopilotAnalysis: true,
    needsCaptureRecommendations: true,
    needsCompareResolution: false,
  });
});

test("compare tool route only enables compare resolution", () => {
  assert.deepEqual(getBuilderViewState("/team/tools", null, "compare"), {
    isWorkspaceRoute: false,
    needsTeamCore: false,
    needsCopilotAnalysis: false,
    needsCaptureRecommendations: false,
    needsCompareResolution: true,
  });
});

test("compositions tool route does not enable compare resolution", () => {
  assert.deepEqual(getBuilderViewState("/team/tools", null, "compositions"), {
    isWorkspaceRoute: false,
    needsTeamCore: false,
    needsCopilotAnalysis: false,
    needsCaptureRecommendations: false,
    needsCompareResolution: false,
  });
});
