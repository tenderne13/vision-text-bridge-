import type {
  AiProvider,
  GenerateImageInput,
  ImageTemplateInput,
  TemplateDraft
} from "@/lib/providers/types";

export class CodexCliProvider implements AiProvider {
  constructor(private readonly model?: string) {
    void this.model;
  }

  analyzeImageToTemplate(_input: ImageTemplateInput): Promise<TemplateDraft> {
    throw new Error("CodexCliProvider.analyzeImageToTemplate is not implemented yet");
  }

  extractPromptToTemplate(_input: { prompt: string }): Promise<TemplateDraft> {
    throw new Error("CodexCliProvider.extractPromptToTemplate is not implemented yet");
  }

  generateImageFromTemplate(_input: GenerateImageInput): Promise<{ images: never[] }> {
    throw new Error("CodexCliProvider.generateImageFromTemplate is not implemented yet");
  }
}
