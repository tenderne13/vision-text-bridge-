import { readSettingsFile, writeSettingsFile } from "@/lib/obsidian/settings-file";
import {
  providerModeSchema,
  settingsSchema,
  type Settings
} from "@/lib/schema/settings";

function getDefaultProviderMode() {
  const parsedProviderMode = providerModeSchema.safeParse(process.env.AI_PROVIDER_MODE);

  return parsedProviderMode.success ? parsedProviderMode.data : "openai";
}

function createDefaultSettings(vaultDir: string): Settings {
  const providerMode = getDefaultProviderMode();

  return settingsSchema.parse({
    vaultPath: vaultDir,
    defaultTopic: "",
    templatesDir: "Templates",
    generationsDir: "Generations",
    assetsDir: "Assets/generated",
    provider: providerMode,
    model: providerMode === "codex-chatgpt-web" ? "chatgpt-web" : "gpt-image-1"
  });
}

export async function saveSettings(vaultDir: string, settings: Settings) {
  const parsedSettings = settingsSchema.parse(settings);

  await writeSettingsFile(vaultDir, parsedSettings);

  return parsedSettings;
}

export async function loadSettings(vaultDir: string) {
  try {
    return await readSettingsFile(vaultDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return createDefaultSettings(vaultDir);
    }

    throw error;
  }
}
