import React, { useState } from 'react';
import { Target, RotateCcw, Compass, ArrowDown, ArrowRight, ArrowUp, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AlignResult } from '../../types';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface AlignGameProps {
  isFinalInput: boolean;
  onFinish: (result: AlignResult) => void;
}

interface AlignSequence {
  name: string;
  axis: string;
  icon: React.ReactNode;
  targets: string[];
}

const SEQUENCES: AlignSequence[] = [
  {
    name: 'Vertical Down',
    axis: 'Top to Bottom',
    icon: <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />,
    targets: ['20', 'Bull / 25', '3'],
  },
  {
    name: 'Horizontal Right',
    axis: 'Left to Right',
    icon: <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />,
    targets: ['11', 'Bull / 25', '6'],
  },
  {
    name: 'Vertical Up',
    axis: 'Bottom to Top',
    icon: <ArrowUp className="w-3.5 h-3.5 text-amber-400" />,
    targets: ['3', 'Bull / 25', '20'],
  },
  {
    name: 'Horizontal Left',
    axis: 'Right to Left',
    icon: <ArrowLeft className="w-3.5 h-3.5 text-violet-400" />,
    targets: ['6', 'Bull / 25', '11'],
  },
];

export const AlignGame: React.FC<AlignGameProps> = ({
  isFinalInput,
  onFinish,
}) => {
  const [visits, setVisits] = useState<number>(0);
  const [hits, setHits] = useState<number>(0);
  const [perfectVisits, setPerfectVisits] = useState<number>(0);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);

  const handleHitsInput = (hitCount: number) => {
    if (hitCount > 0) {
      if (hitCount === 3) {
        sound.lock();
        try {
          confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
        } catch {
          // ignore
        }
      } else {
        sound.hit();
      }
    } else {
      sound.miss();
    }

    const nextVisits = visits + 1;
    const nextHits = hits + hitCount;
    const nextPerfect = hitCount === 3 ? perfectVisits + 1 : perfectVisits;
    const nextStep = (stepIndex + 1) % SEQUENCES.length;
    const nextHistory = [...history, hitCount];

    setVisits(nextVisits);
    setHits(nextHits);
    setPerfectVisits(nextPerfect);
    setStepIndex(nextStep);
    setHistory(nextHistory);
    storage.recordDartsThrown(3);

    if (isFinalInput) {
      const totalDarts = nextVisits * 3;
      const accuracy = totalDarts > 0 ? (nextHits / totalDarts) * 100 : 0;
      onFinish({
        visits: nextVisits,
        hits: nextHits,
        darts: totalDarts,
        accuracy: parseFloat(accuracy.toFixed(1)),
        perfectVisits: nextPerfect,
      });
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    sound.tap();
    const lastHit = history[history.length - 1];
    const wasPerfect = lastHit === 3;

    setHistory(history.slice(0, -1));
    setVisits(Math.max(0, visits - 1));
    setHits(Math.max(0, hits - lastHit));
    if (wasPerfect) {
      setPerfectVisits(Math.max(0, perfectVisits - 1));
    }
    setStepIndex((stepIndex - 1 + SEQUENCES.length) % SEQUENCES.length);
    storage.recordDartsThrown(-3);
  };

  const totalDarts = visits * 3;
  const accuracy = totalDarts > 0 ? ((hits / totalDarts) * 100).toFixed(1) : '0.0';
  const currentSeq = SEQUENCES[stepIndex];

  return (
    <div className="w-full max-w-xl mx-auto space-y-3.5">
      {/* Target Sequence Card */}
      <div className="bg-[#13161b] border border-[#232930] rounded-2xl p-4 sm:p-5 text-center shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-2">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-emerald-400">
            <Compass className="w-3.5 h-3.5 text-emerald-400" /> Axis: {currentSeq.name}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1c222a] border border-[#2d3642] text-[11px] text-neutral-300 font-mono">
              {currentSeq.icon}
              <span>{currentSeq.axis}</span>
            </span>
            <span className="bg-[#1c222a] text-[11px] px-2 py-0.5 rounded-md text-emerald-400 font-mono border border-[#2d3642]">
              #{stepIndex + 1}/4
            </span>
          </div>
        </div>

        {/* Visual Target Sequence Badges */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-3 sm:my-4">
          {currentSeq.targets.map((tgt, i) => {
            const isCenterBull = tgt.includes('Bull');
            return (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase mb-1 tracking-wider">
                    Dart {i + 1}
                  </span>
                  <div
                    className={`w-18 h-18 sm:w-22 sm:h-22 rounded-2xl flex flex-col items-center justify-center shadow-md transition-transform ${
                      isCenterBull
                        ? 'bg-rose-950/40 border-2 border-rose-500/80 text-rose-300'
                        : 'bg-[#1a2027] border-2 border-emerald-500/80 text-white'
                    }`}
                  >
                    <span
                      className={`font-black tracking-tight leading-none ${
                        isCenterBull ? 'text-lg sm:text-xl text-rose-400' : 'text-2xl sm:text-3xl text-white'
                      }`}
                    >
                      {tgt}
                    </span>
                    {isCenterBull && (
                      <span className="text-[9px] font-bold text-rose-300/80 uppercase mt-0.5 tracking-wider">
                        25 or 50
                      </span>
                    )}
                  </div>
                </div>
                {i < currentSeq.targets.length - 1 && (
                  <span className="text-neutral-500 font-black text-base sm:text-lg pt-4">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Alignment Guidance */}
        <p className="text-[11px] sm:text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
          Throw 3 darts in order along the alignment axis. Single, Double, Treble, and 25/Bull all count as a hit.
        </p>
      </div>

      {/* Action Input Buttons */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="font-bold uppercase tracking-wider text-neutral-400">
            Record Results of 3 Darts:
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            Any segment = Valid Hit
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1 HIT */}
          <button
            type="button"
            id="align-hits-1"
            onClick={() => handleHitsInput(1)}
            className="h-16 sm:h-20 rounded-2xl bg-neutral-800 hover:bg-neutral-750 active:scale-95 text-emerald-300 hover:text-emerald-200 font-black text-lg sm:text-xl border border-neutral-700 hover:border-emerald-500/60 shadow-md flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
          >
            <span>1 HIT</span>
            <span className="text-[10px] text-neutral-400 font-normal">1 / 3 target hit</span>
          </button>

          {/* 2 HITS */}
          <button
            type="button"
            id="align-hits-2"
            onClick={() => handleHitsInput(2)}
            className="h-16 sm:h-20 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/80 active:scale-95 text-emerald-300 hover:text-emerald-100 font-black text-lg sm:text-xl border border-emerald-700/70 hover:border-emerald-500 shadow-md flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
          >
            <span>2 HITS</span>
            <span className="text-[10px] text-emerald-400/80 font-normal">2 / 3 targets hit</span>
          </button>

          {/* 3 HITS */}
          <button
            type="button"
            id="align-hits-3"
            onClick={() => handleHitsInput(3)}
            className="h-16 sm:h-20 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-lg sm:text-xl border border-emerald-400/60 shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
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
            id="align-hits-0"
            onClick={() => handleHitsInput(0)}
            className="h-16 sm:h-20 rounded-2xl bg-neutral-900 hover:bg-neutral-850 active:scale-95 text-rose-300 hover:text-rose-200 font-black text-lg sm:text-xl border border-rose-900/60 hover:border-rose-700/80 shadow-md flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
          >
            <span>MISS</span>
            <span className="text-[10px] text-neutral-500 font-normal">0 / 3 hits</span>
          </button>
        </div>
      </div>

      {/* Live Stats Scorecard & Undo */}
      <div className="bg-[#12151a] border border-[#22272e] rounded-xl p-3 shadow-inner">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-[#181d23] border border-[#262e37]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Accuracy
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
              {accuracy}%
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#181d23] border border-[#262e37]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Hits / Darts
            </span>
            <span className="text-lg sm:text-xl font-black text-white font-mono">
              {hits} <span className="text-xs text-neutral-400 font-normal">/ {totalDarts}</span>
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#181d23] border border-[#262e37]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Visits
            </span>
            <span className="text-lg sm:text-xl font-black text-cyan-400 font-mono">
              {visits}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#181d23] border border-[#262e37]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              3-Hits Max
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">
              {perfectVisits}
            </span>
          </div>
        </div>

        {/* Undo Action Bar */}
        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#232930] px-1">
          <span className="text-[11px] text-neutral-400">
            {history.length > 0
              ? `Last throw: ${history[history.length - 1]} hit${history[history.length - 1] === 1 ? '' : 's'}`
              : 'Ready for first visit'}
          </span>

          <button
            type="button"
            id="align-undo-btn"
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              history.length === 0
                ? 'opacity-40 cursor-not-allowed border-neutral-800 text-neutral-600'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border-neutral-700 active:scale-95 cursor-pointer'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Visit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
