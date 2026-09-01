import React, { useState } from 'react';
import { RotateCcw, X, HelpCircle, ChevronLeft, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CatchFortyResult } from '../../types';
import { DartsAtDoubleModal } from '../common/DartsAtDoubleModal';
import { getCheckoutRoute, canVisitHaveDoubleShot, isDirectDoubleScore } from '../../utils/checkouts';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface CatchFortyGameProps {
  isFinalInput: boolean;
  onFinish: (result: CatchFortyResult) => void;
  onOpenCheckoutAi?: (score: number) => void;
  onExit?: () => void;
}

interface TargetAttemptRecord {
  target: number;
  dartsUsed: number;
  isCheckout: boolean;
  pointsEarned: number;
  dartsAtDouble: number;
  doublesHit: number;
  visit1Score?: number;
  visit2Score?: number;
}

interface PendingDoubleModal {
  type: 'visit1_intermediate' | 'visit1_checkout' | 'visit2_finish' | 'quick_checkout' | 'quick_no';
  target: number;
  scoreRemaining: number;
  pointsScored: number;
  dartsUsed: number;
  pointsEarned: number;
  isCheckout: boolean;
  visitNumber: 1 | 2;
}

const STORAGE_KEY_BEST_POINTS = 'darts_catch40_best_points';
const STORAGE_KEY_BEST_FINISHES = 'darts_catch40_best_finishes';

