import type {
  AiProvider,
  GenerateImageInput,
  ImageTemplateInput,
  TemplateDraft
} from "@/lib/providers/types";

type ChatGptWebImageProviderOptions = {
  browserChannel?: string;
  profileDir?: string;
  startUrl?: string;
  timeoutMs?: number;
};

export class ChatGptWebImageProvider implements AiProvider {
  constructor(private readonly options: ChatGptWebImageProviderOptions = {}) {
    void this.options;
  }

  analyzeImageToTemplate(_input: ImageTemplateInput): Promise<TemplateDraft> {
    throw new Error("ChatGptWebImageProvider.analyzeImageToTemplate is not implemented yet");
  }

  extractPromptToTemplate(_input: { prompt: string }): Promise<TemplateDraft> {
    throw new Error("ChatGptWebImageProvider.extractPromptToTemplate is not implemented yet");
  }

  generateImageFromTemplate(_input: GenerateImageInput): Promise<{ images: never[] }> {
    throw new Error("ChatGptWebImageProvider.generateImageFromTemplate is not implemented yet");
  }
}
