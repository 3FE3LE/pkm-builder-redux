"use client";

import { useMemo, useState } from "react";

import { RosterTypingCard } from "@/components/team/tools/type-tiers/RosterTypingCard";
import { TierListCard } from "@/components/team/tools/type-tiers/TierListCard";
import { PlaygroundCard } from "@/components/team/tools/type-tiers/PlaygroundCard";
import {
  buildDefensiveTypeTierList,
  buildOffensiveTypeTierList,
  rankRosterByTyping,
} from "@/lib/domain/typeTierList";

import type { TypeTierMetric, TypeTierSectionProps } from "@/components/team/tools/type-tiers/types";

export function TypeTierListSection({
  resolvedTeam,
  speciesCatalog,
}: TypeTierSectionProps) {
  const [metric, setMetric] = useState<TypeTierMetric>("offense");
  const [showAll, setShowAll] = useState(false);
  const offensiveTierList = useMemo(() => buildOffensiveTypeTierList(), []);
  const defensiveTierList = useMemo(() => buildDefensiveTypeTierList(), []);
  const activeTierList = metric === "offense" ? offensiveTierList : defensiveTierList;
  const visibleTierList = showAll ? activeTierList : activeTierList.slice(0, 10);
  const rankedRoster = useMemo(
    () =>
      rankRosterByTyping(
        resolvedTeam.map((member) => ({
          key: member.key,
          species: member.species,
          nickname: member.species,
          resolvedTypes: member.resolvedTypes,
        })),
      ),
    [resolvedTeam],
  );

  return (
    <section className="space-y-4">
      <div>
        <p className="display-face text-sm text-accent">Type Tiers</p>
        <h1 className="pixel-face mt-2 text-2xl text-text">Typing rank y roster</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Una sola lista ordenable por ofensiva o defensa. El score va de 0 a 100 y cada combinación sugiere una especie real de la dex local cuando existe.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <TierListCard
          metric={metric}
          setMetric={setMetric}
          showAll={showAll}
          setShowAll={setShowAll}
          visibleTierList={visibleTierList}
          speciesCatalog={speciesCatalog}
        />
        <RosterTypingCard rankedRoster={rankedRoster} />
      </div>

      <PlaygroundCard />
    </section>
  );
}
