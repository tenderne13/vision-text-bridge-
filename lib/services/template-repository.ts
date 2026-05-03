import { templateSchema, type Template } from "@/lib/schema/template";
import { writeTemplateFile } from "@/lib/obsidian/template-files";

export async function saveTemplate(vaultDir: string, template: Template) {
  const parsedTemplate = templateSchema.parse(template);

  await writeTemplateFile(vaultDir, parsedTemplate);

  return parsedTemplate;
}
