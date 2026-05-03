import { basename, posix, relative, resolve, win32 } from "node:path";

export const DEFAULT_SETTINGS_PATH = "Settings/vision-text-bridge.md";
export const DEFAULT_TEMPLATES_DIR = "Templates";
export const DEFAULT_GENERATIONS_DIR = "Generations";

function normalizeVaultRelativePath(relativePath: string) {
  return relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function isVaultEscapePath(relativeToVault: string) {
  const normalizedRelativePath = relativeToVault.replace(/\\/g, "/");

  return (
    normalizedRelativePath === ".." ||
    normalizedRelativePath.startsWith("../") ||
    posix.isAbsolute(normalizedRelativePath) ||
    win32.isAbsolute(relativeToVault)
  );
}

function assertPathInsideVault(vaultDir: string, relativePath: string) {
  const vaultRoot = resolve(vaultDir);
  const resolvedPath = resolve(vaultRoot, relativePath);
  const relativeToVault = relative(vaultRoot, resolvedPath);

  if (isVaultEscapePath(relativeToVault)) {
    throw new Error(`Resolved path is outside the Obsidian vault: ${relativePath}`);
  }

  return resolvedPath;
}

export function normalizeTemplateRelativePath(relativePath: string) {
  const normalizedPath = normalizeVaultRelativePath(relativePath);

  if (normalizedPath === DEFAULT_TEMPLATES_DIR || normalizedPath.startsWith(`${DEFAULT_TEMPLATES_DIR}/`)) {
    return normalizedPath;
  }

  return `${DEFAULT_TEMPLATES_DIR}/${basename(normalizedPath)}`;
}

export function resolveVaultPath(vaultDir: string, relativePath: string) {
  return assertPathInsideVault(vaultDir, normalizeVaultRelativePath(relativePath));
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
