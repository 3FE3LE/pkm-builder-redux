"use client";

import {
  ActiveScreen,
} from "@/components/team/ActiveScreen";
import { LoadingScreen } from "@/components/team/LoadingScreen";
import { RouteHintScreen } from "@/components/team/RouteHintScreen";
import { BuilderProvider, useTeamSession } from "@/components/BuilderProvider";
import type { BuilderDataProps } from "@/hooks/types";

function BuilderAppGate() {
  const session = useTeamSession();

  if (!session.hydrated) {
    return <LoadingScreen />;
  }

  if (!session.builderStarted) {
    return (
      <RouteHintScreen
        title="No hay run activo"
        description="Primero necesitas elegir un inicial para crear el equipo."
        ctaHref="/onboarding"
        ctaLabel="Ir a onboarding"
      />
    );
  }

  return (
    <ActiveScreen />
  );
}

export function BuilderApp(props: BuilderDataProps) {
  return (
    <BuilderProvider {...props}>
      <BuilderAppGate />
    </BuilderProvider>
  );
}
