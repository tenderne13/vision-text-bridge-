import { z } from "zod";

export const providerModeSchema = z.enum(["openai", "mock", "codex-chatgpt-web"]);

export const settingsSchema = z.object({
  vaultPath: z.string().min(1),
  defaultTopic: z.string().default(""),
  templatesDir: z.string().default("Templates"),
  generationsDir: z.string().default("Generations"),
  assetsDir: z.string().default("Assets/generated"),
  provider: providerModeSchema.default("openai"),
  model: z.string().min(1).default("gpt-image-1")
});

export type Settings = z.infer<typeof settingsSchema>;
