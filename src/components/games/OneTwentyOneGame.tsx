import React, { useState } from 'react';
import { Target, Check, X, Bookmark, Lightbulb, Flame, Award, Crosshair, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { OneTwentyOneResult } from '../../types';
import { DartsAtDoubleModal } from '../common/DartsAtDoubleModal';
import { getCheckoutRoute } from '../../utils/checkouts';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface OneTwentyOneGameProps {
  dartLimit: 12 | 9;
  isFinalInput: boolean;
  onFinish: (result: OneTwentyOneResult) => void;
  onOpenCheckoutAi?: (score: number) => void;
}

interface PendingCheckoutState {
  target: number;
  dartsUsed: number;
}

export const OneTwentyOneGame: React.FC<OneTwentyOneGameProps> = ({
  dartLimit,
  isFinalInput,
  onFinish,
  onOpenCheckoutAi,
}) => {
  const [currentTarget, setCurrentTarget] = useState<number>(121);
  const [checkpoint, setCheckpoint] = useState<number>(121);
  const [attempts, setAttempts] = useState<number>(0);
  const [checkouts, setCheckouts] = useState<number>(0);
  const [bestCheckoutDarts, setBestCheckoutDarts] = useState<number | null>(null);
  const [dartsUsed, setDartsUsed] = useState<number>(dartLimit === 12 ? 6 : 3);
  const [highestReached, setHighestReached] = useState<number>(121);

  // Double accuracy tracking
  const [totalDartsAtDouble, setTotalDartsAtDouble] = useState<number>(0);
  const [totalDoublesHit, setTotalDoublesHit] = useState<number>(0);

  // Popup state
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckoutState | null>(null);

  const cpThreshold = dartLimit === 12 ? 6 : 3;
  const suggestedRoute = getCheckoutRoute(currentTarget);

  const handleCheckoutClick = () => {
    // Checking out from target (>= 121, higher score) -> triggers universal popup!
    setPendingCheckout({
      target: currentTarget,
      dartsUsed,
    });
  };

  const handleSelectDartsAtDouble = (dartsAtDbl: number) => {
    if (!pendingCheckout) return;
    const data = pendingCheckout;
    setPendingCheckout(null);
    commitCheckout(data, dartsAtDbl);
  };

  const commitCheckout = (data: PendingCheckoutState, dartsAtDbl: number) => {
    sound.checkout();
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch {
      // ignore
    }

    const nextAttempts = attempts + 1;
    const nextCheckouts = checkouts + 1;
    const nextDartsAtDouble = totalDartsAtDouble + dartsAtDbl;
    const nextDoublesHit = totalDoublesHit + 1;
    const nextBest = bestCheckoutDarts === null ? data.dartsUsed : Math.min(bestCheckoutDarts, data.dartsUsed);

    // If finished in <= cpThreshold, lock checkpoint!
    let nextCheckpoint = checkpoint;
    const isNewCheckpoint = data.dartsUsed <= cpThreshold;
    if (isNewCheckpoint) {
      sound.lock();
      nextCheckpoint = data.target;
    }

    const nextTarget = data.target + 1;
    const nextHighest = Math.max(highestReached, nextTarget);

    setAttempts(nextAttempts);
    setCheckouts(nextCheckouts);
    setTotalDartsAtDouble(nextDartsAtDouble);
    setTotalDoublesHit(nextDoublesHit);
    setBestCheckoutDarts(nextBest);
    setCheckpoint(nextCheckpoint);
    setCurrentTarget(nextTarget);
    setHighestReached(nextHighest);
    storage.recordDartsThrown(data.dartsUsed);

    if (isFinalInput) {
      const rate = nextAttempts > 0 ? (nextCheckouts / nextAttempts) * 100 : 0;
      const dblPct = nextDartsAtDouble > 0 ? (nextDoublesHit / nextDartsAtDouble) * 100 : 0;

      onFinish({
        highestReached: nextHighest,
        checkpoint: nextCheckpoint,
        attempts: nextAttempts,
        checkouts: nextCheckouts,
        bestCheckoutDarts: nextBest,
        checkoutRate: parseFloat(rate.toFixed(1)),
        dartsAtDouble: nextDartsAtDouble,
        doublesHit: nextDoublesHit,
        doublePercentage: parseFloat(dblPct.toFixed(1)),
      });
    }
  };

  const handleFail = () => {
    sound.miss();
    const nextAttempts = attempts + 1;
    const nextTarget = checkpoint;

    setAttempts(nextAttempts);
    setCurrentTarget(nextTarget);
    storage.recordDartsThrown(dartLimit);

    if (isFinalInput) {
      const rate = nextAttempts > 0 ? (checkouts / nextAttempts) * 100 : 0;
      const dblPct = totalDartsAtDouble > 0 ? (totalDoublesHit / totalDartsAtDouble) * 100 : 0;

      onFinish({
        highestReached,
        checkpoint,
        attempts: nextAttempts,
        checkouts,
        bestCheckoutDarts,
        checkoutRate: parseFloat(rate.toFixed(1)),
        dartsAtDouble: totalDartsAtDouble,
        doublesHit: totalDoublesHit,
        doublePercentage: parseFloat(dblPct.toFixed(1)),
      });
    }
  };

  const checkoutRate = attempts > 0 ? ((checkouts / attempts) * 100).toFixed(1) : '0.0';
  const doubleRate = totalDartsAtDouble > 0 ? ((totalDoublesHit / totalDartsAtDouble) * 100).toFixed(1) : '—';

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Target Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-2">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-emerald-400">
            <Target className="w-3.5 h-3.5" /> 121 in {dartLimit} Darts
          </span>
          <span className="flex items-center gap-1 bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700 text-amber-400">
            <Bookmark className="w-3 h-3" /> Checkpoint: {checkpoint}
          </span>
        </div>

        {/* Big Target Display */}
        <div className="my-5 flex flex-col items-center justify-center">
          <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">
            CURRENT TARGET
          </span>
          <div className="text-6xl sm:text-7xl font-mono font-black text-white tracking-tight my-1">
            {currentTarget}
          </div>
          {suggestedRoute && (
            <button
              type="button"
              id="one21-checkout-ai-btn"
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

        {/* Rule Reminder Banner */}
        <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xl p-3 text-xs text-neutral-300 text-left space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Checkpoint Rule:</span>
          </div>
          <p className="text-neutral-400">
            • Finish in <b>≤ {cpThreshold} darts</b> to <span className="text-emerald-400 font-semibold">LOCK a new Checkpoint</span>.
            <br />
            • Finish in <b>{cpThreshold + 1}–{dartLimit} darts</b> to advance target (checkpoint unchanged).
            <br />
            • <b>Fail</b> returns target to checkpoint ({checkpoint}).
          </p>
        </div>
      </div>

      {/* Darts Used Selector (When Checkout) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
          If Checked Out: Select Darts Used (1–{dartLimit})
        </span>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {Array.from({ length: dartLimit }, (_, i) => i + 1).map((d) => {
            const isLockZone = d <= cpThreshold;
            const isSelected = dartsUsed === d;
            return (
              <button
                key={d}
                type="button"
                id={`one21-darts-${d}`}
                onClick={() => {
                  sound.tap();
                  setDartsUsed(d);
                }}
                className={`w-10 h-10 rounded-xl font-bold text-sm flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? isLockZone
                      ? 'bg-emerald-500 text-neutral-950 scale-105 shadow-md ring-2 ring-emerald-300'
                      : 'bg-teal-500 text-neutral-950 scale-105 shadow-md ring-2 ring-teal-300'
                    : isLockZone
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/80'
                    : 'bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <span>{d}</span>
              </button>
            );
          })}
        </div>
        <div className="text-center text-[11px] text-neutral-400">
          Selected: <b className="text-white">{dartsUsed} darts</b>{' '}
          {dartsUsed <= cpThreshold ? (
            <span className="text-emerald-400 font-bold">(Will Lock Checkpoint!)</span>
          ) : (
            <span className="text-neutral-400">(Will Advance Only)</span>
          )}
        </div>
      </div>

      {/* Action Buttons: CHECKOUT vs FAIL */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          id="one21-btn-checkout"
          onClick={handleCheckoutClick}
          className="h-18 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xl shadow-lg border border-emerald-400/50 flex items-center justify-center gap-2 transition-all"
        >
          <Check className="w-6 h-6" />
          <span>CHECKOUT</span>
        </button>

        <button
          type="button"
          id="one21-btn-fail"
          onClick={handleFail}
          className="h-18 rounded-2xl bg-rose-900/70 hover:bg-rose-800/80 active:scale-95 text-rose-100 font-black text-xl shadow-lg border border-rose-700/50 flex items-center justify-center gap-2 transition-all"
        >
          <X className="w-6 h-6" />
          <span>FAIL (RESET)</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Highest Target</span>
            <span className="text-lg font-bold text-cyan-400 mt-0.5 block">{highestReached}</span>
          </div>

          <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Checkouts</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{checkouts}</span>
            <span className="text-[10px] text-neutral-500">{checkoutRate}%</span>
          </div>

          <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Doubles</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
              {doubleRate === '—' ? '—' : `${doubleRate}%`}
            </span>
            <span className="text-[10px] text-neutral-500">
              {totalDoublesHit} / {totalDartsAtDouble} darts
            </span>
          </div>

          <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Best Finish</span>
            <span className="text-lg font-bold text-amber-400 mt-0.5 block">
              {bestCheckoutDarts ? `${bestCheckoutDarts}d` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Universal Double Popup Modal */}
      <DartsAtDoubleModal
        isOpen={pendingCheckout !== null}
        targetScore={pendingCheckout?.target}
        isCheckedOut={true}
        contextDescription={
          pendingCheckout?.target
            ? `Checked out target ${pendingCheckout.target} in ${pendingCheckout.dartsUsed} darts!`
            : undefined
        }
        onSelect={handleSelectDartsAtDouble}
      />
    </div>
  );
};

