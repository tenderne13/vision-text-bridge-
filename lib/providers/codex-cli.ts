import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, stat, unlink, writeFile } from "node:fs/promises";
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
  timeout: 120000
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
    console.error("[CodexCliProvider] parseTemplateDraft failed", {
      outputLength: stdout.length,
      outputPreview: stdout.slice(0, 400)
    });
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

function execCodex(
  args: string[],
  input: string,
  context: "prompt extraction" | "image extraction"
) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(
      "codex",
      args,
      { stdio: "pipe" }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeoutId = setTimeout(() => {
      child.kill("SIGTERM");
    }, CODEX_EXEC_OPTIONS.timeout);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      reject(new Error(createExecErrorMessage(context, error, stderr)));
    });

    child.on("close", (code, signal) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);

      if (code !== 0) {
        reject(
          new Error(
            createExecErrorMessage(
              context,
              Object.assign(new Error("Codex CLI failed"), {
                code: code ?? undefined,
                signal,
                killed: signal === "SIGTERM"
              }) as NodeJS.ErrnoException,
              stderr
            )
          )
        );
        return;
      }

      resolve({ stdout, stderr });
    });

    child.stdin.write(input);
    child.stdin.end();
  });
}

async function readOutputFile(outputFilePath: string) {
  return readFile(outputFilePath, "utf8");
}

async function getFileState(outputFilePath: string) {
  try {
    const fileStat = await stat(outputFilePath);

    return {
      exists: true,
      size: fileStat.size
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        exists: false,
        size: 0
      };
    }

    throw error;
  }
}

function extractJsonLineFromStderr(stderr: string) {
  const lines = stderr
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];

    if (line.startsWith("{") && line.endsWith("}")) {
      return line;
    }
  }

  return "";
}

async function resolveFinalMessage(outputFilePath: string, stdout: string, stderr: string) {
  try {
    const fileContents = await readOutputFile(outputFilePath);
    console.error("[CodexCliProvider] resolveFinalMessage: using output file", {
      outputFilePath,
      outputLength: fileContents.length
    });
    return fileContents;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      if (stdout.trim()) {
        console.error("[CodexCliProvider] resolveFinalMessage: output file missing, using stdout", {
          outputFilePath,
          stdoutLength: stdout.length,
          stderrLength: stderr.length
        });
        return stdout;
      }

      const stderrJson = extractJsonLineFromStderr(stderr);

      if (stderrJson) {
        console.error("[CodexCliProvider] resolveFinalMessage: output file missing, using stderr json line", {
          outputFilePath,
          stderrLength: stderr.length,
          stderrJsonLength: stderrJson.length
        });
        return stderrJson;
      }
    }

    throw error;
  }
}

export class CodexCliProvider implements AiProvider {
  constructor(private readonly model = "gpt-5.3-codex") {}

  async analyzeImageToTemplate(input: ImageTemplateInput) {
    const extension = getImageExtension(input.mimeType);
    const filePath = join(tmpdir(), `vtb-${randomUUID()}.${extension}`);
    const outputFilePath = join(tmpdir(), `vtb-${randomUUID()}.json`);

    await writeFile(filePath, Buffer.from(input.imageBase64, "base64"));
    await writeFile(outputFilePath, "", "utf8");
    console.error("[CodexCliProvider] analyzeImageToTemplate: prepared files", {
      imageFilePath: filePath,
      outputFilePath,
      mimeType: input.mimeType,
      model: this.model
    });

    try {
      const args = [
        "exec",
        "--ignore-rules",
        "--model",
        this.model,
        "--image",
        filePath,
        "-o",
        outputFilePath,
        "-"
      ];
      const { stdout, stderr } = await execCodex(
        args,
        buildImageExtractionInput(),
        "image extraction"
      );
      const fileState = await getFileState(outputFilePath);
      console.error("[CodexCliProvider] analyzeImageToTemplate: codex exec completed", {
        args,
        stdoutLength: stdout.length,
        stderrLength: stderr.length,
        outputFileExists: fileState.exists,
        outputFileSize: fileState.size
      });

      return parseTemplateDraft(await resolveFinalMessage(outputFilePath, stdout, stderr));
    } finally {
      try {
        await unlink(filePath);
      } catch {
        // Best-effort cleanup for temp image files.
      }

      try {
        await unlink(outputFilePath);
      } catch {
        // Best-effort cleanup for final-message files.
      }
    }
  }

  async extractPromptToTemplate(input: { prompt: string }) {
    const outputFilePath = join(tmpdir(), `vtb-${randomUUID()}.json`);
    await writeFile(outputFilePath, "", "utf8");
    console.error("[CodexCliProvider] extractPromptToTemplate: prepared output file", {
      outputFilePath,
      model: this.model,
      promptLength: input.prompt.length
    });

    try {
      const args = [
        "exec",
        "--ignore-rules",
        "--model",
        this.model,
        "-o",
        outputFilePath,
        "-"
      ];
      const { stdout, stderr } = await execCodex(
        args,
        buildPromptExtractionInput(input.prompt),
        "prompt extraction"
      );
      const fileState = await getFileState(outputFilePath);
      console.error("[CodexCliProvider] extractPromptToTemplate: codex exec completed", {
        args,
        stdoutLength: stdout.length,
        stderrLength: stderr.length,
        outputFileExists: fileState.exists,
        outputFileSize: fileState.size,
        stdoutPreview: stdout.slice(0, 400),
        stderrPreview: stderr.slice(0, 400)
      });

      return parseTemplateDraft(await resolveFinalMessage(outputFilePath, stdout, stderr));
    } finally {
      try {
        await unlink(outputFilePath);
      } catch {
        // Best-effort cleanup for final-message files.
      }
    }
  }

  async generateImageFromTemplate(_input: GenerateImageInput) {
    throw new Error("CodexCliProvider does not support image generation");
  }
}
