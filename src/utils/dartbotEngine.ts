import { getCheckoutRoute } from './checkouts';

export interface DartBotLevel {
  level: number;
  minVisit: number; // for 501
  maxVisit: number; // for 501
  targetAvgMin: number;
  targetAvgMax: number;
  targetAvg: number;
  name: string;
  avatar: string;
  badge: string;
  description: string;
  defaultCheckoutPct: number;
  minDarts: number;
  maxDarts: number;
  trebleProb: number; // Base T20 hit rate
  singleProb: number; // Base S20 hit rate
  neighborProb: number; // Miss into S1 or S5
  missProb: number; // Off-board miss
}

export const DARTBOT_LEVELS: DartBotLevel[] = [
  {
    level: 1,
    minVisit: 13,
    maxVisit: 14,
    targetAvgMin: 35,
    targetAvgMax: 42,
    targetAvg: 38,
    name: 'Level 1 · Beginner',
    avatar: '🌱',
    badge: 'Avg 35–42 · Visits 13–14 (37–42 darts)',
    description: 'Beginner standard. Averages 35–42, finishes in 37–42 darts (visits 13–14).',
    defaultCheckoutPct: 15,
    minDarts: 37,
    maxDarts: 42,
    trebleProb: 0.02,
    singleProb: 0.45,
    neighborProb: 0.40,
    missProb: 0.13,
  },
  {
    level: 2,
    minVisit: 12,
    maxVisit: 13,
    targetAvgMin: 42,
    targetAvgMax: 48,
    targetAvg: 45,
    name: 'Level 2 · Novice',
    avatar: '🎯',
    badge: 'Avg 42–48 · Visits 12–13 (34–39 darts)',
    description: 'Pub newcomer. Averages 42–48, finishes in 34–39 darts (visits 12–13).',
    defaultCheckoutPct: 18,
    minDarts: 34,
    maxDarts: 39,
    trebleProb: 0.04,
    singleProb: 0.52,
    neighborProb: 0.36,
    missProb: 0.08,
  },
  {
    level: 3,
    minVisit: 11,
    maxVisit: 12,
    targetAvgMin: 48,
    targetAvgMax: 54,
    targetAvg: 51,
    name: 'Level 3 · Casual',
    avatar: '🎲',
    badge: 'Avg 48–54 · Visits 11–12 (31–36 darts)',
    description: 'Regular casual player. Averages 48–54, finishes in 31–36 darts (visits 11–12).',
    defaultCheckoutPct: 22,
    minDarts: 31,
    maxDarts: 36,
    trebleProb: 0.06,
    singleProb: 0.58,
    neighborProb: 0.31,
    missProb: 0.05,
  },
  {
    level: 4,
    minVisit: 10,
    maxVisit: 11,
    targetAvgMin: 54,
    targetAvgMax: 60,
    targetAvg: 57,
    name: 'Level 4 · Pub Regular',
    avatar: '🍺',
    badge: 'Avg 54–60 · Visits 10–11 (28–33 darts)',
    description: 'Pub league regular. Averages 54–60, finishes in 28–33 darts (visits 10–11).',
    defaultCheckoutPct: 26,
    minDarts: 28,
    maxDarts: 33,
    trebleProb: 0.09,
    singleProb: 0.62,
    neighborProb: 0.26,
    missProb: 0.03,
  },
  {
    level: 5,
    minVisit: 9,
    maxVisit: 10,
    targetAvgMin: 60,
    targetAvgMax: 66,
    targetAvg: 63,
    name: 'Level 5 · Club Player',
    avatar: '⚡',
    badge: 'Avg 60–66 · Visits 9–10 (25–30 darts)',
    description: 'Club competitor. Averages 60–66, finishes in 25–30 darts (visits 9–10).',
    defaultCheckoutPct: 30,
    minDarts: 25,
    maxDarts: 30,
    trebleProb: 0.12,
    singleProb: 0.65,
    neighborProb: 0.21,
    missProb: 0.02,
  },
  {
    level: 6,
    minVisit: 8,
    maxVisit: 9,
    targetAvgMin: 66,
    targetAvgMax: 72,
    targetAvg: 69,
    name: 'Level 6 · Superleague',
    avatar: '🔥',
    badge: 'Avg 66–72 · Visits 8–9 (22–27 darts)',
    description: 'Superleague standard. Averages 66–72, finishes in 22–27 darts (visits 8–9).',
    defaultCheckoutPct: 36,
    minDarts: 22,
    maxDarts: 27,
    trebleProb: 0.15,
    singleProb: 0.68,
    neighborProb: 0.16,
    missProb: 0.01,
  },
  {
    level: 7,
    minVisit: 7,
    maxVisit: 8,
    targetAvgMin: 72,
    targetAvgMax: 80,
    targetAvg: 76,
    name: 'Level 7 · County Pro',
    avatar: '🚀',
    badge: 'Avg 72–80 · Visits 7–8 (19–24 darts)',
    description: 'County A-team standard. Averages 72–80, finishes in 19–24 darts (visits 7–8).',
    defaultCheckoutPct: 44,
    minDarts: 19,
    maxDarts: 24,
    trebleProb: 0.19,
    singleProb: 0.69,
    neighborProb: 0.11,
    missProb: 0.01,
  },
  {
    level: 8,
    minVisit: 6,
    maxVisit: 7,
    targetAvgMin: 80,
    targetAvgMax: 88,
    targetAvg: 84,
    name: 'Level 8 · Semi-Pro',
    avatar: '⚔️',
    badge: 'Avg 80–88 · Visits 6–7 (16–21 darts)',
    description: 'Semi-pro / Q-School standard. Averages 80–88, finishes in 16–21 darts (visits 6–7).',
    defaultCheckoutPct: 52,
    minDarts: 16,
    maxDarts: 21,
    trebleProb: 0.24,
    singleProb: 0.68,
    neighborProb: 0.07,
    missProb: 0.01,
  },
  {
    level: 9,
    minVisit: 5,
    maxVisit: 6,
    targetAvgMin: 88,
    targetAvgMax: 98,
    targetAvg: 93,
    name: 'Level 9 · PDC Tour Card',
    avatar: '🏆',
    badge: 'Avg 88–98 · Visits 5–6 (13–18 darts)',
    description: 'PDC Tour Card professional. Averages 88–98, finishes in 13–18 darts (visits 5–6).',
    defaultCheckoutPct: 62,
    minDarts: 13,
    maxDarts: 18,
    trebleProb: 0.30,
    singleProb: 0.65,
    neighborProb: 0.04,
    missProb: 0.01,
  },
  {
    level: 10,
    minVisit: 4,
    maxVisit: 5,
    targetAvgMin: 98,
    targetAvgMax: 110,
    targetAvg: 104,
    name: 'Level 10 · World Champion',
    avatar: '👑',
    badge: 'Avg 98–110 · Visits 4–5 (10–15 darts)',
    description: 'World champion elite. Averages 98–110, finishes in 10–15 darts (visits 4–5).',
    defaultCheckoutPct: 75,
    minDarts: 10,
    maxDarts: 15,
    trebleProb: 0.38,
    singleProb: 0.58,
    neighborProb: 0.03,
    missProb: 0.01,
  },
];

