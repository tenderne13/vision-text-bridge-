import { AppShell } from "@/components/app-shell";
import { HomeEntryCard } from "@/components/home-entry-card";

const entries = [
  {
    href: "/image-template",
    title: "图片生成模板",
    description: "上传参考图，抽取可复用的画面结构、风格标签和可替换主体槽位。",
    accent: "linear-gradient(90deg, #d9773a 0%, #f4b56a 100%)"
  },
  {
    href: "/prompt-template",
    title: "描述词生成模板",
    description: "把已有提示词收束为模板文本，整理风格、负面词和变量边界。",
    accent: "linear-gradient(90deg, #275266 0%, #5ca1a6 100%)"
  },
  {
    href: "/generate",
    title: "模板生成图片",
    description: "填写槽位、预览最终提示词，并把本轮结果归档到 Obsidian。",
    accent: "linear-gradient(90deg, #6f4b3e 0%, #b47b52 100%)"
  }
];

export default function HomePage() {
  return (
    <AppShell>
      <main className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="rounded-[2rem] border border-white/55 bg-[rgba(34,23,16,0.82)] p-8 text-[#f7f1e8] shadow-[0_24px_80px_rgba(40,24,14,0.18)]">
          <p className="text-sm uppercase tracking-[0.28em] text-[#d8c5ac]">Capture · Structure · Reuse</p>
          <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
            把一次性的图像灵感，整理成可重复调用的模板资产。
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#eadfce]">
            这个 MVP 聚焦三件事：从图片抽模板、从描述词抽模板、用模板稳定出图。所有模板和生成记录最终都会落进你的
            Obsidian Vault。
          </p>
        </section>
        <section className="grid gap-4">
          {entries.map((entry) => (
            <HomeEntryCard key={entry.href} {...entry} />
          ))}
        </section>
      </main>
    </AppShell>
  );
}
