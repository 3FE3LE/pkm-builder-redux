import { describe, expect, it } from "vitest";

import { IntelligencePanel as CheckpointIntelligencePanel } from "@/components/team/checkpoints/IntelligencePanel";
import { MapPanel as CheckpointMapPanel } from "@/components/team/checkpoints/MapPanel";
import {
  CheckpointIntelligencePanel as ExportedCheckpointIntelligencePanel,
  CheckpointMapPanel as ExportedCheckpointMapPanel,
  RecommendedCapturesPanel as ExportedRecommendedCapturesPanel,
  RunPathPanel as ExportedRunPathPanel,
} from "@/components/team/CheckpointPanels";
import { RecommendationsPanel as RecommendedCapturesPanel } from "@/components/team/checkpoints/RecommendationsPanel";
import { PathPanel as RunPathPanel } from "@/components/team/checkpoints/PathPanel";

describe("CheckpointPanels", () => {
  it("re-exports the checkpoint panel components", () => {
    expect(ExportedCheckpointIntelligencePanel).toBe(CheckpointIntelligencePanel);
    expect(ExportedCheckpointMapPanel).toBe(CheckpointMapPanel);
    expect(ExportedRecommendedCapturesPanel).toBe(RecommendedCapturesPanel);
    expect(ExportedRunPathPanel).toBe(RunPathPanel);
  });
});
