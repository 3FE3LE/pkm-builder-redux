import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RoleAxesCard } from "@/components/team/RoleAxes";

function createRole() {
  return {
    primaryRole: "wallbreaker",
    supportRole: "support",
    roleScores: {
      wallbreaker: 7,
      setupSweeper: 5,
      cleaner: 4,
      revengeKiller: 3,
      speedControl: 2,
      bulkyPivot: 6,
      support: 1,
      defensiveGlue: 0,
    },
  } as never;
}

describe("RoleAxesCard", () => {
  it("renders nothing when there is no role recommendation", () => {
    const { container } = render(<RoleAxesCard />);

    expect(container.firstChild).toBeNull();
  });

  it("renders the radar and exposes role tooltips", async () => {
    const user = userEvent.setup();
    const { container } = render(<RoleAxesCard role={createRole()} compact />);
    const chart = container.querySelector('svg[viewBox="0 0 116 116"]');

    expect(chart?.querySelectorAll("polygon")).toHaveLength(5);
    expect(chart?.querySelectorAll("line")).toHaveLength(8);
    expect(chart?.querySelectorAll("circle")).toHaveLength(8);
    expect(screen.getAllByRole("button")).toHaveLength(8);

    await user.hover(screen.getAllByRole("button")[0]);
    expect((await screen.findByRole("tooltip")).textContent).toContain("wallbreaker");
  });
});
