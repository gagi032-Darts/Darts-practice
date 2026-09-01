import React, { useEffect } from 'react';
import { Trophy, CheckCircle2, RotateCcw, Home, BarChart2, Share2, Bot, User, Award, TrendingUp, BarChart3, Flame, Zap, Lock, Crosshair, ShieldAlert, Hourglass, Compass, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameType, GameResultData, DartBotMatchResult, HighscoreResult, TripleLockResult, Solo301Result, SwitchbladeResult, PowerSwitchResult, BigScoresResult, CheckoutChallengeResult, DoublesBoomerangResult, Bobs27Result, A1PracticeResult, BigSinglesResult, RTWSinglesResult } from '../../types';
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

  // Dedicated scorecard rendering for Switchblade
  if (gameType === 'switchblade') {
    const sbRes = result as SwitchbladeResult;
    const targetKeys = ['T20 - T20 - T20', 'T20 - T20 - T19', 'T20 - T20 - T18', 'T20 - T20 - T17', 'T20 - T20 - Bull'];

    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Crosshair className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-1">
            🗡️ Switchblade Drill Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {sbRes.totalPoints.toLocaleString()} Total Points
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Duration: <b className="text-neutral-200 font-mono">{durationFormatted}</b> · Throws: <b className="text-neutral-200 font-mono">{sbRes.visits}</b> ({sbRes.darts} darts) · Completed Cycles: <b className="text-emerald-400 font-mono">{sbRes.cyclesCompleted}</b>
          </p>

          {/* Primary KPI Metrics */}
          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Avg / Throw
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 mt-1 block tracking-tight">
                {sbRes.averageScorePerVisit}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                3-Dart Avg
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-cyan-400 mt-1 block tracking-tight">
                {sbRes.darts > 0 ? ((sbRes.totalPoints / sbRes.darts) * 3).toFixed(1) : '0.0'}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Full Rounds
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 mt-1 block tracking-tight">
                {sbRes.cyclesCompleted}
              </span>
            </div>
          </div>

          {/* Dart Hit Rates */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-4">
            <div className="bg-neutral-800/70 border border-neutral-700/60 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-neutral-400 font-sans block uppercase">Dart 1 (T20)</span>
              <b className="text-white text-sm">{sbRes.dart1HitRate}% hit</b>
              <span className="text-[10px] text-emerald-400 block font-sans">({sbRes.dart1TreblePct}% T)</span>
            </div>
            <div className="bg-neutral-800/70 border border-neutral-700/60 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-neutral-400 font-sans block uppercase">Dart 2 (T20)</span>
              <b className="text-white text-sm">{sbRes.dart2HitRate}% hit</b>
              <span className="text-[10px] text-emerald-400 block font-sans">({sbRes.dart2TreblePct}% T)</span>
            </div>
            <div className="bg-neutral-800/70 border border-neutral-700/60 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-neutral-400 font-sans block uppercase">Dart 3 (Switch)</span>
              <b className="text-white text-sm">{sbRes.dart3HitRate}% hit</b>
              <span className="text-[10px] text-amber-400 block font-sans">({sbRes.dart3TreblePct}% T/Bull)</span>
            </div>
          </div>

          {/* Target Set Performance Breakdown */}
          {sbRes.targetScores && (
            <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-700/60 pb-2">
                Target Sequences Breakdown
              </span>
              <div className="space-y-1.5 pt-1">
                {targetKeys.map((k) => {
                  const item = sbRes.targetScores[k] || { totalScore: 0, count: 0, avgScore: 0 };
                  return (
                    <div
                      key={k}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800"
                    >
                      <span className="font-bold text-rose-300 font-mono">{k}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-neutral-400 text-[11px]">{item.count} attempts</span>
                        <span className="text-white font-bold">{item.totalScore} pts</span>
                        <span className="text-emerald-400 font-black text-xs">({item.avgScore} avg)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Round-by-Round Breakdown */}
          {sbRes.cycleScores && sbRes.cycleScores.length > 0 && (
            <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-700/60 pb-2">
                Round-by-Round Score
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                {sbRes.cycleScores.map((score, idx) => (
                  <div key={idx} className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-neutral-400 block font-sans">Round #{idx + 1}</span>
                    <b className="text-amber-400 text-sm">{score} pts</b>
                  </div>
                ))}
              </div>
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
            className="mt-3 text-xs text-neutral-400 hover:text-rose-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View All Saved History & Records →</span>
          </button>
        </div>
      </div>
    );
  }

  // Dedicated scorecard rendering for Power Switch
  if (gameType === 'powerswitch') {
    const psRes = result as PowerSwitchResult;

    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Zap className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
            ⚡ Power Switch Routine Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {psRes.totalPoints.toLocaleString()} Total Points
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Duration: <b className="text-neutral-200 font-mono">{durationFormatted}</b> · Total Visits: <b className="text-neutral-200 font-mono">{psRes.visits}</b> ({psRes.darts} darts)
          </p>

          {/* Primary KPI Metrics */}
          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Avg / Visit
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 mt-1 block tracking-tight">
                {psRes.pointsPerVisitAvg}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Treble %
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 mt-1 block tracking-tight">
                {psRes.trebleRate}%
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Target Hit %
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-cyan-400 mt-1 block tracking-tight">
                {psRes.hitRate}%
              </span>
            </div>
          </div>

          {/* Hits Breakdown */}
          <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-700/60 pb-2">
              Multiplier Hit Distribution
            </span>
            <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs text-center">
              <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-emerald-400 uppercase block font-sans font-bold">Trebles (+3)</span>
                <b className="text-white text-base">{psRes.trebleHits}</b>
              </div>
              <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-cyan-400 uppercase block font-sans font-bold">Doubles (+2)</span>
                <b className="text-white text-base">{psRes.doubleHits}</b>
              </div>
              <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-neutral-300 uppercase block font-sans font-bold">Singles (+1)</span>
                <b className="text-white text-base">{psRes.singleHits}</b>
              </div>
              <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-rose-400 uppercase block font-sans font-bold">Misses (0)</span>
                <b className="text-white text-base">{psRes.misses}</b>
              </div>
            </div>
          </div>

          {/* Target Precision Breakdown: T20 vs T19 vs T18 */}
          {(() => {
            let targetStats = psRes.targetStats;
            if (!targetStats && psRes.history && psRes.history.length > 0) {
              const map: Record<string, any> = {
                T20: { target: 'T20', attempts: 0, trebles: 0, doubles: 0, singles: 0, misses: 0, points: 0, trebleRate: 0, hitRate: 0 },
                T19: { target: 'T19', attempts: 0, trebles: 0, doubles: 0, singles: 0, misses: 0, points: 0, trebleRate: 0, hitRate: 0 },
                T18: { target: 'T18', attempts: 0, trebles: 0, doubles: 0, singles: 0, misses: 0, points: 0, trebleRate: 0, hitRate: 0 },
              };
              psRes.history.forEach((rec) => {
                rec.darts.forEach((d) => {
                  if (!map[d.target]) map[d.target] = { target: d.target, attempts: 0, trebles: 0, doubles: 0, singles: 0, misses: 0, points: 0, trebleRate: 0, hitRate: 0 };
                  map[d.target].attempts++;
                  map[d.target].points += d.points;
                  if (d.multiplier === 'treble') map[d.target].trebles++;
                  else if (d.multiplier === 'double') map[d.target].doubles++;
                  else if (d.multiplier === 'single') map[d.target].singles++;
                  else map[d.target].misses++;
                });
              });
              Object.values(map).forEach((item) => {
                if (item.attempts > 0) {
                  item.trebleRate = parseFloat(((item.trebles / item.attempts) * 100).toFixed(1));
                  item.hitRate = parseFloat((((item.trebles + item.doubles + item.singles) / item.attempts) * 100).toFixed(1));
                }
              });
              targetStats = map;
            }

            if (!targetStats) return null;

            return (
              <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-neutral-700/60 pb-2">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-400" /> Target Precision Breakdown
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {psRes.darts} total darts
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {['T20', 'T19', 'T18'].map((tKey) => {
                    const stat = targetStats![tKey] || { attempts: 0, trebles: 0, doubles: 0, singles: 0, misses: 0, points: 0, trebleRate: 0, hitRate: 0 };
                    return (
                      <div key={tKey} className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-amber-300 font-mono">{tKey}</span>
                          <span className="text-xs font-bold text-neutral-400 font-mono">{stat.attempts} darts</span>
                        </div>
                        <div className="space-y-1 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-neutral-400 font-sans">Treble %:</span>
                            <b className="text-emerald-400">{stat.trebleRate}% ({stat.trebles})</b>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400 font-sans">Target Hit %:</span>
                            <b className="text-cyan-400">{stat.hitRate}%</b>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400 font-sans">Points:</span>
                            <b className="text-amber-400">{stat.points} pts</b>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-neutral-800 text-neutral-400">
                          <span className="text-emerald-400 font-bold">T:{stat.trebles}</span>
                          <span className="text-cyan-400 font-bold">D:{stat.doubles}</span>
                          <span className="text-neutral-300 font-bold">S:{stat.singles}</span>
                          <span className="text-rose-400 font-bold">M:{stat.misses}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Throw Sequence Breakdown Log */}
          {psRes.history && psRes.history.length > 0 && (
            <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-700/60 pb-2">
                Visit-by-Visit Throw Sequence ({psRes.history.length} Visits)
              </span>
              <div className="space-y-1.5 max-h-44 overflow-y-auto p-1 scrollbar-thin font-mono text-xs">
                {psRes.history.map((rec) => (
                  <div key={rec.visitNumber} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                    <span className="text-neutral-500 font-bold w-12">#{rec.visitNumber}</span>
                    <div className="flex items-center gap-2 flex-1 justify-center">
                      {rec.darts.map((d, dIdx) => {
                        let badge = 'bg-neutral-800 text-neutral-400 border-neutral-700';
                        if (d.multiplier === 'treble') badge = 'bg-emerald-950 text-emerald-300 border-emerald-700 font-bold';
                        else if (d.multiplier === 'double') badge = 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold';
                        else if (d.multiplier === 'single') badge = 'bg-neutral-850 text-neutral-200 border-neutral-700';
                        else badge = 'bg-rose-950/80 text-rose-400 border-rose-800';

                        return (
                          <span key={dIdx} className={`px-2 py-0.5 rounded border text-[11px] ${badge}`}>
                            {d.target}: <b className="capitalize">{d.multiplier}</b>
                          </span>
                        );
                      })}
                    </div>
                    <span className="w-14 text-right font-bold text-amber-300">+{rec.totalPoints} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-800">
            <button
              type="button"
              id="summary-play-again"
              onClick={onPlayAgain}
              className="h-13 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-black text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
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
            className="mt-3 text-xs text-neutral-400 hover:text-amber-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View All Saved History & Records →</span>
          </button>
        </div>
      </div>
    );
  }

  // Dedicated scorecard rendering for Big Scores
  if (gameType === 'bigscores') {
    const bsRes = result as BigScoresResult;
    const stageKeys = ['20', '19', '18', '17', 'Bull'];

    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-violet-400 uppercase tracking-widest block mb-1">
            🏆 Big Scores Routine Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {bsRes.totalPoints.toLocaleString()} Total Points
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Duration: <b className="text-neutral-200 font-mono">{durationFormatted}</b> · Visits: <b className="text-neutral-200 font-mono">{bsRes.visits}</b> ({bsRes.darts} darts) · Completed Rounds: <b className="text-violet-400 font-mono">{bsRes.cyclesCompleted}</b>
          </p>

          {/* Primary KPI Metrics */}
          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Avg / Visit
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 mt-1 block tracking-tight">
                {bsRes.averageScorePerVisit}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                3-Dart Avg
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-cyan-400 mt-1 block tracking-tight">
                {bsRes.threeDartAvg}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3.5 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Full Rounds
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 mt-1 block tracking-tight">
                {bsRes.cyclesCompleted}
              </span>
            </div>
          </div>

          {/* Target Breakdown */}
          {bsRes.segmentScores && (
            <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-700/60 pb-2">
                Segment Breakdown (20 → 19 → 18 → 17 → Bull)
              </span>
              <div className="space-y-1.5 pt-1">
                {stageKeys.map((k) => {
                  const item = bsRes.segmentScores[k] || { totalScore: 0, count: 0, avgScore: 0, hits: 0, trebles: 0, doubles: 0, singles: 0, misses: 0 };
                  return (
                    <div
                      key={k}
                      className="text-xs py-2 px-3 rounded-xl bg-neutral-900/80 border border-neutral-800 font-mono space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-violet-300">
                          {k === 'Bull' ? 'Bullseye' : `Segment ${k}`}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-400 text-[11px] font-sans">{item.count} visits</span>
                          <span className="text-white font-bold">{item.totalScore} pts</span>
                          <span className="text-emerald-400 font-black">({item.avgScore} avg)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 pt-0.5 border-t border-neutral-800/60">
                        <span className="text-emerald-400 font-bold">T: {item.trebles || 0}</span>
                        <span>·</span>
                        <span className="text-cyan-400 font-bold">D: {item.doubles || 0}</span>
                        <span>·</span>
                        <span className="text-neutral-300 font-bold">S: {item.singles || 0}</span>
                        <span>·</span>
                        <span className="text-rose-400 font-bold">M: {item.misses || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Round-by-Round Breakdown */}
          {bsRes.cycleScores && bsRes.cycleScores.length > 0 && (
            <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-700/60 pb-2">
                Round-by-Round Score
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                {bsRes.cycleScores.map((score, idx) => (
                  <div key={idx} className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] text-neutral-400 block font-sans">Round #{idx + 1}</span>
                    <b className="text-amber-400 text-sm">{score} pts</b>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-800">
            <button
              type="button"
              id="summary-play-again"
              onClick={onPlayAgain}
              className="h-13 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-black text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
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
            className="mt-3 text-xs text-neutral-400 hover:text-violet-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View All Saved History & Records →</span>
          </button>
        </div>
      </div>
    );
  }

  // Dedicated scorecard rendering for Checkout Challenge
  if (gameType === 'cochallenge') {
    const coRes = result as CheckoutChallengeResult;

    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-1">
            🎯 Checkout Challenge Completed
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-mono text-amber-400 tracking-tight">
            {coRes.highestCheckout > 0 ? `${coRes.highestCheckout} Highest Out` : 'No Checkouts Made'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Duration: <b className="text-neutral-200 font-mono">{durationFormatted}</b> · Start: <b className="text-neutral-200 font-mono">{coRes.startTarget}</b> · Final Target: <b className="text-cyan-400 font-mono">{coRes.finalTarget}</b>
          </p>

          {/* Primary KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Highest Out
              </span>
              <span className="text-2xl font-mono font-black text-amber-400 mt-1 block tracking-tight">
                {coRes.highestCheckout > 0 ? coRes.highestCheckout : '—'}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Checkouts
              </span>
              <span className="text-2xl font-mono font-black text-cyan-400 mt-1 block tracking-tight">
                {coRes.checkoutsMade} <span className="text-xs text-neutral-400 font-sans font-normal">/ {coRes.attempts}</span>
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Success Rate
              </span>
              <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block tracking-tight">
                {coRes.checkoutRate}%
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Best Streak
              </span>
              <span className="text-2xl font-mono font-black text-amber-400 mt-1 block tracking-tight">
                {coRes.bestStreak} 🔥
              </span>
            </div>
          </div>

          {/* Attempt Progression History */}
          {coRes.history && coRes.history.length > 0 && (
            <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-700/60 pb-2 flex items-center justify-between">
                <span>Attempt Progression</span>
                <span className="text-[11px] text-neutral-400 font-normal">{coRes.totalDarts} total darts thrown</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {coRes.history.map((att, idx) => (
                  <div
                    key={idx}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border ${
                      att.result === 'hit'
                        ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                        : 'bg-rose-950/80 border-rose-800 text-rose-300'
                    }`}
                  >
                    <span>{att.target}</span>
                    <span className="text-[10px] opacity-80">
                      {att.result === 'hit' ? `(${att.dartsUsed}d)` : 'Miss'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-800">
            <button
              type="button"
              id="summary-play-again"
              onClick={onPlayAgain}
              className="h-13 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-neutral-950 font-black text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
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
            className="mt-3 text-xs text-neutral-400 hover:text-cyan-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View All Saved History & Records →</span>
          </button>
        </div>
      </div>
    );
  }

  // Dedicated scorecard rendering for Doubles Boomerang
  if (gameType === 'boomerang') {
    const boomRes = result as DoublesBoomerangResult;

    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block mb-1">
            🎯 Doubles Boomerang Completed
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
            {boomRes.roundsCompleted > 0
              ? `${boomRes.roundsCompleted} ${boomRes.roundsCompleted === 1 ? 'Round' : 'Rounds'} Cleared`
              : 'Session Completed'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Duration: <b className="text-neutral-200 font-mono">{durationFormatted}</b> · Total Darts: <b className="text-sky-300 font-mono">{boomRes.totalDarts}</b>
          </p>

          {/* Primary KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Best Round
              </span>
              <span className="text-2xl font-mono font-black text-amber-400 mt-1 block tracking-tight">
                {boomRes.bestRoundDarts ? `${boomRes.bestRoundDarts}d` : '—'}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Rounds Cleared
              </span>
              <span className="text-2xl font-mono font-black text-sky-400 mt-1 block tracking-tight">
                {boomRes.roundsCompleted}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Doubles Hit
              </span>
              <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block tracking-tight">
                {boomRes.totalHits} <span className="text-xs text-neutral-400 font-sans font-normal">/ {boomRes.totalDarts}</span>
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Hit Accuracy
              </span>
              <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block tracking-tight">
                {boomRes.overallAccuracy}%
              </span>
            </div>
          </div>

          {/* Round-by-Round Breakdown */}
          {boomRes.roundDetails && boomRes.roundDetails.length > 0 && (
            <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-700/60 pb-2 flex items-center justify-between">
                <span>Rounds Performance</span>
                <span className="text-[11px] text-neutral-400 font-normal">20 doubles per round</span>
              </span>
              <div className="space-y-1.5 pt-1">
                {boomRes.roundDetails.map((rd) => (
                  <div
                    key={rd.round}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs font-mono"
                  >
                    <span className="font-bold text-sky-300">Round {rd.round}</span>
                    <span className="text-neutral-300">
                      <b className="text-white font-bold">{rd.darts}</b> darts thrown
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-bold">
                      {rd.accuracy}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-800">
            <button
              type="button"
              id="summary-play-again"
              onClick={onPlayAgain}
              className="h-13 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-neutral-950 font-black text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
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
            className="mt-3 text-xs text-neutral-400 hover:text-sky-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View All Saved History & Records →</span>
          </button>
        </div>
      </div>
    );
  }

  // Dedicated scorecard rendering for Bob's 27
  if (gameType === 'bobs27') {
    const bobsRes = result as Bobs27Result;

    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
            Session Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Bob's 27 Summary
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            {durationFormatted} · {bobsRes.runsPlayed} Run{bobsRes.runsPlayed !== 1 ? 's' : ''} Played
          </p>

          {/* Core Metric Banner: Best Score */}
          <div className="my-5 p-4 rounded-2xl bg-[#141922] border border-[#2b3542] relative">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Best Score in Session
            </span>
            <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight my-1">
              {bobsRes.bestScore} <span className="text-sm font-sans font-normal text-neutral-400">pts</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-xs font-mono text-neutral-300 mt-1">
              <span>Avg Score: <b className="text-white">{bobsRes.averageScore} pts</b></span>
              <span>·</span>
              <span>Cleared: <b className="text-emerald-400">{bobsRes.completedRuns}</b> / {bobsRes.runsPlayed}</span>
            </div>
          </div>

          {/* 3-Column Key Stat Grid */}
          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="p-3 rounded-xl bg-neutral-850 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">
                Runs Cleared
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                {bobsRes.completedRuns}
              </span>
              <span className="text-[10px] text-neutral-500 block font-mono">
                {bobsRes.bustedRuns} busted
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-850 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">
                Doubles Hit
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-teal-400">
                {bobsRes.totalHits}
              </span>
              <span className="text-[10px] text-neutral-500 block font-mono">
                / {bobsRes.totalDarts} darts
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-850 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">
                Accuracy
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-cyan-400">
                {bobsRes.overallAccuracy}%
              </span>
              <span className="text-[10px] text-neutral-500 block font-mono">
                doubles hit %
              </span>
            </div>
          </div>

          {/* Run-by-Run Breakdown */}
          {bobsRes.runDetails && bobsRes.runDetails.length > 0 && (
            <div className="my-4 text-left">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                Run-by-Run Log
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {bobsRes.runDetails.map((r) => (
                  <div
                    key={r.runNumber}
                    className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs ${
                      r.completed
                        ? 'bg-emerald-950/30 border-emerald-800/50'
                        : 'bg-neutral-850 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px] font-bold">
                        #{r.runNumber}
                      </span>
                      <div>
                        <span className="font-bold text-white block font-sans text-xs">
                          {r.completed ? '🏆 Full Board Cleared' : `Busted on ${r.bustedAtTarget || 'Target'}`}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-sans">
                          {r.targetsAttempted}/21 targets · {r.totalHits}/{r.totalDarts} hits ({r.accuracy}%)
                        </span>
                      </div>
                    </div>

                    <span
                      className={`font-black text-sm ${
                        r.completed
                          ? 'text-emerald-400'
                          : r.finalScore <= 0
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {r.finalScore} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              type="button"
              id="summary-play-again"
              onClick={onPlayAgain}
              className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>

            <button
              type="button"
              id="summary-go-home"
              onClick={onGoHome}
              className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-bold text-sm border border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>

          <button
            type="button"
            id="summary-view-history"
            onClick={onOpenHistory}
            className="mt-3 text-xs text-neutral-400 hover:text-amber-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View All Saved History & Records →</span>
          </button>
        </div>
      </div>
    );
  }

  // Dedicated scorecard rendering for A1 - Practice routine
  if (gameType === 'a1practice' || gameType === 'a1practice_top' || gameType === 'a1practice_bottom') {
    const a1Res = result as A1PracticeResult;
    const setsDone = a1Res.setsCompleted || 0;

    // Extract all recorded target keys sorted numerically from highest to lowest
    const recordedTargetKeys = Object.keys(a1Res.targetStats || {}).sort((a, b) => Number(b) - Number(a));

    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
            🎯 A1 Practice Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
            {setsDone > 0
              ? `${setsDone} Full Set${setsDone > 1 ? 's' : ''} Cleared!`
              : `${a1Res.targetsCleared} Targets Cleared`}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Duration: <b className="text-neutral-200 font-mono">{durationFormatted}</b> · Total Darts: <b className="text-amber-300 font-mono">{a1Res.totalDarts}</b>
          </p>

          {/* Primary KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Targets Cleared
              </span>
              <span className="text-2xl font-mono font-black text-amber-400 mt-1 block tracking-tight">
                {a1Res.targetsCleared}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Successful Visits
              </span>
              <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block tracking-tight">
                {a1Res.successfulVisits}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Hit Rate
              </span>
              <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block tracking-tight">
                {a1Res.accuracy}%
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Total Visits
              </span>
              <span className="text-2xl font-mono font-black text-white mt-1 block tracking-tight">
                {a1Res.totalVisits}
              </span>
            </div>
          </div>

          {/* Target Breakdown Grid */}
          {recordedTargetKeys.length > 0 && (
            <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-700/60 pb-2 flex items-center justify-between">
                <span>Targets Breakdown</span>
                <span className="text-[11px] text-neutral-400 font-normal">3 hits to lock</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {recordedTargetKeys.map((key) => {
                  const stat = a1Res.targetStats[key];
                  if (!stat) return null;
                  return (
                    <div
                      key={key}
                      className={`p-2 rounded-xl border text-xs font-mono text-center flex flex-col items-center justify-center ${
                        stat.completed
                          ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300'
                          : 'bg-neutral-900/90 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <b className="text-sm font-bold text-white">{key}</b>
                      <span className="text-[11px] mt-0.5">
                        {stat.hits}/3 ({stat.attempts}v)
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
              className="h-13 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-black text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
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
            className="mt-3 text-xs text-neutral-400 hover:text-amber-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View All Saved History & Records →</span>
          </button>
        </div>
      </div>
    );
  }

  // Dedicated scorecard rendering for Big Singles
  if (gameType === 'bigsingles' || gameType === 'bigsingles_intermediate' || gameType === 'bigsingles_advanced') {
    const bsRes = result as BigSinglesResult;

    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-[#0b1220] border border-[#1e2d4a] rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block">
              🎯 BIG SINGLES COMPLETED
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#162238] border border-cyan-700/60 text-[10px] font-bold text-cyan-300 uppercase">
              {bsRes.level}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
            {bsRes.completedRounds > 0
              ? `${bsRes.completedRounds} ${bsRes.completedRounds === 1 ? 'Round' : 'Rounds'} Cleared + Reached #${bsRes.currentNumberReached}`
              : `Reached Number ${bsRes.highestNumberReached} of 20`}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Duration: <b className="text-neutral-200 font-mono">{durationFormatted}</b> · Total Darts: <b className="text-cyan-300 font-mono">{bsRes.totalDarts}</b>
          </p>

          {/* Primary KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
            <div className="bg-[#0e1626] border border-[#1e2d4a] rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Rounds Cleared
              </span>
              <span className="text-2xl font-mono font-black text-cyan-400 mt-1 block tracking-tight">
                {bsRes.completedRounds}
              </span>
            </div>

            <div className="bg-[#0e1626] border border-[#1e2d4a] rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Peak Number
              </span>
              <span className="text-2xl font-mono font-black text-amber-400 mt-1 block tracking-tight">
                #{bsRes.highestNumberReached}
              </span>
            </div>

            <div className="bg-[#0e1626] border border-[#1e2d4a] rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Hit Accuracy
              </span>
              <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block tracking-tight">
                {bsRes.dartHitAccuracy}%
              </span>
            </div>

            <div className="bg-[#0e1626] border border-[#1e2d4a] rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Total Hits / Darts
              </span>
              <span className="text-2xl font-mono font-black text-white mt-1 block tracking-tight text-sm sm:text-xl">
                {bsRes.totalDartHits} <span className="text-xs text-neutral-400 font-sans font-normal">/ {bsRes.totalDarts}</span>
              </span>
            </div>
          </div>

          {/* Round Details Breakdown if multiple rounds */}
          {bsRes.roundDetails && bsRes.roundDetails.length > 0 && (
            <div className="bg-[#0e1626] border border-[#1e2d4a] rounded-2xl p-3 text-left my-3 space-y-1.5">
              <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-700/50 pb-1.5">
                Completed 1-20 Round Sweeps
              </span>
              <div className="space-y-1">
                {bsRes.roundDetails.map((rd) => (
                  <div
                    key={rd.roundNumber}
                    className="flex items-center justify-between text-xs font-mono py-1 px-2 rounded-lg bg-neutral-900/60 border border-neutral-800"
                  >
                    <span className="font-bold text-cyan-400">Round {rd.roundNumber}</span>
                    <span className="text-neutral-300">
                      {rd.darts} darts ({rd.visits} visits)
                    </span>
                    <span className="text-emerald-400 font-bold">{rd.accuracy}% acc</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-800">
            <button
              type="button"
              id="summary-play-again"
              onClick={onPlayAgain}
              className="h-13 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-black text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
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
            className="mt-3 text-xs text-neutral-400 hover:text-cyan-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View All Saved History & Records →</span>
          </button>
        </div>
      </div>
    );
  }

  // Dedicated scorecard rendering for Round the World Singles
  if (
    gameType === 'rtwsingles' ||
    gameType === 'rtwsingles_intermediate' ||
    gameType === 'rtwsingles_advanced'
  ) {
    const rtwRes = result as RTWSinglesResult;
    const isCompletedAny = rtwRes.completedRuns > 0;

    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="bg-[#0e131b] border border-[#222d3d] rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          {/* Header Icon */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner ${
              isCompletedAny
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
            }`}
          >
            {isCompletedAny ? <Trophy className="w-8 h-8" /> : <Compass className="w-8 h-8" />}
          </div>

          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-1">
            🎯 Round the World Singles Summary
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {rtwRes.completedRuns > 0
              ? `${rtwRes.completedRuns} ${rtwRes.completedRuns === 1 ? 'Run' : 'Runs'} Cleared!`
              : 'Practice Session Completed'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Mode: <b className="text-cyan-300 capitalize font-sans">{rtwRes.difficulty}</b> · Duration:{' '}
            <b className="text-neutral-200">{durationFormatted}</b> · Total Darts:{' '}
            <b className="text-white">{rtwRes.totalDarts}</b>
          </p>

          {/* Primary KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Best Clear
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 mt-0.5 block tracking-tight">
                {rtwRes.bestRunDarts ? `${rtwRes.bestRunDarts}d` : '—'}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Runs Cleared
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400 mt-0.5 block tracking-tight">
                {rtwRes.completedRuns} <span className="text-xs text-neutral-500 font-sans font-normal">/ {rtwRes.runsPlayed}</span>
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Furthest Target
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black text-cyan-400 mt-0.5 block tracking-tight">
                {rtwRes.highestTargetEver || 'S1'}
              </span>
            </div>

            <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 text-center shadow-inner">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Accuracy
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400 mt-0.5 block tracking-tight">
                {rtwRes.overallAccuracy}%
              </span>
            </div>
          </div>

          {/* Secondary stats bar */}
          <div className="bg-neutral-850/70 border border-neutral-750/70 rounded-xl p-2.5 text-xs flex items-center justify-around text-neutral-300 font-mono">
            <div>
              <span className="text-neutral-500 text-[10px] uppercase font-sans font-bold block">Hits / Misses</span>
              <b className="text-white">{rtwRes.totalHits}</b> hits · <b className="text-rose-400">{rtwRes.totalMisses}</b> misses
            </div>
            <div className="h-6 w-px bg-neutral-700/60" />
            <div>
              <span className="text-neutral-500 text-[10px] uppercase font-sans font-bold block">Failed Runs</span>
              <b className="text-rose-400">{rtwRes.failedRuns}</b> busted
            </div>
          </div>

          {/* Run-by-Run Breakdown List */}
          {rtwRes.runDetails && rtwRes.runDetails.length > 0 && (
            <div className="bg-neutral-850/80 border border-neutral-750/80 rounded-2xl p-4 text-left shadow-inner my-3 space-y-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-700/60 pb-2 flex items-center justify-between">
                <span>Run-by-Run Performance</span>
                <span className="text-[11px] text-neutral-400 font-normal">1 to 20 + Bull</span>
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {rtwRes.runDetails.map((rd) => (
                  <div
                    key={rd.runNumber}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono ${
                      rd.completed
                        ? 'bg-emerald-950/40 border-emerald-700/70 text-emerald-200'
                        : 'bg-neutral-900/90 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px] font-bold">
                        #{rd.runNumber}
                      </span>
                      <div>
                        <span className="font-bold text-white block font-sans text-xs">
                          {rd.completed
                            ? '🏆 Full Round Cleared (Bull Hit!)'
                            : `Ended on ${rd.finalTargetReached} (Peak: ${rd.highestTargetReached})`}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-sans">
                          {rd.hits} hits, {rd.misses} misses ({rd.accuracy}%) · {rd.reasonEnded === 'strikeout' ? '3 misses in a row' : rd.reasonEnded === 'max_misses' ? '5 misses limit' : 'Cleared'}
                        </span>
                      </div>
                    </div>

                    <span className="font-bold text-sm text-cyan-300">
                      {rd.dartsThrown}d
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-800">
            <button
              type="button"
              id="summary-play-again"
              onClick={onPlayAgain}
              className="h-13 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-neutral-950 font-black text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
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
            className="mt-3 text-xs text-neutral-400 hover:text-cyan-400 font-semibold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors cursor-pointer"
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

