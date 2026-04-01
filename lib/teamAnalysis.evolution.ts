import { formatName } from "@/lib/domain/names";

import type { RemoteEvolutionDetail } from "@/lib/teamAnalysis.types";

function formatLocationName(input: string) {
  return input
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((segment) => {
      if (segment.length <= 3) {
        return segment.toUpperCase();
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join(" ");
}

export function formatCanonicalEvolutionMethod(detail: RemoteEvolutionDetail) {
  const parts: string[] = [];

  if (detail.item) {
    parts.push(detail.item);
  }
  if (detail.minLevel) {
    parts.push(`Lv ${detail.minLevel}`);
  }

  if (detail.trigger === "trade") {
    if (detail.tradeSpecies) {
      parts.push(`Trade for ${detail.tradeSpecies}`);
    } else if (detail.heldItem) {
      parts.push(`Trade + ${detail.heldItem}`);
    } else {
      parts.push("Trade");
    }
  } else if (detail.heldItem) {
    parts.push(`Hold ${detail.heldItem}`);
  }

  if (detail.minHappiness) {
    parts.push("Friendship");
  }
  if (detail.minBeauty) {
    parts.push(`Beauty ${detail.minBeauty}`);
  }
  if (detail.minAffection) {
    parts.push(`Affection ${detail.minAffection}`);
  }
  if (detail.knownMove) {
    parts.push(`Move: ${detail.knownMove}`);
  }
  if (detail.knownMoveType) {
    parts.push(`Know ${detail.knownMoveType} move`);
  }
  if (detail.partySpecies) {
    parts.push(`Party: ${detail.partySpecies}`);
  }
  if (detail.partyType) {
    parts.push(`Party ${detail.partyType}`);
  }

  if (detail.relativePhysicalStats === 1) {
    parts.push("Atk > Def");
  } else if (detail.relativePhysicalStats === 0) {
    parts.push("Atk = Def");
  } else if (detail.relativePhysicalStats === -1) {
    parts.push("Atk < Def");
  }

  if (detail.gender === 1) {
    parts.push("Female");
  } else if (detail.gender === 2) {
    parts.push("Male");
  }
  if (detail.timeOfDay) {
    parts.push(formatName(detail.timeOfDay));
  }
  if (detail.location) {
    parts.push(formatLocationName(detail.location));
  }
  if (detail.needsOverworldRain) {
    parts.push("Rain");
  }
  if (detail.turnUpsideDown) {
    parts.push("Upside-down");
  }

  if (!parts.length) {
    if (detail.trigger === "use-item") {
      return "Use item";
    }
    if (detail.trigger === "level-up") {
      return "Level up";
    }
    if (detail.trigger === "trade") {
      return "Trade";
    }
    return "Special";
  }

  return parts.join(" · ");
}

export function buildDocumentedEvolutionDetail(change: { target: string; method: string }): RemoteEvolutionDetail {
  const detail: RemoteEvolutionDetail = {
    target: change.target,
    trigger: null,
    minLevel: null,
    item: null,
    heldItem: null,
    knownMove: null,
    knownMoveType: null,
    minHappiness: null,
    minBeauty: null,
    minAffection: null,
    partySpecies: null,
    partyType: null,
    tradeSpecies: null,
    timeOfDay: null,
    location: null,
    gender: null,
    relativePhysicalStats: null,
    needsOverworldRain: false,
    turnUpsideDown: false,
  };

  const method = change.method.trim();
  const levelMatch = method.match(/^Lv\s+(\d+)$/i);
  if (levelMatch) {
    detail.trigger = "level-up";
    detail.minLevel = Number(levelMatch[1]);
    return detail;
  }

  if (method.toLowerCase() === "normal method") {
    detail.trigger = "level-up";
    return detail;
  }

  if (/friendship/i.test(method)) {
    detail.trigger = "level-up";
    detail.minHappiness = 220;
    return detail;
  }

  const moveMatch = method.match(/^Move:\s+(.+)$/i);
  if (moveMatch) {
    detail.trigger = "level-up";
    detail.knownMove = moveMatch[1].trim();
    return detail;
  }

  const partyMatch = method.match(/^Party:\s+(.+)$/i);
  if (partyMatch) {
    detail.trigger = "level-up";
    detail.partySpecies = partyMatch[1].trim();
    return detail;
  }

  detail.trigger = "use-item";
  detail.item = method;
  return detail;
}
