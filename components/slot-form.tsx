type SlotFormProps = {
  slots: Array<{
    key: string;
    label: string;
    placeholder: string;
    required?: boolean;
  }>;
  values?: Record<string, string>;
  onChange?: (key: string, value: string) => void;
  submitLabel?: string;
  onSubmit?: () => void;
  disabled?: boolean;
};

export function SlotForm({
  slots,
  values = {},
  onChange,
  submitLabel,
  onSubmit,
  disabled = false
}: SlotFormProps) {
  return (
    <section className="rounded-[1.8rem] border border-black/8 bg-[rgba(255,249,242,0.86)] p-5">
      <h2 className="text-lg font-semibold text-[#1f130c]">槽位表单</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {slots.map((slot) => (
          <label key={slot.label} className="block">
            <span className="text-sm text-[#6f5748]">
              {slot.label}
              {slot.required ? " *" : ""}
            </span>
            <input
              aria-label={slot.label}
              placeholder={slot.placeholder}
              value={values[slot.key] ?? ""}
              onChange={(event) => onChange?.(slot.key, event.target.value)}
              disabled={disabled}
              className="mt-2 w-full rounded-2xl border border-[#d8c5b4] bg-white px-4 py-3 text-sm text-[#1f130c] outline-none"
            />
          </label>
        ))}
      </div>
      {submitLabel ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="mt-5 rounded-full bg-[#1f130c] px-5 py-3 text-sm font-medium text-[#fff7ec] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitLabel}
        </button>
      ) : null}
    </section>
  );
}
