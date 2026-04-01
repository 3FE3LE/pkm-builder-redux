"use client";

import clsx from "clsx";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import { SortableMemberCard } from "@/components/team/SortableMemberCard";
import { ActionDock } from "@/components/team/workspace/roster/ActionDock";
import { SelectedMemberInsightCard } from "@/components/team/workspace/roster/SelectedMemberInsightCard";
import { SlotModals, type ResetFields } from "@/components/team/workspace/roster/SlotModals";
import { buildMemberLens } from "@/lib/domain/memberLens";
import type { EditableMember } from "@/lib/builderStore";
import { createEditable } from "@/lib/builderStore";
import type { BattleWeather } from "@/lib/domain/battle";
import type { MemberRoleRecommendation } from "@/lib/domain/roleAnalysis";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import { TYPE_COLORS } from "@/lib/domain/typeChart";

type TeamRoleSnapshot = ReturnType<typeof import("@/lib/domain/roleAnalysis").buildTeamRoleSnapshot>;
type MoveRecommendation = ReturnType<
  typeof import("@/lib/domain/moveRecommendations").getMoveRecommendations
>[number];

export function RosterSection({
  compositionName,
  currentTeam,
  resolvedTeam,
  roleSnapshot,
  battleWeather,
  evolvingIds,
  activeMemberKey,
  activeRoleRecommendation,
  moveRecommendations,
  starterSpeciesLine,
  editorOpen,
  onSelectMember,
  onEditMember,
  onToggleMemberLock,
  onRemoveMember,
  onAddMember,
  onResetMember,
  onAssignToCompare,
  onClearSelection,
  onCloseEditor,
}: {
  compositionName?: string;
  currentTeam: EditableMember[];
  resolvedTeam: ResolvedTeamMember[];
  roleSnapshot: TeamRoleSnapshot;
  battleWeather: BattleWeather;
  evolvingIds: Record<string, boolean>;
  activeMemberKey?: string;
  activeRoleRecommendation?: MemberRoleRecommendation;
  moveRecommendations: MoveRecommendation[];
  starterSpeciesLine: string[];
  editorOpen: boolean;
  onSelectMember: (id: string) => void;
  onEditMember: (id: string) => void;
  onToggleMemberLock: (id: string) => void;
  onRemoveMember: (id: string) => void;
  onAddMember: () => void;
  onResetMember: (id: string, next: EditableMember) => void;
  onAssignToCompare: (memberId: string) => void;
  onClearSelection: () => void;
  onCloseEditor: () => void;
}) {
  const filledTeam = currentTeam.filter((member) => member.species.trim());
  const selectedMember = activeMemberKey
    ? filledTeam.find((member) => member.id === activeMemberKey)
    : undefined;
  const selectedResolved = activeMemberKey
    ? resolvedTeam.find((member) => member.key === activeMemberKey)
    : undefined;
  const selectedStarterLens =
    selectedResolved && starterSpeciesLine.includes(selectedResolved.species)
      ? buildMemberLens(selectedResolved)
      : null;
  const hasActiveSelection = Boolean(selectedMember);
  const desktopTopRow = filledTeam.slice(0, 3);
  const desktopBottomRow = filledTeam.slice(3, 6);
  const dockTone = getDockTone(selectedResolved?.resolvedTypes);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resetFields, setResetFields] = useState<ResetFields>({
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

  function resetSelectedMember() {
    if (!selectedMember) {
      return;
    }

    const defaults = createEditable(selectedMember.species);
    defaults.id = selectedMember.id;
    defaults.locked = selectedMember.locked;
    defaults.nickname = selectedMember.species;

    onResetMember(selectedMember.id, {
      ...selectedMember,
      nickname: resetFields.nickname ? defaults.nickname : selectedMember.nickname,
      level: resetFields.level ? defaults.level : selectedMember.level,
      gender: resetFields.gender ? defaults.gender : selectedMember.gender,
      nature: resetFields.nature ? defaults.nature : selectedMember.nature,
      ability: resetFields.ability ? defaults.ability : selectedMember.ability,
      item: resetFields.item ? defaults.item : selectedMember.item,
      moves: resetFields.moves ? defaults.moves : selectedMember.moves,
      ivs: resetFields.ivs ? defaults.ivs : selectedMember.ivs,
      evs: resetFields.evs ? defaults.evs : selectedMember.evs,
    });
    setResetOpen(false);
  }

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
    <section className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="display-face text-sm text-accent">
              {compositionName?.trim() || "Roster del equipo"}
            </p>
          </div>
        </div>
        <div className="hidden md:block" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:hidden">
        <SortableContext
          items={filledTeam.map((member) => member.id)}
          strategy={rectSortingStrategy}
        >
          {filledTeam.map((member, index) => renderRosterCard(member, index))}
        </SortableContext>

        {filledTeam.length < 6 ? (
          <button
            type="button"
            onClick={onAddMember}
            className="panel-tint-faint group flex min-h-40 flex-col items-center justify-center rounded-[1rem] border border-dashed border-line-emphasis p-5 text-center transition duration-200 hover:border-primary-line-emphasis hover:bg-primary-fill"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-[0.875rem] border border-line-soft bg-surface-3 transition group-hover:scale-[1.03] group-hover:border-primary-line-emphasis">
              <Plus className="h-9 w-9 text-accent" />
            </div>
          </button>
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
                            onClose={() => setDetailsOpen(false)}
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
                        onToggleDetails={() => setDetailsOpen((current) => !current)}
                        onOpenReset={() => setResetOpen(true)}
                        onEdit={() => onEditMember(selectedMember.id)}
                        onToggleLock={() => onToggleMemberLock(selectedMember.id)}
                        onAssignToCompare={() => onAssignToCompare(selectedMember.id)}
                        onOpenDelete={() => setDeleteOpen(true)}
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
                <button
                  type="button"
                  onClick={onAddMember}
                  className="panel-tint-faint group flex min-h-40 flex-col items-center justify-center rounded-[1rem] border border-dashed border-line-emphasis p-5 text-center transition duration-200 hover:border-primary-line-emphasis hover:bg-primary-fill"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-[0.875rem] border border-line-soft bg-surface-3 transition group-hover:scale-[1.03] group-hover:border-primary-line-emphasis">
                    <Plus className="h-9 w-9 text-accent" />
                  </div>
                </button>
              ) : null}
            </div>
          </div>
        </SortableContext>
      </div>

      <AnimatePresence initial={false}>
        {selectedMember ? (
          <>
            <AnimatePresence initial={false}>
              {selectedResolved && detailsOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={clsx(
                    "fixed inset-x-4 z-40 md:hidden",
                    editorOpen
                      ? "bottom-[calc(env(safe-area-inset-bottom)+6.1rem)]"
                      : "bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom)+5.8rem)]",
                  )}
                >
                  <SelectedMemberInsightCard
                    member={selectedResolved}
                    roleRecommendation={activeRoleRecommendation}
                    moveRecommendations={moveRecommendations}
                    starterLens={selectedStarterLens}
                    onClose={() => setDetailsOpen(false)}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
            <motion.div
              initial={{ x: "-50%", y: 28, opacity: 0 }}
              animate={{ x: "-50%", y: 0, opacity: 1 }}
              exit={{ x: "-50%", y: 28, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={clsx(
                "mobile-roster-action-dock flex md:hidden",
                editorOpen && "mobile-roster-action-dock-editor-open",
              )}
              style={dockTone}
            >
              <ActionDock
                buttonSize="mobile"
                selectedMember={selectedMember}
                detailsOpen={detailsOpen}
                editorOpen={editorOpen}
                onToggleDetails={() => setDetailsOpen((current) => !current)}
                onOpenReset={() => setResetOpen(true)}
                onEdit={() => onEditMember(selectedMember.id)}
                onToggleLock={() => onToggleMemberLock(selectedMember.id)}
                onAssignToCompare={() => onAssignToCompare(selectedMember.id)}
                onOpenDelete={() => setDeleteOpen(true)}
                onCloseEditor={onCloseEditor}
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
      <SlotModals
        selectedMember={selectedMember}
        resetOpen={resetOpen}
        deleteOpen={deleteOpen}
        resetFields={resetFields}
        onCloseReset={() => setResetOpen(false)}
        onCloseDelete={() => setDeleteOpen(false)}
        onToggleResetField={(field, checked) =>
          setResetFields((current) => ({
            ...current,
            [field]: checked,
          }))
        }
        onApplyReset={resetSelectedMember}
        onConfirmDelete={() => {
          if (!selectedMember) {
            return;
          }
          onRemoveMember(selectedMember.id);
          onClearSelection();
          setDeleteOpen(false);
        }}
      />
    </section>
  );
}

function getDockTone(types: string[] = []) {
  const primary = TYPE_COLORS[types[0] ?? ""] ?? "hsl(165 83% 65%)";
  const secondary = TYPE_COLORS[types[1] ?? types[0] ?? ""] ?? primary;

  return {
    backgroundImage: `
      radial-gradient(circle at 18% 18%, color-mix(in srgb, ${primary} 24%, transparent) 0%, transparent 34%),
      radial-gradient(circle at 82% 76%, color-mix(in srgb, ${secondary} 20%, transparent) 0%, transparent 38%),
      var(--dock-surface-bg)
    `,
    borderColor: `color-mix(in srgb, ${primary} 42%, var(--line-strong))`,
    boxShadow: `
      0 22px 50px hsl(0 0% 0% / 0.34),
      0 0 0 1px color-mix(in srgb, ${secondary} 16%, transparent),
      0 0 28px color-mix(in srgb, ${primary} 16%, transparent)
    `,
  } as const;
}
