import React, { useEffect } from 'react';
import { Crosshair, Lightbulb, Target } from 'lucide-react';
import { sound } from '../../utils/sound';
import { getDetailedCheckout } from '../../utils/checkouts';

interface DartsAtDoubleModalProps {
  isOpen: boolean;
  contextDescription?: string;
  targetScore?: number;
  isCheckedOut?: boolean;
  onSelect: (dartsAtDouble: number) => void;
}

export const DartsAtDoubleModal: React.FC<DartsAtDoubleModalProps> = ({
  isOpen,
  contextDescription,
  targetScore,
  isCheckedOut = false,
  onSelect,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const num = parseInt(e.key, 10);
        sound.tap();
        onSelect(num);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSelect]);

  if (!isOpen) return null;

  const checkoutDetails = targetScore && targetScore >= 2 && targetScore <= 170 ? getDetailedCheckout(targetScore) : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
        {/* Header with Icon */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shadow-md">
            <Crosshair className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">
              How many darts at double?
            </h3>
            {contextDescription ? (
              <p className="text-xs text-neutral-400 mt-1 font-medium">
                {contextDescription}
              </p>
            ) : targetScore ? (
              <p className="text-xs text-neutral-400 mt-1 font-medium">
                {isCheckedOut ? 'Checked out' : 'Visit on'}{' '}
                <b className="text-emerald-400 font-mono text-sm">{targetScore}</b>
              </p>
            ) : null}
          </div>
        </div>

        {/* AI Route Recognition Pill if available */}
        {checkoutDetails && !checkoutDetails.isBogey && (
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-2.5 text-xs text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-emerald-400" /> AI Outshot Route:
              </span>
              <span className="font-mono font-black text-emerald-400 text-xs">
                {checkoutDetails.primaryRoute}
              </span>
            </div>
            {checkoutDetails.aiAdvice && (
              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-tight">
                {checkoutDetails.aiAdvice}
              </p>
            )}
          </div>
        )}

        {/* 4 Large Selection Buttons: 0 | 1 | 2 | 3 */}
        <div className="grid grid-cols-4 gap-2.5">
          {[0, 1, 2, 3].map((num) => (
            <button
              key={num}
              type="button"
              id={`double-popup-btn-${num}`}
              onClick={() => {
                sound.tap();
                onSelect(num);
              }}
              className={`h-16 sm:h-18 rounded-2xl font-black text-2xl border flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-md ${
                num === 0
                  ? 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border-neutral-700'
                  : num === 1
                  ? 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-800/70 hover:border-emerald-500'
                  : num === 2
                  ? 'bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border-emerald-700 hover:border-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg'
              }`}
            >
              <span>{num}</span>
              <span className="text-[10px] font-normal text-neutral-400">
                {num === 1 ? '1 dart' : `${num} darts`}
              </span>
            </button>
          ))}
        </div>

        {/* Keyboard hint */}
        <p className="text-[11px] text-neutral-500 font-medium">
          Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px]">0</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px]">1</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px]">2</kbd>, or <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px]">3</kbd>
        </p>
      </div>
    </div>
  );
};
