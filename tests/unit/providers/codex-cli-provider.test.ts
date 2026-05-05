import { EventEmitter } from "node:events";
import type { ExecFileException } from "node:child_process";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  readFileMock,
  spawnMock,
  unlinkMock,
  writeFileMock
} = vi.hoisted(() => ({
  readFileMock: vi.fn(),
  spawnMock: vi.fn(),
  unlinkMock: vi.fn(),
  writeFileMock: vi.fn()
}));

vi.mock("node:child_process", () => ({
  spawn: spawnMock
}));

vi.mock("node:fs/promises", () => ({
  readFile: readFileMock,
  stat: vi.fn().mockResolvedValue({ size: 128 }),
  unlink: unlinkMock,
  writeFile: writeFileMock
}));

import { CodexCliProvider } from "@/lib/providers/codex-cli";

async function flushAsyncSetup() {
  await Promise.resolve();
  await Promise.resolve();
}

function createSpawnChild() {
  const processEmitter = new EventEmitter();
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  const stdin = {
    write: vi.fn(),
    end: vi.fn()
  };

  return Object.assign(processEmitter, {
    stdout,
    stderr,
    stdin,
    kill: vi.fn()
  });
}

describe("CodexCliProvider", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("parses prompt extraction JSON from the final-message file and writes prompt to stdin", async () => {
    writeFileMock.mockResolvedValue(undefined);
    readFileMock.mockResolvedValue(
      '{"title":"产品海报","templateText":"一张{subject}海报","slots":[],"styleTags":[],"negativePrompt":""}'
    );

    const child = createSpawnChild();
    spawnMock.mockReturnValue(child);

    const provider = new CodexCliProvider("gpt-5.4-codex");
    const resultPromise = provider.extractPromptToTemplate({ prompt: "一张产品海报" });

    await flushAsyncSetup();
    child.emit("close", 0, null);

    const result = await resultPromise;

    expect(result.title).toBe("产品海报");
    expect(spawnMock).toHaveBeenCalledWith(
      "codex",
      [
        "exec",
        "--ignore-rules",
        "--model",
        "gpt-5.4-codex",
        "-o",
        expect.stringMatching(/vtb-.*\.json$/),
        "-"
      ],
      { stdio: "pipe" }
    );
    expect(child.stdin.write).toHaveBeenCalledWith(expect.stringContaining("一张产品海报"));
    expect(child.stdin.end).toHaveBeenCalled();
  });

  it("falls back to stdout when the final-message file is missing", async () => {
    writeFileMock.mockResolvedValue(undefined);
    readFileMock.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));

    const child = createSpawnChild();
    spawnMock.mockReturnValue(child);

    const provider = new CodexCliProvider("gpt-5.3-codex");
    const resultPromise = provider.extractPromptToTemplate({ prompt: "一张产品海报" });

    await flushAsyncSetup();
    child.stdout.emit(
      "data",
      Buffer.from(
        '{"title":"产品海报","templateText":"一张{subject}海报","slots":[],"styleTags":[],"negativePrompt":""}'
      )
    );
    child.emit("close", 0, null);

    const result = await resultPromise;

    expect(result.title).toBe("产品海报");
  });

  it("falls back to the json line in stderr when the final-message file is missing and stdout is empty", async () => {
    writeFileMock.mockResolvedValue(undefined);
    readFileMock.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));

    const child = createSpawnChild();
    spawnMock.mockReturnValue(child);

    const provider = new CodexCliProvider("gpt-5.3-codex");
    const resultPromise = provider.extractPromptToTemplate({ prompt: "一张产品海报" });

    await flushAsyncSetup();
    child.stderr.emit(
      "data",
      Buffer.from(
        'OpenAI Codex transcript\ncodex\n{"title":"产品海报","templateText":"一张{subject}海报","slots":[],"styleTags":[],"negativePrompt":""}\n2026-05-05 tokens used'
      )
    );
    child.emit("close", 0, null);

    const result = await resultPromise;

    expect(result.title).toBe("产品海报");
  });

  it("wraps parse failures with a provider-specific error", async () => {
    writeFileMock.mockResolvedValue(undefined);
    readFileMock.mockResolvedValue("not-json");

    const child = createSpawnChild();
    spawnMock.mockReturnValue(child);

    const provider = new CodexCliProvider("gpt-5.3-codex");
    const resultPromise = provider.extractPromptToTemplate({ prompt: "一张产品海报" });

    await flushAsyncSetup();
    child.emit("close", 0, null);

    await expect(resultPromise).rejects.toThrow("Codex output was not valid template JSON");
  });

  it("writes and removes temp files for image extraction", async () => {
    writeFileMock.mockResolvedValue(undefined);
    readFileMock.mockResolvedValue(
      '{"title":"图像模板","templateText":"一张{subject}产品图","slots":[],"styleTags":[],"negativePrompt":""}'
    );
    unlinkMock.mockResolvedValue(undefined);

    const child = createSpawnChild();
    spawnMock.mockReturnValue(child);

    const provider = new CodexCliProvider("gpt-5.3-codex");
    const resultPromise = provider.analyzeImageToTemplate({
      imageBase64: Buffer.from("fake-image").toString("base64"),
      mimeType: "image/png"
    });

    await flushAsyncSetup();
    child.emit("close", 0, null);

    await resultPromise;

    expect(writeFileMock).toHaveBeenCalledWith(expect.stringMatching(/vtb-.*\.png$/), expect.any(Buffer));
    expect(writeFileMock).toHaveBeenCalledWith(expect.stringMatching(/vtb-.*\.json$/), "", "utf8");
    expect(spawnMock).toHaveBeenCalledWith(
      "codex",
      [
        "exec",
        "--ignore-rules",
        "--model",
        "gpt-5.3-codex",
        "--image",
        expect.stringMatching(/vtb-.*\.png$/),
        "-o",
        expect.stringMatching(/vtb-.*\.json$/),
        "-"
      ],
      { stdio: "pipe" }
    );
    expect(unlinkMock).toHaveBeenCalled();
  });

  it("rejects unsupported image mime types with a clear error", async () => {
    const provider = new CodexCliProvider("gpt-5.3-codex");

    await expect(
      provider.analyzeImageToTemplate({
        imageBase64: Buffer.from("fake-image").toString("base64"),
        mimeType: "image/gif"
      })
    ).rejects.toThrow('Unsupported image MIME type for Codex CLI: "image/gif"');
  });

  it("cleans up the temp file when codex fails to spawn", async () => {
    writeFileMock.mockResolvedValue(undefined);
    unlinkMock.mockResolvedValue(undefined);

    const child = createSpawnChild();
    spawnMock.mockReturnValue(child);

    const provider = new CodexCliProvider("gpt-5.3-codex");
    const resultPromise = provider.analyzeImageToTemplate({
      imageBase64: Buffer.from("fake-image").toString("base64"),
      mimeType: "image/png"
    });

    await flushAsyncSetup();
    child.emit("error", Object.assign(new Error("spawn ENOENT"), {
      code: "ENOENT"
    }) as ExecFileException);

    await expect(resultPromise).rejects.toThrow("Codex CLI is not installed or not available on PATH");
    expect(unlinkMock).toHaveBeenCalled();
  });

  it("wraps codex failures with stderr context", async () => {
    writeFileMock.mockResolvedValue(undefined);

    const child = createSpawnChild();
    spawnMock.mockReturnValue(child);

    const provider = new CodexCliProvider("gpt-5.3-codex");
    const resultPromise = provider.extractPromptToTemplate({ prompt: "一张产品海报" });

    await flushAsyncSetup();
    child.stderr.emit("data", Buffer.from("bad stderr details"));
    child.emit("close", 1, null);

    await expect(resultPromise).rejects.toThrow("Codex CLI prompt extraction failed");
    await expect(resultPromise).rejects.toThrow("bad stderr details");
  });

  it("throws for unsupported image generation", async () => {
    const provider = new CodexCliProvider("gpt-5.3-codex");

    await expect(
      provider.generateImageFromTemplate({ finalPrompt: "一张产品图" })
    ).rejects.toThrow("CodexCliProvider does not support image generation");
  });
});
