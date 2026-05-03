import { z } from "zod";

import { templateSchema } from "@/lib/schema/template";

export const generationStatusSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed"
]);

export const generationSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1),
  templateSnapshot: templateSchema,
  slotValues: z.record(z.string(), z.string()),
  finalPrompt: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  status: generationStatusSchema,
  outputImages: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  topic: z.string().default(""),
  obsidianPath: z.string().min(1)
});

export type GenerationStatus = z.infer<typeof generationStatusSchema>;
export type Generation = z.infer<typeof generationSchema>;
