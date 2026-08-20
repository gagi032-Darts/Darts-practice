import React, { useState } from 'react';
import { Lock, ShieldAlert, Crosshair, Trophy, Hourglass, CheckCircle, Flag } from 'lucide-react';
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
  const [bNeed, setBNeed] = useState<number>(0);
  const [bullDarts, setBullDarts] = useState<number>(0);
  const [bullHits, setBullHits] = useState<number>(0);
  const [bullScore, setBullScore] = useState<number>(0);
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [totalDarts, setTotalDarts] = useState<number>(0);

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

  const handleFinishEarlyOrTimeout = (isWon: boolean = false, overrideBd = bullDarts, overrideBh = bullHits, overrideBs = bullScore) => {
    const formatElapsed = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const targetDesc = isWon
      ? 'Bullseye (Completed)'
      : bullMode
      ? `Bullseye (${overrideBh}/${bNeed} hits, ${overrideBs} pts)`
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
      totalVisits,
      dartsThrown: totalDarts,
      stagesCompleted: calculateStages(isWon),
    });
  };

  const handleHitsInput = (hits: number) => {
    if (hits === 3) {
      sound.lock();
    } else if (hits === 2) {
      sound.hit();
    } else {
      sound.miss();
    }
    storage.recordDartsThrown(3);
    setTotalVisits((prev) => prev + 1);
    setTotalDarts((prev) => prev + 3);

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
        nextBNeed = 2; // 3 hits on 1 -> need 2 Bull hits
        setBullMode(true);
        setBNeed(2);
      } else {
        nextTarget = target - 1;
        setTarget(nextTarget);
      }
    } else if (hits === 2) {
      if (target === 1) {
        nextBullMode = true;
        nextBNeed = 3; // 2 hits on 1 -> need 3 Bull hits AND 100+ score
        setBullMode(true);
        setBNeed(3);
      } else {
        nextTarget = target - 1;
        setTarget(nextTarget);
      }
    } else {
      // 0 or 1 hit: reset to checkpoint
      nextTarget = checkpoint;
      nextResets = resets + 1;
      setTarget(checkpoint);
      setResets(nextResets);
    }

    // If this was the final visit at the 20-minute countdown mark
    if (isFinalInput) {
      setTimeout(() => {
        handleFinishEarlyOrTimeout(false);
      }, 100);
    }
  };

  const handleBullHit = (val: 25 | 50) => {
    sound.hit();
    storage.recordDartsThrown(1);
    const nextBd = bullDarts + 1;
    const nextBh = bullHits + 1;
    const nextBs = bullScore + val;
    setTotalDarts((prev) => prev + 1);

    setBullDarts(nextBd);
    setBullHits(nextBh);
    setBullScore(nextBs);

    const isDone = bNeed === 2 ? nextBh >= 2 : nextBh >= 3 && nextBs >= 100;

    if (isDone) {
      sound.checkout();
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
      handleFinishEarlyOrTimeout(true, nextBd, nextBh, nextBs);
    } else if (isFinalInput) {
      // Time is up on bull visit
      setTimeout(() => {
        handleFinishEarlyOrTimeout(false, nextBd, nextBh, nextBs);
      }, 100);
    }
  };

  const handleBullMissOrReset = () => {
    sound.miss();
    setTarget(checkpoint);
    setBullMode(false);
    setBNeed(0);
    setBullDarts(0);
    setBullHits(0);
    setBullScore(0);
    setResets((prev) => prev + 1);

    if (isFinalInput) {
      setTimeout(() => {
        handleFinishEarlyOrTimeout(false);
      }, 100);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 select-none touch-manipulation">
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-2">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-cyan-400">
            <Lock className="w-3.5 h-3.5" /> 20-Min Triple Lock Drill
          </span>
          <span className="bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700 text-amber-400 font-mono">
            Reset Point: {checkpoint <= 0 ? 'Bull' : checkpoint}
          </span>
        </div>

        {/* Current Target Header */}
        <div className="my-5 flex flex-col items-center justify-center">
          <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">
            {bullMode ? 'FINAL BOSS: BULLSEYE' : 'CURRENT TARGET NUMBER (SINGLE)'}
          </span>
          <div className="my-1 flex items-center gap-3 justify-center">
            {bullMode ? (
              <span className="text-6xl sm:text-7xl font-mono font-black text-rose-500 flex items-center gap-2">
                <Crosshair className="w-12 h-12" /> BULL
              </span>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-7xl sm:text-8xl font-mono font-black text-white tracking-tight">
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
                  Target 1 hit 2x: Need <b>3 Bull hits</b> AND <b>100+ total pts</b> (Current: {bullHits}/3 hits, {bullScore}/100 pts).
                </span>
              ) : (
                <span className="text-emerald-400">
                  Target 1 hit 3x (Locked): Need <b>any 2 Bull hits</b> (Current: {bullHits}/2 hits).
                </span>
              )
            ) : (
              <span>
                • <b>0–1 hits:</b> Reset to {checkpoint} &nbsp;|&nbsp; • <b>2 hits:</b> Advance &nbsp;|&nbsp; • <b>3 hits:</b> <span className="text-emerald-400">LOCK & Advance</span>
              </span>
            )}
          </div>
        </div>

        {/* Visual Lock Ladder 20 down to 1 */}
        <div className="mt-4 pt-3 border-t border-neutral-800">
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
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              id="triple-bull-25"
              onClick={() => handleBullHit(25)}
              className="h-20 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-black text-2xl shadow-lg border border-emerald-500/40 flex flex-col items-center justify-center transition-all cursor-pointer"
            >
              <span>25 (Outer)</span>
              <span className="text-xs text-emerald-200 font-semibold">+25 pts</span>
            </button>

            <button
              type="button"
              id="triple-bull-50"
              onClick={() => handleBullHit(50)}
              className="h-20 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-2xl shadow-lg border border-rose-400/50 flex flex-col items-center justify-center transition-all cursor-pointer"
            >
              <span>50 (BULL)</span>
              <span className="text-xs text-rose-200 font-semibold">+50 pts</span>
            </button>
          </div>

          <button
            type="button"
            id="triple-bull-miss"
            onClick={handleBullMissOrReset}
            className="w-full h-12 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 active:scale-98 text-rose-200 font-bold text-sm border border-rose-800/60 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Missed / Reset to checkpoint ({checkpoint})</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block px-1">
            Hits on Single {target} this visit:
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Locked Through</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 block font-mono">{lockedThrough ?? '—'}</span>
          </div>

          <div className="bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Resets</span>
            <span className="text-lg sm:text-xl font-bold text-rose-400 mt-0.5 block font-mono">{resets}</span>
          </div>

          <div className="bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Total Darts</span>
            <span className="text-lg sm:text-xl font-bold text-white mt-0.5 block font-mono">{totalDarts}</span>
          </div>

          <div className="bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Countdown</span>
            <span className="text-lg sm:text-xl font-bold text-cyan-400 mt-0.5 block font-mono">{timeFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
