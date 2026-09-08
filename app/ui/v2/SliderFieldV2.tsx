'use client';

export default function SliderFieldV2({
  label,
  value,
  min,
  max,
  step,
  decimals,
  lowLabel,
  highLabel,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals: number;
  lowLabel: string;
  highLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between">
        <label className="text-[13.5px] font-semibold text-ink">{label}</label>
        <span className="font-mono text-[19px] font-semibold tabular-nums text-accent">
          {value.toFixed(decimals)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line-soft accent-accent"
      />
      <div className="mt-2 flex justify-between text-[11px] text-ink-subtle">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
