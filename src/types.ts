export type GameType =
  | 'cal'
  | 'wheel'
  | 'align'
  | 'score'
  | 'switchblade'
  | 'powerswitch'
  | 'bigscores'
  | '1219'
  | '12112'
  | 'catch40'
  | 'cochallenge'
  | 'boomerang'
  | 'bobs27'
  | 'a1practice'
  | 'bigsingles'
  | 'rtwsingles'
  | 'bull'
  | 'triple'
  | '301'
  | 'dartbot';

export interface GameInfo {
  id: GameType;
  title: string;
  category: 'warm' | 'score' | 'finish' | 'solo' | 'match';
  categoryLabel: string;
  durationMinutes: number | null; // null for count-up like triple lock or match
  isCountUp?: boolean;
  description: string;
  subtitle: string;
  icon: string;
}

export interface ArmCalResult {
  visits: number;
  hits: number;
  accuracy: number;
  darts: number;
}

export interface WheelResult {
  darts: number;
  hits: number;
  accuracy: number;
}

export interface AlignResult {
  visits: number;
  hits: number;
  accuracy: number;
  darts: number;
  perfectVisits: number;
}

export interface HighscoreResult {
  visits: number[];
  avg: number;
  darts: number;
  totalPoints?: number;
  bestVisit: number;
  firstNineAvg?: number | null;
  oneEighties?: number;
  tonForties?: number;
  tons?: number;
  distribution: { [bucket: string]: number };
}

export interface OneTwentyOneResult {
  highestReached: number;
  checkpoint: number;
  attempts: number;
  checkouts: number;
  bestCheckoutDarts: number | null;
  checkoutRate: number;
  dartsAtDouble?: number;
  doublesHit?: number;
  doublePercentage?: number;
}

export interface CatchFortyResult {
  highestReached: number;
  attempts: number;
  checkouts: number;
  checkoutRate: number;
  dartsAtDouble?: number;
  doublesHit?: number;
  doublePercentage?: number;
}

export interface CheckoutChallengeAttemptRecord {
  target: number;
  result: 'hit' | 'miss';
  dartsUsed: number;
  nextTarget: number;
  checkoutRoute?: string;
}

export interface CheckoutChallengeResult {
  startTarget: number;
  highestCheckout: number;
  attempts: number;
  checkoutsMade: number;
  checkoutRate: number;
  totalDarts: number;
  bestStreak: number;
  finalTarget: number;
  selectedDurationMinutes: number;
  history: CheckoutChallengeAttemptRecord[];
}

export interface BoomerangRoundRecord {
  round: number;
  darts: number;
  hits: number;
  accuracy: number;
  completed: boolean;
}

export interface DoublesBoomerangResult {
  roundsCompleted: number;
  totalRoundsAttempted: number;
  bestRoundDarts: number | null;
  totalDarts: number;
  totalHits: number;
  overallAccuracy: number;
  roundDetails: BoomerangRoundRecord[];
  targetStats?: Record<number, { attempts: number; hits: number }>;
}

export interface Bobs27TargetAttempt {
  target: string; // 'D1' to 'D20', 'Bull'
  doubleValue: number; // 2, 4, 6... 40, 50
  hits: number; // 0, 1, 2, 3
  scoreBefore: number;
  scoreAfter: number;
  pointsDelta: number;
}

export interface Bobs27RunRecord {
  runNumber: number;
  finalScore: number;
  completed: boolean;
  bustedAtTarget?: string | null;
  targetsAttempted: number; // out of 21
  totalDarts: number;
  totalHits: number;
  accuracy: number;
  targetHistory?: Bobs27TargetAttempt[];
}

export interface Bobs27Result {
  runsPlayed: number;
  completedRuns: number;
  bustedRuns: number;
  bestScore: number;
  averageScore: number;
  totalDarts: number;
  totalHits: number;
  overallAccuracy: number;
  highestTargetReachedOnBust?: string | null;
  runDetails: Bobs27RunRecord[];
  targetStats?: Record<string, { attempts: number; hits: number }>;
}

export interface A1PracticeResult {
  completed: boolean;
  targetsCleared: number; // e.g. 10 or more if sets rotated
  totalTargets: number; // 10 per set
  totalVisits: number;
  totalDarts: number; // totalVisits * 3
  successfulVisits: number; // hits (2 or 3 in large single)
  accuracy: number; // (successfulVisits / totalVisits) * 100
  targetStats: Record<string, { attempts: number; hits: number; completed: boolean }>;
  setsCompleted?: number;
  startingSet?: '20_11' | '1_10';
  setsClearedLabels?: string[];
}

export type BigSinglesLevel = 'intermediate' | 'advanced';

export interface BigSinglesRoundRecord {
  roundNumber: number;
  darts: number;
  hits: number;
  visits: number;
  accuracy: number;
}

