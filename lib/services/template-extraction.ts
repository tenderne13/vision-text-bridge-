import type { Template } from "@/lib/schema/template";
import {
  providerTemplateDraftSchema,
  type AiProvider,
  type ImageTemplateInput
} from "@/lib/providers/types";

export type ExtractedTemplateDraft = Pick<
  Template,
  | "title"
  | "templateText"
  | "slots"
  | "styleTags"
  | "negativePrompt"
  | "notes"
  | "createdAt"
  | "updatedAt"
> & {
  id: string;
  sourceType: Template["sourceType"];
  obsidianPath: string;
};

function normalizeExtractedTemplateDraft(
  sourceType: Template["sourceType"],
  draft: Awaited<ReturnType<AiProvider["extractPromptToTemplate"]>>
): ExtractedTemplateDraft {
  const normalizedDraft = providerTemplateDraftSchema.parse(draft);
  const timestamp = new Date().toISOString();

  return {
    ...normalizedDraft,
    id: "",
    sourceType,
    notes: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    obsidianPath: ""
  };
}

export async function extractTemplateFromPrompt(provider: AiProvider, prompt: string) {
  const draft = await provider.extractPromptToTemplate({ prompt });
  return normalizeExtractedTemplateDraft("prompt", draft);
}

export async function extractTemplateFromImage(provider: AiProvider, input: ImageTemplateInput) {
  const draft = await provider.analyzeImageToTemplate(input);
  return normalizeExtractedTemplateDraft("image", draft);
}
