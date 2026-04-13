"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  useTeamAnalysis,
  useTeamCatalogs,
  useTeamCompare,
  useTeamEvolution,
  useTeamMovePicker,
  useTeamRoster,
  useTeamSession,
} from "@/components/BuilderProvider";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { EditorPage } from "@/components/team/editor/Page";
import { LoadingState } from "@/components/team/screens/LoadingState";
import { RouteGuardScreen } from "@/components/team/screens/RouteGuardScreen";
import { starters } from "@/lib/builder";
import { createId } from "@/lib/createId";
import { buildEvolutionEligibility } from "@/lib/domain/evolutionEligibility";
import { getBaseSpeciesName } from "@/lib/forms";
import { normalizeName } from "@/lib/domain/names";

export function EditorPageRoute() {
  const params = useParams<{ memberId?: string }>();
  const router = useRouter();
  const memberId = params?.memberId ?? "";
  const session = useTeamSession();
  const catalogs = useTeamCatalogs();
  const team = useTeamRoster();
  const analysis = useTeamAnalysis();
  const compare = useTeamCompare();
  const evolution = useTeamEvolution();
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
  const dexSpeciesEntry = useMemo(() => {
    const candidates = [
      resolved?.species,
      member?.species,
      member ? getBaseSpeciesName(member.species) : "",
    ]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);

    for (const candidate of candidates) {
      const normalizedCandidate = normalizeName(candidate);
      const directMatch = catalogs.speciesCatalog.find(
        (entry) =>
          entry.slug === normalizedCandidate ||
          normalizeName(entry.name) === normalizedCandidate,
      );
      if (directMatch) {
        return directMatch;
      }
    }

    return null;
  }, [catalogs.speciesCatalog, member, resolved]);
  const dexDetailHref = dexSpeciesEntry ? `/team/dex/pokemon/${dexSpeciesEntry.slug}` : undefined;
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
    return <OnboardingScreen />;
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
      pokemonIndex={catalogs.pokemonIndex as Record<string, { name?: string; nextEvolutions?: string[] }>}
      resolvedTeam={team.resolvedTeam}
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
        compare.actions.updateMember(0, { ...member, id: createId() });
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
      dexDetailHref={dexDetailHref}
      dexSpeciesSlug={dexSpeciesEntry?.slug}
      evolutionState={evolution.state}
      localTime={team.localTime}
      evolutionConstraints={session.evolutionConstraints}
      onAutoRequestEvolution={(projectedResolved) =>
        evolution.actions.openProjected(member.id, projectedResolved)
      }
      onSelectEvolution={evolution.actions.select}
      onCloseEvolution={evolution.actions.close}
      onConfirmEvolution={evolution.actions.confirm}
    />
  );
}
