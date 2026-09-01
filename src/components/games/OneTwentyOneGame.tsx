import React, { useState } from 'react';
import {
  RotateCcw,
  X,
  HelpCircle,
  ChevronLeft,
  Target,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OneTwentyOneResult } from '../../types';
import { DartsAtDoubleModal } from '../common/DartsAtDoubleModal';
import { getCheckoutRoute, canVisitHaveDoubleShot, isDirectDoubleScore } from '../../utils/checkouts';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface OneTwentyOneGameProps {
  dartLimit: 12 | 9;
  isFinalInput: boolean;
  onFinish: (result: OneTwentyOneResult) => void;
  onOpenCheckoutAi?: (score: number) => void;
  onExit?: () => void;
}

interface VisitData {
  visitNumber: number;
  scoreScored: number;
  scoreBefore: number;
  scoreAfter: number;
  dartsThrown: number;
  dartsAtDouble: number;
}

interface TargetAttemptRecord {
  target: number;
  checkpointBefore: number;
  checkpointAfter: number;
  dartsUsed: number;
  isCheckout: boolean;
  dartsAtDouble: number;
  doublesHit: number;
  visits: VisitData[];
}

interface PendingDoubleModal {
  type: 'visit_intermediate' | 'visit_checkout' | 'quick_checkout' | 'quick_no';
  target: number;
  scoreRemaining: number;
  pointsScored: number;
  dartsUsed: number;
  isCheckout: boolean;
  visitNumber: number;
}

