import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, Hourglass, Flag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { HighscoreResult } from '../../types';
import { DartsMatchKeypad } from '../common/DartsMatchKeypad';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface HighscoreGameProps {
  drillNumber?: 1 | 2;
  isFinalInput: boolean;
  onFinish: (result: HighscoreResult) => void;
}

export const BUCKETS: { label: string; test: (v: number) => boolean; color: string; barColor: string }[] = [
  { label: '180 (MAX)', test: (x) => x === 180, color: 'text-rose-400', barColor: 'bg-rose-500' },
  { label: '140–179', test: (x) => x >= 140 && x < 180, color: 'text-amber-400', barColor: 'bg-amber-500' },
  { label: '100–139', test: (x) => x >= 100 && x < 140, color: 'text-emerald-400', barColor: 'bg-emerald-500' },
  { label: '80–99', test: (x) => x >= 80 && x < 100, color: 'text-cyan-400', barColor: 'bg-cyan-500' },
  { label: '60–79', test: (x) => x >= 60 && x < 80, color: 'text-teal-400', barColor: 'bg-teal-500' },
  { label: '50–59', test: (x) => x >= 50 && x < 60, color: 'text-blue-400', barColor: 'bg-blue-500' },
  { label: '40–49', test: (x) => x >= 40 && x < 50, color: 'text-neutral-300', barColor: 'bg-neutral-500' },
  { label: 'Under 40', test: (x) => x < 40, color: 'text-neutral-400', barColor: 'bg-neutral-600' },
];

