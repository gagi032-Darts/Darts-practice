import React, { useState } from 'react';
import { TrendingUp, Award, Flame } from 'lucide-react';
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
      const sum = nextVisits.reduce((acc, x) => acc + x, 0);
      const avgVal = nextVisits.length > 0 ? sum / nextVisits.length : 0;
      const best = nextVisits.length > 0 ? Math.max(...nextVisits) : 0;

      const first9 = nextVisits.slice(0, 3);
      const first9Avg =
        first9.length > 0
          ? parseFloat((first9.reduce((acc, x) => acc + x, 0) / first9.length).toFixed(2))
          : null;

      const distMap: Record<string, number> = {};
      BUCKETS.forEach((b) => {
        distMap[b.label] = nextVisits.filter(b.test).length;
      });

      onFinish({
        visits: nextVisits,
        avg: parseFloat(avgVal.toFixed(2)),
        totalPoints: sum,
        darts: nextVisits.length * 3,
        bestVisit: best,
        firstNineAvg: first9Avg,
        oneEighties: nextVisits.filter((x) => x === 180).length,
        tonForties: nextVisits.filter((x) => x >= 140 && x < 180).length,
        tons: nextVisits.filter((x) => x >= 100 && x < 140).length,
        distribution: distMap,
      });
    }
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

  return (
    <div className="w-full max-w-xl mx-auto space-y-3 sm:space-y-4">
      {/* Top Banner Card */}
      <div className="bg-[#15191e] border border-[#232930] rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-center shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-1 sm:mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-emerald-400 font-black">
              <TrendingUp className="w-4 h-4" /> High Score {drillNumber ? `#${drillNumber}` : ''}
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

        {/* Big Score / Running Total Display */}
        <div className="my-1 sm:my-2 flex flex-col items-center justify-center">
          <div className="text-5xl sm:text-7xl font-mono font-black text-white tracking-tight leading-none drop-shadow-md">
            {totalScore.toLocaleString()}
          </div>
          <span className="text-[11px] sm:text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">
            Total Points Scored
          </span>
        </div>
      </div>

      {/* X01 5-Column Precision Match Keypad */}
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

      {/* Live Performance Stats Strip */}
      <div className="bg-[#15191e] border border-[#232930] rounded-2xl p-3 sm:p-4 shadow-md">
        <div className="grid grid-cols-3 gap-2.5 text-center">
          {/* 1. 3-Dart Average */}
          <div className="bg-[#1c222a] p-2.5 sm:p-3 rounded-xl border border-[#2b3440] shadow-inner">
            <span className="text-[11px] font-bold text-neutral-400 block uppercase tracking-wider">
              3-Dart Avg
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-0.5 block tracking-tight">
              {avg}
            </span>
          </div>

          {/* 2. Total Darts */}
          <div className="bg-[#1c222a] p-2.5 sm:p-3 rounded-xl border border-[#2b3440] shadow-inner">
            <span className="text-[11px] font-bold text-neutral-400 block uppercase tracking-wider">
              Darts Thrown
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-cyan-400 mt-0.5 block tracking-tight">
              {visits.length * 3}
            </span>
          </div>

          {/* 3. Best Visit */}
          <div className="bg-[#1c222a] p-2.5 sm:p-3 rounded-xl border border-[#2b3440] shadow-inner">
            <span className="text-[11px] font-bold text-neutral-400 block uppercase tracking-wider">
              Best Visit
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-0.5 block tracking-tight">
              {best}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


