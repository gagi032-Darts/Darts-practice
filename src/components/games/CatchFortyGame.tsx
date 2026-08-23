import React, { useState, useEffect } from 'react';
import { Zap, RotateCcw, X, HelpCircle, Sparkles, Check, ChevronLeft } from 'lucide-react';
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
  onExit?: () => void;
}

interface AttemptHistory {
  target: number;
  dartsUsed: number;
  isCheckout: boolean;
  pointsEarned: number;
  dartsAtDouble: number;
  doublesHit: number;
}

interface PendingAttemptState {
  isCheckout: boolean;
  dartsUsed: number;
  target: number;
  pointsEarned: number;
}

const STORAGE_KEY_BEST_POINTS = 'darts_catch40_best_points';
const STORAGE_KEY_BEST_FINISHES = 'darts_catch40_best_finishes';

export const CatchFortyGame: React.FC<CatchFortyGameProps> = ({
  isFinalInput,
  onFinish,
  onOpenCheckoutAi,
  onExit,
}) => {
  const [currentTarget, setCurrentTarget] = useState<number>(41);
  const [points, setPoints] = useState<number>(0);
  const [finishesMade, setFinishesMade] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [totalDartsThrown, setTotalDartsThrown] = useState<number>(0);

  // High score tracking
  const [bestPoints, setBestPoints] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BEST_POINTS);
    return saved ? parseInt(saved, 10) : 27;
  });
  const [bestFinishes, setBestFinishes] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BEST_FINISHES);
    return saved ? parseInt(saved, 10) : 22;
  });

  // Double accuracy tracking
  const [totalDartsAtDouble, setTotalDartsAtDouble] = useState<number>(0);
  const [totalDoublesHit, setTotalDoublesHit] = useState<number>(0);

  // History stack for Undo
  const [history, setHistory] = useState<AttemptHistory[]>([]);

  // Keypad input preview
  const [inputValue, setInputValue] = useState<string>('');

  // Rules / Help modal
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Pending attempt for double accuracy popup
  const [pendingAttempt, setPendingAttempt] = useState<PendingAttemptState | null>(null);

  const suggestedRoute = getCheckoutRoute(currentTarget);

  // Calculate points for finish: 2 darts=4pts, 3 darts=3pts, 4 darts=2pts, 5 darts=1pt, 6 darts=1pt
  const getPointsForDarts = (darts: number): number => {
    if (darts === 2) return 4;
    if (darts === 3) return 3;
    if (darts === 4) return 2;
    if (darts === 5 || darts === 6) return 1;
    return 0;
  };

  const isDoubleStartingScore = (score: number): boolean => {
    return score === 50 || (score <= 48 && score >= 2 && score % 2 === 0);
  };

  // Handle Quick Button Press: 2, 3, 4, 5, 6 darts, or No
  const handleQuickDarts = (darts: number | 'no') => {
    sound.tap();
    setInputValue('');

    if (darts === 'no') {
      const data: PendingAttemptState = {
        isCheckout: false,
        dartsUsed: 6,
        target: currentTarget,
        pointsEarned: 0,
      };

      if (isDoubleStartingScore(currentTarget)) {
        setPendingAttempt(data);
      } else {
        commitAttempt(data, 0);
      }
      return;
    }

    const earned = getPointsForDarts(darts);
    const data: PendingAttemptState = {
      isCheckout: true,
      dartsUsed: darts,
      target: currentTarget,
      pointsEarned: earned,
    };

    setPendingAttempt(data);
  };

  const handleSelectDartsAtDouble = (dartsAtDbl: number) => {
    if (!pendingAttempt) return;
    const data = pendingAttempt;
    setPendingAttempt(null);
    commitAttempt(data, dartsAtDbl);
  };

  const commitAttempt = (data: PendingAttemptState, dartsAtDbl: number) => {
    const nextAttempts = attempts + 1;
    const nextFinishes = data.isCheckout ? finishesMade + 1 : finishesMade;
    const nextPoints = points + data.pointsEarned;
    const nextDartsThrown = totalDartsThrown + data.dartsUsed;
    const nextDartsAtDouble = totalDartsAtDouble + dartsAtDbl;
    const nextDoublesHit = data.isCheckout ? totalDoublesHit + 1 : totalDoublesHit;

    if (data.isCheckout) {
      sound.checkout();
      if (data.pointsEarned >= 3) {
        try {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        } catch {
          // ignore
        }
      }
    } else {
      sound.miss();
    }

    // Save history item
    setHistory((prev) => [
      ...prev,
      {
        target: data.target,
        dartsUsed: data.dartsUsed,
        isCheckout: data.isCheckout,
        pointsEarned: data.pointsEarned,
        dartsAtDouble: dartsAtDbl,
        doublesHit: data.isCheckout ? 1 : 0,
      },
    ]);

    setAttempts(nextAttempts);
    setFinishesMade(nextFinishes);
    setPoints(nextPoints);
    setTotalDartsThrown(nextDartsThrown);
    setTotalDartsAtDouble(nextDartsAtDouble);
    setTotalDoublesHit(nextDoublesHit);

    // Update best records
    if (nextPoints > bestPoints) {
      setBestPoints(nextPoints);
      localStorage.setItem(STORAGE_KEY_BEST_POINTS, String(nextPoints));
    }
    if (nextFinishes > bestFinishes) {
      setBestFinishes(nextFinishes);
      localStorage.setItem(STORAGE_KEY_BEST_FINISHES, String(nextFinishes));
    }

    storage.recordDartsThrown(data.dartsUsed);

    const nextTarget = data.target + 1;
    setCurrentTarget(nextTarget);

    // Game ends after target 80 or final input
    if (isFinalInput || nextTarget > 80) {
      const rate = nextAttempts > 0 ? (nextFinishes / nextAttempts) * 100 : 0;
      const dblPct = nextDartsAtDouble > 0 ? (nextDoublesHit / nextDartsAtDouble) * 100 : 0;

      onFinish({
        highestReached: nextTarget - 1,
        attempts: nextAttempts,
        checkouts: nextFinishes,
        checkoutRate: parseFloat(rate.toFixed(1)),
        dartsAtDouble: nextDartsAtDouble,
        doublesHit: nextDoublesHit,
        doublePercentage: parseFloat(dblPct.toFixed(1)),
      });
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    sound.tap();
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    setCurrentTarget(last.target);
    setPoints((prev) => Math.max(0, prev - last.pointsEarned));
    setFinishesMade((prev) => Math.max(0, prev - (last.isCheckout ? 1 : 0)));
    setAttempts((prev) => Math.max(0, prev - 1));
    setTotalDartsThrown((prev) => Math.max(0, prev - last.dartsUsed));
    setTotalDartsAtDouble((prev) => Math.max(0, prev - last.dartsAtDouble));
    setTotalDoublesHit((prev) => Math.max(0, prev - last.doublesHit));
    setInputValue('');
  };

  // Keypad handling
  const handleDigit = (d: string) => {
    sound.tap();
    setInputValue((prev) => (prev.length < 3 ? prev + d : prev));
  };

  const handleClear = () => {
    sound.tap();
    setInputValue('');
  };

  const handleKeypadOk = () => {
    if (!inputValue) return;
    const num = parseInt(inputValue, 10);
    setInputValue('');

    // If user typed 2, 3, 4, 5, 6 -> treat as darts finish
    if (num >= 2 && num <= 6) {
      handleQuickDarts(num);
    } else if (num === 0) {
      handleQuickDarts('no');
    } else {
      sound.tap();
    }
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto flex flex-col space-y-2 select-none touch-manipulation">
      {/* Top Header Bar matching 40.jpg */}
      <div className="flex items-center justify-between px-1 py-1 text-neutral-300">
        <button
          type="button"
          onClick={onExit}
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h2 className="text-lg font-bold text-white tracking-wide">Catch 40</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Undo"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onExit}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Target Score Card matching 40.jpg (Green Border, Centered Big Target & Outshot, Stats Left/Right) */}
      <div className="bg-[#101412] border-2 border-[#2e7d32] rounded-2xl p-4 sm:p-5 text-center shadow-lg relative overflow-hidden">
        {/* Big Target */}
        <div className="text-5xl sm:text-6xl font-mono font-black text-white tracking-tight">
          {currentTarget}
        </div>

        {/* Suggested Route */}
        <div className="text-base sm:text-lg font-mono font-bold text-neutral-300 my-1">
          {suggestedRoute || '—'}
        </div>

        {/* Left & Right Stats */}
        <div className="flex items-center justify-between text-xs sm:text-sm font-sans text-neutral-300 px-1 pt-1">
          <div className="text-left leading-tight">
            <span className="text-neutral-400">Points</span>
            <div className="font-bold text-white">
              {points} <span className="text-neutral-400 font-normal">( Best. {bestPoints} )</span>
            </div>
          </div>

          <div className="text-right leading-tight">
            <span className="text-neutral-400">finishes made</span>
            <div className="font-bold text-white">
              {finishesMade} <span className="text-neutral-400 font-normal">( Best. {bestFinishes} )</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Banner */}
      <div className="bg-[#1a1e24] border border-[#2c3540] rounded-xl py-2 px-3 text-center text-xs sm:text-sm font-bold text-white shadow-xs">
        Checkout with max. 6 Darts?
      </div>

      {/* 3x2 Quick Button Matrix matching 40.jpg: [2 darts] [4 darts] [6 darts] / [3 darts] [5 darts] [No] */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        <button
          type="button"
          id="catch40-btn-2"
          onClick={() => handleQuickDarts(2)}
          className="h-16 sm:h-18 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-base sm:text-lg border border-[#2f3844] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          2 darts
        </button>

        <button
          type="button"
          id="catch40-btn-4"
          onClick={() => handleQuickDarts(4)}
          className="h-16 sm:h-18 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-base sm:text-lg border border-[#2f3844] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          4 darts
        </button>

        <button
          type="button"
          id="catch40-btn-6"
          onClick={() => handleQuickDarts(6)}
          className="h-16 sm:h-18 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-base sm:text-lg border border-[#2f3844] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          6 darts
        </button>

        <button
          type="button"
          id="catch40-btn-3"
          onClick={() => handleQuickDarts(3)}
          className="h-16 sm:h-18 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-base sm:text-lg border border-[#2f3844] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          3 darts
        </button>

        <button
          type="button"
          id="catch40-btn-5"
          onClick={() => handleQuickDarts(5)}
          className="h-16 sm:h-18 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-base sm:text-lg border border-[#2f3844] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          5 darts
        </button>

        <button
          type="button"
          id="catch40-btn-no"
          onClick={() => handleQuickDarts('no')}
          className="h-16 sm:h-18 rounded-2xl bg-[#2e1d21] hover:bg-[#3d242a] active:scale-95 text-rose-200 hover:text-white font-black text-base sm:text-lg border border-[#522932] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          No
        </button>
      </div>

      {/* Input preview row */}
      <div className="h-8 rounded-xl bg-[#0c0e11] border border-[#232930] flex items-center justify-center text-center font-mono font-bold text-white text-base">
        {inputValue}
      </div>

      {/* 3-Column Keypad matching 40.jpg */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-12 sm:h-14 rounded-2xl bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white font-mono font-black text-lg sm:text-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={handleClear}
          className="h-12 sm:h-14 rounded-2xl bg-[#2e1d21] hover:bg-[#3d242a] active:bg-[#251619] active:scale-95 text-rose-300 hover:text-rose-200 font-bold text-sm sm:text-base border border-[#522932] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>CLR</span>
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-12 sm:h-14 rounded-2xl bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white font-mono font-black text-lg sm:text-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleKeypadOk}
          className="h-12 sm:h-14 rounded-2xl bg-[#1b4332] hover:bg-[#2d6a4f] active:scale-95 text-emerald-300 hover:text-white font-black text-sm sm:text-base border border-[#40916c] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          OK
        </button>
      </div>

      {/* Universal Double Popup Modal */}
      <DartsAtDoubleModal
        isOpen={pendingAttempt !== null}
        targetScore={pendingAttempt?.target}
        isCheckedOut={pendingAttempt?.isCheckout}
        contextDescription={
          pendingAttempt?.isCheckout
            ? `Checked out target ${pendingAttempt.target} in ${pendingAttempt.dartsUsed} darts!`
            : pendingAttempt?.target
            ? `Target ${pendingAttempt.target} attempt`
            : undefined
        }
        onSelect={handleSelectDartsAtDouble}
      />

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#15191e] border border-[#28303a] rounded-2xl p-5 max-w-sm w-full space-y-3 text-sm text-neutral-300 shadow-2xl">
            <div className="flex items-center justify-between text-white font-bold text-base">
              <span>Catch 40 Rules</span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Throw at targets from <b>41 up to 80</b> (40 total targets). You have a maximum of <b>6 darts</b> per target.
            </p>
            <div className="bg-[#1a2027] p-3 rounded-xl border border-[#2c3642] space-y-1 text-xs font-mono">
              <div className="text-emerald-400 font-bold">• 2 darts: 4 points</div>
              <div className="text-teal-300 font-bold">• 3 darts: 3 points</div>
              <div className="text-cyan-300">• 4 darts: 2 points</div>
              <div className="text-neutral-300">• 5 or 6 darts: 1 point</div>
              <div className="text-rose-400">• No / Miss: 0 points</div>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
