"use client";

import clsx from "clsx";
import { type ReactNode } from "react";
import { CloudRain, CloudSun, MoonStar, Plus, Snowflake, Sun, Sunrise, Sunset, Wind } from "lucide-react";
import { motion } from "motion/react";

import {
  CoveragePanel,
  DefensiveThreatsPanel,
  TeamAverageStatsPanel,
} from "@/components/team/AnalysisPanels";
import {
  CheckpointIntelligencePanel,
  CheckpointMapPanel,
  MoveHighlightsPanel,
  RecommendedCapturesPanel,
  RunPathPanel,
} from "@/components/team/CheckpointPanels";
import {
  CompareMemberPanel,
  ComparisonSummary,
  buildCompareState,
} from "@/components/team/CompareModalSections";
import { Switch } from "@/components/ui/Switch";
import { SortableMemberCard } from "@/components/team/SortableMemberCard";
import { type EditableMember } from "@/lib/builderStore";
import type { BattleWeather } from "@/lib/domain/battle";
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

import type { Milestone, StarterKey, TeamMember } from "@/lib/builder";

type Recommendation = ReturnType<typeof import("@/lib/builder").getRecommendation>;
type CheckpointRisk = ReturnType<typeof import("@/lib/domain/checkpointScoring").buildCheckpointRiskSnapshot>;
type SwapOpportunity = ReturnType<typeof import("@/lib/domain/swapOpportunities").buildSwapOpportunities>[number];
type SpeedTiers = ReturnType<typeof import("@/lib/domain/speedTiers").buildSpeedTierSnapshot>;
type TeamRoleSnapshot = ReturnType<typeof import("@/lib/domain/roleAnalysis").buildTeamRoleSnapshot>;
type MoveRecommendation = ReturnType<typeof import("@/lib/domain/moveRecommendations").getMoveRecommendations>[number];

