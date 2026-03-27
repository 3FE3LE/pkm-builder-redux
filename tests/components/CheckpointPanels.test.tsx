import { describe, expect, it } from "vitest";

import { CheckpointIntelligencePanel } from "@/components/team/CheckpointIntelligencePanel";
import { CheckpointMapPanel } from "@/components/team/CheckpointMapPanel";
import {
  CheckpointIntelligencePanel as ExportedCheckpointIntelligencePanel,
  CheckpointMapPanel as ExportedCheckpointMapPanel,
  RecommendedCapturesPanel as ExportedRecommendedCapturesPanel,
  RunPathPanel as ExportedRunPathPanel,
} from "@/components/team/CheckpointPanels";
import { RecommendedCapturesPanel } from "@/components/team/RecommendedCapturesPanel";
import { RunPathPanel } from "@/components/team/RunPathPanel";

describe("CheckpointPanels", () => {
  it("re-exports the checkpoint panel components", () => {
    expect(ExportedCheckpointIntelligencePanel).toBe(CheckpointIntelligencePanel);
    expect(ExportedCheckpointMapPanel).toBe(CheckpointMapPanel);
    expect(ExportedRecommendedCapturesPanel).toBe(RecommendedCapturesPanel);
    expect(ExportedRunPathPanel).toBe(RunPathPanel);
  });
});
