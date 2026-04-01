"use client";

import { AnimatePresence, motion } from "motion/react";
import { type CSSProperties, useState } from "react";

import {
  DefenseSection,
  Header,
  MovesSection,
  ProfileSection,
  StatsSection,
} from "@/components/team/editor/Sections";
import { MovePickerModal } from "@/components/team/editor/MovePickerModal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { editableMemberSchema } from "@/lib/builderForm";
import type { EditableMember } from "@/lib/builderStore";
import type { BattleWeather } from "@/lib/domain/battle";
import type { EvolutionEligibility } from "@/lib/domain/evolutionEligibility";
import type { MemberRoleRecommendation } from "@/lib/domain/roleAnalysis";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

import type {
  AbilityCatalogEntry,
  ItemCatalogEntry,
  SpeciesCatalogEntry,
} from "@/components/team/editor/types";

type PokemonEditorSheetProps = {
  member?: EditableMember;
  open?: boolean;
  resolved?: ResolvedTeamMember;
  weather: BattleWeather;
  roleRecommendation?: MemberRoleRecommendation;
  speciesCatalog: SpeciesCatalogEntry[];
  abilityCatalog: AbilityCatalogEntry[];
  itemCatalog: ItemCatalogEntry[];
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  onChange: (next: EditableMember) => void;
  onImportToPc: (member: EditableMember) => boolean;
  onOpenMoveModal: (slotIndex: number | null) => void;
  onRemoveMoveAt: (index: number) => void;
  onReorderMove: (fromIndex: number, toIndex: number) => void;
  onRequestEvolution: () => void;
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
  getMoveSurfaceStyle: (type?: string | null) => CSSProperties | undefined;
};

export function PokemonEditorSheet({
  member,
  open: openProp,
  resolved,
  weather,
  roleRecommendation,
  speciesCatalog,
  abilityCatalog,
  itemCatalog,
  onOpenChange,
  onOpenChangeComplete,
  onChange,
  onImportToPc,
  onOpenMoveModal,
  onRemoveMoveAt,
  onReorderMove,
  onRequestEvolution,
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
}: PokemonEditorSheetProps) {
  const [editorTab, setEditorTab] = useState<"stats" | "moves" | "typing">("stats");
  const open = openProp ?? Boolean(member);

  if (!member) {
    return (
      <Sheet
        open={false}
        onOpenChange={onOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
      />
    );
  }

  const currentMember = member;
  const values = member;
  const parsedValues = editableMemberSchema.safeParse(values);
  const currentLevel = Number(values.level ?? 1);
  const currentSpecies = String(values.species ?? "");
  const nicknameValue = String(values.nickname ?? "").trim();
  const issues = parsedValues.success ? [] : parsedValues.error.issues;
  const getIssue = (path: string) =>
    issues.find((issue) => issue.path.join(".") === path)?.message;
  const canRequestEvolution = editorEvolutionEligibility.some(
    (entry) => entry.eligible,
  );
  const evolutionBlockReason =
    !canRequestEvolution && editorEvolutionEligibility.length
      ? editorEvolutionEligibility
          .flatMap((entry) => entry.reasons.slice(0, 2))
          .filter(Boolean)
          .slice(0, 2)
          .join(" · ")
      : undefined;
  const currentNature = String(values.nature ?? "Serious");
  const currentAbility = String(values.ability ?? "");
  const currentItem = String(values.item ?? "");

  function updateEditorMember(
    updater: (current: EditableMember) => EditableMember,
  ) {
    const next = updater(currentMember);
    const parsed = editableMemberSchema.safeParse(next);
    onChange(parsed.success ? parsed.data : next);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <SheetContent
        side="right"
        onRequestClose={() => onOpenChange(false)}
        hideCloseButtonOnMobile
        className="w-screen max-w-none overflow-y-auto border-l border-line bg-[var(--sheet-surface-bg)] p-0 text-text data-[side=right]:w-full sm:w-full sm:max-w-[35rem]"
      >
        <SheetHeader className="px-0 pb-0 pt-4 sm:pt-10">
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
          />
          <SheetTitle className="sr-only">
            {nicknameValue ||
              resolved?.species ||
              currentSpecies ||
              "Pokemon pendiente"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-28 sm:space-y-5 sm:px-5 sm:py-4">
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
              <TabsTrigger value="stats" className="tab-trigger-soft">
                Stats
              </TabsTrigger>
              <TabsTrigger value="moves" className="tab-trigger-soft">
                Moves
              </TabsTrigger>
              <TabsTrigger value="typing" className="tab-trigger-soft">
                Typing
              </TabsTrigger>
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
      </SheetContent>
    </Sheet>
  );
}
