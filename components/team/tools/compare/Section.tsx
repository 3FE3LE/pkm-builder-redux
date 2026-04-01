"use client";

import {
  MemberPanel,
  Summary,
  buildState,
} from "@/components/team/tools/compare/panels";
import { CompareDropZone } from "@/components/team/tools/compare/DropZone";
import type { EditableMember } from "@/lib/builderStore";
import type { BattleWeather } from "@/lib/domain/battle";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

type CompareMembers = import("@/hooks/types").CompareMembers;

export function WorkspaceSection({
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
  const left = buildState(leftMember, leftResolved, abilityCatalog, heldItemCatalog, battleWeather);
  const right = buildState(rightMember, rightResolved, abilityCatalog, heldItemCatalog, battleWeather);

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
            <MemberPanel
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
            <MemberPanel
              index={1}
              state={right}
              speciesCatalog={speciesCatalog}
              heldItemCatalog={heldItemCatalog}
              onChangeMember={onChangeMember}
            />
          </CompareDropZone>
        </div>
        <div className="col-span-2">
          <Summary left={left} right={right} />
        </div>
      </div>
      <div className="hidden xl:grid xl:grid-cols-[minmax(0,1fr)_18rem_minmax(0,1fr)] xl:items-start xl:gap-3">
        <CompareDropZone
          slot={0}
          pulseToken={dropPulse?.slot === 0 ? dropPulse.token : null}
          onClear={onClearMember}
          hasSpecies={Boolean(leftMember.species.trim())}
        >
          <MemberPanel
            index={0}
            state={left}
            speciesCatalog={speciesCatalog}
            heldItemCatalog={heldItemCatalog}
            onChangeMember={onChangeMember}
          />
        </CompareDropZone>
        <Summary left={left} right={right} />
        <CompareDropZone
          slot={1}
          pulseToken={dropPulse?.slot === 1 ? dropPulse.token : null}
          onClear={onClearMember}
          hasSpecies={Boolean(rightMember.species.trim())}
        >
          <MemberPanel
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
