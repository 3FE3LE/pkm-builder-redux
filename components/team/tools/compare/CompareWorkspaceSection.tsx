"use client";

import clsx from "clsx";
import { type ReactNode } from "react";
import { motion } from "motion/react";
import { useDroppable } from "@dnd-kit/core";

import {
  CompareMemberPanel,
  ComparisonSummary,
  buildCompareState,
} from "@/components/team/tools/compare/ComparePanels";
import type { EditableMember } from "@/lib/builderStore";
import type { BattleWeather } from "@/lib/domain/battle";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

type CompareMembers = import("@/hooks/types").CompareMembers;

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
