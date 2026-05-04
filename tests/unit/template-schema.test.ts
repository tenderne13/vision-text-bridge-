import { describe, expect, it } from "vitest";
import { templateSchema } from "@/lib/schema/template";

describe("templateSchema", () => {
  it("accepts a reusable template with slots", () => {
    const parsed = templateSchema.parse({
      id: "tpl_001",
      title: "产品海报",
      sourceType: "prompt",
      templateText: "一张{主体}的海报，风格为{风格}",
      slots: [
        {
          key: "subject",
          label: "主体",
          description: "要生成的主体",
          required: true
        }
      ],
      styleTags: ["海报", "商业摄影"],
      negativePrompt: "模糊, 低质量",
      notes: "",
      createdAt: "2026-05-03T00:00:00.000Z",
      updatedAt: "2026-05-03T00:00:00.000Z",
      obsidianPath: "Templates/产品海报.md"
    });

    expect(parsed.sourceType).toBe("prompt");
  });
});
