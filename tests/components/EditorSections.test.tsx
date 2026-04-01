import { describe, expect, it } from "vitest";

import { EditorDefenseSection } from "@/components/team/editor/DefenseSection";
import { EditorHeader } from "@/components/team/editor/Header";
import { EditorMovesSection } from "@/components/team/editor/MovesSection";
import { EditorProfileSection } from "@/components/team/editor/ProfileSection";
import {
  EditorDefenseSection as ExportedEditorDefenseSection,
  EditorHeader as ExportedEditorHeader,
  EditorMovesSection as ExportedEditorMovesSection,
  EditorProfileSection as ExportedEditorProfileSection,
  EditorStatsSection as ExportedEditorStatsSection,
} from "@/components/team/editor/Sections";
import { EditorStatsSection } from "@/components/team/editor/StatsSection";

describe("EditorSections", () => {
  it("re-exports the editor sections", () => {
    expect(ExportedEditorHeader).toBe(EditorHeader);
    expect(ExportedEditorProfileSection).toBe(EditorProfileSection);
    expect(ExportedEditorStatsSection).toBe(EditorStatsSection);
    expect(ExportedEditorMovesSection).toBe(EditorMovesSection);
    expect(ExportedEditorDefenseSection).toBe(EditorDefenseSection);
  });
});
