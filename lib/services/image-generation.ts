import type { AiProvider } from "@/lib/providers/types";
import type { Template } from "@/lib/schema/template";
import { renderTemplateText } from "@/lib/utils/template-text";

export async function generateImageFromTemplate(
  provider: AiProvider,
  template: Template,
  slotValues: Record<string, string>
) {
  const finalPrompt = renderTemplateText(template.templateText, slotValues);
  const result = await provider.generateImageFromTemplate({
    finalPrompt,
    negativePrompt: template.negativePrompt
  });

  return { finalPrompt, images: result.images };
}