export function getDartBotLevelInfo(level: number): DartBotLevel {
  const clamped = Math.max(1, Math.min(10, Math.round(level)));
  return DARTBOT_LEVELS.find((l) => l.level === clamped) || DARTBOT_LEVELS[6];
}

export interface DartThrowResult {
  segment: string;
  points: number;
  isDouble: boolean;
  isTreble: boolean;
}

export interface DartBotVisitResult {
  darts: string[];
  pointsScored: number;
  isBust: boolean;
  isCheckout: boolean;
  dartsThrown: number;
  dartsAtDouble: number;
  startScore: number;
  endScore: number;
  narrative: string;
}

// Bogey scores that cannot be finished in 3 darts
const BOGEY_SCORES = new Set([169, 168, 166, 165, 163, 162, 159]);

/**
 * Parses target string like "T20", "D16", "20", "Bull", "25", "S1" into metadata
 */
function parseTarget(targetStr: string): { type: 'treble' | 'double' | 'single' | 'bull' | 'outer'; number: number } {
  const clean = targetStr.trim().replace(/^Single\s*/i, 'S').replace(/^Double\s*/i, 'D').replace(/^Treble\s*/i, 'T');
  if (clean.toLowerCase() === 'bull' || clean.toLowerCase() === 'dbull') {
    return { type: 'bull', number: 50 };
  }
  if (clean === '25' || clean.toLowerCase() === 'outer') {
    return { type: 'outer', number: 25 };
  }
  if (clean.startsWith('T') || clean.startsWith('t')) {
    return { type: 'treble', number: parseInt(clean.slice(1), 10) || 20 };
  }
  if (clean.startsWith('D') || clean.startsWith('d')) {
    return { type: 'double', number: parseInt(clean.slice(1), 10) || 16 };
  }
  if (clean.startsWith('S') || clean.startsWith('s')) {
    return { type: 'single', number: parseInt(clean.slice(1), 10) || 20 };
  }
  const n = parseInt(clean, 10) || 20;
  return { type: 'single', number: n };
}

