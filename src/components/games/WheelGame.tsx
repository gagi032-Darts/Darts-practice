import React, { useState, useEffect } from 'react';
import { RotateCw, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';
import { WheelResult } from '../../types';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface WheelGameProps {
  isFinalInput: boolean;
  onFinish: (result: WheelResult) => void;
}

interface VisitRecord {
  hitsRecorded: number;
}

const FIXED_TARGETS = [20, 19, 18];

export const WheelGame: React.FC<WheelGameProps> = ({
  isFinalInput,
  onFinish,
}) => {
  const [history, setHistory] = useState<VisitRecord[]>([]);

  const totalVisits = history.length;
  const totalDarts = totalVisits * 3;
  const totalHits = history.reduce((sum, v) => sum + v.hitsRecorded, 0);
  const accuracy = totalDarts > 0 ? ((totalHits / totalDarts) * 100).toFixed(1) : '0.0';

  const handleRecordHits = (hitsCount: number) => {
    if (hitsCount === 3) {
      sound.lock();
    } else if (hitsCount > 0) {
      sound.hit();
    } else {
      sound.miss();
    }

    const newRecord: VisitRecord = {
      hitsRecorded: hitsCount,
    };

    const nextHistory = [...history, newRecord];

    setHistory(nextHistory);
    storage.recordDartsThrown(3);

    if (isFinalInput) {
      const nextDarts = nextHistory.length * 3;
      const nextHits = nextHistory.reduce((sum, v) => sum + v.hitsRecorded, 0);
      const nextAcc = nextDarts > 0 ? (nextHits / nextDarts) * 100 : 0;

      onFinish({
        darts: nextDarts,
        hits: nextHits,
        accuracy: parseFloat(nextAcc.toFixed(1)),
      });
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    sound.tap();
    setHistory((prev) => prev.slice(0, -1));
    storage.recordDartsThrown(-3);
  };

  // Keyboard support for rapid logging at the board
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '1') {
        e.preventDefault();
        handleRecordHits(1);
      } else if (e.key === '2') {
        e.preventDefault();
        handleRecordHits(2);
      } else if (e.key === '3') {
        e.preventDefault();
        handleRecordHits(3);
      } else if (e.key === '0' || e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleRecordHits(0);
      } else if (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, isFinalInput]);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Target Triplet Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 text-center shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-3">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-emerald-400">
            <RotateCw className="w-3.5 h-3.5" /> The Wheel Warm-up
          </span>
          <span className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full border border-neutral-700 font-semibold">
            Visit #{totalVisits + 1}
          </span>
        </div>

        {/* Subtitle instructions */}
        <p className="text-xs sm:text-sm text-neutral-300 font-medium mb-4">
          Throw <b className="text-white">1 dart</b> at each target in sequence:
        </p>

        {/* 3 Targets Visual Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 my-2">
          {FIXED_TARGETS.map((target, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-b from-neutral-800 to-neutral-850 border-2 border-emerald-500/70 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-lg relative"
            >
              <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Dart {idx + 1}
              </span>
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight my-1">
                {target}
              </span>
              <span className="text-[10px] text-neutral-400 font-medium">Single segment</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4 HIT BUTTONS: 1 HIT | 2 HITS | 3 HITS | MISS */}
      <div className="space-y-2">
        <div className="text-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Record Results of 3 Darts:
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1 HIT */}
          <button
            type="button"
            id="wheel-btn-1hit"
            onClick={() => handleRecordHits(1)}
            className="h-16 sm:h-20 rounded-2xl bg-neutral-800 hover:bg-neutral-750 active:scale-95 text-emerald-300 hover:text-emerald-200 font-black text-lg sm:text-xl border border-neutral-700 hover:border-emerald-500/60 shadow-md flex flex-col items-center justify-center gap-0.5 transition-all"
          >
            <span>1 HIT</span>
            <span className="text-[10px] text-neutral-400 font-normal">1 / 3 target hit</span>
          </button>

          {/* 2 HITS */}
          <button
            type="button"
            id="wheel-btn-2hits"
            onClick={() => handleRecordHits(2)}
            className="h-16 sm:h-20 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/80 active:scale-95 text-emerald-300 hover:text-emerald-100 font-black text-lg sm:text-xl border border-emerald-700/70 hover:border-emerald-500 shadow-md flex flex-col items-center justify-center gap-0.5 transition-all"
          >
            <span>2 HITS</span>
            <span className="text-[10px] text-emerald-400/80 font-normal">2 / 3 targets hit</span>
          </button>

          {/* 3 HITS */}
          <button
            type="button"
            id="wheel-btn-3hits"
            onClick={() => handleRecordHits(3)}
            className="h-16 sm:h-20 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-lg sm:text-xl border border-emerald-400/60 shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all"
          >
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>3 HITS</span>
            </div>
            <span className="text-[10px] text-emerald-100 font-medium">All 3 targets hit!</span>
          </button>

          {/* MISS */}
          <button
            type="button"
            id="wheel-btn-miss"
            onClick={() => handleRecordHits(0)}
            className="h-16 sm:h-20 rounded-2xl bg-neutral-900 hover:bg-neutral-850 active:scale-95 text-rose-300 hover:text-rose-200 font-black text-lg sm:text-xl border border-rose-900/60 hover:border-rose-700/80 shadow-md flex flex-col items-center justify-center gap-0.5 transition-all"
          >
            <span>MISS</span>
            <span className="text-[10px] text-neutral-500 font-normal">0 / 3 hits</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-neutral-850 p-2.5 rounded-xl border border-neutral-800">
            <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">
              Darts Thrown
            </span>
            <span className="text-xl font-mono font-black text-white mt-0.5 block">
              {totalDarts}
            </span>
          </div>

          <div className="bg-neutral-850 p-2.5 rounded-xl border border-neutral-800">
            <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">
              Hits Recorded
            </span>
            <span className="text-xl font-mono font-black text-emerald-400 mt-0.5 block">
              {totalHits}
            </span>
          </div>

          <div className="bg-neutral-850 p-2.5 rounded-xl border border-neutral-800">
            <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">
              Hit Accuracy
            </span>
            <span className="text-xl font-mono font-black text-cyan-400 mt-0.5 block">
              {accuracy}%
            </span>
          </div>
        </div>

        {/* History Strip & Undo */}
        {history.length > 0 && (
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[75%] scrollbar-none">
              <span className="text-[10px] text-neutral-500 font-bold uppercase shrink-0">
                Recent:
              </span>
              {history.slice(-8).map((h, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg shrink-0 border font-mono ${
                    h.hitsRecorded === 3
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : h.hitsRecorded === 2
                      ? 'bg-teal-950 text-teal-300 border-teal-800'
                      : h.hitsRecorded === 1
                      ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      : 'bg-rose-950/60 text-rose-400 border-rose-900'
                  }`}
                >
                  {h.hitsRecorded}/3
                </span>
              ))}
            </div>

            <button
              type="button"
              id="wheel-btn-undo"
              onClick={handleUndo}
              className="text-xs text-neutral-300 hover:text-white px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 border border-neutral-700 flex items-center gap-1.5 shrink-0 transition-all font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
              <span>Undo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
