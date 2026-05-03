"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ProgressState } from "@/components/progress-state";
import { ResultPanel } from "@/components/result-panel";
import { SidebarTemplateList } from "@/components/sidebar-template-list";
import { SlotForm } from "@/components/slot-form";

type Template = {
  id: string;
  title: string;
  sourceType: "image" | "prompt";
  templateText: string;
  slots: Array<{
    key: string;
    label: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }>;
  negativePrompt: string;
};

type GenerationResponse = {
  generation: {
    id: string;
    finalPrompt: string;
    topic: string;
    outputImages: string[];
  };
  images: Array<{
    dataUri: string;
  }>;
};

const stages = [
  "正在分析模板",
  "正在拼接提示词",
  "正在请求生成",
  "正在等待出图",
  "正在归档到 Obsidian"
];

function GenerateWorkspacePage() {
  const searchParams = useSearchParams();
  const templateId = searchParams?.get("templateId") ?? null;
  const [templates, setTemplates] = useState<Template[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [slotValues, setSlotValues] = useState<Record<string, string>>({});
  const [activeStage, setActiveStage] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState("请选择模板并填写槽位。");
  const [resultImage, setResultImage] = useState("");
  const [resultSummary, setResultSummary] = useState("当前结果区会展示本次生成的大图、最近历史和归档状态。");
  const [archiveInfo, setArchiveInfo] = useState("下一阶段会接入真实生成结果、失败重试和 Obsidian 写入状态。");

  useEffect(() => {
    async function loadTemplates() {
      const listResponse = await fetch("/api/templates");
      const list = (await listResponse.json()) as Template[];
      setTemplates(list);

      if (templateId) {
        const detailResponse = await fetch(`/api/templates/${templateId}`);
        const detail = (await detailResponse.json()) as Template;
        setTemplate(detail);
        setSlotValues(
          Object.fromEntries(
            detail.slots.map((slot) => [slot.key, slot.defaultValue ?? ""])
          )
        );
        setFinalPrompt(detail.templateText);
        return;
      }

      if (list.length > 0) {
        setTemplate(list[0]);
      }
    }

    void loadTemplates();
  }, [templateId]);

  useEffect(() => {
    if (!template) {
      return;
    }

    setSlotValues(
      Object.fromEntries(template.slots.map((slot) => [slot.key, slot.defaultValue ?? ""]))
    );
    setFinalPrompt(template.templateText);
  }, [template]);

  async function handleGenerate() {
    if (!template) {
      return;
    }

    setIsBusy(true);
    setActiveStage(2);

    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          templateId: template.id,
          slotValues,
          topic: template.title
        })
      });
      const result = (await response.json()) as GenerationResponse;

      setActiveStage(4);
      setFinalPrompt(result.generation.finalPrompt);
      setResultImage(result.images[0]?.dataUri ?? "");
      setResultSummary("生成成功，结果已显示在右侧。");
      setArchiveInfo(`已归档到 ${result.generation.topic}，共写入 ${result.generation.outputImages.length} 个资产路径。`);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <AppShell>
      <main className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <SidebarTemplateList
          title="模板列表"
          items={templates.map((item) => ({
            name: item.title,
            meta: item.sourceType === "prompt" ? "描述词模板" : "图片模板"
          }))}
        />
        <section className="space-y-6 rounded-[2rem] border border-white/60 bg-white/78 p-6 shadow-[0_20px_70px_rgba(54,34,20,0.08)] backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#8b6f57]">Generation Workspace</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#1f130c]">模板生成图片</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f5748]">
              选择模板，填写槽位，实时预览最终提示词，并在出图后归档本轮结果。
            </p>
          </div>
          <SlotForm
            slots={(template?.slots ?? []).map((slot) => ({
              key: slot.key,
              label: slot.label,
              placeholder: slot.description || slot.label,
              required: slot.required
            }))}
            values={slotValues}
            onChange={(key, value) =>
              setSlotValues((current) => ({
                ...current,
                [key]: value
              }))
            }
            submitLabel="开始生成"
            onSubmit={handleGenerate}
            disabled={isBusy || !template}
          />
          <section className="rounded-[1.8rem] border border-[#24211d] bg-[#1f1712] p-5 text-[#f8f1e8]">
            <h2 className="text-lg font-semibold">最终提示词预览</h2>
            <p className="mt-4 text-sm leading-7 text-[#e5d9cb]">{finalPrompt}</p>
          </section>
          <ProgressState title="生成进度" steps={stages} activeStep={activeStage} />
        </section>
        <ResultPanel
          title="结果展示"
          summary={resultSummary}
          detail={archiveInfo}
          imageSrc={resultImage}
          imageAlt="生成结果"
          metadata={template ? [{ label: "当前模板", value: template.title }] : []}
        />
      </main>
    </AppShell>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <main className="rounded-[2rem] border border-white/60 bg-white/78 p-6 shadow-[0_20px_70px_rgba(54,34,20,0.08)] backdrop-blur">
            正在加载生成工作区...
          </main>
        </AppShell>
      }
    >
      <GenerateWorkspacePage />
    </Suspense>
  );
}
