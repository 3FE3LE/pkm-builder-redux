"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  useBuilderController,
  type BuilderController,
} from "@/components/BuilderController";
import type { BuilderDataProps } from "@/hooks/types";

type BuilderContextValue = BuilderController;

const SessionContext = createContext<BuilderContextValue["session"] | null>(null);
const CatalogsContext = createContext<BuilderContextValue["catalogs"] | null>(null);
const OnboardingContext = createContext<BuilderContextValue["onboarding"] | null>(null);
const TeamContext = createContext<BuilderContextValue["team"] | null>(null);
const AnalysisContext = createContext<BuilderContextValue["analysis"] | null>(null);
const CompareContext = createContext<BuilderContextValue["compare"] | null>(null);
const MovePickerContext = createContext<BuilderContextValue["movePicker"] | null>(null);
const EvolutionContext = createContext<BuilderContextValue["evolution"] | null>(null);

export function BuilderProvider({
  children,
  ...data
}: BuilderDataProps & { children: ReactNode }) {
  const controller = useBuilderController(data);

  return (
    <SessionContext.Provider value={controller.session}>
      <CatalogsContext.Provider value={controller.catalogs}>
        <OnboardingContext.Provider value={controller.onboarding}>
          <TeamContext.Provider value={controller.team}>
            <AnalysisContext.Provider value={controller.analysis}>
              <CompareContext.Provider value={controller.compare}>
                <MovePickerContext.Provider value={controller.movePicker}>
                  <EvolutionContext.Provider value={controller.evolution}>
                    {children}
                  </EvolutionContext.Provider>
                </MovePickerContext.Provider>
              </CompareContext.Provider>
            </AnalysisContext.Provider>
          </TeamContext.Provider>
        </OnboardingContext.Provider>
      </CatalogsContext.Provider>
    </SessionContext.Provider>
  );
}

export function useTeamSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useTeamSession must be used within BuilderProvider");
  }
  return context;
}

export function useTeamCatalogs() {
  const context = useContext(CatalogsContext);
  if (!context) {
    throw new Error("useTeamCatalogs must be used within BuilderProvider");
  }
  return context;
}

export function useTeamOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useTeamOnboarding must be used within BuilderProvider");
  }
  return context;
}

export function useTeamRoster() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeamRoster must be used within BuilderProvider");
  }
  return context;
}

export function useTeamAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useTeamAnalysis must be used within BuilderProvider");
  }
  return context;
}

export function useTeamCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useTeamCompare must be used within BuilderProvider");
  }
  return context;
}

export function useTeamMovePicker() {
  const context = useContext(MovePickerContext);
  if (!context) {
    throw new Error("useTeamMovePicker must be used within BuilderProvider");
  }
  return context;
}

export function useTeamEvolution() {
  const context = useContext(EvolutionContext);
  if (!context) {
    throw new Error("useTeamEvolution must be used within BuilderProvider");
  }
  return context;
}
