"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  OnboardingScreen,
} from "@/components/onboarding/OnboardingScreen";
import { LoadingScreen } from "@/components/team/LoadingScreen";
import { RouteHintScreen } from "@/components/team/RouteHintScreen";
import { BuilderProvider, useTeamSession } from "@/components/BuilderProvider";
import type { BuilderDataProps } from "@/hooks/types";

function RedirectToTeam() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/team");
  }, [router]);

  return <LoadingScreen />;
}

function BuilderOnboardingGate() {
  const session = useTeamSession();

  if (!session.hydrated) {
    return <LoadingScreen />;
  }

  if (session.builderStarted) {
    return <RedirectToTeam />;
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
