"use client";

import { LoadingScreen } from "@/components/team/LoadingScreen";
import { PreferencesSection } from "@/components/team/settings/PreferencesSection";
import { useTeamRoster, useTeamSession } from "@/components/BuilderProvider";

export function SettingsScreen() {
  const session = useTeamSession();
  const team = useTeamRoster();

  if (!session.hydrated) {
    return <LoadingScreen />;
  }

  return (
    <main className="relative overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <div className="mb-4">
          <p className="display-face text-sm text-accent">Settings</p>
          <h1 className="mt-2 text-2xl text-text">Preferencias del builder</h1>
        </div>
        <PreferencesSection
          evolutionConstraints={session.evolutionConstraints}
          recommendationFilters={session.recommendationFilters}
          battleWeather={session.battleWeather}
          theme={session.theme}
          onToggleEvolutionConstraint={session.actions.setEvolutionConstraint}
          onToggleRecommendationFilter={session.actions.setRecommendationFilter}
          onSetBattleWeather={session.actions.setBattleWeather}
          onSetTheme={session.actions.setTheme}
          onResetRun={team.actions.resetRun}
        />
      </section>
    </main>
  );
}
