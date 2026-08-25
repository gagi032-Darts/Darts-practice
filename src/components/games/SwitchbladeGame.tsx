import React, { useState } from 'react';
import { Crosshair, Hourglass, Flag, RotateCcw, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SwitchbladeResult, SwitchbladeThrowRecord } from '../../types';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface SwitchbladeGameProps {
  isFinalInput: boolean;
  onFinish: (result: SwitchbladeResult) => void;
}

interface TargetSet {
  label: string;
  targets: (number | 'BULL')[];
  targetDisplay: string[];
}

const TARGET_SETS: TargetSet[] = [
  { label: 'T20 - T20 - T20', targets: [20, 20, 20], targetDisplay: ['T20', 'T20', 'T20'] },
  { label: 'T20 - T20 - T19', targets: [20, 20, 19], targetDisplay: ['T20', 'T20', 'T19'] },
  { label: 'T20 - T20 - T18', targets: [20, 20, 18], targetDisplay: ['T20', 'T20', 'T18'] },
  { label: 'T20 - T20 - T17', targets: [20, 20, 17], targetDisplay: ['T20', 'T20', 'T17'] },
  { label: 'T20 - T20 - Bull', targets: [20, 20, 'BULL'], targetDisplay: ['T20', 'T20', 'Bull'] },
];

type DartHit = 'miss' | 'single' | 'double' | 'treble';

