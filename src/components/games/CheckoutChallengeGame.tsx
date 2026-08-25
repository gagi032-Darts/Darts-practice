import React, { useState, useEffect } from 'react';
import {
  Target,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Trophy,
  Flame,
  Undo2,
  Play,
  TrendingUp,
  Award,
  ChevronRight,
  Sliders,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CheckoutChallengeResult, CheckoutChallengeAttemptRecord } from '../../types';
import { getDetailedCheckout, getCheckoutRoute, BOGEY_NUMBERS } from '../../utils/checkouts';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';

interface CheckoutChallengeGameProps {
  isFinalInput: boolean;
  onFinish: (result: CheckoutChallengeResult) => void;
  onOpenCheckoutAi?: (score: number) => void;
  onStartCustomTimer?: (durationMinutes: number) => void;
}

interface AttemptHistoryState {
  target: number;
  highestCheckout: number;
  attempts: number;
  checkoutsMade: number;
  totalDarts: number;
  currentStreak: number;
  bestStreak: number;
  history: CheckoutChallengeAttemptRecord[];
}

const STORAGE_KEY_BEST_CHECKOUT = 'darts_cochallenge_best_checkout';
const STORAGE_KEY_BEST_RATE = 'darts_cochallenge_best_rate';

export const CheckoutChallengeGame: React.FC<CheckoutChallengeGameProps> = ({
  isFinalInput,
  onFinish,
  onOpenCheckoutAi,
  onStartCustomTimer,
}) => {
  // Setup configuration
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [startCheckout, setStartCheckout] = useState<number>(21);
  const selectedDuration = 20;

  // Active game state
  const [currentTarget, setCurrentTarget] = useState<number>(21);
  const [highestCheckout, setHighestCheckout] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [checkoutsMade, setCheckoutsMade] = useState<number>(0);
  const [totalDarts, setTotalDarts] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [history, setHistory] = useState<CheckoutChallengeAttemptRecord[]>([]);

  // Undo stack
  const [undoStack, setUndoStack] = useState<AttemptHistoryState[]>([]);

  // Modals / Helpers
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // High score tracking from storage
  const [recordCheckout, setRecordCheckout] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BEST_CHECKOUT);
    return saved ? parseInt(saved, 10) : 0;
  });

  // Calculate current checkout details
  const detailed = getDetailedCheckout(currentTarget);
  const minDartsForTarget = detailed?.minDarts || 3;
  const isBogey = detailed?.isBogey || BOGEY_NUMBERS.includes(currentTarget) || currentTarget > 170;

  // Determine button enabled states
  // 1-Dart is valid only for doubles 2-40 and Bull 50
  const canFinishIn1Dart =
    currentTarget === 50 || (currentTarget <= 40 && currentTarget >= 2 && currentTarget % 2 === 0);

  // 2-Darts is valid if minDarts <= 2 and not bogey
  const canFinishIn2Darts = !isBogey && minDartsForTarget <= 2 && currentTarget <= 110;

  // 3-Darts is valid for all legitimate checkouts <= 170 that are not bogey
  const canFinishIn3Darts = !isBogey && currentTarget >= 2 && currentTarget <= 170;

  // Format suggestion string
  const primaryRouteDisplay = detailed?.primaryRoute
    ? detailed.primaryRoute.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
    : getCheckoutRoute(currentTarget) || '—';

  // Handle Start Challenge from setup screen
  const handleStartChallenge = () => {
    sound.lock();
    setCurrentTarget(startCheckout);
    setHighestCheckout(0);
    setAttempts(0);
    setCheckoutsMade(0);
    setTotalDarts(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setHistory([]);
    setUndoStack([]);
    setHasStarted(true);

    if (onStartCustomTimer) {
      onStartCustomTimer(selectedDuration);
    }
  };

  // Save undo snapshot
  const saveUndoSnapshot = () => {
    setUndoStack((prev) => [
      ...prev,
      {
        target: currentTarget,
        highestCheckout,
        attempts,
        checkoutsMade,
        totalDarts,
        currentStreak,
        bestStreak,
        history: [...history],
      },
    ]);
  };

  // Handle Undo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    sound.tap();
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((old) => old.slice(0, -1));

    setCurrentTarget(prev.target);
    setHighestCheckout(prev.highestCheckout);
    setAttempts(prev.attempts);
    setCheckoutsMade(prev.checkoutsMade);
    setTotalDarts(prev.totalDarts);
    setCurrentStreak(prev.currentStreak);
    setBestStreak(prev.bestStreak);
    setHistory(prev.history);
  };

  // Handle Darts Finished (1, 2, or 3 darts)
  const handleCheckoutHit = (dartsUsed: 1 | 2 | 3) => {
    saveUndoSnapshot();
    sound.lock();

    const newCheckoutsMade = checkoutsMade + 1;
    const newAttempts = attempts + 1;
    const newTotalDarts = totalDarts + dartsUsed;
    const newStreak = currentStreak + 1;
    const newBestStreak = Math.max(bestStreak, newStreak);
    const newHighest = Math.max(highestCheckout, currentTarget);

    // If new record checkout, celebrate
    if (currentTarget > recordCheckout) {
      setRecordCheckout(currentTarget);
      localStorage.setItem(STORAGE_KEY_BEST_CHECKOUT, currentTarget.toString());
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } else if (currentTarget >= 100) {
      confetti({
        particleCount: 40,
        spread: 45,
        origin: { y: 0.65 },
      });
    }

    // Success rule: Next checkout increases by +10
    const nextTarget = currentTarget + 10;

    const record: CheckoutChallengeAttemptRecord = {
      target: currentTarget,
      result: 'hit',
      dartsUsed,
      nextTarget,
      checkoutRoute: primaryRouteDisplay,
    };

    setCheckoutsMade(newCheckoutsMade);
    setAttempts(newAttempts);
    setTotalDarts(newTotalDarts);
    setCurrentStreak(newStreak);
    setBestStreak(newBestStreak);
    setHighestCheckout(newHighest);
    setHistory((prev) => [record, ...prev]);
    setCurrentTarget(nextTarget);
  };

  // Handle Missed Out (failed in max 3 darts)
  const handleCheckoutMiss = () => {
    saveUndoSnapshot();
    sound.miss();

    const newAttempts = attempts + 1;
    const newTotalDarts = totalDarts + 3; // 3 darts thrown
    const newStreak = 0;

    // Miss rule: Next checkout reduced by 1 if bigger than starting checkout
    let nextTarget = currentTarget;
    if (currentTarget > startCheckout) {
      nextTarget = currentTarget - 1;
    }

    const record: CheckoutChallengeAttemptRecord = {
      target: currentTarget,
      result: 'miss',
      dartsUsed: 3,
      nextTarget,
      checkoutRoute: primaryRouteDisplay,
    };

    setAttempts(newAttempts);
    setTotalDarts(newTotalDarts);
    setCurrentStreak(newStreak);
    setHistory((prev) => [record, ...prev]);
    setCurrentTarget(nextTarget);
  };

  // Compile final result
  const handleCompleteSession = () => {
    sound.hit();
    const rate = attempts > 0 ? parseFloat(((checkoutsMade / attempts) * 100).toFixed(1)) : 0;
    const result: CheckoutChallengeResult = {
      startTarget: startCheckout,
      highestCheckout,
      attempts,
      checkoutsMade,
      checkoutRate: rate,
      totalDarts,
      bestStreak,
      finalTarget: currentTarget,
      selectedDurationMinutes: selectedDuration,
      history,
    };
    onFinish(result);
  };

  // Trigger completion automatically if final input flag turns true
  useEffect(() => {
    if (isFinalInput && hasStarted) {
      handleCompleteSession();
    }
  }, [isFinalInput]);

  const checkoutRate = attempts > 0 ? ((checkoutsMade / attempts) * 100).toFixed(1) : '0.0';

  // ----------------------------------------------------
  // PRE-GAME SETUP SCREEN
  // ----------------------------------------------------
  if (!hasStarted) {
    const START_OPTIONS = [21, 31, 41, 51, 61, 71, 81, 101, 121];

    return (
      <div className="w-full max-w-xl mx-auto px-3 py-3 sm:py-6 space-y-4 animate-fadeIn">
        {/* Hero Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 text-center shadow-2xl relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Target className="w-7 h-7" />
          </div>

          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">
            🎯 Finishing Segment Drill · 20 Min
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Checkout Challenge
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
            Climb the checkout ladder! Take out each score in <b>max 3 darts</b>. Hit = <b>+10</b> to next checkout. Miss = <b>-1</b> down to start.
          </p>

          {/* Setup Selectors */}
          <div className="space-y-4 my-5 text-left">
            {/* Start Checkout Picker */}
            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-4 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Starting Checkout
                </span>
                <span className="text-xs font-mono font-black text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded-lg">
                  Target: {startCheckout}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {START_OPTIONS.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      sound.tap();
                      setStartCheckout(num);
                    }}
                    className={`flex-1 min-w-[50px] py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      startCheckout === num
                        ? 'bg-cyan-500 text-neutral-950 shadow-md font-black ring-2 ring-cyan-400/50'
                        : 'bg-neutral-800/90 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700/60'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Custom Number Input */}
              <div className="flex items-center justify-between pt-1 text-xs text-neutral-400">
                <span>Or adjust starting target:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.tap();
                      setStartCheckout((prev) => Math.max(2, prev - 1));
                    }}
                    className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-black flex items-center justify-center border border-neutral-700"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-mono font-black text-white text-base">
                    {startCheckout}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.tap();
                      setStartCheckout((prev) => Math.min(170, prev + 1));
                    }}
                    className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-black flex items-center justify-center border border-neutral-700"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Rules Summary */}
            <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-3.5 space-y-2 text-xs text-neutral-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <b>Checkout in 1, 2, or 3 Darts:</b> Target increases by <b>+10</b> (e.g. 21 → 31 → 41).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <b>Miss / Fail within 3 Darts:</b> Target drops by <b>-1</b> (down to start {startCheckout}).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <b>Final Score:</b> The highest checkout you finish before the 20 min timer ends is your record score!
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            id="start-checkout-challenge-btn"
            onClick={handleStartChallenge}
            className="w-full h-14 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-neutral-950 font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Checkout Challenge (20 min)</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ACTIVE GAMEPLAY SCREEN (matches screenshot aesthetics)
  // ----------------------------------------------------
  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-3 sm:space-y-4 select-none animate-fadeIn">
      {/* Top HUD: High Score, Rate, Streak */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-2 sm:p-3 text-center shadow-xs">
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            High Out
          </span>
          <span className="text-base sm:text-2xl font-mono font-black text-amber-400 mt-0.5 block">
            {highestCheckout > 0 ? highestCheckout : '—'}
          </span>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-2 sm:p-3 text-center shadow-xs">
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Checkouts
          </span>
          <span className="text-base sm:text-2xl font-mono font-black text-cyan-400 mt-0.5 block">
            {checkoutsMade} <span className="text-[10px] sm:text-xs text-neutral-400 font-sans">/ {attempts}</span>
          </span>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-2 sm:p-3 text-center shadow-xs">
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Success Rate
          </span>
          <span className="text-base sm:text-2xl font-mono font-black text-emerald-400 mt-0.5 block">
            {checkoutRate}%
          </span>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-2 sm:p-3 text-center shadow-xs">
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Streak
          </span>
          <span className="text-base sm:text-2xl font-mono font-black text-amber-400 mt-0.5 flex items-center justify-center gap-0.5">
            {currentStreak > 0 && <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />}
            {currentStreak}
          </span>
        </div>
      </div>

      {/* Main Checkout Stage Card (Inspired directly by user screenshot) */}
      <div className="bg-gradient-to-b from-[#182029] to-[#0f141b] border border-[#263342] rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle checkered overlay aesthetic */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Top Header inside Game Stage */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide uppercase">
              Checkout Challenge
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-[10px] font-mono font-bold text-cyan-300">
              Start: {startCheckout}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCheckoutAi && (
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  onOpenCheckoutAi(currentTarget);
                }}
                className="px-2.5 py-1 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1 border border-neutral-700 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Advice</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Stage: Target & Suggestion of Out */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-3 sm:py-6 items-center text-left">
          {/* Target Score */}
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-neutral-400 block">
              NEXT OUT IS
            </span>
            <div className="text-6xl sm:text-7xl md:text-8xl font-black font-mono text-white tracking-tight leading-none drop-shadow-md">
              {currentTarget}
            </div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400/90 block pt-1">
              FINISH WITH MAX 3 DARTS
            </span>
          </div>

          {/* Suggestion of Out */}
          <div className="space-y-1 sm:border-l sm:border-neutral-800 sm:pl-6">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-neutral-400 block">
              SUGGESTION OF OUT
            </span>
            <div className="text-3xl sm:text-5xl md:text-6xl font-black font-mono text-cyan-300 tracking-wide leading-none min-h-[48px] sm:min-h-[60px] flex items-center drop-shadow-md">
              {primaryRouteDisplay}
            </div>
            {detailed?.aiAdvice && (
              <span className="text-[11px] text-neutral-400 block pt-1 line-clamp-1">
                {detailed.aiAdvice}
              </span>
            )}
          </div>
        </div>

        {/* Action Button Grid: 1 DART | 2 DARTS | 3 DARTS | MISSED OUT */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-4 border-t border-neutral-800/80">
          {/* 1 DART */}
          <button
            type="button"
            id="co-1-dart-btn"
            disabled={!canFinishIn1Dart}
            onClick={() => handleCheckoutHit(1)}
            className={`h-16 sm:h-20 rounded-2xl font-black text-sm sm:text-base md:text-lg uppercase tracking-wider flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer ${
              canFinishIn1Dart
                ? 'bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-neutral-950 border border-cyan-300 ring-2 ring-cyan-500/30'
                : 'bg-neutral-850/60 text-neutral-600 border border-neutral-800 cursor-not-allowed opacity-50'
            }`}
          >
            1 Dart
          </button>

          {/* 2 DARTS */}
          <button
            type="button"
            id="co-2-darts-btn"
            disabled={!canFinishIn2Darts}
            onClick={() => handleCheckoutHit(2)}
            className={`h-16 sm:h-20 rounded-2xl font-black text-sm sm:text-base md:text-lg uppercase tracking-wider flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer ${
              canFinishIn2Darts
                ? 'bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-neutral-950 border border-cyan-300 ring-2 ring-cyan-500/30'
                : 'bg-neutral-850/60 text-neutral-600 border border-neutral-800 cursor-not-allowed opacity-50'
            }`}
          >
            2 Darts
          </button>

          {/* 3 DARTS */}
          <button
            type="button"
            id="co-3-darts-btn"
            disabled={!canFinishIn3Darts}
            onClick={() => handleCheckoutHit(3)}
            className={`h-16 sm:h-20 rounded-2xl font-black text-sm sm:text-base md:text-lg uppercase tracking-wider flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer ${
              canFinishIn3Darts
                ? 'bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-neutral-950 border border-cyan-300 ring-2 ring-cyan-500/30'
                : 'bg-neutral-850/60 text-neutral-600 border border-neutral-800 cursor-not-allowed opacity-50'
            }`}
          >
            3 Darts
          </button>

          {/* MISSED OUT */}
          <button
            type="button"
            id="co-missed-out-btn"
            onClick={handleCheckoutMiss}
            className="h-16 sm:h-20 rounded-2xl bg-[#c2410c] hover:bg-[#ea580c] active:bg-[#9a3412] text-white border border-orange-500 font-black text-sm sm:text-base md:text-lg uppercase tracking-wider flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Missed Out
          </button>
        </div>
      </div>

      {/* Bottom Footer Controls: Undo, End Early, Recent Progression */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          id="co-undo-btn"
          disabled={undoStack.length === 0}
          onClick={handleUndo}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            undoStack.length > 0
              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 active:scale-95 cursor-pointer'
              : 'bg-neutral-900 text-neutral-600 border border-neutral-800/60 cursor-not-allowed opacity-50'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Undo Attempt</span>
        </button>

        {/* History Flow Badges */}
        {history.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-md scrollbar-none py-1">
            {history.slice(0, 6).map((item, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 ${
                  item.result === 'hit'
                    ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                }`}
              >
                <span>{item.target}</span>
                <span>{item.result === 'hit' ? `✓ (${item.dartsUsed}d)` : '✗'}</span>
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          id="co-finish-early-btn"
          onClick={handleCompleteSession}
          className="px-3 py-2 rounded-xl bg-neutral-800/80 hover:bg-emerald-600 active:scale-95 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold transition-all cursor-pointer"
        >
          Finish & Scorecard
        </button>
      </div>

      {/* Rules Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 max-w-md w-full space-y-4 animate-fadeIn text-xs sm:text-sm">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Checkout Challenge Rules
              </h3>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-neutral-300">
              <p>
                <b>Goal:</b> Climb the checkout ladder by taking out consecutive checkout scores (standard 501 double-out finishing) in <b>max 3 darts</b>.
              </p>
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 space-y-1">
                <b className="text-cyan-300 block">Advancement (+10):</b>
                <span className="text-neutral-300 text-xs">
                  Whenever you successfully checkout in 1, 2, or 3 darts, your next checkout target increases by <b>+10</b> (e.g. 21 → 31 → 41 → 51).
                </span>
              </div>
              <div className="p-3 rounded-xl bg-orange-950/40 border border-orange-800/50 space-y-1">
                <b className="text-orange-300 block">Failure (-1):</b>
                <span className="text-neutral-300 text-xs">
                  If you fail or miss within 3 darts, your next checkout reduces by <b>-1</b> (e.g. 31 → 30), never dropping below your starting checkout ({startCheckout}).
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 space-y-1">
                <b className="text-amber-300 block">Scoring:</b>
                <span className="text-neutral-300 text-xs">
                  Your final score for the session is the <b>highest checkout</b> you successfully took out!
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
