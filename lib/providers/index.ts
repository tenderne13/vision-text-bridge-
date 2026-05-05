import { ChatGptWebImageProvider } from "@/lib/providers/chatgpt-web";
import { CodexCliProvider } from "@/lib/providers/codex-cli";
import { CompositeAiProvider } from "@/lib/providers/composite";
import { MockAiProvider } from "@/lib/providers/mock";
import { OpenAiProvider } from "@/lib/providers/openai";

type ProviderOptions = {
  provider?: string;
  templateModel?: string;
  imageModel?: string;
};

export function getAiProvider(options: ProviderOptions = {}) {
  const providerMode = options.provider ?? process.env.AI_PROVIDER_MODE;

  if (
    providerMode === "mock" ||
    (!process.env.OPENAI_API_KEY && providerMode === "openai")
  ) {
    return new MockAiProvider();
  }

  if (providerMode === "codex-chatgpt-web") {
    return new CompositeAiProvider(
      new CodexCliProvider(
        options.templateModel ?? process.env.CODEX_TEMPLATE_MODEL
      ),
      new ChatGptWebImageProvider({
        browserChannel: process.env.PLAYWRIGHT_BROWSER_CHANNEL,
        profileDir: process.env.CHATGPT_WEB_PROFILE_DIR,
        startUrl: process.env.CHATGPT_WEB_START_URL,
        timeoutMs: process.env.CHATGPT_WEB_TIMEOUT_MS
          ? Number(process.env.CHATGPT_WEB_TIMEOUT_MS)
          : undefined
      })
    );
  }

  return new OpenAiProvider(
    undefined,
    options.templateModel ?? process.env.OPENAI_TEMPLATE_MODEL,
    options.imageModel ?? process.env.OPENAI_IMAGE_MODEL
  );
}
