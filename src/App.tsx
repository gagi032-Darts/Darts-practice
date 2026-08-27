import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { TimerHeader } from './components/common/TimerHeader';
import { ArmCalibrationGame } from './components/games/ArmCalibrationGame';
import { WheelGame } from './components/games/WheelGame';
import { BullWarmupGame } from './components/games/BullWarmupGame';
import { AlignGame } from './components/games/AlignGame';
import { HighscoreGame } from './components/games/HighscoreGame';
import { OneTwentyOneGame } from './components/games/OneTwentyOneGame';
import { CatchFortyGame } from './components/games/CatchFortyGame';
import { TripleLockGame } from './components/games/TripleLockGame';
import { DartBotMatchGame } from './components/games/DartBotMatchGame';
import { Solo301Game } from './components/games/Solo301Game';
import { SwitchbladeGame } from './components/games/SwitchbladeGame';
import { PowerSwitchGame } from './components/games/PowerSwitchGame';
import { BigScoresGame } from './components/games/BigScoresGame';
import { CheckoutChallengeGame } from './components/games/CheckoutChallengeGame';
import { DoublesBoomerangGame } from './components/games/DoublesBoomerangGame';
import { Bobs27Game } from './components/games/Bobs27Game';
import { A1PracticeGame } from './components/games/A1PracticeGame';
import { BigSinglesGame } from './components/games/BigSinglesGame';
import { RTWSinglesGame } from './components/games/RTWSinglesGame';
import { SummaryModal } from './components/games/SummaryModal';
import { HistoryModal } from './components/games/HistoryModal';
import { DailyCountModal } from './components/games/DailyCountModal';
import { CheckoutAiModal } from './components/common/CheckoutAiModal';
import { AccountModal } from './components/common/AccountModal';
import { PracticeGuideModal } from './components/common/PracticeGuideModal';
import { GameType, GameResultData, UserAccount } from './types';
import { GAME_DEFINITIONS } from './utils/gamesData';
import { storage } from './utils/storage';
import { sound } from './utils/sound';
import { wakeLock } from './utils/wakeLock';
import { cloudAuth } from './utils/firebase';

type ViewMode = 'home' | 'game' | 'daily' | 'history' | 'summary';

