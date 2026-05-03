import { readSettingsFile, writeSettingsFile } from "@/lib/obsidian/settings-file";
import { settingsSchema, type Settings } from "@/lib/schema/settings";

export async function saveSettings(vaultDir: string, settings: Settings) {
  const parsedSettings = settingsSchema.parse(settings);

  await writeSettingsFile(vaultDir, parsedSettings);

  return parsedSettings;
}

export async function loadSettings(vaultDir: string) {
  return readSettingsFile(vaultDir);
}