export const OneTwentyOneGame: React.FC<OneTwentyOneGameProps> = ({
  dartLimit,
  isFinalInput,
  onFinish,
  onOpenCheckoutAi,
  onExit,
}) => {
  // Max visits allowed per target attempt (3 visits for 9-dart limit, 4 visits for 12-dart limit)
  const maxVisits = dartLimit === 9 ? 3 : 4;
  const cpThreshold = 6; // Lock checkpoint on finishing in <= 6 darts

  // Target and Checkpoint progression
  const [currentTarget, setCurrentTarget] = useState<number>(121);
  const [checkpoint, setCheckpoint] = useState<number>(121);
  const [highestReached, setHighestReached] = useState<number>(121);

  // Active visit tracking for the current target attempt
  const [currentVisit, setCurrentVisit] = useState<number>(1);
  const [scoreRemaining, setScoreRemaining] = useState<number>(121);
  const [visitsInCurrentAttempt, setVisitsInCurrentAttempt] = useState<VisitData[]>([]);

  // Overall Match Stats
  const [attempts, setAttempts] = useState<number>(0);
  const [checkouts, setCheckouts] = useState<number>(0);
  const [bestCheckoutDarts, setBestCheckoutDarts] = useState<number | null>(null);
  const [totalDartsThrown, setTotalDartsThrown] = useState<number>(0);
  const [totalDartsAtDouble, setTotalDartsAtDouble] = useState<number>(0);
  const [totalDoublesHit, setTotalDoublesHit] = useState<number>(0);

  // History stack for Undo
  const [history, setHistory] = useState<TargetAttemptRecord[]>([]);

  // Keypad input string
  const [inputValue, setInputValue] = useState<string>('');

  // Rules / Help modal
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Double modal state
  const [pendingModal, setPendingModal] = useState<PendingDoubleModal | null>(null);

  // Darts selector modal if user typed exact checkout score
  const [pendingKeypadCheckout, setPendingKeypadCheckout] = useState<{
    target: number;
    visit: number;
  } | null>(null);

  const activeRoute = getCheckoutRoute(scoreRemaining);
  const currentDartsInAttempt = (currentVisit - 1) * 3;

  // Direct Quick Actions: [3 darts], [6 darts], [9 darts], [1-2 / 12 darts], [No], [Startscore]
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
        dartsUsed: dartLimit,
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

    const data: PendingDoubleModal = {
      type: 'quick_checkout',
      target: currentTarget,
      scoreRemaining: 0,
      pointsScored: scoreRemaining,
      dartsUsed: darts,
      isCheckout: true,
      visitNumber: Math.min(maxVisits, Math.ceil(darts / 3)),
    };

    setPendingModal(data);
  };

  // Reset current attempt back to start of target
  const handleStartScoreReset = () => {
    sound.tap();
    setInputValue('');
    if (visitsInCurrentAttempt.length > 0) {
      // Revert darts thrown for intermediate visits of current attempt
      const dartsInAttempt = visitsInCurrentAttempt.reduce((sum, v) => sum + v.dartsThrown, 0);
      const dblsInAttempt = visitsInCurrentAttempt.reduce((sum, v) => sum + v.dartsAtDouble, 0);
      setTotalDartsThrown((prev) => Math.max(0, prev - dartsInAttempt));
      setTotalDartsAtDouble((prev) => Math.max(0, prev - dblsInAttempt));
    }
    setScoreRemaining(currentTarget);
    setCurrentVisit(1);
    setVisitsInCurrentAttempt([]);
  };

  // Keypad Handlers
  const handleDigit = (d: string) => {
    sound.tap();
    setInputValue((prev) => {
      if (prev.length >= 3) return prev;
      const next = prev === '0' ? d : prev + d;
      const num = parseInt(next, 10);
      return !isNaN(num) && num <= 180 ? next : prev;
    });
  };

  const handleClear = () => {
    sound.tap();
    setInputValue('');
  };

  const handleKeypadOk = () => {
    if (!inputValue) return;
    const val = parseInt(inputValue, 10);
    setInputValue('');

    if (isNaN(val) || val < 0 || val > 180) {
      sound.miss();
      return;
    }

    // Case 1: Typed exact score remaining -> Checkout!
    if (val === scoreRemaining) {
      setPendingKeypadCheckout({
        target: currentTarget,
        visit: currentVisit,
      });
      return;
    }

    const endScore = scoreRemaining - val;
    const isBust = endScore < 0 || endScore === 1;

    // Case 2: Bust (leaves < 0 or 1)
    if (isBust) {
      sound.miss();
      storage.recordDartsThrown(3);
      setTotalDartsThrown((prev) => prev + 3);

      const bustVisit: VisitData = {
        visitNumber: currentVisit,
        scoreScored: 0,
        scoreBefore: scoreRemaining,
        scoreAfter: scoreRemaining,
        dartsThrown: 3,
        dartsAtDouble: 0,
      };
      const updatedVisits = [...visitsInCurrentAttempt, bustVisit];

      if (currentVisit >= maxVisits) {
        // Exceeded visits / darts limit -> Fail and return to checkpoint
        const pendingFail: PendingDoubleModal = {
          type: 'visit_intermediate',
          target: currentTarget,
          scoreRemaining,
          pointsScored: 0,
          dartsUsed: dartLimit,
          isCheckout: false,
          visitNumber: currentVisit,
        };
        commitTargetResultWithVisits(pendingFail, 0, updatedVisits);
      } else {
        setVisitsInCurrentAttempt(updatedVisits);
        setCurrentVisit((prev) => prev + 1);
      }
      return;
    }

    // Case 3: Valid intermediate score
    const hadDoubleOpportunity = canVisitHaveDoubleShot(scoreRemaining, val, false, 3);
    const pending: PendingDoubleModal = {
      type: 'visit_intermediate',
      target: currentTarget,
      scoreRemaining: endScore,
      pointsScored: val,
      dartsUsed: 3,
      isCheckout: false,
      visitNumber: currentVisit,
    };

    if (hadDoubleOpportunity) {
      setPendingModal(pending);
    } else {
      handleConfirmVisit(pending, 0);
    }
  };

  const handleConfirmVisit = (pending: PendingDoubleModal, dartsAtDbl: number) => {
    sound.hit();
    storage.recordDartsThrown(3);
    setTotalDartsThrown((prev) => prev + 3);
    setTotalDartsAtDouble((prev) => prev + dartsAtDbl);

    const newVisit: VisitData = {
      visitNumber: pending.visitNumber,
      scoreScored: pending.pointsScored,
      scoreBefore: scoreRemaining,
      scoreAfter: pending.scoreRemaining,
      dartsThrown: 3,
      dartsAtDouble: dartsAtDbl,
    };
    const updatedVisits = [...visitsInCurrentAttempt, newVisit];

    if (pending.visitNumber >= maxVisits) {
      // Last visit finished without checking out -> FAIL to checkpoint
      commitTargetResultWithVisits(pending, dartsAtDbl, updatedVisits);
    } else {
      setScoreRemaining(pending.scoreRemaining);
      setVisitsInCurrentAttempt(updatedVisits);
      setCurrentVisit((prev) => prev + 1);
      setPendingModal(null);
    }
  };

  const handleSelectDartsAtDouble = (dartsAtDbl: number) => {
    if (!pendingModal) return;
    const data = pendingModal;
    setPendingModal(null);

    if (data.type === 'visit_intermediate' && data.visitNumber < maxVisits) {
      handleConfirmVisit(data, dartsAtDbl);
    } else {
      commitTargetResult(data, dartsAtDbl);
    }
  };

  const commitTargetResult = (data: PendingDoubleModal, dartsAtDblThisVisit: number) => {
    commitTargetResultWithVisits(data, dartsAtDblThisVisit, visitsInCurrentAttempt);
  };

  const commitTargetResultWithVisits = (
    data: PendingDoubleModal,
    dartsAtDblThisVisit: number,
    allVisits: VisitData[]
  ) => {
    const priorDartsAtDbl = allVisits.reduce((sum, v) => sum + v.dartsAtDouble, 0);
    const cumulativeDartsAtDouble = priorDartsAtDbl + (data.type === 'visit_intermediate' ? 0 : dartsAtDblThisVisit);
    const totalDartsForAttempt = data.dartsUsed;

    const nextAttempts = attempts + 1;
    const nextCheckouts = data.isCheckout ? checkouts + 1 : checkouts;
    const nextDoublesHit = data.isCheckout ? totalDoublesHit + 1 : totalDoublesHit;
    const nextTotalDartsAtDouble = totalDartsAtDouble + dartsAtDblThisVisit;

    // Checkpoint logic
    let nextCheckpoint = checkpoint;
    if (data.isCheckout) {
      sound.checkout();
      if (totalDartsForAttempt <= cpThreshold) {
        // Locked new checkpoint!
        sound.lock();
        nextCheckpoint = data.target;
        try {
          confetti({ particleCount: 55, spread: 65, origin: { y: 0.65 } });
        } catch {}
      }
    } else {
      sound.miss();
    }

    const nextBest = data.isCheckout
      ? bestCheckoutDarts === null
        ? totalDartsForAttempt
        : Math.min(bestCheckoutDarts, totalDartsForAttempt)
      : bestCheckoutDarts;

    // Next target: If checkout -> target + 1; If fail -> return to checkpoint!
    const nextTarget = data.isCheckout ? data.target + 1 : checkpoint;
    const nextHighest = Math.max(highestReached, nextTarget);

    const record: TargetAttemptRecord = {
      target: currentTarget,
      checkpointBefore: checkpoint,
      checkpointAfter: nextCheckpoint,
      dartsUsed: totalDartsForAttempt,
      isCheckout: data.isCheckout,
      dartsAtDouble: cumulativeDartsAtDouble,
      doublesHit: data.isCheckout ? 1 : 0,
      visits: [...allVisits],
    };

    setHistory((prev) => [...prev, record]);
    setAttempts(nextAttempts);
    setCheckouts(nextCheckouts);
    setTotalDoublesHit(nextDoublesHit);
    setTotalDartsAtDouble(nextTotalDartsAtDouble);
    setBestCheckoutDarts(nextBest);
    setCheckpoint(nextCheckpoint);
    setHighestReached(nextHighest);

    // Record darts thrown in global storage
    const dartsThrownDelta = visitsInCurrentAttempt.length > 0 ? 3 : totalDartsForAttempt;
    storage.recordDartsThrown(dartsThrownDelta);

    // Reset attempt state
    setCurrentTarget(nextTarget);
    setScoreRemaining(nextTarget);
    setCurrentVisit(1);
    setVisitsInCurrentAttempt([]);
    setPendingModal(null);

    // Check if session finished
    if (isFinalInput) {
      const rate = nextAttempts > 0 ? (nextCheckouts / nextAttempts) * 100 : 0;
      const dblPct = nextTotalDartsAtDouble > 0 ? (nextDoublesHit / nextTotalDartsAtDouble) * 100 : 0;

      onFinish({
        highestReached: nextHighest,
        checkpoint: nextCheckpoint,
        attempts: nextAttempts,
        checkouts: nextCheckouts,
        bestCheckoutDarts: nextBest,
        checkoutRate: parseFloat(rate.toFixed(1)),
        dartsAtDouble: nextTotalDartsAtDouble,
        doublesHit: nextDoublesHit,
        doublePercentage: parseFloat(dblPct.toFixed(1)),
      });
    }
  };

  const handleUndo = () => {
    sound.tap();

    // If inside an active multi-visit attempt, revert the last visit of this attempt
    if (currentVisit > 1 && visitsInCurrentAttempt.length > 0) {
      const lastVisit = visitsInCurrentAttempt[visitsInCurrentAttempt.length - 1];
      const remainingVisits = visitsInCurrentAttempt.slice(0, -1);

      setScoreRemaining(lastVisit.scoreBefore);
      setCurrentVisit(lastVisit.visitNumber);
      setVisitsInCurrentAttempt(remainingVisits);
      setTotalDartsThrown((prev) => Math.max(0, prev - lastVisit.dartsThrown));
      setTotalDartsAtDouble((prev) => Math.max(0, prev - lastVisit.dartsAtDouble));
      setInputValue('');
      return;
    }

    // Otherwise revert the last completed target attempt
    if (history.length === 0) return;
    const lastAttempt = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    setCurrentTarget(lastAttempt.target);
    setScoreRemaining(lastAttempt.target);
    setCheckpoint(lastAttempt.checkpointBefore);
    setCurrentVisit(1);
    setVisitsInCurrentAttempt([]);

    setAttempts((prev) => Math.max(0, prev - 1));
    setCheckouts((prev) => Math.max(0, prev - (lastAttempt.isCheckout ? 1 : 0)));
    setTotalDoublesHit((prev) => Math.max(0, prev - lastAttempt.doublesHit));
    setTotalDartsAtDouble((prev) => Math.max(0, prev - lastAttempt.dartsAtDouble));
    setTotalDartsThrown((prev) => Math.max(0, prev - lastAttempt.dartsUsed));
    setInputValue('');
  };

  const checkoutRate = attempts > 0 ? ((checkouts / attempts) * 100).toFixed(0) : '0';

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
          <h2 className="text-lg font-bold text-white tracking-wide">
            Game 121 ({dartLimit} Darts)
          </h2>
          <span className="text-[11px] text-neutral-400 font-mono">
            Target {currentTarget} · Checkpoint {checkpoint}
          </span>
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

      {/* Target Score Card matching Catch 40 style with green border */}
      <div className="bg-[#101412] border-2 border-[#2e7d32] rounded-2xl p-4 sm:p-5 text-center shadow-lg relative overflow-hidden space-y-1">
        {/* Visit & Checkpoint Indicator Bar */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-mono">
            <Target className="w-3.5 h-3.5" />
            Visit {currentVisit} (Darts {(currentVisit - 1) * 3 + 1}–{currentVisit * 3} of {dartLimit})
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-amber-400" />
            CP: {checkpoint}
          </span>
        </div>

        {/* Big Remaining / Target Score */}
        <div className="text-5xl sm:text-6xl font-mono font-black text-white tracking-tight">
          {scoreRemaining}
        </div>

        {/* Suggested Route */}
        <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-mono font-bold text-emerald-400">
          <span>{activeRoute || '—'}</span>
          {onOpenCheckoutAi && (
            <button
              type="button"
              onClick={() => onOpenCheckoutAi(scoreRemaining)}
              className="text-xs bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 hover:text-white px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-500/30 cursor-pointer font-sans font-semibold transition-all active:scale-95 shadow-xs ml-1"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>AI Tip</span>
            </button>
          )}
        </div>

        {/* Left & Right Stats */}
        <div className="flex items-center justify-between text-xs sm:text-sm font-sans text-neutral-300 px-1 pt-1.5 border-t border-neutral-800/80">
          <div className="text-left leading-tight">
            <span className="text-neutral-400">Attempts</span>
            <div className="font-bold text-white font-mono">
              {attempts}{' '}
              {bestCheckoutDarts && (
                <span className="text-neutral-400 font-normal font-sans">
                  ( Best: {bestCheckoutDarts}d )
                </span>
              )}
            </div>
          </div>

          <div className="text-right leading-tight">
            <span className="text-neutral-400">finishes made</span>
            <div className="font-bold text-white font-mono">
              {checkouts}{' '}
              <span className="text-emerald-400 font-normal font-sans">
                ({checkoutRate}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Banner */}
      <div className="bg-[#1a1e24] border border-[#2c3540] rounded-xl py-1.5 px-3 text-center text-xs sm:text-sm font-bold text-white shadow-xs">
        {currentVisit === 1
          ? `Quick Checkout with max. ${dartLimit} Darts or type visit score:`
          : `Visit ${currentVisit}: Checkout ${scoreRemaining} in remaining ${dartLimit - currentDartsInAttempt} Darts:`}
      </div>

      {/* 3x2 Quick Action Matrix matching Catch 40 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        <button
          type="button"
          id="one21-quick-3"
          onClick={() => handleQuickDarts(3)}
          className="h-13 sm:h-15 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-sm sm:text-base border border-[#2f3844] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <span>3 darts</span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">Lock CP</span>
        </button>

        <button
          type="button"
          id="one21-quick-6"
          onClick={() => handleQuickDarts(6)}
          className="h-13 sm:h-15 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-sm sm:text-base border border-[#2f3844] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <span>6 darts</span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">Lock CP</span>
        </button>

        <button
          type="button"
          id="one21-quick-9"
          onClick={() => handleQuickDarts(9)}
          className="h-13 sm:h-15 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-sm sm:text-base border border-[#2f3844] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <span>9 darts</span>
          <span className="text-[10px] text-cyan-400 font-mono">Advance</span>
        </button>

        {dartLimit === 12 ? (
          <button
            type="button"
            id="one21-quick-12"
            onClick={() => handleQuickDarts(12)}
            className="h-13 sm:h-15 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-sm sm:text-base border border-[#2f3844] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <span>12 darts</span>
            <span className="text-[10px] text-cyan-400 font-mono">Advance</span>
          </button>
        ) : (
          <button
            type="button"
            id="one21-quick-2"
            onClick={() => handleQuickDarts(2)}
            className="h-13 sm:h-15 rounded-2xl bg-[#1e2229] hover:bg-[#282e37] active:scale-95 text-white font-bold text-sm sm:text-base border border-[#2f3844] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <span>1–2 darts</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">Lock CP</span>
          </button>
        )}

        <button
          type="button"
          id="one21-quick-no"
          onClick={() => handleQuickDarts('no')}
          className="h-13 sm:h-15 rounded-2xl bg-[#2e1d21] hover:bg-[#3d242a] active:scale-95 text-rose-200 hover:text-white font-black text-sm sm:text-base border border-[#522932] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <span>No</span>
          <span className="text-[10px] text-rose-400 font-mono">Return CP</span>
        </button>

        <button
          type="button"
          id="one21-quick-startscore"
          onClick={handleStartScoreReset}
          className="h-13 sm:h-15 rounded-2xl bg-[#20252b] hover:bg-[#282f37] active:scale-95 text-neutral-300 hover:text-white font-bold text-sm sm:text-base border border-[#303841] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <span>Startscore</span>
          <span className="text-[10px] text-neutral-400 font-mono">Reset ({currentTarget})</span>
        </button>
      </div>

      {/* Keypad input preview bar */}
      <div className="h-8.5 rounded-xl bg-[#0c0e11] border border-[#232930] flex items-center justify-between px-3 text-center font-mono font-bold text-white text-base">
        <span className="text-xs text-neutral-400 font-sans">
          Enter Visit {currentVisit} Score:
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
            ? `Checked out in ${pendingModal.dartsUsed} darts!`
            : `Visit ${pendingModal?.visitNumber} scored ${pendingModal?.pointsScored} pts (Remaining: ${pendingModal?.scoreRemaining})`
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

            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }, (_, i) => {
                const totalDarts = (pendingKeypadCheckout.visit - 1) * 3 + (i + 1);
                const isLock = totalDarts <= cpThreshold;
                return (
                  <button
                    key={totalDarts}
                    type="button"
                    onClick={() => {
                      setPendingKeypadCheckout(null);
                      handleQuickDarts(totalDarts);
                    }}
                    className={`py-3 px-2 rounded-2xl border font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all active:scale-95 ${
                      isLock
                        ? 'bg-[#1b4332] hover:bg-[#2d6a4f] text-emerald-300 border-[#40916c]'
                        : 'bg-[#1e2229] hover:bg-[#282e37] text-white border-[#2f3844]'
                    }`}
                  >
                    <span className="font-mono">{totalDarts} Darts</span>
                    <span className={`text-[10px] ${isLock ? 'text-emerald-400' : 'text-neutral-400'}`}>
                      {isLock ? 'Lock CP' : 'Advance'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#15191e] border border-[#28303a] rounded-2xl p-5 max-w-sm w-full space-y-3 text-sm text-neutral-300 shadow-2xl">
            <div className="flex items-center justify-between text-white font-bold text-base">
              <span>Game 121 Rules</span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Start at target <b>121</b>. You have a maximum of <b>{dartLimit} darts</b> ({maxVisits} visits of 3 darts) to check out each target.
            </p>
            <div className="bg-[#1a2027] p-3 rounded-xl border border-[#2c3642] space-y-1.5 text-xs">
              <div className="text-emerald-400 font-bold">
                • Finish in ≤ {cpThreshold} darts:
                <div className="text-neutral-300 font-normal pl-3">
                  Locks target as your new Checkpoint and advances to next number!
                </div>
              </div>
              <div className="text-cyan-400 font-bold">
                • Finish in 7–{dartLimit} darts:
                <div className="text-neutral-300 font-normal pl-3">
                  Advances target by +1 (checkpoint stays unchanged).
                </div>
              </div>
              <div className="text-rose-400 font-bold">
                • Fail / Press "No" / Exceed {dartLimit} darts:
                <div className="text-neutral-300 font-normal pl-3">
                  Returns target back to your locked Checkpoint ({checkpoint}).
                </div>
              </div>
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

