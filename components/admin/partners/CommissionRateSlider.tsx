"use client";

interface CommissionRateSliderProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function CommissionRateSlider({
  value,
  onChange,
  disabled,
}: CommissionRateSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="commission-rate-slider"
          className="text-sm font-semibold text-gray-700"
        >
          Sazba provize
        </label>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-bold tabular-nums">
          {value.toFixed(1)} %
        </span>
      </div>
      <input
        id="commission-rate-slider"
        type="range"
        min="12"
        max="20"
        step="0.5"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-orange-500"
        aria-label="Sazba provize v procentech"
      />
      <div className="flex justify-between text-xs text-gray-500 tabular-nums">
        <span>12 %</span>
        <span>14 %</span>
        <span>16 %</span>
        <span>18 %</span>
        <span>20 %</span>
      </div>
    </div>
  );
}
