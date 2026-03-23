"use client";

import { useEffect, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AnimatePresence, motion } from "motion/react";

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import { PokemonEditorSheet } from "@/components/team/EditorSheet";
import {
  CheckpointCopilotSection,
  CompareWorkspaceSection,
  IvCalculatorSection,
  PreferencesSection,
  TeamAnalysisSection,
  BuilderHeader,
  RunOpsSection,
  TeamRosterSection,
} from "@/components/team/LayoutSections";
import {
  EvolutionModal,
} from "@/components/team/Modals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createEditable } from "@/lib/builderStore";
import {
  useTeamAnalysis,
  useTeamCatalogs,
  useTeamCompare,
  useTeamEvolution,
  useTeamMovePicker,
  useTeamRoster,
  useTeamSession,
} from "@/components/BuilderProvider";
import { milestones, starters } from "@/lib/builder";

export function ActiveScreen() {
  const [workspaceTab, setWorkspaceTab] = useState<"builder" | "copilot" | "compare" | "run" | "ivcalc" | "settings">("builder");
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [compareDropPulse, setCompareDropPulse] = useState<{ slot: 0 | 1; token: number } | null>(null);
  const session = useTeamSession();
  const catalogs = useTeamCatalogs();
  const team = useTeamRoster();
  const analysis = useTeamAnalysis();
  const compare = useTeamCompare();
  const movePicker = useTeamMovePicker();
  const evolution = useTeamEvolution();

  function assignCompareFromRoster(slot: 0 | 1, memberId: string) {
    const rosterMember = team.currentTeam.find((member) => member.id === memberId);
    if (!rosterMember) {
      return;
    }

    compare.actions.updateMember(slot, { ...rosterMember, id: crypto.randomUUID() });
  }

  function assignCompareFromRosterFirstEmpty(memberId: string) {
    const emptySlot = compare.members.findIndex((member) => !member.species.trim());
    assignCompareFromRoster((emptySlot === 1 ? 1 : 0) as 0 | 1, memberId);
    setWorkspaceTab("compare");
  }

  function clearCompareMember(slot: 0 | 1) {
    compare.actions.updateMember(slot, createEditable());
  }

  function handleWorkspaceDragStart(event: DragStartEvent) {
    setDraggedMemberId(String(event.active.id));
  }

  function handleWorkspaceDragCancel(_: DragCancelEvent) {
    setDraggedMemberId(null);
  }

  function handleWorkspaceDragEnd(event: DragEndEvent) {
    setDraggedMemberId(null);
    const overId = typeof event.over?.id === "string" ? event.over.id : null;
    if (overId === "compare-slot-0" || overId === "compare-slot-1") {
      const slot = (overId === "compare-slot-1" ? 1 : 0) as 0 | 1;
      assignCompareFromRoster(slot, String(event.active.id));
      setCompareDropPulse({ slot, token: Date.now() });
      setWorkspaceTab("compare");
      return;
    }

    team.actions.handleDragEnd(event);
  }

  const draggedMember = draggedMemberId
    ? team.currentTeam.find((member) => member.id === draggedMemberId)
    : null;
  const draggedResolved = draggedMemberId
    ? team.resolvedTeam.find((member) => member.key === draggedMemberId)
    : undefined;
  const starterLine = starters[session.starter].stageSpecies;
  const starterMember = team.resolvedTeam.find((member) =>
    starterLine.includes(member.species),
  );

  useEffect(() => {
    if (!compareDropPulse) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setCompareDropPulse(null);
    }, 520);
    return () => window.clearTimeout(timeoutId);
  }, [compareDropPulse]);

  return (
    <main className="relative overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl"
      >
        <BuilderHeader
          milestoneId={analysis.contextualMilestoneId}
          milestones={milestones}
          localTime={team.localTime}
        />

        <DndContext
          sensors={team.sensors}
          collisionDetection={closestCenter}
          onDragStart={handleWorkspaceDragStart}
          onDragCancel={handleWorkspaceDragCancel}
          onDragEnd={handleWorkspaceDragEnd}
        >
          <TeamRosterSection
            currentTeam={team.currentTeam}
            resolvedTeam={team.resolvedTeam}
            roleSnapshot={analysis.checkpointRisk.roleSnapshot}
            battleWeather={session.battleWeather}
            evolvingIds={team.evolvingIds}
            activeMemberKey={team.activeMember?.key}
            onSelectMember={team.actions.selectMember}
            onEditMember={team.actions.editMember}
            onToggleMemberLock={(id) =>
              team.actions.updateMember(id, (current) => ({
                ...current,
                locked: !current.locked,
              }))
            }
            onRemoveMember={team.actions.removeMember}
            onAddMember={team.actions.addMember}
            onAssignToCompare={assignCompareFromRosterFirstEmpty}
          />

          <section className="mt-3">
            <Tabs
              value={workspaceTab}
              onValueChange={(value) => setWorkspaceTab(value as "builder" | "copilot" | "compare" | "run" | "ivcalc" | "settings")}
              className="gap-0"
            >
              <TabsList className="relative z-10 -mb-px grid w-full grid-cols-3 gap-1 bg-transparent p-0 sm:flex sm:h-auto sm:flex-wrap sm:items-end">
                <TabsTrigger
                  value="builder"
                  className="min-w-0 rounded-t-[0.95rem] rounded-b-none border border-line border-b-line bg-surface-3 px-2 py-2 text-[11px] leading-tight text-muted transition-all hover:bg-surface-5 data-active:border-line data-active:border-b-tab-seam data-active:bg-tab-active data-active:text-primary-soft data-active:shadow-[0_-1px_0_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.14)] sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  Team
                </TabsTrigger>
                <TabsTrigger
                  value="copilot"
                  className="min-w-0 rounded-t-[0.95rem] rounded-b-none border border-line border-b-line bg-surface-3 px-2 py-2 text-[11px] leading-tight text-muted transition-all hover:bg-surface-5 data-active:border-line data-active:border-b-tab-seam data-active:bg-tab-active data-active:text-primary-soft data-active:shadow-[0_-1px_0_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.14)] sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  Checkpoint
                </TabsTrigger>
                <TabsTrigger
                  value="run"
                  className="min-w-0 rounded-t-[0.95rem] rounded-b-none border border-line border-b-line bg-surface-3 px-2 py-2 text-[11px] leading-tight text-muted transition-all hover:bg-surface-5 data-active:border-line data-active:border-b-tab-seam data-active:bg-tab-active data-active:text-primary-soft data-active:shadow-[0_-1px_0_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.14)] sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  Ruta
                </TabsTrigger>
                <TabsTrigger
                  value="compare"
                  className="min-w-0 rounded-t-[0.95rem] rounded-b-none border border-line border-b-line bg-surface-3 px-2 py-2 text-[11px] leading-tight text-muted transition-all hover:bg-surface-5 data-active:border-line data-active:border-b-tab-seam data-active:bg-tab-active data-active:text-primary-soft data-active:shadow-[0_-1px_0_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.14)] sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  Compare
                </TabsTrigger>
                <TabsTrigger
                  value="ivcalc"
                  className="min-w-0 rounded-t-[0.95rem] rounded-b-none border border-line border-b-line bg-surface-3 px-2 py-2 text-[11px] leading-tight text-muted transition-all hover:bg-surface-5 data-active:border-line data-active:border-b-tab-seam data-active:bg-tab-active data-active:text-primary-soft data-active:shadow-[0_-1px_0_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.14)] sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  IV Calc
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="min-w-0 rounded-t-[0.95rem] rounded-b-none border border-line border-b-line bg-surface-3 px-2 py-2 text-[11px] leading-tight text-muted transition-all hover:bg-surface-5 data-active:border-line data-active:border-b-tab-seam data-active:bg-tab-active data-active:text-primary-soft data-active:shadow-[0_-1px_0_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.14)] sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="rounded-[0_1rem_1rem_1rem] p-0">
                <TeamAnalysisSection
                  averageStats={analysis.averageStats}
                  coveredCoverage={analysis.coveredCoverage}
                  uncoveredCoverage={analysis.uncoveredCoverage}
                  defensiveSections={analysis.defensiveSections}
                />
              </TabsContent>

              <TabsContent value="copilot" className="rounded-[0_1rem_1rem_1rem] p-0">
                <CheckpointCopilotSection
                  activeMember={team.activeMember}
                  activeRoleRecommendation={analysis.checkpointRisk.roleSnapshot.members.find(
                    (entry) => entry.key === team.activeMember?.key,
                  )}
                  teamSize={team.currentTeam.filter((member) => member.species.trim()).length}
                  milestoneId={analysis.contextualMilestoneId}
                  starterMember={starterMember}
                  checkpointRisk={analysis.checkpointRisk}
                  copilotSupportsRecommendations={analysis.copilotSupportsRecommendations}
                  supportsContextualSwaps={analysis.supportsContextualSwaps}
                  nextEncounter={analysis.nextEncounter}
                  swapOpportunities={analysis.swapOpportunities}
                  captureRecommendations={analysis.captureRecommendations}
                  speedTiers={analysis.speedTiers}
                  recommendation={analysis.recommendation}
                  moveRecommendations={analysis.moveRecommendations}
                />
              </TabsContent>

              <TabsContent value="run" className="rounded-[0_1rem_1rem_1rem] p-0">
                <RunOpsSection
                  activeMember={team.activeMember}
                  encounterCatalog={catalogs.encounterCatalog}
                  completedEncounterIds={session.completedEncounterIds}
                  speciesCatalog={catalogs.speciesCatalog}
                  starterKey={session.starter}
                  sourceCards={analysis.sourceCards}
                  moveHighlights={catalogs.moveHighlights}
                  onToggleEncounter={session.actions.toggleEncounterCompleted}
                />
              </TabsContent>
              <TabsContent value="compare" className="rounded-[0_1rem_1rem_1rem] p-0">
                <CompareWorkspaceSection
                  members={compare.members}
                  resolvedMembers={compare.resolvedMembers}
                  speciesCatalog={catalogs.speciesCatalog}
                  abilityCatalog={catalogs.abilityCatalog}
                  itemCatalog={catalogs.itemCatalog}
                  battleWeather={session.battleWeather}
                  dropPulse={compareDropPulse}
                  onChangeMember={compare.actions.updateMember}
                  onClearMember={clearCompareMember}
                />
              </TabsContent>
              <TabsContent value="ivcalc" className="rounded-[0_1rem_1rem_1rem] p-0">
                <IvCalculatorSection
                  speciesCatalog={catalogs.speciesCatalog}
                  pokemonIndex={catalogs.pokemonIndex}
                  onAddPreparedMember={team.actions.addPreparedMember}
                />
              </TabsContent>
              <TabsContent value="settings" className="rounded-[0_1rem_1rem_1rem] p-0">
                <PreferencesSection
                  evolutionConstraints={session.evolutionConstraints}
                  recommendationFilters={session.recommendationFilters}
                  battleWeather={session.battleWeather}
                  onToggleEvolutionConstraint={session.actions.setEvolutionConstraint}
                  onToggleRecommendationFilter={session.actions.setRecommendationFilter}
                  onSetBattleWeather={session.actions.setBattleWeather}
                  onResetRun={team.actions.resetRun}
                />
              </TabsContent>
            </Tabs>
          </section>
          <DragOverlay>
            {draggedMember ? (
              <motion.div
                initial={{ scale: 0.945, opacity: 0.76, filter: "saturate(0.88) blur(0.4px)" }}
                animate={{
                  scale: [0.945, 0.915, 0.925],
                  opacity: [0.76, 0.96, 0.98],
                  filter: [
                    "saturate(0.88) blur(0.4px)",
                    "saturate(1) blur(0px)",
                    "saturate(1) blur(0px)",
                  ],
                  y: [0, -2, 0],
                }}
                transition={{
                  duration: 0.22,
                  times: [0, 0.55, 1],
                  ease: "easeOut",
                }}
              >
                <RosterDragOverlay member={draggedMember} resolved={draggedResolved} />
              </motion.div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <AnimatePresence>
          {evolution.state ? (
            <EvolutionModal
              open
              currentSpecies={evolution.state.currentSpecies}
              currentSpriteUrl={evolution.state.currentSpriteUrl}
              currentAnimatedSpriteUrl={evolution.state.currentAnimatedSpriteUrl}
              nextOptions={evolution.state.nextOptions}
              selectedNext={evolution.state.selectedNext}
              onSelectNext={evolution.actions.select}
              onClose={evolution.actions.close}
              onComplete={evolution.actions.confirm}
            />
          ) : null}
        </AnimatePresence>

        <PokemonEditorSheet
          member={team.editorMember}
          resolved={team.editorResolved}
          weather={session.battleWeather}
          roleRecommendation={analysis.checkpointRisk.roleSnapshot.members.find(
            (entry) => entry.key === team.editorMember?.id,
          )}
          speciesCatalog={catalogs.speciesCatalog}
          abilityCatalog={catalogs.abilityCatalog}
          itemCatalog={catalogs.itemCatalog}
          onOpenChange={(open) => {
            if (!open) {
              movePicker.actions.close();
              team.actions.closeEditor();
            }
          }}
          onChange={(next) => team.actions.updateMember(next.id, next)}
          onOpenMoveModal={team.actions.openMovePickerForEditor}
          onRemoveMoveAt={team.actions.removeMoveFromEditorAt}
          onReorderMove={team.actions.reorderMovesForEditor}
          onRequestEvolution={team.actions.requestEvolution}
          editorEvolutionEligibility={team.editorEvolutionEligibility}
          selectedMoveIndex={team.editorMoveSelection}
          onSelectMoveIndex={team.actions.setEditorMoveSelection}
          movePickerMemberId={movePicker.memberId}
          movePickerSlotIndex={movePicker.slotIndex}
          movePickerTab={movePicker.tab}
          movePickerActiveMember={movePicker.activeMember}
          currentMoves={
            team.currentTeam.find((member) => member.id === movePicker.memberId)?.moves ?? []
          }
          onMovePickerTabChange={movePicker.actions.setTab}
          onCloseMovePicker={movePicker.actions.close}
          onPickMove={movePicker.actions.pickMove}
          getMoveSurfaceStyle={movePicker.getSurfaceStyle}
        />
      </motion.section>
    </main>
  );
}

function RosterDragOverlay({
  member,
  resolved,
}: {
  member: { species: string; nickname: string; level: number };
  resolved?: {
    species?: string;
    resolvedTypes?: string[];
    spriteUrl?: string | null;
    animatedSpriteUrl?: string | null;
  };
}) {
  const types = resolved?.resolvedTypes ?? [];

  return (
    <div className="w-[17rem] rounded-[1rem] border border-[rgba(185,255,102,0.44)] bg-[linear-gradient(180deg,rgba(12,33,41,0.96),rgba(8,20,24,0.96))] p-3 shadow-[0_22px_65px_rgba(0,0,0,0.36)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="display-face truncate text-base text-text">
            {member.nickname || resolved?.species || member.species || "Pokemon"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {resolved?.species || member.species || "slot pendiente"} · Lv {member.level}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {types.length ? types.map((type) => <TypeBadge key={`drag-${type}`} type={type} />) : null}
          </div>
        </div>
        <PokemonSprite
          species={resolved?.species ?? member.species ?? "Pokemon"}
          spriteUrl={resolved?.spriteUrl ?? undefined}
          animatedSpriteUrl={resolved?.animatedSpriteUrl ?? undefined}
          size="default"
          chrome="plain"
        />
      </div>
    </div>
  );
}
