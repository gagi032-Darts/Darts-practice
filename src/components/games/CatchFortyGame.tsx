import React, { useState } from 'react';
import { Zap, Check, X, Lightbulb, Award, Crosshair, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CatchFortyResult } from '../../types';
import { DartsAtDoubleModal } from '../common/DartsAtDoubleModal';
import { getCheckoutRoute } from '../../utils/checkouts';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface CatchFortyGameProps {
  isFinalInput: boolean;
  onFinish: (result: CatchFortyResult) => void;
  onOpenCheckoutAi?: (score: number) => void;
}

interface PendingAttemptState {
  isCheckout: boolean;
  dartsUsed: number;
  target: number;
}

export const CatchFortyGame: React.FC<CatchFortyGameProps> = ({
  isFinalInput,
  onFinish,
  onOpenCheckoutAi,
}) => {
  const [currentTarget, setCurrentTarget] = useState<number>(41);
  const [attempts, setAttempts] = useState<number>(0);
  const [checkouts, setCheckouts] = useState<number>(0);
  const [dartsUsed, setDartsUsed] = useState<number>(2);

  // Double accuracy tracking
  const [totalDartsAtDouble, setTotalDartsAtDouble] = useState<number>(0);
  const [totalDoublesHit, setTotalDoublesHit] = useState<number>(0);

  // Popup state
  const [pendingAttempt, setPendingAttempt] = useState<PendingAttemptState | null>(null);

  const suggestedRoute = getCheckoutRoute(currentTarget);

  const isDoubleStartingScore = (score: number): boolean => {
    return score === 50 || (score <= 48 && score >= 2 && score % 2 === 0);
  };

  const handleCheckoutClick = () => {
    const attemptData: PendingAttemptState = {
      isCheckout: true,
      dartsUsed,
      target: currentTarget,
    };

    // Universal rule: Starting score <= 50 even OR checked out from higher score -> popup!
    // Since this is a checkout, it ALWAYS triggers popup.
    setPendingAttempt(attemptData);
  };

  const handleFailClick = () => {
    const attemptData: PendingAttemptState = {
      isCheckout: false,
      dartsUsed: 6,
      target: currentTarget,
    };

    // Universal rule: If starting score is 50, 48, 46... down to 2 -> automatic popup.
    // Anything else -> no popup.
    if (isDoubleStartingScore(currentTarget)) {
      setPendingAttempt(attemptData);
    } else {
      commitAttempt(attemptData, 0);
    }
  };

  const handleSelectDartsAtDouble = (dartsAtDbl: number) => {
    if (!pendingAttempt) return;
    const data = pendingAttempt;
    setPendingAttempt(null);
    commitAttempt(data, dartsAtDbl);
  };

  const commitAttempt = (data: PendingAttemptState, dartsAtDbl: number) => {
    const nextAttempts = attempts + 1;
    const nextCheckouts = data.isCheckout ? checkouts + 1 : checkouts;
    const nextDartsAtDouble = totalDartsAtDouble + dartsAtDbl;
    const nextDoublesHit = data.isCheckout ? totalDoublesHit + 1 : totalDoublesHit;

    setAttempts(nextAttempts);
    setCheckouts(nextCheckouts);
    setTotalDartsAtDouble(nextDartsAtDouble);
    setTotalDoublesHit(nextDoublesHit);

    if (data.isCheckout) {
      sound.checkout();
      try {
        confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });
      } catch {
        // ignore
      }
    } else {
      sound.miss();
    }

    const nextTarget = data.target + 1;
    setCurrentTarget(nextTarget);
    storage.recordDartsThrown(data.dartsUsed);

    if (isFinalInput || nextTarget > 80) {
      const rate = nextAttempts > 0 ? (nextCheckouts / nextAttempts) * 100 : 0;
      const dblPct = nextDartsAtDouble > 0 ? (nextDoublesHit / nextDartsAtDouble) * 100 : 0;

      onFinish({
        highestReached: nextTarget - 1,
        attempts: nextAttempts,
        checkouts: nextCheckouts,
        checkoutRate: parseFloat(rate.toFixed(1)),
        dartsAtDouble: nextDartsAtDouble,
        doublesHit: nextDoublesHit,
        doublePercentage: parseFloat(dblPct.toFixed(1)),
      });
    }
  };

  const checkoutRate = attempts > 0 ? ((checkouts / attempts) * 100).toFixed(1) : '0.0';
  const doubleRate = totalDartsAtDouble > 0 ? ((totalDoublesHit / totalDartsAtDouble) * 100).toFixed(1) : '—';
  const progressPercent = Math.min(100, Math.max(0, ((currentTarget - 41) / 40) * 100));

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Target Display Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-2">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-amber-400">
            <Zap className="w-3.5 h-3.5" /> Catch 40 (Targets 41–80)
          </span>
          <span className="bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700 text-neutral-300">
            Target #{currentTarget - 40} of 40
          </span>
        </div>

        {/* Big Target */}
        <div className="my-5 flex flex-col items-center justify-center">
          <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">
            TARGET (6 DARTS MAX)
          </span>
          <div className="text-6xl sm:text-7xl font-mono font-black text-white tracking-tight my-1">
            {currentTarget}
          </div>
          {suggestedRoute && (
            <button
              type="button"
              id="catch40-checkout-ai-btn"
              onClick={() => {
                sound.tap();
                if (onOpenCheckoutAi) {
                  onOpenCheckoutAi(currentTarget);
                }
              }}
              title="Open Outshot AI Advisor for this target"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-xs font-bold mt-1 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Route: {suggestedRoute}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold ml-1">
                AI Tip
              </span>
            </button>
          )}
        </div>

        {/* Progress Bar 41 to 80 */}
        <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-neutral-500 font-bold mt-1.5">
          <span>Start (41)</span>
          <span>{Math.round(progressPercent)}% completed</span>
          <span>End (80)</span>
        </div>
      </div>

      {/* Darts Used Selector (1 to 6) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
          If Checked Out: Darts Used (1–6)
        </span>
        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <button
              key={d}
              type="button"
              id={`catch40-d-${d}`}
              onClick={() => {
                sound.tap();
                setDartsUsed(d);
              }}
              className={`h-11 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${
                dartsUsed === d
                  ? 'bg-emerald-500 text-neutral-950 scale-105 shadow-md ring-2 ring-emerald-300 font-black'
                  : 'bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              {d} {d === 1 ? 'dart' : 'darts'}
            </button>
          ))}
        </div>
      </div>

      {/* CHECKOUT / FAIL buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          id="catch40-btn-checkout"
          onClick={handleCheckoutClick}
          className="h-18 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xl shadow-lg border border-emerald-400/50 flex items-center justify-center gap-2 transition-all"
        >
          <Check className="w-6 h-6" />
          <span>CHECKOUT</span>
        </button>

        <button
          type="button"
          id="catch40-btn-fail"
          onClick={handleFailClick}
          className="h-18 rounded-2xl bg-rose-900/70 hover:bg-rose-800/80 active:scale-95 text-rose-100 font-black text-xl shadow-lg border border-rose-700/50 flex items-center justify-center gap-2 transition-all"
        >
          <X className="w-6 h-6" />
          <span>FAIL (NEXT)</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Checkouts</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{checkouts}</span>
            <span className="text-[10px] text-neutral-500">{checkoutRate}% rate</span>
          </div>

          <div className="bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Attempts</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{attempts}</span>
            <span className="text-[10px] text-neutral-500">out of 40</span>
          </div>

          <div className="bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Doubles</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">
              {doubleRate === '—' ? '—' : `${doubleRate}%`}
            </span>
            <span className="text-[10px] text-neutral-500">
              {totalDoublesHit} / {totalDartsAtDouble} darts
            </span>
          </div>

          <div className="bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Current Target</span>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">{currentTarget}</span>
          </div>
        </div>
      </div>

      {/* Universal Double Popup Modal */}
      <DartsAtDoubleModal
        isOpen={pendingAttempt !== null}
        targetScore={pendingAttempt?.target}
        isCheckedOut={pendingAttempt?.isCheckout}
        contextDescription={
          pendingAttempt?.isCheckout
            ? `Checked out target ${pendingAttempt.target}!`
            : pendingAttempt?.target
            ? `Target ${pendingAttempt.target} attempt`
            : undefined
        }
        onSelect={handleSelectDartsAtDouble}
      />
    </div>
  );
};