/**
 * Simulates a single dart attempt by DartBot given target, levelInfo, and effective checkout %
 */
function simulateDart(
  targetStr: string,
  levelInfo: DartBotLevel,
  effectiveCheckoutPct: number,
  scoringAdjustment: number = 0
): DartThrowResult {
  const target = parseTarget(targetStr);
  const rand = Math.random();

  // 1. TARGETING A DOUBLE / BULL
  if (target.type === 'double' || target.type === 'bull') {
    const doubleHitProb = Math.min(0.95, Math.max(0.0, effectiveCheckoutPct / 100));

    if (rand < doubleHitProb) {
      if (target.type === 'bull') {
        return { segment: 'BULL', points: 50, isDouble: true, isTreble: false };
      }
      return { segment: `D${target.number}`, points: target.number * 2, isDouble: true, isTreble: false };
    }

    // Missed double: 55% chance inside into Single, 45% chance outside (0 pts)
    const insideRand = Math.random();
    if (target.type === 'bull') {
      if (insideRand < 0.65) {
        return { segment: '25', points: 25, isDouble: false, isTreble: false };
      }
      return { segment: 'Miss', points: 0, isDouble: false, isTreble: false };
    }

    if (insideRand < 0.55) {
      return { segment: `S${target.number}`, points: target.number, isDouble: false, isTreble: false };
    } else {
      return { segment: 'Miss', points: 0, isDouble: false, isTreble: false };
    }
  }

  // 2. TARGETING A TREBLE (e.g. T20, T19, T18, T17)
  if (target.type === 'treble') {
    const trebleProb = Math.min(
      0.65,
      Math.max(0.01, levelInfo.trebleProb + scoringAdjustment)
    );
    const singleProb = Math.min(0.85, levelInfo.singleProb);
    const neighborProb = Math.max(0.02, levelInfo.neighborProb - (scoringAdjustment * 0.5));

    if (rand < trebleProb) {
      return { segment: `T${target.number}`, points: target.number * 3, isDouble: false, isTreble: true };
    } else if (rand < trebleProb + singleProb) {
      return { segment: `S${target.number}`, points: target.number, isDouble: false, isTreble: false };
    } else if (rand < trebleProb + singleProb + neighborProb) {
      const neighbor = target.number === 20 ? (Math.random() < 0.5 ? 1 : 5) : (Math.random() < 0.5 ? 7 : 3);
      return { segment: `S${neighbor}`, points: neighbor, isDouble: false, isTreble: false };
    } else {
      return { segment: 'Miss', points: 0, isDouble: false, isTreble: false };
    }
  }

  // 3. TARGETING A SINGLE (e.g. S20, S10, S12, S9, 25)
  if (target.type === 'outer') {
    if (rand < 0.65) {
      return { segment: '25', points: 25, isDouble: false, isTreble: false };
    } else if (rand < 0.75) {
      return { segment: 'BULL', points: 50, isDouble: true, isTreble: false };
    } else {
      return { segment: 'Miss', points: 0, isDouble: false, isTreble: false };
    }
  }

  const singleAccuracy = Math.min(0.98, Math.max(0.40, levelInfo.singleProb + 0.15));
  if (rand < singleAccuracy) {
    return { segment: `S${target.number}`, points: target.number, isDouble: false, isTreble: false };
  } else {
    const slipRand = Math.random();
    if (slipRand < 0.08 && levelInfo.level >= 5) {
      return { segment: `T${target.number}`, points: target.number * 3, isDouble: false, isTreble: true };
    } else if (slipRand < 0.18) {
      return { segment: `D${target.number}`, points: target.number * 2, isDouble: true, isTreble: false };
    } else {
      const neighbor = target.number === 20 ? (Math.random() < 0.5 ? 1 : 5) : (target.number === 19 ? 7 : (target.number > 1 ? target.number - 1 : 1));
      return { segment: `S${neighbor}`, points: neighbor, isDouble: false, isTreble: false };
    }
  }
}

