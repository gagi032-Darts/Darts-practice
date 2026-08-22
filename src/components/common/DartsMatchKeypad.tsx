import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Undo2, Check, CornerDownLeft } from 'lucide-react';
import { sound } from '../../utils/sound';
import { BOGEY_NUMBERS } from '../../utils/checkouts';

interface DartsMatchKeypadProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (customVal?: number) => void;
  onUndo: () => void;
  canUndo: boolean;
  maxScore?: number;
  remainingScore?: number;
  disabled?: boolean;
}

export const DartsMatchKeypad: React.FC<DartsMatchKeypadProps> = ({
  value,
  onChange,
  onSubmit,
  onUndo,
  canUndo,
  maxScore = 180,
  remainingScore,
  disabled = false,
}) => {
  const [inputMode, setInputMode] = useState<'score' | 'remaining'>('score');

  const isCheckoutPossible =
    remainingScore !== undefined &&
    remainingScore >= 2 &&
    remainingScore <= 170 &&
    !BOGEY_NUMBERS.includes(remainingScore);

  const hasValue = value.trim().length > 0;

  const handleDigit = useCallback(
    (d: string) => {
      if (disabled) return;
      sound.tap();
      const next = value === '0' ? d : value + d;
      const num = parseInt(next, 10);
      const limit = inputMode === 'remaining' && remainingScore !== undefined ? remainingScore : maxScore;
      if (!isNaN(num) && num <= limit) {
        onChange(next);
      }
    },
    [disabled, value, inputMode, remainingScore, maxScore, onChange]
  );

  const handleClear = useCallback(() => {
    if (disabled) return;
    sound.tap();
    onChange('');
  }, [disabled, onChange]);

  // 'no Score' -> bust, missed checkout, or 0 scored (commits 0 points immediately)
  const handleNoScore = useCallback(() => {
    if (disabled) return;
    sound.tap();
    onChange('');
    onSubmit(0);
  }, [disabled, onChange, onSubmit]);

  const handlePreset = useCallback(
    (score: number) => {
      if (disabled) return;
      sound.tap();
      onChange('');
      if (inputMode === 'remaining') {
        setInputMode('score');
      }
      // Directly submit the preset score automatically without requiring Enter
      onSubmit(score);
    },
    [disabled, inputMode, onChange, onSubmit]
  );

  // 'CHECK' / 'REMAINING' button action
  const handleTopRightAction = useCallback(() => {
    if (disabled) return;
    sound.tap();

    if (!hasValue) {
      if (isCheckoutPossible && remainingScore !== undefined) {
        // Direct checkout hit!
        onChange('');
        onSubmit(remainingScore);
      } else {
        // Toggle remaining mode
        setInputMode((prev) => (prev === 'score' ? 'remaining' : 'score'));
      }
      return;
    }

    // Has value typed:
    const enteredNum = parseInt(value, 10);
    if (isNaN(enteredNum)) return;

    if (remainingScore !== undefined) {
      // Interpreted as remaining score
      if (enteredNum === 0 || (isCheckoutPossible && enteredNum === remainingScore)) {
        // Checking out
        onChange('');
        setInputMode('score');
        onSubmit(remainingScore);
      } else if (enteredNum < remainingScore) {
        const scoredPoints = remainingScore - enteredNum;
        onChange('');
        setInputMode('score');
        onSubmit(scoredPoints);
      } else {
        onChange('');
      }
    } else {
      onChange('');
      onSubmit(enteredNum);
    }
  }, [disabled, hasValue, isCheckoutPossible, remainingScore, value, onChange, onSubmit]);

  // 'ENTER' button action (submits typed value as scored visit)
  const handleEnterAction = useCallback(() => {
    if (disabled) return;
    if (!hasValue) return;

    const enteredNum = parseInt(value, 10);
    if (isNaN(enteredNum)) return;

    sound.tap();
    if (inputMode === 'remaining' && remainingScore !== undefined) {
      if (enteredNum === 0) {
        onChange('');
        setInputMode('score');
        onSubmit(remainingScore);
      } else if (enteredNum < remainingScore) {
        const scoredPoints = remainingScore - enteredNum;
        onChange('');
        setInputMode('score');
        onSubmit(scoredPoints);
      } else {
        onChange('');
      }
    } else {
      // Standard score entry
      onChange('');
      onSubmit(enteredNum);
    }
  }, [disabled, hasValue, value, inputMode, remainingScore, onChange, onSubmit]);

  // Global physical keyboard & numpad listener
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is inside a standard HTML text input
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      // Digits: 0-9 and Numpad 0-9
      if (
        (e.key >= '0' && e.key <= '9') ||
        (e.code && e.code.startsWith('Numpad') && e.code.length === 7)
      ) {
        const digitChar = e.key >= '0' && e.key <= '9' ? e.key : e.code.replace('Numpad', '');
        if (digitChar >= '0' && digitChar <= '9') {
          e.preventDefault();
          handleDigit(digitChar);
          return;
        }
      }

      // Enter / NumpadEnter
      if (e.key === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        if (hasValue) {
          handleEnterAction();
        } else {
          if (isCheckoutPossible) {
            handleTopRightAction();
          } else {
            handleNoScore();
          }
        }
        return;
      }

      // Backspace: remove last character
      if (e.key === 'Backspace') {
        e.preventDefault();
        sound.tap();
        onChange(value.slice(0, -1));
        return;
      }

      // Escape / Delete: clear input
      if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
        return;
      }

      // 'c' / 'C' -> Clear (or Check if empty and on checkout)
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (!hasValue && isCheckoutPossible) {
          handleTopRightAction();
        } else {
          handleClear();
        }
        return;
      }

      // 'r' / 'R' -> Remaining Mode / Submit Remaining
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleTopRightAction();
        return;
      }

      // 'n' / 'N' -> no Score (bust/missed double/0)
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNoScore();
        return;
      }

      // 'u' / 'U' or Ctrl+Z -> Undo
      if (e.key === 'u' || e.key === 'U' || ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z'))) {
        if (canUndo) {
          e.preventDefault();
          sound.tap();
          onUndo();
        }
        return;
      }

      // '+' or NumpadAdd -> Quick Checkout trigger
      if (e.key === '+' || e.code === 'NumpadAdd') {
        e.preventDefault();
        handleTopRightAction();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    disabled,
    hasValue,
    isCheckoutPossible,
    value,
    canUndo,
    handleDigit,
    handleEnterAction,
    handleTopRightAction,
    handleNoScore,
    handleClear,
    onChange,
    onUndo,
  ]);

  // Live leaves preview
  const leaves =
    hasValue && remainingScore !== undefined
      ? inputMode === 'remaining'
        ? parseInt(value, 10)
        : remainingScore - parseInt(value, 10)
      : null;

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto space-y-1 select-none touch-manipulation pb-0.5">
      {/* Top Action Bar (Undo | Score Display Box | REMAINING / CHECK Action) */}
      <div className="grid grid-cols-12 gap-1 sm:gap-1.5 items-center">
        {/* Undo Button (Col 1-3) */}
        <button
          type="button"
          id="darts-match-undo-btn"
          disabled={!canUndo || disabled}
          onClick={() => {
            sound.tap();
            onUndo();
          }}
          className="col-span-3 h-8.5 sm:h-10 rounded-xl bg-[#2e1d21] hover:bg-[#3d242a] active:bg-[#251619] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs border border-[#522932] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
        >
          <Undo2 className="w-3 h-3 text-rose-300" />
          <span>Undo</span>
        </button>

        {/* Center Score Input Box (Col 4-8) */}
        <div
          id="darts-match-score-preview"
          className="col-span-5 h-8.5 sm:h-10 rounded-xl bg-[#0c0e11] border-2 border-[#232930] flex flex-col items-center justify-center px-1 text-center relative overflow-hidden shadow-inner"
        >
          {inputMode === 'remaining' && (
            <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-wider leading-none mb-0.5">
              Remaining Mode
            </span>
          )}
          <span className="text-lg sm:text-xl font-mono font-black text-white tracking-wider leading-none">
            {value !== '' ? (
              value
            ) : (
              <span className="text-neutral-600 font-normal text-xs">
                {inputMode === 'score' ? 'Score' : 'Remaining'}
              </span>
            )}
          </span>
          {leaves !== null && (
            <span className="text-[8px] font-mono text-emerald-400 font-bold leading-none mt-0.5">
              {leaves === 0 ? '🎯 CHECKOUT' : leaves < 0 || leaves === 1 ? '⚠️ BUST' : `Leaves: ${leaves}`}
            </span>
          )}
        </div>

        {/* Top-Right Action Button: CHECK (if on checkout or empty) vs REMAINING */}
        <button
          type="button"
          id="darts-match-submit-btn"
          disabled={disabled}
          onClick={handleTopRightAction}
          className={`col-span-4 h-8.5 sm:h-10 rounded-xl font-black text-[11px] sm:text-xs tracking-wide shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
            !hasValue && isCheckoutPossible
              ? 'bg-[#43a047] hover:bg-[#4caf50] text-white border border-[#66bb6a] shadow-emerald-950/40 ring-1 ring-emerald-400/50'
              : hasValue
              ? 'bg-[#1b4332] hover:bg-[#2d6a4f] text-emerald-300 border border-[#40916c]'
              : inputMode === 'remaining'
              ? 'bg-[#1a2d38] hover:bg-[#223b49] text-cyan-300 border border-[#2d5267]'
              : 'bg-[#112a1d] hover:bg-[#163826] text-emerald-400 border border-[#1e5838]'
          }`}
        >
          {!hasValue ? (
            isCheckoutPossible ? (
              <>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>CHECK</span>
              </>
            ) : inputMode === 'remaining' ? (
              <span>SCORE</span>
            ) : (
              <span>REMAINING</span>
            )
          ) : (
            <span>REMAINING</span>
          )}
        </button>
      </div>

      {/* 5-Column Darts Keypad Grid */}
      <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
        {/* Row 1: [26] [1] [2] [3] [60] */}
        <button
          type="button"
          id="keypad-preset-26"
          disabled={disabled}
          onClick={() => handlePreset(26)}
          title="Instant 26 score"
          className="h-9 sm:h-11 text-xs sm:text-sm font-black font-mono bg-[#112a1d] hover:bg-[#163826] active:bg-[#0c2016] active:scale-95 text-emerald-300 hover:text-emerald-200 rounded-xl border border-[#1e5838] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          26
        </button>
        <button
          type="button"
          id="keypad-num-1"
          disabled={disabled}
          onClick={() => handleDigit('1')}
          className="h-9 sm:h-11 text-base sm:text-lg font-black font-mono bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white rounded-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          1
        </button>
        <button
          type="button"
          id="keypad-num-2"
          disabled={disabled}
          onClick={() => handleDigit('2')}
          className="h-9 sm:h-11 text-base sm:text-lg font-black font-mono bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white rounded-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          2
        </button>
        <button
          type="button"
          id="keypad-num-3"
          disabled={disabled}
          onClick={() => handleDigit('3')}
          className="h-9 sm:h-11 text-base sm:text-lg font-black font-mono bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white rounded-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          3
        </button>
        <button
          type="button"
          id="keypad-preset-60"
          disabled={disabled}
          onClick={() => handlePreset(60)}
          title="Instant 60 score"
          className="h-9 sm:h-11 text-xs sm:text-sm font-black font-mono bg-[#112a1d] hover:bg-[#163826] active:bg-[#0c2016] active:scale-95 text-emerald-300 hover:text-emerald-200 rounded-xl border border-[#1e5838] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          60
        </button>

        {/* Row 2: [41] [4] [5] [6] [85] */}
        <button
          type="button"
          id="keypad-preset-41"
          disabled={disabled}
          onClick={() => handlePreset(41)}
          title="Instant 41 score"
          className="h-9 sm:h-11 text-xs sm:text-sm font-black font-mono bg-[#112a1d] hover:bg-[#163826] active:bg-[#0c2016] active:scale-95 text-emerald-300 hover:text-emerald-200 rounded-xl border border-[#1e5838] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          41
        </button>
        <button
          type="button"
          id="keypad-num-4"
          disabled={disabled}
          onClick={() => handleDigit('4')}
          className="h-9 sm:h-11 text-base sm:text-lg font-black font-mono bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white rounded-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          4
        </button>
        <button
          type="button"
          id="keypad-num-5"
          disabled={disabled}
          onClick={() => handleDigit('5')}
          className="h-9 sm:h-11 text-base sm:text-lg font-black font-mono bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white rounded-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          5
        </button>
        <button
          type="button"
          id="keypad-num-6"
          disabled={disabled}
          onClick={() => handleDigit('6')}
          className="h-9 sm:h-11 text-base sm:text-lg font-black font-mono bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white rounded-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          6
        </button>
        <button
          type="button"
          id="keypad-preset-85"
          disabled={disabled}
          onClick={() => handlePreset(85)}
          title="Instant 85 score"
          className="h-9 sm:h-11 text-xs sm:text-sm font-black font-mono bg-[#112a1d] hover:bg-[#163826] active:bg-[#0c2016] active:scale-95 text-emerald-300 hover:text-emerald-200 rounded-xl border border-[#1e5838] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          85
        </button>

        {/* Row 3: [45] [7] [8] [9] [100] */}
        <button
          type="button"
          id="keypad-preset-45"
          disabled={disabled}
          onClick={() => handlePreset(45)}
          title="Instant 45 score"
          className="h-9 sm:h-11 text-xs sm:text-sm font-black font-mono bg-[#112a1d] hover:bg-[#163826] active:bg-[#0c2016] active:scale-95 text-emerald-300 hover:text-emerald-200 rounded-xl border border-[#1e5838] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          45
        </button>
        <button
          type="button"
          id="keypad-num-7"
          disabled={disabled}
          onClick={() => handleDigit('7')}
          className="h-9 sm:h-11 text-base sm:text-lg font-black font-mono bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white rounded-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          7
        </button>
        <button
          type="button"
          id="keypad-num-8"
          disabled={disabled}
          onClick={() => handleDigit('8')}
          className="h-9 sm:h-11 text-base sm:text-lg font-black font-mono bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white rounded-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          8
        </button>
        <button
          type="button"
          id="keypad-num-9"
          disabled={disabled}
          onClick={() => handleDigit('9')}
          className="h-9 sm:h-11 text-base sm:text-lg font-black font-mono bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white rounded-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          9
        </button>
        <button
          type="button"
          id="keypad-preset-100"
          disabled={disabled}
          onClick={() => handlePreset(100)}
          title="Instant 100 score (Ton)"
          className="h-9 sm:h-11 text-xs sm:text-sm font-black font-mono bg-[#112a1d] hover:bg-[#163826] active:bg-[#0c2016] active:scale-95 text-emerald-300 hover:text-emerald-200 rounded-xl border border-[#1e5838] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          100
        </button>

        {/* Row 4: [CLR (spans 2 cols)] [0 (col 3)] [no Score / ENTER (spans 2 cols)] */}
        <button
          type="button"
          id="keypad-btn-clr"
          disabled={disabled}
          onClick={handleClear}
          className="col-span-2 h-9 sm:h-11 text-xs sm:text-sm font-bold bg-[#2e1d21] hover:bg-[#3d242a] active:bg-[#251619] active:scale-95 text-rose-300 hover:text-rose-200 rounded-xl border border-[#522932] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3 h-3" />
          <span>CLR</span>
        </button>

        <button
          type="button"
          id="keypad-num-0"
          disabled={disabled}
          onClick={() => handleDigit('0')}
          className="h-9 sm:h-11 text-base sm:text-lg font-black font-mono bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white rounded-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          0
        </button>

        {/* Interchangeable: 'no Score' when empty, 'ENTER' when score is typed */}
        <button
          type="button"
          id={hasValue ? 'keypad-btn-enter' : 'keypad-btn-noscore'}
          disabled={disabled}
          onClick={hasValue ? handleEnterAction : handleNoScore}
          className={`col-span-2 h-9 sm:h-11 text-xs sm:text-sm font-black rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs ${
            hasValue
              ? 'bg-[#43a047] hover:bg-[#4caf50] active:bg-[#388e3c] text-white border border-[#66bb6a] shadow-emerald-950/40 ring-1 ring-emerald-400/40'
              : 'bg-[#2e1d21] hover:bg-[#3d242a] active:bg-[#251619] text-neutral-200 hover:text-white border border-[#522932]'
          }`}
        >
          {hasValue ? (
            <>
              <CornerDownLeft className="w-3 h-3 stroke-[2.5]" />
              <span>ENTER</span>
            </>
          ) : (
            <span>no Score</span>
          )}
        </button>
      </div>
    </div>
  );
};
