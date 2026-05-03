import { AppShell } from "@/components/app-shell";
import { ProgressState } from "@/components/progress-state";
import { ResultPanel } from "@/components/result-panel";
import { TemplateEditor } from "@/components/template-editor";

export default function ImageTemplatePage() {
  return (
    <AppShell>
      <main className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_320px]">
        <div className="space-y-6">
          <TemplateEditor
            title="Image Workspace"
            description="图片生成模板"
            templateText="一张{subject}的棚拍海报，画面使用{style}风格，背景为{background}。"
          />
          <ProgressState
            title="抽取进度"
            steps={["正在读取图片", "正在识别结构", "正在提取槽位", "正在整理模板"]}
            activeStep={1}
          />
        </div>
        <ResultPanel
          title="状态侧栏"
          summary="这里会展示上传图片预览、风格标签和负面词建议。"
          detail="下一阶段会接入图片上传、模板保存和跳转到生成页的快捷动作。"
        />
      </main>
    </AppShell>
  );
}
