# Codex + ChatGPT Web Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace OpenAI API-backed template extraction and image generation with a local-only composite provider that uses Codex CLI for extraction and Playwright-driven ChatGPT Web for image generation.

**Architecture:** Keep the existing `AiProvider` contract stable and introduce a composite provider that delegates extraction calls to a new `CodexCliProvider` and generation calls to a new `ChatGptWebImageProvider`. Preserve the existing API routes, service layer, and Obsidian persistence flow while adding configuration, error handling, and small UI updates for the local-only workflow.

**Tech Stack:** Next.js App Router, TypeScript, Zod, Vitest, Playwright, Node child processes, local browser profile reuse

---

## File Structure

### New files

- `lib/providers/composite.ts`
  Responsibility: compose extraction and image-generation providers behind the existing `AiProvider` interface.
- `lib/providers/codex-cli.ts`
  Responsibility: run `codex exec`, pass image/text inputs, parse JSON, and validate template draft output.
- `lib/providers/chatgpt-web.ts`
  Responsibility: drive Playwright persistent browser context, submit prompts to ChatGPT Web, retrieve the first image, and normalize the result.
- `tests/unit/providers/composite-provider.test.ts`
  Responsibility: verify composite delegation behavior.
- `tests/unit/providers/codex-cli-provider.test.ts`
  Responsibility: verify command construction, JSON parsing, temp-file cleanup, and error handling for Codex CLI.
- `tests/unit/providers/chatgpt-web-provider.test.ts`
  Responsibility: verify ChatGPT Web provider normalization and failure handling via mocked Playwright interactions.

### Modified files

- `lib/providers/index.ts`
  Responsibility: choose `mock`, `openai`, or `codex-chatgpt-web` provider mode.
- `lib/schema/settings.ts`
  Responsibility: allow the new provider mode and expanded model string defaults.
- `lib/services/settings-service.ts`
  Responsibility: expose the new provider and model defaults in generated settings.
- `app/settings/page.tsx`
  Responsibility: surface the active provider/mode more clearly.
- `app/api/generations/utils.ts`
  Responsibility: pass the configured provider mode and generation model to provider selection.
- `README.md`
  Responsibility: document local-only setup, required environment variables, and operational limits.
- `tests/integration/template-extraction.test.ts`
  Responsibility: keep extraction route coverage valid under the new provider-selection behavior.
- `tests/integration/generation-provider-selection.test.ts`
  Responsibility: verify that persisted settings select the composite provider mode during generation.
- `tests/integration/generation-persistence.test.ts`
  Responsibility: keep settings persistence coverage valid with the new provider defaults.
- `tests/e2e/mvp-flow.spec.ts`
  Responsibility: keep the existing flow assertions aligned with the new generation progress text if it changes.

### Environment variables to support

- `AI_PROVIDER_MODE`
- `CHATGPT_WEB_PROFILE_DIR`
- `CHATGPT_WEB_START_URL`
- `CHATGPT_WEB_TIMEOUT_MS`
- `PLAYWRIGHT_BROWSER_CHANNEL`
- `CODEX_TEMPLATE_MODEL`

---

### Task 1: Add Provider Mode Settings and Defaults

**Files:**
- Modify: `lib/schema/settings.ts`
- Modify: `lib/services/settings-service.ts`
- Modify: `tests/integration/generation-persistence.test.ts`

- [ ] **Step 1: Write the failing settings persistence test**

```ts
it("persists codex-chatgpt-web settings", async () => {
  const vaultDir = mkdtempSync(join(tmpdir(), "vtb-"));

  await saveSettings(vaultDir, {
    vaultPath: vaultDir,
    defaultTopic: "默认主题",
    templatesDir: "Templates",
    generationsDir: "Generations",
    assetsDir: "Assets/generated",
    provider: "codex-chatgpt-web",
    model: "chatgpt-web"
  });

  const settings = await loadSettings(vaultDir);

  expect(settings.provider).toBe("codex-chatgpt-web");
  expect(settings.model).toBe("chatgpt-web");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/integration/generation-persistence.test.ts`

