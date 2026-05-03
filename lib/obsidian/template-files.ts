import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { Template } from "@/lib/schema/template";
import { serializeTemplateMarkdown } from "@/lib/obsidian/frontmatter";
import { resolveTemplatePath } from "@/lib/obsidian/pathing";

export async function writeTemplateFile(vaultDir: string, template: Template) {
  const fullPath = resolveTemplatePath(vaultDir, template.obsidianPath);

  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, serializeTemplateMarkdown(template), "utf8");

  return fullPath;
}
