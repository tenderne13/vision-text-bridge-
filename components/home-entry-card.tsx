import Link from "next/link";

type HomeEntryCardProps = {
  href: string;
  title: string;
  description: string;
  accent: string;
};

export function HomeEntryCard({
  href,
  title,
  description,
  accent
}: HomeEntryCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[2rem] border border-black/10 bg-[rgba(255,248,238,0.88)] p-6 shadow-[0_20px_60px_rgba(66,39,20,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(66,39,20,0.14)]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-6 top-0 h-1 rounded-full"
        style={{ background: accent }}
      />
      <div className="relative flex min-h-52 flex-col justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#8b6f57]">Workspace</p>
          <h2 className="mt-4 text-2xl font-semibold text-[#1f130c]">{title}</h2>
          <p className="mt-4 max-w-[18rem] text-sm leading-6 text-[#5c4637]">{description}</p>
        </div>
        <div className="mt-10 flex items-center justify-between text-sm text-[#1f130c]">
          <span>进入工作台</span>
          <span className="transition duration-200 group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}
