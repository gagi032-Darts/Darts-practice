import React, { useState } from 'react';
import { Trophy, Hourglass, Flag, RotateCcw, Check, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BigScoresResult, BigScoresThrowRecord } from '../../types';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface BigScoresGameProps {
  isFinalInput: boolean;
  onFinish: (result: BigScoresResult) => void;
}

interface TargetStage {
  label: string;
  name: string;
  target: number | 'BULL';
  display: string;
}

const STAGES: TargetStage[] = [
  { label: '20', name: 'Segment 20', target: 20, display: '20' },
  { label: '19', name: 'Segment 19', target: 19, display: '19' },
  { label: '18', name: 'Segment 18', target: 18, display: '18' },
  { label: '17', name: 'Segment 17', target: 17, display: '17' },
  { label: 'Bull', name: 'Bullseye (25/50)', target: 'BULL', display: 'Bull' },
];

type DartHit = 'miss' | 'single' | 'double' | 'treble';

export const BigScoresGame: React.FC<BigScoresGameProps> = ({
  isFinalInput,
  onFinish,
}) => {
  const [currentThrowIndex, setCurrentThrowIndex] = useState<number>(0); // 0 to 4 (20, 19, 18, 17, Bull)
  const [currentCycle, setCurrentCycle] = useState<number>(1); // 1, 2, ...
  const [history, setHistory] = useState<BigScoresThrowRecord[]>([]);

  // Current visit selections for 3 darts
  const [dart1Hit, setDart1Hit] = useState<DartHit | null>(null);
  const [dart2Hit, setDart2Hit] = useState<DartHit | null>(null);
  const [dart3Hit, setDart3Hit] = useState<DartHit | null>(null);

  const currentStage = STAGES[currentThrowIndex];
  const isBullStage = currentStage.target === 'BULL';

  // Points mapping: Treble = 3, Double = 2, Single = 1, Miss = 0
  // Bull: Bull (inner 50) = 3 (or 2), Outer (25) = 1, Miss = 0
  const getDartPoints = (target: number | 'BULL', hit: DartHit | null): number => {
    if (!hit || hit === 'miss') return 0;
    if (target === 'BULL') {
      if (hit === 'single') return 1; // Outer 25
      if (hit === 'double' || hit === 'treble') return 3; // Bull 50
      return 0;
    }
    if (hit === 'treble') return 3;
    if (hit === 'double') return 2;
    if (hit === 'single') return 1;
    return 0;
  };

  const p1 = getDartPoints(currentStage.target, dart1Hit);
  const p2 = getDartPoints(currentStage.target, dart2Hit);
  const p3 = getDartPoints(currentStage.target, dart3Hit);
  const currentThrowScore = p1 + p2 + p3;

  const totalPoints = history.reduce((sum, h) => sum + h.totalScore, 0);
  const totalDarts = history.length * 3;
  const avgScore = history.length > 0 ? (totalPoints / history.length).toFixed(1) : '0.0';
  const threeDartAvg = history.length > 0 ? ((totalPoints / totalDarts) * 3).toFixed(1) : '0.0';

  const buildResult = (records: BigScoresThrowRecord[]): BigScoresResult => {
    const sum = records.reduce((acc, x) => acc + x.totalScore, 0);
    const dartsCount = records.length * 3;
    const visitsCount = records.length;
    const avgVisit = visitsCount > 0 ? parseFloat((sum / visitsCount).toFixed(2)) : 0;
    const threeAvg = dartsCount > 0 ? parseFloat(((sum / dartsCount) * 3).toFixed(2)) : 0;

    let trebleHits = 0;
    let doubleHits = 0;
    let singleHits = 0;
    let misses = 0;

    const segmentMap: Record<
      string,
      {
        totalScore: number;
        count: number;
        avgScore: number;
        hits: number;
        trebles: number;
        doubles: number;
        singles: number;
        misses: number;
      }
    > = {};

    STAGES.forEach((s) => {
      segmentMap[s.label] = {
        totalScore: 0,
        count: 0,
        avgScore: 0,
        hits: 0,
        trebles: 0,
        doubles: 0,
        singles: 0,
        misses: 0,
      };
    });

    const cycleMap: Record<number, number> = {};

    records.forEach((r) => {
      let visitHits = 0;
      let visitTrebles = 0;
      let visitDoubles = 0;
      let visitSingles = 0;
      let visitMisses = 0;

      r.hits.forEach((h) => {
        if (h === 'treble') {
          trebleHits++;
          visitTrebles++;
          visitHits++;
        } else if (h === 'double') {
          if (r.targetLabel === 'Bull') {
            trebleHits++;
            visitTrebles++;
          } else {
            doubleHits++;
            visitDoubles++;
          }
          visitHits++;
        } else if (h === 'single') {
          singleHits++;
          visitSingles++;
          visitHits++;
        } else {
          misses++;
          visitMisses++;
        }
      });

      if (!segmentMap[r.targetLabel]) {
        segmentMap[r.targetLabel] = {
          totalScore: 0,
          count: 0,
          avgScore: 0,
          hits: 0,
          trebles: 0,
          doubles: 0,
          singles: 0,
          misses: 0,
        };
      }
      segmentMap[r.targetLabel].totalScore += r.totalScore;
      segmentMap[r.targetLabel].count += 1;
      segmentMap[r.targetLabel].hits += visitHits;
      segmentMap[r.targetLabel].trebles += visitTrebles;
      segmentMap[r.targetLabel].doubles = (segmentMap[r.targetLabel].doubles || 0) + visitDoubles;
      segmentMap[r.targetLabel].singles = (segmentMap[r.targetLabel].singles || 0) + visitSingles;
      segmentMap[r.targetLabel].misses = (segmentMap[r.targetLabel].misses || 0) + visitMisses;

      cycleMap[r.cycleIndex] = (cycleMap[r.cycleIndex] || 0) + r.totalScore;
    });

    Object.keys(segmentMap).forEach((k) => {
      const item = segmentMap[k];
      item.avgScore = item.count > 0 ? parseFloat((item.totalScore / item.count).toFixed(1)) : 0;
    });

    const cyclesFinished = Math.floor(records.length / 5);
    const cycleScores = Object.values(cycleMap);
    const hitRate = dartsCount > 0 ? parseFloat((((dartsCount - misses) / dartsCount) * 100).toFixed(1)) : 0;
    const trebleRate = dartsCount > 0 ? parseFloat(((trebleHits / dartsCount) * 100).toFixed(1)) : 0;

    return {
      totalPoints: sum,
      darts: dartsCount,
      visits: visitsCount,
      cyclesCompleted: cyclesFinished,
      averageScorePerVisit: avgVisit,
      threeDartAvg: threeAvg,
      trebleHits,
      doubleHits,
      singleHits,
      misses,
      trebleRate,
      hitRate,
      segmentScores: segmentMap,
      throwsHistory: records,
      cycleScores,
    };
  };

  const handleRegisterThrow = () => {
    const h1 = dart1Hit || 'miss';
    const h2 = dart2Hit || 'miss';
    const h3 = dart3Hit || 'miss';

    const p1Val = getDartPoints(currentStage.target, h1);
    const p2Val = getDartPoints(currentStage.target, h2);
    const p3Val = getDartPoints(currentStage.target, h3);
    const throwTotal = p1Val + p2Val + p3Val;

    if (throwTotal >= 9) {
      sound.oneEighty();
      try {
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } else if (throwTotal >= 6) {
      sound.ton();
    } else if (throwTotal > 0) {
      sound.hit();
    } else {
      sound.bust();
    }

    const newRecord: BigScoresThrowRecord = {
      cycleIndex: currentCycle,
      throwIndex: currentThrowIndex,
      targetLabel: currentStage.label,
      hits: [h1, h2, h3],
      dartPoints: [p1Val, p2Val, p3Val],
      totalScore: throwTotal,
    };

    const nextHistory = [...history, newRecord];
    setHistory(nextHistory);

    // Save daily darts volume
    storage.recordDartsThrown(3);

    // Advance to next throw in the 5-target cycle
    const nextThrowIdx = currentThrowIndex + 1;
    if (nextThrowIdx >= STAGES.length) {
      if (isFinalInput) {
        onFinish(buildResult(nextHistory));
        return;
      }
      setCurrentThrowIndex(0);
      setCurrentCycle(currentCycle + 1);
    } else {
      setCurrentThrowIndex(nextThrowIdx);
    }

    // Reset dart selections
    setDart1Hit(null);
    setDart2Hit(null);
    setDart3Hit(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    sound.tap();

    const last = history[history.length - 1];
    setCurrentThrowIndex(last.throwIndex);
    setCurrentCycle(last.cycleIndex);

    setDart1Hit(last.hits[0]);
    setDart2Hit(last.hits[1]);
    setDart3Hit(last.hits[2]);

    setHistory(history.slice(0, -1));
  };

  const handleManualFinish = () => {
    sound.tap();
    onFinish(buildResult(history));
  };

  const renderDartButtons = (
    hitState: DartHit | null,
    setHit: React.Dispatch<React.SetStateAction<DartHit | null>>
  ) => {
    if (isBullStage) {
      return (
        <div className="space-y-1.5 mt-2">
          <button
            type="button"
            onClick={() => {
              sound.tap();
              setHit((prev) => (prev === 'double' || prev === 'treble' ? null : 'double'));
            }}
            className={`w-full py-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
              hitState === 'double' || hitState === 'treble'
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
              setHit((prev) => (prev === 'single' ? null : 'single'));
            }}
            className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              hitState === 'single'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#1e2522] text-emerald-300 hover:bg-[#26312b] hover:text-white border border-emerald-900/40'
            }`}
          >
            OUTER
          </button>
          <button
            type="button"
            onClick={() => {
              sound.tap();
              setHit((prev) => (prev === 'miss' ? null : 'miss'));
            }}
            className={`w-full py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              hitState === 'miss'
                ? 'bg-rose-900/80 text-rose-200 border border-rose-600'
                : 'bg-[#171b21] text-neutral-500 hover:text-neutral-300 hover:bg-[#1d2229] border border-[#222831]'
            }`}
          >
            MISS
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-1.5 mt-2">
        <button
          type="button"
          onClick={() => {
            sound.tap();
            setHit((prev) => (prev === 'treble' ? null : 'treble'));
          }}
          className={`w-full py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
            hitState === 'treble'
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
            setHit((prev) => (prev === 'double' ? null : 'double'));
          }}
          className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            hitState === 'double'
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
            setHit((prev) => (prev === 'single' ? null : 'single'));
          }}
          className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            hitState === 'single'
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
            setHit((prev) => (prev === 'miss' ? null : 'miss'));
          }}
          className={`w-full py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            hitState === 'miss'
              ? 'bg-rose-900/80 text-rose-200 border border-rose-600'
              : 'bg-[#171b21] text-neutral-500 hover:text-neutral-300 hover:bg-[#1d2229] border border-[#222831]'
          }`}
        >
          MISS
        </button>
      </div>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-3 sm:space-y-4">
      {/* Timer Expired Banner */}
      {isFinalInput && (
        <div className="bg-amber-950/90 border border-amber-600/80 rounded-2xl p-3.5 flex items-center justify-between text-amber-200 text-xs shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <Hourglass className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <b>Time is up!</b> Complete this 5-visit round or finish now.
            </span>
          </div>
          <button
            type="button"
            onClick={handleManualFinish}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black text-xs transition-all cursor-pointer shadow"
          >
            Finish Game
          </button>
        </div>
      )}

      {/* Main Scoreboard Card */}
      <div className="bg-[#121519] border border-[#232930] rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#232930] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                Round #{currentCycle}
              </span>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                Big Scores <span className="text-xs text-violet-400 font-normal">(10 min)</span>
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Total Points
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-violet-400 leading-none">
              {totalPoints}
            </span>
          </div>
        </div>

        {/* 5-Stage Sequence Strip */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-400 px-0.5">
            <span>Target Sequence</span>
            <span className="text-violet-300 font-mono">
              Visit {currentThrowIndex + 1} of 5
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {STAGES.map((st, idx) => {
              const isActive = idx === currentThrowIndex;
              const isPast = idx < currentThrowIndex;

              return (
                <div
                  key={st.label}
                  className={`py-1.5 px-1 rounded-lg text-center border transition-all ${
                    isActive
                      ? 'bg-violet-600/30 border-violet-500 text-white shadow-md ring-2 ring-violet-500/40'
                      : isPast
                      ? 'bg-[#181d23] border-emerald-500/40 text-emerald-300'
                      : 'bg-[#15191e] border-[#232930] text-neutral-500'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold block opacity-75">
                    V{idx + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono">
                    {st.display}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Target Header */}
        <div className="bg-[#181d23] border border-[#232930] rounded-xl p-2.5 text-center">
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">
            Target Segment
          </span>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <Target className="w-4 h-4 text-violet-400" />
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {currentStage.name}
            </span>
          </div>
        </div>

        {/* 3-Dart Horizontal Columns */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          {/* Dart 1 */}
          <div className="bg-[#181d23] border border-[#232930] rounded-xl p-2 sm:p-2.5 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase block">
              1st Dart · <b className="text-white">{currentStage.display}</b>
            </span>
            {renderDartButtons(dart1Hit, setDart1Hit)}
          </div>

          {/* Dart 2 */}
          <div className="bg-[#181d23] border border-[#232930] rounded-xl p-2 sm:p-2.5 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase block">
              2nd Dart · <b className="text-white">{currentStage.display}</b>
            </span>
            {renderDartButtons(dart2Hit, setDart2Hit)}
          </div>

          {/* Dart 3 */}
          <div className="bg-[#181d23] border border-[#232930] rounded-xl p-2 sm:p-2.5 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase block">
              3rd Dart · <b className="text-white">{currentStage.display}</b>
            </span>
            {renderDartButtons(dart3Hit, setDart3Hit)}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          <button
            type="button"
            id="bigscores-undo"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="col-span-1 py-3.5 rounded-xl bg-[#1c222a] hover:bg-[#252d37] disabled:opacity-40 text-neutral-300 font-bold text-xs border border-[#2e3744] flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Undo</span>
          </button>

          <button
            type="button"
            id="bigscores-submit"
            onClick={handleRegisterThrow}
            className="col-span-3 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-98 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-violet-950/60 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Register Visit</span>
          </button>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between pt-1 border-t border-[#232930] text-xs">
          <span className="text-neutral-500">
            Total visits: <b className="text-neutral-300 font-mono">{history.length}</b> ({history.length * 3} darts)
          </span>
          <button
            type="button"
            onClick={handleManualFinish}
            className="text-neutral-400 hover:text-rose-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>End Drill Early</span>
          </button>
        </div>
      </div>
    </div>
  );
};
