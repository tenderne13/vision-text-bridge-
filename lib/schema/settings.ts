import { z } from "zod";

export const settingsSchema = z.object({
  vaultPath: z.string().min(1),
  defaultTopic: z.string().default(""),
  templatesDir: z.string().default("Templates"),
  generationsDir: z.string().default("Generations"),
  assetsDir: z.string().default("Assets/generated")
});

export type Settings = z.infer<typeof settingsSchema>;
