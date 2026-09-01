import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Crosshair,
  Zap,
  Trophy,
  Compass,
  CheckCircle2,
  XCircle,
  Flame,
  Target,
  Clock,
  Layers,
} from 'lucide-react';
import {
  GameType,
  GameResultData,
  HighscoreResult,
  PowerSwitchResult,
  SwitchbladeResult,
  BigScoresResult,
  RTWSinglesResult,
  BigSinglesResult,
  A1PracticeResult,
  Bobs27Result,
  CheckoutChallengeResult,
  DoublesBoomerangResult,
  DartBotMatchResult,
  Solo301Result,
  TripleLockResult,
  BullResult,
  CatchFortyResult,
  OneTwentyOneResult,
} from '../../types';
import { LegBreakdownView } from './LegBreakdownView';

interface AdvancedSessionBreakdownProps {
  gameType: GameType;
  result: GameResultData;
  dateStr?: string;
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

export const AdvancedSessionBreakdown: React.FC<AdvancedSessionBreakdownProps> = ({
  gameType,
  result,
}) => {
  // 1. Highscore Advanced Breakdown
  if (gameType === 'score' || gameType === 'score1' || gameType === 'score2') {
    const scoreRes = result as HighscoreResult;
    const visits = scoreRes.visits || [];
    const visitsCount = visits.length || (scoreRes.darts ? Math.round(scoreRes.darts / 3) : 0);
    const totalPoints =
      scoreRes.totalPoints ?? (visits.length > 0 ? visits.reduce((a, b) => a + b, 0) : 0);
    const distribution = scoreRes.distribution || {};
    const tonsCount =
      scoreRes.tons ?? (visits.length > 0 ? visits.filter((x) => x >= 100 && x < 140).length : 0);
    const tonFortiesCount =
      scoreRes.tonForties ??
      (visits.length > 0 ? visits.filter((x) => x >= 140 && x < 180).length : 0);
    const oneEightiesCount =
      scoreRes.oneEighties ?? (visits.length > 0 ? visits.filter((x) => x === 180).length : 0);

    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">3-Dart Avg</span>
            <span className="text-xl font-mono font-black text-emerald-400">{scoreRes.avg}</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Points</span>
            <span className="text-xl font-mono font-black text-cyan-400">
              {totalPoints.toLocaleString()}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Best Visit</span>
            <span className="text-xl font-mono font-black text-amber-400">{scoreRes.bestVisit}</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">First 9 Avg</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {scoreRes.firstNineAvg || scoreRes.avg}
            </span>
          </div>
        </div>

        {/* Milestone Badges */}
        <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-neutral-400 font-sans uppercase block">100+ Tons</span>
            <b className="text-emerald-400 text-sm">{tonsCount}</b>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-neutral-400 font-sans uppercase block">140+ Visits</span>
            <b className="text-amber-400 text-sm">{tonFortiesCount}</b>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-neutral-400 font-sans uppercase block">180 Maximums</span>
            <b className="text-rose-400 text-sm font-black">{oneEightiesCount} 🔥</b>
          </div>
        </div>

        {/* Scoring Distribution Bars */}
        {Object.keys(distribution).length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Scoring Distribution
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">{visitsCount} visits</span>
            </div>

            <div className="space-y-1.5 pt-1">
              {SCORE_BUCKETS.map((b, idx) => {
                const count = distribution[b.label] || 0;
                const pct = visitsCount > 0 ? ((count / visitsCount) * 100).toFixed(1) : '0.0';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-neutral-900/60 border border-neutral-850"
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

        {/* Chronological Visit Log */}
        {visits.length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/80 pb-2">
              Visit Log ({visits.length} Throws)
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 scrollbar-thin">
              {visits.map((score, idx) => {
                let badgeColor = 'bg-neutral-900 border-neutral-800 text-neutral-300';
                if (score === 180) badgeColor = 'bg-rose-950/90 border-rose-700 text-rose-300 font-black';
                else if (score >= 140) badgeColor = 'bg-amber-950/90 border-amber-700 text-amber-300 font-bold';
                else if (score >= 100) badgeColor = 'bg-emerald-950/90 border-emerald-700 text-emerald-300 font-bold';
                else if (score >= 60) badgeColor = 'bg-cyan-950/90 border-cyan-800 text-cyan-300';

                return (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-mono ${badgeColor}`}
                    title={`Visit #${idx + 1}: ${score} pts`}
                  >
                    #{idx + 1}: <b>{score}</b>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Power Switch Advanced Breakdown (with exact T20 vs T19 vs T18 target metrics and visit log!)
  if (gameType === 'powerswitch') {
    const psRes = result as PowerSwitchResult;
    const history = psRes.history || [];

    // Compute or read target-by-target stats
    let targetStats = psRes.targetStats;
    if (!targetStats && history.length > 0) {
      const map: Record<
        string,
        {
          target: string;
          attempts: number;
          trebles: number;
          doubles: number;
          singles: number;
          misses: number;
          points: number;
          trebleRate: number;
          hitRate: number;
        }
      > = {
        T20: { target: 'T20', attempts: 0, trebles: 0, doubles: 0, singles: 0, misses: 0, points: 0, trebleRate: 0, hitRate: 0 },
        T19: { target: 'T19', attempts: 0, trebles: 0, doubles: 0, singles: 0, misses: 0, points: 0, trebleRate: 0, hitRate: 0 },
        T18: { target: 'T18', attempts: 0, trebles: 0, doubles: 0, singles: 0, misses: 0, points: 0, trebleRate: 0, hitRate: 0 },
      };

      history.forEach((rec) => {
        rec.darts.forEach((d) => {
          if (!map[d.target]) {
            map[d.target] = { target: d.target, attempts: 0, trebles: 0, doubles: 0, singles: 0, misses: 0, points: 0, trebleRate: 0, hitRate: 0 };
          }
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

    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Points</span>
            <span className="text-xl font-mono font-black text-amber-400">
              {psRes.totalPoints?.toLocaleString()}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Avg / Visit</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {psRes.pointsPerVisitAvg}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Treble Rate</span>
            <span className="text-xl font-mono font-black text-amber-300">{psRes.trebleRate}%</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Overall Hit %</span>
            <span className="text-xl font-mono font-black text-cyan-400">{psRes.hitRate}%</span>
          </div>
        </div>

        {/* Multiplier Distribution */}
        <div className="grid grid-cols-4 gap-2 font-mono text-xs text-center">
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-emerald-400 font-sans uppercase block font-bold">
              Trebles (+3)
            </span>
            <b className="text-white text-sm">{psRes.trebleHits}</b>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-cyan-400 font-sans uppercase block font-bold">
              Doubles (+2)
            </span>
            <b className="text-white text-sm">{psRes.doubleHits}</b>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-neutral-300 font-sans uppercase block font-bold">
              Singles (+1)
            </span>
            <b className="text-white text-sm">{psRes.singleHits}</b>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-rose-400 font-sans uppercase block font-bold">
              Misses (0)
            </span>
            <b className="text-white text-sm">{psRes.misses}</b>
          </div>
        </div>

        {/* Target Breakdown: T20 vs T19 vs T18 */}
        {targetStats && Object.keys(targetStats).length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" /> Target Precision Breakdown
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {psRes.darts} total darts thrown
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {['T20', 'T19', 'T18'].map((tKey) => {
                const stat = targetStats![tKey] || {
                  attempts: 0,
                  trebles: 0,
                  doubles: 0,
                  singles: 0,
                  misses: 0,
                  points: 0,
                  trebleRate: 0,
                  hitRate: 0,
                };
                return (
                  <div
                    key={tKey}
                    className="bg-neutral-900/90 border border-neutral-800/80 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-amber-300 font-mono">{tKey}</span>
                      <span className="text-xs font-bold text-neutral-400 font-mono">
                        {stat.attempts} darts
                      </span>
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
                        <span className="text-neutral-400 font-sans">Points Scored:</span>
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
        )}

        {/* Visit-by-Visit Throw Breakdown Log */}
        {history.length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/80 pb-2">
              Visit-by-Visit Throw Sequence ({history.length} Visits)
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 scrollbar-thin font-mono text-xs">
              {history.map((rec) => (
                <div
                  key={rec.visitNumber}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-neutral-900/70 border border-neutral-800"
                >
                  <span className="text-neutral-500 font-bold w-12">#{rec.visitNumber}</span>
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    {rec.darts.map((d, dIdx) => {
                      let badge = 'bg-neutral-800 text-neutral-400 border-neutral-700';
                      if (d.multiplier === 'treble') badge = 'bg-emerald-950 text-emerald-300 border-emerald-700 font-bold';
                      else if (d.multiplier === 'double') badge = 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold';
                      else if (d.multiplier === 'single') badge = 'bg-neutral-850 text-neutral-200 border-neutral-700';
                      else badge = 'bg-rose-950/80 text-rose-400 border-rose-800';

                      return (
                        <span
                          key={dIdx}
                          className={`px-2 py-0.5 rounded border text-[11px] ${badge}`}
                          title={`Dart ${dIdx + 1} at ${d.target}: ${d.multiplier} (+${d.points})`}
                        >
                          {d.target}: <b className="capitalize">{d.multiplier}</b>
                        </span>
                      );
                    })}
                  </div>
                  <span className="w-14 text-right font-bold text-amber-300">
                    +{rec.totalPoints} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Switchblade Advanced Breakdown
  if (gameType === 'switchblade') {
    const sbRes = result as SwitchbladeResult;
    const targetKeys = [
      'T20 - T20 - T20',
      'T20 - T20 - T19',
      'T20 - T20 - T18',
      'T20 - T20 - T17',
      'T20 - T20 - Bull',
    ];

    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Points</span>
            <span className="text-xl font-mono font-black text-rose-400">
              {sbRes.totalPoints?.toLocaleString()}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Avg / Throw</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {sbRes.averageScorePerVisit}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Full Rounds</span>
            <span className="text-xl font-mono font-black text-amber-400">{sbRes.cyclesCompleted}</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Darts</span>
            <span className="text-xl font-mono font-black text-cyan-400">{sbRes.darts}</span>
          </div>
        </div>

        {/* Dart Hit Rates */}
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] text-neutral-400 font-sans block uppercase">Dart 1 (T20)</span>
            <b className="text-white text-sm">{sbRes.dart1HitRate}% hit</b>
            <span className="text-[10px] text-emerald-400 block font-sans">({sbRes.dart1TreblePct}% T)</span>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] text-neutral-400 font-sans block uppercase">Dart 2 (T20)</span>
            <b className="text-white text-sm">{sbRes.dart2HitRate}% hit</b>
            <span className="text-[10px] text-emerald-400 block font-sans">({sbRes.dart2TreblePct}% T)</span>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] text-neutral-400 font-sans block uppercase">Dart 3 (Switch)</span>
            <b className="text-white text-sm">{sbRes.dart3HitRate}% hit</b>
            <span className="text-[10px] text-amber-400 block font-sans">({sbRes.dart3TreblePct}% T/Bull)</span>
          </div>
        </div>

        {/* Target Precision Breakdown (T20 vs T19 vs T18 vs T17 vs Bull) */}
        {sbRes.targetStats && Object.keys(sbRes.targetStats).length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-rose-400" /> Target Accuracy & Breakdown
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {sbRes.darts} total darts thrown
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['T20', 'T19', 'T18', 'T17', 'Bull'].map((tKey) => {
                const stat = sbRes.targetStats![tKey] || {
                  target: tKey,
                  attempts: 0,
                  trebles: 0,
                  doubles: 0,
                  singles: 0,
                  misses: 0,
                  points: 0,
                  hitRate: 0,
                  trebleRate: 0,
                };
                return (
                  <div
                    key={tKey}
                    className="bg-neutral-900/90 border border-neutral-800/80 rounded-xl p-2.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-300 font-mono">{tKey}</span>
                      <span className="text-[10px] font-bold text-neutral-400 font-mono">
                        {stat.attempts}d
                      </span>
                    </div>

                    <div className="space-y-0.5 text-[11px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-neutral-400 font-sans text-[10px]">Treble %:</span>
                        <b className="text-emerald-400">{stat.trebleRate}%</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400 font-sans text-[10px]">Hit %:</span>
                        <b className="text-cyan-400">{stat.hitRate}%</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400 font-sans text-[10px]">Pts:</span>
                        <b className="text-amber-400">{stat.points}</b>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-neutral-800 text-neutral-400">
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
        )}

        {/* Target Sequence Breakdown */}
        {sbRes.targetScores && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/80 pb-2">
              Target Sequence Breakdown
            </span>
            <div className="space-y-1.5 pt-1">
              {targetKeys.map((k) => {
                const item = sbRes.targetScores[k] || { totalScore: 0, count: 0, avgScore: 0 };
                return (
                  <div
                    key={k}
                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-neutral-900/70 border border-neutral-800"
                  >
                    <span className="font-bold text-rose-300 font-mono">{k}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-neutral-400 text-[11px]">{item.count} throws</span>
                      <span className="text-white font-bold">{item.totalScore} pts</span>
                      <span className="text-emerald-400 font-black text-xs">({item.avgScore} avg)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Round by Round Scores */}
        {sbRes.cycleScores && sbRes.cycleScores.length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/80 pb-2">
              Round-by-Round Scores
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              {sbRes.cycleScores.map((score, idx) => (
                <div key={idx} className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl text-center">
                  <span className="text-[10px] text-neutral-400 block font-sans">Round #{idx + 1}</span>
                  <b className="text-amber-400 text-sm">{score} pts</b>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Big Scores Advanced Breakdown
  if (gameType === 'bigscores') {
    const bsRes = result as BigScoresResult;
    const stageKeys = ['20', '19', '18', '17', 'Bull'];

    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Points</span>
            <span className="text-xl font-mono font-black text-violet-400">
              {bsRes.totalPoints?.toLocaleString()}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Avg / Visit</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {bsRes.averageScorePerVisit}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">3-Dart Avg</span>
            <span className="text-xl font-mono font-black text-cyan-400">{bsRes.threeDartAvg}</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Full Rounds</span>
            <span className="text-xl font-mono font-black text-amber-400">{bsRes.cyclesCompleted}</span>
          </div>
        </div>

        {/* Multiplier Distribution */}
        <div className="grid grid-cols-4 gap-2 font-mono text-xs text-center">
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-emerald-400 font-sans uppercase block font-bold">Trebles</span>
            <b className="text-white text-sm">{bsRes.trebleHits}</b>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-cyan-400 font-sans uppercase block font-bold">Doubles</span>
            <b className="text-white text-sm">{bsRes.doubleHits}</b>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-neutral-300 font-sans uppercase block font-bold">Singles</span>
            <b className="text-white text-sm">{bsRes.singleHits}</b>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-rose-400 font-sans uppercase block font-bold">Misses</span>
            <b className="text-white text-sm">{bsRes.misses}</b>
          </div>
        </div>

        {/* Segment Breakdown */}
        {bsRes.segmentScores && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/80 pb-2">
              Segment Breakdown (20 → 19 → 18 → 17 → Bull)
            </span>
            <div className="space-y-1.5 pt-1">
              {stageKeys.map((k) => {
                const item = bsRes.segmentScores[k] || {
                  totalScore: 0,
                  count: 0,
                  avgScore: 0,
                  hits: 0,
                  trebles: 0,
                  doubles: 0,
                  singles: 0,
                  misses: 0,
                };
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
      </div>
    );
  }

  // 5. Round the World Singles Breakdown
  if (gameType === 'rtwsingles' || gameType === 'rtwsingles_intermediate' || gameType === 'rtwsingles_advanced') {
    const rtwRes = result as RTWSinglesResult;
    const runs = rtwRes.runDetails || [];

    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Mode</span>
            <span className="text-base font-bold text-cyan-300 capitalize">{rtwRes.difficulty}</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Completed Runs</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {rtwRes.completedRuns} / {rtwRes.runsPlayed}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Best Clear</span>
            <span className="text-xl font-mono font-black text-amber-400">
              {rtwRes.bestRunDarts ? `${rtwRes.bestRunDarts}d` : '—'}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Accuracy</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {rtwRes.overallAccuracy}%
            </span>
          </div>
        </div>

        {/* Hits and misses chip row */}
        <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-emerald-400 font-sans uppercase block font-bold">Total Hits</span>
            <b className="text-white text-sm">{rtwRes.totalHits}</b>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-rose-400 font-sans uppercase block font-bold">Total Misses</span>
            <b className="text-white text-sm">{rtwRes.totalMisses}</b>
          </div>
          <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
            <span className="text-[10px] text-cyan-400 font-sans uppercase block font-bold">Highest Target</span>
            <b className="text-white text-sm">{rtwRes.highestTargetEver || 'S1'}</b>
          </div>
        </div>

        {/* Run by Run Details */}
        {runs.length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/80 pb-2">
              Individual Run Performance
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 scrollbar-thin font-mono text-xs">
              {runs.map((r) => (
                <div
                  key={r.runNumber}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-900/70 border border-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-400">Run #{r.runNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.completed
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {r.completed ? 'Cleared Bull' : `Reached ${r.highestTargetReached}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400">{r.dartsThrown} darts</span>
                    <span className="text-emerald-400 font-bold">{r.hits}H / {r.misses}M</span>
                    <span className="text-white font-bold">{r.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target by Target Precision Matrix (S1 to Bull) */}
        {rtwRes.targetStats && Object.keys(rtwRes.targetStats).length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" /> Target-by-Target Precision (S1 → Bull)
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {rtwRes.totalDarts} total darts
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 font-mono text-xs">
              {Object.entries(rtwRes.targetStats).map(([lbl, st]) => {
                const acc = st.attempts > 0 ? Math.round((st.hits / st.attempts) * 100) : 0;
                let colorBg = 'bg-neutral-900/80 border-neutral-800';
                let accColor = 'text-neutral-400';
                if (st.attempts > 0) {
                  if (acc >= 75) {
                    colorBg = 'bg-emerald-950/50 border-emerald-800/60';
                    accColor = 'text-emerald-400 font-bold';
                  } else if (acc >= 50) {
                    colorBg = 'bg-cyan-950/40 border-cyan-800/60';
                    accColor = 'text-cyan-400 font-bold';
                  } else if (acc >= 25) {
                    colorBg = 'bg-amber-950/40 border-amber-800/60';
                    accColor = 'text-amber-400';
                  } else {
                    colorBg = 'bg-rose-950/40 border-rose-800/60';
                    accColor = 'text-rose-400 font-bold';
                  }
                }

                return (
                  <div key={lbl} className={`p-2 rounded-xl border text-center ${colorBg}`}>
                    <span className="text-xs font-black text-white block">{lbl}</span>
                    <span className={`text-[11px] ${accColor} block`}>{acc}%</span>
                    <span className="text-[9px] text-neutral-400 block mt-0.5">
                      {st.hits}H / {st.misses}M
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 6. Big Singles Breakdown
  if (gameType === 'bigsingles' || gameType === 'bigsingles_intermediate' || gameType === 'bigsingles_advanced') {
    const bsRes = result as BigSinglesResult;
    const rounds = bsRes.roundDetails || [];
    const targetStats = bsRes.targetStats || {};

    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Level</span>
            <span className="text-base font-bold text-amber-300 capitalize">{bsRes.level}</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Completed Rounds</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {bsRes.completedRounds}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Highest Reached</span>
            <span className="text-xl font-mono font-black text-cyan-400">
              #{bsRes.highestNumberReached || bsRes.currentNumberReached || 1}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Accuracy</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {bsRes.dartHitAccuracy}%
            </span>
          </div>
        </div>

        {/* Round Details */}
        {rounds.length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/80 pb-2">
              Round Breakdown
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              {rounds.map((rnd) => (
                <div
                  key={rnd.roundNumber}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-900/70 border border-neutral-800"
                >
                  <span className="font-bold text-amber-300">Round #{rnd.roundNumber} (1→20)</span>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400">{rnd.darts} darts ({rnd.visits} visits)</span>
                    <span className="text-emerald-400 font-bold">{rnd.hits} hits</span>
                    <span className="text-white font-bold">{rnd.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target-by-Target Hits & Misses (1 to 20) */}
        {Object.keys(targetStats).length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" /> Target Accuracy Heatmap (1 to 20)
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {bsRes.totalDarts} total darts
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-1.5 font-mono text-xs">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                const st = targetStats[num] || { number: num, visits: 0, attempts: 0, hits: 0, misses: 0, accuracy: 0 };
                let colorBg = 'bg-neutral-900/80 border-neutral-800';
                let accColor = 'text-neutral-400';
                if (st.attempts > 0) {
                  if (st.accuracy >= 75) {
                    colorBg = 'bg-emerald-950/50 border-emerald-800/60';
                    accColor = 'text-emerald-400 font-bold';
                  } else if (st.accuracy >= 50) {
                    colorBg = 'bg-cyan-950/40 border-cyan-800/60';
                    accColor = 'text-cyan-400 font-bold';
                  } else if (st.accuracy >= 25) {
                    colorBg = 'bg-amber-950/40 border-amber-800/60';
                    accColor = 'text-amber-400';
                  } else {
                    colorBg = 'bg-rose-950/40 border-rose-800/60';
                    accColor = 'text-rose-400 font-bold';
                  }
                }

                return (
                  <div key={num} className={`p-1.5 rounded-xl border text-center ${colorBg}`}>
                    <span className="text-xs font-black text-white block">S{num}</span>
                    <span className={`text-[11px] ${accColor} block`}>{st.accuracy}%</span>
                    <span className="text-[9px] text-neutral-400 block mt-0.5">
                      {st.hits}H/{st.misses}M
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 7. A1 Practice Breakdown
  if (gameType === 'a1practice' || gameType === 'a1practice_top' || gameType === 'a1practice_bottom') {
    const a1Res = result as A1PracticeResult;
    const targetStats = a1Res.targetStats || {};

    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Targets Cleared</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {a1Res.targetsCleared}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Visits</span>
            <span className="text-xl font-mono font-black text-white">{a1Res.totalVisits}</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Hit Visits</span>
            <span className="text-xl font-mono font-black text-cyan-400">
              {a1Res.successfulVisits}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Accuracy</span>
            <span className="text-xl font-mono font-black text-emerald-400">{a1Res.accuracy}%</span>
          </div>
        </div>

        {/* Target by Target Matrix */}
        {Object.keys(targetStats).length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/80 pb-2">
              Target by Target Clearance
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
              {Object.entries(targetStats).map(([num, st]) => (
                <div
                  key={num}
                  className={`p-2 rounded-xl border text-center ${
                    st.completed
                      ? 'bg-emerald-950/70 border-emerald-700/80'
                      : 'bg-neutral-900/90 border-neutral-800'
                  }`}
                >
                  <span className="text-sm font-black text-white block">Single {num}</span>
                  <span className="text-[11px] text-neutral-400 block">
                    {st.hits}/3 cleared ({st.attempts} att)
                  </span>
                  <span
                    className={`text-[10px] font-bold block mt-0.5 ${
                      st.completed ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {st.completed ? '✓ CLEARED' : `${3 - st.hits} needed`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 8. Bob's 27 Breakdown
  if (gameType === 'bobs27') {
    const bobsRes = result as Bobs27Result;
    const runs = bobsRes.runDetails || [];

    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Best Score</span>
            <span className="text-xl font-mono font-black text-amber-400">
              {bobsRes.bestScore} pts
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Average Score</span>
            <span className="text-xl font-mono font-black text-white">
              {bobsRes.averageScore} pts
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Cleared Runs</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {bobsRes.completedRuns} / {bobsRes.runsPlayed}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Overall Accuracy</span>
            <span className="text-xl font-mono font-black text-cyan-400">
              {bobsRes.overallAccuracy}%
            </span>
          </div>
        </div>

        {/* Run Details */}
        {runs.length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/80 pb-2">
              Run Performance Log
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              {runs.map((r) => (
                <div
                  key={r.runNumber}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-900/70 border border-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-400">Run #{r.runNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.completed
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {r.completed ? 'Completed (Bull)' : `Busted at ${r.bustedAtTarget || 'Double'}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-bold">{r.finalScore} pts</span>
                    <span className="text-neutral-400">{r.totalHits}/{r.totalDarts} hits</span>
                    <span className="text-white font-bold">{r.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 9. Checkout Challenge Breakdown
  if (gameType === 'cochallenge') {
    const coRes = result as CheckoutChallengeResult;
    const history = coRes.history || [];

    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Highest Out</span>
            <span className="text-xl font-mono font-black text-amber-400">
              {coRes.highestCheckout > 0 ? coRes.highestCheckout : '—'}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Checkouts</span>
            <span className="text-xl font-mono font-black text-cyan-400">
              {coRes.checkoutsMade} / {coRes.attempts}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Checkout Rate</span>
            <span className="text-xl font-mono font-black text-emerald-400">{coRes.checkoutRate}%</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Best Streak</span>
            <span className="text-xl font-mono font-black text-amber-400">{coRes.bestStreak || 0} 🔥</span>
          </div>
        </div>

        {/* Attempt Log */}
        {history.length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/80 pb-2">
              Checkout Attempts Log
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 scrollbar-thin font-mono text-xs">
              {history.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-neutral-900/70 border border-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Target {att.target}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        att.result === 'hit'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {att.result === 'hit' ? '✓ Checked Out' : '✗ Missed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400">{att.dartsUsed} darts used</span>
                    <span className="text-cyan-300">Next: {att.nextTarget}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 10. DartBot Match Breakdown
  if (gameType === 'dartbot') {
    const botRes = result as DartBotMatchResult;
    const hasLegs = botRes.legs && Array.isArray(botRes.legs) && botRes.legs.length > 0;
    const isSolo =
      botRes.botLevelLabel === 'Solo Practice' ||
      botRes.botLegs === undefined ||
      botRes.botStats?.totalDarts === 0;

    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Your 3-Dart Avg</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {botRes.playerStats?.threeDartAvg || '—'}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Bot 3-Dart Avg</span>
            <span className="text-xl font-mono font-black text-rose-400">
              {botRes.botStats?.threeDartAvg || '—'}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Double %</span>
            <span className="text-xl font-mono font-black text-cyan-400">
              {botRes.playerStats?.doublePercentage || 0}%
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">High Checkout</span>
            <span className="text-xl font-mono font-black text-amber-400">
              {botRes.playerStats?.highestCheckout > 0 ? botRes.playerStats.highestCheckout : '—'}
            </span>
          </div>
        </div>

        {hasLegs && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5">
            <LegBreakdownView
              legs={botRes.legs!}
              botLevelLabel={botRes.botLevelLabel}
              isSolo={isSolo}
              defaultExpanded={false}
            />
          </div>
        )}
      </div>
    );
  }

  // 11. Solo 301 Breakdown
  if (gameType === '301') {
    const soloRes = result as Solo301Result;
    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Legs Completed</span>
            <span className="text-xl font-mono font-black text-yellow-400">
              {soloRes.legsCompleted}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">3-Dart Avg</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {soloRes.threeDartAvg}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Best Leg</span>
            <span className="text-xl font-mono font-black text-amber-400">
              {soloRes.bestLegDarts ? `${soloRes.bestLegDarts}d` : '—'}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Darts</span>
            <span className="text-xl font-mono font-black text-white">{soloRes.totalDarts}</span>
          </div>
        </div>

        {soloRes.dartsAtDouble !== undefined && soloRes.dartsAtDouble > 0 && (
          <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
            <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
              <span className="text-[10px] text-neutral-400 font-sans uppercase block">
                Darts At Double
              </span>
              <b className="text-white text-sm">{soloRes.dartsAtDouble}</b>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
              <span className="text-[10px] text-neutral-400 font-sans uppercase block">Doubles Hit</span>
              <b className="text-emerald-400 text-sm">{soloRes.doublesHit || 0}</b>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
              <span className="text-[10px] text-neutral-400 font-sans uppercase block">Double %</span>
              <b className="text-cyan-400 text-sm">{soloRes.doublePercentage || 0}%</b>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 12. Doubles Boomerang Breakdown
  if (gameType === 'boomerang') {
    const boomRes = result as DoublesBoomerangResult;
    const rounds = boomRes.roundDetails || [];

    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Rounds Done</span>
            <span className="text-xl font-mono font-black text-sky-400">
              {boomRes.roundsCompleted}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Best Round</span>
            <span className="text-xl font-mono font-black text-amber-400">
              {boomRes.bestRoundDarts ? `${boomRes.bestRoundDarts}d` : '—'}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Hits</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {boomRes.totalHits} / {boomRes.totalDarts}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Accuracy</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {boomRes.overallAccuracy}%
            </span>
          </div>
        </div>

        {rounds.length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/80 pb-2">
              Round Logs (D1→D20→D1)
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              {rounds.map((rnd) => (
                <div
                  key={rnd.round}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-900/70 border border-neutral-800"
                >
                  <span className="font-bold text-sky-300">Round #{rnd.round}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400">{rnd.darts} darts</span>
                    <span className="text-emerald-400 font-bold">{rnd.hits} hits</span>
                    <span className="text-white font-bold">{rnd.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 13. Triple Lock Breakdown
  if (gameType === 'triple') {
    const tripRes = result as TripleLockResult;
    const targetStats = tripRes.targetStats || {};

    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Status</span>
            <span
              className={`text-base font-bold ${
                tripRes.completed ? 'text-emerald-400' : 'text-cyan-400'
              }`}
            >
              {tripRes.completed ? 'Completed' : '20m Cutoff'}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Locked Level</span>
            <span className="text-xl font-mono font-black text-amber-400">
              {tripRes.lockedThrough ?? 'None'}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Resets</span>
            <span className="text-xl font-mono font-black text-rose-400">{tripRes.resets}</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Darts</span>
            <span className="text-xl font-mono font-black text-white">
              {tripRes.dartsThrown || 0}
            </span>
          </div>
        </div>

        {/* Target-by-Target Precision for Triple Lock */}
        {Object.keys(targetStats).length > 0 && (
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" /> Target Accuracy & Lock Status
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {tripRes.dartsThrown || 0} darts thrown
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 font-mono text-xs">
              {Object.entries(targetStats).map(([tKey, st]) => {
                const acc = st.attempts > 0 ? Math.round((st.hits / st.attempts) * 100) : 0;
                let colorBg = 'bg-neutral-900/80 border-neutral-800';
                let accColor = 'text-neutral-400';
                if (st.attempts > 0) {
                  if (acc >= 66) {
                    colorBg = 'bg-emerald-950/50 border-emerald-800/60';
                    accColor = 'text-emerald-400 font-bold';
                  } else if (acc >= 33) {
                    colorBg = 'bg-cyan-950/40 border-cyan-800/60';
                    accColor = 'text-cyan-400 font-bold';
                  } else {
                    colorBg = 'bg-rose-950/40 border-rose-800/60';
                    accColor = 'text-rose-400 font-bold';
                  }
                }

                return (
                  <div key={tKey} className={`p-2 rounded-xl border text-center ${colorBg}`}>
                    <span className="text-xs font-black text-white block">{tKey}</span>
                    <span className={`text-[11px] ${accColor} block`}>{acc}%</span>
                    <span className="text-[9px] text-neutral-400 block mt-0.5">
                      {st.hits}H / {st.misses}M
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 14. Bull Warm-up Breakdown
  if (gameType === 'bull') {
    const bRes = result as BullResult;
    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Score</span>
            <span className="text-xl font-mono font-black text-red-400">{bRes.totalScore} pts</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Bullseye (50)</span>
            <span className="text-xl font-mono font-black text-emerald-400">{bRes.bull}</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Outer Bull (25)</span>
            <span className="text-xl font-mono font-black text-cyan-400">{bRes.twentyfive}</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Bull Hit %</span>
            <span className="text-xl font-mono font-black text-amber-400">{bRes.bullRate}%</span>
          </div>
        </div>
      </div>
    );
  }

  // 15. Catch 40 & 121
  if (gameType === 'catch40' || gameType === '121') {
    const cRes = result as CatchFortyResult | OneTwentyOneResult;
    return (
      <div className="space-y-3.5 text-left text-neutral-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Highest Reached</span>
            <span className="text-xl font-mono font-black text-amber-400">
              {cRes.highestReached}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Checkouts</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {cRes.checkouts} / {cRes.attempts}
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Checkout Rate</span>
            <span className="text-xl font-mono font-black text-cyan-400">{cRes.checkoutRate}%</span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Double %</span>
            <span className="text-xl font-mono font-black text-white">
              {cRes.doublePercentage || 0}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback view for any other drills
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs text-neutral-300">
      {Object.entries(result)
        .filter(
          ([k, v]) =>
            k !== 'distribution' &&
            !Array.isArray(v) &&
            typeof v !== 'object' &&
            v !== null &&
            v !== undefined
        )
        .map(([k, v]) => {
          const label = k
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
          let valStr = String(v);
          if (
            k === 'accuracy' ||
            k === 'bullRate' ||
            k === 'checkoutRate' ||
            k === 'doublePercentage' ||
            k === 'trebleRate' ||
            k === 'hitRate'
          ) {
            valStr = `${v}%`;
          }
          return (
            <div
              key={k}
              className="bg-neutral-950/80 border border-neutral-800 p-2 rounded-xl text-center"
            >
              <span className="text-[10px] font-sans font-bold text-neutral-400 block">{label}</span>
              <b className="text-white text-sm mt-0.5 block">{valStr}</b>
            </div>
          );
        })}
    </div>
  );
};