Expected: FAIL because `settingsSchema` still defaults to `openai` / `gpt-image-1` assumptions and does not constrain the new provider mode explicitly.

- [ ] **Step 3: Update the settings schema**

```ts
import { z } from "zod";

export const providerModeSchema = z.enum([
  "openai",
  "mock",
  "codex-chatgpt-web"
]);

export const settingsSchema = z.object({
  vaultPath: z.string().min(1),
  defaultTopic: z.string().default(""),
  templatesDir: z.string().default("Templates"),
  generationsDir: z.string().default("Generations"),
  assetsDir: z.string().default("Assets/generated"),
  provider: providerModeSchema.default("openai"),
  model: z.string().min(1).default("gpt-image-1")
});

export type Settings = z.infer<typeof settingsSchema>;
```

- [ ] **Step 4: Update default settings for the local-only mode-compatible shape**

```ts
function createDefaultSettings(vaultDir: string): Settings {
  return settingsSchema.parse({
    vaultPath: vaultDir,
    defaultTopic: "",
    templatesDir: "Templates",
    generationsDir: "Generations",
    assetsDir: "Assets/generated",
    provider: process.env.AI_PROVIDER_MODE ?? "openai",
    model:
      process.env.AI_PROVIDER_MODE === "codex-chatgpt-web"
        ? "chatgpt-web"
        : "gpt-image-1"
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --run tests/integration/generation-persistence.test.ts`

Expected: PASS with the new provider mode persisted and loaded unchanged.

- [ ] **Step 6: Commit**

```bash
git add lib/schema/settings.ts lib/services/settings-service.ts tests/integration/generation-persistence.test.ts
git commit -m "feat: add codex chatgpt web provider settings"
```

### Task 2: Add Composite Provider Delegation

**Files:**
- Create: `lib/providers/composite.ts`
- Modify: `lib/providers/index.ts`
- Test: `tests/unit/providers/composite-provider.test.ts`

- [ ] **Step 1: Write the failing composite delegation tests**

```ts
import { describe, expect, it, vi } from "vitest";

import { CompositeAiProvider } from "@/lib/providers/composite";

describe("CompositeAiProvider", () => {
  it("delegates extraction to the extraction provider", async () => {
    const extraction = {
      analyzeImageToTemplate: vi.fn().mockResolvedValue({ title: "图", templateText: "x", slots: [], styleTags: [], negativePrompt: "" }),
      extractPromptToTemplate: vi.fn().mockResolvedValue({ title: "词", templateText: "y", slots: [], styleTags: [], negativePrompt: "" })
    };
    const generation = {
      generateImageFromTemplate: vi.fn().mockResolvedValue({ images: [] })
    };

    const provider = new CompositeAiProvider(extraction as never, generation as never);
    await provider.extractPromptToTemplate({ prompt: "一张海报" });

    expect(extraction.extractPromptToTemplate).toHaveBeenCalledWith({ prompt: "一张海报" });
    expect(generation.generateImageFromTemplate).not.toHaveBeenCalled();
  });

  it("delegates generation to the generation provider", async () => {
    const extraction = {
      analyzeImageToTemplate: vi.fn(),
      extractPromptToTemplate: vi.fn()
    };
    const generation = {
      generateImageFromTemplate: vi.fn().mockResolvedValue({ images: [] })
    };

    const provider = new CompositeAiProvider(extraction as never, generation as never);
    await provider.generateImageFromTemplate({ finalPrompt: "一张玻璃杯海报" });

    expect(generation.generateImageFromTemplate).toHaveBeenCalledWith({
      finalPrompt: "一张玻璃杯海报"
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/providers/composite-provider.test.ts`

Expected: FAIL because `CompositeAiProvider` does not exist yet.

- [ ] **Step 3: Implement the composite provider**

