import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Trophy,
  RotateCcw,
  Check,
  X,
  Undo2,
  Flame,
  Award,
  ChevronRight,
  Play,
  AlertCircle,
  Compass,
  ArrowRight,
  ArrowLeft,
  Settings2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RTWSinglesDifficulty, RTWSinglesResult, RTWSinglesRunRecord } from '../../types';
import { sound } from '../../utils/sound';

interface RTWSinglesGameProps {
  initialDifficulty?: RTWSinglesDifficulty;
  isFinalInput?: boolean;
  onFinish: (result: RTWSinglesResult) => void;
}

// 21 Steps: 1 to 20, ending with Bullseye
export const RTW_TARGETS: { step: number; label: string; shortLabel: string }[] = [
  ...Array.from({ length: 20 }, (_, i) => ({
    step: i + 1,
    label: `Single ${i + 1}`,
    shortLabel: `S${i + 1}`,
  })),
  { step: 21, label: 'Bullseye', shortLabel: 'Bull' },
];

interface DartHistorySnapshot {
  runNumber: number;
  currentStepBefore: number;
  currentStepAfter: number;
  targetShortLabel: string;
  result: 'hit' | 'miss';
  dartInVisit: number; // 1, 2, or 3
  visitNumber: number;
  consecutiveMissesBefore: number;
  totalMissesInRunBefore: number;
  highestStepInRunBefore: number;
  runStatusBefore: 'active' | 'cleared' | 'game_over';
  runDartsBefore: number;
  runHitsBefore: number;
  runMissesBefore: number;
  sessionDartsBefore: number;
  sessionHitsBefore: number;
  sessionMissesBefore: number;
  completedRunsBefore: RTWSinglesRunRecord[];
  targetStatsBefore: Record<string, { attempts: number; hits: number; misses: number }>;
}

