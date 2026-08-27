import React, { useState, useEffect } from 'react';
import {
  Target,
  Flame,
  Activity,
  Crosshair,
  Lock,
  Bot,
  Calendar,
  BarChart3,
  Volume2,
  VolumeX,
  Clock,
  Play,
  Sun,
  Vibrate,
  VibrateOff,
  Users,
  Sparkles,
  Keyboard,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GameType, UserAccount } from '../types';
import { storage } from '../utils/storage';
import { sound } from '../utils/sound';
import { wakeLock } from '../utils/wakeLock';
import { PlayerAvatar } from './common/PlayerAvatar';
import { GameInstructionModal } from './common/GameInstructionModal';

interface HomeScreenProps {
  onSelectGame: (type: GameType) => void;
  onOpenDaily: () => void;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
  onOpenAccounts: () => void;
  onOpenCheckoutAi?: () => void;
  activeAccount: UserAccount;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectGame,
  onOpenDaily,
  onOpenHistory,
  onOpenGuide,
  onOpenAccounts,
  onOpenCheckoutAi,
  activeAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'routine' | 'keypad' | 'features'>('routine');
  const [soundOn, setSoundOn] = useState<boolean>(sound.isEnabled());
  const [hapticsOn, setHapticsOn] = useState<boolean>(sound.isHapticsEnabled());
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(wakeLock.isEnabled());
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [todayVolume, setTodayVolume] = useState<number>(0);
  const [instructionGame, setInstructionGame] = useState<GameType | null>(null);
  const [openDropdown, setOpenDropdown] = useState<
    'warmup' | 'scoring' | 'finishing' | 'singles' | 'match' | null
  >(null);
  const [openSubmenu, setOpenSubmenu] = useState<'121' | 'rtwsingles' | 'bigsingles' | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-container]')) {
        setOpenDropdown(null);
        setOpenSubmenu(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    const history = storage.getHistory();
    setHistoryCount(history.length);

    const todayStr = new Date().toISOString().slice(0, 10);
    const dailyRecords = storage.getDailyRecords();
    setTodayVolume(dailyRecords[todayStr]?.count || 0);
  }, [activeAccount]);

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

  const handleStartGame = (gameId: GameType) => {
    sound.tap();
    setInstructionGame(gameId);
  };

  const handleConfirmStart = (gameId: GameType) => {
    setInstructionGame(null);
    onSelectGame(gameId);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 sm:space-y-3.5">
      {/* Top Utility & Profile Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-emerald-950/40 shrink-0">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-white tracking-tight leading-none">
                Dart Practice Hub
              </h1>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Structured 2-hour routine, drill mechanics & precision tracking
              </p>
            </div>
          </div>

          {/* Quick Access Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-between sm:justify-end">
            {/* Account Card Button */}
            <button
              type="button"
              id="home-account-btn"
              onClick={() => {
                sound.tap();
                onOpenAccounts();
              }}
              title="Switch Player Profile / Cloud Accounts"
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 active:scale-95 text-white border border-neutral-750 shadow-xs flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
            >
              <PlayerAvatar
                photoUrl={activeAccount.photoUrl}
                avatarEmoji={activeAccount.avatarEmoji}
                name={activeAccount.name}
                size="xs"
              />
              <div className="text-left leading-none">
                <span className="text-[9px] sm:text-[10px] text-neutral-400 block font-semibold">
                  {activeAccount.isCloudUser ? 'Cloud' : 'Profile'}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-white max-w-[80px] sm:max-w-[90px] truncate block mt-0.5">
                  {activeAccount.name}
                </span>
              </div>
            </button>

            {/* Daily Volume */}
            <button
              type="button"
              id="home-daily-btn"
              onClick={onOpenDaily}
              title="Daily Throw Count"
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 active:scale-95 text-white border border-neutral-750 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <div className="text-left leading-none">
                <span className="text-[9px] sm:text-[10px] text-neutral-400 block">Today</span>
                <span className="text-[11px] sm:text-xs font-mono font-black text-emerald-400 mt-0.5 block">
                  {todayVolume} <span className="text-[9px] sm:text-[10px] text-neutral-400 font-normal">darts</span>
                </span>
              </div>
            </button>

            {/* History Logs */}
            <button
              type="button"
              id="home-history-btn"
              onClick={onOpenHistory}
              title="Drill History & Records"
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 active:scale-95 text-white border border-neutral-750 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <div className="text-left leading-none">
                <span className="text-[9px] sm:text-[10px] text-neutral-400 block">History</span>
                <span className="text-[11px] sm:text-xs font-mono font-black text-cyan-400 mt-0.5 block">
                  {historyCount} <span className="text-[9px] sm:text-[10px] text-neutral-400 font-normal">logs</span>
                </span>
              </div>
            </button>

            {/* Keypad Guide Button (Moved Up) */}
            <button
              type="button"
              id="home-keypad-btn"
              onClick={() => {
                sound.tap();
                setActiveTab((prev) => (prev === 'keypad' ? 'routine' : 'keypad'));
              }}
              title="Keypad Scoring Guide"
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border active:scale-95 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'keypad'
                  ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                  : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-750 text-neutral-300 hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs font-bold hidden xs:inline">Keypad</span>
            </button>

            {/* Features & AI Button (Moved Up) */}
            <button
              type="button"
              id="home-features-btn"
              onClick={() => {
                sound.tap();
                setActiveTab((prev) => (prev === 'features' ? 'routine' : 'features'));
              }}
              title="Features & AI"
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border active:scale-95 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'features'
                  ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                  : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-750 text-neutral-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs font-bold hidden xs:inline">Features</span>
            </button>

            {/* Device Toggles */}
            <div className="flex items-center gap-1">
              {wakeLock.getSupported() && (
                <button
                  type="button"
                  id="home-wakelock-btn"
                  onClick={handleToggleWakeLock}
                  title={wakeLockActive ? 'Screen Awake: ON' : 'Screen Awake: OFF'}
                  className={`p-1.5 sm:p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    wakeLockActive
                      ? 'bg-amber-950/70 border-amber-700/80 text-amber-300'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Sun className={`w-3.5 h-3.5 ${wakeLockActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                </button>
              )}

              <button
                type="button"
                id="home-haptics-btn"
                onClick={handleToggleHaptics}
                title={hapticsOn ? 'Haptics: ON' : 'Haptics: OFF'}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  hapticsOn
                    ? 'bg-neutral-850 border-neutral-750 text-teal-400'
                    : 'bg-neutral-850 border-neutral-750 text-neutral-500'
                }`}
              >
                {hapticsOn ? (
                  <Vibrate className="w-3.5 h-3.5 text-teal-400" />
                ) : (
                  <VibrateOff className="w-3.5 h-3.5 text-neutral-500" />
                )}
              </button>

              <button
                type="button"
                id="home-sound-btn"
                onClick={handleToggleSound}
                title={soundOn ? 'Sound: ON' : 'Sound: OFF'}
                className="p-1.5 sm:p-2 rounded-xl bg-neutral-850 hover:bg-neutral-800 active:scale-95 text-neutral-300 hover:text-white border border-neutral-750 transition-all cursor-pointer"
              >
                {soundOn ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: 2-HOUR ROUTINE (PRIMARY MASTER GUIDE & LAUNCHER) */}
      {activeTab === 'routine' && (
        <div className="space-y-3 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-850 border border-neutral-800 rounded-2xl p-4 sm:p-4.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  2-Hour Darts Practice Routine
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Structured progression divided into 7 focused blocks: warm-up, scoring, checkout ladders, break, bull calibration, triple progression, and X01 match play.
                </p>
              </div>
              <div className="shrink-0 hidden sm:block text-right">
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-black">
                  120 min total
                </span>
              </div>
            </div>
          </div>

          {/* Routine Steps List with Rich Explanations & Direct Launch Buttons */}
          <div className="space-y-2.5">
            {/* Step 1: Warm Up */}
            <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl p-3.5 sm:p-4 hover:border-emerald-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/40 shrink-0">
                      1
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white whitespace-nowrap">
                      Warm Up — 20 min
                    </h3>
                    <span className="px-1.5 sm:px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-bold text-emerald-300 border border-neutral-700 whitespace-nowrap">
                      2 × 10 min (Choose 2)
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Choose 2 10 min warm-up games to establish arm alignment, release fluidity, and target focus.
                  </p>
                </div>

                <div className="relative shrink-0 pt-1 sm:pt-0" data-dropdown-container>
                  <button
                    type="button"
                    id="dropdown-warmup-btn"
                    onClick={() => setOpenDropdown((prev) => (prev === 'warmup' ? null : 'warmup'))}
                    className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl active:scale-95 text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                      openDropdown === 'warmup'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-500/40'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-white border-neutral-700 hover:border-emerald-500'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Games</span>
                    {openDropdown === 'warmup' ? (
                      <ChevronUp className="w-3.5 h-3.5 opacity-80" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    )}
                  </button>

                  {/* Falling Dropdown Menu */}
                  {openDropdown === 'warmup' && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-[#14181d] border border-[#2b3542] rounded-xl shadow-2xl p-1.5 z-40 animate-fadeIn space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-[#222933]">
                        Select Warm Up Game (10 min)
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('cal');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emerald-500/20 active:bg-emerald-500/30 text-xs text-white hover:text-emerald-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-emerald-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-emerald-400" /> Calibration
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            20 down to 1 + Bull, arm calibration & focus
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-emerald-400 border border-neutral-700">
                          10m
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('wheel');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-teal-500/20 active:bg-teal-500/30 text-xs text-white hover:text-teal-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-teal-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-teal-400" /> The Wheel
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Clockwise circular sweep around the board 1→20
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-teal-400 border border-neutral-700">
                          10m
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('align');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-cyan-500/20 active:bg-cyan-500/30 text-xs text-white hover:text-cyan-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-cyan-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-cyan-400" /> Align
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Vertical line alignment & grouping calibration
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-cyan-400 border border-neutral-700">
                          10m
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('bull');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-500/20 active:bg-rose-500/30 text-xs text-white hover:text-rose-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-rose-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-rose-400" /> Bull Warm Up
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Outer & inner bullseye focus & grouping
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-rose-400 border border-neutral-700">
                          10m
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Scoring */}
            <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl p-3.5 sm:p-4 hover:border-cyan-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-xs flex items-center justify-center border border-cyan-500/40 shrink-0">
                      2
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white whitespace-nowrap">
                      Scoring — 20 min
                    </h3>
                    <span className="px-1.5 sm:px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-bold text-cyan-300 border border-neutral-700 whitespace-nowrap">
                      2 × 10 min (Choose 2)
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Choose 2 10 min games to build heavy treble scoring and switch accuracy.
                  </p>
                </div>

                <div className="relative shrink-0 pt-1 sm:pt-0" data-dropdown-container>
                  <button
                    type="button"
                    id="dropdown-scoring-btn"
                    onClick={() => setOpenDropdown((prev) => (prev === 'scoring' ? null : 'scoring'))}
                    className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl active:scale-95 text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                      openDropdown === 'scoring'
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md ring-2 ring-cyan-500/40'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-cyan-400 hover:text-white border-neutral-700 hover:border-cyan-500'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Games</span>
                    {openDropdown === 'scoring' ? (
                      <ChevronUp className="w-3.5 h-3.5 opacity-80" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    )}
                  </button>

                  {/* Falling Dropdown Menu */}
                  {openDropdown === 'scoring' && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-[#14181d] border border-[#2b3542] rounded-xl shadow-2xl p-1.5 z-40 animate-fadeIn space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-[#222933]">
                        Select Scoring Game (10 min)
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('score');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-cyan-500/20 active:bg-cyan-500/30 text-xs text-white hover:text-cyan-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-cyan-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-cyan-400" /> High Score
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Traditional 3-dart power treble scoring
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-cyan-400 border border-neutral-700">
                          10m
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('switchblade');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-500/20 active:bg-rose-500/30 text-xs text-white hover:text-rose-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-rose-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-rose-400" /> Switchblade
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Dynamic alternate scoring T20 / T19 / T18
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-rose-400 border border-neutral-700">
                          10m
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('powerswitch');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/20 active:bg-amber-500/30 text-xs text-white hover:text-amber-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-amber-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-amber-400" /> Power Switch
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Starts at T20, Treble holds & switch on miss
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
                          10m
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('bigscores');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-violet-500/20 active:bg-violet-500/30 text-xs text-white hover:text-violet-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-violet-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-violet-400" /> Big Scores
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Target power scores 100+ & 140+
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-violet-400 border border-neutral-700">
                          10m
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Finishing */}
            <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl p-3.5 sm:p-4 hover:border-amber-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/40 shrink-0">
                      3
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white whitespace-nowrap">
                      Finishing & Outshots — 20 min
                    </h3>
                    <span className="px-1.5 sm:px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-bold text-amber-300 border border-neutral-700 whitespace-nowrap">
                      Choose 1 of 5
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Choose one drill to master crucial checkout routes, combinations, and doubles pressure.
                  </p>
                </div>

                <div className="relative shrink-0 pt-1 sm:pt-0" data-dropdown-container>
                  <button
                    type="button"
                    id="dropdown-finishing-btn"
                    onClick={() => {
                      setOpenDropdown((prev) => (prev === 'finishing' ? null : 'finishing'));
                      setOpenSubmenu(null);
                    }}
                    className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl active:scale-95 text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                      openDropdown === 'finishing'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md ring-2 ring-amber-500/40'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-amber-400 hover:text-white border-neutral-700 hover:border-amber-500'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Games</span>
                    {openDropdown === 'finishing' ? (
                      <ChevronUp className="w-3.5 h-3.5 opacity-80" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    )}
                  </button>

                  {/* Falling Dropdown Menu */}
                  {openDropdown === 'finishing' && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-[#14181d] border border-[#2b3542] rounded-xl shadow-2xl p-1.5 z-40 animate-fadeIn space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-[#222933]">
                        Select Checkout Drill
                      </div>

                      {/* 121 Drill with Falling Submenu */}
                      <div className="rounded-lg overflow-hidden border border-[#2b3542] bg-[#0f141a]/90 transition-all">
                        <button
                          type="button"
                          onClick={() => setOpenSubmenu((prev) => (prev === '121' ? null : '121'))}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer group ${
                            openSubmenu === '121'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'hover:bg-amber-500/15 text-white hover:text-amber-300'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <Play className="w-2.5 h-2.5 fill-current text-amber-400" /> 121 Checkout Drill
                            </span>
                            <span className="text-[10px] text-neutral-400 font-normal">
                              Ladder 121→130 · Select 9 or 12 Darts mode
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
                              20m
                            </span>
                            {openSubmenu === '121' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-300" />
                            )}
                          </div>
                        </button>

                        {/* Extra Falling Submenu */}
                        {openSubmenu === '121' && (
                          <div className="px-2 pb-2 pt-1 space-y-1 bg-neutral-900/90 border-t border-[#222933] animate-fadeIn">
                            <div className="text-[9px] font-bold text-amber-400/80 uppercase tracking-wider px-1">
                              Select Mode:
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(null);
                                setOpenSubmenu(null);
                                handleStartGame('1219');
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-amber-500/25 active:bg-amber-500/35 text-xs text-white hover:text-amber-200 flex items-center justify-between transition-all cursor-pointer group/sub"
                            >
                              <div>
                                <span className="font-bold block text-xs group-hover/sub:text-amber-300">
                                  9 Darts Mode
                                </span>
                                <span className="text-[10px] text-neutral-400 block font-normal">
                                  3 darts per attempt · 3 lives · Ladder 121→130
                                </span>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                                9 darts
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(null);
                                setOpenSubmenu(null);
                                handleStartGame('12112');
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-amber-500/25 active:bg-amber-500/35 text-xs text-white hover:text-amber-200 flex items-center justify-between transition-all cursor-pointer group/sub"
                            >
                              <div>
                                <span className="font-bold block text-xs group-hover/sub:text-amber-300">
                                  12 Darts Mode
                                </span>
                                <span className="text-[10px] text-neutral-400 block font-normal">
                                  6 darts per attempt · 3 lives · Ladder 121→130
                                </span>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                                12 darts
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('catch40');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-yellow-500/20 active:bg-yellow-500/30 text-xs text-white hover:text-yellow-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-yellow-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-yellow-400" /> Catch 40
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Master checkouts 61 to 100 with dart efficiency
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-yellow-400 border border-neutral-700">
                          20m
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('cochallenge');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-cyan-500/20 active:bg-cyan-500/30 text-xs text-white hover:text-cyan-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-cyan-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-cyan-400" /> Checkout Challenge
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Dynamic random match outshots from 41 to 120
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-cyan-400 border border-neutral-700">
                          20m
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('boomerang');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-sky-500/20 active:bg-sky-500/30 text-xs text-white hover:text-sky-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-sky-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-sky-400" /> Doubles Boomerang
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Round-the-board doubles D20 down to D1 & back
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-sky-400 border border-neutral-700">
                          10m
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('bobs27');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/20 active:bg-amber-500/30 text-xs text-white hover:text-amber-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-amber-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-amber-400" /> Bob's 27
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Start at 27 · D1 to Bullseye · Don't drop to 0
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
                          10m
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 4: Break */}
            <div className="bg-blue-950/30 border border-blue-800/40 rounded-2xl p-3.5 sm:p-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-black text-xs flex items-center justify-center border border-blue-500/40">
                  4
                </span>
                <h3 className="text-sm sm:text-base font-bold text-blue-300">
                  Break & Hydration — 10 min
                </h3>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-[10px] font-bold text-blue-400 border border-blue-800">
                  Rest
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Take a 10-minute break after the first three sections. Stretch, hydrate, rest your shoulder, and reset mental focus for the second half.
              </p>
            </div>

            {/* Step 5: Bull Warm Up */}
            <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl p-3.5 sm:p-4 hover:border-rose-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center border border-rose-500/40">
                      5
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Bull Warm Up — 10 min
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-bold text-rose-300 border border-neutral-700">
                      10 min
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Use the 10-minute Bull Warm Up to get back into your rhythm post-break.
                  </p>
                </div>

                <div className="shrink-0 pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleStartGame('bull')}
                    className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-600 active:scale-95 text-xs text-rose-400 hover:text-white font-bold flex items-center justify-center gap-1.5 border border-neutral-700 hover:border-rose-500 transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" /> Bull Warm Up
                  </button>
                </div>
              </div>
            </div>

            {/* Step 6: Single Numbers & Grouping */}
            <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl p-3.5 sm:p-4 hover:border-purple-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-black text-xs flex items-center justify-center border border-purple-500/40">
                      6
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Single Numbers & Grouping — 20 min
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-bold text-purple-300 border border-neutral-700">
                      Choose 1 of 4
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Practice Singles and grouping: play 1 20-minute game or 2 10-minute games.
                  </p>
                </div>

                <div className="relative shrink-0 pt-1 sm:pt-0" data-dropdown-container>
                  <button
                    type="button"
                    id="dropdown-singles-btn"
                    onClick={() => {
                      setOpenDropdown((prev) => (prev === 'singles' ? null : 'singles'));
                      setOpenSubmenu(null);
                    }}
                    className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl active:scale-95 text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                      openDropdown === 'singles'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-2 ring-purple-500/40'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-purple-400 hover:text-white border-neutral-700 hover:border-purple-500'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Games</span>
                    {openDropdown === 'singles' ? (
                      <ChevronUp className="w-3.5 h-3.5 opacity-80" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    )}
                  </button>

                  {/* Falling Dropdown Menu */}
                  {openDropdown === 'singles' && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-[#14181d] border border-[#2b3542] rounded-xl shadow-2xl p-1.5 z-40 animate-fadeIn space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-[#222933]">
                        Select Precision Game
                      </div>

                      {/* RTW Singles with Falling Submenu */}
                      <div className="rounded-lg overflow-hidden border border-[#2b3542] bg-[#0f141a]/90 transition-all">
                        <button
                          type="button"
                          onClick={() => setOpenSubmenu((prev) => (prev === 'rtwsingles' ? null : 'rtwsingles'))}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer group ${
                            openSubmenu === 'rtwsingles'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'hover:bg-cyan-500/15 text-white hover:text-cyan-300'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <Play className="w-2.5 h-2.5 fill-current text-cyan-400" /> Round the World Singles
                            </span>
                            <span className="text-[10px] text-neutral-400 font-normal">
                              1 dart per target 1→20 + Bull · Select Mode
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-cyan-400 border border-neutral-700">
                              10m
                            </span>
                            {openSubmenu === 'rtwsingles' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-300" />
                            )}
                          </div>
                        </button>

                        {/* Extra Falling Submenu */}
                        {openSubmenu === 'rtwsingles' && (
                          <div className="px-2 pb-2 pt-1 space-y-1 bg-neutral-900/90 border-t border-[#222933] animate-fadeIn">
                            <div className="text-[9px] font-bold text-cyan-400/80 uppercase tracking-wider px-1">
                              Select RTW Mode:
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(null);
                                setOpenSubmenu(null);
                                handleStartGame('rtwsingles_intermediate');
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-cyan-500/25 active:bg-cyan-500/35 text-xs text-white hover:text-cyan-200 flex items-center justify-between transition-all cursor-pointer group/sub"
                            >
                              <div>
                                <span className="font-bold block text-xs group-hover/sub:text-cyan-300">
                                  Intermediate
                                </span>
                                <span className="text-[10px] text-neutral-400 block font-normal">
                                  Hit +1 / Miss -1 · 3 misses in row = KO
                                </span>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-cyan-300 border border-neutral-700">
                                3 strikes
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(null);
                                setOpenSubmenu(null);
                                handleStartGame('rtwsingles_advanced');
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-cyan-500/25 active:bg-cyan-500/35 text-xs text-white hover:text-cyan-200 flex items-center justify-between transition-all cursor-pointer group/sub"
                            >
                              <div>
                                <span className="font-bold block text-xs group-hover/sub:text-cyan-300">
                                  Advanced
                                </span>
                                <span className="text-[10px] text-neutral-400 block font-normal">
                                  Hit +1 / Miss -1 · 5 total misses = KO
                                </span>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-cyan-300 border border-neutral-700">
                                5 misses
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Big Singles with Falling Submenu */}
                      <div className="rounded-lg overflow-hidden border border-[#2b3542] bg-[#0f141a]/90 transition-all">
                        <button
                          type="button"
                          onClick={() => setOpenSubmenu((prev) => (prev === 'bigsingles' ? null : 'bigsingles'))}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer group ${
                            openSubmenu === 'bigsingles'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'hover:bg-cyan-500/15 text-white hover:text-cyan-300'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <Play className="w-2.5 h-2.5 fill-current text-cyan-400" /> Big Singles
                            </span>
                            <span className="text-[10px] text-neutral-400 font-normal">
                              1→20 grouping ladder · Select Mode
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-cyan-400 border border-neutral-700">
                              10m
                            </span>
                            {openSubmenu === 'bigsingles' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-300" />
                            )}
                          </div>
                        </button>

                        {/* Extra Falling Submenu */}
                        {openSubmenu === 'bigsingles' && (
                          <div className="px-2 pb-2 pt-1 space-y-1 bg-neutral-900/90 border-t border-[#222933] animate-fadeIn">
                            <div className="text-[9px] font-bold text-cyan-400/80 uppercase tracking-wider px-1">
                              Select Big Singles Mode:
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(null);
                                setOpenSubmenu(null);
                                handleStartGame('bigsingles_intermediate');
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-cyan-500/25 active:bg-cyan-500/35 text-xs text-white hover:text-cyan-200 flex items-center justify-between transition-all cursor-pointer group/sub"
                            >
                              <div>
                                <span className="font-bold block text-xs group-hover/sub:text-cyan-300">
                                  Intermediate
                                </span>
                                <span className="text-[10px] text-neutral-400 block font-normal">
                                  2/3 hits advance (+1) · 1 stay (0) · 0 back 1 (-1)
                                </span>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-cyan-300 border border-neutral-700">
                                2/3 hits
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(null);
                                setOpenSubmenu(null);
                                handleStartGame('bigsingles_advanced');
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-amber-500/25 active:bg-amber-500/35 text-xs text-white hover:text-amber-200 flex items-center justify-between transition-all cursor-pointer group/sub"
                            >
                              <div>
                                <span className="font-bold block text-xs group-hover/sub:text-amber-300">
                                  Advanced
                                </span>
                                <span className="text-[10px] text-neutral-400 block font-normal">
                                  3 hits: +1 · 2 hits: 0 · 1 hit: -1 · 0 hits: -2
                                </span>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700">
                                3/3 hits
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* A1 Practice with Falling Submenu */}
                      <div className="rounded-lg overflow-hidden border border-[#2b3542] bg-[#0f141a]/90 transition-all">
                        <button
                          type="button"
                          onClick={() => setOpenSubmenu((prev) => (prev === 'a1practice' ? null : 'a1practice'))}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer group ${
                            openSubmenu === 'a1practice'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'hover:bg-amber-500/15 text-white hover:text-amber-300'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <Play className="w-2.5 h-2.5 fill-current text-amber-400" /> A1 Practice
                            </span>
                            <span className="text-[10px] text-neutral-400 font-normal">
                              Singles routine · 20→11 or 1→10 · Select Set
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
                              10m
                            </span>
                            {openSubmenu === 'a1practice' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-300" />
                            )}
                          </div>
                        </button>

                        {/* Extra Falling Submenu */}
                        {openSubmenu === 'a1practice' && (
                          <div className="px-2 pb-2 pt-1 space-y-1 bg-neutral-900/90 border-t border-[#222933] animate-fadeIn">
                            <div className="text-[9px] font-bold text-amber-400/80 uppercase tracking-wider px-1">
                              Select Starting Set:
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(null);
                                setOpenSubmenu(null);
                                handleStartGame('a1practice_top');
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-amber-500/25 active:bg-amber-500/35 text-xs text-white hover:text-amber-200 flex items-center justify-between transition-all cursor-pointer group/sub"
                            >
                              <div>
                                <span className="font-bold block text-xs group-hover/sub:text-amber-300">
                                  Numbers 20 to 11
                                </span>
                                <span className="text-[10px] text-neutral-400 block font-normal">
                                  Upper half · 3 clears per number · Auto-switch to 1–10
                                </span>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700">
                                20→11
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdown(null);
                                setOpenSubmenu(null);
                                handleStartGame('a1practice_bottom');
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-amber-500/25 active:bg-amber-500/35 text-xs text-white hover:text-amber-200 flex items-center justify-between transition-all cursor-pointer group/sub"
                            >
                              <div>
                                <span className="font-bold block text-xs group-hover/sub:text-amber-300">
                                  Numbers 1 to 10
                                </span>
                                <span className="text-[10px] text-neutral-400 block font-normal">
                                  Lower half · 3 clears per number · Auto-switch to 20–11
                                </span>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700">
                                1→10
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('triple');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-purple-500/20 active:bg-purple-500/30 text-xs text-white hover:text-purple-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-purple-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-purple-400" /> Triple Lock
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Target treble precision 20 down to 1 + Bull
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-purple-400 border border-neutral-700">
                          20m
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 7: 301 & X01 Match Play */}
            <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl p-3.5 sm:p-4 hover:border-yellow-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-black text-xs flex items-center justify-center border border-yellow-500/40">
                      7
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      301 & X01 Match Play — 20 min
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-bold text-yellow-300 border border-neutral-700">
                      Solo / Bot
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Finish your session with match play! Play solo 301 legs for 20 minutes, or challenge AI DartBot in a 501 best-of match.
                  </p>
                </div>

                <div className="relative shrink-0 pt-1 sm:pt-0" data-dropdown-container>
                  <button
                    type="button"
                    id="dropdown-match-btn"
                    onClick={() => setOpenDropdown((prev) => (prev === 'match' ? null : 'match'))}
                    className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl active:scale-95 text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                      openDropdown === 'match'
                        ? 'bg-yellow-600 text-white border-yellow-400 shadow-md ring-2 ring-yellow-500/40'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-yellow-400 hover:text-white border-neutral-700 hover:border-yellow-500'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Games</span>
                    {openDropdown === 'match' ? (
                      <ChevronUp className="w-3.5 h-3.5 opacity-80" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    )}
                  </button>

                  {/* Falling Dropdown Menu */}
                  {openDropdown === 'match' && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-[#14181d] border border-[#2b3542] rounded-xl shadow-2xl p-1.5 z-40 animate-fadeIn space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-[#222933]">
                        Select Match Play Format
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('301');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-yellow-500/20 active:bg-yellow-500/30 text-xs text-white hover:text-yellow-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-yellow-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-yellow-400" /> 301 Solo Practice
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Rapid double-out 301 legs solo training
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-yellow-400 border border-neutral-700">
                          Solo
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleStartGame('dartbot');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-500/20 active:bg-rose-500/30 text-xs text-white hover:text-rose-300 font-bold flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-white group-hover:text-rose-300 font-bold flex items-center gap-1.5">
                            <Play className="w-2.5 h-2.5 fill-current text-rose-400" /> X01 Match Play
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            Challenge AI DartBot in a 501 match
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-rose-400 border border-neutral-700">
                          vs Bot
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: KEYPAD GUIDE */}
      {activeTab === 'keypad' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn text-xs sm:text-sm">
          <div>
            <h3 className="font-black text-white text-base">Keypad Scoring Guide</h3>
            <p className="text-neutral-400 text-xs mt-0.5">
              Rapid input mechanics for precision 3-dart scoring and match play.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800">
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-1.5">
              <b className="text-emerald-400 font-bold text-xs uppercase tracking-wider block">Single / Double / Triple Prefix</b>
              <p className="text-neutral-300 text-xs leading-relaxed">
                Tap <b>S</b> (Single), <b>D</b> (Double), or <b>T</b> (Triple) before a number to quickly input standard segment hits:
              </p>
              <ul className="text-neutral-400 text-[11px] space-y-0.5 list-disc pl-4">
                <li><code>T + 20</code> = 60 points</li>
                <li><code>D + 16</code> = 32 points</li>
                <li><code>S + 19</code> = 19 points</li>
              </ul>
            </div>

            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-1.5">
              <b className="text-cyan-400 font-bold text-xs uppercase tracking-wider block">Direct Quick Buttons</b>
              <p className="text-neutral-300 text-xs leading-relaxed">
                Tap dedicated quick-score buttons for one-touch scoring on common dart combinations:
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {[26, 41, 45, 60, 81, 85, 100, 140, 180].map((sc) => (
                  <span key={sc} className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-mono font-bold text-neutral-200">
                    {sc}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-1.5">
              <b className="text-amber-400 font-bold text-xs uppercase tracking-wider block">Bust & Recovery</b>
              <p className="text-neutral-300 text-xs leading-relaxed">
                If your score exceeds remaining points or leaves 1, tapping <b>BUST</b> or entering the score automatically resets the turn with zero scored points.
              </p>
            </div>

            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-1.5">
              <b className="text-purple-400 font-bold text-xs uppercase tracking-wider block">Checkout Darts Modal</b>
              <p className="text-neutral-300 text-xs leading-relaxed">
                When you hit a winning double, select how many darts were thrown in the final visit (1, 2, or 3) and your total attempts at the double for accurate checkout %.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FEATURES & AI */}
      {activeTab === 'features' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn text-xs sm:text-sm">
          <div>
            <h3 className="font-black text-white text-base">App Features & Training AI</h3>
            <p className="text-neutral-400 text-xs mt-0.5">
              Integrated tools to enhance your practice and analyze your progress.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-neutral-800">
            {/* 170-2 Outshot AI */}
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <b className="text-emerald-400 font-bold text-sm block">170-2 Outshot AI Assistant</b>
                <p className="text-neutral-300 text-xs mt-0.5 leading-relaxed">
                  Interactive visual dartboard guide providing optimal professional routes, recovery alternatives, and double targets for all scores from 170 down to 2.
                </p>
              </div>
              {onOpenCheckoutAi && (
                <button
                  type="button"
                  onClick={() => {
                    sound.tap();
                    onOpenCheckoutAi();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Launch 170-2 AI
                </button>
              )}
            </div>

            {/* DartBot AI */}
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <b className="text-rose-400 font-bold text-sm block">AI DartBot Opponents (Levels 1–10)</b>
                <p className="text-neutral-300 text-xs mt-0.5 leading-relaxed">
                  Practice against realistic AI opponents calibrated from Novice (35 3-dart average) up to World Champion (105 3-dart average) with natural throwing pace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleStartGame('dartbot')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs"
              >
                <Bot className="w-3.5 h-3.5" /> Play X01 Match
              </button>
            </div>

            {/* Multi-Device Cloud Sync */}
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <b className="text-cyan-400 font-bold text-sm block">Multi-Device Cloud Profiles & Sync</b>
                <p className="text-neutral-300 text-xs mt-0.5 leading-relaxed">
                  Log in with Google to automatically back up your daily throw counts, drill records, and best scores across your phone, tablet, and PC.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.tap();
                  onOpenAccounts();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs"
              >
                <Users className="w-3.5 h-3.5" /> Manage Profiles
              </button>
            </div>

            {/* Screen Wake Lock */}
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5">
              <b className="text-amber-400 font-bold text-sm block">Screen Wake Lock</b>
              <p className="text-neutral-300 text-xs mt-0.5 leading-relaxed">
                Keeps your device display awake throughout your entire training session so your phone or tablet never dims or sleeps between visits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Game Instructions Prompt Modal */}
      <GameInstructionModal
        gameType={instructionGame}
        isOpen={!!instructionGame}
        onClose={() => setInstructionGame(null)}
        onConfirmStart={handleConfirmStart}
      />
    </div>
  );
};
