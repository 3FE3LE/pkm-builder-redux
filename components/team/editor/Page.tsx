"use client";

import { ViewTransition, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, GitCompareArrows, RotateCcw } from "lucide-react";
import { motion } from "motion/react";

import { DefenseSection } from "@/components/team/editor/DefenseSection";
import { Header } from "@/components/team/editor/Header";
import { LevelUpMoveModal } from "@/components/team/editor/LevelUpMoveModal";
import { MovePickerModal } from "@/components/team/editor/MovePickerModal";
import { MovesSection } from "@/components/team/editor/MovesSection";
import { ProfileSection } from "@/components/team/editor/ProfileSection";
import { StatsSection } from "@/components/team/editor/StatsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/Button";
import { ActionDock } from "@/components/team/workspace/roster/ActionDock";
import { SelectedMemberInsightCard } from "@/components/team/workspace/roster/SelectedMemberInsightCard";
import { SlotModals, type ResetFields } from "@/components/team/workspace/roster/SlotModals";
import { EvolutionModal } from "@/components/team/workspace/EvolutionModal";
import { editableMemberSchema } from "@/lib/builderForm";
import type { EditableMember } from "@/lib/builderStore";
import { createEditable } from "@/lib/builderStore";
import type { BattleWeather } from "@/lib/domain/battle";
import { getEvolutionLineBaseSpecies } from "@/lib/domain/evolutionLine";
import {
  buildEvolutionEligibility,
  type EvolutionConstraintPreferences,
  type EvolutionEligibility,
  type EvolutionTimeContext,
} from "@/lib/domain/evolutionEligibility";
import {
  getLevelUpMovesBetweenLevels,
  mergeLevelUpMoveQueues,
  type LevelUpMoveEntry,
} from "@/lib/domain/levelUpMoves";
import { getAvailableFormsForSpecies } from "@/lib/forms";
import { buildMemberLens } from "@/lib/domain/memberLens";
import { normalizeName } from "@/lib/domain/names";
import type { MemberRoleRecommendation } from "@/lib/domain/roleAnalysis";
import { getTeamEditorTransitionName } from "@/lib/teamEditorViewTransition";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import { useSafeTransitionTypes } from "@/lib/viewTransitions";

import type {
  AbilityCatalogEntry,
  ItemCatalogEntry,
  SpeciesCatalogEntry,
} from "@/components/team/editor/types";

type EditorPageProps = {
  member: EditableMember;
  resolved?: ResolvedTeamMember;
  weather: BattleWeather;
  roleRecommendation?: MemberRoleRecommendation;
  moveRecommendations: MoveRecommendation[];
  starterSpeciesLine: string[];
  speciesCatalog: SpeciesCatalogEntry[];
  abilityCatalog: AbilityCatalogEntry[];
  itemCatalog: ItemCatalogEntry[];
  pokemonIndex: Record<string, { name?: string; nextEvolutions?: string[] }>;
  resolvedTeam: ResolvedTeamMember[];
  onChange: (next: EditableMember) => void;
  onImportToPc: (member: EditableMember) => boolean;
  onOpenMoveModal: (slotIndex: number | null) => void;
  onRemoveMoveAt: (index: number) => void;
  onReorderMove: (fromIndex: number, toIndex: number) => void;
  onRequestEvolution: () => void;
  onToggleLock: () => void;
  onAssignToCompare: () => void;
  previousMemberHref?: string;
  previousMemberLabel?: string;
  nextMemberHref?: string;
  nextMemberLabel?: string;
  editorEvolutionEligibility: EvolutionEligibility[];
  selectedMoveIndex: number | null;
  onSelectMoveIndex: (index: number | null) => void;
  movePickerMemberId: string | null;
  movePickerSlotIndex: number | null;
  movePickerTab: "levelUp" | "machines";
  movePickerActiveMember?: ResolvedTeamMember;
  currentMoves: string[];
  onMovePickerTabChange: (tab: "levelUp" | "machines") => void;
  onCloseMovePicker: () => void;
  onPickMove: (moveName: string) => void;
  getMoveSurfaceStyle: (type?: string | null) => React.CSSProperties | undefined;
  dexDetailHref?: string;
  dexSpeciesSlug?: string;
  evolutionState: {
    currentSpecies: string;
    currentSpriteUrl?: string;
    currentAnimatedSpriteUrl?: string;
    nextOptions: {
      species: string;
      spriteUrl?: string;
      animatedSpriteUrl?: string;
      eligible?: boolean;
      reasons?: string[];
    }[];
    selectedNext: string | null;
  } | null;
  localTime: EvolutionTimeContext;
  evolutionConstraints: EvolutionConstraintPreferences;
  onAutoRequestEvolution: (projectedResolved: ResolvedTeamMember) => void;
  onSelectEvolution: (species: string) => void;
  onCloseEvolution: () => void;
  onConfirmEvolution: (species: string) => void;
};