export const RTWSinglesGame: React.FC<RTWSinglesGameProps> = ({
  initialDifficulty = 'intermediate',
  isFinalInput = false,
  onFinish,
}) => {
  // Difficulty Level: Intermediate (3 consecutive misses = Out) or Advanced (5 total misses = Out)
  const [difficulty, setDifficulty] = useState<RTWSinglesDifficulty>(initialDifficulty);
  const [isDifficultyDropdownOpen, setIsDifficultyDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync initialDifficulty if prop changes
  useEffect(() => {
    if (initialDifficulty) {
      setDifficulty(initialDifficulty);
    }
  }, [initialDifficulty]);

  // Click outside to close difficulty dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDifficultyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Run & Session Management
  const [runNumber, setRunNumber] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<number>(1); // 1 to 21 (21 = Bull)
  const [highestStepInRun, setHighestStepInRun] = useState<number>(1);
  const [runStatus, setRunStatus] = useState<'active' | 'cleared' | 'game_over'>('active');
  const [gameOverReason, setGameOverReason] = useState<'strikeout' | 'max_misses' | null>(null);

  // Current Run Counters
  const [consecutiveMisses, setConsecutiveMisses] = useState<number>(0); // for Intermediate (max 3)
  const [totalMissesInRun, setTotalMissesInRun] = useState<number>(0); // for Advanced (max 5)
  const [runDarts, setRunDarts] = useState<number>(0);
  const [runHits, setRunHits] = useState<number>(0);
  const [runMisses, setRunMisses] = useState<number>(0);

  // Visit Darts (1, 2, or 3)
  const [dartInVisit, setDartInVisit] = useState<number>(1); // 1, 2, 3
  const [visitNumber, setVisitNumber] = useState<number>(1);
  const [visitDartsHistory, setVisitDartsHistory] = useState<
    { dartNumber: number; target: string; result: 'hit' | 'miss' }[]
  >([]);

  // Multi-Run Aggregates
  const [completedRuns, setCompletedRuns] = useState<RTWSinglesRunRecord[]>([]);
  const [sessionTotalDarts, setSessionTotalDarts] = useState<number>(0);
  const [sessionTotalHits, setSessionTotalHits] = useState<number>(0);
  const [sessionTotalMisses, setSessionTotalMisses] = useState<number>(0);

  // Per-target statistics
  const [targetStats, setTargetStats] = useState<
    Record<string, { attempts: number; hits: number; misses: number }>
  >(() => {
    const init: Record<string, { attempts: number; hits: number; misses: number }> = {};
    RTW_TARGETS.forEach((t) => {
      init[t.shortLabel] = { attempts: 0, hits: 0, misses: 0 };
    });
    return init;
  });

  // Undo History Stack
  const [history, setHistory] = useState<DartHistorySnapshot[]>([]);

  // Time-up modal state
  const [showTimeUpModal, setShowTimeUpModal] = useState<boolean>(false);
  const [hasAcknowledgedTimeUp, setHasAcknowledgedTimeUp] = useState<boolean>(false);

  // Handle parent 10-minute timer expiration
  useEffect(() => {
    if (isFinalInput && !hasAcknowledgedTimeUp) {
      setShowTimeUpModal(true);
    }
  }, [isFinalInput, hasAcknowledgedTimeUp]);

  // Current Target Object
  const currentTarget = useMemo(() => {
    return RTW_TARGETS[currentStep - 1] || RTW_TARGETS[0];
  }, [currentStep]);

  // Best Run Calculation (fewest darts to clear Bull)
  const bestRunDarts = useMemo(() => {
    const cleared = completedRuns.filter((r) => r.completed);
    if (cleared.length === 0) return null;
    return Math.min(...cleared.map((r) => r.dartsThrown));
  }, [completedRuns]);

  // Highest Step Ever
  const highestStepEver = useMemo(() => {
    const allHighest = [highestStepInRun, ...completedRuns.map((r) => r.highestStepReached)];
    return Math.max(...allHighest);
  }, [highestStepInRun, completedRuns]);

  // Helper to compile overall result payload
  const compileResult = useCallback((): RTWSinglesResult => {
    const runsPlayed = runStatus === 'active' && runDarts === 0 ? completedRuns.length : runNumber;
    const clearedRunsCount = completedRuns.filter((r) => r.completed).length + (runStatus === 'cleared' ? 1 : 0);
    const failedRunsCount = completedRuns.filter((r) => !r.completed).length + (runStatus === 'game_over' ? 1 : 0);
    const accuracy = sessionTotalDarts > 0
      ? Number(((sessionTotalHits / sessionTotalDarts) * 100).toFixed(1))
      : 0;

    const highestTargetLabel = RTW_TARGETS[highestStepEver - 1]?.shortLabel || 'S1';

    // Include current run in details if not already saved
    const allRuns = [...completedRuns];
    if (runDarts > 0 && (runStatus === 'cleared' || runStatus === 'game_over')) {
      const alreadySaved = allRuns.some((r) => r.runNumber === runNumber);
      if (!alreadySaved) {
        allRuns.push({
          runNumber,
          completed: runStatus === 'cleared',
          finalTargetReached: currentTarget.shortLabel,
          highestTargetReached: RTW_TARGETS[highestStepInRun - 1]?.shortLabel || currentTarget.shortLabel,
          highestStepReached: highestStepInRun,
          dartsThrown: runDarts,
          hits: runHits,
          misses: runMisses,
          accuracy: runDarts > 0 ? Number(((runHits / runDarts) * 100).toFixed(1)) : 0,
          reasonEnded: runStatus === 'cleared' ? 'cleared' : (gameOverReason || 'strikeout'),
        });
      }
    }

    return {
      difficulty,
      runsPlayed: Math.max(1, runsPlayed),
      completedRuns: clearedRunsCount,
      failedRuns: failedRunsCount,
      bestRunDarts,
      highestTargetEver: highestTargetLabel,
      highestStepEver,
      totalDarts: sessionTotalDarts,
      totalHits: sessionTotalHits,
      totalMisses: sessionTotalMisses,
      overallAccuracy: accuracy,
      runDetails: allRuns,
      targetStats,
    };
  }, [
    difficulty,
    runNumber,
    runStatus,
    runDarts,
    runHits,
    runMisses,
    currentTarget.shortLabel,
    highestStepInRun,
    highestStepEver,
    gameOverReason,
    completedRuns,
    bestRunDarts,
    sessionTotalDarts,
    sessionTotalHits,
    sessionTotalMisses,
    targetStats,
  ]);

  // Handle Throwing a Single Dart (Hit or Miss)
  const handleDartThrow = useCallback(
    (isHit: boolean) => {
      if (runStatus !== 'active') return;

      const targetLabel = currentTarget.shortLabel;
      const targetStep = currentStep;

      // Capture Snapshot for Undo
      const snapshot: DartHistorySnapshot = {
        runNumber,
        currentStepBefore: currentStep,
        currentStepAfter: currentStep,
        targetShortLabel: targetLabel,
        result: isHit ? 'hit' : 'miss',
        dartInVisit,
        visitNumber,
        consecutiveMissesBefore: consecutiveMisses,
        totalMissesInRunBefore: totalMissesInRun,
        highestStepInRunBefore: highestStepInRun,
        runStatusBefore: runStatus,
        runDartsBefore: runDarts,
        runHitsBefore: runHits,
        runMissesBefore: runMisses,
        sessionDartsBefore: sessionTotalDarts,
        sessionHitsBefore: sessionTotalHits,
        sessionMissesBefore: sessionTotalMisses,
        completedRunsBefore: [...completedRuns],
        targetStatsBefore: JSON.parse(JSON.stringify(targetStats)),
      };

      // 1. Update Target Statistics
      setTargetStats((prev) => {
        const stats = { ...(prev[targetLabel] || { attempts: 0, hits: 0, misses: 0 }) };
        stats.attempts += 1;
        if (isHit) {
          stats.hits += 1;
        } else {
          stats.misses += 1;
        }
        return { ...prev, [targetLabel]: stats };
      });

      // 2. Update Visit & Session Darts Counters
      const newRunDarts = runDarts + 1;
      const newRunHits = runHits + (isHit ? 1 : 0);
      const newRunMisses = runMisses + (isHit ? 0 : 1);

      setRunDarts(newRunDarts);
      if (isHit) setRunHits(newRunHits);
      else setRunMisses(newRunMisses);

      setSessionTotalDarts((prev) => prev + 1);
      if (isHit) setSessionTotalHits((prev) => prev + 1);
      else setSessionTotalMisses((prev) => prev + 1);

      // Track dart in current visit display
      setVisitDartsHistory((prev) => [
        ...prev,
        { dartNumber: dartInVisit, target: targetLabel, result: isHit ? 'hit' : 'miss' },
      ]);

      // 3. Logic for HIT
      if (isHit) {
        // Play hit audio
        if (targetStep === 21) {
          sound.checkout();
          try {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          } catch {
            // ignore
          }
        } else {
          sound.hit();
        }

        // Reset consecutive misses on hit
        setConsecutiveMisses(0);

        if (targetStep === 21) {
          // 🎉 CLEARED THE ENTIRE BOARD (1 to 20 + Bull)!
          setRunStatus('cleared');
          setHighestStepInRun(21);
          snapshot.currentStepAfter = 21;
          snapshot.runStatusBefore = 'active';

          // Record run
          const runRecord: RTWSinglesRunRecord = {
            runNumber,
            completed: true,
            finalTargetReached: 'Bull',
            highestTargetReached: 'Bull',
            highestStepReached: 21,
            dartsThrown: newRunDarts,
            hits: newRunHits,
            misses: newRunMisses,
            accuracy: Number(((newRunHits / newRunDarts) * 100).toFixed(1)),
            reasonEnded: 'cleared',
          };
          setCompletedRuns((prev) => [...prev, runRecord]);
        } else {
          // Advance to next target (e.g. S1 -> S2, or S20 -> Bull)
          const nextStep = targetStep + 1;
          setCurrentStep(nextStep);
          setHighestStepInRun((prev) => Math.max(prev, nextStep));
          snapshot.currentStepAfter = nextStep;
        }
      } else {
        // 4. Logic for MISS
        sound.miss();

        // Special Bull Miss Rule:
        // "in both versions bull misses do not count toward losing but they put you back to hit s20 if you miss that one counts"
        const isBullMiss = targetStep === 21;

        if (isBullMiss) {
          // Drops target back to S20, does NOT increment strike/miss counters
          setCurrentStep(20);
          snapshot.currentStepAfter = 20;
        } else {
          // Regular number miss (S1 to S20): Drops back 1 number (min 1)
          const prevStep = Math.max(1, targetStep - 1);
          setCurrentStep(prevStep);
          snapshot.currentStepAfter = prevStep;

          if (difficulty === 'intermediate') {
            // Intermediate: 3 consecutive misses in a row = Game Over
            const newConsecutive = consecutiveMisses + 1;
            setConsecutiveMisses(newConsecutive);

            if (newConsecutive >= 3) {
              // ❌ STRIKEOUT!
              sound.bust();
              setRunStatus('game_over');
              setGameOverReason('strikeout');

              const runRecord: RTWSinglesRunRecord = {
                runNumber,
                completed: false,
                finalTargetReached: targetLabel,
                highestTargetReached: RTW_TARGETS[highestStepInRun - 1]?.shortLabel || targetLabel,
                highestStepReached: highestStepInRun,
                dartsThrown: newRunDarts,
                hits: newRunHits,
                misses: newRunMisses,
                accuracy: Number(((newRunHits / newRunDarts) * 100).toFixed(1)),
                reasonEnded: 'strikeout',
              };
              setCompletedRuns((prev) => [...prev, runRecord]);
            }
          } else {
            // Advanced: 5 misses in total = Game Over
            const newTotalMisses = totalMissesInRun + 1;
            setTotalMissesInRun(newTotalMisses);

            if (newTotalMisses >= 5) {
              // ❌ 5 TOTAL MISSES REACHED!
              sound.bust();
              setRunStatus('game_over');
              setGameOverReason('max_misses');

              const runRecord: RTWSinglesRunRecord = {
                runNumber,
                completed: false,
                finalTargetReached: targetLabel,
                highestTargetReached: RTW_TARGETS[highestStepInRun - 1]?.shortLabel || targetLabel,
                highestStepReached: highestStepInRun,
                dartsThrown: newRunDarts,
                hits: newRunHits,
                misses: newRunMisses,
                accuracy: Number(((newRunHits / newRunDarts) * 100).toFixed(1)),
                reasonEnded: 'max_misses',
              };
              setCompletedRuns((prev) => [...prev, runRecord]);
            }
          }
        }
      }

      // 5. Update Visit Darts index (1 -> 2 -> 3 -> 1)
      if (dartInVisit >= 3) {
        setDartInVisit(1);
        setVisitNumber((prev) => prev + 1);
        setVisitDartsHistory([]);
      } else {
        setDartInVisit((prev) => prev + 1);
      }

      // Save to undo stack
      setHistory((prev) => [snapshot, ...prev]);
    },
    [
      runStatus,
      currentTarget.shortLabel,
      currentStep,
      runNumber,
      dartInVisit,
      visitNumber,
      consecutiveMisses,
      totalMissesInRun,
      highestStepInRun,
      runDarts,
      runHits,
      runMisses,
      sessionTotalDarts,
      sessionTotalHits,
      sessionTotalMisses,
      completedRuns,
      targetStats,
      difficulty,
    ]
  );

  // Undo Last Dart Throw
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const [lastAction, ...remainingHistory] = history;

    setRunNumber(lastAction.runNumber);
    setCurrentStep(lastAction.currentStepBefore);
    setDartInVisit(lastAction.dartInVisit);
    setVisitNumber(lastAction.visitNumber);
    setConsecutiveMisses(lastAction.consecutiveMissesBefore);
    setTotalMissesInRun(lastAction.totalMissesInRunBefore);
    setHighestStepInRun(lastAction.highestStepInRunBefore);
    setRunStatus(lastAction.runStatusBefore);
    setGameOverReason(null);
    setRunDarts(lastAction.runDartsBefore);
    setRunHits(lastAction.runHitsBefore);
    setRunMisses(lastAction.runMissesBefore);
    setSessionTotalDarts(lastAction.sessionDartsBefore);
    setSessionTotalHits(lastAction.sessionHitsBefore);
    setSessionTotalMisses(lastAction.sessionMissesBefore);
    setCompletedRuns(lastAction.completedRunsBefore);
    setTargetStats(lastAction.targetStatsBefore);

    // Reconstruct current visit darts history
    setVisitDartsHistory((prev) => {
      if (prev.length > 0) {
        return prev.slice(0, -1);
      }
      return [];
    });

    setHistory(remainingHistory);
  }, [history]);

  // Start Next Run (after cleared or game over)
  const handleStartNextRun = useCallback(() => {
    setRunNumber((prev) => prev + 1);
    setCurrentStep(1);
    setHighestStepInRun(1);
    setRunStatus('active');
    setGameOverReason(null);
    setConsecutiveMisses(0);
    setTotalMissesInRun(0);
    setRunDarts(0);
    setRunHits(0);
    setRunMisses(0);
    setDartInVisit(1);
    setVisitDartsHistory([]);
  }, []);

  // Finish Entire Session & Trigger Scorecard
  const handleFinishSession = useCallback(() => {
    const result = compileResult();
    onFinish(result);
  }, [compileResult, onFinish]);

  // Change Difficulty Level (resets active run to keep clean data)
  const handleSelectDifficulty = (newDiff: RTWSinglesDifficulty) => {
    if (newDiff === difficulty) {
      setIsDifficultyDropdownOpen(false);
      return;
    }
    setDifficulty(newDiff);
    setIsDifficultyDropdownOpen(false);
    // Reset active run
    setCurrentStep(1);
    setHighestStepInRun(1);
    setRunStatus('active');
    setGameOverReason(null);
    setConsecutiveMisses(0);
    setTotalMissesInRun(0);
    setRunDarts(0);
    setRunHits(0);
    setRunMisses(0);
    setDartInVisit(1);
    setVisitDartsHistory([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-12 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-[#111418] border border-[#222933] rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c222b] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Round the World Singles
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-700/80 text-cyan-300 text-[11px] font-bold uppercase tracking-wider">
                  {difficulty === 'intermediate' ? 'Intermediate' : 'Advanced'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px] font-bold">
                  Run #{runNumber}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {difficulty === 'intermediate'
                  ? 'Hit advances (+1) · Miss goes back (-1) · 3 misses in a row = Out'
                  : 'Hit advances (+1) · Miss goes back (-1) · 5 total misses = Out'}
              </p>
            </div>
          </div>

          {/* Difficulty Selector Dropdown */}
          <div className="flex items-center gap-2 shrink-0" ref={dropdownRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDifficultyDropdownOpen(!isDifficultyDropdownOpen)}
                className="px-3 py-1.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mode: {difficulty === 'intermediate' ? 'Intermediate' : 'Advanced'}</span>
                {isDifficultyDropdownOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 opacity-70" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                )}
              </button>

              {isDifficultyDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#161a20] border border-[#2b3542] rounded-xl shadow-2xl p-1.5 z-50 animate-fadeIn space-y-1">
                  <button
                    type="button"
                    onClick={() => handleSelectDifficulty('intermediate')}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-all cursor-pointer ${
                      difficulty === 'intermediate'
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700 font-bold'
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-cyan-400" /> Intermediate Mode
                    </div>
                    <div className="text-[10px] text-neutral-400 font-normal mt-0.5">
                      Miss one goes back one. Miss 3 in a row = Game Over.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectDifficulty('advanced')}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-all cursor-pointer ${
                      difficulty === 'advanced'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-700 font-bold'
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> Advanced Mode
                    </div>
                    <div className="text-[10px] text-neutral-400 font-normal mt-0.5">
                      Miss one goes back one. 5 misses in total = Game Over.
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Finish Session Button */}
            <button
              type="button"
              onClick={handleFinishSession}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-emerald-600 active:scale-95 text-neutral-300 hover:text-white border border-neutral-700 hover:border-emerald-500 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Finish</span>
            </button>
          </div>
        </div>

        {/* 21-Step Sequence Progress Ribbon */}
        <div className="mt-4 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 mb-2">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" /> Progression: 1 → 20 → Bullseye
            </span>
            <span className="font-mono text-cyan-300">
              Step {currentStep} of 21 ({((currentStep / 21) * 100).toFixed(0)}%)
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
            {RTW_TARGETS.map((t) => {
              const isCurrent = t.step === currentStep;
              const isPast = t.step < currentStep;
              const isBull = t.step === 21;

              return (
                <div
                  key={t.step}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold shrink-0 transition-all border flex items-center justify-center ${
                    isCurrent
                      ? 'bg-cyan-500 text-neutral-950 border-cyan-400 ring-2 ring-cyan-500/50 scale-105 shadow-md'
                      : isPast
                      ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                      : isBull
                      ? 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                      : 'bg-neutral-850 border-neutral-800 text-neutral-500'
                  }`}
                >
                  {t.shortLabel}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="bg-[#111418] border border-[#222933] rounded-3xl p-3.5 sm:p-5 shadow-2xl space-y-3.5">
        {/* Unified Compact Target & Miss Meter Card (Merged for Phone Screens) */}
        <div className="bg-gradient-to-br from-neutral-850 to-neutral-900 border border-neutral-750 rounded-2xl p-3 sm:p-4 shadow-inner space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
            {/* Target Display */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black font-mono text-xl sm:text-2xl shadow-inner shrink-0">
                {currentTarget.shortLabel}
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  Active Target (1 Dart)
                </span>
                <div className="text-lg sm:text-xl font-black font-mono text-white tracking-tight leading-tight">
                  {currentTarget.label}
                </div>
                <div className="text-[11px] text-neutral-400 font-medium">
                  {currentStep === 21 ? (
                    <span className="text-rose-400 font-bold">🎯 Hit Bull to Clear Round!</span>
                  ) : (
                    <span>Hit: <b className="text-emerald-400">S{currentStep + 1}</b> · Miss: <b className="text-rose-400">{currentStep === 1 ? 'S1' : `S${currentStep - 1}`}</b></span>
                  )}
                </div>
              </div>
            </div>

            {/* Strikes/Miss Counter Badge */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                {difficulty === 'intermediate' ? 'Strikeout Meter' : 'Miss Capacity'}
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                {difficulty === 'intermediate'
                  ? `${consecutiveMisses} / 3 Strikes`
                  : `${totalMissesInRun} / 5 Misses`}
              </span>
            </div>
          </div>

          {/* Compact Strike / Miss Pills */}
          <div>
            {difficulty === 'intermediate' ? (
              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((strikeIndex) => {
                    const isTriggered = consecutiveMisses >= strikeIndex;
                    return (
                      <div
                        key={strikeIndex}
                        className={`h-7 sm:h-8 rounded-lg border flex items-center justify-center font-bold text-[11px] sm:text-xs transition-all ${
                          isTriggered
                            ? 'bg-rose-600/90 border-rose-500 text-white shadow-md animate-pulse'
                            : 'bg-neutral-800/80 border-neutral-700 text-neutral-500'
                        }`}
                      >
                        {isTriggered ? `❌ Strike ${strikeIndex}` : `Safe ${strikeIndex}`}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 px-1 pt-0.5">
                  <span>
                    {consecutiveMisses === 2 ? (
                      <b className="text-rose-400">⚠️ DANGER: 1 miss away from KO!</b>
                    ) : (
                      '3 misses in a row = Out'
                    )}
                  </span>
                  <span className="text-neutral-500 text-[10px]">Bull misses drop to S20 (No KO)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((missIndex) => {
                    const isTriggered = totalMissesInRun >= missIndex;
                    return (
                      <div
                        key={missIndex}
                        className={`h-7 sm:h-8 rounded-lg border flex items-center justify-center font-bold text-[11px] sm:text-xs transition-all ${
                          isTriggered
                            ? 'bg-rose-600/90 border-rose-500 text-white shadow-md'
                            : 'bg-neutral-800/80 border-neutral-700 text-neutral-500'
                        }`}
                      >
                        {isTriggered ? '❌' : `M${missIndex}`}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 px-1 pt-0.5">
                  <span>
                    {totalMissesInRun === 4 ? (
                      <b className="text-rose-400">⚠️ FINAL CHANCE: 1 miss left before KO!</b>
                    ) : (
                      '5 total misses = Out'
                    )}
                  </span>
                  <span className="text-neutral-500 text-[10px]">Bull misses drop to S20 (No KO)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact Visit Tracker (Circled in yellow - Made smaller) */}
        <div className="bg-[#151921] border border-[#2b3542] rounded-xl p-2.5 sm:p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-neutral-300 uppercase tracking-wider">
              Visit #{visitNumber} — Darts at Oche
            </span>
            <span className="font-mono text-neutral-400 text-[11px]">
              Darts: <b className="text-white">{runDarts}</b> ({runDarts > 0 ? ((runHits / runDarts) * 100).toFixed(0) : 0}%)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {[1, 2, 3].map((dNum) => {
              const isActive = runStatus === 'active' && dartInVisit === dNum;
              const pastDart = visitDartsHistory.find((h) => h.dartNumber === dNum);

              return (
                <div
                  key={dNum}
                  className={`p-1.5 sm:p-2 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all ${
                    isActive
                      ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30'
                      : pastDart
                      ? pastDart.result === 'hit'
                        ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-800 text-rose-300'
                      : 'bg-neutral-850/70 border-neutral-750 text-neutral-500'
                  }`}
                >
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">
                    Dart {dNum} {isActive ? '• NOW' : ''}
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-black">
                    {pastDart ? (
                      <span className="flex items-center gap-1">
                        {pastDart.result === 'hit' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        {pastDart.target}
                      </span>
                    ) : isActive ? (
                      <span className="text-cyan-300 font-bold">{currentTarget.shortLabel}</span>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls: Dart-by-Dart Entry Buttons */}
        {runStatus === 'active' ? (
          <div className="space-y-2 pt-0.5">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* HIT BUTTON */}
              <button
                type="button"
                onClick={() => handleDartThrow(true)}
                className="h-16 sm:h-20 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-900/30 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border border-emerald-400/40 group"
              >
                <div className="flex items-center gap-1.5">
                  <Check className="w-5 h-5 stroke-[3] group-hover:scale-110 transition-transform" />
                  <span>HIT {currentTarget.shortLabel}</span>
                </div>
                <span className="text-[11px] font-normal text-emerald-200 flex items-center gap-1">
                  {currentStep === 21 ? (
                    '🎉 WIN & CLEAR!'
                  ) : (
                    <>Advance to {RTW_TARGETS[currentStep]?.shortLabel} <ArrowRight className="w-3 h-3" /></>
                  )}
                </span>
              </button>

              {/* MISS BUTTON */}
              <button
                type="button"
                onClick={() => handleDartThrow(false)}
                className="h-16 sm:h-20 rounded-2xl bg-neutral-800 hover:bg-rose-900/80 active:scale-95 text-neutral-200 hover:text-white font-black text-sm sm:text-base shadow-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border border-neutral-700 hover:border-rose-600 group"
              >
                <div className="flex items-center gap-1.5">
                  <X className="w-5 h-5 stroke-[3] text-rose-400 group-hover:scale-110 transition-transform" />
                  <span>MISS {currentTarget.shortLabel}</span>
                </div>
                <span className="text-[11px] font-normal text-neutral-400 group-hover:text-rose-200 flex items-center gap-1">
                  {currentStep === 21 ? (
                    'Drops to S20 (No strike)'
                  ) : currentStep === 1 ? (
                    'Stays at S1'
                  ) : (
                    <>Back to {RTW_TARGETS[currentStep - 2]?.shortLabel} <ArrowLeft className="w-3 h-3" /></>
                  )}
                </span>
              </button>
            </div>

            {/* Undo Button */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo Last Dart</span>
              </button>
            </div>
          </div>
        ) : runStatus === 'cleared' ? (
          /* Run Cleared Card */
          <div className="bg-emerald-950/60 border border-emerald-600 rounded-3xl p-5 sm:p-6 text-center space-y-3.5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                🎉 Round the World Completed!
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Cleared in {runDarts} Darts!
              </h2>
              <p className="text-xs text-neutral-300 mt-1">
                Accuracy: <b className="text-emerald-400 font-mono">{((runHits / runDarts) * 100).toFixed(1)}%</b> ({runHits} hits, {runMisses} misses)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleStartNextRun}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-neutral-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Start Next Run (#{runNumber + 1})</span>
              </button>

              <button
                type="button"
                onClick={handleFinishSession}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-bold text-sm border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Finish Session & View Summary</span>
              </button>
            </div>
          </div>
        ) : (
          /* Game Over / Bust Card */
          <div className="bg-rose-950/60 border border-rose-700 rounded-3xl p-5 sm:p-6 text-center space-y-3.5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-1">
                {gameOverReason === 'strikeout' ? '❌ Strikeout (3 Misses in a Row)' : '❌ Maximum Misses (5 Total Misses)'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Game Over — Run #{runNumber} Ended
              </h2>
              <p className="text-xs text-neutral-300 mt-1">
                Furthest Reached: <b className="text-cyan-400 font-bold">{RTW_TARGETS[highestStepInRun - 1]?.label}</b> · Darts Thrown: <b className="text-white font-mono">{runDarts}</b> ({runHits} hits)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleStartNextRun}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again (Start Run #{runNumber + 1})</span>
              </button>

              <button
                type="button"
                onClick={handleUndo}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white font-bold text-sm border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Undo2 className="w-4 h-4" />
                <span>Undo Last Dart</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 10-Min Cutoff Timer Modal */}
      {showTimeUpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                ⏱️ 10-Minute Session Completed!
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">Time's Up</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Your 10-minute Round the World practice timer has reached 0:00. Would you like to finish and view your scorecard, or finish the current run in overtime?
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleFinishSession}
                className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-neutral-950 font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Award className="w-4 h-4" />
                <span>Finish & View Session Summary</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTimeUpModal(false);
                  setHasAcknowledgedTimeUp(true);
                }}
                className="w-full h-11 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white font-bold text-xs border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Continue Playing in Overtime</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
