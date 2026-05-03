import { join } from "node:path";

export const DEFAULT_SETTINGS_PATH = "Settings/vision-text-bridge.md";

function normalizeVaultRelativePath(relativePath: string) {
  return relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function resolveVaultPath(vaultDir: string, relativePath: string) {
  return join(vaultDir, normalizeVaultRelativePath(relativePath));
}

export function resolveTemplatePath(vaultDir: string, relativePath: string) {
  return resolveVaultPath(vaultDir, relativePath);
}

export function resolveGenerationPath(vaultDir: string, relativePath: string) {
  return resolveVaultPath(vaultDir, relativePath);
}

export function resolveSettingsPath(vaultDir: string, relativePath = DEFAULT_SETTINGS_PATH) {
  return resolveVaultPath(vaultDir, relativePath);
}
