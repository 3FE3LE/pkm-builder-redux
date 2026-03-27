import { describe, expect, it } from "vitest";

import { EditorDefenseSection } from "@/components/team/EditorDefenseSection";
import { EditorHeader } from "@/components/team/EditorHeader";
import { EditorMovesSection } from "@/components/team/EditorMovesSection";
import { EditorProfileSection } from "@/components/team/EditorProfileSection";
import {
  EditorDefenseSection as ExportedEditorDefenseSection,
  EditorHeader as ExportedEditorHeader,
  EditorMovesSection as ExportedEditorMovesSection,
  EditorProfileSection as ExportedEditorProfileSection,
  EditorStatsSection as ExportedEditorStatsSection,
} from "@/components/team/EditorSections";
import { EditorStatsSection } from "@/components/team/EditorStatsSection";

describe("EditorSections", () => {
  it("re-exports the editor sections", () => {
    expect(ExportedEditorHeader).toBe(EditorHeader);
    expect(ExportedEditorProfileSection).toBe(EditorProfileSection);
    expect(ExportedEditorStatsSection).toBe(EditorStatsSection);
    expect(ExportedEditorMovesSection).toBe(EditorMovesSection);
    expect(ExportedEditorDefenseSection).toBe(EditorDefenseSection);
  });
});
