type TemplateEditorProps = {
  title: string;
  description: string;
  templateText: string;
};

export function TemplateEditor({
  title,
  description,
  templateText
}: TemplateEditorProps) {
  return (
    <section className="rounded-[2rem] border border-white/60 bg-white/78 p-6 shadow-[0_20px_70px_rgba(54,34,20,0.08)] backdrop-blur">
      <p className="text-xs uppercase tracking-[0.28em] text-[#8b6f57]">{title}</p>
      <h2 className="mt-3 text-2xl font-semibold text-[#1f130c]">{description}</h2>
      <div className="mt-6 rounded-[1.6rem] border border-black/6 bg-[rgba(248,243,236,0.95)] p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-[#8b6f57]">模板草稿</p>
        <p className="mt-4 text-base leading-7 text-[#3a281d]">{templateText}</p>
      </div>
    </section>
  );
}
