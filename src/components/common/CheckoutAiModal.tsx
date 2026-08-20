import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Target,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Lightbulb,
  Search,
  CheckCircle2,
  Flame,
  ChevronRight,
  Layers,
  Zap,
} from 'lucide-react';
import {
  getDetailedCheckout,
  getCheckoutsByCategory,
  DetailedCheckout,
  CheckoutCategory,
  BOGEY_NUMBERS,
} from '../../utils/checkouts';
import { sound } from '../../utils/sound';

interface CheckoutAiModalProps {
  isOpen: boolean;
  initialScore?: number;
  onClose: () => void;
}

export const CheckoutAiModal: React.FC<CheckoutAiModalProps> = ({
  isOpen,
  initialScore = 121,
  onClose,
}) => {
  const [selectedScore, setSelectedScore] = useState<number>(initialScore);
  const [inputVal, setInputVal] = useState<string>(initialScore.toString());
  const [activeTab, setActiveTab] = useState<'analyzer' | 'browse'>('analyzer');
  const [browseCategory, setBrowseCategory] = useState<CheckoutCategory>('all');
  const [browseSearch, setBrowseSearch] = useState<string>('');

  // Sync initialScore when opened
  useEffect(() => {
    if (isOpen) {
      const valid = Math.min(170, Math.max(2, initialScore || 121));
      setSelectedScore(valid);
      setInputVal(valid.toString());
    }
  }, [isOpen, initialScore]);

  // Keyboard shortcut support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        sound.tap();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentCheckout: DetailedCheckout | null = getDetailedCheckout(selectedScore);

  const handleScoreChange = (score: number) => {
    const clamped = Math.min(170, Math.max(2, score));
    setSelectedScore(clamped);
    setInputVal(clamped.toString());
    sound.tap();
  };

  const handleKeypadPress = (digit: string) => {
    sound.tap();
    if (inputVal.length >= 3) {
      setInputVal(digit);
      const parsed = parseInt(digit, 10);
      if (!isNaN(parsed) && parsed >= 2 && parsed <= 170) {
        setSelectedScore(parsed);
      }
      return;
    }

    const nextStr = inputVal === '0' ? digit : inputVal + digit;
    setInputVal(nextStr);
    const parsed = parseInt(nextStr, 10);
    if (!isNaN(parsed) && parsed >= 2 && parsed <= 170) {
      setSelectedScore(parsed);
    }
  };

  const handleKeypadClear = () => {
    sound.tap();
    setInputVal('');
    setSelectedScore(40);
  };

  const handleKeypadBackspace = () => {
    sound.tap();
    const nextStr = inputVal.slice(0, -1);
    setInputVal(nextStr);
    const parsed = parseInt(nextStr, 10);
    if (!isNaN(parsed) && parsed >= 2 && parsed <= 170) {
      setSelectedScore(parsed);
    }
  };

  const quickPresets = [
    { score: 170, label: '170 (Big Fish)' },
    { score: 167, label: '167' },
    { score: 164, label: '164' },
    { score: 161, label: '161' },
    { score: 160, label: '160' },
    { score: 121, label: '121' },
    { score: 100, label: '100' },
    { score: 80, label: '80' },
    { score: 60, label: '60' },
    { score: 50, label: '50 (Bull)' },
    { score: 40, label: '40 (Tops)' },
    { score: 32, label: '32 (D16)' },
  ];

  const browserList = getCheckoutsByCategory(browseCategory, browseSearch);

  const getStepBadgeColor = (type: string) => {
    switch (type) {
      case 'treble':
        return 'bg-rose-950 text-rose-300 border-rose-700/80';
      case 'double':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700/80';
      case 'bull':
        return 'bg-amber-950 text-amber-300 border-amber-600';
      case 'outer':
        return 'bg-teal-950 text-teal-300 border-teal-700';
      default:
        return 'bg-neutral-800 text-neutral-200 border-neutral-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-neutral-950 px-5 py-4 border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shadow-md">
              <Sparkles className="w-5 h-5 text-emerald-400 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-none">
                  Outshot AI Guide
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  170 down to 2
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium mt-1 leading-none">
                Interactive route recognition, tactical splits, and safety paths
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setActiveTab('analyzer');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'analyzer'
                    ? 'bg-emerald-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Analyzer
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  setActiveTab('browse');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'browse'
                    ? 'bg-emerald-500 text-neutral-950 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Browse All
              </button>
            </div>

            <button
              type="button"
              id="checkout-ai-close-btn"
              onClick={() => {
                sound.tap();
                onClose();
              }}
              className="p-2 rounded-xl bg-neutral-850 hover:bg-neutral-800 active:scale-95 text-neutral-400 hover:text-white border border-neutral-700/60 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'analyzer' ? (
            <>
              {/* Score Selector & Keypad Row */}
              <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Target Score (170 down to 2)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleScoreChange(selectedScore - 10)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-bold text-xs border border-neutral-750"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScoreChange(selectedScore - 1)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-bold text-xs border border-neutral-750"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScoreChange(selectedScore + 1)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-bold text-xs border border-neutral-750"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScoreChange(selectedScore + 10)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-bold text-xs border border-neutral-750"
                    >
                      +10
                    </button>
                  </div>
                </div>

                {/* Big Score Display and Keypad Toggle */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-16 rounded-2xl bg-neutral-900 border-2 border-emerald-500/80 flex items-center justify-center shadow-inner">
                      <span className="text-4xl font-mono font-black text-white tracking-tight">
                        {selectedScore}
                      </span>
                    </div>

                    <div>
                      {currentCheckout?.isBigFish && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-700 text-xs font-black uppercase tracking-wider mb-1">
                          <Flame className="w-3.5 h-3.5 text-amber-400" /> The Big Fish
                        </span>
                      )}
                      {currentCheckout?.isShanghai && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-700 text-xs font-black uppercase tracking-wider mb-1">
                          <Zap className="w-3.5 h-3.5 text-teal-400" /> Shanghai Finish
                        </span>
                      )}
                      {currentCheckout?.isDouble && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-black uppercase tracking-wider mb-1">
                          <Target className="w-3.5 h-3.5 text-emerald-400" /> 1-Dart Double
                        </span>
                      )}
                      {currentCheckout?.isBogey && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800 text-xs font-black uppercase tracking-wider mb-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Bogey Score
                        </span>
                      )}
                      <div className="text-xs text-neutral-400 font-medium">
                        {currentCheckout?.isBogey
                          ? 'No 3-dart outshot possible'
                          : `${currentCheckout?.minDarts} dart minimum finish`}
                      </div>
                    </div>
                  </div>

                  {/* On-screen Keypad Row */}
                  <div className="grid grid-cols-6 sm:grid-cols-6 gap-1.5 w-full sm:w-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadPress(digit)}
                        className="h-10 sm:h-8 rounded-xl bg-neutral-850 hover:bg-neutral-800 active:scale-95 text-white font-mono font-bold text-sm sm:text-xs border border-neutral-700/60 shadow-xs flex items-center justify-center cursor-pointer"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="h-10 sm:h-8 rounded-xl bg-neutral-800 hover:bg-neutral-750 active:scale-95 text-neutral-300 font-bold text-sm sm:text-xs border border-neutral-700 flex items-center justify-center cursor-pointer"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="h-10 sm:h-8 rounded-xl bg-rose-950/60 hover:bg-rose-900 active:scale-95 text-rose-300 font-bold text-sm sm:text-xs border border-rose-800/80 flex items-center justify-center cursor-pointer"
                    >
                      CLR
                    </button>
                  </div>
                </div>

                {/* Quick Outshot Chips */}
                <div className="pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase shrink-0">
                      Popular:
                    </span>
                    {quickPresets.map((p) => (
                      <button
                        key={p.score}
                        type="button"
                        onClick={() => handleScoreChange(p.score)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border cursor-pointer active:scale-95 ${
                          selectedScore === p.score
                            ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-xs font-black'
                            : 'bg-neutral-900 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Route Recognition Card */}
              {currentCheckout && !currentCheckout.isBogey ? (
                <div className="space-y-4">
                  {/* Primary Route Breakdown Visual */}
                  <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-850 border-2 border-emerald-500/60 rounded-3xl p-5 shadow-xl">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-3">
                      <span className="flex items-center gap-1.5 text-emerald-400 uppercase tracking-wider">
                        <Target className="w-4 h-4" /> Recommended Primary Route
                      </span>
                      <span className="bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded-full border border-neutral-700">
                        {currentCheckout.minDarts} {currentCheckout.minDarts === 1 ? 'dart' : 'darts'}
                      </span>
                    </div>

                    {/* Darts Sequence Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
                      {currentCheckout.dartSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`rounded-2xl p-3 border-2 flex flex-col items-center justify-center text-center shadow-md relative ${getStepBadgeColor(
                            step.type
                          )}`}
                        >
                          <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">
                            Dart {step.dartNumber}
                          </span>
                          <span className="text-3xl sm:text-4xl font-black tracking-tight my-1">
                            {step.target}
                          </span>
                          <span className="text-[11px] font-semibold opacity-90">
                            {step.note || `${step.points} pts`}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Primary Route Text String */}
                    <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                      <span className="text-neutral-400">Sequence:</span>
                      <span className="font-mono font-black text-emerald-400 text-sm sm:text-base">
                        {currentCheckout.primaryRoute}
                      </span>
                    </div>
                  </div>

                  {/* AI Strategy & Tactical Guidance */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 shrink-0 mt-0.5">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          AI Tactical Recommendation
                        </h4>
                        <p className="text-xs sm:text-sm text-neutral-300 mt-1 leading-relaxed">
                          {currentCheckout.aiAdvice}
                        </p>
                      </div>
                    </div>

                    {/* Single Miss / Adjustment Path */}
                    {currentCheckout.singleMissAdvice && (
                      <div className="pt-3 border-t border-neutral-800/80 flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-teal-950 border border-teal-800 text-teal-400 shrink-0 mt-0.5">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                            If First Dart Misses (Single Hit):
                          </h4>
                          <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                            {currentCheckout.singleMissAdvice}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Alternate & Safety Routes */}
                  {currentCheckout.alternateRoutes && currentCheckout.alternateRoutes.length > 0 && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Alternative / Safety Routes</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentCheckout.alternateRoutes.map((alt, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 rounded-xl bg-neutral-850 border border-neutral-750 text-neutral-200 font-mono text-xs font-bold flex items-center gap-2"
                          >
                            <span className="text-cyan-400">#{idx + 1}</span>
                            <span>{alt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Bogey Alert Card */
                <div className="bg-rose-950/40 border-2 border-rose-800 rounded-3xl p-5 text-center shadow-xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-900/80 border border-rose-700 flex items-center justify-center text-rose-300 mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    {selectedScore} is a Bogey Score
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-200 max-w-md mx-auto leading-relaxed">
                    It is mathematically impossible to check out in 3 darts with double out.
                  </p>
                  <div className="bg-neutral-900/90 border border-neutral-800 p-3.5 rounded-2xl text-xs text-neutral-300 text-left space-y-1">
                    <span className="font-bold text-amber-400 block uppercase text-[10px]">
                      AI Setup Tip:
                    </span>
                    <span>
                      Throw dart 1 at Treble 20 to score 60 points and leave a standard 2-dart finish for your next visit.
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Browse / Filter All 170 down to 2 Outshots */
            <div className="space-y-4">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {(
                  [
                    { id: 'all', label: 'All (170-2)' },
                    { id: 'doubles', label: '1-Dart Doubles' },
                    { id: '2-dart', label: '2-Dart (41–100)' },
                    { id: '3-dart', label: '3-Dart (101–170)' },
                    { id: 'big', label: 'Big (121–170)' },
                    { id: 'bogey', label: 'Bogey Numbers' },
                  ] as { id: CheckoutCategory; label: string }[]
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      sound.tap();
                      setBrowseCategory(cat.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                      browseCategory === cat.id
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-xs'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={browseSearch}
                  onChange={(e) => setBrowseSearch(e.target.value)}
                  placeholder="Search score (e.g. 121, 170, 60)..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Table / List View */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {browserList.map((item) => (
                  <button
                    key={item.score}
                    type="button"
                    onClick={() => {
                      setSelectedScore(item.score);
                      setInputVal(item.score.toString());
                      setActiveTab('analyzer');
                      sound.tap();
                    }}
                    className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between gap-3 transition-all hover:scale-[1.005] active:scale-99 ${
                      item.isBogey
                        ? 'bg-rose-950/30 border-rose-900/60 hover:border-rose-700'
                        : item.score >= 121
                        ? 'bg-neutral-900 border-neutral-800 hover:border-emerald-500/60'
                        : 'bg-neutral-900 border-neutral-800 hover:border-emerald-500/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-10 rounded-xl flex items-center justify-center font-mono font-black text-lg border ${
                          item.isBogey
                            ? 'bg-rose-900/40 text-rose-300 border-rose-800'
                            : 'bg-neutral-800 text-white border-neutral-700'
                        }`}
                      >
                        {item.score}
                      </div>
                      <div>
                        <div className="font-mono font-bold text-xs sm:text-sm text-emerald-400">
                          {item.primaryRoute}
                        </div>
                        <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                          {item.aiAdvice}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.isBigFish && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-black">
                          Big Fish
                        </span>
                      )}
                      {item.isShanghai && (
                        <span className="px-2 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-700 text-[10px] font-black">
                          Shanghai
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-neutral-950 px-5 py-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <span>Press ESC to close</span>
          <button
            type="button"
            onClick={() => {
              sound.tap();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-all border border-neutral-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
