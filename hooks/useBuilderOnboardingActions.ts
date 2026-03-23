"use client";

import { useRouter } from "next/navigation";
import { starters } from "@/lib/builder";

import type { BuilderActionDeps } from "@/hooks/actionTypes";

export function useBuilderOnboardingActions({
  store,
  ui,
}: BuilderActionDeps) {
  const router = useRouter();

  function openStarterConfirm(starterKey: keyof typeof starters) {
    ui.setOnboardingModalStarter(starterKey);
    ui.setOnboardingNickname("");
  }

  function cancelStarterConfirm() {
    ui.setOnboardingModalStarter(null);
    ui.setOnboardingNickname("");
  }

  function confirmStarterSelection() {
    if (!ui.onboardingModalStarter) {
      return;
    }

    ui.setOnboardingSelection(ui.onboardingModalStarter);
    window.setTimeout(() => {
      const starterKey = ui.onboardingModalStarter!;
      store.beginRun(
        starterKey,
        starters[starterKey].species,
        ui.onboardingNickname,
      );
      ui.resetOnboardingState();
      router.replace("/team");
    }, 420);
  }

  return {
    openStarterConfirm,
    cancelStarterConfirm,
    confirmStarterSelection,
  };
}
