"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams, useSelectedLayoutSegment } from "next/navigation";
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

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import { CheckpointCopilotSection } from "@/components/team/checkpoints/CheckpointCopilotSection";
import { AddMemberSheet } from "@/components/team/collection/AddMemberSheet";
import { PcBoxSection } from "@/components/team/collection/PcBoxSection";
import {
  EvolutionModal,
} from "@/components/team/Modals";
import { BuilderHeader } from "@/components/team/workspace/BuilderHeader";
import { TeamAnalysisSection } from "@/components/team/workspace/TeamAnalysisSection";
import { TeamRosterSection } from "@/components/team/workspace/TeamRosterSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
type WorkspaceTab = (typeof WORKSPACE_TABS)[number];

export function TeamWorkspaceScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const editorSegment = useSelectedLayoutSegment("editor");
  const searchParams = useSearchParams();
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
  const editorOpen = pathname.startsWith("/team/pokemon/") || editorSegment !== null;
  const pcSectionRef = useRef<HTMLElement | null>(null);
  const previousPcIdsRef = useRef<string[]>([]);

  function buildTeamHref(nextPath: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("editorNonce", String(Date.now()));
    const query = nextParams.toString();
    return query ? `${nextPath}?${query}` : nextPath;
  }

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
  const activeCompositionName =
    team.compositions.find((composition) => composition.id === team.activeCompositionId)?.name ??
    "Roster del equipo";
  const pcMembers = team.pcBoxIds
    .map((memberId) => team.pokemonLibrary.find((member) => member.id === memberId))
    .filter((member): member is (typeof team.pokemonLibrary)[number] => Boolean(member));

  useEffect(() => {
    const previousPcIds = previousPcIdsRef.current;
    const nextPcIds = team.pcBoxIds;
    const addedMemberId = nextPcIds.find((memberId) => !previousPcIds.includes(memberId)) ?? null;

    if (addedMemberId) {
      setPcPulseMemberId(addedMemberId);
      window.setTimeout(() => setPcPulseMemberId((current) => (current === addedMemberId ? null : current)), 500);
    }

    previousPcIdsRef.current = nextPcIds;
  }, [team.pcBoxIds]);

  function handleCreateFromDex(species: string) {
    const created = createEditable(species);
    const result = team.actions.addPreparedMember(created);
    if (!result.ok) {
      return;
    }

    setAddMemberOpen(false);
    router.push(buildTeamHref(`/team/pokemon/${created.id}`));
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
            onEditMember={(id) => {
              team.actions.editMember(id);
              router.push(buildTeamHref(`/team/pokemon/${id}`));
            }}
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

              window.setTimeout(() => {
                pcSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 120);
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

          <section className="mt-3">
            <Tabs
              value={workspaceTab}
              onValueChange={(value) => setWorkspaceTab(value as WorkspaceTab)}
              className="gap-0"
            >
              <TabsList className="tab-strip scrollbar-thin">
                <TabsTrigger
                  value="builder"
                  className="tab-trigger-soft"
                >
                  Team
                </TabsTrigger>
                <TabsTrigger
                  value="copilot"
                  className="tab-trigger-soft"
                >
                  Checkpoint
                </TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="tab-panel">
                {workspaceTab === "builder" ? (
                  <TeamAnalysisSection
                    averageStats={analysis.averageStats}
                    coveredCoverage={analysis.coveredCoverage}
                    uncoveredCoverage={analysis.uncoveredCoverage}
                    defensiveSections={analysis.defensiveSections}
                    checkpointRisk={analysis.checkpointRisk}
                    teamSize={team.currentTeam.filter((member) => member.species.trim()).length}
                    captureRecommendations={analysis.captureRecommendations}
                    nextEncounter={analysis.nextEncounter}
                    speciesCatalog={catalogs.speciesCatalog}
                    onSendCaptureToIvCalc={openIvCalcForSpecies}
                  />
                ) : null}
              </TabsContent>

              <TabsContent value="copilot" className="tab-panel">
                {workspaceTab === "copilot" ? (
                  <CheckpointCopilotSection
                    activeMember={team.activeMember}
                    teamSize={team.currentTeam.filter((member) => member.species.trim()).length}
                    milestoneId={analysis.contextualMilestoneId}
                    checkpointRisk={analysis.checkpointRisk}
                    supportsContextualSwaps={analysis.supportsContextualSwaps}
                    nextEncounter={analysis.nextEncounter}
                    swapOpportunities={analysis.swapOpportunities}
                    captureRecommendations={analysis.captureRecommendations}
                    moveRecommendations={analysis.moveRecommendations}
                    sourceCards={analysis.sourceCards}
                    encounterCatalog={catalogs.encounterCatalog}
                    completedEncounterIds={session.completedEncounterIds}
                    speciesCatalog={catalogs.speciesCatalog}
                    itemCatalog={catalogs.itemCatalog}
                    starterKey={session.starter}
                    onToggleEncounter={session.actions.toggleEncounterCompleted}
                    onSendCaptureToIvCalc={openIvCalcForSpecies}
                  />
                ) : null}
              </TabsContent>
            </Tabs>
          </section>
          <AddMemberSheet
            open={addMemberOpen}
            libraryMembers={team.pokemonLibrary}
            activeTeamIds={team.currentTeam.map((member) => member.id)}
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
                <RosterDragOverlay member={draggedMember} resolved={draggedResolved} />
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
            pulseMemberId={pcPulseMemberId}
            onOpenEditor={(memberId) => {
              team.actions.editMember(memberId);
              router.push(buildTeamHref(`/team/pokemon/${memberId}`));
            }}
            onAssignToComposition={(memberId, compositionId) => {
              team.actions.addLibraryMemberToComposition(memberId, compositionId);
            }}
            onImportToPc={team.actions.saveMemberToPc}
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
    <div className="w-[17rem] rounded-[1rem] border border-primary-line-emphasis bg-[var(--sheet-surface-bg)] p-3 shadow-[0_22px_65px_rgba(0,0,0,0.36)]">
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
