import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

describe("Tooltip", () => {
  it("renders provider as a passthrough", () => {
    render(
      <TooltipProvider>
        <div>inside-provider</div>
      </TooltipProvider>,
    );

    expect(screen.getByText("inside-provider")).toBeTruthy();
  });

  it("accepts trigger/content props and renders the trigger", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hint</TooltipTrigger>
          <TooltipContent sideOffset={12} className="custom-tooltip">
            Tooltip body
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Hint" });
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute("data-slot")).toBe("tooltip-trigger");
  });

  it("renders with provider and trigger/content composition", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hint</TooltipTrigger>
          <TooltipContent>Tooltip body</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Hint" })).toBeTruthy();
  });
});
