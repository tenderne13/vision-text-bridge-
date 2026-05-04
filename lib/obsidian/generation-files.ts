import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { Generation } from "@/lib/schema/generation";
import { serializeGenerationMarkdown } from "@/lib/obsidian/frontmatter";
import { resolveGenerationPath } from "@/lib/obsidian/pathing";

export async function writeGenerationFile(vaultDir: string, generation: Generation) {
  const fullPath = resolveGenerationPath(vaultDir, generation.obsidianPath);

  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, serializeGenerationMarkdown(generation), "utf8");

  return fullPath;
}
