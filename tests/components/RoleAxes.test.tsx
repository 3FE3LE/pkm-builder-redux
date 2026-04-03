import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { RoleAxesCard } from "@/components/team/shared/RoleAxes";

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
    ...props
  }: {
    children: ReactNode;
    [key: string]: unknown;
  }) => <button type="button" {...props}>{children}</button>,
  TooltipContent: ({ children }: { children: ReactNode }) => (
    <div role="tooltip">{children}</div>
  ),
}));
import { TooltipProvider } from "@/components/ui/tooltip";

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
    const { container } = render(
      <TooltipProvider>
        <RoleAxesCard role={createRole()} compact />
      </TooltipProvider>,
    );
    const chart = container.querySelector('svg[viewBox="0 0 116 116"]');

    expect(chart?.querySelectorAll("polygon")).toHaveLength(5);
    expect(chart?.querySelectorAll("line")).toHaveLength(8);
    expect(chart?.querySelectorAll("circle")).toHaveLength(8);
    expect(screen.getAllByRole("button")).toHaveLength(8);

    await user.hover(screen.getAllByRole("button")[0]);
    expect(
      screen.getAllByRole("tooltip").some((tooltip) =>
        tooltip.textContent?.includes("wallbreaker"),
      ),
    ).toBe(true);
  });
});