export const CatchFortyGame: React.FC<CatchFortyGameProps> = ({
  isFinalInput,
  onFinish,
  onOpenCheckoutAi,
  onExit,
}) => {
  // Current Target progression (41 to 80)
  const [currentTarget, setCurrentTarget] = useState<number>(41);
  const [currentVisit, setCurrentVisit] = useState<1 | 2>(1);
  const [scoreRemaining, setScoreRemaining] = useState<number>(41);

  // Active target visit 1 cache (if player is on visit 2)
  const [visit1Data, setVisit1Data] = useState<{
    scoreScored: number;
    dartsAtDouble: number;
    dartsThrown: number;
  } | null>(null);

  // Overall Match Stats
  const [points, setPoints] = useState<number>(0);
  const [finishesMade, setFinishesMade] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [totalDartsThrown, setTotalDartsThrown] = useState<number>(0);
  const [totalDartsAtDouble, setTotalDartsAtDouble] = useState<number>(0);
  const [totalDoublesHit, setTotalDoublesHit] = useState<number>(0);

  // High score tracking
  const [bestPoints, setBestPoints] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BEST_POINTS);
    return saved ? parseInt(saved, 10) : 27;
  });
  const [bestFinishes, setBestFinishes] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BEST_FINISHES);
    return saved ? parseInt(saved, 10) : 22;
  });

  // History stack for Undo
  const [history, setHistory] = useState<TargetAttemptRecord[]>([]);

  // Keypad input string
  const [inputValue, setInputValue] = useState<string>('');

  // Rules / Help modal
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Pending Modal for Double Accuracy popup
  const [pendingModal, setPendingModal] = useState<PendingDoubleModal | null>(null);

  // Darts selector modal if user typed exact checkout score
  const [pendingKeypadCheckout, setPendingKeypadCheckout] = useState<{
    target: number;
    visit: 1 | 2;
  } | null>(null);

  const activeRoute = getCheckoutRoute(scoreRemaining);

  // Points calculation rule: 2 darts=4pts, 3 darts=3pts, 4 darts=2pts, 5 darts=1pt, 6 darts=1pt
  const getPointsForDarts = (darts: number): number => {
    if (darts === 2) return 4;
    if (darts === 3) return 3;
    if (darts === 4) return 2;
    if (darts === 5 || darts === 6) return 1;
    return 0;
  };

  // Quick Action Buttons: [2 darts] [4 darts] [6 darts] / [3 darts] [5 darts] [No]
  const handleQuickDarts = (darts: number | 'no') => {
    sound.tap();
    setInputValue('');

    if (darts === 'no') {
      const isDbl = isDirectDoubleScore(scoreRemaining) || isDirectDoubleScore(currentTarget);
      const data: PendingDoubleModal = {
        type: 'quick_no',
        target: currentTarget,
        scoreRemaining,
        pointsScored: 0,
        dartsUsed: 6,
        pointsEarned: 0,
        isCheckout: false,
        visitNumber: currentVisit,
      };

      if (isDbl) {
        setPendingModal(data);
      } else {
        commitTargetResult(data, 0);
      }
      return;
    }

    const earned = getPointsForDarts(darts);
    const data: PendingDoubleModal = {
      type: 'quick_checkout',
      target: currentTarget,
      scoreRemaining: 0,
      pointsScored: currentTarget,
      dartsUsed: darts,
      pointsEarned: earned,
      isCheckout: true,
      visitNumber: darts <= 3 ? 1 : 2,
    };

    setPendingModal(data);
  };

  // Keypad Handlers
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
    const val = parseInt(inputValue, 10);
    setInputValue('');

    if (isNaN(val) || val < 0 || val > scoreRemaining) {
      sound.miss();
      return;
    }

    // Case 1: User typed exact score remaining -> Checkout!
    if (val === scoreRemaining) {
      if (currentVisit === 1) {
        // Can be 2 or 3 darts
        setPendingKeypadCheckout({ target: currentTarget, visit: 1 });
      } else {
        // Visit 2: Can be 4, 5, or 6 darts
        setPendingKeypadCheckout({ target: currentTarget, visit: 2 });
      }
      return;
    }

    // Case 2: User scored points but DID NOT checkout
    if (currentVisit === 1) {
      // Visit 1 scored val points (e.g. 17 from 57 -> leaving 40)
      const nextRemaining = scoreRemaining - val;
      const hadDoubleOpportunity = canVisitHaveDoubleShot(scoreRemaining, val, false, 3);

      const pending: PendingDoubleModal = {
        type: 'visit1_intermediate',
        target: currentTarget,
        scoreRemaining: nextRemaining,
        pointsScored: val,
        dartsUsed: 3,
        pointsEarned: 0,
        isCheckout: false,
        visitNumber: 1,
      };

      if (hadDoubleOpportunity) {
        setPendingModal(pending);
      } else {
        handleConfirmVisit1(pending, 0);
      }
    } else {
      // Visit 2 failed to checkout
      const hadDoubleOpportunity = isDirectDoubleScore(scoreRemaining);
      const pending: PendingDoubleModal = {
        type: 'visit2_finish',
        target: currentTarget,
        scoreRemaining: scoreRemaining - val,
        pointsScored: val,
        dartsUsed: 6,
        pointsEarned: 0,
        isCheckout: false,
        visitNumber: 2,
      };

      if (hadDoubleOpportunity) {
        setPendingModal(pending);
      } else {
        commitTargetResult(pending, 0);
      }
    }
  };

  const handleConfirmVisit1 = (pending: PendingDoubleModal, dartsAtDbl: number) => {
    sound.tap();
    storage.recordDartsThrown(3);
    setTotalDartsThrown((prev) => prev + 3);
    setTotalDartsAtDouble((prev) => prev + dartsAtDbl);

    setVisit1Data({
      scoreScored: pending.pointsScored,
      dartsAtDouble: dartsAtDbl,
      dartsThrown: 3,
    });

    setScoreRemaining(pending.scoreRemaining);
    setCurrentVisit(2);
    setPendingModal(null);
  };

  const handleSelectDartsAtDouble = (dartsAtDbl: number) => {
    if (!pendingModal) return;
    const data = pendingModal;
    setPendingModal(null);

    if (data.type === 'visit1_intermediate') {
      handleConfirmVisit1(data, dartsAtDbl);
    } else {
      commitTargetResult(data, dartsAtDbl);
    }
  };

  const commitTargetResult = (data: PendingDoubleModal, dartsAtDblThisVisit: number) => {
    const v1DartsAtDbl = visit1Data?.dartsAtDouble || 0;
    const cumulativeDartsAtDouble = v1DartsAtDbl + dartsAtDblThisVisit;
    const cumulativeDartsThrown = data.dartsUsed;

    const nextAttempts = attempts + 1;
    const nextFinishes = data.isCheckout ? finishesMade + 1 : finishesMade;
    const nextPoints = points + data.pointsEarned;
    const nextTotalDarts = totalDartsThrown + (visit1Data ? (data.dartsUsed - 3) : data.dartsUsed);
    const nextTotalDartsAtDouble = totalDartsAtDouble + dartsAtDblThisVisit;
    const nextTotalDoublesHit = data.isCheckout ? totalDoublesHit + 1 : totalDoublesHit;

    if (data.isCheckout) {
      sound.checkout();
      if (data.pointsEarned >= 3) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.65 } });
        } catch {}
      }
    } else {
      sound.miss();
    }

    // Save history snapshot
    const record: TargetAttemptRecord = {
      target: currentTarget,
      dartsUsed: cumulativeDartsThrown,
      isCheckout: data.isCheckout,
      pointsEarned: data.pointsEarned,
      dartsAtDouble: cumulativeDartsAtDouble,
      doublesHit: data.isCheckout ? 1 : 0,
      visit1Score: visit1Data?.scoreScored,
      visit2Score: data.pointsScored,
    };
    setHistory((prev) => [...prev, record]);

    setAttempts(nextAttempts);
    setFinishesMade(nextFinishes);
    setPoints(nextPoints);
    setTotalDartsThrown(nextTotalDarts);
    setTotalDartsAtDouble(nextTotalDartsAtDouble);
    setTotalDoublesHit(nextTotalDoublesHit);

    // Update best records
    if (nextPoints > bestPoints) {
      setBestPoints(nextPoints);
      localStorage.setItem(STORAGE_KEY_BEST_POINTS, String(nextPoints));
    }
    if (nextFinishes > bestFinishes) {
      setBestFinishes(nextFinishes);
      localStorage.setItem(STORAGE_KEY_BEST_FINISHES, String(nextFinishes));
    }

    storage.recordDartsThrown(visit1Data ? (data.dartsUsed - 3) : data.dartsUsed);

    // Advance to next target
    const nextTarget = currentTarget + 1;
    setCurrentTarget(nextTarget);
    setScoreRemaining(nextTarget);
    setCurrentVisit(1);
    setVisit1Data(null);

    // Game finishes after target 80 or timer cutoff
    if (isFinalInput || nextTarget > 80) {
      const rate = nextAttempts > 0 ? (nextFinishes / nextAttempts) * 100 : 0;
      const dblPct = nextTotalDartsAtDouble > 0 ? (nextTotalDoublesHit / nextTotalDartsAtDouble) * 100 : 0;

      onFinish({
        highestReached: nextTarget - 1,
        attempts: nextAttempts,
        checkouts: nextFinishes,
        checkoutRate: parseFloat(rate.toFixed(1)),
        dartsAtDouble: nextTotalDartsAtDouble,
        doublesHit: nextTotalDoublesHit,
        doublePercentage: parseFloat(dblPct.toFixed(1)),
      });
    }
  };

  const handleUndo = () => {
    sound.tap();

    // If on visit 2 of current target, revert to visit 1 of same target
    if (currentVisit === 2 && visit1Data) {
      setScoreRemaining(currentTarget);
      setCurrentVisit(1);
      setTotalDartsThrown((prev) => Math.max(0, prev - 3));
      setTotalDartsAtDouble((prev) => Math.max(0, prev - visit1Data.dartsAtDouble));
      setVisit1Data(null);
      setInputValue('');
      return;
    }

    // Otherwise revert last completed target
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    setCurrentTarget(last.target);
    setScoreRemaining(last.target);
    setCurrentVisit(1);
    setVisit1Data(null);

    setPoints((prev) => Math.max(0, prev - last.pointsEarned));
    setFinishesMade((prev) => Math.max(0, prev - (last.isCheckout ? 1 : 0)));
    setAttempts((prev) => Math.max(0, prev - 1));
    setTotalDartsThrown((prev) => Math.max(0, prev - last.dartsUsed));
    setTotalDartsAtDouble((prev) => Math.max(0, prev - last.dartsAtDouble));
    setTotalDoublesHit((prev) => Math.max(0, prev - last.doublesHit));
    setInputValue('');
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto flex flex-col space-y-2 select-none touch-manipulation">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-1 py-1 text-neutral-300">
        <button
          type="button"
          onClick={onExit}
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-bold text-white tracking-wide">Catch 40</h2>
          <span className="text-[11px] text-neutral-400 font-mono">Target {currentTarget} of 80</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0 && currentVisit === 1}
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

      {/* Target Score Card */}
      <div className="bg-[#101412] border-2 border-[#2e7d32] rounded-2xl p-4 sm:p-5 text-center shadow-lg relative overflow-hidden space-y-1">
        {/* Visit Indicator Pill */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-mono">
            <Target className="w-3.5 h-3.5" />
            {currentVisit === 1 ? 'Visit 1 (Darts 1–3)' : 'Visit 2 (Darts 4–6)'}
          </span>
          {currentVisit === 2 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono">
              Target: {currentTarget} (Hit {visit1Data?.scoreScored ?? 0} in V1)
            </span>
          )}
        </div>

        {/* Big Remaining / Target Score */}
        <div className="text-5xl sm:text-6xl font-mono font-black text-white tracking-tight">
          {scoreRemaining}
        </div>

        {/* Suggested Route */}
        <div className="text-base sm:text-lg font-mono font-bold text-emerald-400">
          {activeRoute || '—'}
        </div>

        {/* Left & Right Stats */}
        <div className="flex items-center justify-between text-xs sm:text-sm font-sans text-neutral-300 px-1 pt-1.5 border-t border-neutral-800/80">
          <div className="text-left leading-tight">
            <span className="text-neutral-400">Points</span>
            <div className="font-bold text-white font-mono">
              {points} <span className="text-neutral-400 font-normal font-sans">( Best. {bestPoints} )</span>
            </div>
          </div>

          <div className="text-right leading-tight">
            <span className="text-neutral-400">finishes made</span>
            <div className="font-bold text-white font-mono">
              {finishesMade} <span className="text-neutral-400 font-normal font-sans">( Best. {bestFinishes} )</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Banner */}
      <div className="bg-[#1a1e24] border border-[#2c3540] rounded-xl py-1.5 px-3 text-center text-xs sm:text-sm font-bold text-white shadow-xs">
        {currentVisit === 1
          ? 'Quick Checkout with max. 6 Darts or type visit score:'
          : `Visit 2: Checkout ${scoreRemaining} in remaining 3 Darts:`}
      </div>

      {/* 3x2 Quick Button Matrix: [2 darts] [4 darts] [6 darts] / [3 darts] [5 darts] [No] */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        <button
          type="button"
          id="catch40-btn-2"
          onClick={() => handleQuickDarts(2)}
          className="h-14 sm:h-16 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-base sm:text-lg border border-[#2f3844] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <span>2 darts</span>
          <span className="text-[10px] text-emerald-400 font-mono">4 pts</span>
        </button>

        <button
          type="button"
          id="catch40-btn-4"
          onClick={() => handleQuickDarts(4)}
          className="h-14 sm:h-16 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-base sm:text-lg border border-[#2f3844] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <span>4 darts</span>
          <span className="text-[10px] text-cyan-400 font-mono">2 pts</span>
        </button>

        <button
          type="button"
          id="catch40-btn-6"
          onClick={() => handleQuickDarts(6)}
          className="h-14 sm:h-16 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-base sm:text-lg border border-[#2f3844] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <span>6 darts</span>
          <span className="text-[10px] text-neutral-400 font-mono">1 pt</span>
        </button>

        <button
          type="button"
          id="catch40-btn-3"
          onClick={() => handleQuickDarts(3)}
          className="h-14 sm:h-16 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-base sm:text-lg border border-[#2f3844] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <span>3 darts</span>
          <span className="text-[10px] text-teal-400 font-mono">3 pts</span>
        </button>

        <button
          type="button"
          id="catch40-btn-5"
          onClick={() => handleQuickDarts(5)}
          className="h-14 sm:h-16 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-base sm:text-lg border border-[#2f3844] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <span>5 darts</span>
          <span className="text-[10px] text-neutral-400 font-mono">1 pt</span>
        </button>

        <button
          type="button"
          id="catch40-btn-no"
          onClick={() => handleQuickDarts('no')}
          className="h-14 sm:h-16 rounded-2xl bg-[#2e1d21] hover:bg-[#3d242a] active:scale-95 text-rose-200 hover:text-white font-black text-base sm:text-lg border border-[#522932] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <span>No</span>
          <span className="text-[10px] text-rose-400 font-mono">0 pts</span>
        </button>
      </div>

      {/* Keypad input preview bar */}
      <div className="h-8 rounded-xl bg-[#0c0e11] border border-[#232930] flex items-center justify-between px-3 text-center font-mono font-bold text-white text-base">
        <span className="text-xs text-neutral-500 font-sans">
          {currentVisit === 1 ? 'Enter Visit 1 Score:' : 'Enter Visit 2 Score:'}
        </span>
        <span className="text-emerald-400 text-lg">{inputValue || '—'}</span>
      </div>

      {/* 3-Column Keypad */}
      <div className="grid grid-cols-3 gap-1.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-11 sm:h-13 rounded-2xl bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white font-mono font-black text-lg sm:text-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={handleClear}
          className="h-11 sm:h-13 rounded-2xl bg-[#2e1d21] hover:bg-[#3d242a] active:bg-[#251619] active:scale-95 text-rose-300 hover:text-rose-200 font-bold text-xs sm:text-sm border border-[#522932] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>CLR</span>
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-11 sm:h-13 rounded-2xl bg-[#20252b] hover:bg-[#282f37] active:bg-[#181d22] active:scale-95 text-white font-mono font-black text-lg sm:text-xl border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleKeypadOk}
          className="h-11 sm:h-13 rounded-2xl bg-[#1b4332] hover:bg-[#2d6a4f] active:scale-95 text-emerald-300 hover:text-white font-black text-xs sm:text-sm border border-[#40916c] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          OK
        </button>
      </div>

      {/* Universal Double Popup Modal */}
      <DartsAtDoubleModal
        isOpen={pendingModal !== null}
        targetScore={pendingModal?.target}
        isCheckedOut={pendingModal?.isCheckout}
        contextDescription={
          pendingModal?.isCheckout
            ? `Checked out in ${pendingModal.dartsUsed} darts (${pendingModal.pointsEarned} pts)!`
            : pendingModal?.visitNumber === 1
            ? `Visit 1 scored ${pendingModal.pointsScored} pts (Remaining: ${pendingModal.scoreRemaining})`
            : `Visit 2 on remaining ${pendingModal?.scoreRemaining ?? currentTarget}`
        }
        onSelect={handleSelectDartsAtDouble}
      />

      {/* Darts selection dialog if user keyed in exact remaining score */}
      {pendingKeypadCheckout && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#15191e] border border-[#28303a] rounded-3xl p-5 max-w-sm w-full space-y-4 text-center text-white shadow-2xl">
            <h3 className="text-lg font-black tracking-tight">
              Checked out target {pendingKeypadCheckout.target}!
            </h3>
            <p className="text-xs text-neutral-400">
              How many darts were used in total to finish?
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {pendingKeypadCheckout.visit === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingKeypadCheckout(null);
                      handleQuickDarts(2);
                    }}
                    className="py-3 px-4 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] border border-[#2f3844] font-bold text-sm text-emerald-400"
                  >
                    2 Darts (4 pts)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingKeypadCheckout(null);
                      handleQuickDarts(3);
                    }}
                    className="py-3 px-4 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] border border-[#2f3844] font-bold text-sm text-teal-400"
                  >
                    3 Darts (3 pts)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingKeypadCheckout(null);
                      handleQuickDarts(4);
                    }}
                    className="py-3 px-4 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] border border-[#2f3844] font-bold text-sm text-cyan-400"
                  >
                    4 Darts (2 pts)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingKeypadCheckout(null);
                      handleQuickDarts(5);
                    }}
                    className="py-3 px-4 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] border border-[#2f3844] font-bold text-sm text-neutral-200"
                  >
                    5 Darts (1 pt)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingKeypadCheckout(null);
                      handleQuickDarts(6);
                    }}
                    className="col-span-2 py-3 px-4 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] border border-[#2f3844] font-bold text-sm text-neutral-200"
                  >
                    6 Darts (1 pt)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
              Throw at targets from <b>41 up to 80</b> (40 total targets). You have a maximum of <b>6 darts</b> (2 visits of 3 darts) per target.
            </p>
            <div className="bg-[#1a2027] p-3 rounded-xl border border-[#2c3642] space-y-1 text-xs font-mono">
              <div className="text-emerald-400 font-bold">• 2 darts: 4 points</div>
              <div className="text-teal-300 font-bold">• 3 darts: 3 points</div>
              <div className="text-cyan-300">• 4 darts: 2 points</div>
              <div className="text-neutral-300">• 5 or 6 darts: 1 point</div>
              <div className="text-rose-400">• No / Miss: 0 points</div>
            </div>
            <p className="text-[11px] text-neutral-400">
              Tip: You can use quick buttons or enter visit 1 & visit 2 scores on the keypad.
            </p>
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
