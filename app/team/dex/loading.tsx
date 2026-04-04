import { AppLoadingScreen } from "@/components/ui/AppLoadingScreen";

export default function TeamDexLoading() {
  return (
    <AppLoadingScreen
      label="Cargando Redux Dex"
      detail="Preparando la lista, filtros y navegacion de la dex."
    />
  );
}
