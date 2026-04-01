"use client";

import clsx from "clsx";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import { ActionDock } from "@/components/team/workspace/roster/ActionDock";
import { SelectedMemberInsightCard } from "@/components/team/workspace/roster/SelectedMemberInsightCard";
import { SortableMemberCard } from "@/components/team/workspace/roster/SortableMemberCard";
import type { EditableMember } from "@/lib/builderStore";
import type { BattleWeather } from "@/lib/domain/battle";
import type { MemberRoleRecommendation } from "@/lib/domain/roleAnalysis";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

type TeamRoleSnapshot = ReturnType<typeof import("@/lib/domain/roleAnalysis").buildTeamRoleSnapshot>;
type MoveRecommendation = ReturnType<
  typeof import("@/lib/domain/moveRecommendations").getMoveRecommendations
>[number];
type StarterLens = ReturnType<typeof import("@/lib/domain/memberLens").buildMemberLens>;

export function RosterGrid({
  filledTeam,
  resolvedTeam,
  roleSnapshot,
  battleWeather,
  evolvingIds,
  activeMemberKey,
  hasActiveSelection,
  selectedMember,
  selectedResolved,
  detailsOpen,
  editorOpen,
  dockTone,
  activeRoleRecommendation,
  moveRecommendations,
  selectedStarterLens,
  onSelectMember,
  onAddMember,
  onToggleDetails,
  onOpenReset,
  onEditSelected,
  onToggleLockSelected,
  onAssignToCompareSelected,
  onOpenDelete,
  onCloseEditor,
}: {
  filledTeam: EditableMember[];
  resolvedTeam: ResolvedTeamMember[];
  roleSnapshot: TeamRoleSnapshot;
  battleWeather: BattleWeather;
  evolvingIds: Record<string, boolean>;
  activeMemberKey?: string;
  hasActiveSelection: boolean;
  selectedMember?: EditableMember;
  selectedResolved?: ResolvedTeamMember;
  detailsOpen: boolean;
  editorOpen: boolean;
  dockTone: React.CSSProperties;
  activeRoleRecommendation?: MemberRoleRecommendation;
  moveRecommendations: MoveRecommendation[];
  selectedStarterLens: StarterLens | null;
  onSelectMember: (id: string) => void;
  onAddMember: () => void;
  onToggleDetails: () => void;
  onOpenReset: () => void;
  onEditSelected: () => void;
  onToggleLockSelected: () => void;
  onAssignToCompareSelected: () => void;
  onOpenDelete: () => void;
  onCloseEditor: () => void;
}) {
  const desktopTopRow = filledTeam.slice(0, 3);
  const desktopBottomRow = filledTeam.slice(3, 6);

  function renderRosterCard(member: EditableMember, index: number) {
    return (
      <SortableMemberCard
        key={member.id}
        member={member}
        index={index}
        resolved={resolvedTeam.find((resolved) => resolved.key === member.id)}
        roleRecommendation={roleSnapshot.members.find((entry) => entry.key === member.id)}
        weather={battleWeather}
        isEvolving={Boolean(evolvingIds[member.id])}
        isSelected={activeMemberKey === member.id}
        hasActiveSelection={hasActiveSelection}
        onSelect={() => onSelectMember(member.id)}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 md:hidden">
        <SortableContext
          items={filledTeam.map((member) => member.id)}
          strategy={rectSortingStrategy}
        >
          {filledTeam.map((member, index) => renderRosterCard(member, index))}
        </SortableContext>

        {filledTeam.length < 6 ? (
          <AddMemberSlot onAddMember={onAddMember} />
        ) : null}
      </div>

      <div className="hidden md:block">
        <SortableContext
          items={filledTeam.map((member) => member.id)}
          strategy={rectSortingStrategy}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {desktopTopRow.map((member, index) => renderRosterCard(member, index))}
            </div>

            <AnimatePresence initial={false}>
              {selectedMember && !editorOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={clsx("overflow-hidden", selectedResolved && detailsOpen && "overflow-visible")}
                >
                  <motion.div
                    initial={{ y: -10, scale: 0.96 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: -10, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="relative flex justify-center"
                  >
                    <AnimatePresence initial={false}>
                      {selectedResolved && detailsOpen ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.97 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="absolute bottom-full left-1/2 z-20 mb-3 w-full max-w-[28rem] -translate-x-1/2 px-3"
                        >
                          <SelectedMemberInsightCard
                            member={selectedResolved}
                            roleRecommendation={activeRoleRecommendation}
                            moveRecommendations={moveRecommendations}
                            starterLens={selectedStarterLens}
                            onClose={onToggleDetails}
                          />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                    <div className="mobile-roster-action-dock roster-action-dock-desktop" style={dockTone}>
                      <ActionDock
                        buttonSize="desktop"
                        selectedMember={selectedMember}
                        detailsOpen={detailsOpen}
                        editorOpen={editorOpen}
                        onToggleDetails={onToggleDetails}
                        onOpenReset={onOpenReset}
                        onEdit={onEditSelected}
                        onToggleLock={onToggleLockSelected}
                        onAssignToCompare={onAssignToCompareSelected}
                        onOpenDelete={onOpenDelete}
                        onCloseEditor={onCloseEditor}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="grid grid-cols-3 gap-3">
              {desktopBottomRow.map((member, index) => renderRosterCard(member, index + 3))}
              {filledTeam.length < 6 ? (
                <AddMemberSlot onAddMember={onAddMember} />
              ) : null}
            </div>
          </div>
        </SortableContext>
      </div>
    </>
  );
}

function AddMemberSlot({
  onAddMember,
}: {
  onAddMember: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAddMember}
      className="panel-tint-faint group flex min-h-40 flex-col items-center justify-center rounded-[1rem] border border-dashed border-line-emphasis p-5 text-center transition duration-200 hover:border-primary-line-emphasis hover:bg-primary-fill"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-[0.875rem] border border-line-soft bg-surface-3 transition group-hover:scale-[1.03] group-hover:border-primary-line-emphasis">
        <Plus className="h-9 w-9 text-accent" />
      </div>
    </button>
  );
}
