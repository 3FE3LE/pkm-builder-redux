import test from "node:test";
import assert from "node:assert/strict";

import { buildReplacementPlanner } from "../../lib/domain/replacementPlanner";

test("marks a slot for future replacement when a later milestone has a positive upgrade", () => {
  const plans = buildReplacementPlanner({
    teamSpecies: ["Servine", "Herdier"],
    currentMilestoneId: "floccesy",
    currentMilestoneLabel: "Antes de Roxie",
    milestoneDeltas: [
      {
        milestoneId: "floccesy",
        milestoneLabel: "Antes de Roxie",
        deltas: [],
      },
      {
        milestoneId: "castelia",
        milestoneLabel: "Antes de Elesa",
        deltas: [
          {
            species: "Sandile",
            action: "replace",
            replacedSlot: "Herdier",
            source: "Wild",
            area: "Route 4",
            riskDelta: 1.2,
            scoreDelta: 13,
          },
        ],
      },
    ],
  });

  const herdierPlan = plans.find((entry) => entry.species === "Herdier");
  const servinePlan = plans.find((entry) => entry.species === "Servine");

  assert.equal(herdierPlan?.status, "upgrade-soon");
  assert.equal(herdierPlan?.keepUntil, "Antes de Elesa");
  assert.equal(herdierPlan?.replacementOptions[0]?.species, "Sandile");
  assert.equal(servinePlan?.status, "hold");
});
