import { AppLoadingScreen } from "@/components/ui/AppLoadingScreen";

export default function TeamDexPokemonLoading() {
  return (
    <AppLoadingScreen
      label="Abriendo ficha"
      detail="Cargando datos de especie, evoluciones y learnset."
    />
  );
}
