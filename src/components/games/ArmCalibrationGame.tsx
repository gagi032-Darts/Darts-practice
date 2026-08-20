import React, { useState } from 'react';
import { Target, RotateCcw, CheckCircle2, Award } from 'lucide-react';
import { ArmCalResult } from '../../types';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface ArmCalibrationGameProps {
  isFinalInput: boolean;
  onFinish: (result: ArmCalResult) => void;
}

const SEQUENCES = [
  { text: '20 → 6 → 3', targets: ['20', '6', '3'] },
  { text: '6 → 3 → 11', targets: ['6', '3', '11'] },
  { text: '3 → 11 → 20', targets: ['3', '11', '20'] },
  { text: '11 → 20 → Bull', targets: ['11', '20', 'Bull'] },
];

export const ArmCalibrationGame: React.FC<ArmCalibrationGameProps> = ({
  isFinalInput,
  onFinish,
}) => {
  const [visits, setVisits] = useState<number>(0);
  const [hits, setHits] = useState<number>(0);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);

  const handleHitsInput = (hitCount: number) => {
    if (hitCount > 0) {
      if (hitCount === 3) sound.lock();
      else sound.hit();
    } else {
      sound.miss();
    }

    const nextVisits = visits + 1;
    const nextHits = hits + hitCount;
    const nextStep = (stepIndex + 1) % SEQUENCES.length;
    const nextHistory = [...history, hitCount];

    setVisits(nextVisits);
    setHits(nextHits);
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
      });
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    sound.tap();
    const lastHit = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setVisits(Math.max(0, visits - 1));
    setHits(Math.max(0, hits - lastHit));
    setStepIndex((stepIndex - 1 + SEQUENCES.length) % SEQUENCES.length);
    storage.recordDartsThrown(-3);
  };

  const totalDarts = visits * 3;
  const accuracy = totalDarts > 0 ? ((hits / totalDarts) * 100).toFixed(1) : '0.0';
  const currentSeq = SEQUENCES[stepIndex];

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Target Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 text-center shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-2">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-emerald-400">
            <Target className="w-3.5 h-3.5" /> Target Sequence (1 Dart Each)
          </span>
          <span className="bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700">
            Sequence #{stepIndex + 1} of 4
          </span>
        </div>

        {/* Visual Target Pills */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-4">
          {currentSeq.targets.map((tgt, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-neutral-400 font-bold uppercase mb-1">
                  Dart {i + 1}
                </span>
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-neutral-800/90 border-2 border-emerald-500/80 flex items-center justify-center shadow-md">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {tgt}
                  </span>
                </div>
              </div>
              {i < currentSeq.targets.length - 1 && (
                <span className="text-neutral-500 font-black text-lg pt-4">→</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Info Note */}
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Throw 3 darts in order at the targets above. Log how many hit the designated targets.
        </p>
      </div>

      {/* Large Input Actions */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block px-1">
          Record Visit Hits
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            id="arm-cal-3"
            onClick={() => handleHitsInput(3)}
            className="h-16 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-lg shadow-md border border-emerald-400/40 flex flex-col items-center justify-center transition-all"
          >
            <span>3 HITS</span>
            <span className="text-[10px] font-semibold text-emerald-200 opacity-90">100% Perfect</span>
          </button>

          <button
            type="button"
            id="arm-cal-2"
            onClick={() => handleHitsInput(2)}
            className="h-16 rounded-xl bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-black text-lg shadow-md border border-teal-500/40 flex flex-col items-center justify-center transition-all"
          >
            <span>2 HITS</span>
            <span className="text-[10px] font-semibold text-teal-200 opacity-90">66.7%</span>
          </button>

          <button
            type="button"
            id="arm-cal-1"
            onClick={() => handleHitsInput(1)}
            className="h-16 rounded-xl bg-neutral-700 hover:bg-neutral-600 active:scale-95 text-white font-black text-lg shadow-md border border-neutral-600/60 flex flex-col items-center justify-center transition-all"
          >
            <span>1 HIT</span>
            <span className="text-[10px] font-semibold text-neutral-300 opacity-90">33.3%</span>
          </button>

          <button
            type="button"
            id="arm-cal-0"
            onClick={() => handleHitsInput(0)}
            className="h-16 rounded-xl bg-rose-900/60 hover:bg-rose-800/80 active:scale-95 text-rose-200 font-black text-lg shadow-md border border-rose-700/50 flex flex-col items-center justify-center transition-all"
          >
            <span>0 HITS</span>
            <span className="text-[10px] font-semibold text-rose-300 opacity-90">Missed all</span>
          </button>
        </div>
      </div>

      {/* Stats Breakdown Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Visits</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{visits}</span>
            <span className="text-[10px] text-neutral-500">{totalDarts} darts</span>
          </div>

          <div className="bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Total Hits</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{hits}</span>
            <span className="text-[10px] text-neutral-500">out of {totalDarts}</span>
          </div>

          <div className="bg-neutral-800/60 p-2.5 rounded-lg border border-neutral-700/40">
            <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Accuracy</span>
            <span className="text-xl font-bold text-cyan-400 mt-0.5 block">{accuracy}%</span>
            <span className="text-[10px] text-neutral-500">hit rate</span>
          </div>
        </div>

        {/* History Ticker & Undo */}
        {history.length > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-[80%]">
              <span className="text-[10px] text-neutral-500 font-bold uppercase shrink-0 mr-1">
                Recent:
              </span>
              {history.slice(-8).map((h, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 text-xs font-bold rounded-md shrink-0 ${
                    h === 3
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                      : h === 2
                      ? 'bg-teal-900/60 text-teal-300 border border-teal-700/50'
                      : h === 1
                      ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                  }`}
                >
                  {h}
                </span>
              ))}
            </div>

            <button
              type="button"
              id="arm-cal-undo"
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
