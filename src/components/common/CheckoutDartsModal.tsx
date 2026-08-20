import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { sound } from '../../utils/sound';

interface CheckoutDartsModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (dartsUsed: number) => void;
  defaultDarts?: number;
}

export const CheckoutDartsModal: React.FC<CheckoutDartsModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  defaultDarts = 3,
}) => {
  const [selectedDarts, setSelectedDarts] = useState<number>(defaultDarts);

  useEffect(() => {
    if (isOpen) {
      setSelectedDarts(defaultDarts);
    }
  }, [isOpen, defaultDarts]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') {
        e.preventDefault();
        sound.tap();
        setSelectedDarts(1);
      } else if (e.key === '2') {
        e.preventDefault();
        sound.tap();
        setSelectedDarts(2);
      } else if (e.key === '3') {
        e.preventDefault();
        sound.tap();
        setSelectedDarts(3);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        sound.tap();
        onConfirm(selectedDarts);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        sound.tap();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedDarts, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#121417] border border-emerald-500/70 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4">
        {/* Question Header */}
        <div className="px-1 pt-1">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight text-left">
            How many darts did you used to checkout?
          </h3>
        </div>

        {/* 3 Tall Vertical Radio Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((num) => {
            const isSelected = selectedDarts === num;
            return (
              <button
                key={num}
                type="button"
                id={`checkout-darts-${num}`}
                onClick={() => {
                  sound.tap();
                  setSelectedDarts(num);
                }}
                className={`h-40 sm:h-48 rounded-2xl border transition-all flex flex-col items-center justify-between p-4 cursor-pointer active:scale-95 select-none ${
                  isSelected
                    ? 'bg-[#1b2220] border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-[#1a1d21] border-[#2c3238] hover:border-[#3d454e] text-neutral-300'
                }`}
              >
                {/* Radio Indicator */}
                <div className="pt-2">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-950/40'
                        : 'border-neutral-500 bg-transparent'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                </div>

                {/* Big Number Label */}
                <div className="pb-4">
                  <span
                    className={`text-3xl sm:text-4xl font-bold font-mono block ${
                      isSelected ? 'text-white' : 'text-neutral-300'
                    }`}
                  >
                    {num}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Cancel and OK */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            id="checkout-dialog-cancel"
            onClick={() => {
              sound.tap();
              onCancel();
            }}
            className="h-14 sm:h-16 rounded-2xl bg-[#2e1d21] hover:bg-[#3d242a] active:bg-[#251619] active:scale-95 text-white font-black text-base border border-[#522932] flex items-center justify-center transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            id="checkout-dialog-ok"
            onClick={() => {
              sound.tap();
              onConfirm(selectedDarts);
            }}
            className="h-14 sm:h-16 rounded-2xl bg-[#43a047] hover:bg-[#4caf50] active:bg-[#388e3c] active:scale-95 text-white font-black text-base shadow-lg flex items-center justify-center transition-all cursor-pointer border border-[#66bb6a]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
