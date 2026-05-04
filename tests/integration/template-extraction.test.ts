import { describe, expect, it, vi } from "vitest";

import {
  extractTemplateFromImage,
  extractTemplateFromPrompt
} from "@/lib/services/template-extraction";
import { POST as postFromPrompt } from "@/app/api/templates/from-prompt/route";

const mockProvider = {
  analyzeImageToTemplate: vi.fn(),
  extractPromptToTemplate: vi.fn(),
  generateImageFromTemplate: vi.fn()
};

vi.mock("@/lib/providers", () => ({
  getAiProvider: () => mockProvider
}));

describe("template extraction services", () => {
  it("normalizes provider prompt output into a template draft", async () => {
    const provider = {
      extractPromptToTemplate: vi.fn().mockResolvedValue({
        title: "产品海报",
        templateText: "一张{subject}的海报，风格为{style}",
        slots: [
          { key: "subject", label: "主体", description: "要生成的主体", required: true },
          { key: "style", label: "风格", description: "画面风格", required: true }
        ],
        styleTags: ["海报"],
        negativePrompt: "模糊"
      })
    };

    const draft = await extractTemplateFromPrompt(provider as never, "一张咖啡杯海报");

    expect(provider.extractPromptToTemplate).toHaveBeenCalledWith({
      prompt: "一张咖啡杯海报"
    });
    expect(draft.title).toBe("产品海报");
    expect(draft.sourceType).toBe("prompt");
    expect(draft.obsidianPath).toBe("");
    expect(draft.createdAt).toEqual(expect.any(String));
    expect(draft.updatedAt).toEqual(expect.any(String));
  });

  it("normalizes provider image output into a template draft", async () => {
    const provider = {
      analyzeImageToTemplate: vi.fn().mockResolvedValue({
        title: "咖啡产品图",
        templateText: "棚拍{subject}产品图，背景为{background}",
        slots: [
          { key: "subject", label: "主体", description: "产品主体", required: true },
          { key: "background", label: "背景", description: "背景元素", required: false }
        ],
        styleTags: ["产品摄影", "棚拍"],
        negativePrompt: "失焦"
      })
    };

    const draft = await extractTemplateFromImage(provider as never, {
      imageBase64: "ZmFrZS1pbWFnZQ==",
      mimeType: "image/png"
    });

    expect(provider.analyzeImageToTemplate).toHaveBeenCalledWith({
      imageBase64: "ZmFrZS1pbWFnZQ==",
      mimeType: "image/png"
    });
    expect(draft.title).toBe("咖啡产品图");
    expect(draft.sourceType).toBe("image");
    expect(draft.obsidianPath).toBe("");
    expect(draft.createdAt).toEqual(expect.any(String));
    expect(draft.updatedAt).toEqual(expect.any(String));
  });
});

describe("POST /api/templates/from-prompt", () => {
  it("returns a draft template response", async () => {
    mockProvider.extractPromptToTemplate.mockResolvedValueOnce({
      title: "产品海报",
      templateText: "一张{subject}的海报，风格为{style}",
      slots: [
        { key: "subject", label: "主体", description: "要生成的主体", required: true },
        { key: "style", label: "风格", description: "画面风格", required: true }
      ],
      styleTags: ["海报"],
      negativePrompt: "模糊"
    });

    const request = new Request("http://localhost/api/templates/from-prompt", {
      method: "POST",
      body: JSON.stringify({ prompt: "一张咖啡杯海报" }),
      headers: { "content-type": "application/json" }
    });

    const response = await postFromPrompt(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sourceType).toBe("prompt");
    expect(body.title).toBe("产品海报");
  });
});