export const HighscoreGame: React.FC<HighscoreGameProps> = ({
  drillNumber,
  isFinalInput,
  onFinish,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [visits, setVisits] = useState<number[]>([]);
  const visitsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visitsScrollRef.current) {
      visitsScrollRef.current.scrollTop = visitsScrollRef.current.scrollHeight;
    }
  }, [visits.length]);

  const buildResult = (currentVisits: number[]): HighscoreResult => {
    const sum = currentVisits.reduce((acc, x) => acc + x, 0);
    const avgVal = currentVisits.length > 0 ? sum / currentVisits.length : 0;
    const bestVal = currentVisits.length > 0 ? Math.max(...currentVisits) : 0;

    const first9 = currentVisits.slice(0, 3);
    const first9Avg =
      first9.length > 0
        ? parseFloat((first9.reduce((acc, x) => acc + x, 0) / first9.length).toFixed(2))
        : null;

    const distMap: Record<string, number> = {};
    BUCKETS.forEach((b) => {
      distMap[b.label] = currentVisits.filter(b.test).length;
    });

    return {
      visits: currentVisits,
      avg: parseFloat(avgVal.toFixed(2)),
      totalPoints: sum,
      darts: currentVisits.length * 3,
      bestVisit: bestVal,
      firstNineAvg: first9Avg,
      oneEighties: currentVisits.filter((x) => x === 180).length,
      tonForties: currentVisits.filter((x) => x >= 140 && x < 180).length,
      tons: currentVisits.filter((x) => x >= 100 && x < 140).length,
      distribution: distMap,
    };
  };

  const handleEnterVisit = (customVal?: number) => {
    const rawVal = customVal !== undefined ? customVal : parseInt(inputValue, 10);
    if (isNaN(rawVal) || rawVal < 0 || rawVal > 180) return;

    if (rawVal === 180) {
      sound.oneEighty();
      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch {
        // confetti fallback
      }
    } else if (rawVal >= 100) {
      sound.lock();
    } else if (rawVal > 0) {
      sound.hit();
    } else {
      sound.miss();
    }

    const nextVisits = [...visits, rawVal];
    setVisits(nextVisits);
    setInputValue('');
    storage.recordDartsThrown(3);

    if (isFinalInput) {
      onFinish(buildResult(nextVisits));
    }
  };

  const handleManualFinish = () => {
    sound.lock();
    onFinish(buildResult(visits));
  };

  const handleUndo = () => {
    if (visits.length === 0) return;
    sound.tap();
    setVisits(visits.slice(0, -1));
    storage.recordDartsThrown(-3);
  };

  const totalScore = visits.reduce((acc, x) => acc + x, 0);
  const avg = visits.length > 0 ? (totalScore / visits.length).toFixed(2) : '0.00';
  const best = visits.length > 0 ? Math.max(...visits) : 0;
  const lastVisit = visits.length > 0 ? visits[visits.length - 1] : null;
  const tonCount = visits.filter((x) => x >= 100).length;

  const totalRounds = Math.max(3, visits.length);
  let runningScore = 0;
  const visitRows = visits.map((score, idx) => {
    runningScore += score;
    return {
      roundIndex: idx + 1,
      dartNumber: (idx + 1) * 3,
      score,
      runningTotal: runningScore,
    };
  });

  const allRows = [];
  for (let i = 0; i < totalRounds; i++) {
    if (i < visitRows.length) {
      allRows.push(visitRows[i]);
    } else {
      allRows.push({
        roundIndex: i + 1,
        dartNumber: (i + 1) * 3,
        score: undefined,
        runningTotal: undefined,
      });
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-2 sm:space-y-3">
      {/* 20-Min Timer Final Input Notification Banner */}
      {isFinalInput && (
        <div className="bg-amber-950/80 border-2 border-amber-500/80 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-amber-200 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-center sm:text-left">
            <Hourglass className="w-4 h-4 text-amber-400 shrink-0" />
            <span>20-min timer reached! Throw your final visit or finish session now.</span>
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
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-emerald-400 font-black">
              <TrendingUp className="w-4 h-4" /> High Score {drillNumber ? `#${drillNumber}` : 'Practice'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[11px]">
              Visit #{visits.length + 1}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {lastVisit !== null && (
              <span className="text-neutral-400 text-xs font-mono">
                Last: <b className="text-white">{lastVisit}</b>
              </span>
            )}
            <span className="text-neutral-400 text-xs font-mono">
              Dart #{visits.length * 3 + 1}
            </span>
          </div>
        </div>

        {/* Big Score Display */}
        <div className="my-1 sm:my-2 flex flex-col items-center justify-center">
          <div className="text-6xl sm:text-8xl font-mono font-black text-white tracking-tight leading-none drop-shadow-md">
            {totalScore.toLocaleString()}
          </div>
          <span className="text-[11px] sm:text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">
            Total Points Scored
          </span>
        </div>

        {/* Compact Performance Stats Along Blue Line */}
        <div className="mt-2.5 pt-2 border-t-2 border-blue-500/90 grid grid-cols-4 gap-1 text-center">
          <div className="px-0.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider block leading-tight">
              3-Dart Avg
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-emerald-400 block mt-0.5">
              {avg}
            </span>
          </div>

          <div className="px-0.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider block leading-tight">
              Darts Thrown
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-cyan-400 block mt-0.5">
              {visits.length * 3}
            </span>
          </div>

          <div className="px-0.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider block leading-tight">
              Best Visit
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-amber-400 block mt-0.5">
              {best > 0 ? best : '—'}
            </span>
          </div>

          <div className="px-0.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider block leading-tight">
              100+ Tons
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-white block mt-0.5">
              {tonCount}
            </span>
          </div>
        </div>
      </div>

      {/* Visit History Table (Matching 301 style) */}
      <div className="bg-[#121519] border border-[#232930] rounded-xl p-1.5 shadow-xs">
        {/* Table Header */}
        <div className="grid grid-cols-3 text-center text-[10px] font-bold text-neutral-400 border-b border-[#232930] pb-1 leading-none uppercase tracking-wider">
          <span className="text-neutral-400 font-semibold">ROUND</span>
          <span className="text-emerald-400 font-black">VISIT SCORE</span>
          <span className="text-cyan-400 font-black">RUNNING TOTAL</span>
        </div>

        {/* Visits List */}
        <div
          ref={visitsScrollRef}
          className="space-y-1 pt-1 max-h-[102px] min-h-[96px] overflow-y-auto overscroll-contain pr-1"
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
                  <span
                    className={`font-black text-sm ${
                      row.score === 180
                        ? 'text-amber-300 font-mono scale-105'
                        : row.score >= 100
                        ? 'text-emerald-400'
                        : 'text-white'
                    }`}
                  >
                    {row.score === 180 ? '🎯 180!' : row.score}
                  </span>
                ) : (
                  <span className="text-neutral-600 font-bold text-xs">—</span>
                )}
              </div>

              <div className="flex items-center justify-center">
                {row.runningTotal !== undefined ? (
                  <span className="font-black text-xs text-cyan-300 font-mono">
                    {row.runningTotal}
                  </span>
                ) : (
                  <span className="text-neutral-600 font-bold text-xs">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Precision Match Keypad */}
      <div className="bg-[#15191e] border border-[#232930] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl">
        <DartsMatchKeypad
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleEnterVisit}
          onUndo={handleUndo}
          canUndo={visits.length > 0}
          maxScore={180}
        />
      </div>
    </div>
  );
};


