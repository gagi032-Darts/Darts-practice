import React, { useState, useEffect, useCallback } from 'react';
import {
  Check,
  X,
  Undo2,
  Trophy,
  Flag,
  Target,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { A1PracticeResult } from '../../types';
import { sound } from '../../utils/sound';

interface A1PracticeGameProps {
  isFinalInput?: boolean;
  onFinish: (result: A1PracticeResult) => void;
}

interface ThrowHistoryItem {
  targetKey: string;
  isHit: boolean;
  prevHits: Record<string, number>;
  prevAttempts: Record<string, number>;
  prevTargetIndex: number;
}

const TARGET_LIST = ['20', '19', '18', '17', '16', '15', '14', '13', '12'] as const;
type TargetKey = (typeof TARGET_LIST)[number];

const HITS_TO_CLEAR = 3;

export const A1PracticeGame: React.FC<A1PracticeGameProps> = ({
  isFinalInput = false,
  onFinish,
}) => {
  // State: hits per target (0 to 3)
  const [hits, setHits] = useState<Record<string, number>>(() =>
    TARGET_LIST.reduce((acc, t) => ({ ...acc, [t]: 0 }), {})
  );

  // State: attempts per target
  const [attempts, setAttempts] = useState<Record<string, number>>(() =>
    TARGET_LIST.reduce((acc, t) => ({ ...acc, [t]: 0 }), {})
  );

  // Current active target index (0 to 8)
  const [currentTargetIndex, setCurrentTargetIndex] = useState<number>(0);

  // Undo history stack
  const [history, setHistory] = useState<ThrowHistoryItem[]>([]);

  // Time expired modal state
  const [showTimeUpModal, setShowTimeUpModal] = useState<boolean>(false);
  const [hasAcknowledgedTimeUp, setHasAcknowledgedTimeUp] = useState<boolean>(false);

  // Check if timer expired from parent TimerHeader
  useEffect(() => {
    if (isFinalInput && !hasAcknowledgedTimeUp && !showTimeUpModal) {
      setShowTimeUpModal(true);
    }
  }, [isFinalInput, hasAcknowledgedTimeUp, showTimeUpModal]);

  // Derived stats
  const targetsCleared = TARGET_LIST.filter((t) => (hits[t] || 0) >= HITS_TO_CLEAR).length;
  const totalVisits = TARGET_LIST.reduce((acc, t) => acc + (attempts[t] || 0), 0);
  const totalDarts = totalVisits * 3;
  const successfulVisits = TARGET_LIST.reduce((acc, t) => acc + (hits[t] || 0), 0);
  const accuracy = totalVisits > 0 ? Math.round((successfulVisits / totalVisits) * 100) : 0;
  const allCompleted = targetsCleared === TARGET_LIST.length;

  const currentTarget = TARGET_LIST[currentTargetIndex];

  // Helper to find next uncompleted target index
  const findNextTargetIndex = useCallback(
    (fromIndex: number, currentHits: Record<string, number>): number => {
      for (let step = 1; step <= TARGET_LIST.length; step++) {
        const nextIdx = (fromIndex + step) % TARGET_LIST.length;
        const nextKey = TARGET_LIST[nextIdx];
        if ((currentHits[nextKey] || 0) < HITS_TO_CLEAR) {
          return nextIdx;
        }
      }
      return fromIndex; // All completed
    },
    []
  );

  // Finalize drill
  const finalizeGame = useCallback(
    (completedStatus: boolean) => {
      const targetStats: Record<string, { attempts: number; hits: number; completed: boolean }> = {};
      TARGET_LIST.forEach((t) => {
        targetStats[t] = {
          attempts: attempts[t] || 0,
          hits: hits[t] || 0,
          completed: (hits[t] || 0) >= HITS_TO_CLEAR,
        };
      });

      const res: A1PracticeResult = {
        completed: completedStatus,
        targetsCleared,
        totalTargets: TARGET_LIST.length,
        totalVisits,
        totalDarts,
        successfulVisits,
        accuracy,
        targetStats,
      };

      onFinish(res);
    },
    [attempts, hits, targetsCleared, totalVisits, totalDarts, successfulVisits, accuracy, onFinish]
  );

  // Trigger celebration on complete board clear
  const triggerCelebration = useCallback(() => {
    sound.checkout();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 250);
  }, []);

  // Handle Hit action (2 or 3 darts in Large Single Field)
  const handleHit = useCallback(() => {
    if (allCompleted) return;

    const activeTarget = TARGET_LIST[currentTargetIndex];
    const prevHitCount = hits[activeTarget] || 0;
    const newHitCount = prevHitCount + 1;

    // Save for undo
    setHistory((prev) => [
      ...prev,
      {
        targetKey: activeTarget,
        isHit: true,
        prevHits: { ...hits },
        prevAttempts: { ...attempts },
        prevTargetIndex: currentTargetIndex,
      },
    ]);

    const updatedHits = { ...hits, [activeTarget]: newHitCount };
    const updatedAttempts = { ...attempts, [activeTarget]: (attempts[activeTarget] || 0) + 1 };

    setHits(updatedHits);
    setAttempts(updatedAttempts);

    // Audio feedback
    if (newHitCount >= HITS_TO_CLEAR) {
      sound.lock();
    } else {
      sound.hit();
    }

    // Check if entire game is completed (all 9 numbers reached 3 hits)
    const newClearedCount = TARGET_LIST.filter((t) => (updatedHits[t] || 0) >= HITS_TO_CLEAR).length;
    if (newClearedCount === TARGET_LIST.length) {
      triggerCelebration();
      setTimeout(() => {
        const targetStats: Record<string, { attempts: number; hits: number; completed: boolean }> = {};
        TARGET_LIST.forEach((t) => {
          targetStats[t] = {
            attempts: updatedAttempts[t] || 0,
            hits: updatedHits[t] || 0,
            completed: (updatedHits[t] || 0) >= HITS_TO_CLEAR,
          };
        });

        const totalV = TARGET_LIST.reduce((acc, t) => acc + (updatedAttempts[t] || 0), 0);
        const totalD = totalV * 3;
        const succV = TARGET_LIST.reduce((acc, t) => acc + (updatedHits[t] || 0), 0);
        const accRate = totalV > 0 ? Math.round((succV / totalV) * 100) : 0;

        onFinish({
          completed: true,
          targetsCleared: 9,
          totalTargets: 9,
          totalVisits: totalV,
          totalDarts: totalD,
          successfulVisits: succV,
          accuracy: accRate,
          targetStats,
        });
      }, 900);
      return;
    }

    // Move to next uncompleted target
    const nextIdx = findNextTargetIndex(currentTargetIndex, updatedHits);
    setCurrentTargetIndex(nextIdx);
  }, [allCompleted, currentTargetIndex, hits, attempts, findNextTargetIndex, triggerCelebration, onFinish]);

  // Handle Miss action (less than 2 darts in Large Single Field)
  const handleMiss = useCallback(() => {
    if (allCompleted) return;

    const activeTarget = TARGET_LIST[currentTargetIndex];

    // Save for undo
    setHistory((prev) => [
      ...prev,
      {
        targetKey: activeTarget,
        isHit: false,
        prevHits: { ...hits },
        prevAttempts: { ...attempts },
        prevTargetIndex: currentTargetIndex,
      },
    ]);

    const updatedAttempts = { ...attempts, [activeTarget]: (attempts[activeTarget] || 0) + 1 };
    setAttempts(updatedAttempts);
    sound.miss();

    // Move to next uncompleted target
    const nextIdx = findNextTargetIndex(currentTargetIndex, hits);
    setCurrentTargetIndex(nextIdx);
  }, [allCompleted, currentTargetIndex, hits, attempts, findNextTargetIndex]);

  // Handle Undo action
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const last = history[history.length - 1];
    setHits(last.prevHits);
    setAttempts(last.prevAttempts);
    setCurrentTargetIndex(last.prevTargetIndex);
    setHistory((prev) => prev.slice(0, -1));
    sound.tap();
  }, [history]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modal is open or modifier keys pressed
      if (showTimeUpModal || e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === '1' || key === 'h' || key === ' ' || key === 'enter') {
        e.preventDefault();
        handleHit();
      } else if (key === '0' || key === '2' || key === 'm') {
        e.preventDefault();
        handleMiss();
      } else if (key === 'u' || key === 'backspace') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHit, handleMiss, handleUndo, showTimeUpModal]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 select-none pb-4">
      {/* Header Banner & Live Progression */}
      <div className="flex items-center justify-between gap-3 bg-neutral-900/90 border border-neutral-800 rounded-2xl px-4 py-3 shadow-md">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>A1 - Practice routine</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Hit <b className="text-amber-400">2 or 3</b> in large single · <b className="text-emerald-400">3 hits</b> to clear each target
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
              Targets Cleared
            </span>
            <span className="text-lg font-mono font-black text-emerald-400">
              {targetsCleared} <span className="text-xs text-neutral-500 font-normal">/ {TARGET_LIST.length}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo last throw (U / Backspace)"
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 disabled:opacity-30 disabled:pointer-events-none text-neutral-300 hover:text-white border border-neutral-700 transition-all cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Numbers 3x3 Grid (Matching user's photo aesthetic) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 bg-neutral-950/80 border border-neutral-800/80 rounded-3xl p-3 sm:p-5 shadow-2xl relative overflow-hidden">
        {/* Subtle dartboard background texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06)_0,transparent_70%)] pointer-events-none" />

        {TARGET_LIST.map((targetKey, idx) => {
          const hitCount = hits[targetKey] || 0;
          const attemptCount = attempts[targetKey] || 0;
          const isCleared = hitCount >= HITS_TO_CLEAR;
          const isActive = idx === currentTargetIndex && !allCompleted;

          return (
            <div
              key={targetKey}
              id={`a1-target-card-${targetKey.toLowerCase()}`}
              className={`relative rounded-2xl transition-all duration-200 flex flex-col items-center justify-center p-3.5 sm:p-4 min-h-[96px] sm:min-h-[110px] border ${
                isActive
                  ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-xl shadow-amber-500/25 ring-3 ring-amber-400/50 scale-[1.03] z-10'
                  : isCleared
                  ? 'bg-neutral-900/60 border-emerald-700/50 text-neutral-400'
                  : 'bg-neutral-900/90 border-neutral-800/90 text-neutral-200 hover:border-neutral-700'
              }`}
            >
              {/* Target Label */}
              <div className="text-center">
                <span
                  className={`font-black font-mono tracking-tight block ${
                    isActive
                      ? 'text-3xl sm:text-4xl text-white drop-shadow-sm'
                      : isCleared
                      ? 'text-2xl sm:text-3xl text-emerald-400 line-through opacity-75'
                      : 'text-2xl sm:text-3xl text-white'
                  }`}
                >
                  {targetKey}
                </span>

                {/* Target Subtitle / Cleared Badge */}
                {isCleared ? (
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center justify-center gap-0.5 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" /> Cleared
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-bold block mt-0.5 ${
                      isActive ? 'text-amber-100' : 'text-neutral-500'
                    }`}
                  >
                    {attemptCount > 0 ? `${hitCount}/3 (${attemptCount}v)` : '0/3'}
                  </span>
                )}
              </div>

              {/* 3 Progress Segment Slots */}
              <div className="flex items-center justify-center gap-1.5 w-full max-w-[90px] mt-2.5">
                {[0, 1, 2].map((slotIdx) => {
                  const isSlotFilled = hitCount > slotIdx;

                  if (isActive) {
                    return (
                      <div
                        key={slotIdx}
                        className={`h-3.5 sm:h-4 flex-1 rounded-sm transition-all duration-150 border ${
                          isSlotFilled
                            ? 'bg-amber-100 border-white shadow-xs'
                            : 'bg-amber-700/60 border-amber-600/70'
                        }`}
                      />
                    );
                  }

                  if (isCleared) {
                    return (
                      <div
                        key={slotIdx}
                        className="h-3 sm:h-3.5 flex-1 rounded-sm bg-emerald-500 border border-emerald-400 shadow-xs"
                      />
                    );
                  }

                  return (
                    <div
                      key={slotIdx}
                      className={`h-3 sm:h-3.5 flex-1 rounded-sm transition-all duration-150 border ${
                        isSlotFilled
                          ? 'bg-neutral-300 border-neutral-200'
                          : 'bg-neutral-800/80 border-neutral-700/60'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Target Callout Indicator */}
      <div className="text-center py-1">
        <span className="text-xs font-semibold text-neutral-400">
          Current Target:{' '}
          <b className="text-amber-400 text-sm font-black uppercase font-mono">
            Large Single {currentTarget}
          </b>{' '}
          · Throw 3 darts
        </span>
      </div>

      {/* Primary Action Buttons: HIT & MISS (Matching user's photo aesthetic) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Big Green HIT Button */}
        <button
          type="button"
          id="a1-hit-btn"
          onClick={handleHit}
          disabled={allCompleted}
          className="py-4 sm:py-5 px-3 rounded-2xl bg-[#1f7042] hover:bg-[#23824d] active:bg-[#1a5e37] active:scale-95 text-white font-black text-xl sm:text-2xl tracking-wide border border-emerald-500/40 shadow-xl shadow-emerald-950/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group"
        >
          <div className="flex items-center gap-2">
            <Check className="w-6 h-6 stroke-[3] group-hover:scale-110 transition-transform" />
            <span>HIT</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-200 tracking-normal opacity-90">
            2 or 3 in Single (Key: 1 / H)
          </span>
        </button>

        {/* Big Rust-Red MISS Button */}
        <button
          type="button"
          id="a1-miss-btn"
          onClick={handleMiss}
          disabled={allCompleted}
          className="py-4 sm:py-5 px-3 rounded-2xl bg-[#8b2d18] hover:bg-[#a1341c] active:bg-[#732514] active:scale-95 text-white font-black text-xl sm:text-2xl tracking-wide border border-rose-500/40 shadow-xl shadow-rose-950/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group"
        >
          <div className="flex items-center gap-2">
            <X className="w-6 h-6 stroke-[3] group-hover:scale-110 transition-transform" />
            <span>MISS</span>
          </div>
          <span className="text-[11px] font-bold text-rose-200 tracking-normal opacity-90">
            Less than 2 (Key: 0 / M)
          </span>
        </button>
      </div>

      {/* 10-Minute Timer Expired Popup Modal */}
      {showTimeUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-750 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">10-Minute Time is Up!</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Great effort! You cleared <b className="text-emerald-400 font-mono">{targetsCleared}</b> of 9 target numbers with <b className="text-white font-mono">{totalDarts}</b> darts thrown.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => finalizeGame(allCompleted)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm transition-all shadow-md cursor-pointer"
              >
                Finish & View Scorecard
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTimeUpModal(false);
                  setHasAcknowledgedTimeUp(true);
                }}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 font-bold text-xs border border-neutral-700 transition-all cursor-pointer"
              >
                Continue in Overtime
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
