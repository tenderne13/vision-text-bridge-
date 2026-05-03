import { templateSchema, type Template } from "@/lib/schema/template";
import { normalizeTemplateRelativePath } from "@/lib/obsidian/pathing";
import { writeTemplateFile } from "@/lib/obsidian/template-files";

export async function saveTemplate(vaultDir: string, template: Template) {
  const parsedTemplate = templateSchema.parse({
    ...template,
    obsidianPath: normalizeTemplateRelativePath(template.obsidianPath)
  });

  await writeTemplateFile(vaultDir, parsedTemplate);

  return parsedTemplate;
}