export const SwitchbladeGame: React.FC<SwitchbladeGameProps> = ({
  isFinalInput,
  onFinish,
}) => {
  const [currentThrowIndex, setCurrentThrowIndex] = useState<number>(0); // 0 to 4
  const [currentCycle, setCurrentCycle] = useState<number>(1); // 1, 2, ...
  const [history, setHistory] = useState<SwitchbladeThrowRecord[]>([]);

  // Current visit selections for 3 darts
  const [dart1Hit, setDart1Hit] = useState<DartHit | null>(null);
  const [dart2Hit, setDart2Hit] = useState<DartHit | null>(null);
  const [dart3Hit, setDart3Hit] = useState<DartHit | null>(null);

  const currentSet = TARGET_SETS[currentThrowIndex];

  // Helper to compute points for a specific dart
  const getDartPoints = (target: number | 'BULL', hit: DartHit | null): number => {
    if (!hit || hit === 'miss') return 0;
    if (target === 'BULL') {
      if (hit === 'single') return 25;
      if (hit === 'double' || hit === 'treble') return 50;
      return 0;
    }
    const num = target as number;
    if (hit === 'single') return num;
    if (hit === 'double') return num * 2;
    if (hit === 'treble') return num * 3;
    return 0;
  };

  const p1 = getDartPoints(currentSet.targets[0], dart1Hit);
  const p2 = getDartPoints(currentSet.targets[1], dart2Hit);
  const p3 = getDartPoints(currentSet.targets[2], dart3Hit);
  const currentThrowScore = p1 + p2 + p3;

  const totalPoints = history.reduce((sum, h) => sum + h.totalScore, 0);
  const totalDarts = history.length * 3;
  const avgScore = history.length > 0 ? (totalPoints / history.length).toFixed(1) : '0.0';
  const threeDartAvg = history.length > 0 ? ((totalPoints / totalDarts) * 3).toFixed(2) : '0.00';

  const buildResult = (records: SwitchbladeThrowRecord[]): SwitchbladeResult => {
    const sum = records.reduce((acc, x) => acc + x.totalScore, 0);
    const dartsCount = records.length * 3;
    const visitsCount = records.length;
    const avgVisit = visitsCount > 0 ? parseFloat((sum / visitsCount).toFixed(2)) : 0;

    let d1Hits = 0;
    let d2Hits = 0;
    let d3Hits = 0;
    let d1Trebles = 0;
    let d2Trebles = 0;
    let d3Trebles = 0;

    const targetMap: Record<string, { totalScore: number; count: number; avgScore: number }> = {};
    TARGET_SETS.forEach((ts) => {
      targetMap[ts.label] = { totalScore: 0, count: 0, avgScore: 0 };
    });

    const cycleMap: Record<number, number> = {};

    records.forEach((r) => {
      const h1 = r.hits[0];
      const h2 = r.hits[1];
      const h3 = r.hits[2];

      if (h1 !== 'miss') d1Hits++;
      if (h2 !== 'miss') d2Hits++;
      if (h3 !== 'miss') d3Hits++;

      if (h1 === 'treble') d1Trebles++;
      if (h2 === 'treble') d2Trebles++;
      if (h3 === 'treble' || (r.targets[2] === 'Bull' && h3 === 'double')) {
        d3Trebles++;
      }

      if (!targetMap[r.targetLabel]) {
        targetMap[r.targetLabel] = { totalScore: 0, count: 0, avgScore: 0 };
      }
      targetMap[r.targetLabel].totalScore += r.totalScore;
      targetMap[r.targetLabel].count += 1;

      cycleMap[r.cycleIndex] = (cycleMap[r.cycleIndex] || 0) + r.totalScore;
    });

    Object.keys(targetMap).forEach((k) => {
      const item = targetMap[k];
      item.avgScore = item.count > 0 ? parseFloat((item.totalScore / item.count).toFixed(1)) : 0;
    });

    const cyclesFinished = Math.floor(records.length / 5);
    const cycleScores = Object.values(cycleMap);

    return {
      totalPoints: sum,
      darts: dartsCount,
      visits: visitsCount,
      cyclesCompleted: cyclesFinished,
      averageScorePerVisit: avgVisit,
      dart1HitRate: visitsCount > 0 ? parseFloat(((d1Hits / visitsCount) * 100).toFixed(1)) : 0,
      dart2HitRate: visitsCount > 0 ? parseFloat(((d2Hits / visitsCount) * 100).toFixed(1)) : 0,
      dart3HitRate: visitsCount > 0 ? parseFloat(((d3Hits / visitsCount) * 100).toFixed(1)) : 0,
      dart1TreblePct: visitsCount > 0 ? parseFloat(((d1Trebles / visitsCount) * 100).toFixed(1)) : 0,
      dart2TreblePct: visitsCount > 0 ? parseFloat(((d2Trebles / visitsCount) * 100).toFixed(1)) : 0,
      dart3TreblePct: visitsCount > 0 ? parseFloat(((d3Trebles / visitsCount) * 100).toFixed(1)) : 0,
      targetScores: targetMap,
      throwsHistory: records,
      cycleScores,
    };
  };

  const handleRegisterThrow = () => {
    // If null, default to miss
    const h1 = dart1Hit || 'miss';
    const h2 = dart2Hit || 'miss';
    const h3 = dart3Hit || 'miss';

    const p1Val = getDartPoints(currentSet.targets[0], h1);
    const p2Val = getDartPoints(currentSet.targets[1], h2);
    const p3Val = getDartPoints(currentSet.targets[2], h3);
    const throwTotal = p1Val + p2Val + p3Val;

    if (throwTotal >= 140) {
      sound.oneEighty();
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } else if (throwTotal >= 60) {
      sound.ton();
    } else if (throwTotal > 0) {
      sound.hit();
    } else {
      sound.bust();
    }

    const newRecord: SwitchbladeThrowRecord = {
      cycleIndex: currentCycle,
      throwIndex: currentThrowIndex,
      targetLabel: currentSet.label,
      targets: currentSet.targetDisplay,
      hits: [h1, h2, h3],
      dartPoints: [p1Val, p2Val, p3Val],
      totalScore: throwTotal,
    };

    const nextHistory = [...history, newRecord];
    setHistory(nextHistory);
    storage.recordDartsThrown(3);

    // Reset dart inputs
    setDart1Hit(null);
    setDart2Hit(null);
    setDart3Hit(null);

    // Advance throw or cycle
    if (currentThrowIndex === 4) {
      // Completed full 5-throw cycle!
      setCurrentThrowIndex(0);
      setCurrentCycle((prev) => prev + 1);
      sound.lock();

      // If timer is up and user finished the 5th throw, finish game
      if (isFinalInput) {
        onFinish(buildResult(nextHistory));
        return;
      }
    } else {
      setCurrentThrowIndex((prev) => prev + 1);
    }
  };

  const handleManualFinish = () => {
    sound.lock();
    onFinish(buildResult(history));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    sound.tap();
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentThrowIndex(last.throwIndex);
    setCurrentCycle(last.cycleIndex);
    setDart1Hit(last.hits[0]);
    setDart2Hit(last.hits[1]);
    setDart3Hit(last.hits[2]);
  };

  const isBullTarget = currentSet.targets[2] === 'BULL';

  return (
    <div className="w-full max-w-xl mx-auto space-y-2 sm:space-y-3">
      {/* 10-Min Timer Final Input Notification Banner */}
      {isFinalInput && (
        <div className="bg-amber-950/80 border-2 border-amber-500/80 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-amber-200 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-center sm:text-left">
            <Hourglass className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              10-min timer reached! Finish throw {currentThrowIndex + 1}/5 to end round, or finish now.
            </span>
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

      {/* Top Banner Card: Running Total Score */}
      <div className="bg-[#15191e] border border-[#232930] rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-center shadow-xl relative overflow-hidden">
        {/* Header Badges */}
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-1 sm:mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-rose-400 font-black">
              <Crosshair className="w-4 h-4" /> Switchblade
            </span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[11px]">
              Round #{currentCycle} · Throw {currentThrowIndex + 1}/5
            </span>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              className="text-[11px] text-neutral-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Undo
            </button>
          )}
        </div>

        {/* Big Score Display */}
        <div className="my-1 sm:my-2 flex flex-col items-center justify-center">
          <div className="text-6xl sm:text-8xl font-mono font-black text-white tracking-tight leading-none drop-shadow-md">
            {totalPoints.toLocaleString()}
          </div>
          <span className="text-[11px] sm:text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">
            Running Total Points
          </span>
        </div>

        {/* Compact Performance Stats Along Blue Line */}
        <div className="mt-2.5 pt-2 border-t-2 border-blue-500/90 grid grid-cols-4 gap-1 text-center">
          <div className="px-0.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider block leading-tight">
              Avg / Throw
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-emerald-400 block mt-0.5">
              {avgScore}
            </span>
          </div>

          <div className="px-0.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider block leading-tight">
              3-Dart Avg
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-cyan-400 block mt-0.5">
              {threeDartAvg}
            </span>
          </div>

          <div className="px-0.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider block leading-tight">
              Rounds Done
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-amber-400 block mt-0.5">
              {Math.floor(history.length / 5)}
            </span>
          </div>

          <div className="px-0.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider block leading-tight">
              Darts Thrown
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-white block mt-0.5">
              {totalDarts}
            </span>
          </div>
        </div>
      </div>

      {/* Active Target Banner */}
      <div className="bg-[#121519] border border-[#232930] rounded-2xl p-3 sm:p-4 text-center shadow-lg">
        <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">
          CURRENT TARGETS (THROW {currentThrowIndex + 1}/5)
        </span>
        <div className="text-2xl sm:text-4xl font-black font-mono text-white tracking-wider text-rose-400 my-1">
          {currentSet.label}
        </div>
        <p className="text-[11px] text-neutral-400">
          One dart on each target. Select hits below and register throw score.
        </p>

        {/* 3-Dart Hit Selectors */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3 pt-3 border-t border-[#232930]">
          {/* Dart 1: T20 */}
          <div className="bg-[#181d23] border border-[#232930] rounded-xl p-2 sm:p-2.5 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase block">
              1st Dart · <b className="text-white">T20</b>
            </span>

            <div className="space-y-1.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setDart1Hit((prev) => (prev === 'treble' ? null : 'treble'));
                }}
                className={`w-full py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  dart1Hit === 'treble'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/30'
                    : 'bg-[#222932] text-neutral-200 hover:bg-[#2b3440] hover:text-white border border-[#2e3744]'
                }`}
              >
                TREBLE
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setDart1Hit((prev) => (prev === 'double' ? null : 'double'));
                }}
                className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dart1Hit === 'double'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-[#202630] text-neutral-300 hover:bg-[#28313e] hover:text-white border border-[#2a3340]'
                }`}
              >
                DOUBLE
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setDart1Hit((prev) => (prev === 'single' ? null : 'single'));
                }}
                className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dart1Hit === 'single'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-[#1e242d] text-neutral-300 hover:bg-[#262e39] hover:text-white border border-[#27303c]'
                }`}
              >
                SINGLE
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setDart1Hit((prev) => (prev === 'miss' ? null : 'miss'));
                }}
                className={`w-full py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  dart1Hit === 'miss'
                    ? 'bg-rose-900/80 text-rose-200 border border-rose-600'
                    : 'bg-[#171b21] text-neutral-500 hover:text-neutral-300 hover:bg-[#1d2229] border border-[#222831]'
                }`}
              >
                MISS
              </button>
            </div>
          </div>

          {/* Dart 2: T20 */}
          <div className="bg-[#181d23] border border-[#232930] rounded-xl p-2 sm:p-2.5 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase block">
              2nd Dart · <b className="text-white">T20</b>
            </span>

            <div className="space-y-1.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setDart2Hit((prev) => (prev === 'treble' ? null : 'treble'));
                }}
                className={`w-full py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  dart2Hit === 'treble'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/30'
                    : 'bg-[#222932] text-neutral-200 hover:bg-[#2b3440] hover:text-white border border-[#2e3744]'
                }`}
              >
                TREBLE
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setDart2Hit((prev) => (prev === 'double' ? null : 'double'));
                }}
                className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dart2Hit === 'double'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-[#202630] text-neutral-300 hover:bg-[#28313e] hover:text-white border border-[#2a3340]'
                }`}
              >
                DOUBLE
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setDart2Hit((prev) => (prev === 'single' ? null : 'single'));
                }}
                className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dart2Hit === 'single'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-[#1e242d] text-neutral-300 hover:bg-[#262e39] hover:text-white border border-[#27303c]'
                }`}
              >
                SINGLE
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setDart2Hit((prev) => (prev === 'miss' ? null : 'miss'));
                }}
                className={`w-full py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  dart2Hit === 'miss'
                    ? 'bg-rose-900/80 text-rose-200 border border-rose-600'
                    : 'bg-[#171b21] text-neutral-500 hover:text-neutral-300 hover:bg-[#1d2229] border border-[#222831]'
                }`}
              >
                MISS
              </button>
            </div>
          </div>

          {/* Dart 3: T20 / T19 / T18 / T17 / Bull */}
          <div className="bg-[#181d23] border border-[#232930] rounded-xl p-2 sm:p-2.5 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase block truncate">
              3rd Dart · <b className="text-amber-400">{currentSet.targetDisplay[2]}</b>
            </span>

            <div className="space-y-1.5 mt-2">
              {!isBullTarget ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      sound.tap();
                      setDart3Hit((prev) => (prev === 'treble' ? null : 'treble'));
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      dart3Hit === 'treble'
                        ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/30'
                        : 'bg-[#222932] text-neutral-200 hover:bg-[#2b3440] hover:text-white border border-[#2e3744]'
                    }`}
                  >
                    TREBLE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.tap();
                      setDart3Hit((prev) => (prev === 'double' ? null : 'double'));
                    }}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      dart3Hit === 'double'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-[#202630] text-neutral-300 hover:bg-[#28313e] hover:text-white border border-[#2a3340]'
                    }`}
                  >
                    DOUBLE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.tap();
                      setDart3Hit((prev) => (prev === 'single' ? null : 'single'));
                    }}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      dart3Hit === 'single'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'bg-[#1e242d] text-neutral-300 hover:bg-[#262e39] hover:text-white border border-[#27303c]'
                    }`}
                  >
                    SINGLE
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      sound.tap();
                      setDart3Hit((prev) => (prev === 'double' ? null : 'double'));
                    }}
                    className={`w-full py-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      dart3Hit === 'double' || dart3Hit === 'treble'
                        ? 'bg-rose-500 text-neutral-950 shadow-md shadow-rose-500/30'
                        : 'bg-[#282226] text-rose-200 hover:bg-[#342a30] hover:text-white border border-rose-900/50'
                    }`}
                  >
                    🎯 BULL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.tap();
                      setDart3Hit((prev) => (prev === 'single' ? null : 'single'));
                    }}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      dart3Hit === 'single'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-[#1e2522] text-emerald-300 hover:bg-[#26312b] hover:text-white border border-emerald-900/40'
                    }`}
                  >
                    OUTER
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setDart3Hit((prev) => (prev === 'miss' ? null : 'miss'));
                }}
                className={`w-full py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  dart3Hit === 'miss'
                    ? 'bg-rose-900/80 text-rose-200 border border-rose-600'
                    : 'bg-[#171b21] text-neutral-500 hover:text-neutral-300 hover:bg-[#1d2229] border border-[#222831]'
                }`}
              >
                MISS
              </button>
            </div>
          </div>
        </div>

        {/* Register Throw Button */}
        <div className="mt-3 pt-2">
          <button
            type="button"
            onClick={handleRegisterThrow}
            className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Register Throw</span>
          </button>
        </div>
      </div>
    </div>
  );
};
