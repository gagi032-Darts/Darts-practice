import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, RotateCcw, Check, X, ShieldAlert, Undo2, Flame, Award, ChevronRight, Play, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Bobs27Result, Bobs27RunRecord, Bobs27TargetAttempt } from '../../types';
import { sound } from '../../utils/sound';

interface Bobs27GameProps {
  isFinalInput?: boolean;
  onFinish: (result: Bobs27Result) => void;
}

export interface Bobs27TargetDef {
  label: string; // 'D1', 'D2', ... 'D20', 'Bull'
  number: number; // 1 to 20, 25 for Bull
  doubleValue: number; // 2, 4, 6, ... 40, 50
}

export const BOBS_27_TARGETS: Bobs27TargetDef[] = [
  { label: 'D1', number: 1, doubleValue: 2 },
  { label: 'D2', number: 2, doubleValue: 4 },
  { label: 'D3', number: 3, doubleValue: 6 },
  { label: 'D4', number: 4, doubleValue: 8 },
  { label: 'D5', number: 5, doubleValue: 10 },
  { label: 'D6', number: 6, doubleValue: 12 },
  { label: 'D7', number: 7, doubleValue: 14 },
  { label: 'D8', number: 8, doubleValue: 16 },
  { label: 'D9', number: 9, doubleValue: 18 },
  { label: 'D10', number: 10, doubleValue: 20 },
  { label: 'D11', number: 11, doubleValue: 22 },
  { label: 'D12', number: 12, doubleValue: 24 },
  { label: 'D13', number: 13, doubleValue: 26 },
  { label: 'D14', number: 14, doubleValue: 28 },
  { label: 'D15', number: 15, doubleValue: 30 },
  { label: 'D16', number: 16, doubleValue: 32 },
  { label: 'D17', number: 17, doubleValue: 34 },
  { label: 'D18', number: 18, doubleValue: 36 },
  { label: 'D19', number: 19, doubleValue: 38 },
  { label: 'D20', number: 20, doubleValue: 40 },
  { label: 'Bull', number: 25, doubleValue: 50 },
];

