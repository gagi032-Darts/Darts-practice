import React, { useEffect } from 'react';
import { Trophy, CheckCircle2, RotateCcw, Home, BarChart2, Share2, Bot, User, Award, TrendingUp, BarChart3, Flame, Zap, Lock, Crosshair, ShieldAlert, Hourglass } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameType, GameResultData, DartBotMatchResult, HighscoreResult, TripleLockResult, Solo301Result } from '../../types';
import { GAME_DEFINITIONS } from '../../utils/gamesData';
import { sound } from '../../utils/sound';
import { LegBreakdownView } from '../common/LegBreakdownView';

interface SummaryModalProps {
  gameType: GameType;
  result: GameResultData;
  durationFormatted: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
  onOpenHistory: () => void;
}

const SCORE_BUCKETS = [
  { label: '180 (MAX)', color: 'text-rose-400', barColor: 'bg-rose-500' },
  { label: '140–179', color: 'text-amber-400', barColor: 'bg-amber-500' },
  { label: '100–139', color: 'text-emerald-400', barColor: 'bg-emerald-500' },
  { label: '80–99', color: 'text-cyan-400', barColor: 'bg-cyan-500' },
  { label: '60–79', color: 'text-teal-400', barColor: 'bg-teal-500' },
  { label: '50–59', color: 'text-blue-400', barColor: 'bg-blue-500' },
  { label: '40–49', color: 'text-neutral-300', barColor: 'bg-neutral-500' },
  { label: 'Under 40', color: 'text-neutral-400', barColor: 'bg-neutral-600' },
];

