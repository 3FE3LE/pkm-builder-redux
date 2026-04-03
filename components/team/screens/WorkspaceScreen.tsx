"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AnimatePresence, motion } from "motion/react";
import { parseAsStringEnum, useQueryState } from "nuqs";

import { AddMemberSheet } from "@/components/team/collection/AddMemberSheet";
import { PcBoxSection } from "@/components/team/collection/PcBoxSection";
import { WorkspacePanels, type WorkspaceTab } from "@/components/team/screens/WorkspacePanels";
import { EvolutionModal } from "@/components/team/workspace/EvolutionModal";
import { BuilderHeader } from "@/components/team/workspace/BuilderHeader";
import { RosterSection } from "@/components/team/workspace/RosterSection";
import { DragOverlayCard } from "@/components/team/workspace/roster/DragOverlayCard";
import {
  useTeamAnalysis,
  useTeamCatalogs,
  useTeamCompare,
  useTeamEvolution,
  useTeamRoster,
  useTeamSession,
} from "@/components/BuilderProvider";
import { milestones, starters } from "@/lib/builder";
import { createEditable } from "@/lib/builderStore";

const WORKSPACE_TABS = ["builder", "copilot"] as const;

export function WorkspaceScreen() {
  const router = useRouter();
  const [workspaceTab, setWorkspaceTab] = useQueryState(
    "tab",
    parseAsStringEnum<WorkspaceTab>([...WORKSPACE_TABS]).withDefault("builder"),
  );
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [pcPulseMemberId, setPcPulseMemberId] = useState<string | null>(null);
  const session = useTeamSession();
  const catalogs = useTeamCatalogs();
  const team = useTeamRoster();
  const analysis = useTeamAnalysis();
  const compare = useTeamCompare();
  const evolution = useTeamEvolution();
  const editorOpen = false;
  const pcSectionRef = useRef<HTMLElement | null>(null);

  function closeTeamEditor() {
    team.actions.closeEditor();
    team.actions.clearSelection();
  }

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
    team.actions.clearSelection();
    router.push("/team/tools?tool=compare");
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
      return;
    }

    team.actions.handleDragEnd(event);
  }

  const draggedMember = useMemo(
    () => (draggedMemberId ? team.currentTeam.find((member) => member.id === draggedMemberId) : null),
    [draggedMemberId, team.currentTeam],
  );
  const draggedResolved = useMemo(
    () => (draggedMemberId ? team.resolvedTeam.find((member) => member.key === draggedMemberId) : undefined),
    [draggedMemberId, team.resolvedTeam],
  );
  const starterLine = starters[session.starter].stageSpecies;
  const starterMember = team.resolvedTeam.find((member) =>
    starterLine.includes(member.species),
  );
  const activeCompositionName =
    team.compositions.find((composition) => composition.id === team.activeCompositionId)?.name ??
    "Roster del equipo";
  const libraryById = useMemo(
    () => new Map(team.pokemonLibrary.map((member) => [member.id, member])),
    [team.pokemonLibrary],
  );
  const pcMembers = useMemo(
    () =>
      team.pcBoxIds
        .map((memberId) => libraryById.get(memberId))
        .filter((member): member is (typeof team.pokemonLibrary)[number] => Boolean(member)),
    [libraryById, team.pcBoxIds],
  );
  const analysisTeamSize = useMemo(
    () => team.currentTeam.reduce((count, member) => count + (member.species.trim() ? 1 : 0), 0),
    [team.currentTeam],
  );
  const activeTeamIds = useMemo(() => team.currentTeam.map((member) => member.id), [team.currentTeam]);
  const effectivePcPulseMemberId = pcPulseMemberId ?? team.pcBoxIds[0] ?? null;

  function pulsePcMember(memberId: string) {
    setPcPulseMemberId(memberId);
    window.setTimeout(() => {
      setPcPulseMemberId((current) => (current === memberId ? null : current));
    }, 500);
  }

  function handleCreateFromDex(species: string) {
    const created = createEditable(species);
    const result = team.actions.addPreparedMember(created);
    if (!result.ok) {
      return;
    }

    setAddMemberOpen(false);
    router.push(`/team/pokemon/${created.id}`);
  }

  function handleReuseLibraryMember(memberId: string) {
    const added = team.actions.addLibraryMemberToComposition(memberId);
    if (!added) {
      return;
    }

    setAddMemberOpen(false);
  }

  function openIvCalcForSpecies(species: string) {
    router.push(`/team/tools?tool=ivcalc&species=${encodeURIComponent(species)}`);
  }

  return (
    <main className="relative overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
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
          <RosterSection
            compositionName={activeCompositionName}
            currentTeam={team.currentTeam}
            resolvedTeam={team.resolvedTeam}
            roleSnapshot={analysis.checkpointRisk.roleSnapshot}
            battleWeather={session.battleWeather}
            evolvingIds={team.evolvingIds}
            activeMemberKey={team.activeMember?.key}
            activeRoleRecommendation={analysis.checkpointRisk.roleSnapshot.members.find(
              (entry) => entry.key === team.activeMember?.key,
            )}
            moveRecommendations={analysis.moveRecommendations}
            starterSpeciesLine={starterLine}
            editorOpen={editorOpen}
            onSelectMember={team.actions.selectMember}
            onToggleMemberLock={(id) => {
              team.actions.updateMember(id, (current) => ({
                ...current,
                locked: !current.locked,
              }));
              team.actions.clearSelection();
            }}
            onRemoveMember={(id) => {
              const moved = team.actions.removeMember(id);
              if (!moved) {
                return;
              }
              pulsePcMember(id);

              window.setTimeout(() => {
                pcSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 120);
            }}
            onReleaseMember={(id) => {
              team.actions.releaseMember(id);
            }}
            onAddMember={() => {
              setAddMemberOpen(true);
            }}
            onResetMember={(id, next) => {
              team.actions.updateMember(id, next);
            }}
            onAssignToCompare={assignCompareFromRosterFirstEmpty}
            onClearSelection={team.actions.clearSelection}
            onCloseEditor={closeTeamEditor}
          />

          <WorkspacePanels
            workspaceTab={workspaceTab}
            setWorkspaceTab={setWorkspaceTab}
            analysisTeamSize={analysisTeamSize}
            averageStats={analysis.averageStats}
            coveredCoverage={analysis.coveredCoverage}
            uncoveredCoverage={analysis.uncoveredCoverage}
            defensiveSections={analysis.defensiveSections}
            checkpointRisk={analysis.checkpointRisk}
            captureRecommendations={analysis.captureRecommendations}
            nextEncounter={analysis.nextEncounter}
            speciesCatalog={catalogs.speciesCatalog}
            onSendCaptureToIvCalc={openIvCalcForSpecies}
            activeMember={team.activeMember}
            supportsContextualSwaps={analysis.supportsContextualSwaps}
            swapOpportunities={analysis.swapOpportunities}
            moveRecommendations={analysis.moveRecommendations}
            sourceCards={analysis.sourceCards}
            encounterCatalog={catalogs.encounterCatalog}
            completedEncounterIds={session.completedEncounterIds}
            itemCatalog={catalogs.itemCatalog}
            starterKey={session.starter}
            onToggleEncounter={session.actions.toggleEncounterCompleted}
            contextualMilestoneId={analysis.contextualMilestoneId}
          />
          <AddMemberSheet
            open={addMemberOpen}
            libraryMembers={team.pokemonLibrary}
            activeTeamIds={activeTeamIds}
            speciesCatalog={catalogs.speciesCatalog}
            onClose={() => setAddMemberOpen(false)}
            onPickLibraryMember={handleReuseLibraryMember}
            onCreateFromDex={handleCreateFromDex}
          />
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
                <DragOverlayCard member={draggedMember} resolved={draggedResolved} />
              </motion.div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <section ref={pcSectionRef} className="mt-4">
          <PcBoxSection
            members={pcMembers}
            compositions={team.compositions}
            activeCompositionId={team.activeCompositionId}
            speciesCatalog={catalogs.speciesCatalog}
            pulseMemberId={effectivePcPulseMemberId}
            onOpenEditor={(memberId) => {
              router.push(`/team/pokemon/${memberId}`);
            }}
            onAssignToComposition={(memberId, compositionId) => {
              team.actions.addLibraryMemberToComposition(memberId, compositionId);
            }}
            onImportToPc={(member) => {
              const saved = team.actions.saveMemberToPc(member);
              if (saved) {
                pulsePcMember(member.id);
              }
              return saved;
            }}
          />
        </section>

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
      </section>
    </main>
  );
}
