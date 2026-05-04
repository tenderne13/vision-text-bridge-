import { MockAiProvider } from "@/lib/providers/mock";
import { OpenAiProvider } from "@/lib/providers/openai";

type ProviderOptions = {
  provider?: string;
  templateModel?: string;
  imageModel?: string;
};

export function getAiProvider(options: ProviderOptions = {}) {
  if (options.provider === "mock" || !process.env.OPENAI_API_KEY) {
    return new MockAiProvider();
  }

  return new OpenAiProvider(
    undefined,
    options.templateModel ?? process.env.OPENAI_TEMPLATE_MODEL,
    options.imageModel ?? process.env.OPENAI_IMAGE_MODEL
  );
}
