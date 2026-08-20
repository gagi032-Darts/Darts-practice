import React, { useState } from 'react';
import { ArrowLeft, Pause, Play, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { sound } from '../../utils/sound';

interface TimerHeaderProps {
  title: string;
  categoryLabel?: string;
  timeDisplay: string;
  isCountUp?: boolean;
  isFinalInput?: boolean;
  isPaused: boolean;
  onTogglePause?: () => void;
  onExitRequest: () => void;
  percentRemaining?: number;
}

export const TimerHeader: React.FC<TimerHeaderProps> = ({
  title,
  categoryLabel,
  timeDisplay,
  isCountUp = false,
  isFinalInput = false,
  isPaused,
  onTogglePause,
  onExitRequest,
  percentRemaining = 100,
}) => {
  const [soundOn, setSoundOn] = useState(sound.isEnabled());

  const handleToggleSound = () => {
    const newState = sound.toggle();
    setSoundOn(newState);
  };

  return (
    <div className="w-full bg-neutral-900 border-b border-neutral-800 px-3 py-1.5 sm:px-4 sm:py-2 sticky top-0 z-30 shadow-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Back / Exit & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            id="timer-exit-btn"
            onClick={onExitRequest}
            className="p-1.5 sm:p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white border border-neutral-700/60 transition-all flex items-center gap-1.5 text-xs sm:text-sm font-semibold shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Exit Drill</span>
          </button>
          <div className="min-w-0 truncate">
            {categoryLabel && (
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-emerald-400 block leading-none">
                {categoryLabel}
              </span>
            )}
            <h1 className="text-xs sm:text-base font-bold text-white truncate leading-snug">
              {title}
            </h1>
          </div>
        </div>

        {/* Right: Sound toggle, Pause/Play, Timer display */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            id="timer-sound-btn"
            onClick={handleToggleSound}
            title={soundOn ? 'Mute Sound FX' : 'Enable Sound FX'}
            className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 active:scale-95 text-neutral-400 hover:text-white border border-neutral-700/60 transition-all"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>

          {onTogglePause && !isFinalInput && (
            <button
              type="button"
              id="timer-pause-btn"
              onClick={onTogglePause}
              title={isPaused ? 'Resume Timer' : 'Pause Timer'}
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white border border-neutral-700/60 transition-all"
            >
              {isPaused ? <Play className="w-4 h-4 text-amber-400 fill-amber-400" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          {/* Large Timer Display */}
          <div className="flex flex-col items-end">
            <div
              className={`font-mono text-2xl sm:text-3xl font-black tracking-wider leading-none ${
                isFinalInput
                  ? 'text-amber-400 animate-pulse'
                  : isPaused
                  ? 'text-neutral-500'
                  : isCountUp
                  ? 'text-cyan-400'
                  : percentRemaining <= 10
                  ? 'text-rose-400'
                  : 'text-white'
              }`}
            >
              {timeDisplay}
            </div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 mt-0.5">
              {isFinalInput ? (
                <span className="text-amber-400 flex items-center gap-1 font-extrabold">
                  <AlertTriangle className="w-3 h-3" /> FINAL INPUT
                </span>
              ) : isPaused ? (
                <span className="text-amber-400">PAUSED</span>
              ) : isCountUp ? (
                'COUNT UP'
              ) : (
                'COUNTDOWN'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Progress Line */}
      {!isCountUp && !isFinalInput && (
        <div className="w-full bg-neutral-800 h-1 mt-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              percentRemaining <= 10 ? 'bg-rose-500' : percentRemaining <= 30 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, percentRemaining))}%` }}
          />
        </div>
      )}
    </div>
  );
};
