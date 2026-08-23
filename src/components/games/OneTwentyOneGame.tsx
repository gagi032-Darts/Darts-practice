import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  RotateCcw,
  X,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  Flame,
  Bookmark,
  Check,
  Undo2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OneTwentyOneResult } from '../../types';
import { DartsAtDoubleModal } from '../common/DartsAtDoubleModal';
import { CheckoutDartsModal } from '../common/CheckoutDartsModal';
import { getCheckoutRoute, BOGEY_NUMBERS } from '../../utils/checkouts';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface OneTwentyOneGameProps {
  dartLimit: 12 | 9;
  isFinalInput: boolean;
  onFinish: (result: OneTwentyOneResult) => void;
  onOpenCheckoutAi?: (score: number) => void;
  onExit?: () => void;
}

interface AttemptHistoryState {
  target: number;
  checkpoint: number;
  scoreRemaining: number;
  currentAttemptDarts: number;
  attempts: number;
  checkouts: number;
  totalSessionDarts: number;
  totalDartsAtDouble: number;
  totalDoublesHit: number;
  bestCheckoutDarts: number | null;
  highestReached: number;
  visitHistoryInAttempt: number[];
}

interface PendingCheckoutData {
  target: number;
  dartsUsed: number;
  isNewCheckpoint: boolean;
}