export default function App() {
  const [view, setView] = useState<ViewMode>('home');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);

  // User Account & Profile State
  const [activeAccount, setActiveAccount] = useState<UserAccount>(() => storage.getActiveAccount());
  const [isAccountsOpen, setIsAccountsOpen] = useState<boolean>(false);

  // Auto Cloud Sync on App Startup and Auth State
  useEffect(() => {
    let unsubscribeCloudListener: (() => void) | null = null;

    const unsubscribeAuth = cloudAuth.onAuthStateChange(async (user) => {
      if (user) {
        // Find existing linked account or create one
        const accounts = storage.getAccounts();
        let targetAccount = accounts.find((a) => a.cloudUid === user.uid);

        if (!targetAccount) {
          targetAccount = storage.createAccount(
            user.displayName || user.email?.split('@')[0] || 'Player',
            user.email || '',
            '🎯',
            undefined,
            {
              isCloudUser: true,
              cloudUid: user.uid,
              photoUrl: user.photoURL || undefined,
            }
          );
        } else {
          storage.setActiveAccount(targetAccount.id);
        }

        setActiveAccount(targetAccount);

        // Perform initial bidirectional sync
        try {
          const localHistory = storage.getHistory(targetAccount.id);
          const localDaily = storage.getDailyRecords(targetAccount.id);
          const synced = await cloudAuth.syncUserWithCloud(
            user.uid,
            localHistory,
            localDaily,
            {
              uid: user.uid,
              username: targetAccount.name,
              email: targetAccount.email || user.email || '',
              avatarEmoji: targetAccount.avatarEmoji || '🎯',
              photoUrl: targetAccount.photoUrl || user.photoURL || undefined,
              createdAt: targetAccount.createdAt,
              lastSyncedAt: new Date().toISOString(),
            }
          );

          storage.setAccountData(targetAccount.id, synced.history, synced.dailyRecords);
          setActiveAccount(storage.getActiveAccount());
        } catch (err) {
          console.warn('Initial cloud sync notice:', err);
        }

        // Subscribe to real-time updates from other devices
        if (unsubscribeCloudListener) unsubscribeCloudListener();
        unsubscribeCloudListener = cloudAuth.subscribeToCloudData(user.uid, (cloudData) => {
          if (cloudData && (cloudData.history || cloudData.dailyRecords)) {
            const currentAcc = storage.getActiveAccount();
            if (currentAcc.cloudUid === user.uid) {
              storage.setAccountData(currentAcc.id, cloudData.history || [], cloudData.dailyRecords || {});
            }
          }
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeCloudListener) unsubscribeCloudListener();
    };
  }, []);

  // Timer & Session State
  const [timeRemaining, setTimeRemaining] = useState<number>(600);
  const [initialDuration, setInitialDuration] = useState<number>(600);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFinalInput, setIsFinalInput] = useState<boolean>(false);
  const [sessionResult, setSessionResult] = useState<GameResultData | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Outshot AI Modal State (170 down to 2)
  const [isCheckoutAiOpen, setIsCheckoutAiOpen] = useState<boolean>(false);
  const [checkoutAiScore, setCheckoutAiScore] = useState<number>(121);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const openCheckoutAi = (score: number = 121) => {
    setCheckoutAiScore(score);
    setIsCheckoutAiOpen(true);
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Start or reset a game drill
  const startGame = (type: GameType, customDurationMinutes?: number) => {
    clearTimer();
    wakeLock.request();
    const def = GAME_DEFINITIONS[type];
    setSelectedGame(type);
    setIsPaused(false);
    setIsFinalInput(false);
    setSessionResult(null);
    setShowExitConfirm(false);
    startTimeRef.current = Date.now();

    if (def.isCountUp) {
      setSecondsElapsed(0);
      setTimeRemaining(0);
      setView('game');

      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      const totalSec = (customDurationMinutes || def.durationMinutes || 10) * 60;
      setInitialDuration(totalSec);
      setTimeRemaining(totalSec);
      setSecondsElapsed(0);
      setView('game');

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            setIsFinalInput(true);
            sound.timeUp();
            return 0;
          }
          if (prev === 11) {
            sound.timerWarning();
          }
          return prev - 1;
        });
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
  };

  // Toggle pause/resume
  const handleTogglePause = () => {
    if (!selectedGame || isFinalInput) return;
    const def = GAME_DEFINITIONS[selectedGame];

    if (isPaused) {
      // Resume
      setIsPaused(false);
      sound.hit();
      if (def.isCountUp) {
        timerRef.current = setInterval(() => {
          setSecondsElapsed((prev) => prev + 1);
        }, 1000);
      } else {
        timerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearTimer();
              setIsFinalInput(true);
              sound.timeUp();
              return 0;
            }
            if (prev === 11) {
              sound.timerWarning();
            }
            return prev - 1;
          });
          setSecondsElapsed((prev) => prev + 1);
        }, 1000);
      }
    } else {
      // Pause
      setIsPaused(true);
      sound.tap();
      clearTimer();
    }
  };

  // Finish session
  const handleGameFinish = (result: GameResultData) => {
    clearTimer();
    if (!selectedGame) return;
    const def = GAME_DEFINITIONS[selectedGame];

    setSessionResult(result);
    // Save to durable local storage
    storage.saveSession(selectedGame, def.title, secondsElapsed, result);
    setView('summary');
  };

  // Exit game request
  const handleExitRequest = () => {
    if (view === 'game' && !isFinalInput) {
      setShowExitConfirm(true);
    } else {
      clearTimer();
      setView('home');
    }
  };

  const handleConfirmExit = () => {
    clearTimer();
    setShowExitConfirm(false);
    setView('home');
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentGameDef = selectedGame ? GAME_DEFINITIONS[selectedGame] : null;
  const percentRemaining =
    currentGameDef && !currentGameDef.isCountUp && initialDuration > 0
      ? (timeRemaining / initialDuration) * 100
      : 100;

  return (
    <div id="darts-app" className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      {/* Top Main Navbar (Only shown for non-home modal screens if not in game) */}
      {view !== 'game' && view !== 'home' && (
        <Navbar
          onGoHome={() => {
            clearTimer();
            setView('home');
          }}
          onOpenDaily={() => setView('daily')}
          onOpenHistory={() => setView('history')}
          onOpenCheckoutAi={() => openCheckoutAi(121)}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenAccounts={() => setIsAccountsOpen(true)}
          activeAccount={activeAccount}
        />
      )}

      {/* In-Game Drill Header Bar */}
      {view === 'game' && currentGameDef && (
        <TimerHeader
          title={currentGameDef.title}
          categoryLabel={currentGameDef.categoryLabel}
          timeDisplay={
            currentGameDef.isCountUp
              ? formatTime(secondsElapsed)
              : formatTime(timeRemaining)
          }
          isCountUp={currentGameDef.isCountUp}
          isFinalInput={isFinalInput}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onExitRequest={handleExitRequest}
          percentRemaining={percentRemaining}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${view === 'game' ? 'px-2 py-1 sm:px-4 sm:py-2 pb-1.5 sm:pb-3' : 'px-3 py-2.5 sm:px-6 sm:py-6 pb-12 sm:pb-8'} max-w-4xl mx-auto w-full flex flex-col justify-start`}>
        {view === 'home' && (
          <HomeScreen
            onSelectGame={startGame}
            onOpenDaily={() => setView('daily')}
            onOpenHistory={() => setView('history')}
            onOpenGuide={() => setIsGuideOpen(true)}
            onOpenAccounts={() => setIsAccountsOpen(true)}
            onOpenCheckoutAi={() => openCheckoutAi(121)}
            activeAccount={activeAccount}
          />
        )}

        {view === 'daily' && <DailyCountModal onClose={() => setView('home')} />}

        {view === 'history' && <HistoryModal onClose={() => setView('home')} />}

        {view === 'summary' && selectedGame && sessionResult && (
          <SummaryModal
            gameType={selectedGame}
            result={sessionResult}
            durationFormatted={formatTime(secondsElapsed)}
            onPlayAgain={() => startGame(selectedGame)}
            onGoHome={() => setView('home')}
            onOpenHistory={() => setView('history')}
          />
        )}

        {/* Drill Screens */}
        {view === 'game' && selectedGame === 'cal' && (
          <ArmCalibrationGame
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && selectedGame === 'wheel' && (
          <WheelGame
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && selectedGame === 'bull' && (
          <BullWarmupGame
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && selectedGame === 'align' && (
          <AlignGame
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && (selectedGame === 'score' || selectedGame === 'score1' || selectedGame === 'score2') && (
          <HighscoreGame
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && selectedGame === 'switchblade' && (
          <SwitchbladeGame
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && selectedGame === 'powerswitch' && (
          <PowerSwitchGame
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && selectedGame === 'bigscores' && (
          <BigScoresGame
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && (selectedGame === '12112' || selectedGame === '1219') && (
          <OneTwentyOneGame
            dartLimit={selectedGame === '12112' ? 12 : 9}
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
            onOpenCheckoutAi={openCheckoutAi}
            onExit={handleExitRequest}
          />
        )}

        {view === 'game' && selectedGame === 'catch40' && (
          <CatchFortyGame
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
            onOpenCheckoutAi={openCheckoutAi}
            onExit={handleExitRequest}
          />
        )}

        {view === 'game' && selectedGame === 'cochallenge' && (
          <CheckoutChallengeGame
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
            onOpenCheckoutAi={openCheckoutAi}
            onStartCustomTimer={(mins) => startGame('cochallenge', mins)}
          />
        )}

        {view === 'game' && selectedGame === 'boomerang' && (
          <DoublesBoomerangGame
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && selectedGame === 'bobs27' && (
          <Bobs27Game
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && (selectedGame === 'a1practice' || selectedGame === 'a1practice_top' || selectedGame === 'a1practice_bottom') && (
          <A1PracticeGame
            initialMode={selectedGame === 'a1practice_bottom' ? '1_10' : '20_11'}
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && (selectedGame === 'bigsingles' || selectedGame === 'bigsingles_intermediate' || selectedGame === 'bigsingles_advanced') && (
          <BigSinglesGame
            initialLevel={selectedGame === 'bigsingles_advanced' ? 'advanced' : 'intermediate'}
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && (selectedGame === 'rtwsingles' || selectedGame === 'rtwsingles_intermediate' || selectedGame === 'rtwsingles_advanced') && (
          <RTWSinglesGame
            initialDifficulty={selectedGame === 'rtwsingles_advanced' ? 'advanced' : 'intermediate'}
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && selectedGame === 'triple' && (
          <TripleLockGame
            secondsElapsed={secondsElapsed}
            timeRemaining={timeRemaining}
            timeFormatted={formatTime(timeRemaining)}
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
          />
        )}

        {view === 'game' && selectedGame === '301' && (
          <Solo301Game
            isFinalInput={isFinalInput}
            onFinish={handleGameFinish}
            onOpenCheckoutAi={openCheckoutAi}
          />
        )}

        {view === 'game' && selectedGame === 'dartbot' && (
          <DartBotMatchGame
            onFinish={handleGameFinish}
            onOpenCheckoutAi={openCheckoutAi}
          />
        )}
      </main>

      {/* Checkout AI Assistant Modal (170 down to 2) */}
      <CheckoutAiModal
        isOpen={isCheckoutAiOpen}
        initialScore={checkoutAiScore}
        onClose={() => setIsCheckoutAiOpen(false)}
      />

      {/* Account / Multi-Profile Modal */}
      <AccountModal
        isOpen={isAccountsOpen}
        onClose={() => setIsAccountsOpen(false)}
        activeAccount={activeAccount}
        onAccountChange={(acc) => {
          setActiveAccount(acc);
        }}
      />

      {/* 2-Hour Practice Routine & App Guide Modal */}
      <PracticeGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSelectGame={startGame}
        onOpenCheckoutAi={() => {
          setIsGuideOpen(false);
          openCheckoutAi(121);
        }}
      />

      {/* Exit Drill Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <h3 className="text-lg font-bold text-white">Leave this Drill?</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your active drill session will not be saved as completed if you leave now.
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="h-11 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 font-bold text-xs border border-neutral-700 transition-all"
              >
                Keep Practicing
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs transition-all shadow-md"
              >
                Exit Drill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Footer (shown only outside active gameplay) */}
      {view !== 'game' && (
        <footer className="text-center text-[11px] text-neutral-600 py-3 border-t border-neutral-900">
          Dart Practice · Precision Training System
        </footer>
      )}
    </div>
  );
}
