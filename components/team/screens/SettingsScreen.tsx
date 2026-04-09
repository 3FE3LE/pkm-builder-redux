"use client";

import { redirect, useRouter } from "next/navigation";

import { LoadingState } from "@/components/team/screens/LoadingState";
import { TeamScreenHeader, TeamScreenShell } from "@/components/team/screens/ScreenShell";
import { PreferencesSection } from "@/components/team/settings/PreferencesSection";
import { useTeamRoster, useTeamSession } from "@/components/BuilderProvider";

export function SettingsScreen() {
  const router = useRouter();
  const session = useTeamSession();
  const team = useTeamRoster();

  if (!session.hydrated) {
    return <LoadingState />;
  }

  if (!session.builderStarted) {
    redirect("/onboarding");
  }

  return (
    <TeamScreenShell width="narrow">
      <TeamScreenHeader title="Settings">
        <p className="max-w-2xl text-sm text-muted">
          Ajusta tema, clima base y reglas que afectan recomendaciones y evolución.
        </p>
      </TeamScreenHeader>
      <PreferencesSection
        evolutionConstraints={session.evolutionConstraints}
        recommendationFilters={session.recommendationFilters}
        battleWeather={session.battleWeather}
        theme={session.theme}
        onToggleEvolutionConstraint={session.actions.setEvolutionConstraint}
        onToggleRecommendationFilter={session.actions.setRecommendationFilter}
        onSetBattleWeather={session.actions.setBattleWeather}
        onSetTheme={session.actions.setTheme}
        onResetRun={() => {
          team.actions.resetRun();
          router.replace("/onboarding");
        }}
      />
    </TeamScreenShell>
  );
}
