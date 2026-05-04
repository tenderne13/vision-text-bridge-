"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ProgressState } from "@/components/progress-state";
import { ResultPanel } from "@/components/result-panel";
import { TemplateEditor } from "@/components/template-editor";

type ExtractedDraft = {
  title: string;
  templateText: string;
  slots: Array<{
    key: string;
    label: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }>;
  styleTags: string[];
  negativePrompt: string;
};

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Unable to read file"));
        return;
      }

      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

export default function ImageTemplatePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<ExtractedDraft | null>(null);
  const [templateText, setTemplateText] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [statusText, setStatusText] = useState("上传参考图后抽取模板。");

  async function handleExtract() {
    if (!file) {
      return;
    }

    setActiveStep(1);
    setStatusText("正在识别图片结构");
    const imageBase64 = await fileToBase64(file);
    const response = await fetch("/api/templates/from-image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        imageBase64,
        mimeType: file.type || "image/png"
      })
    });
    const extracted = (await response.json()) as ExtractedDraft;

    setDraft(extracted);
    setTemplateText(extracted.templateText);
    setActiveStep(3);
    setStatusText("抽取完成，可保存并跳转到生成页。");
  }

  async function handleSaveAndContinue() {
    if (!draft) {
      return;
    }

    const timestamp = new Date().toISOString();
    const payload = {
      id: `tpl_${crypto.randomUUID()}`,
      title: draft.title,
      sourceType: "image" as const,
      templateText,
      slots: draft.slots,
      styleTags: draft.styleTags,
      negativePrompt: draft.negativePrompt,
      notes: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      obsidianPath: `Templates/${draft.title}.md`
    };
    const response = await fetch("/api/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const savedTemplate = await response.json();

    router.push(`/generate?templateId=${savedTemplate.id}`);
  }

  return (
    <AppShell>
      <main className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_320px]">
        <div className="space-y-6">
          <TemplateEditor
            title="Image Workspace"
            description="图片生成模板"
            templateText={templateText || "上传图片后会在这里生成可编辑模板。"}
            editable={Boolean(draft)}
            onTemplateTextChange={setTemplateText}
            actionArea={
              draft ? (
                <button
                  type="button"
                  onClick={handleSaveAndContinue}
                  className="rounded-full bg-[#275266] px-5 py-3 text-sm font-medium text-[#f1f7f8]"
                >
                  保存并去生成
                </button>
              ) : null
            }
          >
            <div className="rounded-[1.6rem] border border-black/6 bg-[rgba(255,249,242,0.9)] p-5">
              <label className="block text-sm text-[#6f5748]">
                上传参考图
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 block w-full text-sm text-[#3a281d]"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                onClick={handleExtract}
                disabled={!file}
                className="mt-4 rounded-full bg-[#1f130c] px-5 py-3 text-sm font-medium text-[#fff7ec] disabled:cursor-not-allowed disabled:opacity-60"
              >
                抽取模板
              </button>
            </div>
          </TemplateEditor>
          <ProgressState
            title="抽取进度"
            steps={["正在读取图片", "正在识别结构", "正在提取槽位", "正在整理模板"]}
            activeStep={activeStep}
          />
        </div>
        <ResultPanel
          title="状态侧栏"
          summary={statusText}
          detail={draft ? `已识别 ${draft.slots.length} 个槽位，风格标签 ${draft.styleTags.join(" / ") || "暂无"}。` : "这里会展示上传图片预览、风格标签和负面词建议。"}
        />
      </main>
    </AppShell>
  );
}
