import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

describe("Tooltip", () => {
  it("renders provider as a passthrough", () => {
    render(
      <TooltipProvider>
        <div>inside-provider</div>
      </TooltipProvider>,
    );

    expect(screen.getByText("inside-provider")).toBeTruthy();
  });

  it("opens on hover and focus, then closes on leave and blur", () => {
    render(
      <Tooltip>
        <TooltipTrigger>Hint</TooltipTrigger>
        <TooltipContent sideOffset={12} className="custom-tooltip">
          Tooltip body
        </TooltipContent>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", { name: "Hint" });
    Object.defineProperty(trigger, "getBoundingClientRect", {
      value: () =>
        ({
          left: 40,
          top: 80,
          width: 24,
          height: 16,
          right: 64,
          bottom: 96,
          x: 40,
          y: 80,
          toJSON: () => ({}),
        }) satisfies DOMRect,
    });

    fireEvent.mouseEnter(trigger);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.textContent).toContain("Tooltip body");
    expect(tooltip.className).toContain("custom-tooltip");
    expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.getAttribute("id"));

    fireEvent.scroll(window);
    fireEvent.resize(window);

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();

    fireEvent.focus(trigger);
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.blur(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("throws when trigger or content are rendered outside Tooltip", () => {
    expect(() => render(<TooltipTrigger>Broken</TooltipTrigger>)).toThrow(
      "Tooltip components must be used within Tooltip",
    );
    expect(() => render(<TooltipContent>Broken</TooltipContent>)).toThrow(
      "Tooltip components must be used within Tooltip",
    );
  });
});
