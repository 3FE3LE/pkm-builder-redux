import { AppLoadingScreen } from "@/components/ui/AppLoadingScreen";

export default function RootLoading() {
  return (
    <AppLoadingScreen
      fullscreen
      label="Cargando Redux Builder"
      detail="Sincronizando run, pokedex y herramientas."
    />
  );
}
