import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Plus, TrendingUp, Flame, Check, BarChart2 } from 'lucide-react';
import { DailyDartRecord } from '../../types';
import { storage } from '../../utils/storage';
import { sound } from '../../utils/sound';

interface DailyCountModalProps {
  onClose: () => void;
}

export const DailyCountModal: React.FC<DailyCountModalProps> = ({ onClose }) => {
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyDartRecord>>({});
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [inputCount, setInputCount] = useState<string>('');
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  useEffect(() => {
    setDailyRecords(storage.getDailyRecords());
  }, []);

  const currentDayCount = dailyRecords[selectedDate]?.count || 0;

  const handleSaveCount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const count = parseInt(inputCount, 10);
    if (isNaN(count) || count < 0) return;

    sound.hit();
    storage.saveDailyCount(selectedDate, count);
    setDailyRecords(storage.getDailyRecords());
    setInputCount('');
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleQuickAdd = (delta: number) => {
    sound.hit();
    storage.addDailyCount(selectedDate, delta);
    setDailyRecords(storage.getDailyRecords());
  };

  // Stats calculation
  const datesSorted = Object.keys(dailyRecords).sort().reverse();
  const totalVolume = datesSorted.reduce((sum, d) => sum + (dailyRecords[d]?.count || 0), 0);
  const activeDaysCount = datesSorted.filter((d) => (dailyRecords[d]?.count || 0) > 0).length;
  const averagePerDay = activeDaysCount > 0 ? Math.round(totalVolume / activeDaysCount) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <button
          type="button"
          id="daily-back-btn"
          onClick={onClose}
          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white border border-neutral-700/60 transition-all flex items-center gap-1.5 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="text-center sm:text-right">
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center sm:justify-end gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>Daily Dart Volume</span>
          </h1>
          <span className="text-xs text-neutral-400 font-medium">
            Profile: <b className="text-emerald-400 font-bold">{storage.getActiveAccount().name}</b>
          </span>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 text-center">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Total Darts Thrown
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 mt-1 block">
            {totalVolume.toLocaleString()}
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 text-center">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Active Practice Days
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-black text-cyan-400 mt-1 block">
            {activeDaysCount}
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 text-center">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Daily Average
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 mt-1 block">
            {averagePerDay.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Log Today / Selected Date Entry Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-neutral-800 text-white text-sm font-semibold rounded-lg px-2.5 py-1 border border-neutral-700"
            />
          </div>
          <span className="text-xs text-neutral-400 font-medium">
            Current: <b className="text-emerald-400 font-mono text-base">{currentDayCount}</b> darts
          </span>
        </div>

        {/* Quick Add Increments */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
            Quick Add Throws:
          </span>
          <div className="grid grid-cols-4 gap-2">
            {[30, 60, 99, 150].map((num) => (
              <button
                key={num}
                type="button"
                id={`daily-add-${num}`}
                onClick={() => handleQuickAdd(num)}
                className="h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-bold text-sm border border-neutral-700 flex items-center justify-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>+{num}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Total Input Form */}
        <form onSubmit={handleSaveCount} className="space-y-2 pt-2 border-t border-neutral-800">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
            Or Set Exact Count for Date:
          </span>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              placeholder={`e.g. ${currentDayCount || 100}`}
              value={inputCount}
              onChange={(e) => setInputCount(e.target.value)}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white font-mono text-lg font-bold text-center outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              id="daily-save-btn"
              disabled={inputCount.trim() === ''}
              className="px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm flex items-center gap-1.5 transition-all"
            >
              {savedFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Set Count</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* History Log Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-400" />
          <span>Volume Log by Date</span>
        </h2>

        {datesSorted.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-4">No daily entries logged yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {datesSorted.map((d) => {
              const count = dailyRecords[d]?.count || 0;
              const isToday = d === todayStr;
              return (
                <div
                  key={d}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/40 text-xs font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white">{d}</span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] border border-emerald-800/60">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-emerald-400 text-sm font-bold">
                    {count.toLocaleString()} darts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
