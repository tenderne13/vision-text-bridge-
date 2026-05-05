import type {
  AiProvider,
  GenerateImageInput,
  ImageTemplateInput
} from "@/lib/providers/types";

type ExtractionProvider = Pick<
  AiProvider,
  "analyzeImageToTemplate" | "extractPromptToTemplate"
>;

type GenerationProvider = Pick<AiProvider, "generateImageFromTemplate">;

export class CompositeAiProvider implements AiProvider {
  constructor(
    private readonly extractionProvider: ExtractionProvider,
    private readonly generationProvider: GenerationProvider
  ) {}

  analyzeImageToTemplate(input: ImageTemplateInput) {
    return this.extractionProvider.analyzeImageToTemplate(input);
  }

  extractPromptToTemplate(input: { prompt: string }) {
    return this.extractionProvider.extractPromptToTemplate(input);
  }

  generateImageFromTemplate(input: GenerateImageInput) {
    return this.generationProvider.generateImageFromTemplate(input);
  }
}