export const Bobs27Game: React.FC<Bobs27GameProps> = ({
  isFinalInput,
  onFinish,
}) => {
  // Current Run State
  const [currentRunNumber, setCurrentRunNumber] = useState<number>(1);
  const [currentScore, setCurrentScore] = useState<number>(27);
  const [targetIndex, setTargetIndex] = useState<number>(0);
  const [runHistory, setRunHistory] = useState<Bobs27TargetAttempt[]>([]);
  const [runStatus, setRunStatus] = useState<'active' | 'busted' | 'completed'>('active');

  // Multi-Run Session State
  const [allRuns, setAllRuns] = useState<Bobs27RunRecord[]>([]);
  const [totalSessionDarts, setTotalSessionDarts] = useState<number>(0);
  const [totalSessionHits, setTotalSessionHits] = useState<number>(0);

  // Target Specific Stats across whole session
  const [targetStats, setTargetStats] = useState<Record<string, { attempts: number; hits: number }>>(() => {
    const init: Record<string, { attempts: number; hits: number }> = {};
    BOBS_27_TARGETS.forEach((t) => {
      init[t.label] = { attempts: 0, hits: 0 };
    });
    return init;
  });

  // Interactive 3-dart selection for current visit
  const [dart1Hit, setDart1Hit] = useState<boolean>(false);
  const [dart2Hit, setDart2Hit] = useState<boolean>(false);
  const [dart3Hit, setDart3Hit] = useState<boolean>(false);

  // Time-up modal state
  const [showTimeUpModal, setShowTimeUpModal] = useState<boolean>(false);
  const [hasDismissedTimeUp, setHasDismissedTimeUp] = useState<boolean>(false);

  // Active target definition
  const currentTarget = useMemo(() => {
    return BOBS_27_TARGETS[targetIndex] || BOBS_27_TARGETS[BOBS_27_TARGETS.length - 1];
  }, [targetIndex]);

  // Selected hits count from 3-dart toggles
  const selectedHitsCount = (dart1Hit ? 1 : 0) + (dart2Hit ? 1 : 0) + (dart3Hit ? 1 : 0);

  // Handle parent 10-minute timer expiration
  useEffect(() => {
    if (isFinalInput && !hasDismissedTimeUp) {
      setShowTimeUpModal(true);
    }
  }, [isFinalInput, hasDismissedTimeUp]);

  // Best score in session so far
  const bestScoreInSession = useMemo(() => {
    let best = -999;
    allRuns.forEach((r) => {
      if (r.finalScore > best) best = r.finalScore;
    });
    if (runStatus === 'active' && currentScore > best) {
      best = currentScore;
    }
    return best === -999 ? currentScore : best;
  }, [allRuns, currentScore, runStatus]);

  // Reset 3-dart selector for next target
  const resetDartInputs = useCallback(() => {
    setDart1Hit(false);
    setDart2Hit(false);
    setDart3Hit(false);
  }, []);

  // Submit a turn with specific hits count (0, 1, 2, or 3)
  const handleScoreSubmit = (hitsCount: number) => {
    if (runStatus !== 'active') return;

    sound.tap();
    const target = currentTarget;
    const isMiss = hitsCount === 0;
    const delta = isMiss ? -target.doubleValue : hitsCount * target.doubleValue;
    const newScore = currentScore + delta;

    if (isMiss) {
      sound.miss();
    } else {
      if (hitsCount === 3) {
        sound.oneEighty();
      } else {
        sound.hit();
      }
    }

    const attemptRecord: Bobs27TargetAttempt = {
      target: target.label,
      doubleValue: target.doubleValue,
      hits: hitsCount,
      scoreBefore: currentScore,
      scoreAfter: newScore,
      pointsDelta: delta,
    };

    const nextRunHistory = [...runHistory, attemptRecord];
    setRunHistory(nextRunHistory);
    setCurrentScore(newScore);

    // Update target stats
    setTargetStats((prev) => ({
      ...prev,
      [target.label]: {
        attempts: (prev[target.label]?.attempts || 0) + 3,
        hits: (prev[target.label]?.hits || 0) + hitsCount,
      },
    }));

    setTotalSessionDarts((prev) => prev + 3);
    setTotalSessionHits((prev) => prev + hitsCount);

    resetDartInputs();

    // Check Bust Condition (score <= 0)
    if (newScore <= 0) {
      sound.bust();
      setRunStatus('busted');

      const totalDartsInRun = (targetIndex + 1) * 3;
      const totalHitsInRun = nextRunHistory.reduce((acc, h) => acc + h.hits, 0);
      const accPct = totalDartsInRun > 0 ? Math.round((totalHitsInRun / totalDartsInRun) * 100) : 0;

      const finishedRunRecord: Bobs27RunRecord = {
        runNumber: currentRunNumber,
        finalScore: newScore,
        completed: false,
        bustedAtTarget: target.label,
        targetsAttempted: targetIndex + 1,
        totalDarts: totalDartsInRun,
        totalHits: totalHitsInRun,
        accuracy: accPct,
        targetHistory: nextRunHistory,
      };

      setAllRuns((prev) => [...prev, finishedRunRecord]);
      return;
    }

    // Check Completed 21 targets Condition
    if (targetIndex >= BOBS_27_TARGETS.length - 1) {
      sound.checkout();
      try {
        confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
      setRunStatus('completed');

      const totalDartsInRun = BOBS_27_TARGETS.length * 3; // 63 darts
      const totalHitsInRun = nextRunHistory.reduce((acc, h) => acc + h.hits, 0);
      const accPct = totalDartsInRun > 0 ? Math.round((totalHitsInRun / totalDartsInRun) * 100) : 0;

      const finishedRunRecord: Bobs27RunRecord = {
        runNumber: currentRunNumber,
        finalScore: newScore,
        completed: true,
        bustedAtTarget: null,
        targetsAttempted: 21,
        totalDarts: totalDartsInRun,
        totalHits: totalHitsInRun,
        accuracy: accPct,
        targetHistory: nextRunHistory,
      };

      setAllRuns((prev) => [...prev, finishedRunRecord]);
      return;
    }

    // Advance to next target
    setTargetIndex((prev) => prev + 1);
  };

  // Undo last target entry
  const handleUndo = () => {
    if (runHistory.length === 0) return;
    sound.tap();

    const lastEntry = runHistory[runHistory.length - 1];
    const newHistory = runHistory.slice(0, -1);

    setCurrentScore(lastEntry.scoreBefore);
    setRunHistory(newHistory);

    // If we were busted or completed, return to active
    if (runStatus !== 'active') {
      setRunStatus('active');
      // Remove last run from allRuns
      setAllRuns((prev) => prev.filter((r) => r.runNumber !== currentRunNumber));
    } else {
      setTargetIndex((prev) => Math.max(0, prev - 1));
    }

    // Revert session aggregates
    setTotalSessionDarts((prev) => Math.max(0, prev - 3));
    setTotalSessionHits((prev) => Math.max(0, prev - lastEntry.hits));

    // Revert target stats
    setTargetStats((prev) => ({
      ...prev,
      [lastEntry.target]: {
        attempts: Math.max(0, (prev[lastEntry.target]?.attempts || 0) - 3),
        hits: Math.max(0, (prev[lastEntry.target]?.hits || 0) - lastEntry.hits),
      },
    }));

    resetDartInputs();
  };

  // Start next run within current 10-minute session
  const handleStartNextRun = () => {
    sound.tap();
    setCurrentRunNumber((prev) => prev + 1);
    setCurrentScore(27);
    setTargetIndex(0);
    setRunHistory([]);
    setRunStatus('active');
    resetDartInputs();
  };

  // Compile final results & trigger finish
  const handleFinishSession = () => {
    sound.lock();

    // If active run has some progress and not yet recorded, add it to run records
    let finalRunList = [...allRuns];
    if (runStatus === 'active' && runHistory.length > 0) {
      const runDarts = runHistory.length * 3;
      const runHits = runHistory.reduce((acc, h) => acc + h.hits, 0);
      const acc = runDarts > 0 ? Math.round((runHits / runDarts) * 100) : 0;
      finalRunList.push({
        runNumber: currentRunNumber,
        finalScore: currentScore,
        completed: false,
        bustedAtTarget: null,
        targetsAttempted: runHistory.length,
        totalDarts: runDarts,
        totalHits: runHits,
        accuracy: acc,
        targetHistory: runHistory,
      });
    }

    const runsPlayed = Math.max(1, finalRunList.length);
    const completedRuns = finalRunList.filter((r) => r.completed).length;
    const bustedRuns = finalRunList.filter((r) => !r.completed && r.finalScore <= 0).length;

    let bestScore = -999;
    let totalScoreSum = 0;
    finalRunList.forEach((r) => {
      if (r.finalScore > bestScore) bestScore = r.finalScore;
      totalScoreSum += r.finalScore;
    });
    if (bestScore === -999) bestScore = currentScore;
    const avgScore = Math.round(totalScoreSum / runsPlayed);

    const overallAccuracy =
      totalSessionDarts > 0 ? Math.round((totalSessionHits / totalSessionDarts) * 100) : 0;

    let highestTargetReachedOnBust: string | null = null;
    const bustedWithTargets = finalRunList.filter((r) => !r.completed && r.bustedAtTarget);
    if (bustedWithTargets.length > 0) {
      bustedWithTargets.sort((a, b) => b.targetsAttempted - a.targetsAttempted);
      highestTargetReachedOnBust = bustedWithTargets[0].bustedAtTarget || null;
    }

    const finalResult: Bobs27Result = {
      runsPlayed,
      completedRuns,
      bustedRuns,
      bestScore,
      averageScore: avgScore,
      totalDarts: totalSessionDarts > 0 ? totalSessionDarts : runHistory.length * 3,
      totalHits: totalSessionHits,
      overallAccuracy,
      highestTargetReachedOnBust,
      runDetails: finalRunList,
      targetStats,
    };

    onFinish(finalResult);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">
            #{currentRunNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Run #{currentRunNumber}
              </span>
              {runStatus === 'busted' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  BUSTED
                </span>
              ) : runStatus === 'completed' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  CLEARED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  IN PLAY
                </span>
              )}
            </div>
            <span className="text-xs text-neutral-300 font-mono">
              Target {targetIndex + 1} of 21 · <b className="text-amber-400">{currentTarget.label}</b>
            </span>
          </div>
        </div>

        {/* Quick Session Stats */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="hidden sm:block text-right">
            <span className="text-[10px] text-neutral-500 uppercase block font-sans font-bold">
              Session Best
            </span>
            <span className="font-bold text-amber-400">{bestScoreInSession} pts</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-neutral-500 uppercase block font-sans font-bold">
              Doubles Hit
            </span>
            <span className="font-bold text-emerald-400">
              {totalSessionHits} <span className="text-neutral-500 font-normal">/ {totalSessionDarts}d</span>
            </span>
          </div>

          {/* End Session Early Button */}
          <button
            type="button"
            onClick={handleFinishSession}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Finish</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden text-center space-y-6">
        {/* Large Score & Target Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Current Score Counter */}
          <div className="bg-[#151921] border border-[#2b3542] rounded-3xl p-5 sm:p-6 shadow-inner relative overflow-hidden flex flex-col items-center justify-center">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
              Current Score
            </span>
            <div
              className={`text-5xl sm:text-6xl font-black font-mono tracking-tight transition-all ${
                currentScore <= 0
                  ? 'text-rose-500'
                  : currentScore < 20
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {currentScore}
            </div>

            {/* Score status note */}
            <div className="mt-2 text-xs font-mono">
              {currentScore <= 0 ? (
                <span className="text-rose-400 font-bold">💥 Score dropped to 0 or below</span>
              ) : currentScore < 20 ? (
                <span className="text-amber-400 font-bold">⚠️ Danger Zone — Miss = Bust risk!</span>
              ) : (
                <span className="text-neutral-400">Start: 27 pts · Don't drop to 0</span>
              )}
            </div>
          </div>

          {/* Current Active Target Card */}
          <div className="bg-[#151921] border border-[#2b3542] rounded-3xl p-5 sm:p-6 shadow-inner flex flex-col items-center justify-center relative">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Active Double Target
            </span>

            <div className="flex items-center justify-center gap-3 my-1">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                {currentTarget.label}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-sm">
                +{currentTarget.doubleValue} pts/hit
              </span>
            </div>

            <p className="text-xs text-neutral-400 font-mono mt-1">
              Throw 3 darts at <b className="text-white">{currentTarget.label}</b> (Miss = -{currentTarget.doubleValue} pts)
            </p>
          </div>
        </div>

        {/* Action Controls / Input Interface (Dart-by-Dart Entry) */}
        {runStatus === 'active' ? (
          <div className="bg-[#151921] border border-[#2b3542] rounded-3xl p-5 sm:p-6 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                Dart-by-Dart Entry ({currentTarget.label})
              </span>
              <span className="text-xs font-mono text-neutral-400">
                {selectedHitsCount} of 3 Hits ({selectedHitsCount === 0 ? `-${currentTarget.doubleValue}` : `+${selectedHitsCount * currentTarget.doubleValue}`} pts)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {/* Dart 1 */}
              <button
                type="button"
                onClick={() => setDart1Hit(!dart1Hit)}
                className={`h-16 sm:h-20 rounded-2xl font-mono text-xs sm:text-sm font-bold transition-all border flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                  dart1Hit
                    ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-lg ring-2 ring-emerald-500/30'
                    : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {dart1Hit ? <Check className="w-4 h-4 text-white" /> : <X className="w-4 h-4 text-neutral-500" />}
                  <span className="font-sans text-xs">Dart 1</span>
                </div>
                <span className={`text-xs font-bold ${dart1Hit ? 'text-white' : 'text-neutral-500'}`}>
                  {dart1Hit ? 'HIT (Double)' : 'MISS'}
                </span>
              </button>

              {/* Dart 2 */}
              <button
                type="button"
                onClick={() => setDart2Hit(!dart2Hit)}
                className={`h-16 sm:h-20 rounded-2xl font-mono text-xs sm:text-sm font-bold transition-all border flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                  dart2Hit
                    ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-lg ring-2 ring-emerald-500/30'
                    : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {dart2Hit ? <Check className="w-4 h-4 text-white" /> : <X className="w-4 h-4 text-neutral-500" />}
                  <span className="font-sans text-xs">Dart 2</span>
                </div>
                <span className={`text-xs font-bold ${dart2Hit ? 'text-white' : 'text-neutral-500'}`}>
                  {dart2Hit ? 'HIT (Double)' : 'MISS'}
                </span>
              </button>

              {/* Dart 3 */}
              <button
                type="button"
                onClick={() => setDart3Hit(!dart3Hit)}
                className={`h-16 sm:h-20 rounded-2xl font-mono text-xs sm:text-sm font-bold transition-all border flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                  dart3Hit
                    ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-lg ring-2 ring-emerald-500/30'
                    : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {dart3Hit ? <Check className="w-4 h-4 text-white" /> : <X className="w-4 h-4 text-neutral-500" />}
                  <span className="font-sans text-xs">Dart 3</span>
                </div>
                <span className={`text-xs font-bold ${dart3Hit ? 'text-white' : 'text-neutral-500'}`}>
                  {dart3Hit ? 'HIT (Double)' : 'MISS'}
                </span>
              </button>
            </div>

            {/* Submit Selected Darts */}
            <button
              type="button"
              onClick={() => handleScoreSubmit(selectedHitsCount)}
              className={`w-full h-13 sm:h-14 rounded-2xl font-bold text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                selectedHitsCount > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20'
                  : 'bg-neutral-800 hover:bg-rose-900/60 border border-neutral-700 hover:border-rose-700 text-neutral-200 hover:text-rose-200'
              }`}
            >
              <span>
                Submit Turn: {selectedHitsCount} Hit{selectedHitsCount !== 1 ? 's' : ''} (
                {selectedHitsCount === 0
                  ? `-${currentTarget.doubleValue} pts → ${currentScore - currentTarget.doubleValue}`
                  : `+${selectedHitsCount * currentTarget.doubleValue} pts → ${currentScore + selectedHitsCount * currentTarget.doubleValue}`}
                )
              </span>
            </button>
          </div>
        ) : runStatus === 'busted' ? (
          /* Run Busted Notification Card */
          <div className="bg-rose-950/40 border border-rose-700/60 rounded-3xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-1">
                Run #{currentRunNumber} Busted!
              </span>
              <h3 className="text-2xl font-black text-white">
                Busted on {currentTarget.label} (Score: {currentScore})
              </h3>
              <p className="text-xs text-neutral-300 font-mono mt-1">
                Reached target {targetIndex + 1} of 21 · Hits: {runHistory.reduce((acc, h) => acc + h.hits, 0)}/{runHistory.length * 3} darts
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleStartNextRun}
                className="h-13 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Flame className="w-5 h-5 fill-current" />
                <span>Start Run #{currentRunNumber + 1}</span>
              </button>

              <button
                type="button"
                onClick={handleFinishSession}
                className="h-13 rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white font-bold text-sm border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>End Session & View Summary</span>
              </button>
            </div>
          </div>
        ) : (
          /* Run Completed Notification Card (Cleared all 21 doubles) */
          <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-3xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                🎉 Congratulations! Full Board Cleared!
              </span>
              <h3 className="text-3xl font-black text-white font-mono">
                Final Score: <b className="text-emerald-400">{currentScore} pts</b>
              </h3>
              <p className="text-xs text-neutral-300 font-mono mt-1">
                Cleared all 21 targets from D1 to Bullseye · Hits: {runHistory.reduce((acc, h) => acc + h.hits, 0)}/63 darts
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleStartNextRun}
                className="h-13 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-neutral-950 font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Flame className="w-5 h-5 fill-current" />
                <span>Play Another Run (#{currentRunNumber + 1})</span>
              </button>

              <button
                type="button"
                onClick={handleFinishSession}
                className="h-13 rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white font-bold text-sm border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>End Session & View Summary</span>
              </button>
            </div>
          </div>
        )}

        {/* Target Sequence Ribbon / Board Progress */}
        <div className="space-y-2 pt-2 border-t border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">
              D1 → D20 → Bullseye Board Sequence
            </span>
            <span className="font-mono text-[11px]">
              {targetIndex + (runStatus !== 'active' ? 1 : 0)} / 21 targets
            </span>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-11 gap-1.5 font-mono text-xs">
            {BOBS_27_TARGETS.map((t, idx) => {
              const attempt = runHistory[idx];
              const isCurrent = idx === targetIndex && runStatus === 'active';
              const isPast = idx < runHistory.length;

              let badgeClass = 'bg-neutral-850/60 border-neutral-800 text-neutral-500';
              if (isCurrent) {
                badgeClass = 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 scale-105 font-bold';
              } else if (isPast) {
                if (attempt.hits > 0) {
                  badgeClass = 'bg-emerald-950/80 border-emerald-700 text-emerald-300 font-bold';
                } else {
                  badgeClass = 'bg-rose-950/80 border-rose-700 text-rose-300';
                }
              }

              return (
                <div
                  key={t.label}
                  className={`p-1.5 rounded-xl border text-center transition-all ${badgeClass}`}
                >
                  <span className="text-[11px] block">{t.label}</span>
                  <span className="text-[9px] block opacity-80">
                    {isPast ? (attempt.hits > 0 ? `+${attempt.pointsDelta}` : `-${t.doubleValue}`) : `${t.doubleValue}p`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Undo button */}
        {runHistory.length > 0 && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleUndo}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-400 hover:text-white border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo Last Target</span>
            </button>
          </div>
        )}
      </div>

      {/* Previous Runs in this 10-minute Session */}
      {allRuns.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Runs Logged in this 10-Min Session
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              {allRuns.length} run{allRuns.length !== 1 ? 's' : ''} completed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-xs">
            {allRuns.map((r) => (
              <div
                key={r.runNumber}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  r.completed
                    ? 'bg-emerald-950/40 border-emerald-800/60'
                    : 'bg-neutral-850 border-neutral-800'
                }`}
              >
                <div>
                  <span className="font-bold text-white block font-sans">
                    Run #{r.runNumber} {r.completed ? '🏆' : ''}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-sans">
                    {r.completed
                      ? 'Full Board Cleared'
                      : `Busted on ${r.bustedAtTarget || 'Target'}`}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-bold block ${
                      r.finalScore <= 0
                        ? 'text-rose-400'
                        : r.completed
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {r.finalScore} pts
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {r.totalHits}/{r.totalDarts} hits ({r.accuracy}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10-Minute Time-Up Modal */}
      {showTimeUpModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
                ⏱️ 10 Minutes Completed!
              </span>
              <h2 className="text-2xl font-black text-white">
                Time is Up
              </h2>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                You've completed your 10-minute Bob's 27 session! Would you like to finish and view your scorecard, or finish your current run?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setShowTimeUpModal(false);
                  setHasDismissedTimeUp(true);
                }}
                className="h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 font-bold text-xs border border-neutral-700 transition-all cursor-pointer"
              >
                Finish Current Run
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTimeUpModal(false);
                  handleFinishSession();
                }}
                className="h-12 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-black text-xs shadow-lg transition-all cursor-pointer"
              >
                View Full Scorecard →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