type MoveRecommendation = ReturnType<
  typeof import("@/lib/domain/moveRecommendations").getMoveRecommendations
>[number];

export function EditorPage({
  member,
  resolved,
  weather,
  roleRecommendation,
  moveRecommendations,
  starterSpeciesLine,
  speciesCatalog,
  abilityCatalog,
  itemCatalog,
  pokemonIndex,
  resolvedTeam,
  onChange,
  onImportToPc,
  onOpenMoveModal,
  onRemoveMoveAt,
  onReorderMove,
  onRequestEvolution,
  onToggleLock,
  onAssignToCompare,
  previousMemberHref,
  previousMemberLabel,
  nextMemberHref,
  nextMemberLabel,
  editorEvolutionEligibility,
  selectedMoveIndex,
  onSelectMoveIndex,
  movePickerMemberId,
  movePickerSlotIndex,
  movePickerTab,
  movePickerActiveMember,
  currentMoves,
  onMovePickerTabChange,
  onCloseMovePicker,
  onPickMove,
  getMoveSurfaceStyle,
  dexDetailHref,
  dexSpeciesSlug,
  evolutionState,
  localTime,
  evolutionConstraints,
  onAutoRequestEvolution,
  onSelectEvolution,
  onCloseEvolution,
  onConfirmEvolution,
}: EditorPageProps) {
  const [editorTab, setEditorTab] = useState<"stats" | "moves" | "typing">("stats");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [levelUpQueue, setLevelUpQueue] = useState<LevelUpMoveEntry[]>([]);
  const [pendingEvolutionPrompt, setPendingEvolutionPrompt] = useState<{
    species: string;
    level: number;
  } | null>(null);
  const [resetFields, setResetFields] = useState<ResetFields>({
    evolutionLine: false,
    nickname: true,
    level: true,
    gender: true,
    nature: true,
    ability: true,
    item: true,
    moves: true,
    ivs: true,
    evs: true,
  });

  const currentLevel = Number(member.level ?? 1);
  const currentSpecies = String(member.species ?? "");
  const formOptions = getAvailableFormsForSpecies(currentSpecies);
  const parsedValues = editableMemberSchema.safeParse(member);
  const issues = parsedValues.success ? [] : parsedValues.error.issues;
  const getIssue = (path: string) =>
    issues.find((issue) => issue.path.join(".") === path)?.message;
  const canRequestEvolution = editorEvolutionEligibility.some((entry) => entry.eligible);
  const evolutionBlockReason =
    !canRequestEvolution && editorEvolutionEligibility.length
      ? editorEvolutionEligibility
          .flatMap((entry) => entry.reasons.slice(0, 2))
          .filter(Boolean)
          .slice(0, 2)
          .join(" · ")
      : undefined;
  const currentNature = String(member.nature ?? "Serious");
  const currentAbility = String(member.ability ?? "");
  const currentItem = String(member.item ?? "");
  const backTransition = useSafeTransitionTypes(["editor-back"]);
  const starterLens = useMemo(
    () =>
      resolved && starterSpeciesLine.includes(resolved.species)
        ? buildMemberLens(resolved)
        : null,
    [resolved, starterSpeciesLine],
  );
  const evolutionLineBaseSpecies = useMemo(() => {
    return getEvolutionLineBaseSpecies({
      species: currentSpecies,
      speciesCatalog,
      pokemonIndex,
    });
  }, [currentSpecies, pokemonIndex, speciesCatalog]);

  function maybeOpenPendingEvolution(nextQueueLength: number) {
    if (!pendingEvolutionPrompt) {
      return;
    }
    if (pendingEvolutionPrompt.species !== currentSpecies || currentLevel < pendingEvolutionPrompt.level) {
      setPendingEvolutionPrompt(null);
      return;
    }
    if (nextQueueLength > 0 || evolutionState || !canRequestEvolution) {
      return;
    }

    onRequestEvolution();
    setPendingEvolutionPrompt(null);
  }

  function updateEditorMember(
    updater: (current: EditableMember) => EditableMember,
  ) {
    const next = updater(member);
    const nextLevel = Number(next.level ?? currentLevel);
    const speciesChanged = next.species !== member.species;
    const unlockedMoves =
      !speciesChanged &&
      nextLevel > currentLevel &&
      resolved?.learnsets?.levelUp?.length
        ? getLevelUpMovesBetweenLevels({
            learnset: resolved.learnsets.levelUp,
            currentMoves: member.moves,
            fromLevel: currentLevel,
            toLevel: nextLevel,
          })
        : [];
    if (speciesChanged) {
      setLevelUpQueue([]);
      setPendingEvolutionPrompt(null);
    }
    if (unlockedMoves.length) {
      setLevelUpQueue((currentQueue) => mergeLevelUpMoveQueues(currentQueue, unlockedMoves));
      setEditorTab("moves");
    }
    if (!speciesChanged && nextLevel > currentLevel) {
      if (unlockedMoves.length) {
        setPendingEvolutionPrompt({
          species: member.species,
          level: nextLevel,
        });
      } else {
        setPendingEvolutionPrompt(null);
      }
    }
    if (!speciesChanged && nextLevel < currentLevel) {
      setPendingEvolutionPrompt(null);
    }
    const parsed = editableMemberSchema.safeParse(next);
    onChange(parsed.success ? parsed.data : next);
    if (
      !speciesChanged &&
      nextLevel > currentLevel &&
      unlockedMoves.length === 0 &&
      shouldAutoPromptEvolution({
        currentResolved: resolved,
        nextMember: next,
        nextLevel,
        resolvedTeam,
        localTime,
        evolutionConstraints,
        editorEvolutionEligibility,
      })
    ) {
      const projectedResolved = projectResolvedMemberForEvolution({
        currentResolved: resolved,
        nextMember: next,
        nextLevel,
      });
      window.setTimeout(() => {
        if (projectedResolved) {
          onAutoRequestEvolution(projectedResolved);
        }
      }, 0);
    }
  }

  function advanceLevelUpQueue() {
    setLevelUpQueue((currentQueue) => {
      const nextQueue = currentQueue.slice(1);
      maybeOpenPendingEvolution(nextQueue.length);
      return nextQueue;
    });
  }

  function handleCloseLevelUpModal() {
    setLevelUpQueue([]);
    maybeOpenPendingEvolution(0);
  }

  function handleSkipLevelUpMove() {
    advanceLevelUpQueue();
  }

  function handleLearnLevelUpMove() {
    const queuedMove = levelUpQueue[0];
    if (!queuedMove || member.moves.includes(queuedMove.move) || member.moves.length >= 4) {
      advanceLevelUpQueue();
      return;
    }

    onChange({
      ...member,
      moves: [...member.moves, queuedMove.move],
    });
    advanceLevelUpQueue();
  }

  function handleReplaceLevelUpMove(slotIndex: number) {
    const queuedMove = levelUpQueue[0];
    if (!queuedMove || !member.moves[slotIndex]) {
      return;
    }

    const nextMoves = [...member.moves];
    nextMoves[slotIndex] = queuedMove.move;
    onChange({
      ...member,
      moves: nextMoves,
    });
    advanceLevelUpQueue();
  }

  function resetSelectedMember() {
    const resetSpecies = resetFields.evolutionLine ? evolutionLineBaseSpecies : member.species;
    const defaults = createEditable(resetSpecies);
    defaults.id = member.id;
    defaults.locked = member.locked;
    defaults.nickname = resetSpecies;
    setLevelUpQueue([]);
    setPendingEvolutionPrompt(null);

    onChange({
      ...member,
      species: resetSpecies,
      nickname: resetFields.nickname ? defaults.nickname : member.nickname,
      level: resetFields.level ? defaults.level : member.level,
      gender: resetFields.gender ? defaults.gender : member.gender,
      nature: resetFields.nature ? defaults.nature : member.nature,
      ability: resetFields.ability ? defaults.ability : member.ability,
      item: resetFields.item ? defaults.item : member.item,
      moves: resetFields.moves ? defaults.moves : member.moves,
      ivs: resetFields.ivs ? defaults.ivs : member.ivs,
      evs: resetFields.evs ? defaults.evs : member.evs,
    });
    setResetOpen(false);
  }

  return (
    <main className="relative overflow-visible px-4 py-5 sm:px-6 lg:px-8">
      {previousMemberHref ? (
        <Link
          href={previousMemberHref}
          transitionTypes={backTransition}
          aria-label={previousMemberLabel ?? "Pokemon anterior"}
          className="app-icon-button app-floating-icon-button fixed left-1.5 top-1/2 z-30 h-11 w-11 -translate-y-1/2 hover:border-warning-line hover:bg-surface-3 sm:left-2"
          style={{ left: "max(0.375rem, env(safe-area-inset-left))" }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {nextMemberHref ? (
        <Link
          href={nextMemberHref}
          transitionTypes={backTransition}
          aria-label={nextMemberLabel ?? "Pokemon siguiente"}
          className="app-icon-button app-floating-icon-button fixed right-1.5 top-1/2 z-30 h-11 w-11 -translate-y-1/2 hover:border-warning-line hover:bg-surface-3 sm:right-2"
          style={{ right: "max(0.375rem, env(safe-area-inset-right))" }}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
      <section className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/team"
            transitionTypes={backTransition}
            className="app-icon-button app-floating-icon-button hidden gap-2 px-3 py-2 text-sm hover:border-warning-line hover:bg-surface-3 lg:inline-flex"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al team
          </Link>
          <div className="hidden items-center gap-2 lg:flex">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setResetOpen(true)}
              aria-label="Resetear slot seleccionado"
              className="size-9 rounded-[0.9rem] border border-danger-line-soft bg-surface-4 text-danger hover:bg-danger-fill"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onAssignToCompare}
              aria-label="Comparar slot seleccionado"
              className="size-9 rounded-[0.9rem] border border-line bg-surface-4 text-muted hover:bg-surface-8"
            >
              <GitCompareArrows className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ViewTransition name={getTeamEditorTransitionName("card", member.id)}>
          <section className="panel panel-frame overflow-hidden">
            <Header
              member={member}
              resolved={resolved}
              currentSpecies={currentSpecies}
              currentLevel={currentLevel}
              currentGender={member.gender}
              currentShiny={Boolean(member.shiny)}
              getIssue={getIssue}
              hasEvolution={canRequestEvolution}
              evolutionBlockReason={evolutionBlockReason}
              updateEditorMember={updateEditorMember}
              onRequestEvolution={onRequestEvolution}
              transitionMemberId={member.id}
              dexDetailHref={dexDetailHref}
              dexSpeciesSlug={dexSpeciesSlug}
            />

            <div className="space-y-4 px-4 pb-8 sm:space-y-5 sm:px-5 sm:pb-10">
              <ProfileSection
                member={member}
                resolved={resolved}
                abilityCatalog={abilityCatalog}
                itemCatalog={itemCatalog}
                currentSpecies={currentSpecies}
                formOptions={formOptions}
                currentNature={currentNature}
                currentAbility={currentAbility}
                currentItem={currentItem}
                updateEditorMember={updateEditorMember}
                getIssue={getIssue}
                onImportToPc={onImportToPc}
              />
              <Tabs
                value={editorTab}
                onValueChange={(value) => setEditorTab(value as "stats" | "moves" | "typing")}
                className="gap-0"
              >
                <TabsList className="tab-strip scrollbar-thin">
                  <TabsTrigger value="stats" className="tab-trigger-soft">Stats</TabsTrigger>
                  <TabsTrigger value="moves" className="tab-trigger-soft">Moves</TabsTrigger>
                  <TabsTrigger value="typing" className="tab-trigger-soft">Typing</TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="tab-panel">
                  {editorTab === "stats" ? (
                    <StatsSection
                      member={member}
                      resolved={resolved}
                      roleRecommendation={roleRecommendation}
                      currentLevel={currentLevel}
                      currentNature={currentNature}
                      currentAbility={currentAbility}
                      currentItem={currentItem}
                      weather={weather}
                      abilityCatalog={abilityCatalog}
                      itemCatalog={itemCatalog}
                      hasEvolution={Boolean(resolved?.nextEvolutions?.length)}
                      getIssue={getIssue}
                      updateEditorMember={updateEditorMember}
                    />
                  ) : null}
                </TabsContent>

                <TabsContent value="moves" className="tab-panel">
                  {editorTab === "moves" ? (
                    <MovesSection
                      currentMoves={member.moves}
                      resolved={resolved}
                      selectedMoveIndex={selectedMoveIndex}
                      onSelectMoveIndex={onSelectMoveIndex}
                      onOpenMoveModal={onOpenMoveModal}
                      onRemoveMoveAt={onRemoveMoveAt}
                      onReorderMove={onReorderMove}
                    />
                  ) : null}
                </TabsContent>

                <TabsContent value="typing" className="tab-panel">
                  {editorTab === "typing" ? <DefenseSection resolved={resolved} /> : null}
                </TabsContent>
              </Tabs>

              {movePickerMemberId === member.id && movePickerActiveMember ? (
                <MovePickerModal
                  member={movePickerActiveMember}
                  currentMoves={currentMoves}
                  slotIndex={movePickerSlotIndex}
                  tab={movePickerTab}
                  weather={weather}
                  onTabChange={onMovePickerTabChange}
                  onClose={onCloseMovePicker}
                  onPickMove={onPickMove}
                  getMoveSurfaceStyle={getMoveSurfaceStyle}
                />
              ) : null}
              <LevelUpMoveModal
                open={levelUpQueue.length > 0}
                member={resolved}
                currentMoves={member.moves}
                weather={weather}
                queuedMoves={levelUpQueue}
                onClose={handleCloseLevelUpModal}
                onLearn={handleLearnLevelUpMove}
                onSkip={handleSkipLevelUpMove}
                onReplace={handleReplaceLevelUpMove}
              />
            </div>
          </section>
        </ViewTransition>

        {resolved && detailsOpen ? (
          <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+6.1rem)] z-40 md:hidden">
            <SelectedMemberInsightCard
              member={resolved}
              roleRecommendation={roleRecommendation}
              moveRecommendations={moveRecommendations}
              starterLens={starterLens}
              onClose={() => setDetailsOpen(false)}
            />
          </div>
        ) : null}

        <motion.div
          initial={{ x: "-50%", y: 28, opacity: 0 }}
          animate={{ x: "-50%", y: 0, opacity: 1 }}
          exit={{ x: "-50%", y: 28, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="mobile-roster-action-dock mobile-roster-action-dock-editor-open flex md:hidden"
        >
          <ActionDock
            buttonSize="mobile"
            selectedMember={member}
            detailsOpen={detailsOpen}
            editorOpen
            closeHref="/team"
            onToggleDetails={() => setDetailsOpen((current) => !current)}
            onOpenReset={() => setResetOpen(true)}
            onToggleLock={onToggleLock}
            onAssignToCompare={onAssignToCompare}
            onOpenDelete={() => {}}
            onCloseEditor={() => {}}
          />
        </motion.div>

        <SlotModals
          selectedMember={member}
          resetOpen={resetOpen}
          deleteOpen={false}
          resetFields={resetFields}
          onCloseReset={() => setResetOpen(false)}
          onCloseDelete={() => {}}
          onToggleResetField={(field, checked) =>
            setResetFields((current) => ({
              ...current,
              [field]: checked,
            }))
          }
          onToggleAllResetFields={(checked) =>
            setResetFields((current) =>
              Object.fromEntries(
                Object.keys(current).map((key) => [key, checked]),
              ) as ResetFields,
            )
          }
          onApplyReset={resetSelectedMember}
          onConfirmDelete={() => {}}
          onConfirmRelease={() => {}}
        />
        {evolutionState ? (
          <EvolutionModal
            open
            currentSpecies={evolutionState.currentSpecies}
            currentSpriteUrl={evolutionState.currentSpriteUrl}
            currentAnimatedSpriteUrl={evolutionState.currentAnimatedSpriteUrl}
            nextOptions={evolutionState.nextOptions}
            selectedNext={evolutionState.selectedNext}
            onSelectNext={onSelectEvolution}
            onClose={onCloseEvolution}
            onComplete={onConfirmEvolution}
          />
        ) : null}
      </section>
    </main>
  );
}

function shouldAutoPromptEvolution({
  currentResolved,
  nextMember,
  nextLevel,
  resolvedTeam,
  localTime,
  evolutionConstraints,
  editorEvolutionEligibility,
}: {
  currentResolved?: ResolvedTeamMember;
  nextMember: EditableMember;
  nextLevel: number;
  resolvedTeam: ResolvedTeamMember[];
  localTime: EvolutionTimeContext;
  evolutionConstraints: EvolutionConstraintPreferences;
  editorEvolutionEligibility: EvolutionEligibility[];
}) {
  if (editorEvolutionEligibility.some((entry) => entry.eligible)) {
    return true;
  }

  return editorEvolutionEligibility.some((entry) => {
    if (!entry.reasons.length) {
      return false;
    }

    const levelRequirements = entry.reasons
      .map((reason) => reason.match(/^Requiere Lv (\d+)$/)?.[1])
      .filter((value): value is string => Boolean(value))
      .map((value) => Number(value));

    return (
      levelRequirements.length > 0 &&
      levelRequirements.length === entry.reasons.length &&
      levelRequirements.some((requiredLevel) => nextLevel >= requiredLevel)
    );
  }) || buildEvolutionEligibility(
    projectResolvedMemberForEvolution({
      currentResolved,
      nextMember,
      nextLevel,
    }),
    resolvedTeamWithProjectedMember({
      resolvedTeam,
      currentResolved,
      nextMember,
      nextLevel,
    }),
    localTime,
    evolutionConstraints,
  ).some((entry) => entry.eligible);
}

function projectResolvedMemberForEvolution({
  currentResolved,
  nextMember,
  nextLevel,
}: {
  currentResolved?: ResolvedTeamMember;
  nextMember: EditableMember;
  nextLevel: number;
}) {
  if (!currentResolved?.nextEvolutions?.length) {
    return undefined;
  }

  return {
    ...currentResolved,
    level: nextLevel,
    gender: nextMember.gender,
    ability: nextMember.ability,
    item: nextMember.item,
    moves: nextMember.moves.map((moveName) => {
      const existingMove = currentResolved.moves.find(
        (move) => normalizeName(move.name) === normalizeName(moveName),
      );
      return existingMove ?? { name: moveName };
    }),
  } satisfies ResolvedTeamMember;
}

function resolvedTeamWithProjectedMember({
  resolvedTeam,
  currentResolved,
  nextMember,
  nextLevel,
}: {
  resolvedTeam: ResolvedTeamMember[];
  currentResolved?: ResolvedTeamMember;
  nextMember: EditableMember;
  nextLevel: number;
}) {
  const projectedMember = projectResolvedMemberForEvolution({
    currentResolved,
    nextMember,
    nextLevel,
  });
  if (!projectedMember || !currentResolved) {
    return resolvedTeam;
  }

  return resolvedTeam.some((entry) => entry.key === currentResolved.key)
    ? resolvedTeam.map((entry) =>
        entry.key === currentResolved.key ? projectedMember : entry,
      )
    : [...resolvedTeam, projectedMember];
}
