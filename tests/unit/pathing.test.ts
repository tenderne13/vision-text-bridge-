import { describe, expect, it } from "vitest";

import {
  resolveGenerationPath,
  resolveSettingsPath,
  resolveTemplatePath
} from "@/lib/obsidian/pathing";

describe("obsidian pathing", () => {
  it("rejects template traversal outside the vault", () => {
    expect(() => resolveTemplatePath("/vault", "Templates/../../outside.md")).toThrow(
      /outside the Obsidian vault/i
    );
  });

  it("rejects generation traversal outside the vault", () => {
    expect(() => resolveGenerationPath("/vault", "../outside.md")).toThrow(
      /outside the Obsidian vault/i
    );
  });

  it("rejects settings traversal outside the vault", () => {
    expect(() => resolveSettingsPath("/vault", "Settings/../../outside.md")).toThrow(
      /outside the Obsidian vault/i
    );
  });
});
