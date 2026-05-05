import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  providerTemplateDraftSchema,
  type AiProvider,
  type GenerateImageInput,
  type ImageTemplateInput,
  type ProviderTemplateDraft
} from "@/lib/providers/types";

const CODEX_EXEC_OPTIONS = {
  timeout: 120000,
  maxBuffer: 1024 * 1024 * 4
} as const;

const IMAGE_FILE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
} as const;

const PROMPT_TEMPLATE_INSTRUCTIONS = [
  "你是一个提示词模板提取器。",
  "只返回 JSON，不要输出 Markdown，不要补充解释。",
  'JSON 结构必须为: {"title":string,"templateText":string,"slots":[{"key":string,"label":string,"description":string,"required":boolean}],"styleTags":string[],"negativePrompt":string}.'
].join("\n");

function buildPromptExtractionInput(prompt: string) {
  return `${PROMPT_TEMPLATE_INSTRUCTIONS}\n请将下面的描述词提取成可复用模板，并识别可替换槽位：\n${prompt}`;
}

function buildImageExtractionInput() {
  return `${PROMPT_TEMPLATE_INSTRUCTIONS}\n请分析这张图片，并提取一个可复用的中文提示词模板。`;
}

function parseTemplateDraft(stdout: string): ProviderTemplateDraft {
  try {
    return providerTemplateDraftSchema.parse(JSON.parse(stdout));
  } catch (error) {
    throw new Error(`Codex output was not valid template JSON: ${(error as Error).message}`);
  }
}

function getImageExtension(mimeType: string) {
  const extension = IMAGE_FILE_EXTENSIONS[mimeType as keyof typeof IMAGE_FILE_EXTENSIONS];

  if (!extension) {
    throw new Error(`Unsupported image MIME type for Codex CLI: "${mimeType}"`);
  }

  return extension;
}

function createExecErrorMessage(
  context: "prompt extraction" | "image extraction",
  error: NodeJS.ErrnoException,
  stderr: string
) {
  const stderrExcerpt = stderr.trim().slice(0, 300);

  if (error.code === "ENOENT") {
    return "Codex CLI is not installed or not available on PATH";
  }

  if (error.code === "ETIMEDOUT" || error.killed || error.signal === "SIGTERM") {
    return `Codex CLI ${context} timed out after ${CODEX_EXEC_OPTIONS.timeout}ms`;
  }

  const exitDetail = typeof error.code === "number" ? ` with exit code ${error.code}` : "";
  const stderrDetail = stderrExcerpt ? ` Stderr: ${stderrExcerpt}` : "";

  return `Codex CLI ${context} failed${exitDetail}.${stderrDetail}`.trim();
}

function execFileAsync(
  args: string[],
  context: "prompt extraction" | "image extraction"
) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(
      "codex",
      args,
      CODEX_EXEC_OPTIONS,
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(createExecErrorMessage(context, error, stderr)));
          return;
        }

        resolve({ stdout, stderr });
      }
    );
  });
}

export class CodexCliProvider implements AiProvider {
  constructor(private readonly model = "gpt-5.3-codex") {}

  async analyzeImageToTemplate(input: ImageTemplateInput) {
    const extension = getImageExtension(input.mimeType);
    const filePath = join(tmpdir(), `vtb-${randomUUID()}.${extension}`);

    await writeFile(filePath, Buffer.from(input.imageBase64, "base64"));

    try {
      const { stdout } = await execFileAsync(
        ["exec", "--model", this.model, "--image", filePath, buildImageExtractionInput()],
        "image extraction"
      );

      return parseTemplateDraft(stdout);
    } finally {
      try {
        await unlink(filePath);
      } catch {
        // Best-effort cleanup for temp image files.
      }
    }
  }

  async extractPromptToTemplate(input: { prompt: string }) {
    const { stdout } = await execFileAsync(
      ["exec", "--model", this.model, buildPromptExtractionInput(input.prompt)],
      "prompt extraction"
    );

    return parseTemplateDraft(stdout);
  }

  async generateImageFromTemplate(_input: GenerateImageInput) {
    throw new Error("CodexCliProvider does not support image generation");
  }
}
