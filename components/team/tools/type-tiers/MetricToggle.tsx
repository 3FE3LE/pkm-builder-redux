"use client";

import { Shield, Swords } from "lucide-react";

import { Button } from "@/components/ui/Button";

import type { TypeTierMetric } from "@/components/team/tools/type-tiers/types";

export function MetricToggle({
  metric,
  onChange,
}: {
  metric: TypeTierMetric;
  onChange: (next: TypeTierMetric) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-[0.8rem] border border-line bg-surface-3 p-1">
      <Button
        type="button"
        variant={metric === "offense" ? "default" : "ghost"}
        size="icon-sm"
        onClick={() => onChange("offense")}
        aria-label="Orden ofensivo"
        title="Orden ofensivo"
      >
        <Swords className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={metric === "defense" ? "default" : "ghost"}
        size="icon-sm"
        onClick={() => onChange("defense")}
        aria-label="Orden defensivo"
        title="Orden defensivo"
      >
        <Shield className="h-4 w-4" />
      </Button>
    </div>
  );
}
