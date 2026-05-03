type ResultPanelProps = {
  title: string;
  summary: string;
  detail: string;
};

export function ResultPanel({ title, summary, detail }: ResultPanelProps) {
  return (
    <aside className="rounded-[2rem] border border-[#213844]/10 bg-[linear-gradient(180deg,_rgba(28,45,55,0.94),_rgba(47,67,79,0.9))] p-5 text-[#f8f2e8] shadow-[0_20px_70px_rgba(28,45,55,0.2)]">
      <p className="text-xs uppercase tracking-[0.28em] text-[#b3c7cf]">{title}</p>
      <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-[#dce7ea]">{summary}</p>
        <p className="mt-4 text-xs leading-6 text-[#9eb2ba]">{detail}</p>
      </div>
    </aside>
  );
}