```ts
import type {
  AiProvider,
  GenerateImageInput,
  ImageTemplateInput
} from "@/lib/providers/types";

type ExtractionProvider = Pick<
  AiProvider,
  "analyzeImageToTemplate" | "extractPromptToTemplate"
>;

type GenerationProvider = Pick<AiProvider, "generateImageFromTemplate">;

export class CompositeAiProvider implements AiProvider {
  constructor(
    private readonly extractionProvider: ExtractionProvider,
    private readonly generationProvider: GenerationProvider
  ) {}

  analyzeImageToTemplate(input: ImageTemplateInput) {
    return this.extractionProvider.analyzeImageToTemplate(input);
  }

  extractPromptToTemplate(input: { prompt: string }) {
    return this.extractionProvider.extractPromptToTemplate(input);
  }

  generateImageFromTemplate(input: GenerateImageInput) {
    return this.generationProvider.generateImageFromTemplate(input);
  }
}
```

- [ ] **Step 4: Wire provider selection to the composite path**

```ts
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

  if (providerMode === "mock" || (!process.env.OPENAI_API_KEY && providerMode === "openai")) {
    return new MockAiProvider();
  }

  if (providerMode === "codex-chatgpt-web") {
    return new CompositeAiProvider(
      new CodexCliProvider(options.templateModel ?? process.env.CODEX_TEMPLATE_MODEL),
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- --run tests/unit/providers/composite-provider.test.ts`

Expected: PASS with composite delegation verified.

- [ ] **Step 6: Commit**

```bash
git add lib/providers/composite.ts lib/providers/index.ts tests/unit/providers/composite-provider.test.ts
git commit -m "feat: add composite ai provider"
```

### Task 3: Implement Codex CLI Template Extraction

**Files:**
- Create: `lib/providers/codex-cli.ts`
- Test: `tests/unit/providers/codex-cli-provider.test.ts`

- [ ] **Step 1: Write the failing Codex CLI provider tests**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

const execFileMock = vi.fn();
const unlinkMock = vi.fn();
const writeFileMock = vi.fn();

vi.mock("node:child_process", () => ({
  execFile: execFileMock
}));

vi.mock("node:fs/promises", () => ({
  unlink: unlinkMock,
  writeFile: writeFileMock
}));

import { CodexCliProvider } from "@/lib/providers/codex-cli";

