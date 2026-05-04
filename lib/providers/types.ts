import { z } from "zod";

import { slotSchema, type TemplateSlot } from "@/lib/schema/template";

export const providerTemplateDraftSchema = z.object({
  title: z.string().min(1),
  templateText: z.string().min(1),
  slots: z.array(slotSchema).default([]),
  styleTags: z.array(z.string().min(1)).default([]),
  negativePrompt: z.string().default("")
});

export const generatedImageSchema = z.object({
  fileName: z.string().min(1),
  base64: z.string().min(1),
  mimeType: z.string().min(1)
});

export type TemplateDraft = {
  title: string;
  templateText: string;
  slots: TemplateSlot[];
  styleTags: string[];
  negativePrompt: string;
};

export type ImageTemplateInput = {
  imageBase64: string;
  mimeType: string;
};

export type GenerateImageInput = {
  finalPrompt: string;
  negativePrompt?: string;
  referenceImageBase64?: string;
};

export type GeneratedImage = z.infer<typeof generatedImageSchema>;
export type ProviderTemplateDraft = z.infer<typeof providerTemplateDraftSchema>;

export interface AiProvider {
  analyzeImageToTemplate(input: ImageTemplateInput): Promise<TemplateDraft>;
  extractPromptToTemplate(input: { prompt: string }): Promise<TemplateDraft>;
  generateImageFromTemplate(input: GenerateImageInput): Promise<{ images: GeneratedImage[] }>;
}
