import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { parseTemplateMarkdown } from "@/lib/obsidian/frontmatter";
import { DEFAULT_TEMPLATES_DIR, normalizeTemplateRelativePath } from "@/lib/obsidian/pathing";
import { templateSchema, type Template } from "@/lib/schema/template";
import { writeTemplateFile } from "@/lib/obsidian/template-files";

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

export async function saveTemplate(vaultDir: string, template: Template) {
  const parsedTemplate = templateSchema.parse({
    ...template,
    obsidianPath: normalizeTemplateRelativePath(template.obsidianPath)
  });

  await writeTemplateFile(vaultDir, parsedTemplate);

  return parsedTemplate;
}

export async function listTemplates(vaultDir: string) {
  const templatesDir = join(vaultDir, DEFAULT_TEMPLATES_DIR);
  let markdownFiles: string[] = [];

  try {
    markdownFiles = await collectMarkdownFiles(templatesDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const templates = await Promise.all(
    markdownFiles.map(async (filePath) => {
      const markdown = await readFile(filePath, "utf8");
      return templateSchema.parse(parseTemplateMarkdown(markdown));
    })
  );

  return templates.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getTemplateById(vaultDir: string, id: string) {
  const templates = await listTemplates(vaultDir);

  return templates.find((template) => template.id === id) ?? null;
}
