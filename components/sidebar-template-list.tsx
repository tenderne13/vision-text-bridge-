type SidebarTemplateListProps = {
  title: string;
  items: Array<{
    name: string;
    meta: string;
  }>;
};

export function SidebarTemplateList({ title, items }: SidebarTemplateListProps) {
  return (
    <aside className="rounded-[2rem] border border-white/60 bg-white/75 p-5 shadow-[0_18px_60px_rgba(54,34,20,0.08)] backdrop-blur">
      <p className="text-xs uppercase tracking-[0.28em] text-[#8b6f57]">{title}</p>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="rounded-[1.4rem] border border-black/5 bg-[rgba(246,239,230,0.9)] px-4 py-3"
          >
            <p className="text-sm font-medium text-[#1f130c]">{item.name}</p>
            <p className="mt-1 text-xs text-[#7b6554]">{item.meta}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
