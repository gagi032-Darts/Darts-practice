import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  Bot,
  User,
  RotateCcw,
  Sparkles,
  Sliders,
  ChevronRight,
  Trophy,
  History,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  ArrowRight,
  TrendingUp,
  Volume2,
  Zap,
  Target,
  Percent,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DartBotMatchResult, DartBotStats, LegStats, LegVisitTurn, VisitRecord } from '../../types';
import { DartsMatchKeypad } from '../common/DartsMatchKeypad';
import { DartsAtDoubleModal } from '../common/DartsAtDoubleModal';
import { CheckoutDartsModal } from '../common/CheckoutDartsModal';
import { getCheckoutRoute } from '../../utils/checkouts';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';
import { PlayerAvatar } from '../common/PlayerAvatar';
import {
  DARTBOT_LEVELS,
  DartBotLevel,
  getDartBotLevelInfo,
  generateDartBotVisit,
  DartBotVisitResult,
} from '../../utils/dartbotEngine';

interface DartBotMatchGameProps {
  isFinalInput?: boolean;
  onFinish: (result: DartBotMatchResult) => void;
  onOpenCheckoutAi?: (score: number) => void;
}

interface PendingPlayerVisit {
  val: number;
  isBust: boolean;
  isCheckout: boolean;
  startScore: number;
  endScore: number;
  nextTotalVisits: number;
  nextPoints: number;
  nextTotalDarts: number;
}

function buildLegStat(
  legNum: number,
  winner: 'player' | 'bot',
  checkoutScore: number,
  starter: 'player' | 'bot',
  playerScoreRemaining: number,
  botScoreRemaining: number,
  playerLegScoreline: number,
  botLegScoreline: number,
  allVisitsInMatch: VisitRecord[]
): LegStats {
  const legVisits = allVisitsInMatch.filter((v) => v.legNumber === legNum);
  const playerVisits = legVisits.filter((v) => v.thrower === 'player');
  const botVisits = legVisits.filter((v) => v.thrower === 'bot');

  const playerPoints = playerVisits.reduce((sum, v) => sum + (v.isBust ? 0 : v.pointsScored), 0);
  const botPoints = botVisits.reduce((sum, v) => sum + (v.isBust ? 0 : v.pointsScored), 0);

  // Each standard player visit is 3 darts thrown
  const playerDarts = playerVisits.reduce((sum, v) => sum + (v.darts && v.darts.length > 1 ? v.darts.length : 3), 0);
  const botDarts = botVisits.reduce((sum, v) => sum + (v.darts && v.darts.length > 0 ? v.darts.length : 3), 0);

  const playerAvg = playerDarts > 0 ? Number(((playerPoints / playerDarts) * 3).toFixed(2)) : 0;
  const botAvg = botDarts > 0 ? Number(((botPoints / botDarts) * 3).toFixed(2)) : 0;

  // First 9 in leg
  const playerF9Visits = playerVisits.slice(0, 3);
  const playerF9Points = playerF9Visits.reduce((sum, v) => sum + (v.isBust ? 0 : v.pointsScored), 0);
  const playerF9Darts = playerF9Visits.reduce((sum, v) => sum + (v.darts && v.darts.length > 1 ? v.darts.length : 3), 0);
  const playerFirstNineAvg = playerF9Darts > 0 ? Number(((playerF9Points / playerF9Darts) * 3).toFixed(2)) : 0;

  const botF9Visits = botVisits.slice(0, 3);
  const botF9Points = botF9Visits.reduce((sum, v) => sum + (v.isBust ? 0 : v.pointsScored), 0);
  const botF9Darts = botF9Visits.reduce((sum, v) => sum + (v.darts && v.darts.length > 0 ? v.darts.length : 3), 0);
  const botFirstNineAvg = botF9Darts > 0 ? Number(((botF9Points / botF9Darts) * 3).toFixed(2)) : 0;

  const playerHighestVisit = playerVisits.length > 0 ? Math.max(...playerVisits.map((v) => (v.isBust ? 0 : v.pointsScored))) : 0;
  const botHighestVisit = botVisits.length > 0 ? Math.max(...botVisits.map((v) => (v.isBust ? 0 : v.pointsScored))) : 0;

  const playerDartsAtDouble = playerVisits.reduce((sum, v) => sum + (v.dartsAtDouble || 0), 0);
  const botDartsAtDouble = botVisits.reduce((sum, v) => sum + (v.dartsAtDouble || 0), 0);

  // Turn-by-turn breakdown
  const turnCount = Math.max(playerVisits.length, botVisits.length);
  const turns: LegVisitTurn[] = [];
  for (let i = 0; i < turnCount; i++) {
    const p = playerVisits[i];
    const b = botVisits[i];
    turns.push({
      turnNumber: i + 1,
      player: p
        ? {
            startScore: p.startScore,
            pointsScored: p.pointsScored,
            endScore: p.endScore,
            dartsThrown: p.darts && p.darts.length > 1 ? p.darts.length : 3,
            dartsList: p.darts || [`${p.pointsScored}`],
            isCheckout: p.isCheckout,
            isBust: p.isBust,
            dartsAtDouble: p.dartsAtDouble || 0,
          }
        : undefined,
      bot: b
        ? {
            startScore: b.startScore,
            pointsScored: b.pointsScored,
            endScore: b.endScore,
            dartsThrown: b.darts?.length || 3,
            dartsList: b.darts || [`${b.pointsScored}`],
            isCheckout: b.isCheckout,
            isBust: b.isBust,
            dartsAtDouble: b.dartsAtDouble || 0,
          }
        : undefined,
    });
  }

  return {
    legNumber: legNum,
    winner,
    startedBy: starter,
    playerDarts,
    botDarts,
    playerPoints,
    botPoints,
    playerAvg,
    botAvg,
    playerFirstNineAvg,
    botFirstNineAvg,
    playerCheckout: winner === 'player' ? checkoutScore : undefined,
    botCheckout: winner === 'bot' ? checkoutScore : undefined,
    playerScoreRemaining,
    botScoreRemaining,
    playerDartsAtDouble,
    botDartsAtDouble,
    playerDoublesHit: winner === 'player' ? 1 : 0,
    botDoublesHit: winner === 'bot' ? 1 : 0,
    playerHighestVisit,
    botHighestVisit,
    playerScoreline: playerLegScoreline,
    botScoreline: botLegScoreline,
    turns,
    visits: legVisits,
  };
}

