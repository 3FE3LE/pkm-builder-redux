import {
  createEmptyRunState,
  type RunCompositionState,
  type RunState,
} from "@/lib/runState";
import type { EditableMember, PokemonGender } from "@/lib/builderStore/types";

export function normalizeGender(value: unknown): PokemonGender {
  return value === "male" || value === "female" ? value : "unknown";
}

export function normalizeEditableMember(member: EditableMember): EditableMember {
  return {
    ...member,
    locked: member.locked ?? false,
    shiny: member.shiny ?? false,
    gender: normalizeGender(member.gender),
  };
}

export function createFallbackComposition(memberIds: string[] = []): RunCompositionState {
  return {
    id: crypto.randomUUID(),
    name: "Main Team",
    memberIds,
  };
}

export function upsertLibraryMembers(
  library: EditableMember[],
  members: EditableMember[],
): EditableMember[] {
  const nextLibrary = [...library];

  for (const member of members) {
    const normalizedMember = normalizeEditableMember(member);
    const existingIndex = nextLibrary.findIndex((entry) => entry.id === normalizedMember.id);

    if (existingIndex === -1) {
      nextLibrary.push(normalizedMember);
      continue;
    }

    nextLibrary[existingIndex] = normalizedMember;
  }

  return nextLibrary;
}

export function ensureRosterState(run: RunState): RunState {
  const defaultRoster = createEmptyRunState().roster;
  const normalizedTeam = (run.roster.currentTeam ?? []).map(normalizeEditableMember);
  const normalizedLibrary = (run.roster.pokemonLibrary ?? []).map(normalizeEditableMember);
  const librarySeed = upsertLibraryMembers(normalizedLibrary, normalizedTeam);
  const safeMemberIds = new Set(librarySeed.map((member) => member.id));
  const normalizedCompositions =
    run.roster.compositions
      ?.map((composition, index) => ({
        id: composition.id || crypto.randomUUID(),
        name: composition.name?.trim() || `Team ${index + 1}`,
        memberIds: (composition.memberIds ?? []).filter((memberId) => safeMemberIds.has(memberId)),
      })) ?? [];
  const fallbackComposition =
    normalizedCompositions[0] ??
    createFallbackComposition(normalizedTeam.map((member) => member.id));
  const activeCompositionId = normalizedCompositions.some(
    (composition) => composition.id === run.roster.activeCompositionId,
  )
    ? run.roster.activeCompositionId
    : fallbackComposition.id;
  const compositions =
    normalizedCompositions.length > 0 ? normalizedCompositions : [fallbackComposition];
  const activeComposition =
    compositions.find((composition) => composition.id === activeCompositionId) ?? compositions[0];
  const activeTeam = activeComposition.memberIds
    .map((memberId) => librarySeed.find((member) => member.id === memberId))
    .filter((member): member is EditableMember => Boolean(member));
  const pcBoxIds = Array.from(
    new Set((run.roster.pcBoxIds ?? []).filter((memberId) => safeMemberIds.has(memberId))),
  );

  return {
    ...run,
    roster: {
      ...defaultRoster,
      ...run.roster,
      pokemonLibrary: librarySeed,
      compositions,
      activeCompositionId,
      pcBoxIds,
      currentTeam: activeTeam,
      activeMemberId:
        activeTeam.some((member) => member.id === run.roster.activeMemberId)
          ? run.roster.activeMemberId
          : activeTeam[0]?.id ?? null,
      editorMemberId:
        activeTeam.some((member) => member.id === run.roster.editorMemberId)
          ? run.roster.editorMemberId
          : null,
    },
  };
}

export function updateRoster(
  run: RunState,
  updater: (roster: RunState["roster"]) => RunState["roster"],
): RunState {
  return ensureRosterState({
    ...run,
    roster: updater(run.roster),
  });
}
