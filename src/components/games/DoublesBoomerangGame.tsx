import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, RotateCcw, Check, X, RotateCw, Undo2, Flame, Award, ChevronRight, Play, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DoublesBoomerangResult, BoomerangRoundRecord } from '../../types';
import { sound } from '../../utils/sound';

interface DoublesBoomerangGameProps {
  isFinalInput?: boolean;
  onFinish: (result: DoublesBoomerangResult) => void;
}

// Clockwise dartboard doubles sequence starting from 1 around to 20
export const CLOCKWISE_DOUBLES: number[] = [
  1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5, 20
];

interface ThrowHistoryItem {
  round: number;
  unhitBefore: number[];
  activeTargets: number[];
  results: ('hit' | 'miss')[];
  roundDartsBefore: number;
  totalHitsBefore: number;
  totalDartsBefore: number;
  completedRoundsBefore: BoomerangRoundRecord[];
  targetStatsBefore: Record<number, { attempts: number; hits: number }>;
}

export const DoublesBoomerangGame: React.FC<DoublesBoomerangGameProps> = ({
  isFinalInput,
  onFinish,
}) => {
  // Round management
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [unhitDoubles, setUnhitDoubles] = useState<number[]>([...CLOCKWISE_DOUBLES]);
  const [roundDarts, setRoundDarts] = useState<number>(0);
  const [completedRounds, setCompletedRounds] = useState<BoomerangRoundRecord[]>([]);

  // Overall session metrics
  const [totalSessionDarts, setTotalSessionDarts] = useState<number>(0);
  const [totalSessionHits, setTotalSessionHits] = useState<number>(0);
  const [bestRoundDarts, setBestRoundDarts] = useState<number | null>(null);

  // Target specific statistics
  const [targetStats, setTargetStats] = useState<Record<number, { attempts: number; hits: number }>>(() => {
    const init: Record<number, { attempts: number; hits: number }> = {};
    CLOCKWISE_DOUBLES.forEach((num) => {
      init[num] = { attempts: 0, hits: 0 };
    });
    return init;
  });

  // Current throw input state (up to 3 darts for the first 3 unhit targets)
  const [dart1Result, setDart1Result] = useState<'hit' | 'miss'>('miss');
  const [dart2Result, setDart2Result] = useState<'hit' | 'miss'>('miss');
  const [dart3Result, setDart3Result] = useState<'hit' | 'miss'>('miss');

  // Undo history stack
  const [history, setHistory] = useState<ThrowHistoryItem[]>([]);

  // Round completion banner flash
  const [roundCompleteBanner, setRoundCompleteBanner] = useState<{
    round: number;
    darts: number;
    accuracy: number;
  } | null>(null);

  // Time-up modal state (allows continuing in overtime or finishing)
  const [showTimeUpModal, setShowTimeUpModal] = useState<boolean>(false);
  const [hasDismissedTimeUp, setHasDismissedTimeUp] = useState<boolean>(false);

  // Get active targets for current visit (up to 3 unhit doubles in sequence)
  const activeTargets = useMemo(() => {
    return unhitDoubles.slice(0, 3);
  }, [unhitDoubles]);

  // Handle parent 20-minute timer expiration
  useEffect(() => {
    if (isFinalInput && !hasDismissedTimeUp) {
      setShowTimeUpModal(true);
    }
  }, [isFinalInput, hasDismissedTimeUp]);

  // Count current selected hits in this visit
  const selectedHitsCount = useMemo(() => {
    let count = 0;
    if (activeTargets.length >= 1 && dart1Result === 'hit') count++;
    if (activeTargets.length >= 2 && dart2Result === 'hit') count++;
    if (activeTargets.length >= 3 && dart3Result === 'hit') count++;
    return count;
  }, [activeTargets.length, dart1Result, dart2Result, dart3Result]);

  // Helper to compile full result payload
  const compileResult = useCallback((): DoublesBoomerangResult => {
    const roundsAttempted = currentRound;
    const finalAccuracy = totalSessionDarts > 0
      ? Number(((totalSessionHits / totalSessionDarts) * 100).toFixed(1))
      : 0;

    return {
      roundsCompleted: completedRounds.length,
      totalRoundsAttempted: roundsAttempted,
      bestRoundDarts,
      totalDarts: totalSessionDarts,
      totalHits: totalSessionHits,
      overallAccuracy: finalAccuracy,
      roundDetails: completedRounds,
      targetStats,
    };
  }, [completedRounds, currentRound, bestRoundDarts, totalSessionDarts, totalSessionHits, targetStats]);

  // Submit and register current throw visit
  const handleRegisterThrow = useCallback(() => {
    if (activeTargets.length === 0) return;

    sound.hit();

    // Snapshot for Undo
    const snapshot: ThrowHistoryItem = {
      round: currentRound,
      unhitBefore: [...unhitDoubles],
      activeTargets: [...activeTargets],
      results: [
        dart1Result,
        ...(activeTargets.length >= 2 ? [dart2Result] : []),
        ...(activeTargets.length >= 3 ? [dart3Result] : []),
      ],
      roundDartsBefore: roundDarts,
      totalHitsBefore: totalSessionHits,
      totalDartsBefore: totalSessionDarts,
      completedRoundsBefore: [...completedRounds],
      targetStatsBefore: JSON.parse(JSON.stringify(targetStats)),
    };
    setHistory((prev) => [...prev, snapshot]);

    const dartsThrownThisVisit = activeTargets.length;
    let visitHits = 0;

    const newTargetStats = { ...targetStats };
    const hitsThisVisit: number[] = [];

    // Evaluate Dart 1
    const t1 = activeTargets[0];
    if (t1 !== undefined) {
      newTargetStats[t1] = {
        attempts: (newTargetStats[t1]?.attempts || 0) + 1,
        hits: (newTargetStats[t1]?.hits || 0) + (dart1Result === 'hit' ? 1 : 0),
      };
      if (dart1Result === 'hit') {
        hitsThisVisit.push(t1);
        visitHits++;
      }
    }

    // Evaluate Dart 2
    if (activeTargets.length >= 2) {
      const t2 = activeTargets[1];
      newTargetStats[t2] = {
        attempts: (newTargetStats[t2]?.attempts || 0) + 1,
        hits: (newTargetStats[t2]?.hits || 0) + (dart2Result === 'hit' ? 1 : 0),
      };
      if (dart2Result === 'hit') {
        hitsThisVisit.push(t2);
        visitHits++;
      }
    }

    // Evaluate Dart 3
    if (activeTargets.length >= 3) {
      const t3 = activeTargets[2];
      newTargetStats[t3] = {
        attempts: (newTargetStats[t3]?.attempts || 0) + 1,
        hits: (newTargetStats[t3]?.hits || 0) + (dart3Result === 'hit' ? 1 : 0),
      };
      if (dart3Result === 'hit') {
        hitsThisVisit.push(t3);
        visitHits++;
      }
    }

    setTargetStats(newTargetStats);

    const newRoundDarts = roundDarts + dartsThrownThisVisit;
    const newTotalDarts = totalSessionDarts + dartsThrownThisVisit;
    const newTotalHits = totalSessionHits + visitHits;

    setRoundDarts(newRoundDarts);
    setTotalSessionDarts(newTotalDarts);
    setTotalSessionHits(newTotalHits);

    // Filter out successfully hit doubles from unhit queue
    const remainingAfterHits = unhitDoubles.filter((num) => !hitsThisVisit.includes(num));

    // Reset dart inputs for next throw
    setDart1Result('miss');
    setDart2Result('miss');
    setDart3Result('miss');

    // Check if Round is Complete!
    if (remainingAfterHits.length === 0) {
      sound.checkout();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#f59e0b', '#3b82f6'],
        });
      } catch {
        // Safe fallback
      }

      const roundAccuracy = Number(((20 / newRoundDarts) * 100).toFixed(1));
      const finishedRecord: BoomerangRoundRecord = {
        round: currentRound,
        darts: newRoundDarts,
        hits: 20,
        accuracy: roundAccuracy,
        completed: true,
      };

      const updatedCompletedRounds = [...completedRounds, finishedRecord];
      setCompletedRounds(updatedCompletedRounds);

      const updatedBestDarts = bestRoundDarts === null
        ? newRoundDarts
        : Math.min(bestRoundDarts, newRoundDarts);
      setBestRoundDarts(updatedBestDarts);

      // Flash celebratory banner
      setRoundCompleteBanner({
        round: currentRound,
        darts: newRoundDarts,
        accuracy: roundAccuracy,
      });
      setTimeout(() => {
        setRoundCompleteBanner(null);
      }, 4000);

      // Advance to next round with full set of doubles
      setCurrentRound((prev) => prev + 1);
      setUnhitDoubles([...CLOCKWISE_DOUBLES]);
      setRoundDarts(0);
    } else {
      setUnhitDoubles(remainingAfterHits);
    }
  }, [
    activeTargets,
    currentRound,
    unhitDoubles,
    dart1Result,
    dart2Result,
    dart3Result,
    roundDarts,
    totalSessionHits,
    totalSessionDarts,
    completedRounds,
    targetStats,
    bestRoundDarts,
  ]);

  // Quick 1-tap: All Miss
  const handleQuickAllMiss = () => {
    sound.tap();
    setDart1Result('miss');
    setDart2Result('miss');
    setDart3Result('miss');
  };

  // Quick 1-tap: All Hit
  const handleQuickAllHit = () => {
    sound.tap();
    if (activeTargets.length >= 1) setDart1Result('hit');
    if (activeTargets.length >= 2) setDart2Result('hit');
    if (activeTargets.length >= 3) setDart3Result('hit');
  };

  // Undo previous throw
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    sound.tap();

    const last = history[history.length - 1];
    setCurrentRound(last.round);
    setUnhitDoubles(last.unhitBefore);
    setRoundDarts(last.roundDartsBefore);
    setTotalSessionHits(last.totalHitsBefore);
    setTotalSessionDarts(last.totalDartsBefore);
    setCompletedRounds(last.completedRoundsBefore);
    setTargetStats(last.targetStatsBefore);

    // Restore previous inputs
    setDart1Result(last.results[0] || 'miss');
    setDart2Result(last.results[1] || 'miss');
    setDart3Result(last.results[2] || 'miss');

    setHistory((prev) => prev.slice(0, -1));
  }, [history]);

  // Keyboard navigation & hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showTimeUpModal) return;

      if (e.key === '1') {
        sound.tap();
        if (activeTargets.length >= 1) {
          setDart1Result((prev) => (prev === 'hit' ? 'miss' : 'hit'));
        }
      } else if (e.key === '2') {
        sound.tap();
        if (activeTargets.length >= 2) {
          setDart2Result((prev) => (prev === 'hit' ? 'miss' : 'hit'));
        }
      } else if (e.key === '3') {
        sound.tap();
        if (activeTargets.length >= 3) {
          setDart3Result((prev) => (prev === 'hit' ? 'miss' : 'hit'));
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleRegisterThrow();
      } else if (e.key.toLowerCase() === 'u' || e.key === 'Backspace') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTargets.length, handleRegisterThrow, handleUndo, showTimeUpModal]);

  // Handle final finish
  const handleFinishDrill = () => {
    sound.tap();
    onFinish(compileResult());
  };

  const currentRoundAccuracy = roundDarts > 0
    ? Number((((20 - unhitDoubles.length) / roundDarts) * 100).toFixed(1))
    : 0;

  const sessionAccuracy = totalSessionDarts > 0
    ? Number(((totalSessionHits / totalSessionDarts) * 100).toFixed(1))
    : 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-3 py-3 sm:py-5 space-y-4 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-br from-neutral-900 via-sky-950/40 to-neutral-900 border border-sky-800/40 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        {/* Subtle background boomerang curve watermark */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 border-[18px] border-sky-500/10 rounded-full pointer-events-none transform -rotate-45" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-sky-400" />
                Doubles Boomerang
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-mono font-black">
                Round {currentRound}
              </span>
            </div>
            <p className="text-xs text-sky-300/80 font-medium mt-0.5">
              Hit all the doubles clockwise once (D1 → D20)
            </p>
          </div>

          {/* Darts Counter (Right) */}
          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
              Round Darts
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
              DARTS: {roundDarts}
            </span>
          </div>
        </div>

        {/* Round Complete Flash Banner */}
        {roundCompleteBanner && (
          <div className="mt-3 bg-emerald-950/90 border border-emerald-500 rounded-2xl p-3 text-center animate-bounce shadow-lg">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
              🎉 Round {roundCompleteBanner.round} Completed!
            </span>
            <span className="text-base font-black text-white font-mono">
              Cleared all 20 doubles in {roundCompleteBanner.darts} darts ({roundCompleteBanner.accuracy}% hit rate)
            </span>
          </div>
        )}
      </div>

      {/* Main 3-Column Dart Targets (Matching photo layout) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
        {/* Dart 1 Column */}
        {activeTargets.length >= 1 ? (
          <div className="bg-neutral-900/95 border border-neutral-750 rounded-2xl p-3 sm:p-4 text-center flex flex-col justify-between shadow-lg relative">
            <div className="space-y-0.5 mb-2">
              <h2 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight font-mono">
                Double {activeTargets[0]}
              </h2>
              <span className="text-[11px] sm:text-xs text-neutral-400 font-medium block">
                1st dart
              </span>
            </div>

            <div className="space-y-2">
              {/* Hit Button */}
              <button
                type="button"
                id="dart1-hit-btn"
                onClick={() => {
                  sound.tap();
                  setDart1Result('hit');
                }}
                className={`w-full py-2.5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border ${
                  dart1Result === 'hit'
                    ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-500/50'
                    : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white border-neutral-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Hit</span>
                <span className="text-[9px] opacity-60 font-mono hidden sm:inline ml-0.5">1</span>
              </button>

              {/* Miss Button (Deep Red like photo) */}
              <button
                type="button"
                id="dart1-miss-btn"
                onClick={() => {
                  sound.tap();
                  setDart1Result('miss');
                }}
                className={`w-full py-2.5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border ${
                  dart1Result === 'miss'
                    ? 'bg-rose-900/90 text-rose-100 border-rose-600 shadow-md ring-2 ring-rose-500/40'
                    : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white border-neutral-700'
                }`}
              >
                <X className="w-4 h-4" />
                <span>Miss</span>
                <span className="text-[9px] opacity-60 font-mono hidden sm:inline ml-0.5">1</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-3 sm:p-4 text-center flex items-center justify-center opacity-40">
            <span className="text-xs text-neutral-500 font-mono">Cleared</span>
          </div>
        )}

        {/* Dart 2 Column */}
        {activeTargets.length >= 2 ? (
          <div className="bg-neutral-900/95 border border-neutral-750 rounded-2xl p-3 sm:p-4 text-center flex flex-col justify-between shadow-lg relative">
            <div className="space-y-0.5 mb-2">
              <h2 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight font-mono">
                Double {activeTargets[1]}
              </h2>
              <span className="text-[11px] sm:text-xs text-neutral-400 font-medium block">
                2nd dart
              </span>
            </div>

            <div className="space-y-2">
              {/* Hit Button */}
              <button
                type="button"
                id="dart2-hit-btn"
                onClick={() => {
                  sound.tap();
                  setDart2Result('hit');
                }}
                className={`w-full py-2.5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border ${
                  dart2Result === 'hit'
                    ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-500/50'
                    : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white border-neutral-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Hit</span>
                <span className="text-[9px] opacity-60 font-mono hidden sm:inline ml-0.5">2</span>
              </button>

              {/* Miss Button */}
              <button
                type="button"
                id="dart2-miss-btn"
                onClick={() => {
                  sound.tap();
                  setDart2Result('miss');
                }}
                className={`w-full py-2.5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border ${
                  dart2Result === 'miss'
                    ? 'bg-rose-900/90 text-rose-100 border-rose-600 shadow-md ring-2 ring-rose-500/40'
                    : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white border-neutral-700'
                }`}
              >
                <X className="w-4 h-4" />
                <span>Miss</span>
                <span className="text-[9px] opacity-60 font-mono hidden sm:inline ml-0.5">2</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-3 sm:p-4 text-center flex items-center justify-center opacity-40">
            <span className="text-xs text-neutral-500 font-mono">Cleared</span>
          </div>
        )}

        {/* Dart 3 Column */}
        {activeTargets.length >= 3 ? (
          <div className="bg-neutral-900/95 border border-neutral-750 rounded-2xl p-3 sm:p-4 text-center flex flex-col justify-between shadow-lg relative">
            <div className="space-y-0.5 mb-2">
              <h2 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight font-mono">
                Double {activeTargets[2]}
              </h2>
              <span className="text-[11px] sm:text-xs text-neutral-400 font-medium block">
                3rd dart
              </span>
            </div>

            <div className="space-y-2">
              {/* Hit Button */}
              <button
                type="button"
                id="dart3-hit-btn"
                onClick={() => {
                  sound.tap();
                  setDart3Result('hit');
                }}
                className={`w-full py-2.5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border ${
                  dart3Result === 'hit'
                    ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-500/50'
                    : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white border-neutral-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Hit</span>
                <span className="text-[9px] opacity-60 font-mono hidden sm:inline ml-0.5">3</span>
              </button>

              {/* Miss Button */}
              <button
                type="button"
                id="dart3-miss-btn"
                onClick={() => {
                  sound.tap();
                  setDart3Result('miss');
                }}
                className={`w-full py-2.5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border ${
                  dart3Result === 'miss'
                    ? 'bg-rose-900/90 text-rose-100 border-rose-600 shadow-md ring-2 ring-rose-500/40'
                    : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white border-neutral-700'
                }`}
              >
                <X className="w-4 h-4" />
                <span>Miss</span>
                <span className="text-[9px] opacity-60 font-mono hidden sm:inline ml-0.5">3</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-3 sm:p-4 text-center flex items-center justify-center opacity-40">
            <span className="text-xs text-neutral-500 font-mono">Cleared</span>
          </div>
        )}
      </div>

      {/* Primary Action Button: "Register X hits" */}
      <div>
        <button
          type="button"
          id="register-hits-btn"
          onClick={handleRegisterThrow}
          className="w-full h-14 sm:h-16 rounded-2xl bg-neutral-900 hover:bg-neutral-850 active:scale-[0.98] border-2 border-emerald-500/80 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 font-black text-base sm:text-lg shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>
            Register {selectedHitsCount} {selectedHitsCount === 1 ? 'hit' : 'hits'}
          </span>
          <ChevronRight className="w-5 h-5 text-emerald-400" />
        </button>
      </div>

      {/* Clockwise Progress Dial / Doubles Roadmap */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2 shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5 text-sky-400" /> Clockwise Doubles Clearance
          </span>
          <span className="text-xs font-mono font-black text-sky-400">
            {20 - unhitDoubles.length} / 20 Locked
          </span>
        </div>

        {/* 20 Doubles Badges Grid */}
        <div className="grid grid-cols-10 gap-1 sm:gap-1.5 pt-1">
          {CLOCKWISE_DOUBLES.map((num) => {
            const isHit = !unhitDoubles.includes(num);
            const activeIdx = activeTargets.indexOf(num);
            const isActive = activeIdx !== -1;

            return (
              <div
                key={num}
                className={`py-1.5 rounded-lg text-center font-mono text-xs font-bold transition-all relative ${
                  isHit
                    ? 'bg-emerald-950/90 border border-emerald-600 text-emerald-300 shadow-xs'
                    : isActive
                    ? 'bg-sky-950 border-2 border-sky-400 text-sky-200 shadow-md ring-2 ring-sky-500/30'
                    : 'bg-neutral-850 border border-neutral-750 text-neutral-400 opacity-60'
                }`}
              >
                <span>D{num}</span>
                {isHit && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 text-[8px] flex items-center justify-center text-neutral-950">
                    ✓
                  </span>
                )}
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-sky-500 text-[8px] font-black flex items-center justify-center text-neutral-950">
                    {activeIdx + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 20-Minute Timer Expired Popup Modal */}
      {showTimeUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-750 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block mb-1">
                ⏱️ 10 Minutes Completed!
              </span>
              <h2 className="text-2xl font-black text-white">
                Time is Up
              </h2>
              <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                You have completed <b className="text-sky-300 font-mono">{completedRounds.length}</b> full round(s).
                You are currently on <b>Round {currentRound}</b> with <b className="text-amber-400 font-mono">{unhitDoubles.length}</b> double(s) left in {roundDarts} darts.
              </p>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-3.5 grid grid-cols-2 gap-2 text-center text-xs">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Best Round</span>
                <span className="text-amber-400 font-mono font-black text-lg">
                  {bestRoundDarts ? `${bestRoundDarts} darts` : '—'}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Hit Accuracy</span>
                <span className="text-emerald-400 font-mono font-black text-lg">
                  {sessionAccuracy}%
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setShowTimeUpModal(false);
                  onFinish(compileResult());
                }}
                className="w-full h-12 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-neutral-950 font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>Finish & View Scorecard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setShowTimeUpModal(false);
                  setHasDismissedTimeUp(true);
                }}
                className="w-full h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white font-bold text-sm border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current text-emerald-400" />
                <span>Continue Playing (Finish Round)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
