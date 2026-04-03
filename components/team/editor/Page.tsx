"use client";

import { ViewTransition, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";

import { DefenseSection } from "@/components/team/editor/DefenseSection";
import { Header } from "@/components/team/editor/Header";
import { MovePickerModal } from "@/components/team/editor/MovePickerModal";
import { MovesSection } from "@/components/team/editor/MovesSection";
import { ProfileSection } from "@/components/team/editor/ProfileSection";
import { StatsSection } from "@/components/team/editor/StatsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionDock } from "@/components/team/workspace/roster/ActionDock";
import { SelectedMemberInsightCard } from "@/components/team/workspace/roster/SelectedMemberInsightCard";
import { SlotModals, type ResetFields } from "@/components/team/workspace/roster/SlotModals";
import { editableMemberSchema } from "@/lib/builderForm";
import type { EditableMember } from "@/lib/builderStore";
import { createEditable } from "@/lib/builderStore";
import type { BattleWeather } from "@/lib/domain/battle";
import type { EvolutionEligibility } from "@/lib/domain/evolutionEligibility";
import { buildMemberLens } from "@/lib/domain/memberLens";
import type { MemberRoleRecommendation } from "@/lib/domain/roleAnalysis";
import { getTeamEditorTransitionName } from "@/lib/teamEditorViewTransition";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

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
  onChange: (next: EditableMember) => void;
  onImportToPc: (member: EditableMember) => boolean;
  onOpenMoveModal: (slotIndex: number | null) => void;
  onRemoveMoveAt: (index: number) => void;
  onReorderMove: (fromIndex: number, toIndex: number) => void;
  onRequestEvolution: () => void;
  onToggleLock: () => void;
  onAssignToCompare: () => void;
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
  onChange,
  onImportToPc,
  onOpenMoveModal,
  onRemoveMoveAt,
  onReorderMove,
  onRequestEvolution,
  onToggleLock,
  onAssignToCompare,
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
}: EditorPageProps) {
  const [editorTab, setEditorTab] = useState<"stats" | "moves" | "typing">("stats");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
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

  const currentLevel = Number(member.level ?? 1);
  const currentSpecies = String(member.species ?? "");
  const nicknameValue = String(member.nickname ?? "").trim();
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
  const starterLens = useMemo(
    () =>
      resolved && starterSpeciesLine.includes(resolved.species)
        ? buildMemberLens(resolved)
        : null,
    [resolved, starterSpeciesLine],
  );

  function updateEditorMember(
    updater: (current: EditableMember) => EditableMember,
  ) {
    const next = updater(member);
    const parsed = editableMemberSchema.safeParse(next);
    onChange(parsed.success ? parsed.data : next);
  }

  function resetSelectedMember() {
    const defaults = createEditable(member.species);
    defaults.id = member.id;
    defaults.locked = member.locked;
    defaults.nickname = member.species;

    onChange({
      ...member,
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
      <section className="mx-auto max-w-6xl">
        <div className="mb-4">
          <Link
            href="/team"
            transitionTypes={["editor-back"]}
            className="hidden items-center gap-2 rounded-full border border-line-soft bg-surface-2/80 px-3 py-2 text-sm text-text transition-colors hover:border-warning-line hover:bg-surface-3 md:inline-flex"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al team
          </Link>
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
            />

            <div className="space-y-4 px-4 pb-8 sm:space-y-5 sm:px-5 sm:pb-10">
              <ProfileSection
                member={member}
                resolved={resolved}
                speciesCatalog={speciesCatalog}
                abilityCatalog={abilityCatalog}
                itemCatalog={itemCatalog}
                nicknameValue={nicknameValue}
                currentSpecies={currentSpecies}
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
          onApplyReset={resetSelectedMember}
          onConfirmDelete={() => {}}
          onConfirmRelease={() => {}}
        />
      </section>
    </main>
  );
}
