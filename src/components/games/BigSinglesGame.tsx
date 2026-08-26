import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Check,
  X,
  Undo2,
  Trophy,
  Flag,
  RotateCcw,
  Sparkles,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings2,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BigSinglesLevel, BigSinglesResult, BigSinglesRoundRecord } from '../../types';
import { sound } from '../../utils/sound';

interface BigSinglesGameProps {
  initialLevel?: BigSinglesLevel;
  isFinalInput?: boolean;
  onFinish: (result: BigSinglesResult) => void;
}

interface VisitHistoryItem {
  round: number;
  numberBefore: number;
  numberAfter: number;
  dart1: boolean;
  dart2: boolean;
  dart3: boolean;
  hitCount: number;
  highestReachedBefore: number;
  prevRoundDetails: BigSinglesRoundRecord[];
}

export const BigSinglesGame: React.FC<BigSinglesGameProps> = ({
  initialLevel = 'intermediate',
  isFinalInput = false,
  onFinish,
}) => {
  // Game mode level: 'intermediate' or 'advanced'
  const [level, setLevel] = useState<BigSinglesLevel>(initialLevel);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState<boolean>(false);
  const levelDropdownRef = useRef<HTMLDivElement>(null);

  // Sync initialLevel when prop changes
  useEffect(() => {
    if (initialLevel) {
      setLevel(initialLevel);
    }
  }, [initialLevel]);

  // Outside click listener for level dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(e.target as Node)) {
        setIsLevelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Game progression state
  const [currentNumber, setCurrentNumber] = useState<number>(1); // 1 to 20
  const [completedRounds, setCompletedRounds] = useState<number>(0);
  const [highestNumberReached, setHighestNumberReached] = useState<number>(1);

  // Current 3-dart input selection (true = hit, false = miss)
  const [dart1, setDart1] = useState<boolean>(false);
  const [dart2, setDart2] = useState<boolean>(false);
  const [dart3, setDart3] = useState<boolean>(false);

  // Counters
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [totalDartHits, setTotalDartHits] = useState<number>(0);
  const [roundDetails, setRoundDetails] = useState<BigSinglesRoundRecord[]>([]);

  // Undo history
  const [history, setHistory] = useState<VisitHistoryItem[]>([]);

  // Timer expired modal
  const [showTimeUpModal, setShowTimeUpModal] = useState<boolean>(false);
  const [hasAcknowledgedTimeUp, setHasAcknowledgedTimeUp] = useState<boolean>(false);

  // Catch timer expiration from TimerHeader
  useEffect(() => {
    if (isFinalInput && !hasAcknowledgedTimeUp && !showTimeUpModal) {
      setShowTimeUpModal(true);
    }
  }, [isFinalInput, hasAcknowledgedTimeUp, showTimeUpModal]);

  const totalDarts = totalVisits * 3;
  const currentHitsInVisit = (dart1 ? 1 : 0) + (dart2 ? 1 : 0) + (dart3 ? 1 : 0);
  const dartHitAccuracy = totalDarts > 0 ? Math.round((totalDartHits / totalDarts) * 100) : 0;

  // Determine movement delta given current level and hits
  const getMovement = useCallback(
    (hits: number, lvl: BigSinglesLevel): { delta: number; label: string; type: 'forward' | 'stay' | 'back' } => {
      if (lvl === 'advanced') {
        if (hits === 3) return { delta: 1, label: '+1 Move to next number', type: 'forward' };
        if (hits === 2) return { delta: 0, label: 'Stay on current number', type: 'stay' };
        if (hits === 1) return { delta: -1, label: '-1 Go back 1 number', type: 'back' };
        return { delta: -2, label: '-2 Go back 2 numbers', type: 'back' };
      } else {
        // Intermediate
        if (hits >= 2) return { delta: 1, label: '+1 Move to next number', type: 'forward' };
        if (hits === 1) return { delta: 0, label: 'Stay on current number', type: 'stay' };
        return { delta: -1, label: '-1 Go back 1 number', type: 'back' };
      }
    },
    []
  );

  const previewMovement = getMovement(currentHitsInVisit, level);

  // Finalize drill
  const finalizeGame = useCallback(() => {
    const res: BigSinglesResult = {
      level,
      completedRounds,
      currentNumberReached: currentNumber,
      highestNumberReached: Math.max(highestNumberReached, currentNumber),
      totalVisits,
      totalDarts: totalVisits * 3,
      totalDartHits,
      dartHitAccuracy: totalVisits > 0 ? Math.round((totalDartHits / (totalVisits * 3)) * 100) : 0,
      roundDetails,
    };
    onFinish(res);
  }, [
    level,
    completedRounds,
    currentNumber,
    highestNumberReached,
    totalVisits,
    totalDartHits,
    roundDetails,
    onFinish,
  ]);

  // Handle register hits
  const handleRegisterHits = useCallback(() => {
    const hitsThisVisit = (dart1 ? 1 : 0) + (dart2 ? 1 : 0) + (dart3 ? 1 : 0);
    const { delta, type } = getMovement(hitsThisVisit, level);

    let nextNumber = currentNumber + delta;
    let nextCompletedRounds = completedRounds;
    let newRoundDetails = [...roundDetails];

    // Check for completing a 1..20 sweep
    if (nextNumber > 20) {
      // Completed current round!
      nextCompletedRounds += 1;
      nextNumber = 1; // Restart loop for next round

      sound.checkout();
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });

      newRoundDetails.push({
        roundNumber: nextCompletedRounds,
        darts: (totalVisits + 1) * 3,
        hits: totalDartHits + hitsThisVisit,
        visits: totalVisits + 1,
        accuracy: Math.round(((totalDartHits + hitsThisVisit) / ((totalVisits + 1) * 3)) * 100),
      });
    } else {
      nextNumber = Math.max(1, nextNumber);
      if (type === 'forward') {
        sound.hit();
      } else if (type === 'stay') {
        sound.tap();
      } else {
        sound.miss();
      }
    }

    const newHighest = Math.max(highestNumberReached, nextNumber);

    // Save for undo
    setHistory((prev) => [
      ...prev,
      {
        round: completedRounds,
        numberBefore: currentNumber,
        numberAfter: nextNumber,
        dart1,
        dart2,
        dart3,
        hitCount: hitsThisVisit,
        highestReachedBefore: highestNumberReached,
        prevRoundDetails: roundDetails,
      },
    ]);

    setCurrentNumber(nextNumber);
    setCompletedRounds(nextCompletedRounds);
    setHighestNumberReached(newHighest);
    setTotalVisits((prev) => prev + 1);
    setTotalDartHits((prev) => prev + hitsThisVisit);
    setRoundDetails(newRoundDetails);

    // Reset dart inputs for next visit (default to all miss as per screenshot baseline)
    setDart1(false);
    setDart2(false);
    setDart3(false);
  }, [
    dart1,
    dart2,
    dart3,
    getMovement,
    level,
    currentNumber,
    completedRounds,
    roundDetails,
    highestNumberReached,
    totalVisits,
    totalDartHits,
  ]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const last = history[history.length - 1];
    setCurrentNumber(last.numberBefore);
    setCompletedRounds(last.round);
    setHighestNumberReached(last.highestReachedBefore);
    setDart1(last.dart1);
    setDart2(last.dart2);
    setDart3(last.dart3);
    setTotalVisits((prev) => Math.max(0, prev - 1));
    setTotalDartHits((prev) => Math.max(0, prev - last.hitCount));
    setRoundDetails(last.prevRoundDetails);
    setHistory((prev) => prev.slice(0, -1));
    sound.tap();
  }, [history]);

  // Quick preset buttons
  const handleSetAllHits = (hitsCount: number) => {
    if (hitsCount === 0) {
      setDart1(false);
      setDart2(false);
      setDart3(false);
    } else if (hitsCount === 1) {
      setDart1(true);
      setDart2(false);
      setDart3(false);
    } else if (hitsCount === 2) {
      setDart1(true);
      setDart2(true);
      setDart3(false);
    } else if (hitsCount === 3) {
      setDart1(true);
      setDart2(true);
      setDart3(true);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showTimeUpModal || e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === '1') {
        e.preventDefault();
        setDart1((prev) => !prev);
      } else if (key === '2') {
        e.preventDefault();
        setDart2((prev) => !prev);
      } else if (key === '3') {
        e.preventDefault();
        setDart3((prev) => !prev);
      } else if (key === 'h') {
        e.preventDefault();
        handleSetAllHits(3);
      } else if (key === 'm' || key === '0') {
        e.preventDefault();
        handleSetAllHits(0);
      } else if (key === 'enter' || key === ' ') {
        e.preventDefault();
        handleRegisterHits();
      } else if (key === 'u' || key === 'backspace') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTimeUpModal, handleRegisterHits, handleUndo]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 select-none pb-6">
      {/* Top Header Bar with Level and Darts Count */}
      <div className="flex items-center justify-between gap-3 bg-neutral-900/90 border border-neutral-800 rounded-2xl px-4 py-3 shadow-lg">
        <div className="space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
            BIG SINGLES
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-semibold">Level:</span>
            
            {/* Level Falling Dropdown Menu */}
            <div className="relative" ref={levelDropdownRef}>
              <button
                type="button"
                id="bigsingles-level-dropdown-btn"
                onClick={() => {
                  sound.tap();
                  setIsLevelDropdownOpen((prev) => !prev);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  level === 'advanced'
                    ? 'bg-amber-600/90 hover:bg-amber-600 text-white border-amber-500 shadow-xs'
                    : 'bg-cyan-600/90 hover:bg-cyan-600 text-white border-cyan-500 shadow-xs'
                }`}
              >
                <span>{level === 'advanced' ? 'Advanced' : 'Intermediate'}</span>
                {isLevelDropdownOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 opacity-80" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                )}
              </button>

              {/* Falling Dropdown Menu */}
              {isLevelDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#14181d] border border-[#2b3542] rounded-xl shadow-2xl p-1.5 z-50 animate-fadeIn space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-[#222933]">
                    Select Difficulty Level
                  </div>

                  <button
                    type="button"
                    id="select-level-intermediate"
                    onClick={() => {
                      setLevel('intermediate');
                      setIsLevelDropdownOpen(false);
                      sound.tap();
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-all cursor-pointer flex items-start justify-between ${
                      level === 'intermediate'
                        ? 'bg-cyan-950/80 border border-cyan-700/80 text-white'
                        : 'hover:bg-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Check className={`w-3.5 h-3.5 ${level === 'intermediate' ? 'opacity-100 text-cyan-400' : 'opacity-0'}`} />
                        <span>Intermediate Level</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight pl-5">
                        2 or 3 hits: advance (+1)<br />
                        1 hit: stay (0)<br />
                        0 hits: back 1 (-1)
                      </p>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      Standard
                    </span>
                  </button>

                  <button
                    type="button"
                    id="select-level-advanced"
                    onClick={() => {
                      setLevel('advanced');
                      setIsLevelDropdownOpen(false);
                      sound.tap();
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-all cursor-pointer flex items-start justify-between ${
                      level === 'advanced'
                        ? 'bg-amber-950/80 border border-amber-700/80 text-white'
                        : 'hover:bg-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Check className={`w-3.5 h-3.5 ${level === 'advanced' ? 'opacity-100 text-amber-400' : 'opacity-0'}`} />
                        <span>Advanced Level</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight pl-5">
                        3 hits: advance (+1)<br />
                        2 hits: stay (0)<br />
                        1 hit: back 1 (-1)<br />
                        0 hits: back 2 (-2)
                      </p>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                      Pro
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Darts & Round Stats */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
              DARTS: {totalDarts}
            </span>
            {completedRounds > 0 && (
              <span className="text-[11px] font-bold text-emerald-400 block font-mono">
                Round {completedRounds + 1} ({completedRounds} cleared)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo last visit (U / Backspace)"
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 disabled:opacity-30 disabled:pointer-events-none text-neutral-300 hover:text-white border border-neutral-700 transition-all cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Target Hero (Matching user's photo aesthetic) */}
      <div className="bg-[#0b1220] border border-[#1e2c47] rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
        {/* Subtle circular grid background effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.25)_0,transparent_75%)] pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block">
            Target Number {currentNumber} of 20
          </span>
          <h1 className="text-4xl sm:text-5xl font-black font-mono text-white tracking-wide drop-shadow-md">
            BIG SINGLE {currentNumber}
          </h1>
          <p className="text-xs text-neutral-400 pt-0.5">
            Throw all 3 darts at the large single field of <b>{currentNumber}</b>
          </p>
        </div>

        {/* Mini 1 to 20 Roadmap Strip */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap pt-4 max-w-xl mx-auto">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
            const isCurrent = num === currentNumber;
            const isPassed = num < currentNumber;

            return (
              <div
                key={num}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-mono font-black flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400 scale-110'
                    : isPassed
                    ? 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-400'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-500'
                }`}
              >
                {num}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Dart Cards: 1st dart, 2nd dart, 3rd dart (Matching screenshot layout) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* 1st Dart Card */}
        <div className="bg-[#0e1626] border border-[#1e2d4a] rounded-2xl p-3 sm:p-4 text-center space-y-2.5 shadow-lg">
          <span className="text-xs sm:text-sm font-bold text-white block">
            1st dart
          </span>

          <div className="space-y-1.5">
            {/* Hit Option */}
            <button
              type="button"
              id="dart1-hit-btn"
              onClick={() => setDart1(true)}
              className={`w-full py-3.5 sm:py-4 px-2 rounded-xl font-black text-sm sm:text-base transition-all cursor-pointer relative ${
                dart1
                  ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-[#111a2e] text-neutral-400 hover:text-white border border-[#223354] hover:bg-[#16223b]'
              }`}
            >
              <span>Hit</span>
              <span className="absolute bottom-1 right-2 text-[9px] font-mono opacity-60">1</span>
            </button>

            {/* Miss Option */}
            <button
              type="button"
              id="dart1-miss-btn"
              onClick={() => setDart1(false)}
              className={`w-full py-3.5 sm:py-4 px-2 rounded-xl font-black text-sm sm:text-base transition-all cursor-pointer relative ${
                !dart1
                  ? 'bg-[#8b1010] text-white border border-rose-500/60 shadow-md'
                  : 'bg-[#111a2e] text-neutral-400 hover:text-white border border-[#223354] hover:bg-[#16223b]'
              }`}
            >
              <span>Miss</span>
              <span className="absolute bottom-1 right-2 text-[9px] font-mono opacity-60">1</span>
            </button>
          </div>
        </div>

        {/* 2nd Dart Card */}
        <div className="bg-[#0e1626] border border-[#1e2d4a] rounded-2xl p-3 sm:p-4 text-center space-y-2.5 shadow-lg">
          <span className="text-xs sm:text-sm font-bold text-white block">
            2nd dart
          </span>

          <div className="space-y-1.5">
            {/* Hit Option */}
            <button
              type="button"
              id="dart2-hit-btn"
              onClick={() => setDart2(true)}
              className={`w-full py-3.5 sm:py-4 px-2 rounded-xl font-black text-sm sm:text-base transition-all cursor-pointer relative ${
                dart2
                  ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-[#111a2e] text-neutral-400 hover:text-white border border-[#223354] hover:bg-[#16223b]'
              }`}
            >
              <span>Hit</span>
              <span className="absolute bottom-1 right-2 text-[9px] font-mono opacity-60">2</span>
            </button>

            {/* Miss Option */}
            <button
              type="button"
              id="dart2-miss-btn"
              onClick={() => setDart2(false)}
              className={`w-full py-3.5 sm:py-4 px-2 rounded-xl font-black text-sm sm:text-base transition-all cursor-pointer relative ${
                !dart2
                  ? 'bg-[#8b1010] text-white border border-rose-500/60 shadow-md'
                  : 'bg-[#111a2e] text-neutral-400 hover:text-white border border-[#223354] hover:bg-[#16223b]'
              }`}
            >
              <span>Miss</span>
              <span className="absolute bottom-1 right-2 text-[9px] font-mono opacity-60">2</span>
            </button>
          </div>
        </div>

        {/* 3rd Dart Card */}
        <div className="bg-[#0e1626] border border-[#1e2d4a] rounded-2xl p-3 sm:p-4 text-center space-y-2.5 shadow-lg">
          <span className="text-xs sm:text-sm font-bold text-white block">
            3rd dart
          </span>

          <div className="space-y-1.5">
            {/* Hit Option */}
            <button
              type="button"
              id="dart3-hit-btn"
              onClick={() => setDart3(true)}
              className={`w-full py-3.5 sm:py-4 px-2 rounded-xl font-black text-sm sm:text-base transition-all cursor-pointer relative ${
                dart3
                  ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-[#111a2e] text-neutral-400 hover:text-white border border-[#223354] hover:bg-[#16223b]'
              }`}
            >
              <span>Hit</span>
              <span className="absolute bottom-1 right-2 text-[9px] font-mono opacity-60">3</span>
            </button>

            {/* Miss Option */}
            <button
              type="button"
              id="dart3-miss-btn"
              onClick={() => setDart3(false)}
              className={`w-full py-3.5 sm:py-4 px-2 rounded-xl font-black text-sm sm:text-base transition-all cursor-pointer relative ${
                !dart3
                  ? 'bg-[#8b1010] text-white border border-rose-500/60 shadow-md'
                  : 'bg-[#111a2e] text-neutral-400 hover:text-white border border-[#223354] hover:bg-[#16223b]'
              }`}
            >
              <span>Miss</span>
              <span className="absolute bottom-1 right-2 text-[9px] font-mono opacity-60">3</span>
            </button>
          </div>
        </div>
      </div>

      {/* Movement Outcome Badge */}
      <div className="flex items-center justify-center gap-2 py-1 text-xs">
        <span className="text-neutral-400">Outcome for {currentHitsInVisit} {currentHitsInVisit === 1 ? 'hit' : 'hits'}:</span>
        <span
          className={`font-black font-mono px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1 ${
            previewMovement.type === 'forward'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
              : previewMovement.type === 'stay'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
              : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
          }`}
        >
          {previewMovement.type === 'forward' && <TrendingUp className="w-3.5 h-3.5" />}
          {previewMovement.type === 'stay' && <Minus className="w-3.5 h-3.5" />}
          {previewMovement.type === 'back' && <TrendingDown className="w-3.5 h-3.5" />}
          <span>{previewMovement.label}</span>
        </span>
      </div>

      {/* Primary Action Button: "Register hits" */}
      <div className="pt-2">
        <button
          type="button"
          id="bigsingles-register-hits-btn"
          onClick={handleRegisterHits}
          className="w-full py-4 px-6 rounded-2xl bg-[#132238] hover:bg-[#1a2f4d] active:scale-95 text-white font-black text-base sm:text-lg border border-[#263e63] hover:border-cyan-400 shadow-xl shadow-cyan-950/30 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Register hits</span>
          <ChevronRight className="w-5 h-5 text-cyan-400" />
        </button>
      </div>

      {/* 10-Minute Timer Expired Popup Modal */}
      {showTimeUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-750 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">10-Minute Time is Up!</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Great session! You completed <b className="text-emerald-400 font-mono">{completedRounds}</b> full rounds and reached <b className="text-cyan-400 font-mono">Single {currentNumber}</b> with <b className="text-white font-mono">{totalDarts}</b> darts thrown.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={finalizeGame}
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-black text-sm transition-all shadow-md cursor-pointer"
              >
                Finish & View Scorecard
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTimeUpModal(false);
                  setHasAcknowledgedTimeUp(true);
                }}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 font-bold text-xs border border-neutral-700 transition-all cursor-pointer"
              >
                Continue in Overtime
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
