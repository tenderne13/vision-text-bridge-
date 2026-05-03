# Vision Text Bridge MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chinese-first MVP web app that extracts reusable prompt templates from images or prompts, fills template slots to generate images through OpenAI, and persists templates plus generation history into Obsidian.

**Architecture:** Use `Next.js` as the app shell, but keep business logic outside page components. Implement a small service layer over provider and Obsidian adapters, with Zod schemas enforcing contracts between UI, API handlers, and persistence.

**Tech Stack:** `Next.js`, `TypeScript`, `Tailwind CSS`, `shadcn/ui`, `Vitest`, `Playwright`, `Zod`, `openai`, `gray-matter`, `yaml`

---

## File Structure

### App Shell

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `components.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

### Workspaces and Global Pages

- Create: `app/(workspace)/image-template/page.tsx`
- Create: `app/(workspace)/prompt-template/page.tsx`
- Create: `app/(workspace)/generate/page.tsx`
- Create: `app/templates/page.tsx`
- Create: `app/generations/page.tsx`
- Create: `app/settings/page.tsx`

### API Handlers

- Create: `app/api/templates/from-image/route.ts`
- Create: `app/api/templates/from-prompt/route.ts`
- Create: `app/api/templates/route.ts`
- Create: `app/api/templates/[id]/route.ts`
- Create: `app/api/generations/route.ts`
- Create: `app/api/settings/route.ts`

### UI Components

- Create: `components/app-shell.tsx`
- Create: `components/home-entry-card.tsx`
- Create: `components/template-editor.tsx`
- Create: `components/slot-form.tsx`
- Create: `components/progress-state.tsx`
- Create: `components/result-panel.tsx`
- Create: `components/sidebar-template-list.tsx`
- Create: `components/status-badge.tsx`

### Schemas and Types

- Create: `lib/schema/template.ts`
- Create: `lib/schema/generation.ts`
- Create: `lib/schema/settings.ts`

### Provider Layer

- Create: `lib/providers/types.ts`
- Create: `lib/providers/openai.ts`
- Create: `lib/providers/index.ts`

### Service Layer

- Create: `lib/services/template-extraction.ts`
- Create: `lib/services/image-generation.ts`
- Create: `lib/services/template-repository.ts`
- Create: `lib/services/generation-repository.ts`
- Create: `lib/services/settings-service.ts`

### Obsidian Layer

- Create: `lib/obsidian/pathing.ts`
- Create: `lib/obsidian/frontmatter.ts`
- Create: `lib/obsidian/template-files.ts`
- Create: `lib/obsidian/generation-files.ts`
- Create: `lib/obsidian/settings-file.ts`

### Utilities

- Create: `lib/utils/slug.ts`
- Create: `lib/utils/template-text.ts`
- Create: `lib/utils/time.ts`
- Create: `lib/utils/env.ts`

### Tests

- Create: `tests/unit/template-schema.test.ts`
- Create: `tests/unit/frontmatter.test.ts`
- Create: `tests/unit/template-text.test.ts`
- Create: `tests/integration/template-extraction.test.ts`
- Create: `tests/integration/generation-persistence.test.ts`
- Create: `tests/e2e/mvp-flow.spec.ts`
- Create: `playwright.config.ts`
- Create: `vitest.config.ts`
- Create: `tests/fixtures/sample-image.png`

## Task 1: Scaffold the App and Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Write the failing smoke test**

```ts
// tests/unit/template-schema.test.ts
import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("loads the test runner", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify the environment is not ready yet**

Run: `pnpm vitest run tests/unit/template-schema.test.ts`
Expected: FAIL with `pnpm: command not found`, `vitest: command not found`, or missing project config.

- [ ] **Step 3: Create the minimal project configuration**

```json
{
  "name": "vision-text-bridge",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "next": "^15.0.0",
    "openai": "^4.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "yaml": "^2.6.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

```tsx
// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// app/page.tsx
export default function HomePage() {
  return <main>Vision Text Bridge</main>;
}
```

- [ ] **Step 4: Install dependencies and run the smoke test**

Run: `pnpm install`
Expected: lockfile created and dependencies installed.

Run: `pnpm vitest run tests/unit/template-schema.test.ts`
Expected: PASS with `1 passed`.

- [ ] **Step 5: Start the app and verify the homepage renders**

Run: `pnpm dev`
Expected: local Next.js server starts without config errors and `/` renders `Vision Text Bridge`.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json next.config.ts postcss.config.js tailwind.config.ts app/layout.tsx app/page.tsx app/globals.css vitest.config.ts playwright.config.ts tests/unit/template-schema.test.ts
git commit -m "chore: scaffold next app and test tooling"
```

## Task 2: Define Core Schemas and Template Utilities

**Files:**
- Create: `lib/schema/template.ts`
- Create: `lib/schema/generation.ts`
- Create: `lib/schema/settings.ts`
- Create: `lib/utils/template-text.ts`
- Test: `tests/unit/template-schema.test.ts`
- Test: `tests/unit/template-text.test.ts`

- [ ] **Step 1: Write failing schema tests**

```ts
// tests/unit/template-schema.test.ts
import { describe, expect, it } from "vitest";
import { templateSchema } from "@/lib/schema/template";

describe("templateSchema", () => {
  it("accepts a reusable template with slots", () => {
    const parsed = templateSchema.parse({
      id: "tpl_001",
      title: "产品海报",
      sourceType: "prompt",
      templateText: "一张{主体}的海报，风格为{风格}",
      slots: [
        { key: "subject", label: "主体", description: "要生成的主体", required: true }
      ],
      styleTags: ["海报", "商业摄影"],
      negativePrompt: "模糊, 低质量",
      notes: "",
      createdAt: "2026-05-03T00:00:00.000Z",
      updatedAt: "2026-05-03T00:00:00.000Z",
      obsidianPath: "Templates/产品海报.md"
    });

    expect(parsed.sourceType).toBe("prompt");
  });
});
```

```ts
// tests/unit/template-text.test.ts
import { describe, expect, it } from "vitest";
import { renderTemplateText } from "@/lib/utils/template-text";

describe("renderTemplateText", () => {
  it("replaces placeholders with slot values", () => {
    const result = renderTemplateText(
      "一张{主体}的海报，风格为{风格}",
      { subject: "咖啡杯", style: "北欧极简" }
    );

    expect(result).toBe("一张咖啡杯的海报，风格为北欧极简");
  });
});
```

- [ ] **Step 2: Run tests to verify missing module failures**

Run: `pnpm vitest run tests/unit/template-schema.test.ts tests/unit/template-text.test.ts`
Expected: FAIL with module resolution errors for schema and utility files.

- [ ] **Step 3: Implement the schemas and utility**

```ts
// lib/schema/template.ts
import { z } from "zod";

export const slotSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().default(""),
  exampleValue: z.string().optional(),
  required: z.boolean().default(true),
  defaultValue: z.string().optional()
});

export const templateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sourceType: z.enum(["image", "prompt"]),
  templateText: z.string().min(1),
  slots: z.array(slotSchema),
  styleTags: z.array(z.string()).default([]),
  negativePrompt: z.string().default(""),
  notes: z.string().default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  obsidianPath: z.string().min(1)
});

export type Template = z.infer<typeof templateSchema>;
export type TemplateSlot = z.infer<typeof slotSchema>;
```

```ts
// lib/utils/template-text.ts
export function renderTemplateText(
  templateText: string,
  slotValues: Record<string, string>
) {
  return templateText.replace(/\{([^}]+)\}/g, (_, rawKey) => {
    const normalized = rawKey.trim();
    return slotValues[normalized] ?? `{${normalized}}`;
  });
}
```

- [ ] **Step 4: Run tests to verify the schemas and rendering logic**

Run: `pnpm vitest run tests/unit/template-schema.test.ts tests/unit/template-text.test.ts`
Expected: PASS with both test files green.

- [ ] **Step 5: Commit**

```bash
git add lib/schema/template.ts lib/schema/generation.ts lib/schema/settings.ts lib/utils/template-text.ts tests/unit/template-schema.test.ts tests/unit/template-text.test.ts
git commit -m "feat: add core schemas and template rendering"
```

## Task 3: Build Obsidian File Adapters and Persistence Tests

**Files:**
- Create: `lib/obsidian/pathing.ts`
- Create: `lib/obsidian/frontmatter.ts`
- Create: `lib/obsidian/template-files.ts`
- Create: `lib/obsidian/generation-files.ts`
- Create: `lib/obsidian/settings-file.ts`
- Create: `lib/services/template-repository.ts`
- Create: `lib/services/generation-repository.ts`
- Create: `lib/services/settings-service.ts`
- Test: `tests/unit/frontmatter.test.ts`
- Test: `tests/integration/generation-persistence.test.ts`

- [ ] **Step 1: Write failing tests for frontmatter serialization and repository persistence**

```ts
// tests/unit/frontmatter.test.ts
import { describe, expect, it } from "vitest";
import { serializeTemplateMarkdown } from "@/lib/obsidian/frontmatter";

describe("serializeTemplateMarkdown", () => {
  it("writes frontmatter and body for a template", () => {
    const markdown = serializeTemplateMarkdown({
      id: "tpl_001",
      title: "产品海报",
      sourceType: "prompt",
      templateText: "一张{主体}的海报",
      slots: [],
      styleTags: [],
      negativePrompt: "",
      notes: "",
      createdAt: "2026-05-03T00:00:00.000Z",
      updatedAt: "2026-05-03T00:00:00.000Z",
      obsidianPath: "Templates/产品海报.md"
    });

    expect(markdown).toContain("templateText:");
    expect(markdown).toContain("# 模板正文");
  });
});
```

```ts
// tests/integration/generation-persistence.test.ts
import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { saveTemplate } from "@/lib/services/template-repository";

describe("saveTemplate", () => {
  it("writes template markdown into the Obsidian template folder", async () => {
    const vaultDir = mkdtempSync(join(tmpdir(), "vtb-"));

    const saved = await saveTemplate(vaultDir, {
      id: "tpl_001",
      title: "产品海报",
      sourceType: "prompt",
      templateText: "一张{主体}的海报",
      slots: [],
      styleTags: [],
      negativePrompt: "",
      notes: "",
      createdAt: "2026-05-03T00:00:00.000Z",
      updatedAt: "2026-05-03T00:00:00.000Z",
      obsidianPath: "Templates/产品海报.md"
    });

    expect(saved.obsidianPath).toBe("Templates/产品海报.md");
    expect(readFileSync(join(vaultDir, "Templates", "产品海报.md"), "utf8")).toContain("一张{主体}的海报");
  });
});
```

- [ ] **Step 2: Run tests to verify file adapter modules are missing**

Run: `pnpm vitest run tests/unit/frontmatter.test.ts tests/integration/generation-persistence.test.ts`
Expected: FAIL with missing imports for Obsidian adapters.

- [ ] **Step 3: Implement the minimal filesystem-backed adapters**

```ts
// lib/obsidian/pathing.ts
import { join } from "node:path";

export function resolveTemplatePath(vaultDir: string, relativePath: string) {
  return join(vaultDir, relativePath);
}
```

```ts
// lib/obsidian/frontmatter.ts
import matter from "gray-matter";
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
```

```ts
// lib/services/template-repository.ts
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { Template } from "@/lib/schema/template";
import { resolveTemplatePath } from "@/lib/obsidian/pathing";
import { serializeTemplateMarkdown } from "@/lib/obsidian/frontmatter";

export async function saveTemplate(vaultDir: string, template: Template) {
  const fullPath = resolveTemplatePath(vaultDir, template.obsidianPath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, serializeTemplateMarkdown(template), "utf8");
  return template;
}
```

- [ ] **Step 4: Run the persistence tests**

Run: `pnpm vitest run tests/unit/frontmatter.test.ts tests/integration/generation-persistence.test.ts`
Expected: PASS with template serialization and file writing both green.

- [ ] **Step 5: Commit**

```bash
git add lib/obsidian/pathing.ts lib/obsidian/frontmatter.ts lib/obsidian/template-files.ts lib/obsidian/generation-files.ts lib/obsidian/settings-file.ts lib/services/template-repository.ts lib/services/generation-repository.ts lib/services/settings-service.ts tests/unit/frontmatter.test.ts tests/integration/generation-persistence.test.ts
git commit -m "feat: add obsidian persistence adapters"
```

## Task 4: Implement Provider Contracts and Template Extraction Services

**Files:**
- Create: `lib/providers/types.ts`
- Create: `lib/providers/openai.ts`
- Create: `lib/providers/index.ts`
- Create: `lib/services/template-extraction.ts`
- Test: `tests/integration/template-extraction.test.ts`

- [ ] **Step 1: Write failing tests for image and prompt extraction services**

```ts
// tests/integration/template-extraction.test.ts
import { describe, expect, it, vi } from "vitest";
import { extractTemplateFromPrompt } from "@/lib/services/template-extraction";

describe("extractTemplateFromPrompt", () => {
  it("normalizes provider output into a template draft", async () => {
    const provider = {
      extractPromptToTemplate: vi.fn().mockResolvedValue({
        title: "产品海报",
        templateText: "一张{subject}的海报，风格为{style}",
        slots: [
          { key: "subject", label: "主体", description: "要生成的主体", required: true },
          { key: "style", label: "风格", description: "画面风格", required: true }
        ],
        styleTags: ["海报"],
        negativePrompt: "模糊"
      })
    };

    const draft = await extractTemplateFromPrompt(provider as never, "一张咖啡杯海报");

    expect(draft.title).toBe("产品海报");
    expect(draft.sourceType).toBe("prompt");
  });
});
```

- [ ] **Step 2: Run the integration test to verify service modules are missing**

Run: `pnpm vitest run tests/integration/template-extraction.test.ts`
Expected: FAIL with missing provider and service modules.

- [ ] **Step 3: Implement the provider contract and extraction service**

```ts
// lib/providers/types.ts
import type { TemplateSlot } from "@/lib/schema/template";

export type TemplateDraft = {
  title: string;
  templateText: string;
  slots: TemplateSlot[];
  styleTags: string[];
  negativePrompt: string;
};

export interface AiProvider {
  analyzeImageToTemplate(input: { imageBase64: string; mimeType: string }): Promise<TemplateDraft>;
  extractPromptToTemplate(input: { prompt: string }): Promise<TemplateDraft>;
  generateImageFromTemplate(input: {
    finalPrompt: string;
    negativePrompt?: string;
    referenceImageBase64?: string;
  }): Promise<{ images: Array<{ fileName: string; base64: string; mimeType: string }> }>;
}
```

```ts
// lib/services/template-extraction.ts
import type { AiProvider } from "@/lib/providers/types";

export async function extractTemplateFromPrompt(provider: AiProvider, prompt: string) {
  const draft = await provider.extractPromptToTemplate({ prompt });
  return {
    ...draft,
    id: "",
    sourceType: "prompt" as const
  };
}
```

- [ ] **Step 4: Run the extraction test**

Run: `pnpm vitest run tests/integration/template-extraction.test.ts`
Expected: PASS with the mocked provider integration green.

- [ ] **Step 5: Commit**

```bash
git add lib/providers/types.ts lib/providers/openai.ts lib/providers/index.ts lib/services/template-extraction.ts tests/integration/template-extraction.test.ts
git commit -m "feat: add provider abstraction and extraction service"
```

## Task 5: Add REST API Routes Over Services

**Files:**
- Create: `app/api/templates/from-image/route.ts`
- Create: `app/api/templates/from-prompt/route.ts`
- Create: `app/api/templates/route.ts`
- Create: `app/api/templates/[id]/route.ts`
- Create: `app/api/generations/route.ts`
- Create: `app/api/settings/route.ts`
- Modify: `lib/services/template-repository.ts`
- Modify: `lib/services/generation-repository.ts`

- [ ] **Step 1: Write the failing route test for prompt-to-template**

```ts
// tests/integration/template-extraction.test.ts
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/templates/from-prompt/route";

describe("POST /api/templates/from-prompt", () => {
  it("returns a draft template response", async () => {
    const request = new Request("http://localhost/api/templates/from-prompt", {
      method: "POST",
      body: JSON.stringify({ prompt: "一张咖啡杯海报" }),
      headers: { "content-type": "application/json" }
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run the route test to verify handler failures**

Run: `pnpm vitest run tests/integration/template-extraction.test.ts`
Expected: FAIL because the API route is not implemented.

- [ ] **Step 3: Implement the API route pattern**

```ts
// app/api/templates/from-prompt/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/providers";
import { extractTemplateFromPrompt } from "@/lib/services/template-extraction";

const bodySchema = z.object({
  prompt: z.string().min(1)
});

export async function POST(request: Request) {
  const body = bodySchema.parse(await request.json());
  const provider = getAiProvider();
  const draft = await extractTemplateFromPrompt(provider, body.prompt);
  return NextResponse.json(draft);
}
```

- [ ] **Step 4: Run the route test**

Run: `pnpm vitest run tests/integration/template-extraction.test.ts`
Expected: PASS for the route contract after provider mocking or test-safe injection is added.

- [ ] **Step 5: Commit**

```bash
git add app/api/templates/from-image/route.ts app/api/templates/from-prompt/route.ts app/api/templates/route.ts app/api/templates/[id]/route.ts app/api/generations/route.ts app/api/settings/route.ts lib/services/template-repository.ts lib/services/generation-repository.ts
git commit -m "feat: add api routes for templates generations and settings"
```

## Task 6: Build the Chinese-First Shell and Homepage

**Files:**
- Create: `components/app-shell.tsx`
- Create: `components/home-entry-card.tsx`
- Create: `components/status-badge.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write a failing e2e smoke test for homepage navigation**

```ts
// tests/e2e/mvp-flow.spec.ts
import { test, expect } from "@playwright/test";

test("homepage shows three Chinese entry cards", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("图片生成模板")).toBeVisible();
  await expect(page.getByText("描述词生成模板")).toBeVisible();
  await expect(page.getByText("模板生成图片")).toBeVisible();
});
```

- [ ] **Step 2: Run the e2e test to verify the homepage is incomplete**

Run: `pnpm test:e2e --grep "homepage shows three Chinese entry cards"`
Expected: FAIL because the homepage only contains placeholder text.

- [ ] **Step 3: Implement the shell and homepage cards**

```tsx
// app/page.tsx
import Link from "next/link";

const entries = [
  { href: "/image-template", title: "图片生成模板", description: "上传图片并抽取可复用模板" },
  { href: "/prompt-template", title: "描述词生成模板", description: "把已有提示词整理成槽位模板" },
  { href: "/generate", title: "模板生成图片", description: "填写槽位并生成结果图片" }
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-[0.24em] text-neutral-500">Vision Text Bridge</p>
        <h1 className="text-4xl font-semibold text-neutral-950">提示词模板工作台</h1>
      </section>
      <section className="mt-10 grid gap-6 md:grid-cols-3">
        {entries.map((entry) => (
          <Link key={entry.href} href={entry.href} className="rounded-3xl border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-medium">{entry.title}</h2>
            <p className="mt-3 text-sm text-neutral-600">{entry.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Run the e2e test**

Run: `pnpm test:e2e --grep "homepage shows three Chinese entry cards"`
Expected: PASS with all three cards visible.

- [ ] **Step 5: Commit**

```bash
git add components/app-shell.tsx components/home-entry-card.tsx components/status-badge.tsx app/layout.tsx app/page.tsx app/globals.css tests/e2e/mvp-flow.spec.ts
git commit -m "feat: add chinese-first app shell and homepage"
```

## Task 7: Implement the Three Workspaces and Progress UI

**Files:**
- Create: `app/(workspace)/image-template/page.tsx`
- Create: `app/(workspace)/prompt-template/page.tsx`
- Create: `app/(workspace)/generate/page.tsx`
- Create: `components/template-editor.tsx`
- Create: `components/slot-form.tsx`
- Create: `components/progress-state.tsx`
- Create: `components/result-panel.tsx`
- Create: `components/sidebar-template-list.tsx`

- [ ] **Step 1: Write a failing e2e test for the generate workspace**

```ts
// tests/e2e/mvp-flow.spec.ts
test("generate workspace shows slot form and progress section", async ({ page }) => {
  await page.goto("/generate");
  await expect(page.getByText("模板生成图片")).toBeVisible();
  await expect(page.getByText("最终提示词预览")).toBeVisible();
  await expect(page.getByText("生成进度")).toBeVisible();
});
```

- [ ] **Step 2: Run the e2e test to verify the workspace does not exist**

Run: `pnpm test:e2e --grep "generate workspace shows slot form and progress section"`
Expected: FAIL with 404 or missing text assertions.

- [ ] **Step 3: Implement the generate workspace skeleton**

```tsx
// app/(workspace)/generate/page.tsx
export default function GeneratePage() {
  return (
    <main className="grid min-h-screen gap-6 bg-stone-50 p-6 lg:grid-cols-[280px_1fr_360px]">
      <aside className="rounded-3xl bg-white p-5">模板列表</aside>
      <section className="rounded-3xl bg-white p-6">
        <h1 className="text-2xl font-semibold">模板生成图片</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-4">槽位表单</div>
        <div className="mt-6 rounded-2xl bg-neutral-950 p-4 text-white">最终提示词预览</div>
        <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-amber-900">生成进度</div>
      </section>
      <aside className="rounded-3xl bg-white p-5">结果展示</aside>
    </main>
  );
}
```

- [ ] **Step 4: Implement matching workspace shells for image and prompt extraction**

```tsx
// app/(workspace)/image-template/page.tsx
export default function ImageTemplatePage() {
  return <main>图片生成模板</main>;
}

// app/(workspace)/prompt-template/page.tsx
export default function PromptTemplatePage() {
  return <main>描述词生成模板</main>;
}
```

- [ ] **Step 5: Run the e2e test**

Run: `pnpm test:e2e --grep "generate workspace shows slot form and progress section"`
Expected: PASS with the generate workspace skeleton visible.

- [ ] **Step 6: Commit**

```bash
git add app/(workspace)/image-template/page.tsx app/(workspace)/prompt-template/page.tsx app/(workspace)/generate/page.tsx components/template-editor.tsx components/slot-form.tsx components/progress-state.tsx components/result-panel.tsx components/sidebar-template-list.tsx tests/e2e/mvp-flow.spec.ts
git commit -m "feat: add workspace pages and progress ui"
```

## Task 8: Wire End-to-End Template Save and Image Generation Flow

**Files:**
- Modify: `app/(workspace)/image-template/page.tsx`
- Modify: `app/(workspace)/prompt-template/page.tsx`
- Modify: `app/(workspace)/generate/page.tsx`
- Modify: `components/template-editor.tsx`
- Modify: `components/slot-form.tsx`
- Modify: `components/progress-state.tsx`
- Modify: `components/result-panel.tsx`
- Modify: `lib/services/image-generation.ts`
- Modify: `lib/services/template-repository.ts`
- Modify: `lib/services/generation-repository.ts`
- Modify: `tests/e2e/mvp-flow.spec.ts`

- [ ] **Step 1: Write a failing end-to-end test for the happy path**

```ts
// tests/e2e/mvp-flow.spec.ts
test("user can create a prompt template and generate an image", async ({ page }) => {
  await page.goto("/prompt-template");
  await page.getByPlaceholder("请输入原始描述词").fill("一张咖啡杯商业海报，北欧极简风格");
  await page.getByRole("button", { name: "抽取模板" }).click();
  await expect(page.getByText("保存并去生成")).toBeVisible();
  await page.getByRole("button", { name: "保存并去生成" }).click();
  await expect(page).toHaveURL(/\/generate/);
  await page.getByLabel("主体").fill("玻璃冷萃咖啡");
  await page.getByRole("button", { name: "开始生成" }).click();
  await expect(page.getByText("正在请求生成")).toBeVisible();
  await expect(page.getByAltText("生成结果")).toBeVisible();
});
```

- [ ] **Step 2: Run the e2e test to verify the workflow is incomplete**

Run: `pnpm test:e2e --grep "user can create a prompt template and generate an image"`
Expected: FAIL because form actions and API wiring are not implemented.

- [ ] **Step 3: Implement the minimal client flow and service calls**

```ts
// lib/services/image-generation.ts
import { renderTemplateText } from "@/lib/utils/template-text";
import type { AiProvider } from "@/lib/providers/types";
import type { Template } from "@/lib/schema/template";

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
```

```tsx
// components/progress-state.tsx
const stages = [
  "正在分析模板",
  "正在拼接提示词",
  "正在请求生成",
  "正在等待出图",
  "正在归档到 Obsidian"
];

export function ProgressState({ currentStage }: { currentStage: number }) {
  return (
    <ol className="space-y-2">
      {stages.map((label, index) => (
        <li key={label} data-active={index === currentStage}>
          {label}
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Re-run unit, integration, and e2e tests**

Run: `pnpm test`
Expected: PASS.

Run: `pnpm test:e2e`
Expected: PASS for homepage, workspace, and happy-path flow.

- [ ] **Step 5: Commit**

```bash
git add app/(workspace)/image-template/page.tsx app/(workspace)/prompt-template/page.tsx app/(workspace)/generate/page.tsx components/template-editor.tsx components/slot-form.tsx components/progress-state.tsx components/result-panel.tsx lib/services/image-generation.ts lib/services/template-repository.ts lib/services/generation-repository.ts tests/e2e/mvp-flow.spec.ts
git commit -m "feat: wire template extraction generation and obsidian save flow"
```

## Task 9: Add Settings and Obsidian Path Management

**Files:**
- Modify: `app/settings/page.tsx`
- Modify: `app/api/settings/route.ts`
- Modify: `lib/services/settings-service.ts`
- Modify: `lib/obsidian/settings-file.ts`
- Modify: `tests/integration/generation-persistence.test.ts`

- [ ] **Step 1: Write the failing settings persistence test**

```ts
// tests/integration/generation-persistence.test.ts
import { describe, expect, it } from "vitest";
import { loadSettings, saveSettings } from "@/lib/services/settings-service";

describe("settings-service", () => {
  it("persists obsidian vault settings", async () => {
    await saveSettings("/tmp/vault", {
      vaultPath: "/tmp/vault",
      defaultTopic: "默认主题",
      provider: "openai",
      model: "gpt-image-1"
    });

    const settings = await loadSettings("/tmp/vault");
    expect(settings.defaultTopic).toBe("默认主题");
  });
});
```

- [ ] **Step 2: Run the settings persistence test**

Run: `pnpm vitest run tests/integration/generation-persistence.test.ts`
Expected: FAIL because settings persistence is incomplete.

- [ ] **Step 3: Implement settings save and load**

```ts
// lib/services/settings-service.ts
export async function saveSettings(vaultDir: string, settings: Settings) {
  return writeSettingsFile(vaultDir, settings);
}

export async function loadSettings(vaultDir: string) {
  return readSettingsFile(vaultDir);
}
```

- [ ] **Step 4: Run the settings test**

Run: `pnpm vitest run tests/integration/generation-persistence.test.ts`
Expected: PASS with settings persisted under `Settings/vision-text-bridge.md`.

- [ ] **Step 5: Commit**

```bash
git add app/settings/page.tsx app/api/settings/route.ts lib/services/settings-service.ts lib/obsidian/settings-file.ts tests/integration/generation-persistence.test.ts
git commit -m "feat: add obsidian settings management"
```

## Task 10: Final Verification and Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-05-03-vision-text-bridge-mvp-design.md`

- [ ] **Step 1: Write the README usage sections**

```md
## 本地启动

1. 安装依赖：`pnpm install`
2. 配置环境变量：`OPENAI_API_KEY`、`OBSIDIAN_VAULT_PATH`
3. 启动开发服务：`pnpm dev`

## MVP 功能

- 图片生成模板
- 描述词生成模板
- 模板生成图片
```

- [ ] **Step 2: Run the full verification suite**

Run: `pnpm test`
Expected: PASS.

Run: `pnpm test:e2e`
Expected: PASS.

Run: `pnpm build`
Expected: PASS with no type or route errors.

- [ ] **Step 3: Update the design doc only if implementation required a spec correction**

```md
If no design correction was needed, leave the spec unchanged.
```

- [ ] **Step 4: Commit**

```bash
git add README.md docs/superpowers/specs/2026-05-03-vision-text-bridge-mvp-design.md
git commit -m "docs: add setup and usage guide"
```

## Self-Review

### Spec Coverage

- Homepage plus three workspaces: covered in Tasks 6 and 7
- Provider abstraction with OpenAI default: covered in Task 4
- Obsidian persistence for templates, settings, and generations: covered in Tasks 3 and 9
- Chinese-first UI and progress states: covered in Tasks 6, 7, and 8
- End-to-end create template then generate image flow: covered in Task 8

No spec gaps found.

### Placeholder Scan

- No `TBD`, `TODO`, or deferred implementation markers remain in tasks.
- Each task has explicit files, commands, and expected outcomes.

### Type Consistency

- `Template`, `TemplateSlot`, and provider draft shapes are introduced before later tasks use them.
- Route handlers depend on provider/service names defined in Task 4.
- Generation flow uses the same `renderTemplateText` path defined in Task 2.
