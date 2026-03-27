import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/BuilderShared", () => ({
  TypeBadge: ({
    type,
    trailing,
  }: {
    type: string;
    trailing?: number;
  }) => <span>{trailing ? `${type}-${trailing}` : type}</span>,
}));

import {
  CoverageBadge,
  MetaBadge,
  MiniPill,
  SpreadInput,
  StatBar,
  StatCard,
} from "@/components/team/UI";

describe("team UI helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders badges, pills, cards, and overflow stat bars", () => {
    const { container } = render(
      <div>
        <CoverageBadge label="Ground" type="Ground" bucket="x2" />
        <MiniPill title="dex-note">Fast learner</MiniPill>
        <MetaBadge label="Priority" />
        <StatCard label="BST" value="525" />
        <StatBar label="Speed" value={140} max={120} />
      </div>,
    );

    expect(screen.getByText("Ground")).toBeTruthy();
    expect(screen.getByText("Fast learner")).toBeTruthy();
    expect(screen.getByText("Priority")).toBeTruthy();
    expect(screen.getByText("BST")).toBeTruthy();
    expect(screen.getByText("525")).toBeTruthy();
    expect(screen.getByText("Speed")).toBeTruthy();
    expect(screen.getByTitle("Excede la escala visual base de 120")).toBeTruthy();
    expect(container.querySelector(".stat-bar-fill-good")).toBeTruthy();
    expect(screen.getByText("60 malo")).toBeTruthy();
    expect(screen.getByText("100 bueno")).toBeTruthy();
  });

  it("updates horizontal spread inputs through buttons and direct typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SpreadInput
        label="HP"
        value={5}
        max={31}
        onChange={onChange}
        error="IV invalido"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Bajar HP" }));
    await user.click(screen.getByRole("button", { name: "Subir HP" }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "12" } });

    expect(onChange).toHaveBeenNthCalledWith(1, 4);
    expect(onChange).toHaveBeenNthCalledWith(2, 6);
    expect(onChange).toHaveBeenNthCalledWith(3, 12);
    expect(screen.getByText("IV invalido")).toBeTruthy();
  });

  it("supports responsive spread controls with hidden labels and autofocused input", () => {
    const onChange = vi.fn();

    render(
      <SpreadInput
        label="Atk"
        value={10}
        max={31}
        onChange={onChange}
        orientation="responsive"
        hideLabel
        autoFocus
      />,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Bajar Atk" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Subir Atk" }));

    expect(onChange).toHaveBeenNthCalledWith(1, 9);
    expect(onChange).toHaveBeenNthCalledWith(2, 11);
    expect(screen.queryByText("Atk")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("spinbutton"));
  });

  it("supports vertical spread controls and repeated hold stepping", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState(3);
      return (
        <SpreadInput
          label="Def"
          value={value}
          max={5}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
          orientation="vertical"
        />
      );
    }

    render(<Harness />);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Subir Def" }));
    vi.advanceTimersByTime(320);
    fireEvent.pointerUp(window);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Bajar Def" }));
    vi.advanceTimersByTime(320);
    fireEvent.pointerCancel(window);
    fireEvent.blur(window);

    expect(screen.getByText("Def")).toBeTruthy();
    expect(onChange).toHaveBeenCalledWith(4);
    expect(onChange).toHaveBeenCalledWith(5);
    expect(onChange).toHaveBeenCalledWith(3);
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
