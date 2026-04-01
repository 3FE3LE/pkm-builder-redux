"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { GitCompareArrows, Info, Lock, LockOpen, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import { TypeBadge } from "@/components/BuilderShared";
import { RoleAxesCard } from "@/components/team/RoleAxes";
import { SortableMemberCard } from "@/components/team/SortableMemberCard";
import { Button } from "@/components/ui/Button";
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
type DexPokemonDetail = {
  category?: string | null;
  height?: number | null;
  weight?: number | null;
  flavorText?: string | null;
};

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
            className="modal-scrim z-[120]"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="panel-strong panel-frame w-full max-w-lg p-5"
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
            className="modal-scrim z-[120]"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="panel-strong panel-frame w-full max-w-md p-5"
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
  const [dexDetails, setDexDetails] = useState<DexPokemonDetail | null>(null);

  useEffect(() => {
    const species = member.species.trim();
    if (!species) {
      setDexDetails(null);
      return;
    }

    const controller = new AbortController();
    async function loadDexDetails() {
      try {
        const response = await fetch(`/api/dex?pokemon=${encodeURIComponent(species)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setDexDetails(null);
          return;
        }
        const payload = (await response.json()) as DexPokemonDetail;
        setDexDetails({
          category: payload.category ?? null,
          height: payload.height ?? null,
          weight: payload.weight ?? null,
          flavorText: payload.flavorText ?? null,
        });
      } catch {
        if (!controller.signal.aborted) {
          setDexDetails(null);
        }
      }
    }

    setDexDetails(null);
    void loadDexDetails();

    return () => controller.abort();
  }, [member.species]);

  return (
    <div className="max-h-[min(32rem,calc(100vh-8rem))] overflow-y-auto overscroll-contain rounded-[1rem] border border-line-strong bg-[linear-gradient(180deg,rgba(12,32,40,0.96),rgba(8,21,25,0.96))] p-4 shadow-[0_22px_50px_rgba(0,0,0,0.34)] backdrop-blur-md">
      <div className="sticky top-0 z-10 -mx-4 flex items-start justify-between gap-3 border-b border-line/60 bg-[linear-gradient(180deg,rgba(12,32,40,0.98),rgba(8,21,25,0.94))] px-4 pb-3 pt-1 backdrop-blur-md">
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

      {dexDetails?.category || dexDetails?.height || dexDetails?.weight || dexDetails?.flavorText ? (
        <div className="mt-4">
          <p className="display-face text-xs text-accent">Dex Notes</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {dexDetails?.category ? <StarterLensCard label="Categoria" value={dexDetails.category} /> : null}
            {dexDetails?.height ? <StarterLensCard label="Altura" value={`${dexDetails.height.toFixed(1)} m`} /> : null}
            {dexDetails?.weight ? <StarterLensCard label="Peso" value={`${dexDetails.weight.toFixed(1)} kg`} /> : null}
          </div>
          {dexDetails?.flavorText ? (
            <p className="mt-3 rounded-[0.7rem] border border-line bg-surface-3 px-3 py-3 text-sm text-muted">
              {dexDetails.flavorText}
            </p>
          ) : null}
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
