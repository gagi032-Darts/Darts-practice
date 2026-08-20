import React, { useState } from 'react';
import { Crosshair, RotateCcw, Award } from 'lucide-react';
import { BullResult } from '../../types';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface BullWarmupGameProps {
  isFinalInput: boolean;
  onFinish: (result: BullResult) => void;
}

export const BullWarmupGame: React.FC<BullWarmupGameProps> = ({
  isFinalInput,
  onFinish,
}) => {
  const [darts, setDarts] = useState<number>(0);
  const [bull, setBull] = useState<number>(0);
  const [twentyfive, setTwentyfive] = useState<number>(0);
  const [miss, setMiss] = useState<number>(0);
  const [history, setHistory] = useState<('b' | 'p' | 'm')[]>([]);

  const handleInput = (type: 'b' | 'p' | 'm') => {
    if (type === 'b') {
      sound.lock();
    } else if (type === 'p') {
      sound.hit();
    } else {
      sound.miss();
    }

    const nextDarts = darts + 1;
    const nextBull = bull + (type === 'b' ? 1 : 0);
    const nextP = twentyfive + (type === 'p' ? 1 : 0);
    const nextM = miss + (type === 'm' ? 1 : 0);
    const nextHistory = [...history, type];

    setDarts(nextDarts);
    setBull(nextBull);
    setTwentyfive(nextP);
    setMiss(nextM);
    setHistory(nextHistory);
    storage.recordDartsThrown(1);

    if (isFinalInput) {
      const totalScore = nextBull * 50 + nextP * 25;
      const bullRate = nextDarts > 0 ? (nextBull / nextDarts) * 100 : 0;
      onFinish({
        darts: nextDarts,
        bull: nextBull,
        twentyfive: nextP,
        miss: nextM,
        totalScore,
        bullRate: parseFloat(bullRate.toFixed(1)),
      });
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    sound.tap();
    const last = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setDarts(Math.max(0, darts - 1));
    if (last === 'b') setBull(Math.max(0, bull - 1));
    if (last === 'p') setTwentyfive(Math.max(0, twentyfive - 1));
    if (last === 'm') setMiss(Math.max(0, miss - 1));
    storage.recordDartsThrown(-1);
  };

  const totalScore = bull * 50 + twentyfive * 25;
  const onTargetCount = bull + twentyfive;
  const onTargetRate = darts > 0 ? ((onTargetCount / darts) * 100).toFixed(1) : '0.0';
  const innerBullRate = darts > 0 ? ((bull / darts) * 100).toFixed(1) : '0.0';

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Visual Target Area */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-2">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-rose-400">
            <Crosshair className="w-3.5 h-3.5" /> Bullseye Focus Drill
          </span>
          <span className="bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700">
            {darts} Darts Logged
          </span>
        </div>

        {/* Concentric Bull Visual */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-emerald-900/60 border-4 border-emerald-600 flex items-center justify-center shadow-2xl relative">
            <span className="absolute top-2 text-[10px] font-bold text-emerald-300">25 (OUTER)</span>
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-rose-600 border-2 border-rose-400 flex flex-col items-center justify-center shadow-inner">
              <span className="text-xl sm:text-2xl font-black text-white leading-none">50</span>
              <span className="text-[9px] font-extrabold text-rose-200 uppercase">BULL</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Throw 1 dart at a time at the bullseye. Tap the corresponding button below.
        </p>
      </div>

      {/* 3 Action Buttons */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          id="bull-btn-50"
          onClick={() => handleInput('b')}
          className="h-20 sm:h-24 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black shadow-lg border border-rose-400/50 flex flex-col items-center justify-center transition-all"
        >
          <span className="text-xl sm:text-2xl">BULL</span>
          <span className="text-xs font-bold text-rose-200">50 pts (Red)</span>
        </button>

        <button
          type="button"
          id="bull-btn-25"
          onClick={() => handleInput('p')}
          className="h-20 sm:h-24 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-black shadow-lg border border-emerald-500/40 flex flex-col items-center justify-center transition-all"
        >
          <span className="text-xl sm:text-2xl">25</span>
          <span className="text-xs font-bold text-emerald-200">Outer Ring</span>
        </button>

        <button
          type="button"
          id="bull-btn-miss"
          onClick={() => handleInput('m')}
          className="h-20 sm:h-24 rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 font-black shadow-lg border border-neutral-700 flex flex-col items-center justify-center transition-all"
        >
          <span className="text-xl sm:text-2xl">MISS</span>
          <span className="text-xs font-bold text-neutral-400">0 pts</span>
        </button>
      </div>

      {/* Stats Breakdown Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Bull (50)</span>
            <span className="text-lg font-bold text-rose-400 mt-0.5 block">{bull}</span>
            <span className="text-[10px] text-neutral-500">{innerBullRate}%</span>
          </div>

          <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">25 Ring</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{twentyfive}</span>
            <span className="text-[10px] text-neutral-500">{darts ? ((twentyfive / darts) * 100).toFixed(0) : 0}%</span>
          </div>

          <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Misses</span>
            <span className="text-lg font-bold text-neutral-400 mt-0.5 block">{miss}</span>
            <span className="text-[10px] text-neutral-500">{darts ? ((miss / darts) * 100).toFixed(0) : 0}%</span>
          </div>

          <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-700/40">
            <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Total Pts</span>
            <span className="text-lg font-bold text-amber-400 mt-0.5 block">{totalScore}</span>
            <span className="text-[10px] text-neutral-500">{onTargetRate}% on tgt</span>
          </div>
        </div>

        {/* Undo & History */}
        {history.length > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[80%]">
              <span className="text-[10px] text-neutral-500 font-bold uppercase shrink-0">Recent:</span>
              {history.slice(-10).map((h, idx) => (
                <span
                  key={idx}
                  className={`px-1.5 py-0.5 text-xs font-black rounded shrink-0 ${
                    h === 'b'
                      ? 'bg-rose-600 text-white'
                      : h === 'p'
                      ? 'bg-emerald-700 text-emerald-100'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {h === 'b' ? '50' : h === 'p' ? '25' : '0'}
                </span>
              ))}
            </div>

            <button
              type="button"
              id="bull-btn-undo"
              onClick={handleUndo}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
