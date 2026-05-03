import { describe, expect, it } from "vitest";

import { serializeTemplateMarkdown } from "@/lib/obsidian/frontmatter";

describe("serializeTemplateMarkdown", () => {
  it("writes frontmatter and body for a template", () => {
    const markdown = serializeTemplateMarkdown({
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

    expect(markdown).toContain("templateText:");
    expect(markdown).toContain("# 模板正文");
  });
});
