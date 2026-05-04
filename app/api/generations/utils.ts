import { posix } from "node:path";

import { z } from "zod";

import { getAiProvider } from "@/lib/providers";
import { type Generation } from "@/lib/schema/generation";
import { getTemplateById } from "@/lib/services/template-repository";
import {
  saveGeneratedImages,
  saveGeneration
} from "@/lib/services/generation-repository";
import { generateImageFromTemplate } from "@/lib/services/image-generation";
import { loadSettings } from "@/lib/services/settings-service";

export const generateRequestSchema = z.object({
  mode: z.literal("generate"),
  templateId: z.string().min(1),
  slotValues: z.record(z.string(), z.string()),
  topic: z.string().default("")
});

export async function handleGenerationRequest(vaultDir: string, body: unknown) {
  const request = generateRequestSchema.parse(body);
  const settings = await loadSettings(vaultDir);
  const template = await getTemplateById(vaultDir, request.templateId);

  if (!template) {
    throw new Error("Template not found");
  }

  const provider = getAiProvider({
    provider: settings.provider,
    imageModel: settings.model
  });
  const generatedAt = new Date().toISOString();
  const generationId = `gen_${generatedAt.replace(/[:.]/g, "")}`;
  const topic = request.topic || settings.defaultTopic || template.title;
  const { finalPrompt, images } = await generateImageFromTemplate(provider, template, request.slotValues);
  const outputImages = await saveGeneratedImages(vaultDir, images, {
    assetsDir: settings.assetsDir,
    topic,
    generationId
  });
  const generationRecord: Generation = {
    id: generationId,
    templateId: template.id,
    templateSnapshot: template,
    slotValues: request.slotValues,
    finalPrompt,
    provider: settings.provider,
    model: settings.model,
    status: "succeeded",
    outputImages,
    createdAt: generatedAt,
    topic,
    obsidianPath: posix.join(settings.generationsDir, topic, `${generationId}.md`)
  };

  const savedGeneration = await saveGeneration(vaultDir, generationRecord);

  return {
    generation: savedGeneration,
    images: images.map((image) => ({
      ...image,
      dataUri: `data:${image.mimeType};base64,${image.base64}`
    }))
  };
}
