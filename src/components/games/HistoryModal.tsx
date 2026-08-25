import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Download, Upload, Filter, Calendar, Award, RotateCcw, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { SessionHistoryItem, GameType } from '../../types';
import { storage } from '../../utils/storage';
import { GAME_DEFINITIONS } from '../../utils/gamesData';
import { sound } from '../../utils/sound';
import { LegBreakdownView } from '../common/LegBreakdownView';

interface HistoryModalProps {
  onClose: () => void;
  defaultFilter?: GameType | 'all';
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  onClose,
  defaultFilter = 'all',
}) => {
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [filter, setFilter] = useState<GameType | 'all'>(defaultFilter);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setHistory(storage.getHistory());
  }, []);

  const toggleSessionExpand = (id: string) => {
    sound.tap();
    setExpandedSessions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteSession = (id: string) => {
    sound.tap();
    storage.deleteSession(id);
    setHistory(storage.getHistory());
  };

  const handleClearAll = () => {
    sound.tap();
    storage.clearAllHistory();
    setHistory([]);
    setConfirmClear(false);
  };

  const handleExport = () => {
    sound.tap();
    const jsonStr = storage.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `darts_practice_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Backup file downloaded successfully!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && storage.importBackupJSON(content)) {
        setHistory(storage.getHistory());
        setStatusMessage('Backup restored successfully!');
        sound.lock();
      } else {
        setStatusMessage('Failed to parse backup JSON file.');
      }
      setTimeout(() => setStatusMessage(null), 3000);
    };
    reader.readAsText(file);
  };

  const filteredHistory =
    filter === 'all' ? history : history.filter((item) => item.gameType === filter);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <button
          type="button"
          id="history-back-btn"
          onClick={onClose}
          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white border border-neutral-700/60 transition-all flex items-center gap-1.5 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="text-center sm:text-left">
          <h1 className="text-lg sm:text-xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
            <span>Drill History & Records</span>
          </h1>
          <span className="text-xs text-neutral-400 font-medium">
            Profile: <b className="text-emerald-400 font-bold">{storage.getActiveAccount().name}</b>
          </span>
        </div>

        {/* Data Tools: Export / Import */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="history-export-btn"
            onClick={handleExport}
            title="Export JSON Backup"
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <label
            title="Import JSON Backup"
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-bold text-center">
          {statusMessage}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            filter === 'all'
              ? 'bg-emerald-500 text-neutral-950 shadow-sm'
              : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700'
          }`}
        >
          All Drills ({history.length})
        </button>

        {Object.entries(GAME_DEFINITIONS).map(([id, def]) => {
          const count = history.filter((h) => h.gameType === id).length;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id as GameType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                filter === id
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700'
              }`}
            >
              {def.title} ({count})
            </button>
          );
        })}
      </div>

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500">
          <Calendar className="w-10 h-10 mx-auto mb-2 text-neutral-600" />
          <p className="text-sm font-semibold text-neutral-400">No saved sessions found.</p>
          <p className="text-xs text-neutral-600 mt-1">
            Complete a practice drill to save your performance statistics here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredHistory.map((item) => {
            const dateStr = new Date(item.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                        {item.gameTitle}
                      </span>
                      <span className="text-xs text-neutral-500 font-medium">{dateStr}</span>
                    </div>

                    {/* Formatted stats summary chips */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.gameType === 'dartbot' ? (
                        (() => {
                          const botRes = item.result as any;
                          const won = botRes.winner === 'player';
                          return (
                            <>
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  won
                                    ? 'bg-emerald-950/90 border border-emerald-700/80 text-emerald-300'
                                    : 'bg-rose-950/90 border border-rose-700/80 text-rose-300'
                                }`}
                              >
                                {won ? 'Won' : 'Lost'} {botRes.playerLegs}–{botRes.botLegs} vs {botRes.botLevelLabel}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Your Avg:</span>
                                <b className="text-emerald-400 font-mono">{botRes.playerStats?.threeDartAvg ?? '-'}</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Bot Avg:</span>
                                <b className="text-rose-400 font-mono">{botRes.botStats?.threeDartAvg ?? '-'}</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Checkout %:</span>
                                <b className="text-cyan-400 font-mono">{botRes.playerStats?.doublePercentage ?? 0}%</b>
                              </span>
                              {botRes.playerStats?.highestCheckout > 0 && (
                                <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                  <span className="text-neutral-500 mr-1">High Out:</span>
                                  <b className="text-amber-400 font-mono">{botRes.playerStats.highestCheckout}</b>
                                </span>
                              )}
                              {botRes.playerStats?.bestLegDarts && (
                                <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                  <span className="text-neutral-500 mr-1">Best Leg:</span>
                                  <b className="text-white font-mono">{botRes.playerStats.bestLegDarts} darts</b>
                                </span>
                              )}
                            </>
                          );
                        })()
                      ) : item.gameType === 'triple' ? (
                        (() => {
                          const tripRes = item.result as any;
                          const isCompleted = tripRes.completed;
                          return (
                            <>
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  isCompleted
                                    ? 'bg-emerald-950/90 border border-emerald-700/80 text-emerald-300'
                                    : 'bg-cyan-950/90 border border-cyan-700/80 text-cyan-300'
                                }`}
                              >
                                {isCompleted ? `🎯 Completed (${tripRes.completionTime || 'Finished'})` : '⏱️ 20m Expired'}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Locked:</span>
                                <b className="text-emerald-400 font-mono">{tripRes.lockedThrough ?? 'None'}</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Progress:</span>
                                <b className="text-white font-mono">{tripRes.stagesCompleted ? `${tripRes.stagesCompleted}/21 stages` : tripRes.targetReached}</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Resets:</span>
                                <b className="text-rose-400 font-mono">{tripRes.resets}</b>
                              </span>
                              {tripRes.dartsThrown > 0 && (
                                <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                  <span className="text-neutral-500 mr-1">Darts:</span>
                                  <b className="text-white font-mono">{tripRes.dartsThrown}</b>
                                </span>
                              )}
                            </>
                          );
                        })()
                      ) : item.gameType === 'switchblade' ? (
                        (() => {
                          const sbRes = item.result as any;
                          return (
                            <>
                              <span className="px-2.5 py-1 rounded-lg bg-rose-950/90 border border-rose-700/80 text-rose-300 text-xs font-bold font-mono">
                                {sbRes.totalPoints?.toLocaleString()} pts
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Avg/Throw:</span>
                                <b className="text-emerald-400 font-mono">{sbRes.averageScorePerVisit}</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Rounds:</span>
                                <b className="text-amber-400 font-mono">{sbRes.cyclesCompleted}</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Darts:</span>
                                <b className="text-white font-mono">{sbRes.darts}</b>
                              </span>
                            </>
                          );
                        })()
                      ) : item.gameType === 'powerswitch' ? (
                        (() => {
                          const psRes = item.result as any;
                          return (
                            <>
                              <span className="px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-700/80 text-amber-300 text-xs font-bold font-mono">
                                {psRes.totalPoints?.toLocaleString()} pts
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Avg/Visit:</span>
                                <b className="text-emerald-400 font-mono">{psRes.pointsPerVisitAvg}</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Treble %:</span>
                                <b className="text-cyan-400 font-mono">{psRes.trebleRate}%</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Visits:</span>
                                <b className="text-white font-mono">{psRes.visits}</b>
                              </span>
                            </>
                          );
                        })()
                      ) : item.gameType === 'bigscores' ? (
                        (() => {
                          const bsRes = item.result as any;
                          return (
                            <>
                              <span className="px-2.5 py-1 rounded-lg bg-violet-950/90 border border-violet-700/80 text-violet-300 text-xs font-bold font-mono">
                                {bsRes.totalPoints?.toLocaleString()} pts
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Avg/Visit:</span>
                                <b className="text-emerald-400 font-mono">{bsRes.averageScorePerVisit}</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">3-Dart:</span>
                                <b className="text-cyan-400 font-mono">{bsRes.threeDartAvg}</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Rounds:</span>
                                <b className="text-amber-400 font-mono">{bsRes.cyclesCompleted}</b>
                              </span>
                            </>
                          );
                        })()
                      ) : item.gameType === 'cochallenge' ? (
                        (() => {
                          const coRes = item.result as any;
                          return (
                            <>
                              <span className="px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-700/80 text-amber-300 text-xs font-bold font-mono">
                                High Out: {coRes.highestCheckout > 0 ? coRes.highestCheckout : '—'}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Checkouts:</span>
                                <b className="text-cyan-400 font-mono">{coRes.checkoutsMade} / {coRes.attempts}</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Rate:</span>
                                <b className="text-emerald-400 font-mono">{coRes.checkoutRate}%</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Best Streak:</span>
                                <b className="text-amber-400 font-mono">{coRes.bestStreak || 0} 🔥</b>
                              </span>
                            </>
                          );
                        })()
                      ) : item.gameType === 'boomerang' ? (
                        (() => {
                          const boomRes = item.result as any;
                          return (
                            <>
                              <span className="px-2.5 py-1 rounded-lg bg-sky-950/90 border border-sky-700/80 text-sky-300 text-xs font-bold font-mono">
                                Rounds: {boomRes.roundsCompleted || 0}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-700/80 text-amber-300 text-xs font-bold font-mono">
                                Best: {boomRes.bestRoundDarts ? `${boomRes.bestRoundDarts}d` : '—'}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Hits:</span>
                                <b className="text-emerald-400 font-mono">{boomRes.totalHits} / {boomRes.totalDarts}</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Accuracy:</span>
                                <b className="text-emerald-400 font-mono">{boomRes.overallAccuracy}%</b>
                              </span>
                            </>
                          );
                        })()
                      ) : item.gameType === 'a1practice' ? (
                        (() => {
                          const a1Res = item.result as any;
                          return (
                            <>
                              <span className="px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-700/80 text-amber-300 text-xs font-bold font-mono">
                                Cleared: {a1Res.targetsCleared || 0} / 9
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Visits:</span>
                                <b className="text-white font-mono">{a1Res.successfulVisits} / {a1Res.totalVisits} ({a1Res.totalDarts}d)</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Accuracy:</span>
                                <b className="text-emerald-400 font-mono">{a1Res.accuracy}%</b>
                              </span>
                            </>
                          );
                        })()
                      ) : item.gameType === 'bigsingles' ? (
                        (() => {
                          const bsRes = item.result as any;
                          return (
                            <>
                              <span className="px-2 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-700/80 text-cyan-300 text-xs font-bold uppercase">
                                {bsRes.level || 'Intermediate'}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Progress:</span>
                                <b className="text-white font-mono">{bsRes.completedRounds > 0 ? `${bsRes.completedRounds} rnds + #${bsRes.currentNumberReached}` : `Reached #${bsRes.highestNumberReached || bsRes.currentNumberReached || 1}`}</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Darts:</span>
                                <b className="text-cyan-300 font-mono">{bsRes.totalDarts || 0} ({bsRes.totalDartHits || 0} hits)</b>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300">
                                <span className="text-neutral-500 mr-1">Accuracy:</span>
                                <b className="text-emerald-400 font-mono">{bsRes.dartHitAccuracy || 0}%</b>
                              </span>
                            </>
                          );
                        })()
                      ) : (
                        Object.entries(item.result)
                          .filter(([k, v]) => k !== 'distribution' && !Array.isArray(v) && v !== null && v !== undefined)
                          .map(([k, v]) => {
                            const label = k
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, (str) => str.toUpperCase());
                            let valStr = String(v);
                            if (k === 'accuracy' || k === 'bullRate' || k === 'checkoutRate' || k === 'doublePercentage') {
                              valStr = `${v}%`;
                            }
                            return (
                              <span
                                key={k}
                                className="px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700/50 text-xs font-medium text-neutral-300"
                              >
                                <span className="text-neutral-500 mr-1">{label}:</span>
                                <b className="text-white font-mono">{valStr}</b>
                              </span>
                            );
                          })
                      )}
                    </div>

                    {/* Expandable Leg Breakdown for DartBot Matches */}
                    {item.gameType === 'dartbot' && (() => {
                      const botRes = item.result as any;
                      const hasLegs = botRes.legs && Array.isArray(botRes.legs) && botRes.legs.length > 0;
                      const isExpanded = !!expandedSessions[item.id];
                      const isSolo = botRes.botLevelLabel === 'Solo Practice' || botRes.botLegs === undefined || botRes.botStats?.totalDarts === 0;

                      if (!hasLegs) return null;

                      return (
                        <div className="mt-3.5">
                          <button
                            type="button"
                            onClick={() => toggleSessionExpand(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-750 text-xs font-bold text-emerald-400 hover:text-emerald-300 border border-neutral-700/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>
                              {isExpanded
                                ? 'Hide Leg Breakdown'
                                : `View Leg Breakdown (${botRes.legs.length} Leg${botRes.legs.length > 1 ? 's' : ''})`}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-neutral-800">
                              <LegBreakdownView
                                legs={botRes.legs}
                                botLevelLabel={botRes.botLevelLabel}
                                isSolo={isSolo}
                                defaultExpanded={false}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Delete individual session */}
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(item.id)}
                    title="Delete Session"
                    className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear All Data Footer */}
      {history.length > 0 && (
        <div className="pt-4 border-t border-neutral-800 flex justify-end">
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400 font-semibold">Delete all records?</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
              >
                Yes, Delete All
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="text-xs text-neutral-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
