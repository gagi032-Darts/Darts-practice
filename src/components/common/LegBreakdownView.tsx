import React, { useState } from 'react';
import {
  Trophy,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Target,
  Flame,
  Award,
  Zap,
  TrendingUp,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { LegStats, LegVisitTurn, DartBotMatchResult } from '../../types';

interface LegBreakdownViewProps {
  legs: LegStats[];
  botLevelLabel?: string;
  isSolo?: boolean;
  defaultExpanded?: boolean;
}

export const LegBreakdownView: React.FC<LegBreakdownViewProps> = ({
  legs,
  botLevelLabel = 'DartBot AI',
  isSolo = false,
  defaultExpanded = true,
}) => {
  const [selectedLegTab, setSelectedLegTab] = useState<number | 'all'>('all');
  const [expandedLegs, setExpandedLegs] = useState<Record<number, boolean>>(() => {
    // By default, keep all legs open or open the first 2
    const map: Record<number, boolean> = {};
    legs.forEach((l, idx) => {
      map[l.legNumber] = idx < 3; // First 3 expanded by default
    });
    return map;
  });

  if (!legs || legs.length === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 text-center text-xs text-neutral-500">
        No individual leg records recorded for this match.
      </div>
    );
  }

  const toggleLegExpand = (legNum: number) => {
    setExpandedLegs((prev) => ({
      ...prev,
      [legNum]: !prev[legNum],
    }));
  };

  const expandAll = () => {
    const map: Record<number, boolean> = {};
    legs.forEach((l) => {
      map[l.legNumber] = true;
    });
    setExpandedLegs(map);
  };

  const collapseAll = () => {
    setExpandedLegs({});
  };

  const displayLegs =
    selectedLegTab === 'all'
      ? legs
      : legs.filter((l) => l.legNumber === selectedLegTab);

  const getScoreBadgeColor = (points: number, isBust: boolean) => {
    if (isBust) return 'bg-rose-950/80 text-rose-400 border border-rose-800/80';
    if (points === 180) return 'bg-rose-500 text-neutral-950 font-black shadow-xs';
    if (points >= 140) return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold';
    if (points >= 100) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold';
    if (points >= 80) return 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30';
    if (points >= 60) return 'bg-neutral-800 text-neutral-200';
    return 'bg-neutral-850 text-neutral-400';
  };

  return (
    <div className="w-full space-y-4 text-left">
      {/* Header Bar & Leg Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Leg-by-Leg Breakdown</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                {legs.length} {legs.length === 1 ? 'Leg' : 'Legs'}
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Individual averages, darts thrown, checkouts & turn-by-turn logs
            </p>
          </div>
        </div>

        {/* Expand / Collapse Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={expandAll}
            className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-[11px] font-semibold text-neutral-300 transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-[11px] font-semibold text-neutral-400 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Leg Tabs Filter (if more than 1 leg) */}
      {legs.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedLegTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedLegTab === 'all'
                ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                : 'bg-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            All Legs ({legs.length})
          </button>

          {legs.map((leg) => {
            const isPWin = leg.winner === 'player';
            const isSel = selectedLegTab === leg.legNumber;
            return (
              <button
                key={leg.legNumber}
                type="button"
                onClick={() => setSelectedLegTab(leg.legNumber)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isSel
                    ? isPWin
                      ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-sm font-black'
                      : 'bg-rose-500 text-neutral-950 border-rose-400 shadow-sm font-black'
                    : 'bg-neutral-850 text-neutral-300 hover:text-white border-neutral-800 hover:bg-neutral-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPWin ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span>Leg {leg.legNumber}</span>
                {!isSolo && (
                  <span className="font-mono text-[10px] opacity-80">
                    ({leg.playerScoreline}-{leg.botScoreline})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legs List */}
      <div className="space-y-3">
        {displayLegs.map((leg) => {
          const isPlayerWin = leg.winner === 'player';
          const isExpanded = expandedLegs[leg.legNumber] ?? defaultExpanded;

          return (
            <div
              key={leg.legNumber}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isPlayerWin
                  ? 'bg-neutral-900/90 border-emerald-900/40 hover:border-emerald-700/60'
                  : 'bg-neutral-900/90 border-rose-900/40 hover:border-rose-700/60'
              }`}
            >
              {/* Leg Accordion Header */}
              <div
                onClick={() => toggleLegExpand(leg.legNumber)}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-neutral-850/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                      isPlayerWin
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {isSolo ? (
                      <Award className="w-5 h-5" />
                    ) : isPlayerWin ? (
                      <Trophy className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-sm sm:text-base font-black text-white">
                        Leg {leg.legNumber}
                      </b>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          isPlayerWin
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60'
                            : 'bg-rose-950/90 text-rose-300 border border-rose-700/60'
                        }`}
                      >
                        {isSolo
                          ? `Finished in ${leg.playerDarts} Darts`
                          : isPlayerWin
                          ? `Won by You (${leg.playerDarts} Darts)`
                          : `Won by ${botLevelLabel} (${leg.botDarts} Darts)`}
                      </span>
                      {!isSolo && (
                        <span className="text-xs font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-700">
                          Score: {leg.playerScoreline} – {leg.botScoreline}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1 flex-wrap">
                      <span>
                        Starter: <b className="text-neutral-200">{leg.startedBy === 'player' ? 'You' : botLevelLabel}</b>
                      </span>
                      <span>•</span>
                      <span>
                        Checkout:{' '}
                        <b className={isPlayerWin ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPlayerWin
                            ? leg.playerCheckout
                              ? `${leg.playerCheckout} pts`
                              : '-'
                            : leg.botCheckout
                            ? `${leg.botCheckout} pts`
                            : '-'}
                        </b>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick 3-Dart Avg preview pill & expand chevron */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-500 block font-sans">You</span>
                      <b className="text-emerald-400">{leg.playerAvg} avg</b>
                    </div>
                    {!isSolo && (
                      <>
                        <span className="text-neutral-600">vs</span>
                        <div className="text-left">
                          <span className="text-[10px] text-neutral-500 block font-sans">Bot</span>
                          <b className="text-rose-400">{leg.botAvg} avg</b>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Leg Details */}
              {isExpanded && (
                <div className="border-t border-neutral-800/80 p-3.5 sm:p-5 space-y-4 bg-neutral-950/40">
                  {/* Leg Stat Comparison Cards */}
                  <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3 sm:p-4 overflow-hidden shadow-inner">
                    <div className="grid grid-cols-3 text-xs font-bold text-neutral-400 border-b border-neutral-800 pb-2 mb-2">
                      <div className="text-left text-emerald-400 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>YOU</span>
                      </div>
                      <div className="text-center text-neutral-400 uppercase tracking-wider text-[10px]">
                        LEG {leg.legNumber} STATS
                      </div>
                      <div className="text-right text-rose-400 flex items-center justify-end gap-1">
                        {!isSolo && (
                          <>
                            <span className="truncate max-w-[80px] sm:max-w-none">{botLevelLabel}</span>
                            <Bot className="w-3.5 h-3.5" />
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      {/* 3-Dart Average */}
                      <div className="grid grid-cols-3 items-center py-1 border-b border-neutral-800/60">
                        <span className="text-left font-bold text-white text-sm">
                          {leg.playerAvg}
                        </span>
                        <span className="text-center text-neutral-400 text-[11px] font-sans">
                          3-Dart Avg
                        </span>
                        <span className="text-right font-bold text-white text-sm">
                          {!isSolo ? leg.botAvg : '-'}
                        </span>
                      </div>

                      {/* First 9 Average */}
                      <div className="grid grid-cols-3 items-center py-1 border-b border-neutral-800/60">
                        <span className="text-left text-neutral-200">
                          {leg.playerFirstNineAvg || '-'}
                        </span>
                        <span className="text-center text-neutral-400 text-[11px] font-sans">
                          First 9 Avg
                        </span>
                        <span className="text-right text-neutral-200">
                          {!isSolo ? leg.botFirstNineAvg || '-' : '-'}
                        </span>
                      </div>

                      {/* Darts Thrown */}
                      <div className="grid grid-cols-3 items-center py-1 border-b border-neutral-800/60">
                        <span className={`text-left font-bold ${isPlayerWin ? 'text-emerald-400' : 'text-neutral-200'}`}>
                          {leg.playerDarts} darts
                        </span>
                        <span className="text-center text-neutral-400 text-[11px] font-sans">
                          Darts Thrown
                        </span>
                        <span className={`text-right font-bold ${!isPlayerWin && !isSolo ? 'text-rose-400' : 'text-neutral-200'}`}>
                          {!isSolo ? `${leg.botDarts} darts` : '-'}
                        </span>
                      </div>

                      {/* Highest Visit */}
                      <div className="grid grid-cols-3 items-center py-1 border-b border-neutral-800/60">
                        <span className="text-left text-amber-400 font-bold">
                          {leg.playerHighestVisit || '-'}
                        </span>
                        <span className="text-center text-neutral-400 text-[11px] font-sans">
                          High Visit
                        </span>
                        <span className="text-right text-amber-400 font-bold">
                          {!isSolo ? leg.botHighestVisit || '-' : '-'}
                        </span>
                      </div>

                      {/* Checkout Score */}
                      <div className="grid grid-cols-3 items-center py-1 border-b border-neutral-800/60">
                        <span className="text-left text-cyan-400 font-bold">
                          {leg.playerCheckout ? `${leg.playerCheckout} Out` : `Left ${leg.playerScoreRemaining}`}
                        </span>
                        <span className="text-center text-neutral-400 text-[11px] font-sans">
                          Checkout / Left
                        </span>
                        <span className="text-right text-cyan-400 font-bold">
                          {!isSolo
                            ? leg.botCheckout
                              ? `${leg.botCheckout} Out`
                              : `Left ${leg.botScoreRemaining}`
                            : '-'}
                        </span>
                      </div>

                      {/* Darts at Double */}
                      <div className="grid grid-cols-3 items-center py-1">
                        <span className="text-left text-neutral-300">
                          {leg.playerDoublesHit}/{leg.playerDartsAtDouble} (
                          {leg.playerDartsAtDouble > 0
                            ? `${Math.round((leg.playerDoublesHit / leg.playerDartsAtDouble) * 100)}%`
                            : '0%'}
                          )
                        </span>
                        <span className="text-center text-neutral-400 text-[11px] font-sans">
                          Darts at Double
                        </span>
                        <span className="text-right text-neutral-300">
                          {!isSolo
                            ? `${leg.botDoublesHit}/${leg.botDartsAtDouble} (${
                                leg.botDartsAtDouble > 0
                                  ? `${Math.round((leg.botDoublesHit / leg.botDartsAtDouble) * 100)}%`
                                  : '0%'
                              })`
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Turn-by-Turn Visit Ledger */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Visit-by-Visit Throw Ledger</span>
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {leg.turns.length} Visits
                      </span>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 bg-neutral-850/90 text-[11px] font-bold text-neutral-400 py-2 px-3 border-b border-neutral-800">
                        <div className="col-span-2 text-center text-neutral-500 font-mono">
                          Round
                        </div>
                        <div className="col-span-5 text-left text-emerald-400 pl-2">
                          You (Score → Left)
                        </div>
                        <div className="col-span-5 text-right text-rose-400 pr-2">
                          {!isSolo ? `${botLevelLabel} (Score → Left)` : ''}
                        </div>
                      </div>

                      {/* Turns Rows */}
                      <div className="divide-y divide-neutral-800/60 font-mono text-xs">
                        {leg.turns.map((turn) => {
                          const p = turn.player;
                          const b = turn.bot;

                          return (
                            <div
                              key={turn.turnNumber}
                              className="grid grid-cols-12 items-center py-2 px-3 hover:bg-neutral-850/40 transition-colors"
                            >
                              {/* Round # */}
                              <div className="col-span-2 text-center text-neutral-500 font-bold text-[11px]">
                                V{turn.turnNumber}
                              </div>

                              {/* Player Visit */}
                              <div className="col-span-5 text-left pl-2">
                                {p ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`px-2 py-0.5 rounded-md font-bold text-xs ${getScoreBadgeColor(
                                        p.pointsScored,
                                        p.isBust
                                      )}`}
                                    >
                                      {p.isBust ? 'BUST' : `+${p.pointsScored}`}
                                    </span>
                                    <span className="text-neutral-400 text-[11px]">
                                      ({p.endScore})
                                    </span>
                                    {p.isCheckout && (
                                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/90 px-1.5 py-0.5 rounded-md border border-emerald-700/60">
                                        🎯 CHECKOUT
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-neutral-600 text-[11px]">-</span>
                                )}
                              </div>

                              {/* Bot Visit */}
                              <div className="col-span-5 text-right pr-2">
                                {!isSolo && (
                                  <>
                                    {b ? (
                                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                        {b.isCheckout && (
                                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/90 px-1.5 py-0.5 rounded-md border border-rose-700/60">
                                            👑 CHECKOUT
                                          </span>
                                        )}
                                        <span className="text-neutral-400 text-[11px]">
                                          ({b.endScore})
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 rounded-md font-bold text-xs ${getScoreBadgeColor(
                                            b.pointsScored,
                                            b.isBust
                                          )}`}
                                        >
                                          {b.isBust ? 'BUST' : `+${b.pointsScored}`}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-neutral-600 text-[11px]">-</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
