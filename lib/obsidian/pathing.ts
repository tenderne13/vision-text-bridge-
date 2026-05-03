import { basename, join } from "node:path";

export const DEFAULT_SETTINGS_PATH = "Settings/vision-text-bridge.md";
export const DEFAULT_TEMPLATES_DIR = "Templates";

function normalizeVaultRelativePath(relativePath: string) {
  return relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function normalizeTemplateRelativePath(relativePath: string) {
  const normalizedPath = normalizeVaultRelativePath(relativePath);

  if (normalizedPath === DEFAULT_TEMPLATES_DIR || normalizedPath.startsWith(`${DEFAULT_TEMPLATES_DIR}/`)) {
    return normalizedPath;
  }

  return `${DEFAULT_TEMPLATES_DIR}/${basename(normalizedPath)}`;
}

export function resolveVaultPath(vaultDir: string, relativePath: string) {
  return join(vaultDir, normalizeVaultRelativePath(relativePath));
}

export function resolveTemplatePath(vaultDir: string, relativePath: string) {
  return resolveVaultPath(vaultDir, normalizeTemplateRelativePath(relativePath));
}

export function resolveGenerationPath(vaultDir: string, relativePath: string) {
  return resolveVaultPath(vaultDir, relativePath);
}

export function resolveSettingsPath(vaultDir: string, relativePath = DEFAULT_SETTINGS_PATH) {
  return resolveVaultPath(vaultDir, relativePath);
}