describe("CodexCliProvider", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("parses prompt extraction JSON", async () => {
    execFileMock.mockImplementation((_cmd, _args, _options, callback) => {
      callback(null, '{"title":"产品海报","templateText":"一张{subject}海报","slots":[],"styleTags":[],"negativePrompt":""}', "");
    });

    const provider = new CodexCliProvider("gpt-5.3-codex");
    const result = await provider.extractPromptToTemplate({ prompt: "一张产品海报" });

    expect(result.title).toBe("产品海报");
    expect(execFileMock).toHaveBeenCalledWith(
      "codex",
      expect.arrayContaining(["exec"]),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("writes and removes a temp file for image extraction", async () => {
    execFileMock.mockImplementation((_cmd, _args, _options, callback) => {
      callback(null, '{"title":"图像模板","templateText":"一张{subject}产品图","slots":[],"styleTags":[],"negativePrompt":""}', "");
    });

    const provider = new CodexCliProvider("gpt-5.3-codex");
    await provider.analyzeImageToTemplate({
      imageBase64: Buffer.from("fake-image").toString("base64"),
      mimeType: "image/png"
    });

    expect(writeFileMock).toHaveBeenCalled();
    expect(unlinkMock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/providers/codex-cli-provider.test.ts`

Expected: FAIL because `CodexCliProvider` does not exist yet.

- [ ] **Step 3: Implement the Codex CLI provider**

```ts
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import {
  providerTemplateDraftSchema,
  type AiProvider,
  type ImageTemplateInput
} from "@/lib/providers/types";

const execFileAsync = promisify(execFile);

const PROMPT_TEMPLATE_INSTRUCTIONS = [
  "你是一个提示词模板提取器。",
  "只返回 JSON，不要输出 Markdown，不要补充解释。",
  'JSON 结构必须为: {"title":string,"templateText":string,"slots":[{"key":string,"label":string,"description":string,"required":boolean}],"styleTags":string[],"negativePrompt":string}.'
].join("\\n");

function buildPromptExtractionInput(prompt: string) {
  return `${PROMPT_TEMPLATE_INSTRUCTIONS}\\n请将下面的描述词提取成可复用模板，并识别可替换槽位：\\n${prompt}`;
}

function buildImageExtractionInput() {
  return `${PROMPT_TEMPLATE_INSTRUCTIONS}\\n请分析这张图片，并提取一个可复用的中文提示词模板。`;
}

export class CodexCliProvider implements AiProvider {
  constructor(private readonly model = "gpt-5.3-codex") {}

  async analyzeImageToTemplate(input: ImageTemplateInput) {
    const extension = input.mimeType === "image/png" ? "png" : "jpg";
    const filePath = join(tmpdir(), `vtb-${randomUUID()}.${extension}`);

    await writeFile(filePath, Buffer.from(input.imageBase64, "base64"));

    try {
      const { stdout } = await execFileAsync(
        "codex",
        ["exec", "--model", this.model, "--image", filePath, buildImageExtractionInput()],
        { timeout: 120000, maxBuffer: 1024 * 1024 * 4 }
      );

      return providerTemplateDraftSchema.parse(JSON.parse(stdout));
    } finally {
      await unlink(filePath).catch(() => undefined);
    }
  }

  async extractPromptToTemplate(input: { prompt: string }) {
    const { stdout } = await execFileAsync(
      "codex",
      ["exec", "--model", this.model, buildPromptExtractionInput(input.prompt)],
      { timeout: 120000, maxBuffer: 1024 * 1024 * 4 }
    );

    return providerTemplateDraftSchema.parse(JSON.parse(stdout));
  }

  async generateImageFromTemplate() {
    throw new Error("CodexCliProvider does not support image generation");
  }
}
```

- [ ] **Step 4: Tighten the provider to emit actionable errors**

```ts
function parseTemplateDraft(stdout: string) {
  try {
    return providerTemplateDraftSchema.parse(JSON.parse(stdout));
  } catch (error) {
    throw new Error(`Codex output was not valid template JSON: ${(error as Error).message}`);
  }
}
```

Use `parseTemplateDraft(stdout)` in both extraction methods instead of direct `JSON.parse(...)`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- --run tests/unit/providers/codex-cli-provider.test.ts tests/integration/template-extraction.test.ts`

Expected: PASS with both direct provider behavior and route-level extraction coverage intact.

- [ ] **Step 6: Commit**

```bash
git add lib/providers/codex-cli.ts tests/unit/providers/codex-cli-provider.test.ts tests/integration/template-extraction.test.ts
git commit -m "feat: add codex cli template extraction provider"
```

### Task 4: Implement ChatGPT Web Image Generation

**Files:**
- Create: `lib/providers/chatgpt-web.ts`
- Test: `tests/unit/providers/chatgpt-web-provider.test.ts`

- [ ] **Step 1: Write the failing ChatGPT Web provider tests**

```ts
import { describe, expect, it, vi } from "vitest";

const page = {
  goto: vi.fn(),
  getByRole: vi.fn(),
  locator: vi.fn(),
  waitForLoadState: vi.fn(),
  waitForTimeout: vi.fn()
};

const context = {
  pages: vi.fn(() => [page]),
  newPage: vi.fn(async () => page),
  close: vi.fn()
};

const launchPersistentContext = vi.fn(async () => context);

vi.mock("playwright", () => ({
  chromium: { launchPersistentContext }
}));

import { ChatGptWebImageProvider } from "@/lib/providers/chatgpt-web";

describe("ChatGptWebImageProvider", () => {
  it("fails fast when profileDir is missing", async () => {
    const provider = new ChatGptWebImageProvider({});

    await expect(
      provider.generateImageFromTemplate({ finalPrompt: "一张玻璃杯海报" })
    ).rejects.toThrow(/CHATGPT_WEB_PROFILE_DIR/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/providers/chatgpt-web-provider.test.ts`

Expected: FAIL because `ChatGptWebImageProvider` does not exist yet.

- [ ] **Step 3: Implement the provider skeleton with configuration validation**

```ts
import { chromium } from "playwright";

import { generatedImageSchema, type AiProvider, type GenerateImageInput } from "@/lib/providers/types";

type ChatGptWebOptions = {
  browserChannel?: string;
  profileDir?: string;
  startUrl?: string;
  timeoutMs?: number;
};

const DEFAULT_START_URL = "https://chatgpt.com/";
const DEFAULT_TIMEOUT_MS = 180000;

export class ChatGptWebImageProvider implements AiProvider {
  constructor(private readonly options: ChatGptWebOptions = {}) {}

  async analyzeImageToTemplate() {
    throw new Error("ChatGptWebImageProvider does not support template extraction");
  }

  async extractPromptToTemplate() {
    throw new Error("ChatGptWebImageProvider does not support template extraction");
  }

  async generateImageFromTemplate(input: GenerateImageInput) {
    if (!this.options.profileDir) {
      throw new Error("CHATGPT_WEB_PROFILE_DIR is required for ChatGPT Web image generation");
    }

    const context = await chromium.launchPersistentContext(this.options.profileDir, {
      channel: this.options.browserChannel,
      headless: false
    });

    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(this.options.startUrl ?? DEFAULT_START_URL, {
      waitUntil: "domcontentloaded",
      timeout: this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    });

    await page.waitForLoadState("networkidle");

    const base64 = Buffer.from("temporary-test-image").toString("base64");

    return {
      images: [
        generatedImageSchema.parse({
          fileName: "chatgpt-web-generated.png",
          base64,
          mimeType: "image/png"
        })
      ]
    };
  }
}
```

- [ ] **Step 4: Replace the temporary test image with real page automation**

```ts
const promptBox = page.getByRole("textbox").last();
await promptBox.click();
await promptBox.fill(input.finalPrompt);
await promptBox.press("Enter");

const imageLocator = page.locator("img").last();
await imageLocator.waitFor({
  state: "visible",
  timeout: this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS
});

const imageUrl = await imageLocator.getAttribute("src");

if (!imageUrl) {
  throw new Error("ChatGPT Web returned an image without a retrievable src");
}

const response = await page.request.get(imageUrl);
const buffer = Buffer.from(await response.body());

return {
  images: [
    generatedImageSchema.parse({
      fileName: "chatgpt-web-generated.png",
      base64: buffer.toString("base64"),
      mimeType: response.headers()["content-type"] ?? "image/png"
    })
  ]
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- --run tests/unit/providers/chatgpt-web-provider.test.ts`

Expected: PASS for configuration validation and mocked generation behavior.

- [ ] **Step 6: Commit**

```bash
git add lib/providers/chatgpt-web.ts tests/unit/providers/chatgpt-web-provider.test.ts
git commit -m "feat: add chatgpt web image provider"
```

### Task 5: Wire Generation Flow to the New Provider Mode

**Files:**
- Modify: `app/api/generations/utils.ts`
- Modify: `app/settings/page.tsx`
- Create: `tests/integration/generation-provider-selection.test.ts`
- Test: `tests/e2e/mvp-flow.spec.ts`

- [ ] **Step 1: Write the failing provider-mode generation test**

Create `tests/integration/generation-provider-selection.test.ts` with:

```ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleGenerationRequest } from "@/app/api/generations/utils";
import { saveTemplate } from "@/lib/services/template-repository";
import { saveSettings } from "@/lib/services/settings-service";

const mockProvider = {
  analyzeImageToTemplate: vi.fn(),
  extractPromptToTemplate: vi.fn(),
  generateImageFromTemplate: vi.fn().mockResolvedValue({
    images: [
      {
        fileName: "generated.png",
        base64: Buffer.from("fake-image").toString("base64"),
        mimeType: "image/png"
      }
    ]
  })
};

const getAiProvider = vi.fn(() => mockProvider);

vi.mock("@/lib/providers", () => ({
  getAiProvider
}));

describe("generation provider selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the persisted provider mode and model", async () => {
    const vaultDir = mkdtempSync(join(tmpdir(), "vtb-"));

    await saveSettings(vaultDir, {
      vaultPath: vaultDir,
      defaultTopic: "",
      templatesDir: "Templates",
      generationsDir: "Generations",
      assetsDir: "Assets/generated",
      provider: "codex-chatgpt-web",
      model: "chatgpt-web"
    });

    await saveTemplate(vaultDir, {
      id: "tpl_001",
      title: "产品海报",
      sourceType: "prompt",
      templateText: "一张{subject}海报",
      slots: [{ key: "subject", label: "主体", description: "主体", required: true }],
      styleTags: [],
      negativePrompt: "",
      notes: "",
      createdAt: "2026-05-05T00:00:00.000Z",
      updatedAt: "2026-05-05T00:00:00.000Z",
      obsidianPath: "Templates/产品海报.md"
    });

    await handleGenerationRequest(vaultDir, {
      mode: "generate",
      templateId: "tpl_001",
      slotValues: { subject: "玻璃冷萃咖啡" },
      topic: "咖啡"
    });

    expect(getAiProvider).toHaveBeenCalledWith({
      provider: "codex-chatgpt-web",
      imageModel: "chatgpt-web"
    });
  });
});
```

- [ ] **Step 2: Run the targeted generation flow test and verify it fails**

Run: `pnpm test -- --run tests/integration/generation-provider-selection.test.ts`

Expected: FAIL because `handleGenerationRequest()` is not yet covered by a test that asserts persisted provider mode selection.

- [ ] **Step 3: Pass persisted provider mode through generation provider selection**

Update `app/api/generations/utils.ts` so provider selection remains:

```ts
  const provider = getAiProvider({
    provider: settings.provider,
    imageModel: settings.model
  });
```

and keep this code path covered by the new generation integration test from Step 1.

- [ ] **Step 4: Update the settings page copy for the new mode**

```tsx
<div className="rounded-[1.4rem] border border-black/6 bg-[rgba(248,243,236,0.95)] p-4">
  <dt className="text-sm text-[#6f5748]">Provider</dt>
  <dd className="mt-2 text-sm text-[#1f130c]">
    {settings.provider === "codex-chatgpt-web" ? "codex-chatgpt-web（本机）" : settings.provider}
  </dd>
</div>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- --run tests/integration/generation-provider-selection.test.ts tests/integration/generation-persistence.test.ts`

Expected: PASS for provider selection and settings rendering.

Then run: `pnpm exec playwright test tests/e2e/mvp-flow.spec.ts`

Expected: PASS for the workspace flow assertions.

- [ ] **Step 6: Commit**

```bash
git add app/api/generations/utils.ts app/settings/page.tsx tests/integration/generation-provider-selection.test.ts tests/e2e/mvp-flow.spec.ts
git commit -m "feat: wire generation flow to local provider mode"
```

### Task 6: Document Local Setup and Operational Limits

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write the failing documentation checklist**

Add this checklist to the top of your working notes and verify each item is absent before editing `README.md`:

```md
- local-only provider mode is documented
- required env vars are listed
- ChatGPT login/profile requirement is explained
- known fragility and recovery steps are described
```

- [ ] **Step 2: Confirm the current README is missing the local-only setup**

Run: `rg -n "AI_PROVIDER_MODE|CHATGPT_WEB_PROFILE_DIR|codex-chatgpt-web|Playwright" README.md`

Expected: no matches.

- [ ] **Step 3: Update the README setup section**

```md
### 本机 Codex + ChatGPT Web 模式

如果你没有 OpenAI API key，但本机已登录 Codex 和 ChatGPT Plus，可以启用本机自动化模式：

```bash
export AI_PROVIDER_MODE="codex-chatgpt-web"
export CHATGPT_WEB_PROFILE_DIR="/absolute/path/to/your/chrome-profile"
export CHATGPT_WEB_START_URL="https://chatgpt.com/"
export CHATGPT_WEB_TIMEOUT_MS="180000"
export PLAYWRIGHT_BROWSER_CHANNEL="chrome"
```

说明：

- 模板抽取走本机 `codex exec`
- 图片生成走 Playwright 驱动的 ChatGPT 网页
- 仅支持本机单用户使用
- 如果 ChatGPT 登录失效，需要先在该浏览器 profile 中重新登录
```

- [ ] **Step 4: Add an operational caveats section**

```md
## 本机自动化模式注意事项

- ChatGPT 网页改版后，自动化选择器可能失效
- 该模式不适合部署到服务器
- 如遇生成超时，请先确认浏览器 profile 可正常打开 ChatGPT 并保持登录
- 如遇图片抓取失败，请检查网页中是否已出现结果图
```

- [ ] **Step 5: Verify the README changes**

Run: `rg -n "AI_PROVIDER_MODE|CHATGPT_WEB_PROFILE_DIR|codex-chatgpt-web|Playwright" README.md`

Expected: matches for all new setup and caveat documentation.

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: add local codex chatgpt web setup guide"
```

### Task 7: End-to-End Verification

**Files:**
- No code changes required unless verification exposes a defect.

- [ ] **Step 1: Run the unit and integration suite**

Run: `pnpm test`

Expected: PASS for all Vitest unit and integration coverage.

- [ ] **Step 2: Run the browser test suite**

Run: `pnpm test:e2e`

Expected: PASS for the existing app flow tests.

- [ ] **Step 3: Run a manual local-only verification**

Use this checklist:

```md
1. Export `AI_PROVIDER_MODE=codex-chatgpt-web`
2. Export `CHATGPT_WEB_PROFILE_DIR` to a logged-in browser profile
3. Start the app with `pnpm dev`
4. Create a prompt template from `/prompt-template`
5. Save and navigate to `/generate`
6. Start generation
7. Confirm a ChatGPT browser window/tab opens or updates
8. Confirm the generated image appears in the app
9. Confirm the image file is written under `.obsidian-vault/Assets/generated/...`
10. Confirm a Markdown record is written under `.obsidian-vault/Generations/...`
```

- [ ] **Step 4: Fix any verification failures before finalizing**

If failures appear, create a small follow-up commit per defect instead of batching unreviewed fixes.

- [ ] **Step 5: Commit the verified implementation**

```bash
git status
git add .
git commit -m "feat: support local codex and chatgpt web providers"
```

---

## Self-Review

### Spec coverage

- Composite provider architecture: covered by Tasks 1 and 2.
- Codex-based extraction: covered by Task 3.
- ChatGPT Web image generation: covered by Task 4.
- Generation flow and settings/UI integration: covered by Task 5.
- Local setup and risks: covered by Task 6.
- Manual local verification and final checks: covered by Task 7.

No spec sections are currently uncovered.

### Placeholder scan

- Removed generic phrases like "add tests later" and "handle edge cases" without specifics.
- Removed temporary "replace later" instructions from Task 5 and converted them into direct executable steps.
- Every task lists exact files, commands, and code snippets.
- The only intentionally deferred work is explicit non-goal scope from the spec, not a plan gap.

### Type consistency

- Provider mode string is consistently `codex-chatgpt-web`.
- Local generation model string is consistently `chatgpt-web`.
- Composite provider class is consistently `CompositeAiProvider`.
- Extraction provider class is consistently `CodexCliProvider`.
- Generation provider class is consistently `ChatGptWebImageProvider`.
