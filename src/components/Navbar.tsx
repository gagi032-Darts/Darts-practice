import React, { useState } from 'react';
import { Target, Calendar, BarChart2, Volume2, VolumeX, Sparkles, Sun, Vibrate, VibrateOff, BookOpen, Cloud } from 'lucide-react';
import { sound } from '../utils/sound';
import { wakeLock } from '../utils/wakeLock';
import { UserAccount } from '../types';
import { PlayerAvatar } from './common/PlayerAvatar';

interface NavbarProps {
  onGoHome: () => void;
  onOpenDaily: () => void;
  onOpenHistory: () => void;
  onOpenCheckoutAi: () => void;
  onOpenGuide: () => void;
  onOpenAccounts: () => void;
  activeAccount: UserAccount;
  isGameActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onGoHome,
  onOpenDaily,
  onOpenHistory,
  onOpenCheckoutAi,
  onOpenGuide,
  onOpenAccounts,
  activeAccount,
  isGameActive = false,
}) => {
  const [soundOn, setSoundOn] = useState<boolean>(sound.isEnabled());
  const [hapticsOn, setHapticsOn] = useState<boolean>(sound.isHapticsEnabled());
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(wakeLock.isEnabled());

  const handleToggleSound = () => {
    const next = sound.toggle();
    setSoundOn(next);
  };

  const handleToggleHaptics = () => {
    const next = sound.toggleHaptics();
    setHapticsOn(next);
  };

  const handleToggleWakeLock = () => {
    const next = wakeLock.toggle();
    setWakeLockActive(next);
  };

  return (
    <header className="w-full bg-neutral-950 border-b border-neutral-800/80 px-3 sm:px-4 py-2.5 sm:py-3 sticky top-0 z-20">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <button
          type="button"
          id="nav-brand-btn"
          onClick={onGoHome}
          className="flex items-center gap-2 sm:gap-2.5 text-left group shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-neutral-950 font-black shadow-md group-hover:scale-105 transition-transform">
            <Target className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-black text-base sm:text-lg text-white tracking-tight leading-none">
            Dart Practice
          </span>
        </button>

        {/* Right Info & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Account / Profile Badge */}
          <button
            type="button"
            id="nav-account-btn"
            onClick={() => {
              sound.tap();
              onOpenAccounts();
            }}
            title={`Active Account: ${activeAccount.name} (${activeAccount.email || 'Local Profile'}) - Tap to switch`}
            className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-neutral-200 border border-neutral-750 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs max-w-[130px] sm:max-w-[170px]"
          >
            <PlayerAvatar
              photoUrl={activeAccount.photoUrl}
              avatarEmoji={activeAccount.avatarEmoji}
              name={activeAccount.name}
              size="xs"
            />
            <span className="truncate text-[11px] sm:text-xs font-bold text-white leading-none">
              {activeAccount.name}
            </span>
            {activeAccount.isCloudUser && (
              <Cloud className="w-3 h-3 text-cyan-400 shrink-0" />
            )}
          </button>

          {/* Outshot AI Helper Button */}
          <button
            type="button"
            id="nav-checkout-ai-btn"
            onClick={() => {
              sound.tap();
              onOpenCheckoutAi();
            }}
            title="Outshot AI Guide (170 down to 2)"
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 active:scale-95 text-emerald-300 hover:text-emerald-100 border border-emerald-800/80 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="inline font-mono">170-2 AI</span>
          </button>

          {/* Practice Routine & Guide Button */}
          <button
            type="button"
            id="nav-guide-btn"
            onClick={() => {
              sound.tap();
              onOpenGuide();
            }}
            title="2-Hour Darts Practice Routine Guide & Tutorial"
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 active:scale-95 text-neutral-200 hover:text-white border border-neutral-750 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">Guide</span>
          </button>

          {!isGameActive && (
            <>
              <button
                type="button"
                id="nav-daily-btn"
                onClick={onOpenDaily}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-bold hidden md:flex items-center gap-1.5 transition-all"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Daily</span>
              </button>

              <button
                type="button"
                id="nav-history-btn"
                onClick={onOpenHistory}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-bold hidden md:flex items-center gap-1.5 transition-all"
              >
                <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Stats</span>
              </button>
            </>
          )}

          {/* Android Oche Screen Wake Lock */}
          {wakeLock.getSupported() && (
            <button
              type="button"
              id="nav-wakelock-btn"
              onClick={handleToggleWakeLock}
              title={wakeLockActive ? 'Screen Awake: ON (Display stays awake at oche)' : 'Screen Awake: OFF'}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                wakeLockActive
                  ? 'bg-amber-950/70 border-amber-700/80 text-amber-300 shadow-xs'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Sun className={`w-4 h-4 ${wakeLockActive ? 'text-amber-400' : 'text-neutral-500'}`} />
            </button>
          )}

          {/* Android Haptic Vibration Toggle */}
          <button
            type="button"
            id="nav-haptics-btn"
            onClick={handleToggleHaptics}
            title={hapticsOn ? 'Android Haptics: ON' : 'Android Haptics: OFF'}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              hapticsOn
                ? 'bg-neutral-900 border-neutral-800 text-teal-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-600'
            }`}
          >
            {hapticsOn ? (
              <Vibrate className="w-4 h-4 text-teal-400" />
            ) : (
              <VibrateOff className="w-4 h-4 text-neutral-600" />
            )}
          </button>

          {/* Audio Sound Toggle */}
          <button
            type="button"
            id="nav-sound-btn"
            onClick={handleToggleSound}
            title={soundOn ? 'Sound: ON' : 'Sound: OFF'}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-neutral-400 hover:text-white border border-neutral-800 transition-all"
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

