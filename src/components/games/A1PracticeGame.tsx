import React, { useState, useEffect, useCallback } from 'react';
import {
  Check,
  X,
  Undo2,
  Trophy,
  Target,
  Sparkles,
  RotateCcw,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { A1PracticeResult } from '../../types';
import { sound } from '../../utils/sound';

export type A1SetMode = '20_11' | '1_10';

interface A1PracticeGameProps {
  initialMode?: A1SetMode;
  isFinalInput?: boolean;
  onFinish: (result: A1PracticeResult) => void;
}

interface ThrowHistoryItem {
  setMode: A1SetMode;
  targetKey: string;
  isHit: boolean;
  prevHits: Record<string, number>;
  prevAttempts: Record<string, number>;
  prevTargetIndex: number;
  prevCompletedSets: number;
  prevAccumulatedStats: Record<string, { attempts: number; hits: number; completed: boolean }>;
}

const SET_20_11 = ['20', '19', '18', '17', '16', '15', '14', '13', '12', '11'] as const;
const SET_1_10 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;

const HITS_TO_CLEAR = 3;

export const A1PracticeGame: React.FC<A1PracticeGameProps> = ({
  initialMode = '20_11',
  isFinalInput = false,
  onFinish,
}) => {
  // Current active set mode: '20_11' or '1_10'
  const [currentMode, setCurrentMode] = useState<A1SetMode>(initialMode);

  // Active target list based on currentMode
  const activeTargetList = currentMode === '20_11' ? SET_20_11 : SET_1_10;

  // Number of full sets cleared during this 10-minute session
  const [completedSetsCount, setCompletedSetsCount] = useState<number>(0);

  // Accumulated stats from previously finished sets
  const [accumulatedStats, setAccumulatedStats] = useState<
    Record<string, { attempts: number; hits: number; completed: boolean }>
  >({});

  // Current active set hits & attempts
  const [hits, setHits] = useState<Record<string, number>>(() =>
    activeTargetList.reduce((acc, t) => ({ ...acc, [t]: 0 }), {})
  );

  const [attempts, setAttempts] = useState<Record<string, number>>(() =>
    activeTargetList.reduce((acc, t) => ({ ...acc, [t]: 0 }), {})
  );

  // Current active target index within activeTargetList (0 to 9)
  const [currentTargetIndex, setCurrentTargetIndex] = useState<number>(0);

  // Undo history stack
  const [history, setHistory] = useState<ThrowHistoryItem[]>([]);

  // Banner notification for auto-mode switch
  const [autoSwitchNotice, setAutoSwitchNotice] = useState<string | null>(null);

  // Time expired modal state
  const [showTimeUpModal, setShowTimeUpModal] = useState<boolean>(false);
  const [hasAcknowledgedTimeUp, setHasAcknowledgedTimeUp] = useState<boolean>(false);

  // Check if timer expired from parent TimerHeader
  useEffect(() => {
    if (isFinalInput && !hasAcknowledgedTimeUp && !showTimeUpModal) {
      setShowTimeUpModal(true);
    }
  }, [isFinalInput, hasAcknowledgedTimeUp, showTimeUpModal]);

  // Derived metrics for current set
  const currentSetClearedCount = activeTargetList.filter((t) => (hits[t] || 0) >= HITS_TO_CLEAR).length;
  const currentSetVisits = activeTargetList.reduce((acc, t) => acc + (attempts[t] || 0), 0);
  const currentSetHits = activeTargetList.reduce((acc, t) => acc + (hits[t] || 0), 0);

  // Cumulative metrics across all played sets in this session
  const previousVisits = Object.values(accumulatedStats).reduce(
    (acc: number, s: { attempts: number; hits: number; completed: boolean }) => acc + s.attempts,
    0
  );
  const previousHits = Object.values(accumulatedStats).reduce(
    (acc: number, s: { attempts: number; hits: number; completed: boolean }) => acc + s.hits,
    0
  );

  const totalVisits = previousVisits + currentSetVisits;
  const totalDarts = totalVisits * 3;
  const successfulVisits = previousHits + currentSetHits;
  const accuracy = totalVisits > 0 ? Math.round((successfulVisits / totalVisits) * 100) : 0;
  const allCurrentSetCompleted = currentSetClearedCount === activeTargetList.length;

  const currentTarget = activeTargetList[currentTargetIndex];

  // Helper to find next uncompleted target index
  const findNextTargetIndex = useCallback(
    (fromIndex: number, currentHits: Record<string, number>, targetList: readonly string[]): number => {
      for (let step = 1; step <= targetList.length; step++) {
        const nextIdx = (fromIndex + step) % targetList.length;
        const nextKey = targetList[nextIdx];
        if ((currentHits[nextKey] || 0) < HITS_TO_CLEAR) {
          return nextIdx;
        }
      }
      return fromIndex;
    },
    []
  );

  // Finalize drill
  const finalizeGame = useCallback(
    (completedStatus: boolean) => {
      const mergedStats: Record<string, { attempts: number; hits: number; completed: boolean }> = {
        ...accumulatedStats,
      };

      activeTargetList.forEach((t) => {
        mergedStats[t] = {
          attempts: (mergedStats[t]?.attempts || 0) + (attempts[t] || 0),
          hits: (mergedStats[t]?.hits || 0) + (hits[t] || 0),
          completed: (hits[t] || 0) >= HITS_TO_CLEAR || !!mergedStats[t]?.completed,
        };
      });

      const totalCleared = Object.values(mergedStats).filter((s) => s.completed).length;

      const res: A1PracticeResult = {
        completed: completedStatus || completedSetsCount > 0,
        targetsCleared: totalCleared,
        totalTargets: 10,
        totalVisits,
        totalDarts,
        successfulVisits,
        accuracy,
        targetStats: mergedStats,
        setsCompleted: completedSetsCount + (allCurrentSetCompleted ? 1 : 0),
        startingSet: initialMode as '20_11' | '1_10',
      };

      onFinish(res);
    },
    [
      accumulatedStats,
      activeTargetList,
      attempts,
      hits,
      completedSetsCount,
      allCurrentSetCompleted,
      totalVisits,
      totalDarts,
      successfulVisits,
      accuracy,
      initialMode,
      onFinish,
    ]
  );

  // Trigger celebration on completing a full set
  const triggerCelebration = useCallback(() => {
    sound.checkout();
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 50,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 50,
        origin: { x: 1 },
      });
    }, 200);
  }, []);

  // Switch to the other set (e.g. 20-11 -> 1-10 or 1-10 -> 20-11)
  const switchSet = useCallback(
    (targetMode: A1SetMode, isAutoRotate: boolean = false) => {
      // Save current set stats into accumulated stats
      setAccumulatedStats((prev) => {
        const next = { ...prev };
        activeTargetList.forEach((t) => {
          next[t] = {
            attempts: (next[t]?.attempts || 0) + (attempts[t] || 0),
            hits: (next[t]?.hits || 0) + (hits[t] || 0),
            completed: (hits[t] || 0) >= HITS_TO_CLEAR || !!next[t]?.completed,
          };
        });
        return next;
      });

      const nextTargetList = targetMode === '20_11' ? SET_20_11 : SET_1_10;
      const initialHits = nextTargetList.reduce((acc, t) => ({ ...acc, [t]: 0 }), {});
      const initialAttempts = nextTargetList.reduce((acc, t) => ({ ...acc, [t]: 0 }), {});

      setCurrentMode(targetMode);
      setHits(initialHits);
      setAttempts(initialAttempts);
      setCurrentTargetIndex(0);

      if (isAutoRotate) {
        const fromLabel = currentMode === '20_11' ? '20–11' : '1–10';
        const toLabel = targetMode === '20_11' ? 'Numbers 20–11' : 'Numbers 1–10';
        setAutoSwitchNotice(`🎉 Set ${fromLabel} Cleared! Auto-switched to ${toLabel} for remaining time!`);
        setTimeout(() => {
          setAutoSwitchNotice(null);
        }, 5000);
      }
    },
    [activeTargetList, attempts, hits, currentMode]
  );

  // Handle Hit action (2 or 3 darts in Large Single Field)
  const handleHit = useCallback(() => {
    const activeTarget = activeTargetList[currentTargetIndex];
    const prevHitCount = hits[activeTarget] || 0;
    const newHitCount = prevHitCount + 1;

    // Save for undo
    setHistory((prev) => [
      ...prev,
      {
        setMode: currentMode,
        targetKey: activeTarget,
        isHit: true,
        prevHits: { ...hits },
        prevAttempts: { ...attempts },
        prevTargetIndex: currentTargetIndex,
        prevCompletedSets: completedSetsCount,
        prevAccumulatedStats: { ...accumulatedStats },
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

    // Check if entire active set is completed (all 10 numbers cleared)
    const newClearedCount = activeTargetList.filter((t) => (updatedHits[t] || 0) >= HITS_TO_CLEAR).length;

    if (newClearedCount === activeTargetList.length) {
      triggerCelebration();
      setCompletedSetsCount((c) => c + 1);

      // Auto-switch to other mode if timer is still running
      if (!isFinalInput) {
        const otherMode: A1SetMode = currentMode === '20_11' ? '1_10' : '20_11';
        setTimeout(() => {
          switchSet(otherMode, true);
        }, 600);
      }
      return;
    }

    // Move to next uncompleted target
    const nextIdx = findNextTargetIndex(currentTargetIndex, updatedHits, activeTargetList);
    setCurrentTargetIndex(nextIdx);
  }, [
    activeTargetList,
    currentTargetIndex,
    hits,
    attempts,
    currentMode,
    completedSetsCount,
    accumulatedStats,
    isFinalInput,
    findNextTargetIndex,
    triggerCelebration,
    switchSet,
  ]);

  // Handle Miss action (less than 2 darts in Large Single Field)
  const handleMiss = useCallback(() => {
    const activeTarget = activeTargetList[currentTargetIndex];

    // Save for undo
    setHistory((prev) => [
      ...prev,
      {
        setMode: currentMode,
        targetKey: activeTarget,
        isHit: false,
        prevHits: { ...hits },
        prevAttempts: { ...attempts },
        prevTargetIndex: currentTargetIndex,
        prevCompletedSets: completedSetsCount,
        prevAccumulatedStats: { ...accumulatedStats },
      },
    ]);

    const updatedAttempts = { ...attempts, [activeTarget]: (attempts[activeTarget] || 0) + 1 };
    setAttempts(updatedAttempts);
    sound.miss();

    // Move to next uncompleted target
    const nextIdx = findNextTargetIndex(currentTargetIndex, hits, activeTargetList);
    setCurrentTargetIndex(nextIdx);
  }, [activeTargetList, currentTargetIndex, currentMode, hits, attempts, completedSetsCount, accumulatedStats, findNextTargetIndex]);

  // Handle Undo action
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const last = history[history.length - 1];
    setCurrentMode(last.setMode);
    setHits(last.prevHits);
    setAttempts(last.prevAttempts);
    setCurrentTargetIndex(last.prevTargetIndex);
    setCompletedSetsCount(last.prevCompletedSets);
    setAccumulatedStats(last.prevAccumulatedStats);
    setHistory((prev) => prev.slice(0, -1));
    sound.tap();
  }, [history]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    <div className="w-full max-w-2xl mx-auto space-y-3.5 select-none pb-4">
      {/* Header Banner & Live Progression */}
      <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl px-4 py-3 shadow-md space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>A1 Practice Routine</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Hit <b className="text-amber-400">2 or 3</b> in large single · <b className="text-emerald-400">3 hits</b> to clear number
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                {currentMode === '20_11' ? '20–11' : '1–10'} Cleared
              </span>
              <span className="text-lg font-mono font-black text-emerald-400">
                {currentSetClearedCount} <span className="text-xs text-neutral-500 font-normal">/ 10</span>
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

        {/* Mode Selector & Auto-Rotation Status */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/80 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-400 font-semibold">Active Set:</span>
            <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  if (currentMode !== '20_11') switchSet('20_11');
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                  currentMode === '20_11'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                20 → 11
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentMode !== '1_10') switchSet('1_10');
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                  currentMode === '1_10'
                    ? 'bg-amber-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                1 → 10
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            {completedSetsCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-emerald-400" /> {completedSetsCount} Set{completedSetsCount > 1 ? 's' : ''} Cleared
              </span>
            )}
            <span className="text-neutral-400 hidden xs:inline">
              Auto-switches on clear
            </span>
          </div>
        </div>
      </div>

      {/* Auto Switch Notification Toast */}
      {autoSwitchNotice && (
        <div className="bg-emerald-950/90 border border-emerald-600/80 rounded-2xl p-3 text-center shadow-lg animate-fadeIn flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-emerald-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{autoSwitchNotice}</span>
        </div>
      )}

      {/* Target Numbers Responsive 10-Grid (5 cols x 2 rows on sm+, 2 cols x 5 rows on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 bg-neutral-950/80 border border-neutral-800/80 rounded-3xl p-3 sm:p-4 shadow-2xl relative overflow-hidden">
        {/* Subtle dartboard radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06)_0,transparent_70%)] pointer-events-none" />

        {activeTargetList.map((targetKey, idx) => {
          const hitCount = hits[targetKey] || 0;
          const attemptCount = attempts[targetKey] || 0;
          const isCleared = hitCount >= HITS_TO_CLEAR;
          const isActive = idx === currentTargetIndex && !allCurrentSetCompleted;

          return (
            <div
              key={targetKey}
              id={`a1-target-card-${targetKey.toLowerCase()}`}
              className={`relative rounded-2xl transition-all duration-200 flex flex-col items-center justify-center p-2.5 sm:p-3 min-h-[86px] sm:min-h-[96px] border ${
                isActive
                  ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-xl shadow-amber-500/25 ring-2 ring-amber-400/50 scale-[1.03] z-10'
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
                      ? 'text-2xl sm:text-3xl text-white drop-shadow-sm'
                      : isCleared
                      ? 'text-xl sm:text-2xl text-emerald-400 line-through opacity-75'
                      : 'text-xl sm:text-2xl text-white'
                  }`}
                >
                  {targetKey}
                </span>

                {/* Target Subtitle / Cleared Badge */}
                {isCleared ? (
                  <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider flex items-center justify-center gap-0.5 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" /> Cleared
                  </span>
                ) : (
                  <span
                    className={`text-[9px] font-bold block mt-0.5 ${
                      isActive ? 'text-amber-100' : 'text-neutral-500'
                    }`}
                  >
                    {attemptCount > 0 ? `${hitCount}/3 (${attemptCount}v)` : '0/3'}
                  </span>
                )}
              </div>

              {/* 3 Progress Segment Slots */}
              <div className="flex items-center justify-center gap-1 w-full max-w-[70px] mt-2">
                {[0, 1, 2].map((slotIdx) => {
                  const isSlotFilled = hitCount > slotIdx;

                  if (isActive) {
                    return (
                      <div
                        key={slotIdx}
                        className={`h-2.5 sm:h-3 flex-1 rounded-xs transition-all duration-150 border ${
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
                        className="h-2.5 sm:h-3 flex-1 rounded-xs bg-emerald-500 border border-emerald-400 shadow-xs"
                      />
                    );
                  }

                  return (
                    <div
                      key={slotIdx}
                      className={`h-2.5 sm:h-3 flex-1 rounded-xs transition-all duration-150 border ${
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
      <div className="text-center py-0.5">
        <span className="text-xs font-semibold text-neutral-400">
          Current Target:{' '}
          <b className="text-amber-400 text-sm font-black uppercase font-mono">
            Large Single {currentTarget}
          </b>{' '}
          · Throw 3 darts
        </span>
      </div>

      {/* Primary Action Buttons: HIT & MISS */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Big Green HIT Button */}
        <button
          type="button"
          id="a1-hit-btn"
          onClick={handleHit}
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
                Great session! You completed <b className="text-emerald-400 font-mono">{completedSetsCount}</b> full set{completedSetsCount !== 1 ? 's' : ''} + <b className="text-amber-400 font-mono">{currentSetClearedCount}</b> targets in the active set with <b className="text-white font-mono">{totalDarts}</b> darts thrown.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => finalizeGame(allCurrentSetCompleted || completedSetsCount > 0)}
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
