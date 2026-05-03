import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, posix } from "node:path";

import { parseGenerationMarkdown } from "@/lib/obsidian/frontmatter";
import { DEFAULT_GENERATIONS_DIR, resolveVaultPath } from "@/lib/obsidian/pathing";
import type { GeneratedImage } from "@/lib/providers/types";
import { generationSchema, type Generation } from "@/lib/schema/generation";
import { slugifyPathSegment } from "@/lib/utils/slug";
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

export async function saveGeneratedImages(
  vaultDir: string,
  images: GeneratedImage[],
  options: {
    assetsDir: string;
    topic: string;
    generationId: string;
  }
) {
  const topicSegment = slugifyPathSegment(options.topic || "default-topic");
  const savedPaths: string[] = [];

  for (const [index, image] of images.entries()) {
    const extension = extname(image.fileName) || ".png";
    const relativePath = posix.join(
      options.assetsDir,
      topicSegment,
      `${options.generationId}-${index + 1}${extension}`
    );
    const fullPath = resolveVaultPath(vaultDir, relativePath);

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, Buffer.from(image.base64, "base64"));
    savedPaths.push(relativePath);
  }

  return savedPaths;
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
