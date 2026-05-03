import matter from "gray-matter";

import type { Generation } from "@/lib/schema/generation";
import type { Settings } from "@/lib/schema/settings";
import type { Template } from "@/lib/schema/template";

export function serializeTemplateMarkdown(template: Template) {
  return matter.stringify(
    [
      "# 模板正文",
      "",
      template.templateText,
      "",
      "# 使用说明",
      "",
      template.notes || "暂无说明"
    ].join("\n"),
    template
  );
}

export function serializeGenerationMarkdown(generation: Generation) {
  return matter.stringify(
    [
      "# 最终提示词",
      "",
      generation.finalPrompt,
      "",
      "# 输出图片",
      "",
      generation.outputImages.length > 0
        ? generation.outputImages.map((imagePath) => `- ${imagePath}`).join("\n")
        : "暂无输出"
    ].join("\n"),
    generation
  );
}

export function serializeSettingsMarkdown(settings: Settings) {
  return matter.stringify(
    [
      "# Vision Text Bridge 设置",
      "",
      `- Vault: ${settings.vaultPath}`,
      `- Templates: ${settings.templatesDir}`,
      `- Generations: ${settings.generationsDir}`,
      `- Assets: ${settings.assetsDir}`,
      `- Default Topic: ${settings.defaultTopic || "未设置"}`
    ].join("\n"),
    settings
  );
}

export function parseSettingsMarkdown(markdown: string) {
  const { data } = matter(markdown);

  return data as Partial<Settings>;
}

export function parseTemplateMarkdown(markdown: string) {
  const { data } = matter(markdown);

  return data as Partial<Template>;
}

export function parseGenerationMarkdown(markdown: string) {
  const { data } = matter(markdown);

  return data as Partial<Generation>;
}
