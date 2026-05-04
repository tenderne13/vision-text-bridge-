import { AppShell } from "@/components/app-shell";
import { getVaultDir } from "@/lib/utils/env";
import { listTemplates } from "@/lib/services/template-repository";

export default async function TemplatesPage() {
  const templates = await listTemplates(getVaultDir());

  return (
    <AppShell>
      <main className="rounded-[2rem] border border-white/60 bg-white/78 p-6 shadow-[0_20px_70px_rgba(54,34,20,0.08)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.28em] text-[#8b6f57]">Template Library</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#1f130c]">模板库</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {templates.length > 0 ? (
            templates.map((template) => (
              <article
                key={template.id}
                className="rounded-[1.4rem] border border-black/6 bg-[rgba(248,243,236,0.95)] p-4"
              >
                <h2 className="text-lg font-semibold text-[#1f130c]">{template.title}</h2>
                <p className="mt-2 text-sm text-[#6f5748]">{template.templateText}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-[#6f5748]">暂无模板。</p>
          )}
        </div>
      </main>
    </AppShell>
  );
}
