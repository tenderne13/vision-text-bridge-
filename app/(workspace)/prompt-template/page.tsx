"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
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
  sourceType: "prompt";
};

function createTemplatePayload(draft: ExtractedDraft) {
  const timestamp = new Date().toISOString();
  const id = `tpl_${crypto.randomUUID()}`;

  return {
    id,
    title: draft.title,
    sourceType: "prompt" as const,
    templateText: draft.templateText,
    slots: draft.slots,
    styleTags: draft.styleTags,
    negativePrompt: draft.negativePrompt,
    notes: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    obsidianPath: `Templates/${draft.title}.md`
  };
}

export default function PromptTemplatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<ExtractedDraft | null>(null);
  const [templateText, setTemplateText] = useState("");
  const [statusText, setStatusText] = useState("输入原始描述词后抽取模板。");
  const [isBusy, setIsBusy] = useState(false);

  async function handleExtract() {
    setIsBusy(true);
    setStatusText("正在分析模板");

    try {
      const response = await fetch("/api/templates/from-prompt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const extracted = (await response.json()) as ExtractedDraft;

      setDraft(extracted);
      setTemplateText(extracted.templateText);
      setStatusText("模板已抽取，可继续编辑并保存。");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSaveAndContinue() {
    if (!draft) {
      return;
    }

    setIsBusy(true);
    setStatusText("正在保存模板");

    try {
      const payload = createTemplatePayload({
        ...draft,
        templateText
      });
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const savedTemplate = await response.json();

      router.push(`/generate?templateId=${savedTemplate.id}`);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <AppShell>
      <main className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_320px]">
        <TemplateEditor
          title="Prompt Workspace"
          description="描述词生成模板"
          templateText={templateText || "抽取后会在这里展示可复用模板。"}
          editable={Boolean(draft)}
          onTemplateTextChange={setTemplateText}
          actionArea={
            draft ? (
              <button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={isBusy}
                className="rounded-full bg-[#275266] px-5 py-3 text-sm font-medium text-[#f1f7f8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                保存并去生成
              </button>
            ) : null
          }
        >
          <div className="rounded-[1.6rem] border border-black/6 bg-[rgba(255,249,242,0.9)] p-5">
            <label className="block">
              <span className="text-sm text-[#6f5748]">原始描述词</span>
              <textarea
                placeholder="请输入原始描述词"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="mt-2 min-h-36 w-full rounded-[1.2rem] border border-[#d8c5b4] bg-white px-4 py-3 text-base leading-7 text-[#3a281d] outline-none"
              />
            </label>
            <button
              type="button"
              onClick={handleExtract}
              disabled={isBusy || prompt.trim().length === 0}
              className="mt-4 rounded-full bg-[#1f130c] px-5 py-3 text-sm font-medium text-[#fff7ec] disabled:cursor-not-allowed disabled:opacity-60"
            >
              抽取模板
            </button>
          </div>
        </TemplateEditor>
        <ResultPanel
          title="结构分析"
          summary={statusText}
          detail={draft ? `已识别 ${draft.slots.length} 个槽位，可直接保存后进入生成页。` : "右侧会展示风格标签、槽位数量和当前处理状态。"}
          metadata={
            draft
              ? [
                  { label: "模板标题", value: draft.title },
                  { label: "风格标签", value: draft.styleTags.join(" / ") || "暂无" },
                  { label: "负面词", value: draft.negativePrompt || "暂无" }
                ]
              : []
          }
        />
      </main>
    </AppShell>
  );
}