export interface BigSinglesResult {
  level: BigSinglesLevel;
  completedRounds: number; // How many full 1-20 sweeps completed
  currentNumberReached: number; // 1 to 20
  highestNumberReached: number; // 1 to 20
  totalVisits: number;
  totalDarts: number; // totalVisits * 3
  totalDartHits: number; // actual individual dart hits (0 to 3 per visit)
  dartHitAccuracy: number; // (totalDartHits / totalDarts) * 100
  roundDetails?: BigSinglesRoundRecord[];
  targetStats?: Record<number, { number: number; visits: number; attempts: number; hits: number; misses: number; accuracy: number }>;
}

export type RTWSinglesDifficulty = 'intermediate' | 'advanced';

export interface RTWSinglesRunRecord {
  runNumber: number;
  completed: boolean; // true if cleared Bull
  finalTargetReached: string; // e.g. "Bull", "20", "15"
  highestTargetReached: string; // e.g. "Bull", "20"
  highestStepReached: number; // 1 to 21 (where 21 is Bull)
  dartsThrown: number;
  hits: number;
  misses: number;
  accuracy: number;
  reasonEnded?: 'cleared' | 'strikeout' | 'max_misses' | 'time_up';
}

export interface RTWSinglesResult {
  difficulty: RTWSinglesDifficulty;
  runsPlayed: number;
  completedRuns: number; // Cleared 1->20->Bull
  failedRuns: number;
  bestRunDarts: number | null; // Lowest darts to clear Bull
  highestTargetEver: string; // e.g. "Bull" or "20"
  highestStepEver: number;
  totalDarts: number;
  totalHits: number;
  totalMisses: number;
  overallAccuracy: number;
  runDetails: RTWSinglesRunRecord[];
  targetStats?: Record<string, { attempts: number; hits: number; misses: number }>;
}

export interface BullResult {
  darts: number;
  bull: number;
  twentyfive: number;
  miss: number;
  totalScore: number;
  bullRate: number;
}

export interface TripleLockResult {
  completed: boolean;
  completionTime: string;
  secondsElapsed: number;
  timeRemainingFormatted?: string;
  targetReached: string;
  lockedThrough: number | null;
  resets: number;
  bullDarts: number;
  bullHits: number;
  bullScore: number;
  totalVisits: number;
  dartsThrown: number;
  stagesCompleted: number;
  targetStats?: Record<string, { target: string; attempts: number; hits: number; misses: number; accuracy: number }>;
}

export interface Solo301Result {
  legsCompleted: number;
  totalVisits: number;
  bestLegDarts: number | null;
  totalDarts: number;
  threeDartAvg: number;
  dartsAtDouble?: number;
  doublesHit?: number;
  doublePercentage?: number;
}

export interface VisitRecord {
  legNumber: number;
  thrower: 'player' | 'bot';
  visitNumber: number;
  startScore: number;
  pointsScored: number;
  darts: string[];
  endScore: number;
  isCheckout: boolean;
  isBust: boolean;
  dartsAtDouble: number;
}

export interface LegTurnScore {
  startScore: number;
  pointsScored: number;
  endScore: number;
  dartsThrown: number;
  dartsList: string[];
  isCheckout: boolean;
  isBust: boolean;
  dartsAtDouble: number;
}

export interface LegVisitTurn {
  turnNumber: number;
  player?: LegTurnScore;
  bot?: LegTurnScore;
}

export interface LegStats {
  legNumber: number;
  winner: 'player' | 'bot';
  startedBy: 'player' | 'bot';
  playerDarts: number;
  botDarts: number;
  playerPoints: number;
  botPoints: number;
  playerAvg: number;
  botAvg: number;
  playerFirstNineAvg: number;
  botFirstNineAvg: number;
  playerCheckout?: number;
  botCheckout?: number;
  playerScoreRemaining: number;
  botScoreRemaining: number;
  playerDartsAtDouble: number;
  botDartsAtDouble: number;
  playerDoublesHit: number;
  botDoublesHit: number;
  playerHighestVisit: number;
  botHighestVisit: number;
  playerScoreline: number;
  botScoreline: number;
  turns: LegVisitTurn[];
  visits?: VisitRecord[];
}

export interface DartBotStats {
  scoreRemaining: number;
  legsWon: number;
  totalVisits: number;
  totalDarts: number;
  totalPointsScored: number;
  threeDartAvg: number;
  firstNineAvg: number;
  firstNineDartsCount: number;
  firstNinePointsScored: number;
  dartsAtDouble: number;
  doublesHit: number;
  doublePercentage: number;
  tonPlus: number;    // 100+
  tonFortyPlus: number; // 140+
  oneEighty: number;    // 180
  highestCheckout: number;
  bestLegDarts: number | null;
}