type DefensiveSections = ReturnType<typeof import("@/lib/teamAnalysis").buildDefensiveSections>;
type CompareMembers = import("@/hooks/types").CompareMembers;

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
  currentTeam,
  resolvedTeam,
  roleSnapshot,
  battleWeather,
  evolvingIds,
  activeMemberKey,
  onSelectMember,
  onToggleMemberLock,
  onRemoveMember,
  onAddMember,
  onAssignToCompare,
}: {
  currentTeam: EditableMember[];
  resolvedTeam: ResolvedTeamMember[];
  roleSnapshot: TeamRoleSnapshot;
  battleWeather: BattleWeather;
  evolvingIds: Record<string, boolean>;
  activeMemberKey?: string;
  onSelectMember: (id: string) => void;
  onToggleMemberLock: (id: string) => void;
  onRemoveMember: (id: string) => void;
  onAddMember: () => void;
  onAssignToCompare: (memberId: string) => void;
}) {
  const filledTeam = currentTeam.filter((member) => member.species.trim());

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="display-face text-sm text-accent">Roster del equipo</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:gap-3 2xl:grid-cols-3">
        <SortableContext
          items={filledTeam.map((member) => member.id)}
          strategy={rectSortingStrategy}
        >
          {filledTeam.map((member, index) => (
            <SortableMemberCard
              key={member.id}
              member={member}
              index={index}
              resolved={resolvedTeam.find((resolved) => resolved.key === member.id)}
              roleRecommendation={roleSnapshot.members.find((entry) => entry.key === member.id)}
              weather={battleWeather}
              isEvolving={Boolean(evolvingIds[member.id])}
              isSelected={activeMemberKey === member.id}
              onSelect={() => onSelectMember(member.id)}
              onToggleLock={() => onToggleMemberLock(member.id)}
              onAssignToCompare={() => onAssignToCompare(member.id)}
              onRemove={() => onRemoveMember(member.id)}
            />
          ))}
        </SortableContext>

        {filledTeam.length < 6 ? (
          <button
            type="button"
            onClick={onAddMember}
            className="panel-tint-faint group flex min-h-[12rem] flex-col items-center justify-center rounded-[1rem] border border-dashed border-line-emphasis p-5 text-center transition duration-200 hover:border-primary-line-emphasis hover:bg-primary-fill"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-[0.875rem] border border-line-soft bg-surface-3 transition group-hover:scale-[1.03] group-hover:border-primary-line-emphasis">
              <Plus className="h-9 w-9 text-accent" />
            </div>
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function TeamAnalysisSection({
  averageStats,
  coveredCoverage,
  uncoveredCoverage,
  defensiveSections,
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
}) {
  return (
    <section className="space-y-2">
      <TeamAverageStatsPanel averageStats={averageStats} />
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
  activeRoleRecommendation,
  milestoneId,
  starterSpecies,
  preferredTypes,
  checkpointRisk,
  copilotSupportsRecommendations,
  nextEncounter,
  swapOpportunities,
  speedTiers,
  recommendation,
  moveRecommendations,
}: {
  activeMember?: ResolvedTeamMember;
  activeRoleRecommendation?: MemberRoleRecommendation;
  milestoneId: string;
  starterSpecies: string;
  preferredTypes: string[];
  checkpointRisk: CheckpointRisk;
  copilotSupportsRecommendations: boolean;
  nextEncounter: RunEncounterDefinition | null;
  swapOpportunities: SwapOpportunity[];
  speedTiers: SpeedTiers;
  recommendation: Recommendation;
  moveRecommendations: MoveRecommendation[];
}) {
  return (
    <section className="space-y-2">
      <CheckpointIntelligencePanel
        activeMember={activeMember}
        activeRoleRecommendation={activeRoleRecommendation}
        copilotSupportsRecommendations={copilotSupportsRecommendations}
        milestoneId={milestoneId}
        nextEncounter={nextEncounter}
        starterSpecies={starterSpecies}
        preferredTypes={preferredTypes}
        checkpointRisk={checkpointRisk}
        speedTiers={speedTiers}
        swapOpportunities={swapOpportunities}
        recommendation={recommendation}
        moveRecommendations={moveRecommendations}
      />
      <RecommendedCapturesPanel
        swapOpportunities={swapOpportunities}
        copilotSupportsRecommendations={copilotSupportsRecommendations}
        nextEncounter={nextEncounter}
      />
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
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem_minmax(0,1fr)] xl:items-start">
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
        <p className="mt-1 text-sm text-muted">
          Ajusta las reglas y filtros que quieres aplicar a esta run.
        </p>
      </div>
      <div className="rounded-[1rem] p-4">
        <p className="display-face text-sm text-accent">Clima de combate</p>
        <p className="mt-2 text-sm text-muted">
          Aplica el ambiente actual al equipo para reflejar boosts reales como Swift Swim, Chlorophyll, Sand Rush o la SpD extra de tipos Rock en arena.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {BATTLE_WEATHER_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = battleWeather === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSetBattleWeather(option.key)}
                className={clsx(
                  "flex items-center gap-3 rounded-[0.85rem] border px-3 py-3 text-left transition",
                  active
                    ? "border-primary-line-active bg-primary-fill text-text"
                    : "border-line bg-surface-3 text-muted hover:border-primary-line-emphasis hover:bg-surface-5",
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[0.75rem] bg-surface-5">
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
      <div className="rounded-[1rem] p-4">
        <p className="display-face text-sm text-accent">Filtros de recomendaciones</p>
        <p className="mt-2 text-sm text-muted">
          Limita capturas sugeridas y referencias visibles según las reglas de tu run.
        </p>
        <div className="mt-4 space-y-3">
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
      <div className="rounded-[1rem] p-4">
        <p className="display-face text-sm text-accent">Reglas de evolucion</p>
        <p className="mt-2 text-sm text-muted">
          Activa solo las restricciones que quieras tener en cuenta al evaluar evoluciones disponibles.
        </p>
        <div className="mt-4 space-y-3">
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
      <div className="rounded-[1rem] p-4">
        <p className="display-face text-sm text-accent">Datos persistidos</p>
        <p className="mt-2 text-sm text-muted">
          Borra el progreso guardado localmente y reinicia la run desde cero en este navegador.
        </p>
        <button
          type="button"
          onClick={onResetRun}
          className="danger-outline mt-4 rounded-[0.75rem] border px-4 py-2 text-sm text-danger"
        >
          Limpiar datos persistidos
        </button>
      </div>
    </section>
  );
}

export function RunOpsSection({
  activeMember,
  encounterCatalog,
  completedEncounterIds,
  speciesCatalog,
  starterKey,
  sourceCards,
  moveHighlights,
  onToggleEncounter,
}: {
  activeMember?: ResolvedTeamMember;
  encounterCatalog: RunEncounterDefinition[];
  completedEncounterIds: string[];
  speciesCatalog: { name: string; dex: number }[];
  starterKey: StarterKey;
  sourceCards: Recommendation["availableSources"][number][];
  moveHighlights: { move: string; changes: string[] }[];
  onToggleEncounter: (id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <RunPathPanel
        encounters={encounterCatalog}
        completedEncounterIds={completedEncounterIds}
        speciesCatalog={speciesCatalog}
        starterKey={starterKey}
        onToggleEncounter={onToggleEncounter}
      />
      <CheckpointMapPanel activeMember={activeMember} sourceCards={sourceCards} />
      <MoveHighlightsPanel moveHighlights={moveHighlights} />
    </section>
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
    <div className="flex items-start justify-between gap-4 rounded-[0.85rem] border border-line bg-surface-3 px-4 py-3">
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
        "space-y-2 rounded-[1rem] border border-dashed border-transparent p-2 transition-all",
        isOver &&
          "border-primary-line-emphasis bg-primary-fill primary-outline-shadow",
      )}
    >
      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <span className="display-face text-accent">slot {slot + 1}</span>
        {hasSpecies ? (
          <button type="button" onClick={() => onClear(slot)} className="text-danger">
            limpiar
          </button>
        ) : (
          <span className={clsx(isOver && "text-primary-soft")}>
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
