import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExecFileException } from "node:child_process";

const { execFileMock, unlinkMock, writeFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
  unlinkMock: vi.fn(),
  writeFileMock: vi.fn()
}));

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
      callback(
        null,
        '{"title":"产品海报","templateText":"一张{subject}海报","slots":[],"styleTags":[],"negativePrompt":""}',
        ""
      );
    });

    const provider = new CodexCliProvider("gpt-5.3-codex");
    const result = await provider.extractPromptToTemplate({ prompt: "一张产品海报" });

    expect(result.title).toBe("产品海报");
    expect(execFileMock).toHaveBeenCalledWith(
      "codex",
      [
        "exec",
        "--model",
        "gpt-5.3-codex",
        expect.stringContaining("一张产品海报")
      ],
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("wraps parse failures with a provider-specific error", async () => {
    execFileMock.mockImplementation((_cmd, _args, _options, callback) => {
      callback(null, "not-json", "");
    });

    const provider = new CodexCliProvider("gpt-5.3-codex");

    await expect(
      provider.extractPromptToTemplate({ prompt: "一张产品海报" })
    ).rejects.toThrow("Codex output was not valid template JSON");
  });

  it("writes and removes a temp file for image extraction", async () => {
    writeFileMock.mockResolvedValue(undefined);
    unlinkMock.mockResolvedValue(undefined);
    execFileMock.mockImplementation((_cmd, _args, _options, callback) => {
      callback(
        null,
        '{"title":"图像模板","templateText":"一张{subject}产品图","slots":[],"styleTags":[],"negativePrompt":""}',
        ""
      );
    });

    const provider = new CodexCliProvider("gpt-5.3-codex");
    await provider.analyzeImageToTemplate({
      imageBase64: Buffer.from("fake-image").toString("base64"),
      mimeType: "image/png"
    });

    expect(writeFileMock).toHaveBeenCalled();
    expect(execFileMock).toHaveBeenCalledWith(
      "codex",
      [
        "exec",
        "--model",
        "gpt-5.3-codex",
        "--image",
        expect.stringMatching(/vtb-.*\.png$/),
        expect.any(String)
      ],
      expect.any(Object),
      expect.any(Function)
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

    expect(writeFileMock).not.toHaveBeenCalled();
    expect(execFileMock).not.toHaveBeenCalled();
  });

  it("cleans up the temp file when codex exec fails", async () => {
    writeFileMock.mockResolvedValue(undefined);
    unlinkMock.mockResolvedValue(undefined);

    const error = Object.assign(new Error("spawn ENOENT"), {
      code: "ENOENT"
    }) as ExecFileException;

    execFileMock.mockImplementation((_cmd, _args, _options, callback) => {
      callback(error, "", "");
    });

    const provider = new CodexCliProvider("gpt-5.3-codex");

    await expect(
      provider.analyzeImageToTemplate({
        imageBase64: Buffer.from("fake-image").toString("base64"),
        mimeType: "image/png"
      })
    ).rejects.toThrow("Codex CLI is not installed or not available on PATH");

    expect(unlinkMock).toHaveBeenCalled();
  });

  it("wraps codex exec failures with stderr context", async () => {
    const error = Object.assign(new Error("Command failed"), {
      code: 1
    }) as ExecFileException;

    execFileMock.mockImplementation((_cmd, _args, _options, callback) => {
      callback(error, "", "bad stderr details");
    });

    const provider = new CodexCliProvider("gpt-5.3-codex");

    await expect(
      provider.extractPromptToTemplate({ prompt: "一张产品海报" })
    ).rejects.toThrow("Codex CLI prompt extraction failed");
    await expect(
      provider.extractPromptToTemplate({ prompt: "一张产品海报" })
    ).rejects.toThrow("bad stderr details");
  });

  it("throws for unsupported image generation", async () => {
    const provider = new CodexCliProvider("gpt-5.3-codex");

    await expect(
      provider.generateImageFromTemplate({ finalPrompt: "一张产品图" })
    ).rejects.toThrow("CodexCliProvider does not support image generation");
  });
});
