export type GameType =
  | 'cal'
  | 'wheel'
  | 'score'
  | 'score1'
  | 'score2'
  | '1219'
  | '12112'
  | 'catch40'
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

export type GameResultData =
  | ArmCalResult
  | WheelResult
  | HighscoreResult
  | OneTwentyOneResult
  | CatchFortyResult
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
