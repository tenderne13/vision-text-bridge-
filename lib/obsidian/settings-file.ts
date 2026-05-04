import { readFile } from "node:fs/promises";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { parseSettingsMarkdown, serializeSettingsMarkdown } from "@/lib/obsidian/frontmatter";
import { DEFAULT_SETTINGS_PATH, resolveSettingsPath } from "@/lib/obsidian/pathing";
import { settingsSchema, type Settings } from "@/lib/schema/settings";

export async function writeSettingsFile(
  vaultDir: string,
  settings: Settings,
  relativePath = DEFAULT_SETTINGS_PATH
) {
  const fullPath = resolveSettingsPath(vaultDir, relativePath);

  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, serializeSettingsMarkdown(settings), "utf8");

  return fullPath;
}

export async function readSettingsFile(vaultDir: string, relativePath = DEFAULT_SETTINGS_PATH) {
  const fullPath = resolveSettingsPath(vaultDir, relativePath);
  const markdown = await readFile(fullPath, "utf8");

  return settingsSchema.parse(parseSettingsMarkdown(markdown));
}
