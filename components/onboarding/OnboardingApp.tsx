"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  OnboardingScreen,
} from "@/components/onboarding/OnboardingScreen";
import { LoadingState } from "@/components/team/screens/LoadingState";
import { BuilderProvider, useTeamSession } from "@/components/BuilderProvider";
import type { BuilderDataProps } from "@/hooks/types";

function BuilderOnboardingGate() {
  const router = useRouter();
  const session = useTeamSession();

  useEffect(() => {
    if (!session.hydrated || !session.builderStarted) {
      return;
    }

    router.replace("/team");
  }, [router, session.builderStarted, session.hydrated]);

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
