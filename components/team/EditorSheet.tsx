"use client";

import { AnimatePresence, motion } from 'motion/react';
import { CSSProperties, useState } from 'react';

import {
  EditorDefenseSection,
  EditorHeader,
  EditorMovesSection,
  EditorProfileSection,
  EditorStatsSection,
} from '@/components/team/EditorSections';
import { MovePickerModal } from '@/components/team/MovePickerModal';
import { Button } from '@/components/ui/Button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { editableMemberSchema } from '@/lib/builderForm';
import { createEditable, EditableMember } from '@/lib/builderStore';
import { ResolvedTeamMember } from '@/lib/teamAnalysis';

import type {
  AbilityCatalogEntry,
  ItemCatalogEntry,
  SpeciesCatalogEntry,
} from "@/components/team/editorTypes";
import type { MemberRoleRecommendation } from "@/lib/domain/roleAnalysis";
import type { EvolutionEligibility } from "@/lib/domain/evolutionEligibility";
import type { BattleWeather } from "@/lib/domain/battle";

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

  const values = member;
  const currentMember = member;
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
        className="w-screen max-w-none overflow-y-auto border-l border-line bg-[linear-gradient(180deg,rgba(5,15,19,0.98),rgba(4,10,13,0.98))] p-0 text-text data-[side=right]:w-full sm:w-full sm:max-w-[35rem]"
      >
        <SheetHeader className="px-0 pb-0 pt-4 sm:pt-10">
          <EditorHeader
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
          <EditorProfileSection
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
          />
          <Tabs
            value={editorTab}
            onValueChange={(value) => setEditorTab(value as "stats" | "moves" | "typing")}
            className="gap-0"
          >
            <TabsList className="scrollbar-thin relative z-10 -mb-px flex h-auto w-full flex-nowrap items-end gap-1 overflow-x-auto bg-transparent p-0 pb-1 sm:overflow-visible sm:pb-0">
              <TabsTrigger
                value="stats"
                className="flex-none rounded-t-[0.9rem] rounded-b-none border border-line border-b-line bg-surface-3 px-3 py-2 text-xs text-muted transition-all hover:bg-surface-5 data-active:border-line data-active:border-b-tab-seam data-active:bg-tab-active data-active:text-primary-soft data-active:shadow-[0_-1px_0_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.14)] sm:px-4 sm:py-2.5 sm:text-sm"
              >
                Stats
              </TabsTrigger>
              <TabsTrigger
                value="moves"
                className="flex-none rounded-t-[0.9rem] rounded-b-none border border-line border-b-line bg-surface-3 px-3 py-2 text-xs text-muted transition-all hover:bg-surface-5 data-active:border-line data-active:border-b-tab-seam data-active:bg-tab-active data-active:text-primary-soft data-active:shadow-[0_-1px_0_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.14)] sm:px-4 sm:py-2.5 sm:text-sm"
              >
                Moves
              </TabsTrigger>
              <TabsTrigger
                value="typing"
                className="flex-none rounded-t-[0.9rem] rounded-b-none border border-line border-b-line bg-surface-3 px-3 py-2 text-xs text-muted transition-all hover:bg-surface-5 data-active:border-line data-active:border-b-tab-seam data-active:bg-tab-active data-active:text-primary-soft data-active:shadow-[0_-1px_0_rgba(255,255,255,0.03),0_10px_24px_rgba(0,0,0,0.14)] sm:px-4 sm:py-2.5 sm:text-sm"
              >
                Typing
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="stats"
              className="rounded-[0_1rem_1rem_1rem] p-0"
            >
              {editorTab === "stats" ? (
                <EditorStatsSection
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

            <TabsContent
              value="moves"
              className="rounded-[0_1rem_1rem_1rem] p-0"
            >
              {editorTab === "moves" ? (
                <EditorMovesSection
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

            <TabsContent
              value="typing"
              className="rounded-[0_1rem_1rem_1rem] p-0"
            >
              {editorTab === "typing" ? <EditorDefenseSection resolved={resolved} /> : null}
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
