import { z } from "zod";

export const slotSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().default(""),
  exampleValue: z.string().optional(),
  required: z.boolean().default(true),
  defaultValue: z.string().optional()
});

export const templateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sourceType: z.enum(["image", "prompt"]),
  templateText: z.string().min(1),
  slots: z.array(slotSchema).default([]),
  styleTags: z.array(z.string()).default([]),
  negativePrompt: z.string().default(""),
  notes: z.string().default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  obsidianPath: z.string().min(1)
});

export type TemplateSlot = z.infer<typeof slotSchema>;
export type Template = z.infer<typeof templateSchema>;