/**
 * Main simulation function for a full DartBot visit (1-3 darts)
 * STRICTLY CALIBRATED:
 * - Bot finishes in minDarts at best (never finishes in fewer darts than minDarts)
 * - Bot finishes in maxDarts at most (never goes past maxDarts)
 * - Works consistently across all levels (Level 1 to Level 10)
 */
export function generateDartBotVisit(
  startScore: number,
  level: number,
  checkoutPct: number,
  currentVisitInLeg: number = 1,
  startingScore: number = 501,
  runningLegPoints: number = 0,
  runningLegDarts: number = 0
): DartBotVisitResult {
  const levelInfo = getDartBotLevelInfo(level);

  // Scaled min and max darts based on starting score (501 vs 301 vs 701)
  const scale = startingScore / 501;
  const scaledMinDarts = Math.max(3, Math.round(levelInfo.minDarts * scale));
  const scaledMaxDarts = Math.max(scaledMinDarts, Math.round(levelInfo.maxDarts * scale));

  // Dynamic Pacing Adjustment for 3-dart scoring average
  let scoringAdjustment = 0;
  if (runningLegDarts >= 6) {
    const currentLegAvg = (runningLegPoints / runningLegDarts) * 3;
    if (currentLegAvg > levelInfo.targetAvgMax + 3) {
      scoringAdjustment = -0.06; // running hot -> cool down
    } else if (currentLegAvg < levelInfo.targetAvgMin - 3) {
      scoringAdjustment = 0.04; // running cold -> slight boost
    }
  }

  const darts: string[] = [];
  let currentScore = startScore;
  let dartsAtDouble = 0;
  let isBust = false;
  let isCheckout = false;

  for (let dartIndex = 0; dartIndex < 3; dartIndex++) {
    if (currentScore <= 0 || isBust || isCheckout) break;

    const absoluteDartNumber = runningLegDarts + dartIndex + 1;
    const canCheckout = absoluteDartNumber >= scaledMinDarts;
    const isHardCapDart = absoluteDartNumber >= scaledMaxDarts;

    // Check if the current score is already on a clean finish
    const isDoubleTarget = currentScore === 50 || (currentScore <= 40 && currentScore >= 2 && currentScore % 2 === 0);

    // =========================================================================
    // CASE 1: HARD CAP DART (absoluteDartNumber >= scaledMaxDarts)
    // The bot MUST close out the leg on or by this dart so it NEVER goes past maxDarts!
    // =========================================================================
    if (isHardCapDart) {
      if (isDoubleTarget) {
        dartsAtDouble++;
        const finishSegment = currentScore === 50 ? 'BULL' : `D${currentScore / 2}`;
        darts.push(finishSegment);
        isCheckout = true;
        currentScore = 0;
        break;
      } else if (currentScore <= 40 && currentScore % 2 !== 0) {
        // Odd remainder under 40 (e.g. 19): hit S3/S1 then finish, or close out
        const setupSingle = currentScore === 1 ? 1 : (currentScore % 2 !== 0 ? 1 : 0);
        if (setupSingle > 0 && currentScore > 2) {
          darts.push(`S${setupSingle}`);
          currentScore -= setupSingle;
          // If another dart remains in visit, next dart will hit double
          continue;
        } else {
          // Direct double checkout fallback
          dartsAtDouble++;
          darts.push(`D${Math.max(1, Math.floor(currentScore / 2))}`);
          isCheckout = true;
          currentScore = 0;
          break;
        }
      } else {
        // High score on hard cap dart: close out on standard double
        dartsAtDouble++;
        darts.push(`D${Math.min(20, Math.max(1, Math.floor(currentScore / 2)))}`);
        isCheckout = true;
        currentScore = 0;
        break;
      }
    }

    // =========================================================================
    // CASE 2: PRE-CHECKOUT PHASE (absoluteDartNumber < scaledMinDarts)
    // The bot CANNOT finish early! It must finish in scaledMinDarts at best!
    // =========================================================================
    if (!canCheckout) {
      // Score > 170 or bogey: Standard power scoring
      if (currentScore > 170 || BOGEY_SCORES.has(currentScore)) {
        const throwRes = simulateDart('T20', levelInfo, 0, scoringAdjustment);
        const nextScore = currentScore - throwRes.points;
        // Guard: ensure score does not prematurely drop below 2 before minDarts
        if (nextScore < 2) {
          darts.push('S20');
          currentScore = Math.max(2, currentScore - 20);
        } else {
          darts.push(throwRes.segment);
          currentScore = nextScore;
        }
        continue;
      }

      // Score <= 170 but before minDarts: Setup throws that leave score >= 2 (e.g. 40, 32, 24)
      if (currentScore > 60) {
        const throwRes = simulateDart('T20', levelInfo, 0, scoringAdjustment);
        const nextScore = currentScore - throwRes.points;
        if (nextScore < 2) {
          darts.push('S10');
          currentScore = Math.max(2, currentScore - 10);
        } else {
          darts.push(throwRes.segment);
          currentScore = nextScore;
        }
        continue;
      }

      // Score <= 60 before minDarts: Play safe setup singles, do NOT checkout early
      if (currentScore <= 40) {
        // Safe marker throw (aims outside or safe setup single that leaves valid double)
        if (currentScore % 2 === 0) {
          // Already on safe double (e.g. 40, 32, 20), miss outside safely so it remains ready for minDarts
          darts.push('Miss');
          // score stays unchanged
        } else {
          // Odd: hit single to leave clean double (e.g. 35 - 3 = 32)
          const singleVal = 1;
          darts.push(`S${singleVal}`);
          currentScore = Math.max(2, currentScore - singleVal);
        }
        continue;
      } else {
        // 41 - 60: Hit single 20 or single 10 to leave 40/32/24
        const targetSingle = currentScore > 50 ? 20 : 10;
        darts.push(`S${targetSingle}`);
        currentScore -= targetSingle;
        continue;
      }
    }

    // =========================================================================
    // CASE 3: ACTIVE CHECKOUT WINDOW (scaledMinDarts <= absoluteDartNumber < scaledMaxDarts)
    // The bot can genuinely checkout using its calibrated checkout percentage!
    // =========================================================================
    let nextTarget = 'T20';

    if (isDoubleTarget) {
      dartsAtDouble++;
      nextTarget = currentScore === 50 ? 'Bull' : `D${currentScore / 2}`;
    } else if (currentScore <= 170 && !BOGEY_SCORES.has(currentScore)) {
      const route = getCheckoutRoute(currentScore);
      if (route) {
        const parts = route.split(',').map((s) => s.trim());
        nextTarget = parts[0] || 'T20';
      } else {
        nextTarget = currentScore > 40 ? 'T20' : (currentScore % 2 === 0 ? `D${currentScore / 2}` : 'S1');
      }
    } else {
      nextTarget = 'T20';
    }

    // Progressive checkout percentage as bot approaches maxDarts
    const progressInWindow = (absoluteDartNumber - scaledMinDarts) / Math.max(1, scaledMaxDarts - scaledMinDarts);
    const effectivePct = Math.min(88, checkoutPct * (1 + progressInWindow * 0.5));

    const throwResult = simulateDart(nextTarget, levelInfo, effectivePct, scoringAdjustment);
    darts.push(throwResult.segment);

    const scoreAfterDart = currentScore - throwResult.points;

    // Check Bust Condition
    if (scoreAfterDart < 0 || scoreAfterDart === 1) {
      isBust = true;
      break;
    }

    // Check Checkout Condition
    if (scoreAfterDart === 0) {
      if (throwResult.isDouble || throwResult.segment === 'BULL') {
        isCheckout = true;
        currentScore = 0;
        break;
      } else {
        // Hit single into 0 -> Bust
        isBust = true;
        break;
      }
    }

    currentScore = scoreAfterDart;
  }

  const dartsThrown = darts.length;
  const pointsScored = isBust ? 0 : (isCheckout ? startScore : startScore - currentScore);
  const endScore = isBust ? startScore : (isCheckout ? 0 : currentScore);

  let narrative = `${darts.join(', ')} — Scored ${pointsScored}`;
  if (isCheckout) {
    narrative = `🎯 CHECKOUT ${startScore}! [${darts.join(', ')}] in ${dartsThrown} ${dartsThrown === 1 ? 'dart' : 'darts'}`;
  } else if (isBust) {
    narrative = `⚠️ BUST on ${darts[darts.length - 1]}! Score remains ${startScore}`;
  }

  return {
    darts,
    pointsScored,
    isBust,
    isCheckout,
    dartsThrown,
    dartsAtDouble,
    startScore,
    endScore,
    narrative,
  };
}
