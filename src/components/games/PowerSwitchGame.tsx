import React, { useState, useEffect } from 'react';
import { Zap, Hourglass, Flag, RotateCcw, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PowerSwitchResult, PowerSwitchVisitRecord } from '../../types';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface PowerSwitchGameProps {
  isFinalInput: boolean;
  onFinish: (result: PowerSwitchResult) => void;
}

type HitType = 'miss' | 'single' | 'double' | 'treble';

const TARGET_CYCLE = ['T20', 'T19', 'T18'];

function getNextTarget(currentTarget: string): string {
  const idx = TARGET_CYCLE.indexOf(currentTarget);
  if (idx === -1) return 'T20';
  return TARGET_CYCLE[(idx + 1) % TARGET_CYCLE.length];
}

function getPointsForHit(hit: HitType | null): number {
  if (hit === 'treble') return 3;
  if (hit === 'double') return 2;
  if (hit === 'single') return 1;
  return 0;
}

export const PowerSwitchGame: React.FC<PowerSwitchGameProps> = ({
  isFinalInput,
  onFinish,
}) => {
  const [history, setHistory] = useState<PowerSwitchVisitRecord[]>([]);
  const [visitNumber, setVisitNumber] = useState<number>(1);

  // 3-dart hits for active visit
  const [dart1Hit, setDart1Hit] = useState<HitType | null>(null);
  const [dart2Hit, setDart2Hit] = useState<HitType | null>(null);
  const [dart3Hit, setDart3Hit] = useState<HitType | null>(null);

  // Every visit strictly starts at T20
  const target1 = 'T20';
  const target2 =
    dart1Hit === 'treble' || dart1Hit === null
      ? 'T20'
      : getNextTarget('T20'); // 'T19'

  const target3 =
    dart2Hit === 'treble' || dart2Hit === null
      ? target2
      : getNextTarget(target2);

  const p1 = getPointsForHit(dart1Hit);
  const p2 = getPointsForHit(dart2Hit);
  const p3 = getPointsForHit(dart3Hit);
  const currentVisitPoints = p1 + p2 + p3;

  const totalPoints = history.reduce((sum, h) => sum + h.totalPoints, 0);
  const totalDarts = history.length * 3;
  const pointsPerVisitAvg = history.length > 0 ? (totalPoints / history.length).toFixed(1) : '0.0';

  // Stats breakdown
  let trebleHits = 0;
  let doubleHits = 0;
  let singleHits = 0;
  let misses = 0;

  history.forEach((rec) => {
    rec.darts.forEach((d) => {
      if (d.multiplier === 'treble') trebleHits++;
      else if (d.multiplier === 'double') doubleHits++;
      else if (d.multiplier === 'single') singleHits++;
      else misses++;
    });
  });

  const trebleRate = totalDarts > 0 ? parseFloat(((trebleHits / totalDarts) * 100).toFixed(1)) : 0;

  const buildResult = (records: PowerSwitchVisitRecord[]): PowerSwitchResult => {
    const sum = records.reduce((acc, x) => acc + x.totalPoints, 0);
    const dCount = records.length * 3;
    const vCount = records.length;
    const avgV = vCount > 0 ? parseFloat((sum / vCount).toFixed(2)) : 0;

    let tHits = 0;
    let dHits = 0;
    let sHits = 0;
    let mHits = 0;

    records.forEach((r) => {
      r.darts.forEach((d) => {
        if (d.multiplier === 'treble') tHits++;
        else if (d.multiplier === 'double') dHits++;
        else if (d.multiplier === 'single') sHits++;
        else mHits++;
      });
    });

    const tRate = dCount > 0 ? parseFloat(((tHits / dCount) * 100).toFixed(1)) : 0;
    const hRate = dCount > 0 ? parseFloat((((tHits + dHits + sHits) / dCount) * 100).toFixed(1)) : 0;

    return {
      totalPoints: sum,
      darts: dCount,
      visits: vCount,
      pointsPerVisitAvg: avgV,
      trebleHits: tHits,
      doubleHits: dHits,
      singleHits: sHits,
      misses: mHits,
      trebleRate: tRate,
      hitRate: hRate,
      history: records,
    };
  };

  const handleRegisterVisit = () => {
    const h1 = dart1Hit || 'miss';
    const h2 = dart2Hit || 'miss';
    const h3 = dart3Hit || 'miss';

    const finalTarget1 = 'T20';
    const finalTarget2 = h1 === 'treble' ? finalTarget1 : getNextTarget(finalTarget1);
    const finalTarget3 = h2 === 'treble' ? finalTarget2 : getNextTarget(finalTarget2);

    const pt1 = getPointsForHit(h1);
    const pt2 = getPointsForHit(h2);
    const pt3 = getPointsForHit(h3);
    const visitTotal = pt1 + pt2 + pt3;

    if (visitTotal === 9) {
      sound.oneEighty();
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } else if (visitTotal >= 6) {
      sound.ton();
    } else if (visitTotal > 0) {
      sound.hit();
    } else {
      sound.bust();
    }

    const newRecord: PowerSwitchVisitRecord = {
      visitNumber,
      darts: [
        { target: finalTarget1, multiplier: h1, points: pt1 },
        { target: finalTarget2, multiplier: h2, points: pt2 },
        { target: finalTarget3, multiplier: h3, points: pt3 },
      ],
      totalPoints: visitTotal,
    };

    const nextHistory = [...history, newRecord];
    setHistory(nextHistory);
    storage.recordDartsThrown(3);

    // Reset visit state - next visit always starts at T20
    setDart1Hit(null);
    setDart2Hit(null);
    setDart3Hit(null);
    setVisitNumber((prev) => prev + 1);

    if (isFinalInput) {
      onFinish(buildResult(nextHistory));
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
    setVisitNumber(last.visitNumber);
    setDart1Hit(last.darts[0].multiplier);
    setDart2Hit(last.darts[1].multiplier);
    setDart3Hit(last.darts[2].multiplier);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleRegisterVisit();
      } else if (e.key === 'u' || e.key === 'U') {
        handleUndo();
      } else if (e.key === 'h' || e.key === 'H' || e.key === 't' || e.key === 'T') {
        // Quick 3 Trebles shortcut
        sound.tap();
        setDart1Hit('treble');
        setDart2Hit('treble');
        setDart3Hit('treble');
      } else if (e.key === 'm' || e.key === 'M' || e.key === '0') {
        // Quick 3 Misses shortcut
        sound.tap();
        setDart1Hit('miss');
        setDart2Hit('miss');
        setDart3Hit('miss');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="w-full max-w-xl mx-auto space-y-2 sm:space-y-3">
      {/* 10-Min Timer Final Input Notification Banner */}
      {isFinalInput && (
        <div className="bg-amber-950/80 border-2 border-amber-500/80 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-amber-200 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-center sm:text-left">
            <Hourglass className="w-4 h-4 text-amber-400 shrink-0" />
            <span>10-min timer reached! Complete this final visit or finish now.</span>
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

      {/* Top Scoreboard Card */}
      <div className="bg-[#15191e] border border-[#232930] rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-center shadow-xl relative overflow-hidden">
        {/* Header Badges */}
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-1 sm:mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-amber-400 font-black">
              <Zap className="w-4 h-4" /> Power Switch
            </span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[11px]">
              Visit #{visitNumber}
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
          <div className="text-6xl sm:text-8xl font-mono font-black text-amber-400 tracking-tight leading-none drop-shadow-md">
            {totalPoints.toLocaleString()}
          </div>
          <span className="text-[11px] sm:text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">
            Total Points (Treble=3 · Double=2 · Single=1)
          </span>
        </div>

        {/* Compact Performance Stats Along Blue Line */}
        <div className="mt-2.5 pt-2 border-t-2 border-blue-500/90 grid grid-cols-4 gap-1 text-center">
          <div className="px-0.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider block leading-tight">
              Avg / Visit
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-emerald-400 block mt-0.5">
              {pointsPerVisitAvg}
            </span>
          </div>

          <div className="px-0.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider block leading-tight">
              Treble %
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-cyan-400 block mt-0.5">
              {trebleRate}%
            </span>
          </div>

          <div className="px-0.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider block leading-tight">
              T / D / S
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-amber-400 block mt-0.5 truncate">
              {trebleHits}/{doubleHits}/{singleHits}
            </span>
          </div>

          <div className="px-0.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider block leading-tight">
              Visits / Darts
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-white block mt-0.5">
              {history.length} ({totalDarts})
            </span>
          </div>
        </div>
      </div>

      {/* Target & Dart Input Matrix */}
      <div className="bg-[#121519] border border-[#232930] rounded-2xl p-3 sm:p-4 text-center shadow-lg">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#232930] text-xs">
          <span className="font-bold text-neutral-400 uppercase tracking-wider text-[11px]">
            Rule: Starts at T20 · Treble = Stay · Miss/Single/Double = Switch (T20→T19→T18)
          </span>
          <span className="font-mono text-emerald-400 font-bold">
            Visit Score: +{currentVisitPoints} pts
          </span>
        </div>

        {/* 3-Dart Dynamic Selector */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Dart 1 */}
          <div className="bg-[#181d23] border border-[#232930] rounded-xl p-2 sm:p-2.5 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase block">
              1st Dart Target
            </span>
            <div className="text-lg sm:text-xl font-mono font-black text-amber-400 my-0.5">
              {target1}
            </div>

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

          {/* Dart 2 */}
          <div className="bg-[#181d23] border border-[#232930] rounded-xl p-2 sm:p-2.5 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase block">
              2nd Dart Target
            </span>
            <div className="text-lg sm:text-xl font-mono font-black text-amber-400 my-0.5">
              {target2}
            </div>

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

          {/* Dart 3 */}
          <div className="bg-[#181d23] border border-[#232930] rounded-xl p-2 sm:p-2.5 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase block">
              3rd Dart Target
            </span>
            <div className="text-lg sm:text-xl font-mono font-black text-amber-400 my-0.5">
              {target3}
            </div>

            <div className="space-y-1.5 mt-2">
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

        {/* Register Visit Button */}
        <div className="mt-3 pt-2">
          <button
            type="button"
            onClick={handleRegisterVisit}
            className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-neutral-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Register Visit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
