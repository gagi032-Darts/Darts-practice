import React from 'react';
import { Delete, CornerDownLeft, X } from 'lucide-react';
import { sound } from '../../utils/sound';

interface KeypadProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  maxScore?: number;
  showPresets?: boolean;
  presets?: number[];
  submitLabel?: string;
  submitDisabled?: boolean;
}

const DEFAULT_PRESETS = [26, 41, 45, 60, 81, 85, 100, 140, 180];

export const Keypad: React.FC<KeypadProps> = ({
  value,
  onChange,
  onSubmit,
  maxScore = 180,
  showPresets = true,
  presets = DEFAULT_PRESETS,
  submitLabel = 'ENTER',
  submitDisabled = false,
}) => {
  const handleDigit = (d: string) => {
    sound.tap();
    const next = value === '0' ? d : value + d;
    const num = parseInt(next, 10);
    if (!isNaN(num) && num <= maxScore) {
      onChange(next);
    }
  };

  const handleBackspace = () => {
    sound.tap();
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    sound.tap();
    onChange('');
  };

  const handlePreset = (p: number) => {
    sound.tap();
    onChange(p.toString());
  };

  return (
    <div className="w-full space-y-1.5 sm:space-y-2 select-none touch-manipulation max-w-sm mx-auto">
      {/* Quick Score Preset Chips (Single compact scrollable/wrapped row) */}
      {showPresets && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none justify-start sm:justify-center">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              id={`preset-btn-${p}`}
              onClick={() => handlePreset(p)}
              className="px-2 py-1 text-[11px] sm:text-xs font-mono font-bold shrink-0 rounded-lg bg-neutral-850 hover:bg-neutral-750 active:bg-neutral-700 active:scale-95 text-neutral-300 transition-all border border-neutral-750"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Main Numerical Pad */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            type="button"
            id={`numpad-btn-${digit}`}
            onClick={() => handleDigit(digit.toString())}
            className="h-11 sm:h-12 text-xl sm:text-2xl font-bold font-mono bg-neutral-800 hover:bg-neutral-750 active:bg-neutral-700 active:scale-95 text-white rounded-xl border border-neutral-700/70 shadow-xs flex items-center justify-center transition-all cursor-pointer touch-manipulation"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          id="numpad-btn-clear"
          onClick={handleClear}
          title="Clear"
          className="h-11 sm:h-12 text-xs sm:text-sm font-bold bg-neutral-850 hover:bg-neutral-800 active:bg-neutral-750 active:scale-95 text-rose-300 hover:text-rose-200 rounded-xl border border-neutral-750 flex items-center justify-center gap-1 transition-all cursor-pointer touch-manipulation"
        >
          <X className="w-4 h-4" />
          <span>CLR</span>
        </button>

        <button
          type="button"
          id="numpad-btn-0"
          onClick={() => handleDigit('0')}
          className="h-11 sm:h-12 text-xl sm:text-2xl font-bold font-mono bg-neutral-800 hover:bg-neutral-750 active:bg-neutral-700 active:scale-95 text-white rounded-xl border border-neutral-700/70 shadow-xs flex items-center justify-center transition-all cursor-pointer touch-manipulation"
        >
          0
        </button>

        <button
          type="button"
          id="numpad-btn-backspace"
          onClick={handleBackspace}
          title="Backspace"
          className="h-11 sm:h-12 bg-neutral-850 hover:bg-neutral-800 active:bg-neutral-750 active:scale-95 text-neutral-300 hover:text-white rounded-xl border border-neutral-750 flex items-center justify-center transition-all cursor-pointer touch-manipulation"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>

      {/* Compact Submit Button */}
      <button
        type="button"
        id="numpad-btn-submit"
        disabled={submitDisabled || value.trim() === ''}
        onClick={onSubmit}
        className="w-full h-11 sm:h-12 mt-1 sm:mt-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 text-neutral-950 font-black text-sm sm:text-base tracking-wide rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer touch-manipulation"
      >
        <span>{submitLabel}</span>
        <CornerDownLeft className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
};
