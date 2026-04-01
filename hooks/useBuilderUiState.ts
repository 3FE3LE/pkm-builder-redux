"use client";

import { useState, useSyncExternalStore } from "react";

import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

import { createEditable } from "@/lib/builderStore";
import type { StarterKey } from "@/lib/builder";

import type {
  CompareMembers,
  EvolutionState,
  MoveModalTab,
  MovePickerState,
} from "@/hooks/types";

export type BuilderLocalTime = {
  hour24: number;
  period: "day" | "night";
  phase: "dawn" | "day" | "dusk" | "night";
  label: string;
  ready: boolean;
};

const DEFAULT_LOCAL_TIME = {
  hour24: 12,
  period: "day",
  phase: "day",
  label: "--:-- --",
  ready: false,
} satisfies BuilderLocalTime;

function readLocalTime(): BuilderLocalTime {
  const now = new Date();
  const hour24 = now.getHours();
  const period = hour24 >= 6 && hour24 < 18 ? "day" : "night";
  const phase =
    hour24 >= 5 && hour24 < 7
      ? "dawn"
      : hour24 >= 7 && hour24 < 18
        ? "day"
        : hour24 >= 18 && hour24 < 20
          ? "dusk"
          : "night";

  return {
    hour24,
    period,
    phase,
    label: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(now),
    ready: true,
  } as const;
}

let cachedLocalTimeSnapshot: BuilderLocalTime = DEFAULT_LOCAL_TIME;

function subscribeToLocalTime(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const intervalId = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(intervalId);
}

function getLocalTimeSnapshot() {
  const next = readLocalTime();
  if (
    cachedLocalTimeSnapshot.ready &&
    cachedLocalTimeSnapshot.hour24 === next.hour24 &&
    cachedLocalTimeSnapshot.phase === next.phase &&
    cachedLocalTimeSnapshot.period === next.period &&
    cachedLocalTimeSnapshot.label === next.label
  ) {
    return cachedLocalTimeSnapshot;
  }

  cachedLocalTimeSnapshot = next;
  return cachedLocalTimeSnapshot;
}

function getLocalTimeServerSnapshot() {
  return DEFAULT_LOCAL_TIME;
}

export function useBuilderUiState() {
  const [movePickerState, setMovePickerState] = useState<MovePickerState | null>(null);
  const [moveModalTab, setMoveModalTab] = useState<MoveModalTab>("levelUp");
  const [expandedMoveKey, setExpandedMoveKey] = useState<string | null>(null);
  const [editorMoveSelection, setEditorMoveSelection] = useState<number | null>(null);
  const [evolvingIds, setEvolvingIds] = useState<Record<string, boolean>>({});
  const [compareMembers, setCompareMembers] = useState<CompareMembers>([
    createEditable(),
    createEditable(),
  ]);
  const [evolutionState, setEvolutionState] = useState<EvolutionState | null>(null);
  const [onboardingSelection, setOnboardingSelection] = useState<StarterKey | null>(null);
  const [onboardingModalStarter, setOnboardingModalStarter] = useState<StarterKey | null>(null);
  const [onboardingNickname, setOnboardingNickname] = useState("");
  const localTime = useSyncExternalStore(
    subscribeToLocalTime,
    getLocalTimeSnapshot,
    getLocalTimeServerSnapshot,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  return {
    movePickerState,
    moveModalTab,
    expandedMoveKey,
    editorMoveSelection,
    evolvingIds,
    compareMembers,
    evolutionState,
    onboardingSelection,
    onboardingModalStarter,
    onboardingNickname,
    localTime,
    sensors,
    setMovePickerState,
    setMoveModalTab,
    setExpandedMoveKey,
    setEditorMoveSelection,
    setEvolvingIds,
    setCompareMembers,
    setEvolutionState,
    setOnboardingSelection,
    setOnboardingModalStarter,
    setOnboardingNickname,
    resetOnboardingState() {
      setOnboardingSelection(null);
      setOnboardingModalStarter(null);
      setOnboardingNickname("");
    },
  };
}
