import React from 'react';
import { Delete, CornerDownLeft, X } from 'lucide-react';
import { sound } from '../../utils/sound';

interface KeypadProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onPresetSubmit?: (val: number) => void;
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
  onPresetSubmit,
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
    if (onPresetSubmit) {
      onChange('');
      onPresetSubmit(p);
    } else {
      onChange(p.toString());
      setTimeout(() => onSubmit(), 0);
    }
  };

  return (
    <div className="w-full space-y-1.5 sm:space-y-2 select-none touch-manipulation max-w-sm sm:max-w-md mx-auto pb-1 sm:pb-2">
      {/* Quick Score Preset Chips */}
      {showPresets && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none justify-start sm:justify-center">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              id={`preset-btn-${p}`}
              onClick={() => handlePreset(p)}
              className="px-2.5 py-1.5 text-xs sm:text-sm font-mono font-black shrink-0 rounded-xl bg-[#112a1d] hover:bg-[#163826] active:bg-[#0c2016] active:scale-95 text-emerald-300 transition-all border border-[#1e5838] shadow-xs cursor-pointer"
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
            className="h-11 sm:h-12 md:h-14 min-h-[46px] text-xl sm:text-2xl font-black font-mono bg-neutral-800 hover:bg-neutral-750 active:bg-neutral-700 active:scale-95 text-white rounded-xl border border-neutral-700/70 shadow-xs flex items-center justify-center transition-all cursor-pointer touch-manipulation"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          id="numpad-btn-clear"
          onClick={handleClear}
          title="Clear"
          className="h-11 sm:h-12 md:h-14 min-h-[46px] text-xs sm:text-sm font-bold bg-[#2e1d21] hover:bg-[#3d242a] active:bg-[#251619] active:scale-95 text-rose-300 hover:text-rose-200 rounded-xl border border-[#522932] flex items-center justify-center gap-1 transition-all cursor-pointer touch-manipulation shadow-xs"
        >
          <X className="w-4 h-4" />
          <span>CLR</span>
        </button>

        <button
          type="button"
          id="numpad-btn-0"
          onClick={() => handleDigit('0')}
          className="h-11 sm:h-12 md:h-14 min-h-[46px] text-xl sm:text-2xl font-black font-mono bg-neutral-800 hover:bg-neutral-750 active:bg-neutral-700 active:scale-95 text-white rounded-xl border border-neutral-700/70 shadow-xs flex items-center justify-center transition-all cursor-pointer touch-manipulation"
        >
          0
        </button>

        <button
          type="button"
          id="numpad-btn-backspace"
          onClick={handleBackspace}
          title="Backspace"
          className="h-11 sm:h-12 md:h-14 min-h-[46px] bg-neutral-850 hover:bg-neutral-800 active:bg-neutral-750 active:scale-95 text-neutral-300 hover:text-white rounded-xl border border-neutral-750 flex items-center justify-center transition-all cursor-pointer touch-manipulation shadow-xs"
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
        className="w-full h-11 sm:h-12 md:h-14 min-h-[46px] mt-1 sm:mt-1.5 bg-[#43a047] hover:bg-[#4caf50] active:bg-[#388e3c] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 text-white font-black text-sm sm:text-base tracking-wide rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer touch-manipulation"
      >
        <span>{submitLabel}</span>
        <CornerDownLeft className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
};
