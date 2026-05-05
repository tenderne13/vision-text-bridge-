import { afterEach, describe, expect, it, vi } from "vitest";

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
      expect.arrayContaining(["exec"]),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("writes and removes a temp file for image extraction", async () => {
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
    expect(unlinkMock).toHaveBeenCalled();
  });
});
