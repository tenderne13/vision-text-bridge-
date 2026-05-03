type ProgressStateProps = {
  title: string;
  steps: string[];
  activeStep: number;
};

export function ProgressState({ title, steps, activeStep }: ProgressStateProps) {
  return (
    <section className="rounded-[1.8rem] border border-[#ead5b7] bg-[linear-gradient(135deg,_rgba(255,241,220,0.95),_rgba(248,227,198,0.82))] p-5">
      <h2 className="text-lg font-semibold text-[#6a3f1b]">{title}</h2>
      <div className="mt-4 space-y-3">
        {steps.map((step, index) => {
          const isActive = index === activeStep;

          return (
            <div
              key={step}
              className={`rounded-2xl px-4 py-3 text-sm transition ${
                isActive ? "bg-[#6a3f1b] text-[#fff7ec]" : "bg-white/55 text-[#8a6e5b]"
              }`}
            >
              {step}
            </div>
          );
        })}
      </div>
    </section>
  );
}
