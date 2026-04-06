"use client";

import { useMemo } from "react";
import { redirect, useParams, useRouter } from "next/navigation";

import {
  useTeamAnalysis,
  useTeamCatalogs,
  useTeamCompare,
  useTeamMovePicker,
  useTeamRoster,
  useTeamSession,
} from "@/components/BuilderProvider";
import { EditorPage } from "@/components/team/editor/Page";
import { LoadingState } from "@/components/team/screens/LoadingState";
import { RouteGuardScreen } from "@/components/team/screens/RouteGuardScreen";
import { starters } from "@/lib/builder";
import { buildEvolutionEligibility } from "@/lib/domain/evolutionEligibility";

export function EditorPageRoute() {
  const params = useParams<{ memberId?: string }>();
  const router = useRouter();
  const memberId = params?.memberId ?? "";
  const session = useTeamSession();
  const catalogs = useTeamCatalogs();
  const team = useTeamRoster();
  const analysis = useTeamAnalysis();
  const compare = useTeamCompare();
  const movePicker = useTeamMovePicker();

  const member = useMemo(
    () =>
      team.currentTeam.find((entry) => entry.id === memberId) ??
      team.pokemonLibrary.find((entry) => entry.id === memberId),
    [memberId, team.currentTeam, team.pokemonLibrary],
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
  const orderedTeamMembers = useMemo(
    () => team.currentTeam.filter((entry) => entry.species.trim()),
    [team.currentTeam],
  );
  const currentMemberIndex = useMemo(
    () => orderedTeamMembers.findIndex((entry) => entry.id === memberId),
    [memberId, orderedTeamMembers],
  );
  const previousMember =
    currentMemberIndex > 0 ? orderedTeamMembers[currentMemberIndex - 1] : undefined;
  const nextMember =
    currentMemberIndex >= 0 && currentMemberIndex < orderedTeamMembers.length - 1
      ? orderedTeamMembers[currentMemberIndex + 1]
      : undefined;

  if (!session.hydrated) {
    return <LoadingState variant="editor" />;
  }

  if (!session.builderStarted) {
    redirect("/onboarding");
  }

  if (!member) {
    return (
      <RouteGuardScreen
        title="Pokemon no encontrado"
        description="Ese miembro ya no existe en el roster o en la caja."
        ctaHref="/team"
        ctaLabel="Volver al team"
      />
    );
  }

  return (
    <EditorPage
      member={member}
      resolved={resolved}
      weather={session.battleWeather}
      roleRecommendation={analysis.checkpointRisk.roleSnapshot.members.find(
        (entry) => entry.key === member.id,
      )}
      moveRecommendations={analysis.moveRecommendations}
      starterSpeciesLine={starters[session.starter].stageSpecies}
      speciesCatalog={catalogs.speciesCatalog}
      abilityCatalog={catalogs.abilityCatalog}
      itemCatalog={catalogs.itemCatalog}
      onChange={(next) => team.actions.updateMember(next.id, next)}
      onImportToPc={team.actions.saveMemberToPc}
      onOpenMoveModal={(slotIndex) => movePicker.actions.open(member.id, slotIndex)}
      onRemoveMoveAt={(index) => team.actions.removeMoveAtForMember(member.id, index)}
      onReorderMove={(fromIndex, toIndex) =>
        team.actions.reorderMovesForMember(member.id, fromIndex, toIndex)
      }
      onRequestEvolution={() => team.actions.requestEvolutionForMember(member.id)}
      onToggleLock={() => {
        team.actions.updateMember(member.id, (current) => ({
          ...current,
          locked: !current.locked,
        }));
      }}
      onAssignToCompare={() => {
        compare.actions.updateMember(0, { ...member, id: crypto.randomUUID() });
        router.push("/team/tools?tool=compare");
      }}
      previousMemberHref={
        previousMember ? `/team/pokemon/${previousMember.id}` : undefined
      }
      previousMemberLabel={
        previousMember
          ? `Pokemon anterior: ${previousMember.nickname || previousMember.species || "slot anterior"}`
          : undefined
      }
      nextMemberHref={nextMember ? `/team/pokemon/${nextMember.id}` : undefined}
      nextMemberLabel={
        nextMember
          ? `Pokemon siguiente: ${nextMember.nickname || nextMember.species || "slot siguiente"}`
          : undefined
      }
      editorEvolutionEligibility={editorEvolutionEligibility}
      selectedMoveIndex={team.editorMoveSelection}
      onSelectMoveIndex={team.actions.setEditorMoveSelection}
      movePickerMemberId={movePicker.memberId}
      movePickerSlotIndex={movePicker.slotIndex}
      movePickerTab={movePicker.tab}
      movePickerActiveMember={movePicker.activeMember}
      currentMoves={member.moves}
      onMovePickerTabChange={movePicker.actions.setTab}
      onCloseMovePicker={movePicker.actions.close}
      onPickMove={movePicker.actions.pickMove}
      getMoveSurfaceStyle={movePicker.getSurfaceStyle}
    />
  );
}
