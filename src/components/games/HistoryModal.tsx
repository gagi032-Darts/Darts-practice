import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Trash2,
  Download,
  Upload,
  Calendar,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ListFilter,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { SessionHistoryItem, GameType } from '../../types';
import { storage } from '../../utils/storage';
import { GAME_DEFINITIONS } from '../../utils/gamesData';
import { sound } from '../../utils/sound';
import { AdvancedSessionBreakdown } from '../common/AdvancedSessionBreakdown';

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
  const [allExpanded, setAllExpanded] = useState<boolean>(true); // Default to detailed view per user request

  useEffect(() => {
    const data = storage.getHistory();
    setHistory(data);
    // Initialize all sessions as expanded by default so user immediately gets advanced stats
    const initialMap: Record<string, boolean> = {};
    data.forEach((item) => {
      initialMap[item.id] = true;
    });
    setExpandedSessions(initialMap);
  }, []);

  const toggleSessionExpand = (id: string) => {
    sound.tap();
    setExpandedSessions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAllExpanded = () => {
    sound.tap();
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const map: Record<string, boolean> = {};
    history.forEach((h) => {
      map[h.id] = nextState;
    });
    setExpandedSessions(map);
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
        const fresh = storage.getHistory();
        setHistory(fresh);
        const map: Record<string, boolean> = {};
        fresh.forEach((h) => {
          map[h.id] = true;
        });
        setExpandedSessions(map);
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
            <span>Drill History & Advanced Stats</span>
          </h1>
          <span className="text-xs text-neutral-400 font-medium">
            Profile: <b className="text-emerald-400 font-bold">{storage.getActiveAccount().name}</b>
          </span>
        </div>

        {/* Data Tools: Export / Import & View Mode Toggle */}
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              type="button"
              onClick={toggleAllExpanded}
              title="Toggle Detailed / Compact Breakdown"
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {allExpanded ? 'Collapse All' : 'Expand All Stats'}
              </span>
            </button>
          )}

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
        <div className="space-y-3">
          {filteredHistory.map((item) => {
            const isExpanded = expandedSessions[item.id] ?? false;
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
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700/90 rounded-2xl p-4 transition-all shadow-md"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                      {item.gameTitle}
                    </span>
                    <span className="text-xs text-neutral-500 font-medium">{dateStr}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSessionExpand(item.id)}
                      className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl transition-all ${
                        isExpanded
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isExpanded ? 'Hide Breakdown' : 'Advanced Stats'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                      )}
                    </button>

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

                {/* Expanded Detailed Breakdown View */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3.5 border-t border-neutral-800/80">
                    <AdvancedSessionBreakdown
                      gameType={item.gameType}
                      result={item.result}
                      dateStr={dateStr}
                    />
                  </div>
                )}
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
