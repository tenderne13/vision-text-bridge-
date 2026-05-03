import { readSettingsFile, writeSettingsFile } from "@/lib/obsidian/settings-file";
import { settingsSchema, type Settings } from "@/lib/schema/settings";

function createDefaultSettings(vaultDir: string): Settings {
  return settingsSchema.parse({
    vaultPath: vaultDir,
    defaultTopic: "",
    templatesDir: "Templates",
    generationsDir: "Generations",
    assetsDir: "Assets/generated"
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