export const OneTwentyOneGame: React.FC<OneTwentyOneGameProps> = ({
  dartLimit,
  isFinalInput,
  onFinish,
  onOpenCheckoutAi,
  onExit,
}) => {
  // Target and checkpoint
  const [currentTarget, setCurrentTarget] = useState<number>(121);
  const [checkpoint, setCheckpoint] = useState<number>(121);
  const [highestReached, setHighestReached] = useState<number>(121);

  // Score remaining within the current target attempt
  const [scoreRemaining, setScoreRemaining] = useState<number>(121);
  const [currentAttemptDarts, setCurrentAttemptDarts] = useState<number>(0);
  const [currentAttemptVisits, setCurrentAttemptVisits] = useState<number[]>([]);

  // Overall session metrics
  const [attempts, setAttempts] = useState<number>(0);
  const [checkouts, setCheckouts] = useState<number>(0);
  const [bestCheckoutDarts, setBestCheckoutDarts] = useState<number | null>(null);
  const [totalSessionDarts, setTotalSessionDarts] = useState<number>(0);

  // Double accuracy tracking
  const [totalDartsAtDouble, setTotalDartsAtDouble] = useState<number>(0);
  const [totalDoublesHit, setTotalDoublesHit] = useState<number>(0);

  // Keypad typed text
  const [inputValue, setInputValue] = useState<string>('');
  const [inputMode, setInputMode] = useState<'score' | 'remaining'>('score');

  // History stack for Undo
  const [historyStack, setHistoryStack] = useState<AttemptHistoryState[]>([]);

  // Modals
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showCheckoutDartsModal, setShowCheckoutDartsModal] = useState<boolean>(false);
  const [showDartsAtDoubleModal, setShowDartsAtDoubleModal] = useState<boolean>(false);
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckoutData | null>(null);
  const [lastCheckoutScore, setLastCheckoutScore] = useState<number>(0);

  const cpThreshold = dartLimit === 12 ? 6 : 3;
  const suggestedRoute = getCheckoutRoute(scoreRemaining);

  // Snapshot current state for Undo
  const saveStateForUndo = () => {
    setHistoryStack((prev) => [
      ...prev,
      {
        target: currentTarget,
        checkpoint,
        scoreRemaining,
        currentAttemptDarts,
        attempts,
        checkouts,
        totalSessionDarts,
        totalDartsAtDouble,
        totalDoublesHit,
        bestCheckoutDarts,
        highestReached,
        visitHistoryInAttempt: [...currentAttemptVisits],
      },
    ]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    sound.tap();
    const prev = historyStack[historyStack.length - 1];
    setHistoryStack((old) => old.slice(0, -1));

    setCurrentTarget(prev.target);
    setCheckpoint(prev.checkpoint);
    setScoreRemaining(prev.scoreRemaining);
    setCurrentAttemptDarts(prev.currentAttemptDarts);
    setAttempts(prev.attempts);
    setCheckouts(prev.checkouts);
    setTotalSessionDarts(prev.totalSessionDarts);
    setTotalDartsAtDouble(prev.totalDartsAtDouble);
    setTotalDoublesHit(prev.doublesHit !== undefined ? (prev as any).doublesHit : prev.totalDoublesHit);
    setBestCheckoutDarts(prev.bestCheckoutDarts);
    setHighestReached(prev.highestReached);
    setCurrentAttemptVisits(prev.visitHistoryInAttempt);
    setInputValue('');
  };

  // Reset current attempt back to start of target (Startscore button)
  const handleStartScoreReset = () => {
    sound.tap();
    saveStateForUndo();
    setScoreRemaining(currentTarget);
    setCurrentAttemptDarts(0);
    setCurrentAttemptVisits([]);
    setInputValue('');
  };

  // Direct checkout via [Yes] button
  const handleDirectYesCheckout = () => {
    sound.tap();
    saveStateForUndo();

    // Default darts used if no visits were entered yet
    const darts = currentAttemptDarts > 0 ? currentAttemptDarts : cpThreshold;
    const isNewCp = darts <= cpThreshold;

    setPendingCheckout({
      target: currentTarget,
      dartsUsed: darts,
      isNewCheckpoint: isNewCp,
    });

    setLastCheckoutScore(scoreRemaining);
    setShowCheckoutDartsModal(true);
  };

  // Direct fail via [No] button (or when exceeding dartLimit)
  const handleDirectNoFail = () => {
    sound.miss();
    saveStateForUndo();

    const dartsSpent = currentAttemptDarts > 0 ? currentAttemptDarts : dartLimit;
    storage.recordDartsThrown(dartsSpent);

    const nextAttempts = attempts + 1;
    const nextTotalDarts = totalSessionDarts + dartsSpent;
    // CRITICAL: Return to the locked checkpoint!
    const nextTarget = checkpoint;

    setAttempts(nextAttempts);
    setTotalSessionDarts(nextTotalDarts);
    setCurrentTarget(nextTarget);
    setScoreRemaining(nextTarget);
    setCurrentAttemptDarts(0);
    setCurrentAttemptVisits([]);
    setInputValue('');

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

  // Keypad visit submit
  const handleKeypadSubmit = (customScore?: number) => {
    const rawVal = customScore !== undefined ? customScore : parseInt(inputValue, 10);
    if (isNaN(rawVal) || rawVal < 0 || rawVal > 180) return;

    setInputValue('');
    saveStateForUndo();

    let pointsScored = rawVal;
    if (inputMode === 'remaining') {
      if (rawVal === 0) {
        pointsScored = scoreRemaining;
      } else if (rawVal < scoreRemaining) {
        pointsScored = scoreRemaining - rawVal;
      } else {
        return;
      }
      setInputMode('score');
    }

    const startScore = scoreRemaining;
    const endScore = startScore - pointsScored;

    // Bust
    const isBust = endScore < 0 || endScore === 1;
    const isCheckout = endScore === 0;

    if (isBust) {
      sound.miss();
      const nextDarts = currentAttemptDarts + 3;
      storage.recordDartsThrown(3);
      setCurrentAttemptDarts(nextDarts);
      setTotalSessionDarts((prev) => prev + 3);

      if (nextDarts >= dartLimit) {
        // Exceeded limit -> FAIL to checkpoint
        handleDirectNoFail();
      }
      return;
    }

    if (isCheckout) {
      // Finished via keypad!
      const totalDartsSoFar = currentAttemptDarts + 3;
      const isNewCp = totalDartsSoFar <= cpThreshold;

      setPendingCheckout({
        target: currentTarget,
        dartsUsed: totalDartsSoFar,
        isNewCheckpoint: isNewCp,
      });

      setLastCheckoutScore(startScore);
      setShowCheckoutDartsModal(true);
      return;
    }

    // Normal visit score
    sound.hit();
    storage.recordDartsThrown(3);
    const nextDarts = currentAttemptDarts + 3;
    const nextRemaining = endScore;

    setScoreRemaining(nextRemaining);
    setCurrentAttemptDarts(nextDarts);
    setCurrentAttemptVisits((prev) => [...prev, pointsScored]);
    setTotalSessionDarts((prev) => prev + 3);

    // Prompt for darts at double if we are on a finish or were on a finish
    const wasOnDoubleRange = startScore <= 170 && startScore >= 2 && !BOGEY_NUMBERS.includes(startScore);
    if (wasOnDoubleRange) {
      setShowDartsAtDoubleModal(true);
    }

    // If reached dart limit without checking out -> FAIL to checkpoint
    if (nextDarts >= dartLimit) {
      setTimeout(() => {
        handleDirectNoFail();
      }, 300);
    }
  };

  // Step 1 of finish modal: Checkout darts confirmed
  const handleConfirmCheckoutDarts = () => {
    setShowCheckoutDartsModal(false);
    setShowDartsAtDoubleModal(true);
  };

  // Step 2 of finish modal: Darts at double confirmed
  const handleConfirmDartsAtDouble = (dartsAtDbl: number) => {
    setShowDartsAtDoubleModal(false);
    if (!pendingCheckout) return;

    commitCheckout(pendingCheckout, dartsAtDbl);
    setPendingCheckout(null);
  };

  const commitCheckout = (data: PendingCheckoutData, dartsAtDbl: number) => {
    sound.checkout();
    try {
      confetti({ particleCount: 50, spread: 65, origin: { y: 0.7 } });
    } catch {
      // ignore
    }

    const nextAttempts = attempts + 1;
    const nextCheckouts = checkouts + 1;
    const nextDartsAtDouble = totalDartsAtDouble + dartsAtDbl;
    const nextDoublesHit = totalDoublesHit + 1;
    const nextBest = bestCheckoutDarts === null ? data.dartsUsed : Math.min(bestCheckoutDarts, data.dartsUsed);

    // If <= cpThreshold, lock checkpoint!
    let nextCheckpoint = checkpoint;
    if (data.isNewCheckpoint || data.dartsUsed <= cpThreshold) {
      sound.lock();
      nextCheckpoint = data.target;
    }

    const nextTarget = data.target + 1;
    const nextHighest = Math.max(highestReached, nextTarget);
    const nextTotalDarts = totalSessionDarts + (data.dartsUsed > currentAttemptDarts ? data.dartsUsed - currentAttemptDarts : 3);

    setAttempts(nextAttempts);
    setCheckouts(nextCheckouts);
    setTotalDartsAtDouble(nextDartsAtDouble);
    setTotalDoublesHit(nextDoublesHit);
    setBestCheckoutDarts(nextBest);
    setCheckpoint(nextCheckpoint);
    setCurrentTarget(nextTarget);
    setScoreRemaining(nextTarget);
    setHighestReached(nextHighest);
    setCurrentAttemptDarts(0);
    setCurrentAttemptVisits([]);
    setTotalSessionDarts(nextTotalDarts);
    setInputValue('');

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

  // Keypad inputs
  const handleDigit = (d: string) => {
    sound.tap();
    setInputValue((prev) => {
      const next = prev === '0' ? d : prev + d;
      const num = parseInt(next, 10);
      const limit = inputMode === 'remaining' ? scoreRemaining : 180;
      return !isNaN(num) && num <= limit ? next : prev;
    });
  };

  const handleClear = () => {
    sound.tap();
    setInputValue('');
  };

  const checkoutRate = attempts > 0 ? ((checkouts / attempts) * 100).toFixed(0) : '0';

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto flex flex-col space-y-2 select-none touch-manipulation">
      {/* Top Header Bar matching 121.jpg */}
      <div className="flex items-center justify-between px-1 py-1 text-neutral-300">
        <button
          type="button"
          onClick={onExit}
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h2 className="text-lg font-bold text-white tracking-wide">Game 121</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyStack.length === 0}
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

      {/* Target & Metric Card with Green Outline matching 121.jpg */}
      <div className="bg-[#101412] border-2 border-[#2e7d32] rounded-2xl p-4 sm:p-5 text-center shadow-lg relative overflow-hidden">
        <div className="grid grid-cols-2 gap-2 text-left">
          {/* Top Left: Target */}
          <div>
            <span className="text-xs font-semibold text-neutral-400 block">Target:</span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight">
              {scoreRemaining !== currentTarget ? (
                <span className="text-emerald-400">{scoreRemaining} <span className="text-xs font-sans text-neutral-400 font-normal">({currentTarget})</span></span>
              ) : (
                currentTarget
              )}
            </div>
          </div>

          {/* Top Right: Attempts */}
          <div className="text-right">
            <span className="text-xs font-semibold text-neutral-400 block">Attempts</span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              {attempts} <span className="text-neutral-500 text-lg">/ 10</span>
            </div>
          </div>

          {/* Bottom Left: finishes made */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-neutral-400 block">finishes made</span>
            <div className="text-lg sm:text-xl font-bold text-white">
              {checkouts} <span className="text-neutral-400 text-sm font-normal ml-2">{checkoutRate}%</span>
            </div>
          </div>

          {/* Bottom Right: Darts */}
          <div className="text-right pt-2">
            <span className="text-xs font-semibold text-neutral-400 block">Darts</span>
            <div className="text-lg sm:text-xl font-bold text-white font-mono">
              {currentAttemptDarts} <span className="text-neutral-500 text-xs font-normal">/ {dartLimit}</span>
            </div>
          </div>
        </div>

        {/* Checkpoint Tag */}
        <div className="mt-2 pt-2 border-t border-[#1e4624] flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <Bookmark className="w-3.5 h-3.5" /> Checkpoint: {checkpoint}
          </span>
          <span className="text-[11px] text-neutral-400">
            {currentAttemptDarts <= cpThreshold ? (
              <span className="text-emerald-400 font-bold">≤ {cpThreshold} darts to LOCK</span>
            ) : (
              <span className="text-neutral-400">Advance only</span>
            )}
          </span>
        </div>
      </div>

      {/* Green Banner matching 121.jpg ("yes with 6 darts") */}
      <div className="bg-[#183a22] border border-[#2d6a3f] rounded-xl py-2 px-3 text-center text-xs sm:text-sm font-bold text-emerald-200 shadow-xs flex items-center justify-center gap-2">
        <Flame className="w-4 h-4 text-emerald-400" />
        <span>
          {currentAttemptDarts > 0
            ? `Current Attempt: ${currentAttemptDarts} darts used (≤ ${cpThreshold} to lock)`
            : `yes with ${cpThreshold} darts (locks new checkpoint)`}
        </span>
      </div>

      {/* Prompt Subtitle matching 121.jpg */}
      <div className="text-center text-xs sm:text-sm font-bold text-neutral-300">
        checkout with max.{dartLimit} Darts?
      </div>

      {/* Two Large Action Buttons: [Yes] (green) and [No] (dark red) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          id="one21-btn-yes"
          onClick={handleDirectYesCheckout}
          className="h-16 sm:h-18 rounded-2xl bg-[#1b4332] hover:bg-[#2d6a4f] active:scale-95 text-white font-black text-xl border border-[#40916c] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          <span>Yes</span>
        </button>

        <button
          type="button"
          id="one21-btn-no"
          onClick={handleDirectNoFail}
          className="h-16 sm:h-18 rounded-2xl bg-[#2e1d21] hover:bg-[#3d242a] active:scale-95 text-rose-200 hover:text-white font-black text-xl border border-[#522932] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <X className="w-6 h-6 stroke-[3]" />
          <span>No</span>
        </button>
      </div>

      {/* Suggested Checkout Route Bar */}
      {suggestedRoute && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#131916] border border-[#203a27] text-xs font-mono font-bold text-emerald-300">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Route: {suggestedRoute}</span>
          </div>
          {onOpenCheckoutAi && (
            <button
              type="button"
              onClick={() => onOpenCheckoutAi(scoreRemaining)}
              className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md hover:bg-emerald-500/30 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>AI Tip</span>
            </button>
          )}
        </div>
      )}

      {/* X01 Input Bar: [Startscore] | [Score Box] | [remaining / OK] */}
      <div className="grid grid-cols-12 gap-1.5 items-center">
        <button
          type="button"
          id="one21-startscore-btn"
          onClick={handleStartScoreReset}
          className="col-span-4 h-11 sm:h-12 rounded-xl bg-[#20252b] hover:bg-[#282f37] active:scale-95 text-neutral-300 hover:text-white font-bold text-xs sm:text-sm border border-[#303841] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          Startscore
        </button>

        <div className="col-span-4 h-11 sm:h-12 rounded-xl bg-[#0c0e11] border-2 border-[#232930] flex flex-col items-center justify-center text-center font-mono font-black text-white text-xl shadow-inner">
          {inputValue !== '' ? (
            <span>{inputValue}</span>
          ) : (
            <span className="text-neutral-600 font-normal text-xs">Score</span>
          )}
        </div>

        <button
          type="button"
          id="one21-remaining-btn"
          onClick={() => {
            if (inputValue) {
              handleKeypadSubmit();
            } else {
              setInputMode((prev) => (prev === 'score' ? 'remaining' : 'score'));
            }
          }}
          className={`col-span-4 h-11 sm:h-12 rounded-xl font-black text-xs sm:text-sm border flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs ${
            inputValue
              ? 'bg-[#1b4332] hover:bg-[#2d6a4f] text-white border-[#40916c]'
              : inputMode === 'remaining'
              ? 'bg-[#1a2d38] hover:bg-[#223b49] text-cyan-300 border-[#2d5267]'
              : 'bg-[#112a1d] hover:bg-[#163826] text-emerald-400 border-[#1e5838]'
          }`}
        >
          {inputValue ? 'OK' : inputMode === 'remaining' ? 'SCORE' : 'remaining'}
        </button>
      </div>

      {/* 3-Column Keypad matching 121.jpg */}
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
          onClick={() => handleKeypadSubmit()}
          className="h-12 sm:h-14 rounded-2xl bg-[#1b4332] hover:bg-[#2d6a4f] active:scale-95 text-emerald-300 hover:text-white font-black text-sm sm:text-base border border-[#40916c] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          OK
        </button>
      </div>

      {/* Checkout Darts Modal */}
      <CheckoutDartsModal
        isOpen={showCheckoutDartsModal}
        targetScore={lastCheckoutScore}
        onConfirm={handleConfirmCheckoutDarts}
      />

      {/* Darts At Double Modal */}
      <DartsAtDoubleModal
        isOpen={showDartsAtDoubleModal}
        targetScore={lastCheckoutScore || scoreRemaining}
        isCheckedOut={pendingCheckout !== null}
        contextDescription={
          pendingCheckout
            ? `Checked out target ${pendingCheckout.target} in ${pendingCheckout.dartsUsed} darts!`
            : `Target ${currentTarget} visit`
        }
        onSelect={handleConfirmDartsAtDouble}
      />

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
              Start at target <b>121</b>. You have a maximum of <b>{dartLimit} darts</b> to check out each target.
            </p>
            <div className="bg-[#1a2027] p-3 rounded-xl border border-[#2c3642] space-y-1.5 text-xs">
              <div className="text-emerald-400 font-bold">
                • Finish in ≤ {cpThreshold} darts:
                <div className="text-neutral-300 font-normal pl-3">
                  Locks target as your new Checkpoint and advances to next number!
                </div>
              </div>
              <div className="text-amber-400 font-bold">
                • Finish in {cpThreshold + 1}–{dartLimit} darts:
                <div className="text-neutral-300 font-normal pl-3">
                  Advances target by +1 (checkpoint stays unchanged).
                </div>
              </div>
              <div className="text-rose-400 font-bold">
                • Fail / Exceed {dartLimit} darts:
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