export const DartBotMatchGame: React.FC<DartBotMatchGameProps> = ({
  onFinish,
  onOpenCheckoutAi,
}) => {
  // Pre-game Setup State
  const [inSetup, setInSetup] = useState<boolean>(true);
  const [matchMode, setMatchMode] = useState<'bot' | 'solo'>('bot');
  const [startingScore, setStartingScore] = useState<number>(501);
  const [legsToWin, setLegsToWin] = useState<number>(3); // e.g. First to 3 (Best of 5)
  const [botLevel, setBotLevel] = useState<number>(6); // Level 1 - 10 (visit based)
  const [botCheckoutPct, setBotCheckoutPct] = useState<number>(36); // Checkout percentage
  const [firstThrower, setFirstThrower] = useState<'player' | 'bot' | 'random'>('player');
  const [botSpeedMs, setBotSpeedMs] = useState<number>(1000);

  // Match State
  const activeAccount = storage.getActiveAccount();
  const [currentLeg, setCurrentLeg] = useState<number>(1);
  const [playerLegs, setPlayerLegs] = useState<number>(0);
  const [botLegs, setBotLegs] = useState<number>(0);
  const [activeThrower, setActiveThrower] = useState<'player' | 'bot'>('player');
  const [legStarter, setLegStarter] = useState<'player' | 'bot'>('player');

  // Current Leg Scores
  const [playerScore, setPlayerScore] = useState<number>(501);
  const [botScore, setBotScore] = useState<number>(501);
  const [playerLegDarts, setPlayerLegDarts] = useState<number>(0);
  const [botLegDarts, setBotLegDarts] = useState<number>(0);

  // Player Match Totals
  const [playerTotalVisits, setPlayerTotalVisits] = useState<number>(0);
  const [playerTotalDarts, setPlayerTotalDarts] = useState<number>(0);
  const [playerTotalPoints, setPlayerTotalPoints] = useState<number>(0);
  const [playerFirstNinePoints, setPlayerFirstNinePoints] = useState<number>(0);
  const [playerFirstNineDarts, setPlayerFirstNineDarts] = useState<number>(0);
  const [playerDartsAtDouble, setPlayerDartsAtDouble] = useState<number>(0);
  const [playerDoublesHit, setPlayerDoublesHit] = useState<number>(0);
  const [playerTonPlus, setPlayerTonPlus] = useState<number>(0);
  const [playerTonFortyPlus, setPlayerTonFortyPlus] = useState<number>(0);
  const [playerOneEighties, setPlayerOneEighties] = useState<number>(0);
  const [playerHighCheckout, setPlayerHighCheckout] = useState<number>(0);
  const [playerBestLeg, setPlayerBestLeg] = useState<number | null>(null);

  // Bot Match Totals
  const [botTotalVisits, setBotTotalVisits] = useState<number>(0);
  const [botTotalDarts, setBotTotalDarts] = useState<number>(0);
  const [botTotalPoints, setBotTotalPoints] = useState<number>(0);
  const [botFirstNinePoints, setBotFirstNinePoints] = useState<number>(0);
  const [botFirstNineDarts, setBotFirstNineDarts] = useState<number>(0);
  const [botDartsAtDouble, setBotDartsAtDouble] = useState<number>(0);
  const [botDoublesHit, setBotDoublesHit] = useState<number>(0);
  const [botTonPlus, setBotTonPlus] = useState<number>(0);
  const [botTonFortyPlus, setBotTonFortyPlus] = useState<number>(0);
  const [botOneEighties, setBotOneEighties] = useState<number>(0);
  const [botHighCheckout, setBotHighCheckout] = useState<number>(0);
  const [botBestLeg, setBotBestLeg] = useState<number | null>(null);

  // Live Turn Status
  const [inputValue, setInputValue] = useState<string>('');
  const [isBotThrowing, setIsBotThrowing] = useState<boolean>(false);
  const [botLastVisit, setBotLastVisit] = useState<DartBotVisitResult | null>(null);
  const [playerLastVisitScore, setPlayerLastVisitScore] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [legWinBanner, setLegWinBanner] = useState<{ winner: 'player' | 'bot'; checkoutScore: number; darts: number } | null>(null);
  const [matchWinner, setMatchWinner] = useState<'player' | 'bot' | null>(null);
  const [showMatchLog, setShowMatchLog] = useState<boolean>(false);

  // History ledger for undo & review
  const [matchHistory, setMatchHistory] = useState<VisitRecord[]>([]);
  const [completedLegs, setCompletedLegs] = useState<LegStats[]>([]);

  // Double modal & checkout modal state
  const [pendingPlayerVisit, setPendingPlayerVisit] = useState<PendingPlayerVisit | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [pendingCheckoutVisit, setPendingCheckoutVisit] = useState<PendingPlayerVisit | null>(null);

  // Mutable Live Refs to eliminate stale React closures across asynchronous turns
  const botLegDartsRef = useRef<number>(0);
  const playerLegDartsRef = useRef<number>(0);
  const botScoreRef = useRef<number>(startingScore);
  const playerScoreRef = useRef<number>(startingScore);
  const currentLegRef = useRef<number>(1);
  const playerLegsRef = useRef<number>(0);
  const botLegsRef = useRef<number>(0);
  const matchHistoryRef = useRef<VisitRecord[]>([]);
  const completedLegsRef = useRef<LegStats[]>([]);

  const levelInfo = getDartBotLevelInfo(botLevel);

  // Checkout route lookups
  const playerCheckout = getCheckoutRoute(playerScore);
  const botCheckout = getCheckoutRoute(botScore);

  // Calculate Averages
  const playerAvg = playerTotalDarts > 0 ? Number(((playerTotalPoints / playerTotalDarts) * 3).toFixed(2)) : 0;
  const playerFirst9Avg = playerFirstNineDarts > 0 ? Number(((playerFirstNinePoints / playerFirstNineDarts) * 3).toFixed(2)) : 0;
  const playerDblPct = playerDartsAtDouble > 0 ? Number(((playerDoublesHit / playerDartsAtDouble) * 100).toFixed(1)) : 0;

  const botAvg = botTotalDarts > 0 ? Number(((botTotalPoints / botTotalDarts) * 3).toFixed(2)) : 0;
  const botFirst9Avg = botFirstNineDarts > 0 ? Number(((botFirstNinePoints / botFirstNineDarts) * 3).toFixed(2)) : 0;
  const botDblPct = botDartsAtDouble > 0 ? Number(((botDoublesHit / botDartsAtDouble) * 100).toFixed(1)) : 0;

  // Handle Level Adjustment
  const handleLevelSelect = (lvl: number) => {
    sound.tap();
    setBotLevel(lvl);
    const info = getDartBotLevelInfo(lvl);
    setBotCheckoutPct(info.defaultCheckoutPct);
  };

  // Handle Match Start
  const handleStartMatch = () => {
    sound.tap();
    let initialThrower: 'player' | 'bot' = 'player';
    if (matchMode === 'bot') {
      if (firstThrower === 'bot') initialThrower = 'bot';
      else if (firstThrower === 'random') initialThrower = Math.random() < 0.5 ? 'player' : 'bot';
    }

    currentLegRef.current = 1;
    playerLegsRef.current = 0;
    botLegsRef.current = 0;
    botLegDartsRef.current = 0;
    playerLegDartsRef.current = 0;
    botScoreRef.current = startingScore;
    playerScoreRef.current = startingScore;
    matchHistoryRef.current = [];
    completedLegsRef.current = [];

    setPlayerScore(startingScore);
    setBotScore(startingScore);
    setCurrentLeg(1);
    setPlayerLegs(0);
    setBotLegs(0);
    setLegStarter(initialThrower);
    setActiveThrower(initialThrower);
    setPlayerLegDarts(0);
    setBotLegDarts(0);
    setMatchHistory([]);
    setCompletedLegs([]);
    setMatchWinner(null);
    setLegWinBanner(null);
    setBotLastVisit(null);
    setPlayerLastVisitScore(null);
    setInSetup(false);

    if (matchMode === 'bot' && initialThrower === 'bot') {
      setTimeout(() => triggerDartBotThrow(), 600);
    }
  };

  // Bot Throwing Logic
  const triggerDartBotThrow = () => {
    setIsBotThrowing(true);
    setAnnouncement(`${levelInfo.name} is throwing...`);

    setTimeout(() => {
      const currentBotScoreVal = botScoreRef.current;
      const currentLegDarts = botLegDartsRef.current;
      const currentVisitInLeg = Math.floor(currentLegDarts / 3) + 1;
      const runningLegPoints = startingScore - currentBotScoreVal;

      const visitRes = generateDartBotVisit(
        currentBotScoreVal,
        botLevel,
        botCheckoutPct,
        currentVisitInLeg,
        startingScore,
        runningLegPoints,
        currentLegDarts
      );
      setBotLastVisit(visitRes);
      setIsBotThrowing(false);

      const nextBotDarts = currentLegDarts + visitRes.dartsThrown;
      botLegDartsRef.current = nextBotDarts;
      setBotLegDarts(nextBotDarts);
      setBotTotalDarts((prev) => prev + visitRes.dartsThrown);
      setBotTotalVisits((prev) => prev + 1);
      setBotTotalPoints((prev) => prev + visitRes.pointsScored);

      // First 9 tracking (first 3 visits of this leg)
      if (currentLegDarts < 9) {
        const dartsToCount = Math.min(visitRes.dartsThrown, 9 - currentLegDarts);
        const pointsToCount = visitRes.pointsScored;
        setBotFirstNineDarts((prev) => prev + dartsToCount);
        setBotFirstNinePoints((prev) => prev + pointsToCount);
      }

      if (visitRes.dartsAtDouble > 0) {
        setBotDartsAtDouble((prev) => prev + visitRes.dartsAtDouble);
      }

      if (visitRes.pointsScored === 180) {
        setBotOneEighties((prev) => prev + 1);
        sound.oneEighty();
      } else if (visitRes.pointsScored >= 140) {
        setBotTonFortyPlus((prev) => prev + 1);
        sound.hit();
      } else if (visitRes.pointsScored >= 100) {
        setBotTonPlus((prev) => prev + 1);
        sound.hit();
      } else if (visitRes.isBust) {
        sound.miss();
      } else {
        sound.hit();
      }

      // Record in ledger
      const record: VisitRecord = {
        legNumber: currentLegRef.current,
        thrower: 'bot',
        visitNumber: matchHistoryRef.current.filter((r) => r.legNumber === currentLegRef.current && r.thrower === 'bot').length + 1,
        startScore: visitRes.startScore,
        pointsScored: visitRes.pointsScored,
        darts: visitRes.darts,
        endScore: visitRes.endScore,
        isCheckout: visitRes.isCheckout,
        isBust: visitRes.isBust,
        dartsAtDouble: visitRes.dartsAtDouble,
      };
      const updatedMatchHistory = [...matchHistoryRef.current, record];
      matchHistoryRef.current = updatedMatchHistory;
      setMatchHistory(updatedMatchHistory);

      // Check if Bot won the leg
      if (visitRes.isCheckout) {
        sound.checkout();
        botScoreRef.current = 0;
        setBotScore(0);
        setBotDoublesHit((prev) => prev + 1);
        if (visitRes.startScore > botHighCheckout) {
          setBotHighCheckout(visitRes.startScore);
        }
        if (botBestLeg === null || nextBotDarts < botBestLeg) {
          setBotBestLeg(nextBotDarts);
        }

        const nextBotLegs = botLegsRef.current + 1;
        botLegsRef.current = nextBotLegs;
        setBotLegs(nextBotLegs);

        const newLegStat = buildLegStat(
          currentLegRef.current,
          'bot',
          visitRes.startScore,
          legStarter,
          playerScoreRef.current,
          0,
          playerLegsRef.current,
          nextBotLegs,
          updatedMatchHistory
        );
        const updatedCompletedLegs = [...completedLegsRef.current, newLegStat];
        completedLegsRef.current = updatedCompletedLegs;
        setCompletedLegs(updatedCompletedLegs);

        if (nextBotLegs >= legsToWin) {
          handleMatchFinish('bot', nextBotLegs, updatedCompletedLegs);
        } else {
          setLegWinBanner({
            winner: 'bot',
            checkoutScore: visitRes.startScore,
            darts: nextBotDarts,
          });
        }
      } else {
        botScoreRef.current = visitRes.endScore;
        setBotScore(visitRes.endScore);
        setActiveThrower('player');
        setAnnouncement(null);
      }
    }, botSpeedMs);
  };

  // Player Turn Submission
  const handlePlayerSubmit = (customVal?: number | any) => {
    if (activeThrower !== 'player' || isBotThrowing) return;

    // Read either explicit number or parse the current input string
    const val =
      typeof customVal === 'number' && !isNaN(customVal)
        ? customVal
        : parseInt(inputValue, 10);

    if (isNaN(val) || val < 0 || val > 180) return;

    // Reset input string
    setInputValue('');

    // Check bust conditions
    const scoreAfter = playerScore - val;
    const isBust = scoreAfter < 0 || scoreAfter === 1;
    const isCheckout = scoreAfter === 0;
    const isDoubleStart = playerScore <= 50;

    const actualPoints = isBust ? 0 : val;
    const nextScore = isBust ? playerScore : (isCheckout ? 0 : scoreAfter);

    const visitData: PendingPlayerVisit = {
      val,
      isBust,
      isCheckout,
      startScore: playerScore,
      endScore: nextScore,
      nextTotalVisits: playerTotalVisits + 1,
      nextPoints: playerTotalPoints + actualPoints,
      nextTotalDarts: playerTotalDarts + 3,
    };

    if (isCheckout) {
      // Prompt for how many darts used to checkout (Screenshot 1)
      setPendingCheckoutVisit(visitData);
      setIsCheckoutModalOpen(true);
    } else if (isDoubleStart && !isBust) {
      // If threw at double without checking out
      setPendingPlayerVisit(visitData);
    } else {
      commitPlayerVisit(visitData, 0, 3);
    }
  };

  const handleConfirmCheckoutDarts = (dartsUsed: number) => {
    setIsCheckoutModalOpen(false);
    if (!pendingCheckoutVisit) return;
    const data = pendingCheckoutVisit;
    setPendingCheckoutVisit(null);
    commitPlayerVisit(data, 1, dartsUsed);
  };

  const handleSelectPlayerDartsAtDouble = (dartsAtDbl: number) => {
    if (!pendingPlayerVisit) return;
    const data = pendingPlayerVisit;
    setPendingPlayerVisit(null);
    commitPlayerVisit(data, dartsAtDbl, 3);
  };

  const commitPlayerVisit = (data: PendingPlayerVisit, dartsAtDbl: number, dartsThrownInVisit: number = 3) => {
    const actualDarts = data.isCheckout ? dartsThrownInVisit : 3;
    setPlayerLastVisitScore(data.isBust ? 0 : data.val);
    setPlayerTotalVisits(data.nextTotalVisits);
    setPlayerTotalPoints(data.nextPoints);
    setPlayerTotalDarts((prev) => prev + actualDarts);

    const nextLegDarts = playerLegDartsRef.current + actualDarts;
    playerLegDartsRef.current = nextLegDarts;
    setPlayerLegDarts(nextLegDarts);

    // Record darts thrown automatically to daily storage
    storage.recordDartsThrown(actualDarts);

    // First 9 stats
    if (playerLegDartsRef.current <= 9) {
      setPlayerFirstNineDarts((prev) => prev + actualDarts);
      setPlayerFirstNinePoints((prev) => prev + (data.isBust ? 0 : data.val));
    }

    if (dartsAtDbl > 0) {
      setPlayerDartsAtDouble((prev) => prev + dartsAtDbl);
    }

    if (data.val === 180 && !data.isBust) {
      setPlayerOneEighties((prev) => prev + 1);
      sound.oneEighty();
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } else if (data.val >= 140 && !data.isBust) {
      setPlayerTonFortyPlus((prev) => prev + 1);
      sound.hit();
    } else if (data.val >= 100 && !data.isBust) {
      setPlayerTonPlus((prev) => prev + 1);
      sound.hit();
    } else if (data.isBust) {
      sound.miss();
    } else {
      sound.hit();
    }

    // Ledger record
    const record: VisitRecord = {
      legNumber: currentLegRef.current,
      thrower: 'player',
      visitNumber: data.nextTotalVisits,
      startScore: data.startScore,
      pointsScored: data.isBust ? 0 : data.val,
      darts: data.isBust ? ['BUST'] : (data.isCheckout ? [`${actualDarts}d: ${data.val}`] : [`${data.val}`]),
      endScore: data.endScore,
      isCheckout: data.isCheckout,
      isBust: data.isBust,
      dartsAtDouble: dartsAtDbl,
    };
    const updatedMatchHistory = [...matchHistoryRef.current, record];
    matchHistoryRef.current = updatedMatchHistory;
    setMatchHistory(updatedMatchHistory);

    // Check Leg Checkout
    if (data.isCheckout) {
      sound.checkout();
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      } catch {}

      playerScoreRef.current = 0;
      setPlayerScore(0);
      setPlayerDoublesHit((prev) => prev + 1);
      if (data.startScore > playerHighCheckout) {
        setPlayerHighCheckout(data.startScore);
      }
      if (playerBestLeg === null || nextLegDarts < playerBestLeg) {
        setPlayerBestLeg(nextLegDarts);
      }

      const nextPlayerLegs = playerLegsRef.current + 1;
      playerLegsRef.current = nextPlayerLegs;
      setPlayerLegs(nextPlayerLegs);

      const newLegStat = buildLegStat(
        currentLegRef.current,
        'player',
        data.startScore,
        legStarter,
        0,
        botScoreRef.current,
        nextPlayerLegs,
        botLegsRef.current,
        updatedMatchHistory
      );
      const updatedCompletedLegs = [...completedLegsRef.current, newLegStat];
      completedLegsRef.current = updatedCompletedLegs;
      setCompletedLegs(updatedCompletedLegs);

      if (nextPlayerLegs >= legsToWin) {
        handleMatchFinish('player', nextPlayerLegs, updatedCompletedLegs);
      } else {
        setLegWinBanner({
          winner: 'player',
          checkoutScore: data.startScore,
          darts: nextLegDarts,
        });
      }
    } else {
      playerScoreRef.current = data.endScore;
      setPlayerScore(data.endScore);
      if (matchMode === 'bot') {
        setActiveThrower('bot');
        setAnnouncement(`${levelInfo.name} is throwing...`);
        setTimeout(() => triggerDartBotThrow(), 400);
      } else {
        setActiveThrower('player');
        setAnnouncement(null);
      }
    }
  };

  // Proceed to Next Leg
  const handleProceedToNextLeg = () => {
    sound.tap();
    setLegWinBanner(null);
    const nextLegNum = currentLegRef.current + 1;
    currentLegRef.current = nextLegNum;
    setCurrentLeg(nextLegNum);

    // CRITICAL: Reset per-leg counters and scores in both refs and state
    botLegDartsRef.current = 0;
    playerLegDartsRef.current = 0;
    botScoreRef.current = startingScore;
    playerScoreRef.current = startingScore;

    setPlayerScore(startingScore);
    setBotScore(startingScore);
    setPlayerLegDarts(0);
    setBotLegDarts(0);
    setBotLastVisit(null);
    setPlayerLastVisitScore(null);
    setAnnouncement(null);

    if (matchMode === 'bot') {
      // Alternate starter
      const nextStarter = legStarter === 'player' ? 'bot' : 'player';
      setLegStarter(nextStarter);
      setActiveThrower(nextStarter);

      if (nextStarter === 'bot') {
        setTimeout(() => triggerDartBotThrow(), 700);
      }
    } else {
      setLegStarter('player');
      setActiveThrower('player');
    }
  };

  // Match Finish Handler
  const handleMatchFinish = (
    winner: 'player' | 'bot',
    finalWonLegs: number,
    finalCompletedLegs: LegStats[] = completedLegsRef.current
  ) => {
    sound.lock();
    setMatchWinner(winner);
    if (winner === 'player') {
      try {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } });
      } catch {}
    }

    const playerAllVisits = matchHistoryRef.current.filter((r) => r.thrower === 'player');
    const playerPointsSum = playerAllVisits.reduce((sum, v) => sum + (v.isBust ? 0 : v.pointsScored), 0);
    const playerDartsSum = playerAllVisits.length * 3;
    const calcPlayerAvg = playerDartsSum > 0 ? Number(((playerPointsSum / playerDartsSum) * 3).toFixed(2)) : playerAvg;

    const botAllVisits = matchHistoryRef.current.filter((r) => r.thrower === 'bot');
    const botPointsSum = botAllVisits.reduce((sum, v) => sum + (v.isBust ? 0 : v.pointsScored), 0);
    const botDartsSum = botAllVisits.reduce((sum, v) => sum + (v.darts && v.darts.length > 0 ? v.darts.length : 3), 0);
    const calcBotAvg = botDartsSum > 0 ? Number(((botPointsSum / botDartsSum) * 3).toFixed(2)) : botAvg;

    const finalPlayerStats: DartBotStats = {
      scoreRemaining: winner === 'player' ? 0 : playerScoreRef.current,
      legsWon: winner === 'player' ? finalWonLegs : playerLegsRef.current,
      totalVisits: playerAllVisits.length || playerTotalVisits,
      totalDarts: playerDartsSum || playerTotalDarts,
      totalPointsScored: playerPointsSum || playerTotalPoints,
      threeDartAvg: calcPlayerAvg,
      firstNineAvg: playerFirst9Avg,
      firstNineDartsCount: playerFirstNineDarts,
      firstNinePointsScored: playerFirstNinePoints,
      dartsAtDouble: playerDartsAtDouble,
      doublesHit: playerDoublesHit,
      doublePercentage: playerDblPct,
      tonPlus: playerTonPlus,
      tonFortyPlus: playerTonFortyPlus,
      oneEighty: playerOneEighties,
      highestCheckout: playerHighCheckout,
      bestLegDarts: playerBestLeg,
    };

    const finalBotStats: DartBotStats = {
      scoreRemaining: winner === 'bot' ? 0 : botScoreRef.current,
      legsWon: winner === 'bot' ? finalWonLegs : botLegsRef.current,
      totalVisits: botAllVisits.length || botTotalVisits,
      totalDarts: botDartsSum || botTotalDarts,
      totalPointsScored: botPointsSum || botTotalPoints,
      threeDartAvg: calcBotAvg,
      firstNineAvg: botFirst9Avg,
      firstNineDartsCount: botFirstNineDarts,
      firstNinePointsScored: botFirstNinePoints,
      dartsAtDouble: botDartsAtDouble,
      doublesHit: botDoublesHit,
      doublePercentage: botDblPct,
      tonPlus: botTonPlus,
      tonFortyPlus: botTonFortyPlus,
      oneEighty: botOneEighties,
      highestCheckout: botHighCheckout,
      bestLegDarts: botBestLeg,
    };

    const matchResult: DartBotMatchResult = {
      winner,
      startingScore,
      legsToWin,
      playerLegs: winner === 'player' ? finalWonLegs : playerLegsRef.current,
      botLegs: winner === 'bot' ? finalWonLegs : botLegsRef.current,
      playerStats: finalPlayerStats,
      botStats: finalBotStats,
      botLevelLabel: `${levelInfo.name} (${levelInfo.badge})`,
      botLevel,
      botCheckoutPct,
      legs: finalCompletedLegs,
    };

    onFinish(matchResult);
  };

  // Undo Last Visit
  const handleUndo = () => {
    if (matchHistoryRef.current.length === 0 || isBotThrowing) return;
    sound.tap();

    // In bot match mode, if it's currently player's turn, the last record was the bot's throw
    // and before that was the player's throw that prompted it.
    // We want to undo the entire round back to before the player's mistaken throw.
    const history = matchHistoryRef.current;
    if (history.length === 0) return;

    const lastRecord = history[history.length - 1];

    if (matchMode === 'bot') {
      // If the last record was by bot (meaning bot took its turn after player),
      // we need to undo BOTH bot's turn and player's preceding turn so player can re-enter.
      if (lastRecord.thrower === 'bot' && history.length >= 2 && history[history.length - 2].thrower === 'player') {
        const playerRecord = history[history.length - 2];
        const newHistory = history.slice(0, -2);
        matchHistoryRef.current = newHistory;
        setMatchHistory(newHistory);

        // Revert Bot stats & score
        botScoreRef.current = lastRecord.startScore;
        setBotScore(lastRecord.startScore);
        setBotTotalVisits((prev) => Math.max(0, prev - 1));
        setBotTotalDarts((prev) => Math.max(0, prev - lastRecord.darts.length));
        setBotTotalPoints((prev) => Math.max(0, prev - lastRecord.pointsScored));
        const newBotLegDarts = Math.max(0, botLegDartsRef.current - lastRecord.darts.length);
        botLegDartsRef.current = newBotLegDarts;
        setBotLegDarts(newBotLegDarts);

        // Revert Player stats & score
        playerScoreRef.current = playerRecord.startScore;
        setPlayerScore(playerRecord.startScore);
        const dartsThrownInVisit =
          playerRecord.darts && playerRecord.darts.length > 0
            ? (playerRecord.darts[0].startsWith('1d') ? 1 : playerRecord.darts[0].startsWith('2d') ? 2 : playerRecord.darts[0].startsWith('3d') ? 3 : 3)
            : 3;
        setPlayerTotalVisits((prev) => Math.max(0, prev - 1));
        setPlayerTotalDarts((prev) => Math.max(0, prev - dartsThrownInVisit));
        setPlayerTotalPoints((prev) => Math.max(0, prev - playerRecord.pointsScored));
        const newPlayerLegDarts = Math.max(0, playerLegDartsRef.current - dartsThrownInVisit);
        playerLegDartsRef.current = newPlayerLegDarts;
        setPlayerLegDarts(newPlayerLegDarts);
        storage.recordDartsThrown(-dartsThrownInVisit);

        setActiveThrower('player');
        setAnnouncement(null);
        return;
      }
    }

    // Standard single-visit undo fallback (solo mode or first throw)
    const newHistory = history.slice(0, -1);
    matchHistoryRef.current = newHistory;
    setMatchHistory(newHistory);

    if (lastRecord.thrower === 'bot') {
      botScoreRef.current = lastRecord.startScore;
      setBotScore(lastRecord.startScore);
      setActiveThrower('bot');
      setBotTotalVisits((prev) => Math.max(0, prev - 1));
      setBotTotalDarts((prev) => Math.max(0, prev - lastRecord.darts.length));
      setBotTotalPoints((prev) => Math.max(0, prev - lastRecord.pointsScored));
      const newBotLegDarts = Math.max(0, botLegDartsRef.current - lastRecord.darts.length);
      botLegDartsRef.current = newBotLegDarts;
      setBotLegDarts(newBotLegDarts);
    } else {
      playerScoreRef.current = lastRecord.startScore;
      setPlayerScore(lastRecord.startScore);
      setActiveThrower('player');
      const dartsThrownInVisit =
        lastRecord.darts && lastRecord.darts.length > 0
          ? (lastRecord.darts[0].startsWith('1d') ? 1 : lastRecord.darts[0].startsWith('2d') ? 2 : lastRecord.darts[0].startsWith('3d') ? 3 : 3)
          : 3;
      setPlayerTotalVisits((prev) => Math.max(0, prev - 1));
      setPlayerTotalDarts((prev) => Math.max(0, prev - dartsThrownInVisit));
      setPlayerTotalPoints((prev) => Math.max(0, prev - lastRecord.pointsScored));
      const newPlayerLegDarts = Math.max(0, playerLegDartsRef.current - dartsThrownInVisit);
      playerLegDartsRef.current = newPlayerLegDarts;
      setPlayerLegDarts(newPlayerLegDarts);
      storage.recordDartsThrown(-dartsThrownInVisit);
    }
  };

  // -------------------------------------------------------------
  // RENDER: PRE-GAME SETUP SCREEN
  // -------------------------------------------------------------
  if (inSetup) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-5 animate-in fade-in duration-200">
        {/* Header Banner & Mode Switcher */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-inner">
              {matchMode === 'bot' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6 text-emerald-400" />}
            </div>
            <div>
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                {matchMode === 'bot' ? 'Match Play vs AI DartBot' : 'Solo Leg Practice'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {matchMode === 'bot' ? 'X01 vs AI DartBot' : 'X01 Solo Practice'}
              </h2>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-neutral-950/70 p-1.5 rounded-2xl border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                sound.tap();
                setMatchMode('bot');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                matchMode === 'bot'
                  ? 'bg-rose-500 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>VS DARTBOT AI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.tap();
                setMatchMode('solo');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                matchMode === 'solo'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <User className="w-4 h-4" />
              <span>SOLO PRACTICE</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            {matchMode === 'bot'
              ? 'Play 501/301 legs against an AI opponent with realistic scoring cadence and finish windows.'
              : 'Throw legs alone at your own pace with live 3-dart averages, first-9 stats, and checkout guidance.'}
          </p>
        </div>

        {/* Setup Configuration Form */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xl">
          {/* 1. Game Type / Starting Score */}
          <div>
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
              Game Format (Starting Score)
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[501, 301, 701].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStartingScore(s)}
                  className={`py-3 rounded-2xl font-mono font-black text-lg border transition-all active:scale-95 cursor-pointer ${
                    startingScore === s
                      ? matchMode === 'bot'
                        ? 'bg-rose-500 text-neutral-950 border-rose-400 shadow-md'
                        : 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-md'
                      : 'bg-neutral-800/80 text-neutral-300 hover:text-white border-neutral-700/80 hover:bg-neutral-750'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Match Length (First to X Legs - up to 10) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                Match Length (First To)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {legsToWin === 1 ? 'Single Leg (1)' : `First to ${legsToWin} Legs`}
              </span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setLegsToWin(num)}
                  className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 cursor-pointer text-center ${
                    legsToWin === num
                      ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-xs font-black ring-1 ring-emerald-300'
                      : 'bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700 hover:bg-neutral-750'
                  }`}
                >
                  {num === 1 ? '1' : `${num}`}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Bot Settings (Only shown in Bot mode) */}
          {matchMode === 'bot' && (
            <>
              {/* DartBot Level Slider */}
              <div className="bg-neutral-850/80 border border-neutral-750 rounded-2xl p-4 sm:p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-rose-400" />
                      <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                        DartBot Level (Finish Visit)
                      </label>
                    </div>
                    <span className="font-mono text-rose-400 text-base font-black">
                      Level {botLevel} / 10
                    </span>
                  </div>

                  {/* Interactive Range Slider */}
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={botLevel}
                    onChange={(e) => handleLevelSelect(Number(e.target.value))}
                    className="w-full h-2.5 bg-neutral-750 rounded-lg appearance-none cursor-pointer accent-rose-500 my-2"
                  />

                  {/* Quick Level Selector Pills */}
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 mt-2">
                    {DARTBOT_LEVELS.map((lvl) => {
                      const isSel = botLevel === lvl.level;
                      return (
                        <button
                          key={lvl.level}
                          type="button"
                          onClick={() => handleLevelSelect(lvl.level)}
                          className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
                            isSel
                              ? 'bg-rose-500 text-neutral-950 shadow-md ring-1 ring-rose-400'
                              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-750 border border-neutral-700/50'
                          }`}
                        >
                          L{lvl.level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Level Visual Card */}
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3 shadow-inner">
                  <span className="text-2xl mt-0.5">{levelInfo.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <b className="text-sm text-white font-bold">{levelInfo.name}</b>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-bold font-mono">
                          Avg {levelInfo.targetAvgMin}–{levelInfo.targetAvgMax}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px] font-bold font-mono">
                          Visits {levelInfo.minVisit}–{levelInfo.maxVisit}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 leading-snug">
                      {levelInfo.description} (approx. <b className="text-neutral-200">{levelInfo.minDarts}–{levelInfo.maxDarts} darts</b> in 501).
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkout % Adjustment Slider */}
              <div className="bg-neutral-850/80 border border-neutral-750 rounded-2xl p-4 sm:p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-cyan-400" />
                      <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                        Double Checkout Accuracy
                      </label>
                    </div>
                    <span className="font-mono text-cyan-400 text-base font-black">
                      {botCheckoutPct}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="1"
                    value={botCheckoutPct}
                    onChange={(e) => setBotCheckoutPct(Number(e.target.value))}
                    className="w-full h-2.5 bg-neutral-750 rounded-lg appearance-none cursor-pointer accent-cyan-500 my-2"
                  />

                  <div className="flex items-center justify-between gap-1.5 mt-2">
                    {[15, 25, 36, 50, 75].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setBotCheckoutPct(pct)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
                          botCheckoutPct === pct
                            ? 'bg-cyan-500 text-neutral-950 shadow-md ring-1 ring-cyan-400'
                            : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-750 border border-neutral-700/50'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Who Throws First & Speed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                    First Throw (Leg 1)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'player', label: 'You' },
                      { id: 'bot', label: 'DartBot' },
                      { id: 'random', label: 'Coin Toss' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFirstThrower(t.id as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                          firstThrower === t.id
                            ? 'bg-neutral-700 text-white border-neutral-500 font-black'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700/60'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                    DartBot Pace
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { ms: 400, label: 'Fast (0.4s)' },
                      { ms: 1000, label: 'Normal (1s)' },
                      { ms: 1800, label: 'Oche (1.8s)' },
                    ].map((s) => (
                      <button
                        key={s.ms}
                        type="button"
                        onClick={() => setBotSpeedMs(s.ms)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                          botSpeedMs === s.ms
                            ? 'bg-neutral-700 text-white border-neutral-500 font-black'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700/60'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Launch CTA */}
          <button
            type="button"
            id="start-dartbot-match-btn"
            onClick={handleStartMatch}
            className={`w-full py-4 active:scale-[0.98] text-neutral-950 font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
              matchMode === 'bot' ? 'bg-rose-500 hover:bg-rose-400' : 'bg-emerald-500 hover:bg-emerald-400'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>
              START {startingScore} MATCH ({matchMode === 'solo' ? 'SOLO PRACTICE' : `VS ${levelInfo.name}`})
            </span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: LIVE MATCH SCOREBOARD
  // -------------------------------------------------------------
  const currentLegVisits = matchHistory.filter((v) => v.legNumber === currentLeg);
  const playerLegVisits = currentLegVisits.filter((v) => v.thrower === 'player');
  const botLegVisits = currentLegVisits.filter((v) => v.thrower === 'bot');

  const playerLegPoints = playerLegVisits.reduce((sum, v) => sum + (v.isBust ? 0 : v.pointsScored), 0);
  const playerLegAvg = playerLegDarts > 0 ? Number(((playerLegPoints / playerLegDarts) * 3).toFixed(2)) : playerAvg;

  const botLegPoints = botLegVisits.reduce((sum, v) => sum + (v.isBust ? 0 : v.pointsScored), 0);
  const botLegAvg = botLegDarts > 0 ? Number(((botLegPoints / botLegDarts) * 3).toFixed(2)) : botAvg;

  // Build rounds for the 3-column visit tracker table
  const maxVisitsInLeg = Math.max(playerLegVisits.length, botLegVisits.length);
  const minRowsToDisplay = Math.max(4, maxVisitsInLeg);
  const displayRows: {
    roundIndex: number;
    dartNumber: number;
    playerScore?: number;
    playerEndScore?: number;
    botScore?: number;
    botEndScore?: number;
    playerIsBust?: boolean;
    botIsBust?: boolean;
    playerIsCheckout?: boolean;
    botIsCheckout?: boolean;
  }[] = [];

  for (let i = 0; i < minRowsToDisplay; i++) {
    const p = playerLegVisits[i];
    const b = botLegVisits[i];
    displayRows.push({
      roundIndex: i + 1,
      dartNumber: (i + 1) * 3,
      playerScore: p ? (p.isBust ? 0 : p.pointsScored) : undefined,
      playerEndScore: p?.endScore,
      botScore: b ? (b.isBust ? 0 : b.pointsScored) : undefined,
      botEndScore: b?.endScore,
      playerIsBust: p?.isBust,
      botIsBust: b?.isBust,
      playerIsCheckout: p?.isCheckout,
      botIsCheckout: b?.isCheckout,
    });
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col space-y-2.5 sm:space-y-3.5 select-none">
      {/* Sleek Integrated Top Header & Match Scoreline Bar */}
      <div className="bg-[#121519] border border-[#232930] rounded-xl px-3 py-2 flex items-center justify-between shadow-xs text-xs font-mono">
        {/* Left: Exit + Match Mode */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInSetup(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg bg-[#1a1e24] border border-[#28303a] transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-white font-black text-sm">{startingScore}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-300 text-xs">
              {matchMode === 'bot' ? `L${currentLeg} (F${legsToWin})` : `L${currentLeg}`}
            </span>
          </div>
        </div>

        {/* Center: Legs Scoreline [ 0 S/L 0 ] or Solo Leg Counter */}
        {matchMode === 'bot' ? (
          <div className="bg-[#1a1f26] border border-[#2c3540] rounded-xl px-3 py-1 flex items-center gap-2.5 font-bold shadow-xs">
            <span className="text-base text-emerald-400 leading-none">{playerLegs}</span>
            <span className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase">S/L</span>
            <span className="text-base text-rose-400 leading-none">{botLegs}</span>
          </div>
        ) : (
          <div className="bg-[#1a1f26] border border-[#2c3540] rounded-xl px-3 py-1 flex items-center gap-1.5 font-bold shadow-xs text-xs">
            <span className="text-emerald-400 font-black text-sm">{playerLegs}</span>
            <span className="text-neutral-300 text-xs">/ {legsToWin} Legs</span>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowMatchLog(!showMatchLog)}
            title="Match Ledger"
            className="p-1.5 rounded-lg bg-[#1a1e24] hover:bg-[#222830] text-neutral-400 hover:text-white border border-[#28303a] transition-all active:scale-95 cursor-pointer"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setInSetup(true)}
            title="Settings"
            className="p-1.5 rounded-lg bg-[#1a1e24] hover:bg-[#222830] text-neutral-400 hover:text-white border border-[#28303a] transition-all active:scale-95 cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scoreboard Layout: Solo (1-player) vs Bot (2-player) */}
      {matchMode === 'solo' ? (
        <>
          {/* SOLO 1-PLAYER SCOREBOARD (matching 301 Solo Practice from Guide) */}
          <div className="bg-[#121519] border border-[#232930] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-center shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[190px] sm:min-h-[220px]">
          {/* Header Badges */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-neutral-400 mb-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-emerald-400 font-black text-xs sm:text-sm">
                <User className="w-4 h-4" /> {activeAccount.name || 'YOU'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-850 border border-neutral-750 text-neutral-300 font-mono text-xs">
                Leg #{currentLeg} {legsToWin > 1 ? `(First to ${legsToWin})` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {playerLegs > 0 && (
                <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {playerLegs} Won
                </span>
              )}
              <span className="text-neutral-400 text-xs sm:text-sm font-mono">
                Dart #{playerLegDarts + 1}
              </span>
            </div>
          </div>

          {/* Big Remaining Score Display */}
          <div className="my-2 sm:my-3 flex flex-col items-center justify-center">
            <div
              className={`text-6xl sm:text-8xl md:text-9xl font-mono font-black tracking-tight leading-none drop-shadow-md ${
                playerScore <= 170 ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {playerScore}
            </div>
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">
              Points Remaining
            </span>
          </div>

          {/* Suggested Checkout Guide (if on finish) */}
          {playerCheckout ? (
            <div className="mt-2 bg-emerald-950/60 border border-emerald-800/70 rounded-xl p-2.5 flex items-center justify-between px-3 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>Checkout Route:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white bg-emerald-900/80 px-2.5 py-1 rounded border border-emerald-700 text-xs sm:text-sm">
                  {playerCheckout}
                </span>
                {onOpenCheckoutAi && (
                  <button
                    type="button"
                    onClick={() => onOpenCheckoutAi(playerScore)}
                    className="text-xs text-emerald-300 underline hover:text-white transition-colors cursor-pointer"
                  >
                    AI Guide
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-5 flex items-center justify-center mt-1">
              <span className="text-xs text-neutral-500 font-medium leading-none">Scoring Mode</span>
            </div>
          )}

          {/* Bottom Live Stats Strip */}
          <div className="border-t border-[#232930] pt-2.5 mt-2.5 grid grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className="bg-[#181d22] p-2 rounded-xl border border-[#20272f]">
              <span className="text-[10px] text-neutral-400 block font-sans uppercase font-bold">Leg Avg</span>
              <b className="text-white text-xs sm:text-sm">{playerLegAvg.toFixed(1)}</b>
            </div>
            <div className="bg-[#181d22] p-2 rounded-xl border border-[#20272f]">
              <span className="text-[10px] text-neutral-400 block font-sans uppercase font-bold">Match Avg</span>
              <b className="text-emerald-400 text-xs sm:text-sm">{playerAvg.toFixed(1)}</b>
            </div>
            <div className="bg-[#181d22] p-2 rounded-xl border border-[#20272f]">
              <span className="text-[10px] text-neutral-400 block font-sans uppercase font-bold">First 9</span>
              <b className="text-cyan-400 text-xs sm:text-sm">{playerFirst9Avg.toFixed(1)}</b>
            </div>
            <div className="bg-[#181d22] p-2 rounded-xl border border-[#20272f]">
              <span className="text-[10px] text-neutral-400 block font-sans uppercase font-bold">Double %</span>
              <b className="text-amber-400 text-xs sm:text-sm">{playerDblPct.toFixed(1)}%</b>
            </div>
          </div>
        </div>

        {/* Solo Visit History Table */}
        <div className="bg-[#121519] border border-[#232930] rounded-2xl p-2.5 sm:p-3 shadow-md">
          {/* Table Header */}
          <div className="grid grid-cols-3 text-center text-xs font-bold text-neutral-400 border-b border-[#232930] pb-1.5 leading-none uppercase tracking-wider">
            <span className="text-neutral-400 font-semibold">ROUND</span>
            <span className="text-emerald-400 font-black">VISIT SCORE</span>
            <span className="text-cyan-400 font-black">POINTS LEFT</span>
          </div>

          {/* Visits List */}
          <div className="space-y-1.5 pt-2 max-h-[175px] sm:max-h-[210px] overflow-y-auto pr-0.5">
            {displayRows.map((row) => (
              <div
                key={row.roundIndex}
                className="grid grid-cols-3 items-center text-center text-xs sm:text-sm font-mono py-1.5 px-2 rounded-xl bg-[#181d22]/90 border border-[#20272f] shadow-xs"
              >
                <div className="flex items-center justify-center">
                  <span className="text-[11px] text-neutral-400 font-bold px-2 py-0.5 rounded-full bg-[#101317] border border-[#232930]">
                    R{row.roundIndex} <span className="text-neutral-500 font-normal">· {row.dartNumber}d</span>
                  </span>
                </div>

                <div className="flex items-center justify-center">
                  {row.playerScore !== undefined ? (
                    row.playerIsBust ? (
                      <span className="font-bold text-rose-400 text-xs px-1.5 py-0.5 bg-rose-950/60 rounded border border-rose-800/50">
                        BUST
                      </span>
                    ) : row.playerIsCheckout ? (
                      <span className="font-black text-emerald-400 text-xs sm:text-sm bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-700">
                        🎯 {row.playerScore} (CHECKOUT)
                      </span>
                    ) : (
                      <span
                        className={`font-black text-sm sm:text-base ${
                          row.playerScore === 180
                            ? 'text-amber-300 font-mono scale-105'
                            : row.playerScore >= 100
                            ? 'text-emerald-400'
                            : 'text-white'
                        }`}
                      >
                        {row.playerScore}
                      </span>
                    )
                  ) : (
                    <span className="text-neutral-600 font-bold text-sm">—</span>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  {row.playerEndScore !== undefined ? (
                    <span className="font-black text-sm text-cyan-300 font-mono">
                      {row.playerEndScore}
                    </span>
                  ) : (
                    <span className="text-neutral-600 font-bold text-sm">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
      ) : (
        /* 2-PLAYER VS BOT SCORE CARDS */
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* PLAYER 1 / YOU */}
            <div
              className={`rounded-2xl p-3 sm:p-4 transition-all relative overflow-hidden flex flex-col justify-between min-h-[160px] sm:min-h-[185px] ${
                activeThrower === 'player' && !legWinBanner && !matchWinner
                  ? 'bg-[#121519] border-2 border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                  : 'bg-[#121519] border border-[#232930] opacity-85'
              }`}
            >
              {/* Card Top: Active Play Triangle & Player Number */}
              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 leading-none">
                <div className="flex items-center gap-1.5 text-white min-w-0">
                  {activeThrower === 'player' && (
                    <span className="text-emerald-400 text-xs animate-pulse font-black">▶</span>
                  )}
                  <PlayerAvatar
                    photoUrl={activeAccount.photoUrl}
                    avatarEmoji={activeAccount.avatarEmoji}
                    name={activeAccount.name}
                    size="sm"
                  />
                  <span className="text-xs sm:text-sm text-white font-bold truncate max-w-[90px] sm:max-w-[120px]">
                    {activeAccount.name || 'YOU'}
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                  {playerLegDarts}d
                </span>
              </div>

              {/* Bold Large Score */}
              <div className="text-center my-2 sm:my-3">
                <span
                  className={`text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight block leading-none drop-shadow-sm ${
                    playerScore <= 170 ? 'text-emerald-400' : 'text-white'
                  }`}
                >
                  {playerScore}
                </span>

                {/* Tactical Outshot Route directly below score */}
                <div className="h-5 flex items-center justify-center mt-1.5">
                  {playerCheckout ? (
                    <button
                      type="button"
                      onClick={() => onOpenCheckoutAi && onOpenCheckoutAi(playerScore)}
                      className="text-xs sm:text-sm font-bold font-mono text-emerald-300 hover:text-emerald-200 truncate cursor-pointer leading-none bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded"
                    >
                      {playerCheckout}
                    </button>
                  ) : (
                    <span className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-none">Scoring</span>
                  )}
                </div>
              </div>

              {/* Bottom Avg: Leg Avg / Match Avg */}
              <div className="border-t border-[#232930] pt-1.5 text-center text-xs font-mono text-neutral-300 leading-none">
                Avg. <b className="text-white text-xs sm:text-sm">{playerLegAvg.toFixed(1)}</b> / <span className="text-neutral-400">{playerAvg.toFixed(1)}</span>
              </div>
            </div>

            {/* PLAYER 2 / BOT */}
            <div
              className={`rounded-2xl p-3 sm:p-4 transition-all relative overflow-hidden flex flex-col justify-between min-h-[160px] sm:min-h-[185px] ${
                activeThrower === 'bot' && !legWinBanner && !matchWinner
                  ? 'bg-[#121519] border-2 border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                  : 'bg-[#121519] border border-[#232930] opacity-85'
              }`}
            >
              {/* Card Top: Active Play Triangle & Player Number */}
              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 leading-none">
                <div className="flex items-center gap-1.5 text-white">
                  {activeThrower === 'bot' && (
                    <span className="text-emerald-400 text-xs animate-pulse font-black">▶</span>
                  )}
                  <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-black text-neutral-300">
                    2
                  </div>
                  <span className="text-xs sm:text-sm text-neutral-300 font-bold truncate max-w-[80px] sm:max-w-[110px]">
                    {levelInfo.name}
                  </span>
                </div>
                <span className="text-xs font-mono text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/40">
                  {botLegDarts}d
                </span>
              </div>

              {/* Bold Large Score */}
              <div className="text-center my-2 sm:my-3">
                <span
                  className={`text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight block leading-none drop-shadow-sm ${
                    botScore <= 170 ? 'text-rose-400' : 'text-white'
                  }`}
                >
                  {botScore}
                </span>

                {/* Tactical Outshot Route directly below score */}
                <div className="h-5 flex items-center justify-center mt-1.5">
                  {isBotThrowing ? (
                    <span className="text-xs text-rose-400 font-bold animate-pulse leading-none">Throwing...</span>
                  ) : botCheckout ? (
                    <span className="text-xs sm:text-sm font-bold font-mono text-rose-300 truncate leading-none bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 rounded">
                      {botCheckout}
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs text-neutral-500 font-medium leading-none">Scoring</span>
                  )}
                </div>
              </div>

              {/* Bottom Avg: Leg Avg / Match Avg */}
              <div className="border-t border-[#232930] pt-1.5 text-center text-xs font-mono text-neutral-300 leading-none">
                Avg. <b className="text-white text-xs sm:text-sm">{botLegAvg.toFixed(1)}</b> / <span className="text-neutral-400">{botAvg.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* 3-Column Expanded Visit History Table */}
          <div className="bg-[#121519] border border-[#232930] rounded-2xl p-2.5 sm:p-3 shadow-md">
            {/* Table Header */}
            <div className="grid grid-cols-3 text-center text-xs font-bold text-neutral-400 border-b border-[#232930] pb-1.5 leading-none uppercase tracking-wider">
              <span className="text-emerald-400 font-black">YOU (VISIT)</span>
              <span className="text-neutral-400 font-semibold">ROUND</span>
              <span className="text-rose-400 font-black">{levelInfo.name}</span>
            </div>

            {/* Visits List */}
            <div className="space-y-1.5 pt-2 max-h-[175px] sm:max-h-[210px] overflow-y-auto pr-0.5">
              {displayRows.map((row) => (
                <div
                  key={row.roundIndex}
                  className="grid grid-cols-3 items-center text-center text-xs sm:text-sm font-mono py-1.5 px-2 rounded-xl bg-[#181d22]/90 border border-[#20272f] shadow-xs"
                >
                  {/* YOU VISIT SCORE */}
                  <div className="flex items-center justify-center gap-1">
                    {row.playerScore !== undefined ? (
                      row.playerIsBust ? (
                        <span className="font-bold text-rose-400 text-xs px-1.5 py-0.5 bg-rose-950/60 rounded border border-rose-800/50">
                          BUST
                        </span>
                      ) : row.playerIsCheckout ? (
                        <span className="font-black text-emerald-400 text-xs sm:text-sm bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-700">
                          🎯 {row.playerScore}
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`font-black text-sm sm:text-base ${
                              row.playerScore === 180
                                ? 'text-amber-300 font-mono scale-105'
                                : row.playerScore >= 100
                                ? 'text-emerald-400'
                                : 'text-white'
                            }`}
                          >
                            {row.playerScore}
                          </span>
                          {row.playerEndScore !== undefined && (
                            <span className="text-[10px] text-neutral-400 font-sans">
                              ({row.playerEndScore})
                            </span>
                          )}
                        </div>
                      )
                    ) : (
                      <span className="text-neutral-600 font-bold text-sm">—</span>
                    )}
                  </div>

                  {/* ROUND / DARTS BADGE */}
                  <div className="flex items-center justify-center">
                    <span className="text-[11px] text-neutral-400 font-bold px-2 py-0.5 rounded-full bg-[#101317] border border-[#232930]">
                      R{row.roundIndex} <span className="text-neutral-500 font-normal">· {row.dartNumber}d</span>
                    </span>
                  </div>

                  {/* BOT VISIT SCORE */}
                  <div className="flex items-center justify-center gap-1">
                    {row.botScore !== undefined ? (
                      row.botIsBust ? (
                        <span className="font-bold text-rose-400 text-xs px-1.5 py-0.5 bg-rose-950/60 rounded border border-rose-800/50">
                          BUST
                        </span>
                      ) : row.botIsCheckout ? (
                        <span className="font-black text-rose-400 text-xs sm:text-sm bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-700">
                          🎯 {row.botScore}
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`font-black text-sm sm:text-base ${
                              row.botScore === 180
                                ? 'text-amber-300 font-mono scale-105'
                                : row.botScore >= 100
                                ? 'text-rose-300'
                                : 'text-neutral-200'
                            }`}
                          >
                            {row.botScore}
                          </span>
                          {row.botEndScore !== undefined && (
                            <span className="text-[10px] text-neutral-400 font-sans">
                              ({row.botEndScore})
                            </span>
                          )}
                        </div>
                      )
                    ) : (
                      <span className="text-neutral-600 font-bold text-sm">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Turn Banner / Winner Notification */}
      {legWinBanner ? (
        <div className="bg-emerald-950/80 border border-emerald-700 rounded-xl p-2.5 text-center shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <b className="text-xs text-white block">
                  {legWinBanner.winner === 'player' ? '🎉 YOU WON LEG ' + currentLeg : `👑 ${levelInfo.name} WON LEG ${currentLeg}`}
                </b>
                <span className="text-[11px] text-neutral-300">
                  Checked out {legWinBanner.checkoutScore} in {legWinBanner.darts} darts.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleProceedToNextLeg}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs rounded-lg shadow-md flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>NEXT LEG</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : matchWinner ? (
        <div className="bg-amber-950/80 border border-amber-700 rounded-xl p-2.5 text-center shadow-lg">
          <b className="text-sm text-amber-400 block font-black">
            {matchWinner === 'player' ? '🏆 MATCH VICTORY!' : `👑 ${levelInfo.name} WINS MATCH`}
          </b>
          <span className="text-xs text-neutral-300">
            Final Score: You {playerLegs} – {botLegs} {levelInfo.name}
          </span>
        </div>
      ) : null}

      {/* 5-Column Darts Keypad matching screenshots */}
      {!legWinBanner && !matchWinner && (
        <div className={`transition-opacity ${activeThrower !== 'player' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <DartsMatchKeypad
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handlePlayerSubmit}
            onUndo={handleUndo}
            canUndo={matchHistory.length > 0}
            remainingScore={playerScore}
            disabled={activeThrower !== 'player' || isBotThrowing}
          />
        </div>
      )}

      {/* Match Log Ledger Modal */}
      {showMatchLog && (
        <div className="bg-[#121519] border border-[#232930] rounded-3xl p-5 shadow-2xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#232930] pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-neutral-400" />
              <b className="text-sm text-white">Match Throw Ledger</b>
            </div>
            <button
              type="button"
              onClick={() => setShowMatchLog(false)}
              className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg bg-[#1a1e24]"
            >
              Close
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {matchHistory.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-4">No visits thrown yet.</p>
            ) : (
              matchHistory
                .slice()
                .reverse()
                .map((v, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-mono border ${
                      v.thrower === 'player'
                        ? 'bg-[#1a1e24] border-[#28303a] text-neutral-200'
                        : 'bg-[#181d22] border-[#222830] text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-400">
                        {v.thrower === 'player' ? 'YOU' : 'BOT'}
                      </span>
                      <span className="text-neutral-500">
                        {v.startScore} → {v.endScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">[{v.darts.join(', ')}]</span>
                      <b className="text-white">+{v.pointsScored}</b>
                      {v.isCheckout && <span className="text-emerald-400 font-bold">🎯 CHECKOUT</span>}
                      {v.isBust && <span className="text-rose-400 font-bold">BUST</span>}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Checkout Darts Confirmation Modal (matching Screenshot 1) */}
      <CheckoutDartsModal
        isOpen={isCheckoutModalOpen}
        onConfirm={handleConfirmCheckoutDarts}
        onCancel={() => {
          setIsCheckoutModalOpen(false);
          setPendingCheckoutVisit(null);
        }}
      />

      {/* Darts at Double Accuracy Modal (for double attempts) */}
      <DartsAtDoubleModal
        isOpen={pendingPlayerVisit !== null}
        targetScore={pendingPlayerVisit ? pendingPlayerVisit.startScore : undefined}
        isCheckedOut={pendingPlayerVisit ? pendingPlayerVisit.isCheckout : false}
        onSelect={handleSelectPlayerDartsAtDouble}
      />
    </div>
  );
};
