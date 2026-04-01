import { describe, expect, it } from "vitest";

import { MovePickerModal } from "@/components/team/editor/MovePickerModal";
import {
  EvolutionModal as ExportedEvolutionModal,
  MovePickerModal as ExportedMovePickerModal,
  OnboardingConfirmModal as ExportedOnboardingConfirmModal,
} from "@/components/team/Modals";
import { EvolutionModal } from "@/components/team/workspace/EvolutionModal";
import { OnboardingConfirmModal } from "@/components/onboarding/OnboardingConfirmModal";

describe("Modals", () => {
  it("re-exports the shared modal components", () => {
    expect(ExportedEvolutionModal).toBe(EvolutionModal);
    expect(ExportedMovePickerModal).toBe(MovePickerModal);
    expect(ExportedOnboardingConfirmModal).toBe(OnboardingConfirmModal);
  });
});
