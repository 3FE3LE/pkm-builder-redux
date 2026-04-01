import { describe, expect, it } from "vitest";

import { IntelligencePanel } from "@/components/team/checkpoints/IntelligencePanel";
import { MapPanel } from "@/components/team/checkpoints/MapPanel";
import {
  IntelligencePanel as ExportedIntelligencePanel,
  MapPanel as ExportedMapPanel,
  RecommendationsPanel as ExportedRecommendationsPanel,
  PathPanel as ExportedPathPanel,
} from "@/components/team/checkpoints";
import { RecommendationsPanel } from "@/components/team/checkpoints/RecommendationsPanel";
import { PathPanel } from "@/components/team/checkpoints/PathPanel";

describe("Checkpoints Index", () => {
  it("re-exports the checkpoint components from the current barrel", () => {
    expect(ExportedIntelligencePanel).toBe(IntelligencePanel);
    expect(ExportedMapPanel).toBe(MapPanel);
    expect(ExportedRecommendationsPanel).toBe(RecommendationsPanel);
    expect(ExportedPathPanel).toBe(PathPanel);
  });
});
