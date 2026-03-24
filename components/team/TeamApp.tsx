"use client";

import {
  ActiveScreen,
} from "@/components/team/ActiveScreen";
import { LoadingScreen } from "@/components/team/LoadingScreen";
import { RouteHintScreen } from "@/components/team/RouteHintScreen";
import { useTeamSession } from "@/components/BuilderProvider";

export function TeamWorkspace() {
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
