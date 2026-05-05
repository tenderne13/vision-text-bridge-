import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { saveTemplate } from "@/lib/services/template-repository";
import { loadSettings, saveSettings } from "@/lib/services/settings-service";

describe("saveTemplate", () => {
  it("writes template markdown into the Obsidian template folder", async () => {
    const vaultDir = mkdtempSync(join(tmpdir(), "vtb-"));

    const saved = await saveTemplate(vaultDir, {
      id: "tpl_001",
      title: "产品海报",
      sourceType: "prompt",
      templateText: "一张{主体}的海报",
      slots: [],
      styleTags: [],
      negativePrompt: "",
      notes: "",
      createdAt: "2026-05-03T00:00:00.000Z",
      updatedAt: "2026-05-03T00:00:00.000Z",
      obsidianPath: "Templates/产品海报.md"
    });

    expect(saved.obsidianPath).toBe("Templates/产品海报.md");
    expect(readFileSync(join(vaultDir, "Templates", "产品海报.md"), "utf8")).toContain(
      "一张{主体}的海报"
    );
  });

  it("normalizes template storage under the Templates folder", async () => {
    const vaultDir = mkdtempSync(join(tmpdir(), "vtb-"));

    const saved = await saveTemplate(vaultDir, {
      id: "tpl_002",
      title: "宣传海报",
      sourceType: "prompt",
      templateText: "一张{主体}的宣传海报",
      slots: [],
      styleTags: [],
      negativePrompt: "",
      notes: "",
      createdAt: "2026-05-03T00:00:00.000Z",
      updatedAt: "2026-05-03T00:00:00.000Z",
      obsidianPath: "Custom/宣传海报.md"
    });

    expect(saved.obsidianPath).toBe("Templates/宣传海报.md");
    expect(readFileSync(join(vaultDir, "Templates", "宣传海报.md"), "utf8")).toContain(
      "一张{主体}的宣传海报"
    );
  });

  it("rejects template traversal attempts outside the vault", async () => {
    const vaultDir = mkdtempSync(join(tmpdir(), "vtb-"));

    await expect(
      saveTemplate(vaultDir, {
        id: "tpl_003",
        title: "危险路径",
        sourceType: "prompt",
        templateText: "一张{主体}的海报",
        slots: [],
        styleTags: [],
        negativePrompt: "",
        notes: "",
        createdAt: "2026-05-03T00:00:00.000Z",
        updatedAt: "2026-05-03T00:00:00.000Z",
        obsidianPath: "Templates/../../outside.md"
      })
    ).rejects.toThrow(/outside the Obsidian vault/i);
  });
});

describe("settings-service", () => {
  it("persists obsidian vault settings", async () => {
    const vaultDir = mkdtempSync(join(tmpdir(), "vtb-"));

    await saveSettings(vaultDir, {
      vaultPath: vaultDir,
      defaultTopic: "默认主题",
      templatesDir: "Templates",
      generationsDir: "Generations",
      assetsDir: "Assets/generated",
      provider: "openai",
      model: "gpt-image-1"
    });

    const settings = await loadSettings(vaultDir);

    expect(settings.defaultTopic).toBe("默认主题");
    expect(settings.provider).toBe("openai");
    expect(settings.model).toBe("gpt-image-1");
  });

  it("persists codex-chatgpt-web settings", async () => {
    const vaultDir = mkdtempSync(join(tmpdir(), "vtb-"));

    await saveSettings(vaultDir, {
      vaultPath: vaultDir,
      defaultTopic: "默认主题",
      templatesDir: "Templates",
      generationsDir: "Generations",
      assetsDir: "Assets/generated",
      provider: "codex-chatgpt-web",
      model: "chatgpt-web"
    });

    const settings = await loadSettings(vaultDir);

    expect(settings.provider).toBe("codex-chatgpt-web");
    expect(settings.model).toBe("chatgpt-web");
  });
});
