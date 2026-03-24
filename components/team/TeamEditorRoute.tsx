"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PokemonEditorSheet } from "@/components/team/EditorSheet";
import {
  useTeamAnalysis,
  useTeamCatalogs,
  useTeamMovePicker,
  useTeamRoster,
  useTeamSession,
} from "@/components/BuilderProvider";
import { buildEvolutionEligibility } from "@/lib/domain/evolutionEligibility";

type TeamEditorRouteProps = {
  memberId: string;
  closeMode: "back" | "replace";
};

export function TeamEditorRoute({ memberId, closeMode }: TeamEditorRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useTeamSession();
  const catalogs = useTeamCatalogs();
  const team = useTeamRoster();
  const analysis = useTeamAnalysis();
  const movePicker = useTeamMovePicker();
  const [open, setOpen] = useState(true);
  const editorNonce = searchParams.get("editorNonce") ?? "";

  const member = useMemo(
    () => team.currentTeam.find((entry) => entry.id === memberId),
    [memberId, team.currentTeam],
  );
  const resolved = useMemo(
    () => team.resolvedTeam.find((entry) => entry.key === memberId),
    [memberId, team.resolvedTeam],
  );
  const editorEvolutionEligibility = useMemo(
    () =>
      buildEvolutionEligibility(
        resolved,
        team.resolvedTeam,
        team.localTime,
        session.evolutionConstraints,
      ),
    [resolved, session.evolutionConstraints, team.localTime, team.resolvedTeam],
  );

  const closeHref = useMemo(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("editorNonce");
    const query = nextParams.toString();
    return query ? `/team?${query}` : "/team";
  }, [searchParams]);

  function navigateAfterClose() {
    if (movePicker.memberId === memberId) {
      movePicker.actions.close();
    }
    if (closeMode === "back") {
      router.back();
      return;
    }
    router.replace(closeHref);
  }

  function requestClose() {
    setOpen(false);
  }

  if (!member) {
    return null;
  }

  return (
    <PokemonEditorSheet
      key={`editor-sheet-${memberId}-${editorNonce}`}
      member={member}
      open={closeMode === "back" ? open && team.editorMemberId === memberId : open}
      resolved={resolved}
      weather={session.battleWeather}
      roleRecommendation={analysis.checkpointRisk.roleSnapshot.members.find(
        (entry) => entry.key === member.id,
      )}
      speciesCatalog={catalogs.speciesCatalog}
      abilityCatalog={catalogs.abilityCatalog}
      itemCatalog={catalogs.itemCatalog}
      onOpenChange={(open) => {
        if (!open) {
          if (!member.species.trim()) {
            team.actions.removeMember(member.id);
          }
          team.actions.closeEditor();
          requestClose();
        }
      }}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) {
          navigateAfterClose();
        }
      }}
      onChange={(next) => team.actions.updateMember(next.id, next)}
      onOpenMoveModal={(slotIndex) => movePicker.actions.open(member.id, slotIndex)}
      onRemoveMoveAt={(index) => team.actions.removeMoveAtForMember(member.id, index)}
      onReorderMove={(fromIndex, toIndex) =>
        team.actions.reorderMovesForMember(member.id, fromIndex, toIndex)
      }
      onRequestEvolution={() => team.actions.requestEvolutionForMember(member.id)}
      editorEvolutionEligibility={editorEvolutionEligibility}
      selectedMoveIndex={team.editorMoveSelection}
      onSelectMoveIndex={team.actions.setEditorMoveSelection}
      movePickerMemberId={movePicker.memberId}
      movePickerSlotIndex={movePicker.slotIndex}
      movePickerTab={movePicker.tab}
      movePickerActiveMember={movePicker.activeMember}
      currentMoves={
        team.currentTeam.find((entry) => entry.id === movePicker.memberId)?.moves ?? []
      }
      onMovePickerTabChange={movePicker.actions.setTab}
      onCloseMovePicker={movePicker.actions.close}
      onPickMove={movePicker.actions.pickMove}
      getMoveSurfaceStyle={movePicker.getSurfaceStyle}
    />
  );
}
