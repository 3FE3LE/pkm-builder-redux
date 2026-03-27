import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "@/components/ui/Switch";

describe("Switch", () => {
  it("renders checked state and toggles through onCheckedChange", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(<Switch checked onCheckedChange={onCheckedChange} className="extra-class" />);

    const element = screen.getByRole("switch");
    expect(element.getAttribute("aria-checked")).toBe("true");
    expect(element.getAttribute("data-state")).toBe("checked");
    expect(element.className).toContain("extra-class");

    await user.click(element);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it("renders unchecked state and keeps button attributes", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(<Switch checked={false} disabled onCheckedChange={onCheckedChange} />);

    const element = screen.getByRole("switch");
    expect(element.getAttribute("aria-checked")).toBe("false");
    expect(element.getAttribute("data-state")).toBe("unchecked");
    expect(element.getAttribute("disabled")).toBe("");

    await user.click(element);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
