import { AppShell } from "@/components/app-shell";
import { ResultPanel } from "@/components/result-panel";
import { TemplateEditor } from "@/components/template-editor";

export default function PromptTemplatePage() {
  return (
    <AppShell>
      <main className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_320px]">
        <TemplateEditor
          title="Prompt Workspace"
          description="描述词生成模板"
          templateText="一张{subject}的品牌海报，风格为{style}，场景包含{scene}，镜头语言强调高级质感。"
        />
        <ResultPanel
          title="结构分析"
          summary="右侧将承载风格标签、负面词和可编辑的结构化槽位说明。"
          detail="下一阶段会把 prompt 输入、抽取结果和保存动作接到真实 API。"
        />
      </main>
    </AppShell>
  );
}
