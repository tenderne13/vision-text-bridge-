type ProgressStateProps = {
  title: string;
  steps?: string[];
  activeStep: number;
};

const defaultSteps = [
  "正在分析模板",
  "正在拼接提示词",
  "正在请求生成",
  "正在等待出图",
  "正在归档到 Obsidian"
];

export function ProgressState({
  title,
  steps = defaultSteps,
  activeStep
}: ProgressStateProps) {
  return (
    <section className="rounded-[1.8rem] border border-[#ead5b7] bg-[linear-gradient(135deg,_rgba(255,241,220,0.95),_rgba(248,227,198,0.82))] p-5">
      <h2 className="text-lg font-semibold text-[#6a3f1b]">{title}</h2>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => {
          const isActive = index === activeStep;

          return (
            <li
              key={step}
              className={`rounded-2xl px-4 py-3 text-sm transition ${
                isActive ? "bg-[#6a3f1b] text-[#fff7ec]" : "bg-white/55 text-[#8a6e5b]"
              }`}
            >
              {step}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
