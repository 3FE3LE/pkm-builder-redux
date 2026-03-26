"use client";

import clsx from "clsx";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { CloudRain, CloudSun, GitCompareArrows, Info, Lock, LockOpen, MoonStar, Pencil, Plus, RotateCcw, Snowflake, Sun, Sunrise, Sunset, Wind, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import {
  CoveragePanel,
  DefensiveThreatsPanel,
  TeamAverageStatsPanel,
  TeamRosterReadingPanel,
} from "@/components/team/AnalysisPanels";
import { TypeBadge } from "@/components/BuilderShared";
import {
  CheckpointIntelligencePanel,
  CheckpointMapPanel,
  RecommendedCapturesPanel,
  RunPathPanel,
} from "@/components/team/CheckpointPanels";
import {
  CompareMemberPanel,
  ComparisonSummary,
  buildCompareState,
} from "@/components/team/CompareModalSections";
import { buildMemberLens } from "@/lib/domain/memberLens";
import { RoleAxesCard } from "@/components/team/RoleAxes";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { SortableMemberCard } from "@/components/team/SortableMemberCard";
import { createEditable, type EditableMember } from "@/lib/builderStore";
import type { BattleWeather } from "@/lib/domain/battle";
import { TYPE_COLORS } from "@/lib/domain/typeChart";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";
import type { MemberRoleRecommendation } from "@/lib/domain/roleAnalysis";
import type { RunEncounterDefinition } from "@/lib/runEncounters";
import type { BuilderLocalTime } from "@/hooks/useBuilderUiState";
import type {
  EvolutionConstraintKey,
  EvolutionConstraintState,
  RecommendationFilterKey,
  RecommendationFilterState,
} from "@/lib/runState";
import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import type { Milestone, StarterKey } from "@/lib/builder";

type Recommendation = ReturnType<typeof import("@/lib/builder").getRecommendation>;
type CheckpointRisk = ReturnType<typeof import("@/lib/domain/checkpointScoring").buildCheckpointRiskSnapshot>;
type SwapOpportunity = ReturnType<typeof import("@/lib/domain/swapOpportunities").buildSwapOpportunities>[number];
type CaptureRecommendation = ReturnType<typeof import("@/lib/domain/contextualRecommendations").buildCaptureRecommendations>[number];
type SpeedTiers = ReturnType<typeof import("@/lib/domain/speedTiers").buildSpeedTierSnapshot>;
type TeamRoleSnapshot = ReturnType<typeof import("@/lib/domain/roleAnalysis").buildTeamRoleSnapshot>;
type MoveRecommendation = ReturnType<typeof import("@/lib/domain/moveRecommendations").getMoveRecommendations>[number];

type DefensiveSections = ReturnType<typeof import("@/lib/teamAnalysis").buildDefensiveSections>;
type CompareMembers = import("@/hooks/types").CompareMembers;

function getDockTone(types: string[] = []) {
  const primary = TYPE_COLORS[types[0] ?? ""] ?? "hsl(165 83% 65%)";
  const secondary = TYPE_COLORS[types[1] ?? types[0] ?? ""] ?? primary;

  return {
    backgroundImage: `
      radial-gradient(circle at 18% 18%, color-mix(in srgb, ${primary} 24%, transparent) 0%, transparent 34%),
      radial-gradient(circle at 82% 76%, color-mix(in srgb, ${secondary} 20%, transparent) 0%, transparent 38%),
      linear-gradient(180deg, hsl(196 57% 9% / 0.98), hsl(196 57% 7% / 0.98))
    `,
    borderColor: `color-mix(in srgb, ${primary} 42%, var(--line-strong))`,
    boxShadow: `
      0 22px 50px hsl(0 0% 0% / 0.34),
      0 0 0 1px color-mix(in srgb, ${secondary} 16%, transparent),
      0 0 28px color-mix(in srgb, ${primary} 16%, transparent)
    `,
  } as const;
}

export function BuilderHeader({
  milestoneId: _milestoneId,
  milestones: _milestones,
  localTime,
}: {
  milestoneId: string;
  milestones: Milestone[];
  localTime: BuilderLocalTime;
}) {
  const TimeIcon =
    localTime.phase === "dawn"
      ? Sunrise
      : localTime.phase === "dusk"
        ? Sunset
        : localTime.phase === "day"
          ? Sun
          : MoonStar;

  return (
    <div className="mb-3 flex justify-center">
      <div className="inline-flex w-full min-w-0 items-center justify-center gap-2 px-1 py-1 sm:gap-3 lg:w-auto">
          <TimeIcon className="h-10 w-10 shrink-0 text-accent sm:h-14 sm:w-14" />
          <div className="min-w-0 text-center">
            <div className="display-face text-[12px] uppercase tracking-[0.18em] text-accent">
              {localTime.period === "day" ? "Day Time" : "Night Time"}
            </div>
            <div className="pixel-face text-[2.4rem] leading-none tracking-[0.14em] font-normal text-text sm:text-[3.4rem] lg:text-[4.2rem]">
              {localTime.ready ? localTime.label : "SYNC..."}
            </div>
          </div>
      </div>
    </div>
  );
}

export function TeamRosterSection({
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
  const [resetFields, setResetFields] = useState({
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

  function renderActionButtons(buttonSize: "desktop" | "mobile") {
    const isDesktop = buttonSize === "desktop";
    const showCloseDockAction = !isDesktop && editorOpen;
    const buttonClass = isDesktop
      ? "size-9 rounded-[0.9rem] border bg-surface-4 hover:bg-surface-8"
      : "size-11 rounded-[0.9rem] border bg-surface-4 hover:bg-surface-8";
    const iconClass = isDesktop ? "h-4 w-4" : "h-5 w-5";

    if (!selectedMember) {
      return null;
    }

    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size={isDesktop ? "icon-sm" : "icon-lg"}
          onClick={() => setDetailsOpen((current) => !current)}
          aria-label={detailsOpen ? "Ocultar info del slot seleccionado" : "Mostrar info del slot seleccionado"}
          className={clsx(
            buttonClass,
            detailsOpen
              ? "border-info-line bg-info-fill text-info-soft"
              : "border-line text-muted",
          )}
        >
          <Info className={iconClass} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size={isDesktop ? "icon-sm" : "icon-lg"}
          onClick={() => setResetOpen(true)}
          aria-label="Resetear slot seleccionado"
          className={clsx(buttonClass, "border-danger-line-soft text-danger hover:bg-danger-fill")}
        >
          <RotateCcw className={iconClass} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size={isDesktop ? "icon-sm" : "icon-lg"}
          onClick={() => onEditMember(selectedMember.id)}
          aria-label="Editar slot seleccionado"
          className={clsx(buttonClass, "border-line text-muted")}
        >
          <Pencil className={iconClass} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size={isDesktop ? "icon-sm" : "icon-lg"}
          onClick={() => onToggleMemberLock(selectedMember.id)}
          aria-label={selectedMember.locked ? "Desbloquear slot seleccionado" : "Bloquear slot seleccionado"}
          className={clsx(
            buttonClass,
            selectedMember.locked
              ? "border-warning-line text-warning-strong"
              : "border-line text-muted",
          )}
        >
          {selectedMember.locked ? <Lock className={iconClass} /> : <LockOpen className={iconClass} />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size={isDesktop ? "icon-sm" : "icon-lg"}
          onClick={() => onAssignToCompare(selectedMember.id)}
          aria-label="Comparar slot seleccionado"
          className={clsx(buttonClass, "border-line text-muted")}
        >
          <GitCompareArrows className={iconClass} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size={isDesktop ? "icon-sm" : "icon-lg"}
          onClick={() => {
            if (showCloseDockAction) {
              onCloseEditor();
              return;
            }

            setDeleteOpen(true);
          }}
          aria-label={showCloseDockAction ? "Cerrar menu flotante" : "Mandar Pokemon seleccionado a caja"}
          className={clsx(buttonClass, "border-danger-line text-danger hover:bg-danger-fill")}
        >
          <X className={iconClass} />
        </Button>
      </>
    );
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
                  className="overflow-hidden"
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
                          className="absolute bottom-full left-1/2 z-20 mb-3 w-[28rem] -translate-x-1/2"
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
                      {renderActionButtons("desktop")}
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
              {renderActionButtons("mobile")}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {resetOpen && selectedMember ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(2,8,10,0.76)] px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="panel-strong w-full max-w-lg rounded-[1rem] p-5"
            >
              <p className="display-face text-sm text-accent">Reset del slot</p>
              <p className="mt-2 text-sm text-muted">
                Elige exactamente qué quieres restablecer. Todas las opciones vienen marcadas por defecto.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {Object.entries(resetFields).map(([key, checked]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-[0.75rem] border border-line bg-surface-3 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        setResetFields((current) => ({
                          ...current,
                          [key]: event.target.checked,
                        }))
                      }
                    />
                    <span>{RESET_LABELS[key as keyof typeof resetFields]}</span>
                  </label>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setResetOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" variant="destructive" onClick={resetSelectedMember}>
                  Aplicar reset
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {deleteOpen && selectedMember ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(2,8,10,0.76)] px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="panel-strong w-full max-w-md rounded-[1rem] p-5"
            >
              <p className="display-face text-sm text-danger">Mandar a caja</p>
              <p className="mt-2 text-sm text-muted">
                Vas a sacar a {selectedMember.nickname || selectedMember.species || "este Pokemon"} del roster activo.
              </p>
              <p className="mt-1 text-sm text-muted">
                El Pokemon seguira guardado en tu PC para reusarlo despues.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onRemoveMember(selectedMember.id);
                    onClearSelection();
                    setDeleteOpen(false);
                  }}
                >
                  Mandar a caja
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

const RESET_LABELS = {
  nickname: "Nickname",
  level: "Nivel",
  gender: "Genero",
  nature: "Naturaleza",
  ability: "Habilidad",
  item: "Objeto",
  moves: "Moveset",
  ivs: "IVs",
  evs: "EVs",
};

export function TeamAnalysisSection({
  averageStats,
  coveredCoverage,
  uncoveredCoverage,
  defensiveSections,
  checkpointRisk,
  teamSize,
  captureRecommendations,
  nextEncounter,
  speciesCatalog,
  onSendCaptureToIvCalc,
}: {
  averageStats: ReturnType<typeof import("@/lib/teamAnalysis").buildAverageStats> | null;
  coveredCoverage: {
    defenseType: string;
    bucket: "x0" | "x0.25" | "x0.5" | "x1" | "x2" | "x4";
  }[];
  uncoveredCoverage: {
    defenseType: string;
    bucket: "x0" | "x0.25" | "x0.5" | "x1" | "x2" | "x4";
  }[];
  defensiveSections: DefensiveSections;
  checkpointRisk: CheckpointRisk;
  teamSize: number;
  captureRecommendations: CaptureRecommendation[];
  nextEncounter: RunEncounterDefinition | null;
  speciesCatalog: { name: string; dex: number }[];
  onSendCaptureToIvCalc?: (species: string) => void;
}) {
  return (
    <section className="space-y-2">
      <TeamAverageStatsPanel averageStats={averageStats} />
      <TeamRosterReadingPanel checkpointRisk={checkpointRisk} />
      <RecommendedCapturesPanel
        teamSize={teamSize}
        captureRecommendations={captureRecommendations}
        swapOpportunities={[]}
        supportsContextualSwaps={false}
        nextEncounter={nextEncounter}
        speciesCatalog={speciesCatalog}
        showSwaps={false}
        onSendToIvCalc={onSendCaptureToIvCalc}
      />
      <div className="grid gap-3 xl:grid-cols-2">
        <CoveragePanel
          coveredCoverage={coveredCoverage}
          uncoveredCoverage={uncoveredCoverage}
        />
        <DefensiveThreatsPanel defensiveSections={defensiveSections} />
      </div>
    </section>
  );
}

export function CheckpointCopilotSection({
  activeMember,
  teamSize,
  milestoneId,
  checkpointRisk,
  copilotSupportsRecommendations,
  supportsContextualSwaps,
  nextEncounter,
  swapOpportunities,
  captureRecommendations,
  speedTiers,
  recommendation,
  moveRecommendations,
  sourceCards,
  encounterCatalog,
  completedEncounterIds,
  speciesCatalog,
  itemCatalog,
  starterKey,
  onToggleEncounter,
  onSendCaptureToIvCalc,
}: {
  activeMember?: ResolvedTeamMember;
  teamSize: number;
  milestoneId: string;
  checkpointRisk: CheckpointRisk;
  copilotSupportsRecommendations: boolean;
  supportsContextualSwaps: boolean;
  nextEncounter: RunEncounterDefinition | null;
  swapOpportunities: SwapOpportunity[];
  captureRecommendations: CaptureRecommendation[];
  speedTiers: SpeedTiers;
  recommendation: Recommendation;
  moveRecommendations: MoveRecommendation[];
  sourceCards: Recommendation["availableSources"][number][];
  encounterCatalog: RunEncounterDefinition[];
  completedEncounterIds: string[];
  speciesCatalog: { name: string; dex: number }[];
  itemCatalog: { name: string; effect?: string; sprite?: string | null }[];
  starterKey: StarterKey;
  onToggleEncounter: (id: string) => void;
  onSendCaptureToIvCalc?: (species: string) => void;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [timelineHeight, setTimelineHeight] = useState<number | null>(null);

  useEffect(() => {
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setTimelineHeight(Math.round(entry.contentRect.height));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="min-w-0 space-y-2 overflow-x-hidden">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
        <div ref={contentRef} className="min-w-0 space-y-2 overflow-x-hidden">
          <div className="xl:hidden">
            <RunPathPanel
              encounters={encounterCatalog}
              completedEncounterIds={completedEncounterIds}
              speciesCatalog={speciesCatalog}
              starterKey={starterKey}
              onToggleEncounter={onToggleEncounter}
              variant="mobile-summary"
            />
          </div>
          <CheckpointIntelligencePanel
            teamSize={teamSize}
            supportsContextualSwaps={supportsContextualSwaps}
            checkpointRisk={checkpointRisk}
            swapOpportunities={swapOpportunities}
          />
          <CheckpointMapPanel
            activeMember={activeMember}
            sourceCards={sourceCards}
            speciesCatalog={speciesCatalog}
            itemCatalog={itemCatalog}
          />
          <RecommendedCapturesPanel
            teamSize={teamSize}
            swapOpportunities={swapOpportunities}
            captureRecommendations={captureRecommendations}
            supportsContextualSwaps={supportsContextualSwaps}
            nextEncounter={nextEncounter}
            speciesCatalog={speciesCatalog}
            showCaptures={false}
            onSendToIvCalc={onSendCaptureToIvCalc}
          />
        </div>
        <aside className="hidden xl:block">
          <RunPathPanel
            encounters={encounterCatalog}
            completedEncounterIds={completedEncounterIds}
            speciesCatalog={speciesCatalog}
            starterKey={starterKey}
            onToggleEncounter={onToggleEncounter}
            maxHeight={timelineHeight ?? undefined}
          />
        </aside>
      </div>
    </section>
  );
}

export function CompareWorkspaceSection({
  members,
  resolvedMembers,
  speciesCatalog,
  abilityCatalog,
  itemCatalog,
  battleWeather,
  dropPulse,
  onChangeMember,
  onClearMember,
}: {
  members: CompareMembers;
  resolvedMembers: [ResolvedTeamMember | undefined, ResolvedTeamMember | undefined];
  speciesCatalog: { name: string; slug: string; dex: number; types: string[] }[];
  abilityCatalog: { name: string; effect?: string }[];
  itemCatalog: { name: string; category?: string; effect?: string; sprite?: string | null }[];
  battleWeather: BattleWeather;
  dropPulse: { slot: 0 | 1; token: number } | null;
  onChangeMember: (index: 0 | 1, next: EditableMember) => void;
  onClearMember: (slot: 0 | 1) => void;
}) {
  const heldItemCatalog = itemCatalog.filter((item) =>
    item.category?.toLowerCase().includes("held"),
  );
  const [leftMember, rightMember] = members;
  const [leftResolved, rightResolved] = resolvedMembers;
  const left = buildCompareState(leftMember, leftResolved, abilityCatalog, heldItemCatalog, battleWeather);
  const right = buildCompareState(rightMember, rightResolved, abilityCatalog, heldItemCatalog, battleWeather);

  return (
    <section className="space-y-2">
      <div className="grid grid-cols-2 gap-2.5 xl:hidden">
        <div className="col-span-1 min-w-0">
          <CompareDropZone
            slot={0}
            pulseToken={dropPulse?.slot === 0 ? dropPulse.token : null}
            onClear={onClearMember}
            hasSpecies={Boolean(leftMember.species.trim())}
          >
            <CompareMemberPanel
              index={0}
              state={left}
              speciesCatalog={speciesCatalog}
              heldItemCatalog={heldItemCatalog}
              onChangeMember={onChangeMember}
            />
          </CompareDropZone>
        </div>
        <div className="col-span-1 min-w-0">
          <CompareDropZone
            slot={1}
            pulseToken={dropPulse?.slot === 1 ? dropPulse.token : null}
            onClear={onClearMember}
            hasSpecies={Boolean(rightMember.species.trim())}
          >
            <CompareMemberPanel
              index={1}
              state={right}
              speciesCatalog={speciesCatalog}
              heldItemCatalog={heldItemCatalog}
              onChangeMember={onChangeMember}
            />
          </CompareDropZone>
        </div>
        <div className="col-span-2">
          <ComparisonSummary left={left} right={right} />
        </div>
      </div>
      <div className="hidden xl:grid xl:grid-cols-[minmax(0,1fr)_18rem_minmax(0,1fr)] xl:items-start xl:gap-3">
        <CompareDropZone
          slot={0}
          pulseToken={dropPulse?.slot === 0 ? dropPulse.token : null}
          onClear={onClearMember}
          hasSpecies={Boolean(leftMember.species.trim())}
        >
          <CompareMemberPanel
            index={0}
            state={left}
            speciesCatalog={speciesCatalog}
            heldItemCatalog={heldItemCatalog}
            onChangeMember={onChangeMember}
          />
        </CompareDropZone>
        <ComparisonSummary left={left} right={right} />
        <CompareDropZone
          slot={1}
          pulseToken={dropPulse?.slot === 1 ? dropPulse.token : null}
          onClear={onClearMember}
          hasSpecies={Boolean(rightMember.species.trim())}
        >
          <CompareMemberPanel
            index={1}
            state={right}
            speciesCatalog={speciesCatalog}
            heldItemCatalog={heldItemCatalog}
            onChangeMember={onChangeMember}
          />
        </CompareDropZone>
      </div>
    </section>
  );
}

export { IvCalculatorSection } from "@/components/team/IvCalculatorSection";

export function PreferencesSection({
  evolutionConstraints,
  recommendationFilters,
  battleWeather,
  onToggleEvolutionConstraint,
  onToggleRecommendationFilter,
  onSetBattleWeather,
  onResetRun,
}: {
  evolutionConstraints: EvolutionConstraintState;
  recommendationFilters: RecommendationFilterState;
  battleWeather: BattleWeather;
  onToggleEvolutionConstraint: (key: EvolutionConstraintKey, value: boolean) => void;
  onToggleRecommendationFilter: (key: RecommendationFilterKey, value: boolean) => void;
  onSetBattleWeather: (weather: BattleWeather) => void;
  onResetRun: () => void;
}) {
  return (
    <section className="space-y-2">
      <div className="px-1 py-1">
        <p className="display-face text-sm text-accent">Preferences</p>
      </div>
      <div className="space-y-5 px-1 py-1">
        <div>
          <p className="display-face text-sm text-accent">Clima de combate</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {BATTLE_WEATHER_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = battleWeather === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSetBattleWeather(option.key)}
                  className={clsx(
                    "flex items-center gap-3 rounded-[0.8rem] px-3 py-3 text-left transition",
                    active
                      ? "bg-primary-fill text-text"
                      : "text-muted hover:bg-surface-3",
                  )}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[0.75rem] bg-surface-4">
                    <Icon className={clsx("h-5 w-5", active ? "text-primary-soft" : "text-accent")} />
                  </span>
                  <span className="min-w-0">
                    <span className="display-face block text-xs text-inherit">{option.label}</span>
                    <span className="mt-1 block text-xs text-muted">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="display-face text-sm text-accent">Filtros de recomendaciones</p>
          <div className="mt-3 space-y-2">
            {RECOMMENDATION_FILTER_OPTIONS.map((option) => (
              <PreferenceSwitchRow
                key={option.key}
                label={option.label}
                description={option.description}
                checked={recommendationFilters[option.key]}
                onCheckedChange={(checked) => onToggleRecommendationFilter(option.key, checked)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="display-face text-sm text-accent">Reglas de evolucion</p>
          <div className="mt-3 space-y-2">
            {EVOLUTION_CONSTRAINT_OPTIONS.map((option) => (
              <PreferenceSwitchRow
                key={option.key}
                label={option.label}
                description={option.description}
                checked={evolutionConstraints[option.key]}
                onCheckedChange={(checked) => onToggleEvolutionConstraint(option.key, checked)}
              />
            ))}
          </div>
        </div>

        <div className="pt-1">
          <p className="display-face text-sm text-accent">Datos persistidos</p>
          <button
            type="button"
            onClick={onResetRun}
            className="danger-outline mt-3 rounded-[0.75rem] border px-4 py-2 text-sm text-danger"
          >
            Limpiar datos persistidos
          </button>
        </div>
      </div>
    </section>
  );
}

export function RunOpsSection({
  activeMember,
  sourceCards,
  speciesCatalog,
  itemCatalog,
}: {
  activeMember?: ResolvedTeamMember;
  sourceCards: Recommendation["availableSources"][number][];
  speciesCatalog: { name: string; dex: number }[];
  itemCatalog: { name: string; effect?: string; sprite?: string | null }[];
}) {
  return (
    <section className="space-y-2">
      <CheckpointMapPanel
        activeMember={activeMember}
        sourceCards={sourceCards}
        speciesCatalog={speciesCatalog}
        itemCatalog={itemCatalog}
      />
    </section>
  );
}

function SelectedMemberInsightCard({
  member,
  roleRecommendation,
  moveRecommendations,
  starterLens,
  onClose,
}: {
  member: ResolvedTeamMember;
  roleRecommendation?: MemberRoleRecommendation;
  moveRecommendations: MoveRecommendation[];
  starterLens: ReturnType<typeof buildMemberLens> | null;
  onClose: () => void;
}) {
  return (
    <div className="rounded-[1rem] border border-line-strong bg-[linear-gradient(180deg,rgba(12,32,40,0.96),rgba(8,21,25,0.96))] p-4 shadow-[0_22px_50px_rgba(0,0,0,0.34)] backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="display-face text-sm text-accent">Info del slot</p>
          <p className="mt-1 text-sm text-muted">
            Lectura puntual de {member.species} y mejoras recomendadas para este miembro.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Cerrar info del slot"
          className="h-8 w-8 rounded-[0.8rem] border border-line bg-surface-4 text-muted hover:bg-surface-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {roleRecommendation ? (
        <div className="mt-4">
          <RoleAxesCard role={roleRecommendation} compact />
        </div>
      ) : null}

      {starterLens ? (
        <div className="mt-4">
          <p className="display-face text-xs text-accent">Starter Lens</p>
          <p className="mt-1 text-sm text-muted">{starterLens.summary}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {starterLens.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[6px] border border-line bg-surface-3 px-3 py-1 text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <StarterLensCard label="Rol actual" value={starterLens.role} />
            <StarterLensCard label="Plan del equipo" value={starterLens.teamPlan} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {starterLens.supportNeeds.map((need) => (
              <StarterLensCard key={need} label="Necesita" value={need} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="display-face text-xs text-accent">Mejoras del slot</p>
        <p className="mt-1 text-xs text-muted">
          Moves sugeridos cerca del nivel actual o accesibles por máquina.
        </p>
        <div className="mt-3 space-y-2">
          {moveRecommendations.length ? (
            moveRecommendations.slice(0, 4).map((entry) => (
              <div
                key={`${entry.source}-${entry.move}`}
                className="rounded-[0.7rem] border border-line bg-surface-3/60 px-3 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="display-face text-[10px] text-accent">{entry.source}</span>
                  <span className="pixel-face text-[12px] text-text">{entry.move}</span>
                  {entry.type ? <TypeBadge key={`${entry.move}-${entry.type}`} type={entry.type} /> : null}
                </div>
                {entry.reasons.length ? (
                  <p className="mt-2 text-xs text-muted">{entry.reasons.join(" · ")}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No hay una recomendación clara todavia para este slot.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StarterLensCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[0.7rem] border border-line bg-surface-3 px-3 py-2">
      <p className="display-face text-[10px] text-accent">{label}</p>
      <p className="mt-1 text-sm text-muted">{value}</p>
    </div>
  );
}

const EVOLUTION_CONSTRAINT_OPTIONS: {
  key: EvolutionConstraintKey;
  label: string;
  description: string;
}[] = [
  { key: "level", label: "Nivel", description: "Bloquea evoluciones que todavia no alcanzan el nivel requerido." },
  { key: "gender", label: "Sexo", description: "Respeta evoluciones macho/hembra cuando aplique." },
  { key: "timeOfDay", label: "Hora del dia", description: "Usa la hora local del navegador para day y night." },
];

const RECOMMENDATION_FILTER_OPTIONS: {
  key: RecommendationFilterKey;
  label: string;
  description: string;
}[] = [
  {
    key: "excludeLegendaries",
    label: "Excluir legendarios",
    description: "Oculta especies legendarias, miticas y afines de recomendaciones y referencias.",
  },
  {
    key: "excludePseudoLegendaries",
    label: "Excluir pseudo legendarios",
    description: "Quita lineas como Beldum, Larvitar, Gible o Deino del copilot.",
  },
  {
    key: "excludeUniquePokemon",
    label: "Excluir unicos",
    description: "Oculta especies excepcionales como Celebi, Meloetta o Keldeo aunque no sean pseudo.",
  },
  {
    key: "excludeOtherStarters",
    label: "Excluir otros starters",
    description: "No recomienda starters fuera de la familia que elegiste al inicio.",
  },
  {
    key: "excludeExactTypeDuplicates",
    label: "Excluir typing exacto duplicado",
    description: "Evita recomendar Pokemon con exactamente la misma combinacion de tipos que otro miembro del equipo.",
  },
];

const BATTLE_WEATHER_OPTIONS: {
  key: BattleWeather;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  { key: "clear", label: "Neutral", description: "Sin clima activo.", icon: Sun },
  { key: "sun", label: "Sun", description: "Drought, Chlorophyll, Solar Power.", icon: CloudSun },
  { key: "rain", label: "Rain", description: "Drizzle, Swift Swim y lluvia manual.", icon: CloudRain },
  { key: "sand", label: "Sand", description: "Sand Rush y boost SpD para Rock.", icon: Wind },
  { key: "hail", label: "Hail", description: "Clima helado persistente.", icon: Snowflake },
];

function PreferenceSwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[0.8rem] px-1 py-2">
      <div className="min-w-0">
        <p className="display-face text-xs tracking-[0.14em] text-text">{label}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

function CompareDropZone({
  slot,
  pulseToken,
  hasSpecies,
  onClear,
  children,
}: {
  slot: 0 | 1;
  pulseToken: number | null;
  hasSpecies: boolean;
  onClear: (slot: 0 | 1) => void;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `compare-slot-${slot}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "min-w-0 space-y-1.5 rounded-[1rem] border border-dashed border-transparent p-0.5 transition-all sm:p-2",
        isOver &&
          "border-primary-line-emphasis bg-primary-fill primary-outline-shadow",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-muted">
        <span className="display-face text-accent">slot {slot + 1}</span>
        {hasSpecies ? (
          <>
            <button type="button" onClick={() => onClear(slot)} className="text-danger sm:hidden">
              x
            </button>
            <button type="button" onClick={() => onClear(slot)} className="hidden text-danger sm:inline">
              limpiar
            </button>
          </>
        ) : (
          <span className={clsx("hidden sm:inline", isOver && "text-primary-soft")}>
            {isOver ? "Suelta para comparar" : "Arrastra un Pokemon del roster aqui"}
          </span>
        )}
      </div>
      <motion.div
        key={pulseToken ? `compare-drop-${slot}-${pulseToken}` : `compare-drop-${slot}`}
        initial={false}
        animate={
          pulseToken
            ? {
                scale: [0.92, 1.035, 1],
                filter: [
                  "saturate(0.96) brightness(0.96)",
                  "saturate(1.08) brightness(1.04)",
                  "saturate(1) brightness(1)",
                ],
              }
            : { scale: 1, filter: "saturate(1) brightness(1)" }
        }
        transition={{
          duration: pulseToken ? 0.34 : 0.18,
          times: pulseToken ? [0, 0.55, 1] : undefined,
          ease: "easeOut",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
