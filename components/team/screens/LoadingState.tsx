"use client";

import { AppLoadingScreen } from "@/components/ui/AppLoadingScreen";

export function LoadingState() {
  return (
    <AppLoadingScreen
      label="Cargando builder"
      detail="Rehidratando el estado persistido del equipo, checkpoint y flags del run."
    />
  );
}
