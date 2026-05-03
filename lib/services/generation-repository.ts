import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { parseGenerationMarkdown } from "@/lib/obsidian/frontmatter";
import { DEFAULT_GENERATIONS_DIR } from "@/lib/obsidian/pathing";
import { generationSchema, type Generation } from "@/lib/schema/generation";
import { writeGenerationFile } from "@/lib/obsidian/generation-files";

async function collectMarkdownFiles(rootDir: string): Promise<string[]> {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const markdownFiles: string[] = [];

  for (const entry of entries) {
    const fullPath = join(rootDir, entry.name);

    if (entry.isDirectory()) {
      markdownFiles.push(...(await collectMarkdownFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      markdownFiles.push(fullPath);
    }
  }

  return markdownFiles;
}

export async function saveGeneration(vaultDir: string, generation: Generation) {
  const parsedGeneration = generationSchema.parse(generation);

  await writeGenerationFile(vaultDir, parsedGeneration);

  return parsedGeneration;
}

export async function listGenerations(vaultDir: string) {
  const generationsDir = join(vaultDir, DEFAULT_GENERATIONS_DIR);
  let markdownFiles: string[] = [];

  try {
    markdownFiles = await collectMarkdownFiles(generationsDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const generations = await Promise.all(
    markdownFiles.map(async (filePath) => {
      const markdown = await readFile(filePath, "utf8");
      return generationSchema.parse(parseGenerationMarkdown(markdown));
    })
  );

  return generations.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
