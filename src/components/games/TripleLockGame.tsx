import React, { useState } from 'react';
import {
  Lock,
  ShieldAlert,
  Crosshair,
  Trophy,
  Hourglass,
  CheckCircle,
  Flag,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TripleLockResult } from '../../types';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface TripleLockGameProps {
  secondsElapsed: number;
  timeRemaining?: number;
  timeFormatted: string;
  isFinalInput?: boolean;
  onFinish: (result: TripleLockResult) => void;
}

interface UndoHistoryState {
  target: number;
  lockedThrough: number | null;
  resets: number;
  bullMode: boolean;
  bNeed: number;
  bullVisitDarts: Array<25 | 50 | 0>;
  totalVisits: number;
  totalDarts: number;
  lastFeedback: string | null;
}

export const TripleLockGame: React.FC<TripleLockGameProps> = ({
  secondsElapsed,
  timeFormatted,
  isFinalInput = false,
  onFinish,
}) => {
  const [target, setTarget] = useState<number>(20);
  const [lockedThrough, setLockedThrough] = useState<number | null>(null);
  const [resets, setResets] = useState<number>(0);
  const [bullMode, setBullMode] = useState<boolean>(false);
  const [bNeed, setBNeed] = useState<number>(0); // 2 = 2 hits needed in a 3-dart visit (target 1 locked), 3 = 3 hits & 100+ pts in a visit

  // Current 3-dart visit on Bull: array of up to 3 darts (25, 50, or 0 for miss)
  const [bullVisitDarts, setBullVisitDarts] = useState<Array<25 | 50 | 0>>([]);

  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [totalDarts, setTotalDarts] = useState<number>(0);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  // History stack for Undo
  const [historyStack, setHistoryStack] = useState<UndoHistoryState[]>([]);

  const checkpoint = lockedThrough === null ? 20 : Math.max(1, lockedThrough - 1);

  // Calculate stages completed (0 to 21)
  const calculateStages = (isCompleted: boolean = false): number => {
    if (isCompleted) return 21;
    if (bullMode) return 20;
    if (lockedThrough === null) {
      return 20 - target;
    }
    return 20 - target;
  };

  const saveStateForUndo = () => {
    setHistoryStack((prev) => [
      ...prev,
      {
        target,
        lockedThrough,
        resets,
        bullMode,
        bNeed,
        bullVisitDarts: [...bullVisitDarts],
        totalVisits,
        totalDarts,
        lastFeedback,
      },
    ]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    sound.tap();
    const prev = historyStack[historyStack.length - 1];
    setHistoryStack((old) => old.slice(0, -1));

    setTarget(prev.target);
    setLockedThrough(prev.lockedThrough);
    setResets(prev.resets);
    setBullMode(prev.bullMode);
    setBNeed(prev.bNeed);
    setBullVisitDarts(prev.bullVisitDarts);
    setTotalVisits(prev.totalVisits);
    setTotalDarts(prev.totalDarts);
    setLastFeedback(prev.lastFeedback);
  };

  const handleFinishEarlyOrTimeout = (
    isWon: boolean = false,
    overrideBd = bullVisitDarts.length,
    overrideBh = bullVisitDarts.filter((d) => d > 0).length,
    overrideBs = bullVisitDarts.reduce((a, b) => a + b, 0),
    overrideVisits = totalVisits,
    overrideDarts = totalDarts
  ) => {
    const formatElapsed = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const targetDesc = isWon
      ? 'Bullseye (Completed)'
      : bullMode
      ? `Bullseye (${overrideBh}/${bNeed} hits in visit, ${overrideBs} pts)`
      : `Single ${target} (Locked through ${lockedThrough ?? 'None'})`;

    onFinish({
      completed: isWon,
      completionTime: formatElapsed(secondsElapsed),
      secondsElapsed,
      timeRemainingFormatted: timeFormatted,
      targetReached: targetDesc,
      lockedThrough,
      resets,
      bullDarts: overrideBd,
      bullHits: overrideBh,
      bullScore: overrideBs,
      totalVisits: overrideVisits,
      dartsThrown: overrideDarts,
      stagesCompleted: calculateStages(isWon),
    });
  };

  // Regular single target (20 down to 1) 3-dart visit input
  const handleHitsInput = (hits: number) => {
    saveStateForUndo();

    if (hits === 3) {
      sound.lock();
    } else if (hits === 2) {
      sound.hit();
    } else {
      sound.miss();
    }

    storage.recordDartsThrown(3);
    const nextVisits = totalVisits + 1;
    const nextDarts = totalDarts + 3;
    setTotalVisits(nextVisits);
    setTotalDarts(nextDarts);

    let nextLocked = lockedThrough;
    let nextTarget = target;
    let nextBullMode = bullMode;
    let nextBNeed = bNeed;
    let nextResets = resets;

    if (hits === 3) {
      nextLocked = target;
      setLockedThrough(nextLocked);
      if (target === 1) {
        nextBullMode = true;
        nextBNeed = 2; // 3 hits on 1 -> 1 is locked! Need 2 Bull hits in a 3-dart visit
        setBullMode(true);
        setBNeed(2);
        setBullVisitDarts([]);
        setLastFeedback('🎯 Target 1 LOCKED! On Bull: 2 of 3 darts in a visit must hit Bull.');
      } else {
        nextTarget = target - 1;
        setTarget(nextTarget);
        setLastFeedback(`🔒 Target ${target} LOCKED! Advancing to ${nextTarget}.`);
      }
    } else if (hits === 2) {
      if (target === 1) {
        nextBullMode = true;
        nextBNeed = 3; // 2 hits on 1 -> 1 not locked. Need 3 Bull hits & 100+ pts in a 3-dart visit
        setBullMode(true);
        setBNeed(3);
        setBullVisitDarts([]);
        setLastFeedback('⚠️ Target 1 not locked. On Bull: Must hit 3 Bulls & 100+ pts in a single 3-dart visit!');
      } else {
        nextTarget = target - 1;
        setTarget(nextTarget);
        setLastFeedback(`✨ 2 hits on ${target}! Advancing to ${nextTarget} (checkpoint stays ${checkpoint}).`);
      }
    } else {
      // 0 or 1 hit: reset to checkpoint
      nextTarget = checkpoint;
      nextResets = resets + 1;
      setTarget(checkpoint);
      setResets(nextResets);
      setLastFeedback(`❌ ${hits} hits on ${target} — Reset to checkpoint ${checkpoint}!`);
    }

    if (isFinalInput) {
      setTimeout(() => {
        handleFinishEarlyOrTimeout(false, 0, 0, 0, nextVisits, nextDarts);
      }, 100);
    }
  };

  // Bull visit dart entry (25, 50, or 0)
  const handleBullDart = (dartValue: 25 | 50 | 0) => {
    saveStateForUndo();

    if (dartValue > 0) {
      sound.hit();
    } else {
      sound.miss();
    }

    const nextDartsInVisit = [...bullVisitDarts, dartValue];
    const visitHits = nextDartsInVisit.filter((d) => d > 0).length;
    const visitScore = nextDartsInVisit.reduce((a, b) => a + b, 0);

    // Case 1: Target 1 was locked (bNeed === 2) -> need 2 hits in this 3-dart visit
    if (bNeed === 2) {
      // Check if 2 hits already reached in this visit (e.g. after dart 2 or 3)
      if (visitHits >= 2) {
        sound.checkout();
        try {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
        storage.recordDartsThrown(nextDartsInVisit.length);
        const finalVisits = totalVisits + 1;
        const finalDarts = totalDarts + nextDartsInVisit.length;
        setTotalVisits(finalVisits);
        setTotalDarts(finalDarts);
        setBullVisitDarts(nextDartsInVisit);
        handleFinishEarlyOrTimeout(true, nextDartsInVisit.length, visitHits, visitScore, finalVisits, finalDarts);
        return;
      }

      // If all 3 darts thrown in this visit without reaching 2 hits
      if (nextDartsInVisit.length >= 3) {
        sound.miss();
        storage.recordDartsThrown(3);
        const nextVisits = totalVisits + 1;
        const nextDarts = totalDarts + 3;
        setTotalVisits(nextVisits);
        setTotalDarts(nextDarts);
        // Reset visit count for next 3 darts! 1 stays locked permanently
        setBullVisitDarts([]);
        setLastFeedback(`Visit ${nextVisits} ended with ${visitHits}/3 hits. 1 is LOCKED — throw your next 3 darts!`);

        if (isFinalInput) {
          setTimeout(() => {
            handleFinishEarlyOrTimeout(false, 3, visitHits, visitScore, nextVisits, nextDarts);
          }, 100);
        }
        return;
      }

      // 1 or 2 darts thrown so far, waiting for remaining darts in this visit
      setBullVisitDarts(nextDartsInVisit);
      return;
    }

    // Case 2: Target 1 was NOT locked (bNeed === 3) -> need 3 hits and 100+ pts in a single 3-dart visit
    if (bNeed === 3) {
      if (nextDartsInVisit.length >= 3) {
        if (visitHits >= 3 && visitScore >= 100) {
          // WIN!
          sound.checkout();
          try {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          } catch {
            // ignore
          }
          storage.recordDartsThrown(3);
          const finalVisits = totalVisits + 1;
          const finalDarts = totalDarts + 3;
          setTotalVisits(finalVisits);
          setTotalDarts(finalDarts);
          setBullVisitDarts(nextDartsInVisit);
          handleFinishEarlyOrTimeout(true, 3, visitHits, visitScore, finalVisits, finalDarts);
          return;
        } else {
          // FAILED - Reset to checkpoint
          sound.miss();
          storage.recordDartsThrown(3);
          const nextVisits = totalVisits + 1;
          const nextDarts = totalDarts + 3;
          const nextResets = resets + 1;
          setTotalVisits(nextVisits);
          setTotalDarts(nextDarts);
          setResets(nextResets);
          setBullVisitDarts([]);
          setBullMode(false);
          setBNeed(0);
          setTarget(checkpoint);
          setLastFeedback(`Failed Bull requirement (${visitHits}/3 hits, ${visitScore} pts). Reset to ${checkpoint}!`);

          if (isFinalInput) {
            setTimeout(() => {
              handleFinishEarlyOrTimeout(false, 3, visitHits, visitScore, nextVisits, nextDarts);
            }, 100);
          }
          return;
        }
      }

      // Waiting for next dart in visit
      setBullVisitDarts(nextDartsInVisit);
    }
  };

  // Quick 3-dart miss visit on Bull
  const handleBullQuickMissVisit = () => {
    saveStateForUndo();
    sound.miss();
    storage.recordDartsThrown(3);
    const nextVisits = totalVisits + 1;
    const nextDarts = totalDarts + 3;
    setTotalVisits(nextVisits);
    setTotalDarts(nextDarts);
    setBullVisitDarts([]);

    if (bNeed === 2 || lockedThrough === 1) {
      // 1 is locked, stay on Bull and reset visit count
      setLastFeedback(`Visit ${nextVisits} logged (0 hits). 1 is LOCKED — throw next 3 darts!`);
      if (isFinalInput) {
        setTimeout(() => {
          handleFinishEarlyOrTimeout(false, 3, 0, 0, nextVisits, nextDarts);
        }, 100);
      }
    } else {
      // 1 was NOT locked, reset to checkpoint
      const nextResets = resets + 1;
      setResets(nextResets);
      setBullMode(false);
      setBNeed(0);
      setTarget(checkpoint);
      setLastFeedback(`0 hits on Bull — Reset to checkpoint ${checkpoint}!`);
      if (isFinalInput) {
        setTimeout(() => {
          handleFinishEarlyOrTimeout(false, 3, 0, 0, nextVisits, nextDarts);
        }, 100);
      }
    }
  };

  const currentVisitHits = bullVisitDarts.filter((d) => d > 0).length;
  const currentVisitScore = bullVisitDarts.reduce((a, b) => a + b, 0);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 sm:space-y-4 select-none touch-manipulation">
      {/* 20-Minute Countdown Final Visit Banner */}
      {isFinalInput && (
        <div className="bg-amber-950/90 border border-amber-500/80 rounded-2xl p-4 text-center shadow-lg animate-pulse flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-left">
            <Hourglass className="w-6 h-6 text-amber-400 shrink-0 animate-spin" />
            <div>
              <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                ⏱️ 20:00 Countdown Expired
              </h4>
              <p className="text-xs text-amber-200/80">
                Log your final visit below to save your daily progress and locked checkpoint.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleFinishEarlyOrTimeout(false)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-xl shadow-md cursor-pointer shrink-0"
          >
            End Drill Now
          </button>
        </div>
      )}

      {/* Target & Rules Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 text-center shadow-lg relative overflow-hidden">
        {/* Card Header with Undo */}
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-2">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-cyan-400">
            <Lock className="w-3.5 h-3.5" /> 20-Min Triple Lock Drill
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
              title="Undo last action"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <span className="bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700 text-amber-400 font-mono">
              Reset Point: {checkpoint <= 0 ? 'Bull' : checkpoint}
            </span>
          </div>
        </div>

        {/* Current Target Header */}
        <div className="my-3 sm:my-4 flex flex-col items-center justify-center">
          <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">
            {bullMode ? 'FINAL STAGE: BULLSEYE' : 'CURRENT TARGET NUMBER (SINGLE)'}
          </span>
          <div className="my-1 flex items-center gap-3 justify-center">
            {bullMode ? (
              <span className="text-5xl sm:text-7xl font-mono font-black text-rose-500 flex items-center gap-2">
                <Crosshair className="w-10 h-10 sm:w-12 sm:h-12" /> BULL
              </span>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-6xl sm:text-8xl font-mono font-black text-white tracking-tight">
                  {target}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 mt-0.5">
                  Single {target} (Throw 3 darts at {target})
                </span>
              </div>
            )}
          </div>

          {/* Context Notice */}
          <div className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-neutral-300 max-w-md">
            {bullMode ? (
              bNeed === 3 ? (
                <span className="text-amber-400">
                  Target 1 hit 2x: Need <b>3 Bull hits</b> & <b>100+ pts</b> in a single 3-dart visit.
                </span>
              ) : (
                <span className="text-emerald-400">
                  Target 1 LOCKED: Need <b>2 Bull hits in a 3-dart visit</b> (0–1 hits resets visit count only; stays on Bull).
                </span>
              )
            ) : (
              <span>
                • <b>0–1 hits:</b> Reset to {checkpoint} &nbsp;|&nbsp; • <b>2 hits:</b> Advance &nbsp;|&nbsp; • <b>3 hits:</b> <span className="text-emerald-400">LOCK & Advance</span>
              </span>
            )}
          </div>

          {/* Feedback banner */}
          {lastFeedback && (
            <div className="mt-2 text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-lg">
              {lastFeedback}
            </div>
          )}
        </div>

        {/* Visual Lock Ladder 20 down to 1 */}
        <div className="mt-3 pt-3 border-t border-neutral-800">
          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 mb-2">
            <span>Progression Track (20 → 1 → Bull)</span>
            <span>Locked through: <b className="text-emerald-400 font-mono">{lockedThrough ?? 'None'}</b></span>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {Array.from({ length: 20 }, (_, i) => 20 - i).map((num) => {
              const isLocked = lockedThrough !== null && num >= lockedThrough;
              const isCurrent = !bullMode && target === num;
              return (
                <div
                  key={num}
                  className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-cyan-500 text-neutral-950 ring-2 ring-cyan-300 scale-110 shadow-md'
                      : isLocked
                      ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60'
                      : 'bg-neutral-800/70 text-neutral-500 border border-neutral-700/40'
                  }`}
                >
                  {num}
                </div>
              );
            })}
            <div
              className={`px-2 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all ${
                bullMode
                  ? 'bg-rose-600 text-white ring-2 ring-rose-300 scale-110 shadow-md'
                  : 'bg-neutral-800/70 text-neutral-500 border border-neutral-700/40'
              }`}
            >
              Bull
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      {bullMode ? (
        <div className="space-y-2.5">
          {/* Current 3-Dart Visit Box with visual slots */}
          <div className="bg-[#121519] border-2 border-rose-900/70 rounded-2xl p-3.5 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-300 mb-2.5 px-1">
              <span className="flex items-center gap-1.5 text-rose-400 uppercase tracking-wider">
                <Crosshair className="w-4 h-4" /> Current Visit (3 Darts on Bull)
              </span>
              <span className="text-neutral-400 font-mono">
                Hits: <b className="text-white">{currentVisitHits}</b> / {bNeed} {bNeed === 3 ? `(${currentVisitScore} pts)` : ''}
              </span>
            </div>

            {/* 3 Dart Slots */}
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((slotIdx) => {
                const dartVal = bullVisitDarts[slotIdx];
                const isFilled = dartVal !== undefined;
                return (
                  <div
                    key={slotIdx}
                    className={`h-12 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      !isFilled
                        ? 'bg-neutral-900/80 border-neutral-700/50 text-neutral-500 font-mono text-xs'
                        : dartVal === 50
                        ? 'bg-rose-950/80 border-rose-600 text-rose-300 font-black text-sm shadow-sm'
                        : dartVal === 25
                        ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 font-black text-sm shadow-sm'
                        : 'bg-neutral-800 border-neutral-600 text-neutral-400 font-bold text-xs'
                    }`}
                  >
                    <span className="text-[10px] uppercase text-neutral-400 leading-none">
                      Dart {slotIdx + 1}
                    </span>
                    <span className="mt-0.5">
                      {!isFilled ? '—' : dartVal === 0 ? 'Miss' : `${dartVal} pts`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dart Entry Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              id="triple-bull-25"
              onClick={() => handleBullDart(25)}
              className="h-16 sm:h-18 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-black text-lg sm:text-xl shadow-md border border-emerald-500/40 flex flex-col items-center justify-center transition-all cursor-pointer"
            >
              <span>25 Outer</span>
              <span className="text-[11px] text-emerald-200 font-semibold">+1 Hit (25 pts)</span>
            </button>

            <button
              type="button"
              id="triple-bull-50"
              onClick={() => handleBullDart(50)}
              className="h-16 sm:h-18 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-lg sm:text-xl shadow-md border border-rose-400/50 flex flex-col items-center justify-center transition-all cursor-pointer"
            >
              <span>50 BULL</span>
              <span className="text-[11px] text-rose-200 font-semibold">+1 Hit (50 pts)</span>
            </button>

            <button
              type="button"
              id="triple-bull-miss-dart"
              onClick={() => handleBullDart(0)}
              className="h-16 sm:h-18 rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 font-black text-lg sm:text-xl shadow-md border border-neutral-700 flex flex-col items-center justify-center transition-all cursor-pointer"
            >
              <span>Miss (0)</span>
              <span className="text-[11px] text-neutral-400 font-semibold">0 pts</span>
            </button>
          </div>

          {/* Quick 3-dart miss visit button */}
          <button
            type="button"
            id="triple-bull-quick-miss-visit"
            onClick={handleBullQuickMissVisit}
            className="w-full h-11 rounded-xl bg-neutral-850 hover:bg-neutral-800 active:scale-98 text-neutral-300 font-bold text-xs border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>
              {bNeed === 2
                ? 'Missed entire visit (0/3 hits) — Stay on Bull'
                : `Missed visit (0/3 hits) — Reset to checkpoint (${checkpoint})`}
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block px-1">
            Hits on Single {target} this 3-dart visit:
          </span>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              id="triple-hit-0"
              onClick={() => handleHitsInput(0)}
              className="h-16 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 font-black text-lg border border-neutral-700 flex flex-col items-center justify-center transition-all cursor-pointer"
            >
              <span>0 Hits</span>
              <span className="text-[10px] text-neutral-500 font-semibold">Reset to {checkpoint}</span>
            </button>

            <button
              type="button"
              id="triple-hit-1"
              onClick={() => handleHitsInput(1)}
              className="h-16 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 font-black text-lg border border-neutral-700 flex flex-col items-center justify-center transition-all cursor-pointer"
            >
              <span>1 Hit</span>
              <span className="text-[10px] text-neutral-500 font-semibold">Reset to {checkpoint}</span>
            </button>

            <button
              type="button"
              id="triple-hit-2"
              onClick={() => handleHitsInput(2)}
              className="h-16 rounded-xl bg-teal-800 hover:bg-teal-700 active:scale-95 text-white font-black text-lg border border-teal-600/40 flex flex-col items-center justify-center transition-all shadow-sm cursor-pointer"
            >
              <span>2 Hits</span>
              <span className="text-[10px] text-teal-200 font-semibold">Advance Target</span>
            </button>

            <button
              type="button"
              id="triple-hit-3"
              onClick={() => handleHitsInput(3)}
              className="h-16 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-lg border border-emerald-400/40 flex flex-col items-center justify-center transition-all shadow-md cursor-pointer"
            >
              <span>3 LOCK</span>
              <span className="text-[10px] text-emerald-200 font-semibold">Lock & Advance</span>
            </button>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center">
          <div className="bg-neutral-800/60 p-2 sm:p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[9px] sm:text-[10px] font-semibold text-neutral-400 block uppercase">Visits</span>
            <span className="text-base sm:text-xl font-bold text-cyan-400 mt-0.5 block font-mono">{totalVisits}</span>
          </div>

          <div className="bg-neutral-800/60 p-2 sm:p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[9px] sm:text-[10px] font-semibold text-neutral-400 block uppercase">Locked</span>
            <span className="text-base sm:text-xl font-bold text-emerald-400 mt-0.5 block font-mono">{lockedThrough ?? '—'}</span>
          </div>

          <div className="bg-neutral-800/60 p-2 sm:p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[9px] sm:text-[10px] font-semibold text-neutral-400 block uppercase">Resets</span>
            <span className="text-base sm:text-xl font-bold text-rose-400 mt-0.5 block font-mono">{resets}</span>
          </div>

          <div className="bg-neutral-800/60 p-2 sm:p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[9px] sm:text-[10px] font-semibold text-neutral-400 block uppercase">Darts</span>
            <span className="text-base sm:text-xl font-bold text-white mt-0.5 block font-mono">{totalDarts}</span>
          </div>

          <div className="bg-neutral-800/60 p-2 sm:p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[9px] sm:text-[10px] font-semibold text-neutral-400 block uppercase">Time</span>
            <span className="text-base sm:text-xl font-bold text-amber-400 mt-0.5 block font-mono">{timeFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
