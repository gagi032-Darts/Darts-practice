import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Hourglass,
  Flag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Solo301Result } from '../../types';
import { DartsMatchKeypad } from '../common/DartsMatchKeypad';
import { DartsAtDoubleModal } from '../common/DartsAtDoubleModal';
import { CheckoutDartsModal } from '../common/CheckoutDartsModal';
import { getCheckoutRoute, BOGEY_NUMBERS } from '../../utils/checkouts';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface Solo301GameProps {
  isFinalInput: boolean;
  onFinish: (result: Solo301Result) => void;
  onOpenCheckoutAi?: (score: number) => void;
}

interface PendingVisit {
  val: number;
  isBust: boolean;
  isCheckout: boolean;
  startScore: number;
  endScore: number;
}

export const Solo301Game: React.FC<Solo301GameProps> = ({
  isFinalInput,
  onFinish,
  onOpenCheckoutAi,
}) => {
  // Active leg state
  const [currentLegNum, setCurrentLegNum] = useState<number>(1);
  const [scoreRemaining, setScoreRemaining] = useState<number>(301);
  const [legVisits, setLegVisits] = useState<number[]>([]);
  const [legDartsThrown, setLegDartsThrown] = useState<number>(0);

  // Overall session aggregates
  const [completedLegs, setCompletedLegs] = useState<number>(0);
  const [totalVisitsCount, setTotalVisitsCount] = useState<number>(0);
  const [totalDartsThrown, setTotalDartsThrown] = useState<number>(0);
  const [totalPointsScored, setTotalPointsScored] = useState<number>(0);
  const [bestLegDarts, setBestLegDarts] = useState<number | null>(null);

  const [totalDartsAtDouble, setTotalDartsAtDouble] = useState<number>(0);
  const [totalDoublesHit, setTotalDoublesHit] = useState<number>(0);

  // Keypad typed text
  const [inputValue, setInputValue] = useState<string>('');

  // Turn history for full multi-leg undo
  const [visitHistory, setVisitHistory] = useState<{
    legNumber: number;
    startScore: number;
    pointsScored: number;
    endScore: number;
    isCheckout: boolean;
    isBust: boolean;
    dartsThrown: number;
    dartsAtDouble: number;
  }[]>([]);

  // Modals
  const [pendingVisit, setPendingVisit] = useState<PendingVisit | null>(null);
  const [showDartsAtDoubleModal, setShowDartsAtDoubleModal] = useState<boolean>(false);
  const [showCheckoutDartsModal, setShowCheckoutDartsModal] = useState<boolean>(false);
  const [lastCheckoutScore, setLastCheckoutScore] = useState<number>(0);

  // Handle manual session completion (e.g. if player stops before finishing current leg after timer ends)
  const handleManualFinish = () => {
    sound.lock();
    const finalLegsCompleted = completedLegs;
    const finalDarts = totalDartsThrown + (legDartsThrown > 0 ? legDartsThrown : 0);
    const finalPoints = totalPointsScored + (301 - scoreRemaining);
    const finalAvg = finalDarts > 0 ? Number(((finalPoints / finalDarts) * 3).toFixed(2)) : 0;
    const dblPct = totalDartsAtDouble > 0 ? Number(((totalDoublesHit / totalDartsAtDouble) * 100).toFixed(1)) : 0;

    onFinish({
      legsCompleted: finalLegsCompleted,
      totalVisits: totalVisitsCount + legVisits.length,
      bestLegDarts: bestLegDarts,
      totalDarts: finalDarts,
      threeDartAvg: finalAvg,
      dartsAtDouble: totalDartsAtDouble,
      doublesHit: totalDoublesHit,
      doublePercentage: dblPct,
    });
  };

  // Handle visit submission from DartsMatchKeypad
  const handleVisitSubmit = (customVal?: number) => {
    const rawVal = customVal !== undefined ? customVal : parseInt(inputValue, 10);
    if (isNaN(rawVal) || rawVal < 0 || rawVal > 180) return;

    setInputValue('');

    const startScore = scoreRemaining;
    const endScore = startScore - rawVal;

    // Bust conditions: score below 0 or leaves exactly 1 (impossible double-out)
    const isBust = endScore < 0 || endScore === 1;
    const isCheckout = endScore === 0;

    // Check if score was typed on a finish range
    const wasOnDoubleRange = startScore <= 170 && startScore >= 2 && !BOGEY_NUMBERS.includes(startScore);

    const pending: PendingVisit = {
      val: rawVal,
      isBust,
      isCheckout,
      startScore,
      endScore: isBust ? startScore : endScore,
    };

    setPendingVisit(pending);

    if (isCheckout) {
      // Modal to record 1, 2, or 3 darts for the finish
      setLastCheckoutScore(startScore);
      setShowCheckoutDartsModal(true);
    } else if (wasOnDoubleRange) {
      // Prompt darts aimed at double (0, 1, 2, 3)
      setShowDartsAtDoubleModal(true);
    } else {
      // Direct commit without modal
      commitVisit(pending, 0, 3);
    }
  };

  // Step 2: Checkout darts confirmed (1, 2, or 3)
  const handleConfirmCheckoutDarts = () => {
    setShowCheckoutDartsModal(false);
    setShowDartsAtDoubleModal(true);
  };

  // Step 3: Darts at double confirmed (0..3)
  const handleConfirmDartsAtDouble = (dartsAtDbl: number) => {
    setShowDartsAtDoubleModal(false);
    if (!pendingVisit) return;

    const dartsInVisit = 3;
    commitVisit(pendingVisit, dartsAtDbl, dartsInVisit);
  };

  // Commit visit to state and statistics
  const commitVisit = (pending: PendingVisit, dartsAtDbl: number, dartsThrown: number) => {
    const { val, isBust, isCheckout, startScore, endScore } = pending;
    const pointsScored = isBust ? 0 : val;

    if (isCheckout) {
      sound.checkout();
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } else if (isBust) {
      sound.miss();
    } else if (val === 180) {
      sound.oneEighty();
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } else if (val >= 100) {
      sound.lock();
    } else if (val > 0) {
      sound.hit();
    } else {
      sound.miss();
    }

    const nextLegDarts = legDartsThrown + dartsThrown;
    const nextTotalDarts = totalDartsThrown + dartsThrown;
    const nextTotalPoints = totalPointsScored + pointsScored;
    const nextVisits = [...legVisits, pointsScored];
    const nextDartsAtDbl = totalDartsAtDouble + dartsAtDbl;
    const nextDoublesHit = totalDoublesHit + (isCheckout ? 1 : 0);

    storage.recordDartsThrown(dartsThrown);

    setVisitHistory((prev) => [
      ...prev,
      {
        legNumber: currentLegNum,
        startScore,
        pointsScored: val,
        endScore,
        isCheckout,
        isBust,
        dartsThrown,
        dartsAtDouble: dartsAtDbl,
      },
    ]);

    if (isCheckout) {
      // Leg Complete!
      const nextCompletedLegs = completedLegs + 1;
      const nextBest = bestLegDarts === null ? nextLegDarts : Math.min(bestLegDarts, nextLegDarts);

      // If the 20-minute countdown is already at 0, completing this current leg ends the entire drill session!
      if (isFinalInput) {
        const finalAvg = nextTotalDarts > 0 ? Number(((nextTotalPoints / nextTotalDarts) * 3).toFixed(2)) : 0;
        const dblPct = nextDartsAtDbl > 0 ? Number(((nextDoublesHit / nextDartsAtDbl) * 100).toFixed(1)) : 0;

        onFinish({
          legsCompleted: nextCompletedLegs,
          totalVisits: totalVisitsCount + nextVisits.length,
          bestLegDarts: nextBest,
          totalDarts: nextTotalDarts,
          threeDartAvg: finalAvg,
          dartsAtDouble: nextDartsAtDbl,
          doublesHit: nextDoublesHit,
          doublePercentage: dblPct,
        });
        return;
      }

      setCompletedLegs(nextCompletedLegs);
      setBestLegDarts(nextBest);
      setTotalDartsThrown(nextTotalDarts);
      setTotalPointsScored(nextTotalPoints);
      setTotalVisitsCount((prev) => prev + nextVisits.length);
      setTotalDartsAtDouble(nextDartsAtDbl);
      setTotalDoublesHit(nextDoublesHit);

      // Reset for next 301 leg in the 20-min routine
      setCurrentLegNum((prev) => prev + 1);
      setScoreRemaining(301);
      setLegVisits([]);
      setLegDartsThrown(0);
      setPendingVisit(null);
    } else {
      // Ongoing Leg
      setScoreRemaining(endScore);
      setLegVisits(nextVisits);
      setLegDartsThrown(nextLegDarts);
      setTotalDartsThrown(nextTotalDarts);
      setTotalPointsScored(nextTotalPoints);
      setTotalDartsAtDouble(nextDartsAtDbl);
      setPendingVisit(null);
    }
  };

  // Undo Last Visit
  const handleUndo = () => {
    if (visitHistory.length === 0) return;
    sound.tap();

    const last = visitHistory[visitHistory.length - 1];
    setVisitHistory(visitHistory.slice(0, -1));

    storage.recordDartsThrown(-last.dartsThrown);

    if (last.isCheckout) {
      // Revert completed leg
      setCurrentLegNum(last.legNumber);
      setScoreRemaining(last.startScore);
      setCompletedLegs((prev) => Math.max(0, prev - 1));
      setTotalDoublesHit((prev) => Math.max(0, prev - 1));
      setTotalDartsAtDouble((prev) => Math.max(0, prev - last.dartsAtDouble));
      setTotalDartsThrown((prev) => Math.max(0, prev - last.dartsThrown));
      setTotalPointsScored((prev) => Math.max(0, prev - (last.isBust ? 0 : last.pointsScored)));
      // Rebuild leg darts
      const previousLegVisits = visitHistory
        .filter((v) => v.legNumber === last.legNumber && v !== last)
        .map((v) => (v.isBust ? 0 : v.pointsScored));
      setLegVisits(previousLegVisits);
      setLegDartsThrown(previousLegVisits.length * 3);
    } else {
      setScoreRemaining(last.startScore);
      setLegVisits((prev) => prev.slice(0, -1));
      setLegDartsThrown((prev) => Math.max(0, prev - last.dartsThrown));
      setTotalDartsThrown((prev) => Math.max(0, prev - last.dartsThrown));
      setTotalPointsScored((prev) => Math.max(0, prev - (last.isBust ? 0 : last.pointsScored)));
      setTotalDartsAtDouble((prev) => Math.max(0, prev - last.dartsAtDouble));
    }
  };

  // Metrics Calculations
  const activeLegAvg =
    legDartsThrown > 0
      ? Number((((301 - scoreRemaining) / legDartsThrown) * 3).toFixed(2))
      : 0;

  const totalSessionDarts = totalDartsThrown;
  const overallAvg =
    totalSessionDarts > 0
      ? Number(((totalPointsScored / totalSessionDarts) * 3).toFixed(2))
      : 0;

  const checkoutPercentage =
    totalDartsAtDouble > 0
      ? Number(((totalDoublesHit / totalDartsAtDouble) * 100).toFixed(1))
      : null;

  const suggestedRoute = getCheckoutRoute(scoreRemaining);

  const currentLegHistory = visitHistory.filter((v) => v.legNumber === currentLegNum);
  const totalRounds = Math.max(5, currentLegHistory.length);
  const soloVisitsScrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (soloVisitsScrollRef.current) {
      soloVisitsScrollRef.current.scrollTop = soloVisitsScrollRef.current.scrollHeight;
    }
  }, [visitHistory.length]);

  const allRows = [];
  for (let i = 0; i < totalRounds; i++) {
    const v = currentLegHistory[i];
    allRows.push({
      roundIndex: i + 1,
      dartNumber: (i + 1) * 3,
      score: v ? (v.isBust ? 0 : v.pointsScored) : undefined,
      endScore: v?.endScore,
      isBust: v?.isBust,
      isCheckout: v?.isCheckout,
    });
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-2 sm:space-y-3">
      {/* 20-Min Timer Final Leg Notification Banner */}
      {isFinalInput && (
        <div className="bg-amber-950/80 border-2 border-amber-500/80 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-amber-200 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-center sm:text-left">
            <Hourglass className="w-4 h-4 text-amber-400 shrink-0" />
            <span>20-min timer reached! Throw to finish Leg #{currentLegNum} or finish now.</span>
          </div>
          <button
            type="button"
            onClick={handleManualFinish}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Flag className="w-3.5 h-3.5" /> Finish Session
          </button>
        </div>
      )}

      {/* Top Banner Card: Target & Score Remaining */}
      <div className="bg-[#15191e] border border-[#232930] rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-center shadow-xl relative overflow-hidden">
        {/* Header Badges */}
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-1 sm:mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-yellow-400 font-black">
              <Award className="w-4 h-4" /> 301 Solo Practice
            </span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[11px]">
              Leg #{currentLegNum}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {completedLegs > 0 && (
              <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> {completedLegs} Leg{completedLegs > 1 ? 's' : ''} Won
              </span>
            )}
            <span className="text-neutral-400 text-xs font-mono">
              Dart #{legDartsThrown + 1}
            </span>
          </div>
        </div>

        {/* Big Remaining Score Display */}
        <div className="my-1 sm:my-2 flex flex-col items-center justify-center">
          <div className="text-6xl sm:text-8xl font-mono font-black text-white tracking-tight leading-none drop-shadow-md">
            {scoreRemaining}
          </div>
          <span className="text-[11px] sm:text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">
            Points Remaining
          </span>
        </div>

        {/* Suggested Checkout Guide (if on finish) */}
        {suggestedRoute && (
          <div className="mt-2 bg-emerald-950/60 border border-emerald-800/70 rounded-xl p-2 flex items-center justify-between px-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Checkout Route:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-white bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-700">
                {suggestedRoute}
              </span>
              {onOpenCheckoutAi && (
                <button
                  type="button"
                  onClick={() => onOpenCheckoutAi(scoreRemaining)}
                  className="text-[10px] text-emerald-300 underline hover:text-white transition-colors"
                >
                  AI Guide
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Solo Visit History Table (Scrollable, showing 5 visits in view from start) */}
      <div className="bg-[#121519] border border-[#232930] rounded-xl p-1.5 shadow-xs">
        {/* Table Header */}
        <div className="grid grid-cols-3 text-center text-[10px] font-bold text-neutral-400 border-b border-[#232930] pb-1 leading-none uppercase tracking-wider">
          <span className="text-neutral-400 font-semibold">ROUND</span>
          <span className="text-emerald-400 font-black">VISIT SCORE</span>
          <span className="text-cyan-400 font-black">POINTS LEFT</span>
        </div>

        {/* Visits List */}
        <div
          ref={soloVisitsScrollRef}
          className="space-y-1 pt-1 max-h-[155px] min-h-[145px] sm:max-h-[165px] overflow-y-auto overscroll-contain pr-1"
        >
          {allRows.map((row) => (
            <div
              key={row.roundIndex}
              className="grid grid-cols-3 items-center text-center text-xs font-mono py-1 px-1.5 rounded bg-[#181d22]/90 border border-[#20272f] shadow-xs"
            >
              <div className="flex items-center justify-center">
                <span className="text-[10px] text-neutral-400 font-bold px-1.5 py-0.5 rounded bg-[#101317] border border-[#232930]">
                  R{row.roundIndex} <span className="text-neutral-500 font-normal">· {row.dartNumber}d</span>
                </span>
              </div>

              <div className="flex items-center justify-center">
                {row.score !== undefined ? (
                  row.isBust ? (
                    <span className="font-bold text-rose-400 text-[10px] px-1.5 py-0.5 bg-rose-950/60 rounded border border-rose-800/50">
                      BUST
                    </span>
                  ) : row.isCheckout ? (
                    <span className="font-black text-emerald-400 text-xs bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-700">
                      🎯 {row.score} (CHECKOUT)
                    </span>
                  ) : (
                    <span
                      className={`font-black text-sm ${
                        row.score === 180
                          ? 'text-amber-300 font-mono scale-105'
                          : row.score >= 100
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}
                    >
                      {row.score}
                    </span>
                  )
                ) : (
                  <span className="text-neutral-600 font-bold text-xs">—</span>
                )}
              </div>

              <div className="flex items-center justify-center">
                {row.endScore !== undefined ? (
                  <span className="font-black text-xs text-cyan-300 font-mono">
                    {row.endScore}
                  </span>
                ) : (
                  <span className="text-neutral-600 font-bold text-xs">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* X01 5-Column Precision Match Keypad */}
      <div className="bg-[#15191e] border border-[#232930] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl">
        <DartsMatchKeypad
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleVisitSubmit}
          onUndo={handleUndo}
          canUndo={visitHistory.length > 0}
          maxScore={180}
          remainingScore={scoreRemaining}
        />
      </div>

      {/* Live Performance Stats Strip */}
      <div className="bg-[#15191e] border border-[#232930] rounded-2xl p-3 sm:p-4 shadow-md">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-[#1c222a] p-2.5 rounded-xl border border-[#2b3440]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              3-Dart Avg
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-white mt-0.5 block">
              {overallAvg > 0 ? overallAvg : activeLegAvg}
            </span>
          </div>

          <div className="bg-[#1c222a] p-2.5 rounded-xl border border-[#2b3440]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Legs Won
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-yellow-400 mt-0.5 block">
              {completedLegs}
            </span>
          </div>

          <div className="bg-[#1c222a] p-2.5 rounded-xl border border-[#2b3440]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Best Leg
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-emerald-400 mt-0.5 block">
              {bestLegDarts ? `${bestLegDarts} Darts` : '—'}
            </span>
          </div>

          <div className="bg-[#1c222a] p-2.5 rounded-xl border border-[#2b3440]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Double %
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-cyan-400 mt-0.5 block">
              {checkoutPercentage !== null ? `${checkoutPercentage}%` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Darts at Double Tracking Modal */}
      {showDartsAtDoubleModal && (
        <DartsAtDoubleModal
          isOpen={showDartsAtDoubleModal}
          onSelect={handleConfirmDartsAtDouble}
          onClose={() => {
            setShowDartsAtDoubleModal(false);
            if (pendingVisit) {
              commitVisit(pendingVisit, 0, 3);
            }
          }}
        />
      )}

      {/* Checkout Darts Used Modal (1, 2, or 3 darts) */}
      {showCheckoutDartsModal && (
        <CheckoutDartsModal
          isOpen={showCheckoutDartsModal}
          checkoutScore={lastCheckoutScore}
          onSelect={handleConfirmCheckoutDarts}
          onClose={() => {
            setShowCheckoutDartsModal(false);
            setShowDartsAtDoubleModal(true);
          }}
        />
      )}
    </div>
  );
};
