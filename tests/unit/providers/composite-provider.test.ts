import { describe, expect, it, vi } from "vitest";

import { CompositeAiProvider } from "@/lib/providers/composite";

describe("CompositeAiProvider", () => {
  it("delegates extraction to the extraction provider", async () => {
    const extraction = {
      analyzeImageToTemplate: vi.fn().mockResolvedValue({
        title: "图",
        templateText: "x",
        slots: [],
        styleTags: [],
        negativePrompt: ""
      }),
      extractPromptToTemplate: vi.fn().mockResolvedValue({
        title: "词",
        templateText: "y",
        slots: [],
        styleTags: [],
        negativePrompt: ""
      })
    };
    const generation = {
      generateImageFromTemplate: vi.fn().mockResolvedValue({ images: [] })
    };

    const provider = new CompositeAiProvider(extraction as never, generation as never);
    await provider.extractPromptToTemplate({ prompt: "一张海报" });

    expect(extraction.extractPromptToTemplate).toHaveBeenCalledWith({
      prompt: "一张海报"
    });
    expect(generation.generateImageFromTemplate).not.toHaveBeenCalled();
  });

  it("delegates generation to the generation provider", async () => {
    const extraction = {
      analyzeImageToTemplate: vi.fn(),
      extractPromptToTemplate: vi.fn()
    };
    const generation = {
      generateImageFromTemplate: vi.fn().mockResolvedValue({ images: [] })
    };

    const provider = new CompositeAiProvider(extraction as never, generation as never);
    await provider.generateImageFromTemplate({ finalPrompt: "一张玻璃杯海报" });

    expect(generation.generateImageFromTemplate).toHaveBeenCalledWith({
      finalPrompt: "一张玻璃杯海报"
    });
  });
});
