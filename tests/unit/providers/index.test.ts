import { afterEach, describe, expect, it } from "vitest";

import { CompositeAiProvider } from "@/lib/providers/composite";
import { getAiProvider } from "@/lib/providers/index";
import { MockAiProvider } from "@/lib/providers/mock";

const originalEnv = {
  AI_PROVIDER_MODE: process.env.AI_PROVIDER_MODE,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  CODEX_TEMPLATE_MODEL: process.env.CODEX_TEMPLATE_MODEL,
  PLAYWRIGHT_BROWSER_CHANNEL: process.env.PLAYWRIGHT_BROWSER_CHANNEL,
  CHATGPT_WEB_PROFILE_DIR: process.env.CHATGPT_WEB_PROFILE_DIR,
  CHATGPT_WEB_START_URL: process.env.CHATGPT_WEB_START_URL,
  CHATGPT_WEB_TIMEOUT_MS: process.env.CHATGPT_WEB_TIMEOUT_MS
};

afterEach(() => {
  process.env.AI_PROVIDER_MODE = originalEnv.AI_PROVIDER_MODE;
  process.env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
  process.env.CODEX_TEMPLATE_MODEL = originalEnv.CODEX_TEMPLATE_MODEL;
  process.env.PLAYWRIGHT_BROWSER_CHANNEL = originalEnv.PLAYWRIGHT_BROWSER_CHANNEL;
  process.env.CHATGPT_WEB_PROFILE_DIR = originalEnv.CHATGPT_WEB_PROFILE_DIR;
  process.env.CHATGPT_WEB_START_URL = originalEnv.CHATGPT_WEB_START_URL;
  process.env.CHATGPT_WEB_TIMEOUT_MS = originalEnv.CHATGPT_WEB_TIMEOUT_MS;
});

describe("getAiProvider", () => {
  it("returns the mock provider when provider mode is unset and no OpenAI key is configured", () => {
    delete process.env.AI_PROVIDER_MODE;
    delete process.env.OPENAI_API_KEY;

    const provider = getAiProvider();

    expect(provider).toBeInstanceOf(MockAiProvider);
  });

  it("returns the mock provider when mock mode is selected", () => {
    process.env.OPENAI_API_KEY = "test-key";

    const provider = getAiProvider({ provider: "mock" });

    expect(provider).toBeInstanceOf(MockAiProvider);
  });

  it("returns the composite provider when codex-chatgpt-web mode is selected", () => {
    delete process.env.OPENAI_API_KEY;
    process.env.CODEX_TEMPLATE_MODEL = "codex-test-model";
    process.env.PLAYWRIGHT_BROWSER_CHANNEL = "chromium";
    process.env.CHATGPT_WEB_PROFILE_DIR = "/tmp/chatgpt-profile";
    process.env.CHATGPT_WEB_START_URL = "https://chatgpt.example.test";
    process.env.CHATGPT_WEB_TIMEOUT_MS = "1234";

    const provider = getAiProvider({ provider: "codex-chatgpt-web" });

    expect(provider).toBeInstanceOf(CompositeAiProvider);
  });
});
