"use client";

import { useEffect, useRef } from "react";
import { redirect, useParams, useRouter, useSearchParams } from "next/navigation";

import { LoadingState } from "@/components/team/screens/LoadingState";
import { WorkspaceScreen } from "@/components/team/screens/WorkspaceScreen";
import { useTeamRoster, useTeamSession } from "@/components/BuilderProvider";
import { importPokemonFromHash } from "@/lib/pokemonTransfer";

export function WorkspaceRoute() {
  const session = useTeamSession();
  const team = useTeamRoster();
  const router = useRouter();
  const params = useParams<{ token?: string }>();
  const searchParams = useSearchParams();
  const handledImportRef = useRef<string | null>(null);
  const sharedImportToken = params?.token ?? searchParams.get("m");

  useEffect(() => {
    if (!session.hydrated || !sharedImportToken || handledImportRef.current === sharedImportToken) {
      return;
    }

    handledImportRef.current = sharedImportToken;
    const imported = importPokemonFromHash(sharedImportToken);
    if (imported.ok) {
      team.actions.saveMemberToPc(imported.member);
      if (!session.builderStarted) {
        session.actions.setBuilderStarted(true);
      }
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("m");
    const query = nextParams.toString();
    router.replace(query ? `/team?${query}` : "/team");
  }, [
    params,
    router,
    searchParams,
    session.builderStarted,
    session.hydrated,
    session.actions,
    sharedImportToken,
    team.actions,
  ]);

  if (!session.hydrated) {
    return <LoadingState />;
  }

  if (!session.builderStarted) {
    redirect("/onboarding");
  }

  return <WorkspaceScreen />;
}
