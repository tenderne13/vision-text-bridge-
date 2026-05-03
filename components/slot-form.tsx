type SlotFormProps = {
  slots: Array<{
    label: string;
    placeholder: string;
  }>;
};

export function SlotForm({ slots }: SlotFormProps) {
  return (
    <section className="rounded-[1.8rem] border border-black/8 bg-[rgba(255,249,242,0.86)] p-5">
      <h2 className="text-lg font-semibold text-[#1f130c]">槽位表单</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {slots.map((slot) => (
          <label key={slot.label} className="block">
            <span className="text-sm text-[#6f5748]">{slot.label}</span>
            <input
              readOnly
              placeholder={slot.placeholder}
              className="mt-2 w-full rounded-2xl border border-[#d8c5b4] bg-white px-4 py-3 text-sm text-[#1f130c] outline-none"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
