import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@base-ui/react/dialog", () => ({
  Dialog: {
    Root: ({ children }: { children?: ReactNode }) => <div data-slot="root">{children}</div>,
    Trigger: ({ children, ...props }: { children?: ReactNode }) => (
      <button {...props}>{children}</button>
    ),
    Close: ({ children, ...props }: { children?: ReactNode }) => (
      <button {...props}>{children}</button>
    ),
    Portal: ({ children }: { children?: ReactNode }) => <div data-slot="portal">{children}</div>,
    Backdrop: ({ children, className, ...props }: { children?: ReactNode; className?: string }) => (
      <div data-slot="backdrop" className={className} {...props}>
        {children}
      </div>
    ),
    Popup: ({ children, className, ...props }: { children?: ReactNode; className?: string }) => (
      <div data-slot="popup" className={className} {...props}>
        {children}
      </div>
    ),
    Title: ({ children, className, ...props }: { children?: ReactNode; className?: string }) => (
      <h2 className={className} {...props}>
        {children}
      </h2>
    ),
    Description: ({
      children,
      className,
      ...props
    }: {
      children?: ReactNode;
      className?: string;
    }) => (
      <p className={className} {...props}>
        {children}
      </p>
    ),
  },
}));

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";

describe("Sheet", () => {
  it("renders the content shell and requests close from overlay and close button", async () => {
    const user = userEvent.setup();
    const onRequestClose = vi.fn();
    const { container } = render(
      <Sheet open>
        <SheetContent side="left" onRequestClose={onRequestClose}>
          <SheetHeader>
            <SheetTitle>Editor</SheetTitle>
          </SheetHeader>
          <div>Body</div>
        </SheetContent>
      </Sheet>,
    );

    expect(container.querySelector('[data-slot="sheet-overlay"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="sheet-content"]')?.getAttribute("data-side")).toBe("left");
    expect(screen.getByText("Editor")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();

    await user.click(container.querySelector('[data-slot="sheet-overlay"]') as HTMLElement);
    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onRequestClose).toHaveBeenCalledTimes(2);
  });

  it("supports hiding the close button on mobile and custom classes", () => {
    const { container } = render(
      <Sheet open>
        <SheetContent
          className="custom-sheet"
          hideCloseButtonOnMobile
          showCloseButton={false}
        >
          content
        </SheetContent>
      </Sheet>,
    );

    expect(String(container.querySelector('[data-slot="sheet-content"]')?.className)).toContain("custom-sheet");
    expect(screen.queryByRole("button", { name: /close/i })).toBeNull();
    expect(screen.getByText("content")).toBeTruthy();
  });
});
