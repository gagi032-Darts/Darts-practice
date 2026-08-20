import React, { useState, useEffect } from 'react';
import {
  Target,
  Flame,
  TrendingUp,
  Activity,
  RotateCw,
  Crosshair,
  Lock,
  Award,
  Zap,
  Bot,
  Calendar,
  BarChart3,
  Volume2,
  VolumeX,
  Clock,
  ChevronDown,
  ChevronUp,
  Play,
  Sun,
  Vibrate,
  VibrateOff,
  Users,
  BookOpen,
  Cloud,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GameType, UserAccount } from '../types';
import { GAME_DEFINITIONS } from '../utils/gamesData';
import { storage } from '../utils/storage';
import { sound } from '../utils/sound';
import { wakeLock } from '../utils/wakeLock';
import { PlayerAvatar } from './common/PlayerAvatar';

interface HomeScreenProps {
  onSelectGame: (type: GameType) => void;
  onOpenDaily: () => void;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
  onOpenAccounts: () => void;
  activeAccount: UserAccount;
}

interface RoomSection {
  id: string;
  title: string;
  badge: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  gameIds: GameType[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectGame,
  onOpenDaily,
  onOpenHistory,
  onOpenGuide,
  onOpenAccounts,
  activeAccount,
}) => {
  const [soundOn, setSoundOn] = useState<boolean>(sound.isEnabled());
  const [hapticsOn, setHapticsOn] = useState<boolean>(sound.isHapticsEnabled());
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(wakeLock.isEnabled());
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [todayVolume, setTodayVolume] = useState<number>(0);

  // Accordion / Falling Menu active room state
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

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

  const toggleRoom = (roomId: string) => {
    sound.tap();
    setExpandedRoomId((prev) => (prev === roomId ? null : roomId));
  };

  // The exact clean rooms requested by the user
  const rooms: RoomSection[] = [
    {
      id: 'warmup',
      title: 'Warm Up',
      badge: '2 Drills',
      subtitle: 'Arm Calibration & The Wheel progression routines',
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
      accentColor: 'emerald',
      gameIds: ['cal', 'wheel'],
    },
    {
      id: 'scoring',
      title: 'Scoring',
      badge: '1 Drill',
      subtitle: 'High Score 20-min power scoring evaluation & 3-dart average',
      icon: <TrendingUp className="w-5 h-5 text-cyan-400" />,
      accentColor: 'cyan',
      gameIds: ['score'],
    },
    {
      id: 'finishing',
      title: 'Finishing',
      badge: '3 Drills',
      subtitle: '121 in 9, 121 in 12 & Catch 40 tactical checkout ladders',
      icon: <Flame className="w-5 h-5 text-amber-400" />,
      accentColor: 'amber',
      gameIds: ['1219', '12112', 'catch40'],
    },
    {
      id: 'bull',
      title: 'Bull Warm Up',
      badge: '1 Drill',
      subtitle: 'Center-board grouping & Bullseye 50/25 scoring calibration',
      icon: <Crosshair className="w-5 h-5 text-rose-400" />,
      accentColor: 'rose',
      gameIds: ['bull'],
    },
    {
      id: 'triple',
      title: 'Triple Lock',
      badge: 'Stopwatch',
      subtitle: 'Lock challenge descending 20 down to 1 with Bull finish',
      icon: <Lock className="w-5 h-5 text-purple-400" />,
      accentColor: 'purple',
      gameIds: ['triple'],
    },
    {
      id: 'dartbot',
      title: 'X01 vs Bot',
      badge: 'Solo & Bot',
      subtitle: 'Standard 501/301/701 match play — play Solo or challenge AI DartBot',
      icon: <Bot className="w-5 h-5 text-rose-400" />,
      accentColor: 'rose',
      gameIds: ['dartbot'],
    },
  ];

  const getGameIcon = (type: GameType) => {
    switch (type) {
      case 'cal':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'wheel':
        return <RotateCw className="w-5 h-5 text-teal-400" />;
      case 'score':
      case 'score1':
      case 'score2':
        return <TrendingUp className="w-5 h-5 text-cyan-400" />;
      case '1219':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case '12112':
        return <Target className="w-5 h-5 text-emerald-400" />;
      case 'catch40':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'bull':
        return <Crosshair className="w-5 h-5 text-rose-400" />;
      case 'triple':
        return <Lock className="w-5 h-5 text-purple-400" />;
      case '301':
        return <Award className="w-5 h-5 text-yellow-400" />;
      case 'dartbot':
        return <Bot className="w-5 h-5 text-rose-400" />;
      default:
        return <Target className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-5">
      {/* Top Banner / Utility Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-emerald-950/40 shrink-0">
                <Target className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="font-black text-xl sm:text-2xl text-white tracking-tight leading-none">
                Dart Practice
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Select a room below to open training drills and match modes
            </p>
          </div>

          {/* Quick Widgets */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-start sm:justify-end">
            {/* Account Card Button */}
            <button
              type="button"
              id="home-account-btn"
              onClick={() => {
                sound.tap();
                onOpenAccounts();
              }}
              title="Switch Player Profile / Cloud Accounts"
              className="px-3 py-2 rounded-2xl bg-neutral-850 hover:bg-neutral-800 active:scale-95 text-white border border-neutral-750 shadow-xs flex flex-col items-start transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-semibold leading-none">
                {activeAccount.isCloudUser ? (
                  <Cloud className="w-3 h-3 text-cyan-400" />
                ) : (
                  <Users className="w-3 h-3 text-emerald-400" />
                )}
                <span>{activeAccount.isCloudUser ? 'Cloud' : 'Player'}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 max-w-[140px]">
                <PlayerAvatar
                  photoUrl={activeAccount.photoUrl}
                  avatarEmoji={activeAccount.avatarEmoji}
                  name={activeAccount.name}
                  size="xs"
                />
                <span className="text-xs font-bold text-white truncate leading-none">
                  {activeAccount.name}
                </span>
              </div>
            </button>

            {/* Daily Dart Volume Counter */}
            <button
              type="button"
              id="home-daily-btn"
              onClick={onOpenDaily}
              title="Daily Throw Count"
              className="px-3 py-2 rounded-2xl bg-neutral-850 hover:bg-neutral-800 active:scale-95 text-white border border-neutral-750 shadow-xs flex flex-col items-start transition-all"
            >
              <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-semibold leading-none">
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>Today</span>
              </div>
              <span className="text-xs font-mono font-black text-emerald-400 mt-1 leading-none">
                {todayVolume} <span className="text-[10px] font-normal text-neutral-400">darts</span>
              </span>
            </button>

            {/* History Records Log */}
            <button
              type="button"
              id="home-history-btn"
              onClick={onOpenHistory}
              title="Drill History & Records"
              className="px-3 py-2 rounded-2xl bg-neutral-850 hover:bg-neutral-800 active:scale-95 text-white border border-neutral-750 shadow-xs flex flex-col items-start transition-all"
            >
              <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-semibold leading-none">
                <BarChart3 className="w-3 h-3 text-cyan-400" />
                <span>History</span>
              </div>
              <span className="text-xs font-mono font-black text-cyan-400 mt-1 leading-none">
                {historyCount} <span className="text-[10px] font-normal text-neutral-400">logs</span>
              </span>
            </button>

            {/* 2-Hour Practice Routine Guide Button */}
            <button
              type="button"
              id="home-guide-btn"
              onClick={() => {
                sound.tap();
                onOpenGuide();
              }}
              title="2-Hour Darts Practice Routine (Dart Practice Tutorial)"
              className="px-3 py-2 rounded-2xl bg-neutral-850 hover:bg-neutral-800 active:scale-95 text-white border border-neutral-750 shadow-xs flex flex-col items-start transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-semibold leading-none">
                <BookOpen className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Guide</span>
              </div>
              <span className="text-xs font-bold text-white mt-1 leading-none">
                2h Routine
              </span>
            </button>

            {/* Quick Toggles: Wake Lock, Vibration, Sound */}
            <div className="flex items-center gap-1">
              {wakeLock.getSupported() && (
                <button
                  type="button"
                  id="home-wakelock-btn"
                  onClick={handleToggleWakeLock}
                  title={wakeLockActive ? 'Screen Awake: ON' : 'Screen Awake: OFF'}
                  className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                    wakeLockActive
                      ? 'bg-amber-950/70 border-amber-700/80 text-amber-300'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Sun className={`w-4 h-4 ${wakeLockActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                </button>
              )}

              <button
                type="button"
                id="home-haptics-btn"
                onClick={handleToggleHaptics}
                title={hapticsOn ? 'Haptics: ON' : 'Haptics: OFF'}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                  hapticsOn
                    ? 'bg-neutral-850 border-neutral-750 text-teal-400'
                    : 'bg-neutral-850 border-neutral-750 text-neutral-500'
                }`}
              >
                {hapticsOn ? (
                  <Vibrate className="w-4 h-4 text-teal-400" />
                ) : (
                  <VibrateOff className="w-4 h-4 text-neutral-500" />
                )}
              </button>

              <button
                type="button"
                id="home-sound-btn"
                onClick={handleToggleSound}
                title={soundOn ? 'Sound: ON' : 'Sound: OFF'}
                className="p-2.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 active:scale-95 text-neutral-300 hover:text-white border border-neutral-750 transition-all"
              >
                {soundOn ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-neutral-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Falling Menu / Room Accordion Sections */}
      <div className="space-y-2.5">
        {rooms.map((room) => {
          const isExpanded = expandedRoomId === room.id;

          return (
            <div
              key={room.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'bg-neutral-900 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/20'
                  : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
              }`}
            >
              {/* Room Header Trigger */}
              <button
                type="button"
                id={`room-btn-${room.id}`}
                onClick={() => toggleRoom(room.id)}
                className="w-full p-4 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center shrink-0">
                    {room.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white truncate">
                        {room.title}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-extrabold text-neutral-300 uppercase tracking-wider shrink-0">
                        {room.badge}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {room.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isExpanded
                        ? 'bg-emerald-500 text-neutral-950 shadow-xs'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Falling Menu Content Dropdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-neutral-800/80 bg-neutral-950/60 p-3 sm:p-4 space-y-2.5"
                  >
                    <div className="grid gap-2.5">
                      {room.gameIds.map((gameId) => {
                        const game = GAME_DEFINITIONS[gameId];
                        if (!game) return null;

                        return (
                          <div
                            key={game.id}
                            className="bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/50 rounded-xl p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700/60 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                                {getGameIcon(game.id)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                                    {game.title}
                                  </h3>
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-bold border border-neutral-700/50">
                                    <Clock className="w-2.5 h-2.5 text-neutral-400" />
                                    <span>
                                      {game.isCountUp ? 'Stopwatch' : `${game.durationMinutes} min`}
                                    </span>
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                                  {game.description}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              id={`start-game-${game.id}`}
                              onClick={() => {
                                sound.tap();
                                onSelectGame(game.id);
                              }}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md border border-emerald-400/40 flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Start Practice</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
