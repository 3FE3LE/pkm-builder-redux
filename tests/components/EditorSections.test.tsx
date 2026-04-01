import { describe, expect, it } from "vitest";

import { DefenseSection } from "@/components/team/editor/DefenseSection";
import { Header } from "@/components/team/editor/Header";
import { MovesSection } from "@/components/team/editor/MovesSection";
import { ProfileSection } from "@/components/team/editor/ProfileSection";
import {
  DefenseSection as ExportedDefenseSection,
  Header as ExportedHeader,
  MovesSection as ExportedMovesSection,
  ProfileSection as ExportedProfileSection,
  StatsSection as ExportedStatsSection,
} from "@/components/team/editor/Sections";
import { StatsSection } from "@/components/team/editor/StatsSection";

describe("EditorSections", () => {
  it("re-exports the editor sections", () => {
    expect(ExportedHeader).toBe(Header);
    expect(ExportedProfileSection).toBe(ProfileSection);
    expect(ExportedStatsSection).toBe(StatsSection);
    expect(ExportedMovesSection).toBe(MovesSection);
    expect(ExportedDefenseSection).toBe(DefenseSection);
  });
});
