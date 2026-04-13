"use client";

import {
  OnboardingScreen,
} from "@/components/onboarding/OnboardingScreen";
import { LoadingState } from "@/components/team/screens/LoadingState";
import { BuilderProvider, useTeamSession } from "@/components/BuilderProvider";
import type { BuilderDataProps } from "@/hooks/types";

function BuilderOnboardingGate() {
  const session = useTeamSession();

  if (!session.hydrated) {
    return <LoadingState />;
  }

  if (session.builderStarted) {
    return <LoadingState />;
  }

  return (
    <OnboardingScreen />
  );
}

export function BuilderOnboarding(props: BuilderDataProps) {
  return (
    <BuilderProvider {...props}>
      <BuilderOnboardingGate />
    </BuilderProvider>
  );
}
