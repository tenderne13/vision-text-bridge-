import { AppShell } from "@/components/app-shell";
import { ProgressState } from "@/components/progress-state";
import { ResultPanel } from "@/components/result-panel";
import { SidebarTemplateList } from "@/components/sidebar-template-list";
import { SlotForm } from "@/components/slot-form";

const progressSteps = [
  "正在分析模板",
  "正在拼接提示词",
  "正在请求生成",
  "正在等待出图",
  "正在归档到 Obsidian"
];

export default function GeneratePage() {
  return (
    <AppShell>
      <main className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <SidebarTemplateList
          title="模板列表"
          items={[
            { name: "咖啡产品海报", meta: "产品摄影 · 商业海报" },
            { name: "人物封面图", meta: "时尚人像 · 杂志风格" },
            { name: "极简场景图", meta: "空间陈列 · 高级灰" }
          ]}
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
            slots={[
              { label: "主体", placeholder: "例如：咖啡杯、香水瓶、耳机" },
              { label: "风格", placeholder: "例如：北欧极简、杂志封面、电影感" },
              { label: "场景", placeholder: "例如：浅米色背景台面" },
              { label: "光线", placeholder: "例如：柔和侧逆光" }
            ]}
          />
          <section className="rounded-[1.8rem] border border-[#24211d] bg-[#1f1712] p-5 text-[#f8f1e8]">
            <h2 className="text-lg font-semibold">最终提示词预览</h2>
            <p className="mt-4 text-sm leading-7 text-[#e5d9cb]">
              棚拍产品海报，主体为咖啡杯，背景为浅米色台面，采用北欧极简风格，柔和侧逆光，细节清晰。
            </p>
          </section>
          <ProgressState title="生成进度" steps={progressSteps} activeStep={2} />
        </section>
        <ResultPanel
          title="结果展示"
          summary="当前结果区会展示本次生成的大图、最近历史和归档状态。"
          detail="下一阶段会接入真实生成结果、失败重试和 Obsidian 写入状态。"
        />
      </main>
    </AppShell>
  );
}