export const SummaryModal: React.FC<SummaryModalProps> = ({
  gameType,
  result,
  durationFormatted,
  onPlayAgain,
  onGoHome,
  onOpenHistory,
}) => {
  const gameDef = GAME_DEFINITIONS[gameType];

  useEffect(() => {
    sound.lock();
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  }, []);

  // Dedicated scorecard rendering for Triple Lock 20-min countdown drill
  if (gameType === 'triple') {
    const tripleRes = result as TripleLockResult;
    const isCompleted = tripleRes.completed;
    const completionPct = ((tripleRes.stagesCompleted / 21) * 100).toFixed(1);

    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Status Header Icon */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner ${
              isCompleted
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
            }`}
          >
            {isCompleted ? <Trophy className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>

          <span
            className={`text-xs font-bold uppercase tracking-widest block mb-1 ${
              isCompleted ? 'text-emerald-400' : 'text-cyan-400'
            }`}
          >
            {isCompleted ? '🎉 Challenge Completed!' : '⏱️ 20-Min Session Logged'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Triple Lock Recap
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Duration: <b className="text-neutral-200 font-mono">{durationFormatted}</b> · Darts Thrown:{' '}
            <b className="text-neutral-200 font-mono">{tripleRes.dartsThrown}</b> ({tripleRes.totalVisits} visits)
          </p>

          {/* Primary KPI Metrics */}
          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Status
              </span>
              <span
                className={`text-base sm:text-lg font-bold mt-1 block tracking-tight ${
                  isCompleted ? 'text-emerald-400' : 'text-cyan-400'
                }`}
              >
                {isCompleted ? 'Finished' : '20m Cutoff'}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Locked Through
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 mt-1 block tracking-tight">
                {tripleRes.lockedThrough ?? 'None'}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Resets
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-rose-400 mt-1 block tracking-tight">
                {tripleRes.resets}
              </span>
            </div>
          </div>

          {/* Progress Ladder Completion Bar */}
          <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" /> Progression Track (20 → 1 → Bull)
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {tripleRes.stagesCompleted} / 21 stages ({completionPct}%)
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>

            <p className="text-[11px] text-neutral-400 pt-1">
              Furthest Reached: <b className="text-white">{tripleRes.targetReached}</b>
            </p>
          </div>

          {/* Bullseye Stats if reached */}
          {(tripleRes.bullDarts > 0 || tripleRes.bullHits > 0) && (
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-3 text-xs flex items-center justify-between px-4 text-neutral-300">
              <span className="flex items-center gap-1.5 font-bold text-rose-400">
                <Crosshair className="w-4 h-4" /> Bullseye Round:
              </span>
              <span className="font-mono">
                <b>{tripleRes.bullHits}</b> hits in <b>{tripleRes.bullDarts}</b> darts ({tripleRes.bullScore} pts)
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-800">
            <button
              type="button"
              id="summary-play-again"
              onClick={onPlayAgain}
              className="h-13 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Practice Again</span>
            </button>

            <button
              type="button"
              id="summary-go-home"
              onClick={onGoHome}
              className="h-13 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white font-bold text-base border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
          </div>

          <button
            type="button"
            id="summary-view-history"
            onClick={onOpenHistory}
            className="mt-3 text-xs text-neutral-400 hover:text-emerald-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View All Saved History & Records →</span>
          </button>
        </div>
      </div>
    );
  }

  // Dedicated scorecard rendering for DartBot Match Play & Solo X01
  if (gameType === 'dartbot') {
    const matchRes = result as DartBotMatchResult;
    const isSolo = matchRes.botLevelLabel === 'Solo Practice' || matchRes.botLegs === undefined || matchRes.botStats.totalDarts === 0;
    const isPlayerWin = matchRes.winner === 'player';

    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Winner / Completion Icon */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner ${
              isSolo
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : isPlayerWin
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            }`}
          >
            {isSolo ? <Award className="w-8 h-8" /> : isPlayerWin ? <Trophy className="w-8 h-8" /> : <Bot className="w-8 h-8" />}
          </div>

          <span
            className={`text-xs font-bold uppercase tracking-widest block mb-1 ${
              isSolo ? 'text-emerald-400' : isPlayerWin ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isSolo
              ? '🎯 X01 Solo Practice Completed'
              : isPlayerWin
              ? '🎉 Match Victory!'
              : `👑 ${matchRes.botLevelLabel} Won the Match`}
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {isSolo
              ? `${matchRes.startingScore} Solo (${matchRes.playerLegs} Leg${matchRes.playerLegs > 1 ? 's' : ''})`
              : `You ${matchRes.playerLegs} – ${matchRes.botLegs} ${matchRes.botLevelLabel}`}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Format: <b className="text-neutral-200">{matchRes.startingScore} {isSolo ? 'Solo Practice' : `(First to ${matchRes.legsToWin})`}</b> · Duration: <b className="text-neutral-200 font-mono">{durationFormatted}</b>
          </p>

          {/* Stats Breakdown (Solo vs Head-to-Head) */}
          {isSolo ? (
            <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 my-4 space-y-3 shadow-inner">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700">
                  <span className="text-[10px] text-neutral-400 uppercase block font-sans">3-Dart Avg</span>
                  <b className="text-white text-base">{matchRes.playerStats.threeDartAvg}</b>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700">
                  <span className="text-[10px] text-neutral-400 uppercase block font-sans">First 9 Avg</span>
                  <b className="text-white text-base">{matchRes.playerStats.firstNineAvg}</b>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700">
                  <span className="text-[10px] text-neutral-400 uppercase block font-sans">Double Checkout</span>
                  <b className="text-cyan-400 text-base">{matchRes.playerStats.doublePercentage}%</b>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700">
                  <span className="text-[10px] text-neutral-400 uppercase block font-sans">Best Leg</span>
                  <b className="text-emerald-400 text-base">
                    {matchRes.playerStats.bestLegDarts ? `${matchRes.playerStats.bestLegDarts} Darts` : '-'}
                  </b>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                <div className="bg-neutral-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-neutral-400 block font-sans">High Finish</span>
                  <b className="text-amber-400">{matchRes.playerStats.highestCheckout || '-'}</b>
                </div>
                <div className="bg-neutral-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-neutral-400 block font-sans">100+ / 140+ / 180</span>
                  <b className="text-neutral-200">
                    {matchRes.playerStats.tonPlus} / {matchRes.playerStats.tonFortyPlus} / {matchRes.playerStats.oneEighty}
                  </b>
                </div>
                <div className="bg-neutral-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-neutral-400 block font-sans">Darts Thrown</span>
                  <b className="text-white">{matchRes.playerStats.totalDarts}</b>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-3 sm:p-4 my-4 overflow-hidden shadow-inner">
              <div className="grid grid-cols-3 text-xs font-bold text-neutral-400 border-b border-neutral-700/80 pb-2 mb-2">
                <div className="text-left text-emerald-400 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>YOU</span>
                </div>
                <div className="text-center text-neutral-400 uppercase tracking-wider text-[10px]">
                  STATISTIC
                </div>
                <div className="text-right text-rose-400 flex items-center justify-end gap-1">
                  <span>{matchRes.botLevelLabel}</span>
                  <Bot className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {/* Legs */}
                <div className="grid grid-cols-3 items-center py-1 border-b border-neutral-800">
                  <span className={`text-left font-black ${isPlayerWin ? 'text-emerald-400 text-sm' : 'text-white'}`}>
                    {matchRes.playerLegs}
                  </span>
                  <span className="text-center text-neutral-400 text-[11px] font-sans">Legs Won</span>
                  <span className={`text-right font-black ${!isPlayerWin ? 'text-rose-400 text-sm' : 'text-white'}`}>
                    {matchRes.botLegs}
                  </span>
                </div>

                {/* 3-Dart Average */}
                <div className="grid grid-cols-3 items-center py-1 border-b border-neutral-800">
                  <span className="text-left font-bold text-white text-sm">
                    {matchRes.playerStats.threeDartAvg}
                  </span>
                  <span className="text-center text-neutral-400 text-[11px] font-sans">3-Dart Avg</span>
                  <span className="text-right font-bold text-white text-sm">
                    {matchRes.botStats.threeDartAvg}
                  </span>
                </div>

                {/* First 9 Average */}
                <div className="grid grid-cols-3 items-center py-1 border-b border-neutral-800">
                  <span className="text-left text-neutral-200">
                    {matchRes.playerStats.firstNineAvg}
                  </span>
                  <span className="text-center text-neutral-400 text-[11px] font-sans">First 9 Avg</span>
                  <span className="text-right text-neutral-200">
                    {matchRes.botStats.firstNineAvg}
                  </span>
                </div>

                {/* Double Checkout % */}
                <div className="grid grid-cols-3 items-center py-1 border-b border-neutral-800">
                  <span className="text-left text-cyan-400 font-bold">
                    {matchRes.playerStats.doublePercentage}%{' '}
                    <span className="text-[10px] text-neutral-500">
                      ({matchRes.playerStats.doublesHit}/{matchRes.playerStats.dartsAtDouble})
                    </span>
                  </span>
                  <span className="text-center text-neutral-400 text-[11px] font-sans">Checkout %</span>
                  <span className="text-right text-cyan-400 font-bold">
                    {matchRes.botStats.doublePercentage}%{' '}
                    <span className="text-[10px] text-neutral-500">
                      ({matchRes.botStats.doublesHit}/{matchRes.botStats.dartsAtDouble})
                    </span>
                  </span>
                </div>

                {/* High Checkout */}
                <div className="grid grid-cols-3 items-center py-1 border-b border-neutral-800">
                  <span className="text-left text-amber-400 font-bold">
                    {matchRes.playerStats.highestCheckout || '-'}
                  </span>
                  <span className="text-center text-neutral-400 text-[11px] font-sans">High Out</span>
                  <span className="text-right text-amber-400 font-bold">
                    {matchRes.botStats.highestCheckout || '-'}
                  </span>
                </div>

                {/* 100+ / 140+ / 180s */}
                <div className="grid grid-cols-3 items-center py-1 border-b border-neutral-800">
                  <span className="text-left text-neutral-300">
                    {matchRes.playerStats.tonPlus} / {matchRes.playerStats.tonFortyPlus} / {matchRes.playerStats.oneEighty}
                  </span>
                  <span className="text-center text-neutral-400 text-[10px] font-sans">100+ / 140+ / 180</span>
                  <span className="text-right text-neutral-300">
                    {matchRes.botStats.tonPlus} / {matchRes.botStats.tonFortyPlus} / {matchRes.botStats.oneEighty}
                  </span>
                </div>

                {/* Best Leg */}
                <div className="grid grid-cols-3 items-center py-1">
                  <span className="text-left text-emerald-400 font-bold">
                    {matchRes.playerStats.bestLegDarts ? `${matchRes.playerStats.bestLegDarts} darts` : '-'}
                  </span>
                  <span className="text-center text-neutral-400 text-[11px] font-sans">Best Leg</span>
                  <span className="text-right text-rose-400 font-bold">
                    {matchRes.botStats.bestLegDarts ? `${matchRes.botStats.bestLegDarts} darts` : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Leg-by-Leg Breakdown */}
          {matchRes.legs && matchRes.legs.length > 0 && (
            <div className="my-4 pt-2 border-t border-neutral-800">
              <LegBreakdownView
                legs={matchRes.legs}
                botLevelLabel={matchRes.botLevelLabel}
                isSolo={isSolo}
                defaultExpanded={true}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-800">
            <button
              type="button"
              id="summary-play-again"
              onClick={onPlayAgain}
              className="h-13 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Rematch vs DartBot</span>
            </button>

            <button
              type="button"
              id="summary-go-home"
              onClick={onGoHome}
              className="h-13 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white font-bold text-base border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
          </div>

          <button
            type="button"
            id="summary-view-history"
            onClick={onOpenHistory}
            className="mt-3 text-xs text-neutral-400 hover:text-emerald-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View All Saved History & Records →</span>
          </button>
        </div>
      </div>
    );
  }

  // Dedicated scorecard rendering for High Score drills
  if (gameType === 'score' || gameType === 'score1' || gameType === 'score2') {
    const scoreRes = result as HighscoreResult;
    const visitsCount = scoreRes.visits ? scoreRes.visits.length : (scoreRes.darts ? Math.round(scoreRes.darts / 3) : 0);
    const totalPoints = scoreRes.totalPoints ?? (scoreRes.visits ? scoreRes.visits.reduce((a, b) => a + b, 0) : 0);
    const distribution = scoreRes.distribution || {};
    const tonsCount = scoreRes.tons ?? (scoreRes.visits ? scoreRes.visits.filter((x) => x >= 100 && x < 140).length : 0);
    const tonFortiesCount = scoreRes.tonForties ?? (scoreRes.visits ? scoreRes.visits.filter((x) => x >= 140 && x < 180).length : 0);
    const oneEightiesCount = scoreRes.oneEighties ?? (scoreRes.visits ? scoreRes.visits.filter((x) => x === 180).length : 0);

    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <TrendingUp className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
            Drill Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {gameDef.title} Recap
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Duration: <b className="text-neutral-200 font-mono">{durationFormatted}</b> · Total Visits: <b className="text-neutral-200 font-mono">{visitsCount}</b> ({scoreRes.darts} darts)
          </p>

          {/* Primary Highscore KPI Metrics */}
          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                3-Dart Avg
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 mt-1 block tracking-tight">
                {scoreRes.avg}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Total Points
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-cyan-400 mt-1 block tracking-tight">
                {totalPoints.toLocaleString()}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Best Visit
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 mt-1 block tracking-tight">
                {scoreRes.bestVisit}
              </span>
            </div>
          </div>

          {/* Secondary Stats Row: 100+ / 140+ / 180 and First 9 */}
          <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs font-mono">
            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-2.5 flex items-center justify-between px-3">
              <span className="text-neutral-400 font-sans text-[11px] font-bold">100+ / 140+ / 180</span>
              <span className="text-white font-bold">
                {tonsCount} / {tonFortiesCount} / <b className="text-rose-400">{oneEightiesCount}</b>
              </span>
            </div>

            <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-2.5 flex items-center justify-between px-3">
              <span className="text-neutral-400 font-sans text-[11px] font-bold">First 9 Avg</span>
              <span className="text-emerald-400 font-bold">
                {scoreRes.firstNineAvg ? scoreRes.firstNineAvg : scoreRes.avg}
              </span>
            </div>
          </div>

          {/* Advanced Scoring Distribution Breakdown */}
          {Object.keys(distribution).length > 0 && (
            <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2.5">
              <div className="flex items-center justify-between border-b border-neutral-700/60 pb-2">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Advanced Visit Distribution
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {visitsCount} total visits
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                {SCORE_BUCKETS.map((b, idx) => {
                  const count = distribution[b.label] || 0;
                  const pct = visitsCount > 0 ? ((count / visitsCount) * 100).toFixed(1) : '0.0';
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800"
                    >
                      <span className={`font-bold w-24 truncate ${b.color}`}>{b.label}</span>
                      <div className="flex-1 mx-3 bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${b.barColor} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-neutral-400 w-20 text-right">
                        <b className="text-white">{count}</b> <span className="text-[10px]">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-800">
            <button
              type="button"
              id="summary-play-again"
              onClick={onPlayAgain}
              className="h-13 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Practice Again</span>
            </button>

            <button
              type="button"
              id="summary-go-home"
              onClick={onGoHome}
              className="h-13 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white font-bold text-base border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
          </div>

          <button
            type="button"
            id="summary-view-history"
            onClick={onOpenHistory}
            className="mt-3 text-xs text-neutral-400 hover:text-emerald-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View All Saved History & Records →</span>
          </button>
        </div>
      </div>
    );
  }

  // Dedicated scorecard rendering for Solo 301 Practice
  if (gameType === '301') {
    const soloRes = result as Solo301Result;
    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest block mb-1">
            🎯 301 Solo Routine Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {soloRes.legsCompleted} Leg{soloRes.legsCompleted !== 1 ? 's' : ''} Won
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Duration: <b className="text-neutral-200 font-mono">{durationFormatted}</b> · Total Darts Thrown: <b className="text-neutral-200 font-mono">{soloRes.totalDarts}</b> ({soloRes.totalVisits} visits)
          </p>

          {/* Primary 301 KPI Metrics */}
          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                3-Dart Avg
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 mt-1 block tracking-tight">
                {soloRes.threeDartAvg}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Best Leg
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 mt-1 block tracking-tight">
                {soloRes.bestLegDarts ? `${soloRes.bestLegDarts} Darts` : '—'}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Double %
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-cyan-400 mt-1 block tracking-tight">
                {soloRes.doublePercentage !== undefined && soloRes.doublePercentage !== null ? `${soloRes.doublePercentage}%` : '—'}
              </span>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-3 text-xs flex items-center justify-between px-4 text-neutral-300 font-mono">
            <span className="text-neutral-400 font-sans text-[11px] font-bold">Doubles Conversion:</span>
            <span className="text-white font-bold">
              {soloRes.doublesHit || 0} hit / {soloRes.dartsAtDouble || 0} darts at double
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-800">
            <button
              type="button"
              id="summary-play-again"
              onClick={onPlayAgain}
              className="h-13 rounded-xl bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-neutral-950 font-black text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Practice Again</span>
            </button>

            <button
              type="button"
              id="summary-go-home"
              onClick={onGoHome}
              className="h-13 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white font-bold text-base border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
          </div>

          <button
            type="button"
            id="summary-view-history"
            onClick={onOpenHistory}
            className="mt-3 text-xs text-neutral-400 hover:text-yellow-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View All Saved History & Records →</span>
          </button>
        </div>
      </div>
    );
  }

  // Format standard result metrics for other drills
  const renderMetricCards = () => {
    const entries = Object.entries(result).filter(([k]) => k !== 'distribution');
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-4">
        {entries.map(([key, val]) => {
          let label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
          let displayVal = String(val);

          if (typeof val === 'number') {
            displayVal = val.toLocaleString();
          }

          if (key === 'accuracy' || key === 'bullRate' || key === 'checkoutRate' || key === 'doublePercentage') {
            displayVal = `${val}%`;
          }

          if (key === 'doublePercentage') {
            label = 'Double %';
          }

          return (
            <div
              key={key}
              className="bg-neutral-800/80 border border-neutral-700/60 rounded-xl p-3 text-center shadow-xs"
            >
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                {label}
              </span>
              <span className="text-xl font-mono font-black text-emerald-400 mt-1 block">
                {displayVal}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Trophy className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
          Drill Completed
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {gameDef.title}
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Session Duration: <b className="text-neutral-200 font-mono">{durationFormatted}</b>
        </p>

        {/* Metrics Grid */}
        {renderMetricCards()}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-800">
          <button
            type="button"
            id="summary-play-again"
            onClick={onPlayAgain}
            className="h-13 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Practice Again</span>
          </button>

          <button
            type="button"
            id="summary-go-home"
            onClick={onGoHome}
            className="h-13 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white font-bold text-base border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
        </div>

        <button
          type="button"
          id="summary-view-history"
          onClick={onOpenHistory}
          className="mt-3 text-xs text-neutral-400 hover:text-emerald-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>View All Saved History & Records →</span>
        </button>
      </div>
    </div>
  );
};

