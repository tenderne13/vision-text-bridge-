import Image from "next/image";

type ResultPanelProps = {
  title: string;
  summary: string;
  detail: string;
  imageSrc?: string;
  imageAlt?: string;
  metadata?: Array<{ label: string; value: string }>;
};

export function ResultPanel({
  title,
  summary,
  detail,
  imageSrc,
  imageAlt = "结果预览",
  metadata = []
}: ResultPanelProps) {
  return (
    <aside className="rounded-[2rem] border border-[#213844]/10 bg-[linear-gradient(180deg,_rgba(28,45,55,0.94),_rgba(47,67,79,0.9))] p-5 text-[#f8f2e8] shadow-[0_20px_70px_rgba(28,45,55,0.2)]">
      <p className="text-xs uppercase tracking-[0.28em] text-[#b3c7cf]">{title}</p>
      <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={640}
            height={640}
            className="mb-4 aspect-square w-full rounded-[1.2rem] border border-white/10 object-cover"
          />
        ) : null}
        <p className="text-sm text-[#dce7ea]">{summary}</p>
        <p className="mt-4 text-xs leading-6 text-[#9eb2ba]">{detail}</p>
        {metadata.length > 0 ? (
          <dl className="mt-4 space-y-2 text-xs text-[#dce7ea]">
            {metadata.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4">
                <dt className="text-[#9eb2ba]">{item.label}</dt>
                <dd className="text-right">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </aside>
  );
}