export interface DartBotMatchResult {
  winner: 'player' | 'bot';
  startingScore: number;
  legsToWin: number;
  playerLegs: number;
  botLegs: number;
  playerStats: DartBotStats;
  botStats: DartBotStats;
  botLevelLabel: string;
  botLevel?: number;
  botTargetAvg?: number;
  botCheckoutPct: number;
  legs?: LegStats[];
}

export interface SwitchbladeThrowRecord {
  cycleIndex: number;
  throwIndex: number; // 0 to 4
  targetLabel: string; // 'T20 - T20 - T20', 'T20 - T20 - T19', etc.
  targets: string[]; // ['T20', 'T20', 'T20']
  hits: ('miss' | 'single' | 'double' | 'treble')[];
  dartPoints: number[];
  totalScore: number;
}

export interface SwitchbladeTargetStats {
  target: string; // 'T20', 'T19', 'T18', 'T17', 'Bull'
  attempts: number;
  trebles: number;
  doubles: number;
  singles: number;
  misses: number;
  points: number;
  hitRate: number;
  trebleRate: number;
}

export interface SwitchbladeResult {
  totalPoints: number;
  darts: number;
  visits: number;
  cyclesCompleted: number; // Completed 5-throw full rounds
  averageScorePerVisit: number;
  dart1HitRate: number; // % times hit single/double/treble or treble
  dart2HitRate: number;
  dart3HitRate: number;
  dart1TreblePct: number;
  dart2TreblePct: number;
  dart3TreblePct: number;
  targetScores: Record<string, { totalScore: number; count: number; avgScore: number }>;
  targetStats?: Record<string, SwitchbladeTargetStats>;
  throwsHistory: SwitchbladeThrowRecord[];
  cycleScores: number[]; // total score per 5-throw cycle
}

export interface PowerSwitchTargetStats {
  target: string; // 'T20', 'T19', 'T18'
  attempts: number;
  trebles: number;
  doubles: number;
  singles: number;
  misses: number;
  points: number;
  trebleRate: number;
  hitRate: number;
}

export interface PowerSwitchVisitRecord {
  visitNumber: number;
  darts: {
    target: string; // 'T20', 'T19', 'T18'
    multiplier: 'miss' | 'single' | 'double' | 'treble';
    points: number; // 0, 1, 2, 3
  }[];
  totalPoints: number;
}

export interface PowerSwitchResult {
  totalPoints: number;
  darts: number;
  visits: number;
  pointsPerVisitAvg: number;
  trebleHits: number;
  doubleHits: number;
  singleHits: number;
  misses: number;
  trebleRate: number;
  hitRate: number;
  history: PowerSwitchVisitRecord[];
  targetStats?: Record<string, PowerSwitchTargetStats>;
}

export interface BigScoresThrowRecord {
  cycleIndex: number;
  throwIndex: number; // 0 to 4 (20, 19, 18, 17, Bull)
  targetLabel: string; // '20', '19', '18', '17', 'Bull'
  hits: ('miss' | 'single' | 'double' | 'treble')[];
  dartPoints: number[];
  totalScore: number;
}

export interface BigScoresResult {
  totalPoints: number;
  darts: number;
  visits: number;
  cyclesCompleted: number; // Completed 5-throw full rounds
  averageScorePerVisit: number;
  threeDartAvg: number;
  trebleRate: number;
  hitRate: number;
  trebleHits: number;
  doubleHits: number;
  singleHits: number;
  misses: number;
  segmentScores: Record<
    string,
    {
      totalScore: number;
      count: number;
      avgScore: number;
      hits: number;
      trebles: number;
      doubles: number;
      singles: number;
      misses: number;
    }
  >;
  throwsHistory: BigScoresThrowRecord[];
  cycleScores: number[]; // total score per 5-throw cycle
}

export type GameResultData =
  | ArmCalResult
  | WheelResult
  | AlignResult
  | HighscoreResult
  | SwitchbladeResult
  | PowerSwitchResult
  | BigScoresResult
  | OneTwentyOneResult
  | CatchFortyResult
  | CheckoutChallengeResult
  | DoublesBoomerangResult
  | Bobs27Result
  | A1PracticeResult
  | BigSinglesResult
  | RTWSinglesResult
  | BullResult
  | TripleLockResult
  | Solo301Result
  | DartBotMatchResult;

export interface UserAccount {
  id: string;
  name: string;
  email?: string;
  avatarEmoji?: string;
  photoUrl?: string; // Custom uploaded profile photo (data URL or cloud photo URL)
  pinCode?: string; // Optional 4-digit PIN for device/profile protection
  isGuest?: boolean;
  isCloudUser?: boolean;
  cloudUid?: string;
  lastSyncedAt?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface SessionHistoryItem {
  id: string;
  accountId?: string;
  gameType: GameType;
  gameTitle: string;
  date: string;
  durationSeconds: number;
  result: GameResultData;
}

export interface DailyDartRecord {
  date: string; // YYYY-MM-DD
  count: number;
  notes?: string;
}
