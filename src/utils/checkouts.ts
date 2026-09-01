// Professional Darts Outshot & Checkout AI Engine (2 to 170)

export interface DartStep {
  dartNumber: number;
  target: string;
  points: number;
  type: 'treble' | 'double' | 'single' | 'bull' | 'outer';
  note?: string;
}

export interface DetailedCheckout {
  score: number;
  isBogey: boolean;
  minDarts: 1 | 2 | 3 | null;
  primaryRoute: string;
  dartSteps: DartStep[];
  alternateRoutes: string[];
  aiAdvice: string;
  singleMissAdvice?: string;
  isShanghai?: boolean;
  isBigFish?: boolean;
  isDouble?: boolean;
}

// Bogey numbers: Mathematical impossibilities to check out in 3 darts from 170 down
export const BOGEY_NUMBERS = [159, 162, 163, 165, 166, 168, 169];

/**
 * Checks if a score is directly finishable with a single double dart (D1-D20 or Bull 50).
 */
export function isDirectDoubleScore(score: number): boolean {
  return (score <= 40 && score >= 2 && score % 2 === 0) || score === 50;
}

/**
 * Accurately determines if a visit could mathematically have included at least 1 dart thrown at a double.
 * If the visit is a checkout, it always has a double shot.
 * If not a checkout, it can ONLY have a double shot if:
 * 1) startScore was already on a double (D1-D20 or Bull 50), OR
 * 2) pointsScored reduced a setup score down to an active double (e.g. 57 scored 17 -> leaves 40 / D20).
 * If startScore > 50 and pointsScored was 0 or left a non-double (like 74 left), returns false!
 */
export function canVisitHaveDoubleShot(
  startScore: number,
  pointsScored: number,
  isCheckout: boolean,
  dartsThrownInVisit: number = 3
): boolean {
  if (isCheckout) return true;
  if (isDirectDoubleScore(startScore)) return true;

  // Check if points scored reduced from a multi-dart finish down to an active double
  const remaining = startScore - pointsScored;
  if (pointsScored > 0 && remaining >= 2 && isDirectDoubleScore(remaining) && dartsThrownInVisit >= 2) {
    return true;
  }

  return false;
}

// Helper to determine dart type from string
export function parseDartStep(targetStr: string, dartNum: number): DartStep {
  const trimmed = targetStr.trim().toUpperCase();
  if (trimmed === 'BULL' || trimmed === 'D25' || trimmed === '50') {
    return { dartNumber: dartNum, target: 'BULL', points: 50, type: 'bull', note: 'Center Bull (50 pts)' };
  }
  if (trimmed === '25' || trimmed === 'OUTER' || trimmed === 'SB') {
    return { dartNumber: dartNum, target: '25', points: 25, type: 'outer', note: 'Outer Bull (25 pts)' };
  }
  if (trimmed.startsWith('T')) {
    const val = parseInt(trimmed.substring(1), 10);
    return { dartNumber: dartNum, target: trimmed, points: isNaN(val) ? 0 : val * 3, type: 'treble', note: `Treble ${val}` };
  }
  if (trimmed.startsWith('D')) {
    const val = parseInt(trimmed.substring(1), 10);
    return { dartNumber: dartNum, target: trimmed, points: isNaN(val) ? 0 : val * 2, type: 'double', note: `Double ${val}` };
  }
  const val = parseInt(trimmed, 10);
  return { dartNumber: dartNum, target: trimmed, points: isNaN(val) ? 0 : val, type: 'single', note: `Single ${val}` };
}

// Master map of primary and alternate checkout routes
const RAW_CHECKOUTS: Record<
  number,
  {
    primary: string;
    alternates?: string[];
    advice?: string;
    singleMiss?: string;
    isShanghai?: boolean;
    isBigFish?: boolean;
  }
> = {
  // 1-Dart Finishes (Doubles 2-40 & Bull 50)
  2: { primary: 'D1', alternates: ['1, D1 (if missed inside)'], advice: 'Target Double 1 at bottom of board. If single 1, you have D1 remaining.' },
  3: { primary: '1, D1', advice: 'Must hit Single 1 first to leave Double 1.' },
  4: { primary: 'D2', alternates: ['2, D1'], advice: 'Target Double 2. Single 2 leaves Double 1.' },
  5: { primary: '1, D2', alternates: ['3, D1'], advice: 'Single 1 leaves Double 2.' },
  6: { primary: 'D3', alternates: ['2, D2'], advice: 'Target Double 3. Single 2 leaves Double 2.' },
  7: { primary: '3, D2', alternates: ['1, D3'], advice: 'Single 3 leaves D2; single 1 leaves D3.' },
  8: { primary: 'D4', alternates: ['4, D2'], advice: 'Target Double 4. Single 4 leaves Double 2.' },
  9: { primary: '1, D4', alternates: ['5, D2', '9 -> bust'], advice: 'Single 1 leaves Double 4. Single 5 leaves Double 2.' },
  10: { primary: 'D5', alternates: ['2, D4'], advice: 'Target Double 5. Single 2 leaves Double 4.' },
  11: { primary: '3, D4', alternates: ['7, D2'], advice: 'Single 3 leaves Double 4.' },
  12: { primary: 'D6', alternates: ['4, D4'], advice: 'Target Double 6. Single 4 leaves Double 4.' },
  13: { primary: '5, D4', alternates: ['3, D5', '1, D6'], advice: 'Single 5 leaves Double 4.' },
  14: { primary: 'D7', alternates: ['6, D4'], advice: 'Target Double 7. Single 6 leaves Double 4.' },
  15: { primary: '7, D4', alternates: ['3, D6', '1, D7'], advice: 'Single 7 leaves Double 4. Single 3 leaves Double 6.' },
  16: { primary: 'D8', alternates: ['8, D4'], advice: 'Target Double 8. Beautiful layout: single 8 leaves D4, single 4 leaves D2, single 2 leaves D1.' },
  17: { primary: '9, D4', alternates: ['1, D8'], advice: 'Single 9 leaves Double 4. Single 1 leaves Double 8.' },
  18: { primary: 'D9', alternates: ['2, D8', '10, D4'], advice: 'Target Double 9. Single 2 leaves Double 8.' },
  19: { primary: '3, D8', alternates: ['11, D4', '7, D6'], advice: 'Single 3 leaves Double 8. Single 11 leaves Double 4.' },
  20: { primary: 'D10', alternates: ['10, D5', '4, D8'], advice: 'Target Double 10. Single 10 leaves D5, single 4 leaves D8.' },
  21: { primary: '5, D8', alternates: ['1, D10', '13, D4'], advice: 'Single 5 leaves Double 8. Single 1 leaves Double 10.' },
  22: { primary: 'D11', alternates: ['6, D8', '2, D10'], advice: 'Target Double 11. Single 6 leaves Double 8.' },
  23: { primary: '7, D8', alternates: ['15, D4', '3, D10'], advice: 'Single 7 leaves Double 8. Single 15 leaves Double 4.' },
  24: { primary: 'D12', alternates: ['8, D8', '4, D10'], advice: 'Target Double 12. Single 8 leaves Double 8.' },
  25: { primary: '9, D8', alternates: ['1, D12', '17, D4'], advice: 'Single 9 leaves Double 8. Single 1 leaves Double 12.' },
  26: { primary: 'D13', alternates: ['10, D8', '2, D12'], advice: 'Target Double 13. Single 10 leaves Double 8.' },
  27: { primary: '11, D8', alternates: ['19, D4', '3, D12'], advice: 'Single 11 leaves Double 8. Single 19 leaves Double 4.' },
  28: { primary: 'D14', alternates: ['12, D8', '4, D12'], advice: 'Target Double 14. Single 12 leaves Double 8.' },
  29: { primary: '13, D8', alternates: ['17, D6', '1, D14'], advice: 'Single 13 leaves Double 8. Single 17 leaves Double 6.' },
  30: { primary: 'D15', alternates: ['14, D8', '6, D12', '10, D10'], advice: 'Target Double 15. Single 14 leaves Double 8.' },
  31: { primary: '15, D8', alternates: ['7, D12', '11, D10'], advice: 'Single 15 leaves Double 8. Single 7 leaves Double 12.' },
  32: { primary: 'D16', alternates: ['16, D8'], advice: 'Favorite double in darts! Splits down cleanly: S16 -> D8 -> D4 -> D2 -> D1 without needing odd-number correction.' },
  33: { primary: '1, D16', alternates: ['17, D8', '9, D12'], advice: 'Single 1 leaves prime Double 16. Single 17 leaves Double 8.' },
  34: { primary: 'D17', alternates: ['18, D8', '2, D16'], advice: 'Target Double 17. Single 2 leaves Double 16.' },
  35: { primary: '3, D16', alternates: ['19, D8', '11, D12'], advice: 'Single 3 leaves Double 16. Single 19 leaves Double 8.' },
  36: { primary: 'D18', alternates: ['18, D9', '4, D16'], advice: 'Target Double 18. Single 4 leaves Double 16.' },
  37: { primary: '5, D16', alternates: ['1, D18', '21 -> bust'], advice: 'Single 5 leaves Double 16. Single 1 leaves Double 18.' },
  38: { primary: 'D19', alternates: ['6, D16', '2, D18'], advice: 'Target Double 19. Single 6 leaves Double 16.' },
  39: { primary: '7, D16', alternates: ['3, D18', '19, D10'], advice: 'Single 7 leaves Double 16. Single 3 leaves Double 18.' },
  40: { primary: 'D20', alternates: ['20, D10'], advice: 'Tops (Double 20). Pro standard. If you hit single 20 inside, leaves Double 10.' },

  // 41 to 60 (2-Dart territory)
  41: { primary: '9, D16', alternates: ['1, D20'], advice: 'Single 9 leaves prime D16. Single 1 leaves Tops.', singleMiss: 'Hit 9 leaves 32 (D16); hit 1 leaves 40 (D20).' },
  42: { primary: '10, D16', alternates: ['6, D18', '2, D20'], advice: 'Single 10 leaves D16. Single 6 leaves D18.', singleMiss: 'Hit 10 leaves 32 (D16); hit 6 leaves 36 (D18).' },
  43: { primary: '11, D16', alternates: ['3, D20'], advice: 'Single 11 leaves D16. Single 3 leaves Tops.', singleMiss: 'Hit 11 leaves 32 (D16); hit 3 leaves 40 (D20).' },
  44: { primary: '12, D16', alternates: ['8, D18', '4, D20'], advice: 'Single 12 leaves D16. Single 8 leaves D18.', singleMiss: 'Hit 12 leaves 32 (D16); hit 8 leaves 36 (D18).' },
  45: { primary: '13, D16', alternates: ['9, D18', '5, D20'], advice: 'Single 13 leaves D16. Single 5 leaves Tops.', singleMiss: 'Hit 13 leaves 32 (D16); hit 5 leaves 40 (D20).' },
  46: { primary: '14, D16', alternates: ['6, D20', '10, D18'], advice: 'Single 14 leaves D16. Single 6 leaves Tops.', singleMiss: 'Hit 14 leaves 32 (D16); hit 6 leaves 40 (D20).' },
  47: { primary: '15, D16', alternates: ['7, D20', '11, D18'], advice: 'Single 15 leaves D16. Single 7 leaves Tops.', singleMiss: 'Hit 15 leaves 32 (D16); hit 7 leaves 40 (D20).' },
  48: { primary: '16, D16', alternates: ['8, D20', '12, D18'], advice: 'Single 16 leaves D16. Single 8 leaves Tops.', singleMiss: 'Hit 16 leaves 32 (D16); hit 8 leaves 40 (D20).' },
  49: { primary: '17, D16', alternates: ['9, D20', '13, D18'], advice: 'Single 17 leaves D16. Single 9 leaves Tops.', singleMiss: 'Hit 17 leaves 32 (D16); hit 9 leaves 40 (D20).' },
  50: { primary: 'BULL', alternates: ['10, D20', '18, D16'], advice: 'Direct 50 pt Bullseye checkout, or setup with Single 10 to leave Tops (D20).' },
  51: { primary: '19, D16', alternates: ['11, D20', '15, D18'], advice: 'Single 19 leaves D16. Single 11 leaves Tops.', singleMiss: 'Hit 19 leaves 32 (D16); hit 11 leaves 40 (D20).' },
  52: { primary: '20, D16', alternates: ['12, D20'], advice: 'Single 20 leaves D16. Single 12 leaves Tops.', singleMiss: 'Hit 20 leaves 32 (D16); hit 12 leaves 40 (D20).' },
  53: { primary: '17, D18', alternates: ['13, D20', '21, D16'], advice: 'Single 17 leaves D18. Single 13 leaves Tops.', singleMiss: 'Hit 17 leaves 36 (D18); hit 13 leaves 40 (D20).' },
  54: { primary: '14, D20', alternates: ['18, D18', '22, D16'], advice: 'Single 14 leaves Tops. Single 18 leaves D18.', singleMiss: 'Hit 14 leaves 40 (D20); hit 18 leaves 36 (D18).' },
  55: { primary: '15, D20', alternates: ['19, D18', '23, D16'], advice: 'Single 15 leaves Tops. Single 19 leaves D18.', singleMiss: 'Hit 15 leaves 40 (D20); hit 19 leaves 36 (D18).' },
  56: { primary: '16, D20', alternates: ['24, D16', '20, D18'], advice: 'Single 16 leaves Tops. Single 24 leaves D16.', singleMiss: 'Hit 16 leaves 40 (D20); hit 24 leaves 32 (D16).' },
  57: { primary: '17, D20', alternates: ['25, D16', '21, D18'], advice: 'Single 17 leaves Tops. Single 25 leaves D16.', singleMiss: 'Hit 17 leaves 40 (D20); hit 25 leaves 32 (D16).' },
  58: { primary: '18, D20', alternates: ['26, D16', '22, D18'], advice: 'Single 18 leaves Tops. Single 26 leaves D16.', singleMiss: 'Hit 18 leaves 40 (D20); hit 10 leaves 48 (16->D16).' },
  59: { primary: '19, D20', alternates: ['27, D16', '23, D18'], advice: 'Single 19 leaves Tops. Single 27 leaves D16.', singleMiss: 'Hit 19 leaves 40 (D20); hit 3 leaves 56 (16->D20).' },
  60: { primary: '20, D20', alternates: ['10, D25'], advice: 'Single 20 leaves Tops (D20). Clean pro route.', singleMiss: 'Hit 20 leaves 40 (D20); hit 1 leaves 59 (19->D20); hit 5 leaves 55 (15->D20).' },

  // 61 to 80
  61: { primary: 'T15, D8', alternates: ['25, D18', 'T7, D20'], advice: 'Treble 15 leaves D8; single 15 leaves 46 (6->D20 or 14->D16). Outer bull 25 leaves D18.', singleMiss: 'Single 15 leaves 46: go 6, D20 or 14, D16.' },
  62: { primary: 'T10, D16', alternates: ['12, D25', 'T14, D10'], advice: 'Treble 10 leaves D16; single 10 leaves 52 (20->D16).', singleMiss: 'Single 10 leaves 52: go 20, D16.' },
  63: { primary: 'T13, D12', alternates: ['T17, D6', '13, D25'], advice: 'Treble 13 leaves D12; single 13 leaves 50 (BULL or 10->D20).', singleMiss: 'Single 13 leaves 50: go Bull or 10, D20.' },
  64: { primary: 'T16, D8', alternates: ['14, D25', 'T8, D20'], advice: 'Treble 16 leaves D8; single 16 leaves 48 (16->D16).', singleMiss: 'Single 16 leaves 48: go 16, D16.' },
  65: { primary: '25, D20', alternates: ['T15, D10', 'T19, D4'], advice: 'Outer Bull (25) leaves Tops (D20). If Bull hit (50), leaves 15. Alternatively T15 leaves D10.', singleMiss: 'Single 25 leaves 40 (D20); Bull leaves 15 (7->D4).' },
  66: { primary: 'T10, D18', alternates: ['T14, D12', 'T18, D6'], advice: 'Treble 10 leaves D18; single 10 leaves 56 (16->D20).', singleMiss: 'Single 10 leaves 56: go 16, D20.' },
  67: { primary: 'T17, D8', alternates: ['17, D25', 'T9, D20'], advice: 'Treble 17 leaves D8; single 17 leaves 50 (BULL).', singleMiss: 'Single 17 leaves 50: go Bull or 10, D20.' },
  68: { primary: 'T18, D7', alternates: ['T20, D4', 'T12, D16'], advice: 'Treble 18 leaves D7 or Treble 20 leaves D4; single 20 leaves 48 (16->D16).', singleMiss: 'Single 20 leaves 48: go 16, D16.' },
  69: { primary: 'T19, D6', alternates: ['T15, D12', '19, D25'], advice: 'Treble 19 leaves D6; single 19 leaves 50 (BULL).', singleMiss: 'Single 19 leaves 50: go Bull or 10, D20.' },
  70: { primary: 'T10, D20', alternates: ['T18, D8', 'T14, D14'], advice: 'Treble 10 leaves Tops; single 10 leaves 60 (20->D20).', singleMiss: 'Single 10 leaves 60: go 20, D20.' },
  71: { primary: 'T13, D16', alternates: ['T17, D10', '17, D27'], advice: 'Treble 13 leaves D16; single 13 leaves 58 (18->D20).', singleMiss: 'Single 13 leaves 58: go 18, D20.' },
  72: { primary: 'T16, D12', alternates: ['T12, D18', 'T20, D6'], advice: 'Treble 16 leaves D12; single 16 leaves 56 (16->D20).', singleMiss: 'Single 16 leaves 56: go 16, D20.' },
  73: { primary: 'T19, D8', alternates: ['T11, D20', 'T15, D14'], advice: 'Treble 19 leaves D8; single 19 leaves 54 (14->D20).', singleMiss: 'Single 19 leaves 54: go 14, D20.' },
  74: { primary: 'T14, D16', alternates: ['T18, D10', '14, D30'], advice: 'Treble 14 leaves D16; single 14 leaves 60 (20->D20).', singleMiss: 'Single 14 leaves 60: go 20, D20.' },
  75: { primary: 'T17, D12', alternates: ['25, D25', 'T15, D15'], advice: 'Treble 17 leaves D12; single 17 leaves 58 (18->D20). Outer bull leaves Bullseye.', singleMiss: 'Single 17 leaves 58: go 18, D20.' },
  76: { primary: 'T20, D8', alternates: ['20, D28', 'T16, D14'], advice: 'Treble 20 leaves D8; single 20 leaves 56 (16->D20).', singleMiss: 'Single 20 leaves 56: go 16, D20.' },
  77: { primary: 'T19, D10', alternates: ['T15, D16', '19, D29'], advice: 'Treble 19 leaves D10; single 19 leaves 58 (18->D20).', singleMiss: 'Single 19 leaves 58: go 18, D20.' },
  78: { primary: 'T18, D12', alternates: ['T14, D18', '18, D30'], advice: 'Treble 18 leaves D12; single 18 leaves 60 (20->D20).', singleMiss: 'Single 18 leaves 60: go 20, D20.' },
  79: { primary: 'T19, D11', alternates: ['T13, D20', 'T17, D14'], advice: 'Treble 19 leaves D11; single 19 leaves 60 (20->D20).', singleMiss: 'Single 19 leaves 60: go 20, D20.' },
  80: { primary: 'T20, D10', alternates: ['T16, D16', '20, D30'], advice: 'Treble 20 leaves D10; single 20 leaves 60 (20->D20). T16 leaves D16.', singleMiss: 'Single 20 leaves 60: go 20, D20. T16 leaves D16.' },

  // 81 to 100
  81: { primary: 'T19, D12', alternates: ['T15, D18', '25, T16, D8'], advice: 'Treble 19 leaves D12; single 19 leaves 62 (T10->D16).', singleMiss: 'Single 19 leaves 62: go T10, D16.' },
  82: { primary: 'BULL, D16', alternates: ['T14, D20', '25, 17, D20'], advice: 'Bull route: Hit Bull leaves 32 (D16); Outer 25 leaves 57 (17->D20). Or go T14 for Tops.', singleMiss: 'Outer Bull 25 leaves 57: go 17, D20.' },
  83: { primary: 'T17, D16', alternates: ['25, T18, D2', 'T19, D13'], advice: 'Treble 17 leaves D16; single 17 leaves 66 (T10->D18).', singleMiss: 'Single 17 leaves 66: go T10, D18.' },
  84: { primary: 'T20, D12', alternates: ['T16, D18', '25, T19, D1'], advice: 'Treble 20 leaves D12; single 20 leaves 64 (T16->D8).', singleMiss: 'Single 20 leaves 64: go T16, D8.' },
  85: { primary: 'T15, D20', alternates: ['25, 20, D20', 'T19, D14'], advice: 'Treble 15 leaves Tops; single 15 leaves 70 (T10->D20). Outer 25 leaves 60.', singleMiss: 'Single 15 leaves 70: go T10, D20.' },
  86: { primary: 'T18, D16', alternates: ['25, T19, D2', 'T14, D22'], advice: 'Treble 18 leaves D16; single 18 leaves 68 (T20->D4 or T18->D7).', singleMiss: 'Single 18 leaves 68: go T20, D4.' },
  87: { primary: 'T17, D18', alternates: ['T19, D15', '25, T18, D4'], advice: 'Treble 17 leaves D18; single 17 leaves 70 (T10->D20).', singleMiss: 'Single 17 leaves 70: go T10, D20.' },
  88: { primary: 'T16, D20', alternates: ['T20, D14', '25, T19, D3'], advice: 'Treble 16 leaves Tops; single 16 leaves 72 (T16->D12).', singleMiss: 'Single 16 leaves 72: go T16, D12.' },
  89: { primary: 'T19, D16', alternates: ['25, T18, D5', 'T17, D19'], advice: 'Treble 19 leaves D16; single 19 leaves 70 (T10->D20).', singleMiss: 'Single 19 leaves 70: go T10, D20.' },
  90: { primary: 'T20, D15', alternates: ['T18, D18', '25, 25, D20'], advice: 'Treble 20 leaves D15; Treble 18 leaves D18; single 20 leaves 70 (T10->D20).', singleMiss: 'Single 20 leaves 70: go T10, D20.' },
  91: { primary: 'T17, D20', alternates: ['25, T18, D6', 'T19, D17'], advice: 'Treble 17 leaves Tops; single 17 leaves 74 (T14->D16).', singleMiss: 'Single 17 leaves 74: go T14, D16.' },
  92: { primary: 'T20, D16', alternates: ['25, T19, D5', 'T16, D22'], advice: 'Treble 20 leaves D16; single 20 leaves 72 (T16->D12).', singleMiss: 'Single 20 leaves 72: go T16, D12.' },
  93: { primary: 'T19, D18', alternates: ['25, T18, D7', 'T17, D21'], advice: 'Treble 19 leaves D18; single 19 leaves 74 (T14->D16).', singleMiss: 'Single 19 leaves 74: go T14, D16.' },
  94: { primary: 'T18, D20', alternates: ['25, T19, D6', 'T14, D26'], advice: 'Treble 18 leaves Tops; single 18 leaves 76 (T20->D8).', singleMiss: 'Single 18 leaves 76: go T20, D8.' },
  95: { primary: 'T19, D19', alternates: ['25, T18, D8', 'T15, D25'], advice: 'Treble 19 leaves D19; single 19 leaves 76 (T20->D8).', singleMiss: 'Single 19 leaves 76: go T20, D8.' },
  96: { primary: 'T20, D18', alternates: ['T16, D24', '25, T19, D7'], advice: 'Treble 20 leaves D18; single 20 leaves 76 (T20->D8).', singleMiss: 'Single 20 leaves 76: go T20, D8.' },
  97: { primary: 'T19, D20', alternates: ['25, T18, D9', 'T17, D23'], advice: 'Treble 19 leaves Tops; single 19 leaves 78 (T18->D12).', singleMiss: 'Single 19 leaves 78: go T18, D12.' },
  98: { primary: 'T20, D19', alternates: ['25, T19, D8', 'T16, D25'], advice: 'Treble 20 leaves D19; single 20 leaves 78 (T18->D12).', singleMiss: 'Single 20 leaves 78: go T18, D12.' },
  99: { primary: 'T19, D21', alternates: ['25, T18, D10', 'T17, D24'], advice: 'Treble 19 leaves D21 or go T19, 10, D16; single 19 leaves 80 (T20->D10).', singleMiss: 'Single 19 leaves 80: go T20, D10.' },
  100: { primary: 'T20, D20', alternates: ['25, 25, BULL', 'T16, D26'], advice: 'The century checkout: Treble 20 leaves Tops (D20); single 20 leaves 80 (T20->D10).', singleMiss: 'Single 20 leaves 80: go T20, D10 or T16, D16.' },

  // 101 to 130 (3-Dart combinations)
  101: { primary: 'T17, 10, D20', alternates: ['T20, 9, D16', '25, T19, D9'], advice: 'T17 leaves 50 (10->D20 or Bull); single 17 leaves 84 (T20->D12).', singleMiss: 'Single 17 leaves 84: go T20, D12.' },
  102: { primary: 'T20, 10, D16', alternates: ['T18, 16, D16', '25, T19, D10'], advice: 'T20 leaves 42 (10->D16); single 20 leaves 82 (Bull->D16).', singleMiss: 'Single 20 leaves 82: go Bull, D16 or T14, D20.' },
  103: { primary: 'T19, 10, D18', alternates: ['T20, 11, D16', '25, T18, D12'], advice: 'T19 leaves 46 (14->D16 or 6->D20); single 19 leaves 84 (T20->D12).', singleMiss: 'Single 19 leaves 84: go T20, D12.' },
  104: { primary: 'T18, 18, D16', alternates: ['T20, 12, D16', 'T19, 15, D16'], advice: 'T18 leaves 50 (18->D16); single 18 leaves 86 (T18->D16).', singleMiss: 'Single 18 leaves 86: go T18, D16.' },
  105: { primary: 'T20, 13, D16', alternates: ['T19, 16, D16', '25, T20, D10'], advice: 'T20 leaves 45 (13->D16); single 20 leaves 85 (T15->D20).', singleMiss: 'Single 20 leaves 85: go T15, D20.' },
  106: { primary: 'T20, 14, D16', alternates: ['T18, 20, D16', 'T19, 17, D16'], advice: 'T20 leaves 46 (14->D16); single 20 leaves 86 (T18->D16).', singleMiss: 'Single 20 leaves 86: go T18, D16.' },
  107: { primary: 'T19, 18, D16', alternates: ['T20, 15, D16', '25, T20, D11'], advice: 'T19 leaves 50 (18->D16); single 19 leaves 88 (T16->D20).', singleMiss: 'Single 19 leaves 88: go T16, D20.' },
  108: { primary: 'T20, 16, D16', alternates: ['T19, 19, D16', '25, T19, D13'], advice: 'T20 leaves 48 (16->D16); single 20 leaves 88 (T16->D20).', singleMiss: 'Single 20 leaves 88: go T16, D20.' },
  109: { primary: 'T20, 17, D16', alternates: ['T19, 20, D16', 'T17, 18, D20'], advice: 'T20 leaves 49 (17->D16); single 20 leaves 89 (T19->D16).', singleMiss: 'Single 20 leaves 89: go T19, D16.' },
  110: { primary: 'T20, 18, D16', alternates: ['T20, 10, D20', 'T18, 16, D20'], advice: 'T20 leaves 50 (18->D16 or 10->D20); single 20 leaves 90 (T20->D15 or T18->D18).', singleMiss: 'Single 20 leaves 90: go T18, D18 or T20, D15.' },
  111: { primary: 'T20, 19, D16', alternates: ['T19, 14, D20', 'T20, 11, D20'], advice: 'T20 leaves 51 (19->D16); single 20 leaves 91 (T17->D20).', singleMiss: 'Single 20 leaves 91: go T17, D20.' },
  112: { primary: 'T20, 20, D16', alternates: ['T20, 12, D20', 'T19, 15, D20'], advice: 'T20 leaves 52 (20->D16 or 12->D20); single 20 leaves 92 (T20->D16).', singleMiss: 'Single 20 leaves 92: go T20, D16.' },
  113: { primary: 'T19, 16, D20', alternates: ['T20, 13, D20', 'T19, 24, D16'], advice: 'T19 leaves 56 (16->D20); single 19 leaves 94 (T18->D20).', singleMiss: 'Single 19 leaves 94: go T18, D20.' },
  114: { primary: 'T20, 14, D20', alternates: ['T19, 17, D20', 'T18, 20, D20'], advice: 'T20 leaves 54 (14->D20); single 20 leaves 94 (T18->D20).', singleMiss: 'Single 20 leaves 94: go T18, D20.' },
  115: { primary: 'T20, 15, D20', alternates: ['T19, 18, D20', 'T17, 24, D20'], advice: 'T20 leaves 55 (15->D20); single 20 leaves 95 (T19->D19).', singleMiss: 'Single 20 leaves 95: go T19, D19.' },
  116: { primary: 'T20, 16, D20', alternates: ['T19, 19, D20', 'T18, 22, D20'], advice: 'T20 leaves 56 (16->D20); single 20 leaves 96 (T20->D18).', singleMiss: 'Single 20 leaves 96: go T20, D18.' },
  117: { primary: 'T20, 17, D20', alternates: ['T19, 20, D20', 'T18, 23, D20'], advice: 'T20 leaves 57 (17->D20); single 20 leaves 97 (T19->D20).', singleMiss: 'Single 20 leaves 97: go T19, D20.' },
  118: { primary: 'T20, 18, D20', alternates: ['T19, 21, D20', 'T18, 24, D20'], advice: 'T20 leaves 58 (18->D20); single 20 leaves 98 (T20->D19).', singleMiss: 'Single 20 leaves 98: go T20, D19.' },
  119: { primary: 'T19, 12, D25', alternates: ['T20, 19, D20', 'T19, 22, D20'], advice: 'T19 leaves 62 (12->D25 or T10->D16); T20 leaves 59 (19->D20).', singleMiss: 'Single 19 leaves 100: go T20, D20.' },
  120: { primary: 'T20, 20, D20', alternates: ['T20, S20, D20'], advice: 'Shanghai 20 finish! T20, 20, Tops. Single 20 leaves 100 (T20->D20).', isShanghai: true, singleMiss: 'Single 20 leaves 100: go T20, D20.' },

  // 121 to 170
  121: { primary: 'T20, 25, D18', alternates: ['T17, T20, D7', 'T20, 11, BULL'], advice: 'T20 leaves 61 (25->D18); single 20 leaves 101 (T17->10->D20).', singleMiss: 'Single 20 leaves 101: switch to T17.' },
  122: { primary: 'T18, 18, BULL', alternates: ['T18, T18, D7', 'T20, 12, BULL'], advice: 'T18 leaves 68 (18->Bull); single 18 leaves 104 (T18->18->D16).', singleMiss: 'Single 18 leaves 104: stay on T18.' },
  123: { primary: 'T19, 16, BULL', alternates: ['T19, T16, D9', 'T20, 13, BULL'], advice: 'T19 leaves 66 (16->Bull); single 19 leaves 104 (T18->18->D16).', singleMiss: 'Single 19 leaves 104: switch to T18.' },
  124: { primary: 'T20, 14, BULL', alternates: ['T20, T16, D8', 'T18, 20, BULL'], advice: 'T20 leaves 64 (14->Bull); single 20 leaves 104 (T18->18->D16).', singleMiss: 'Single 20 leaves 104: switch to T18.' },
  125: { primary: '25, T20, D20', alternates: ['T20, 15, BULL', 'T19, 18, BULL'], advice: 'Outer 25 start leaves 100 (T20->D20). Or T20 leaves 65 (15->Bull).', singleMiss: 'Outer 25 leaves 100: go T20, D20.' },
  126: { primary: 'T19, 19, BULL', alternates: ['T20, 16, BULL', 'T19, T19, D6'], advice: 'T19 leaves 69 (19->Bull); single 19 leaves 107 (T19->18->D16).', singleMiss: 'Single 19 leaves 107: stay on T19.' },
  127: { primary: 'T20, 17, BULL', alternates: ['T20, T17, D8', 'T19, 20, BULL'], advice: 'T20 leaves 67 (17->Bull); single 20 leaves 107 (T19->18->D16).', singleMiss: 'Single 20 leaves 107: switch to T19.' },
  128: { primary: 'T18, 24, BULL', alternates: ['T18, T14, D16', 'T20, 18, BULL'], advice: 'T18 leaves 74 (24->Bull); single 18 leaves 110 (T20->18->D16).', singleMiss: 'Single 18 leaves 110: switch to T20.' },
  129: { primary: 'T19, 22, BULL', alternates: ['T19, T16, D12', 'T20, 19, BULL'], advice: 'T19 leaves 72 (22->Bull); single 19 leaves 110 (T20->18->D16).', singleMiss: 'Single 19 leaves 110: switch to T20.' },
  130: { primary: 'T20, 20, BULL', alternates: ['T20, T18, D8', 'T20, T10, D20'], advice: 'T20 leaves 70 (20->Bull); single 20 leaves 110 (T20->18->D16).', singleMiss: 'Single 20 leaves 110: stay on T20.' },
  131: { primary: 'T20, T13, D16', alternates: ['T20, 11, BULL', 'T19, T14, D16'], advice: 'T20 leaves 71 (T13->D16); single 20 leaves 111 (T20->19->D16).' },
  132: { primary: 'T20, T16, D12', alternates: ['T20, 12, BULL', '25, T19, BULL'], advice: 'T20 leaves 72 (T16->D12); single 20 leaves 112 (T20->20->D16).' },
  133: { primary: 'T20, T19, D8', alternates: ['T20, 13, BULL', 'T19, T16, D14'], advice: 'T20 leaves 73 (T19->D8); single 20 leaves 113 (T19->16->D20).' },
  134: { primary: 'T20, T14, D16', alternates: ['T20, 14, BULL', 'T18, T16, D16'], advice: 'T20 leaves 74 (T14->D16); single 20 leaves 114 (T20->14->D20).' },
  135: { primary: '25, T20, BULL', alternates: ['T20, T15, D15', 'T20, 15, BULL'], advice: 'Outer 25 leaves 110 (T20->Bull). Or T20 leaves 75 (T15->D15).' },
  136: { primary: 'T20, T20, D8', alternates: ['T20, 16, BULL', 'T19, T19, D11'], advice: 'Double T20 leaves D8; single 20 leaves 116 (T20->16->D20).' },
  137: { primary: 'T19, T16, D16', alternates: ['T20, T19, D10', 'T20, 17, BULL'], advice: 'T19 leaves 80 (T16->D16); single 19 leaves 118 (T20->18->D20).' },
  138: { primary: 'T20, T18, D12', alternates: ['T20, 18, BULL', 'T19, T19, D12'], advice: 'T20 leaves 78 (T18->D12); single 20 leaves 118 (T20->18->D20).' },
  139: { primary: 'T20, T19, D11', alternates: ['T19, T14, D20', 'T20, 19, BULL'], advice: 'T20 leaves 79 (T19->D11); single 20 leaves 119 (T19->12->D25).' },
  140: { primary: 'T20, T20, D10', alternates: ['T20, 20, BULL', 'T18, T18, D16'], advice: 'Double T20 leaves D10; single 20 leaves 120 (T20->20->D20).' },
  141: { primary: 'T20, T19, D12', alternates: ['T19, T16, D18', 'T20, 21, BULL'], advice: 'T20 leaves 81 (T19->D12); single 20 leaves 121 (T20->25->D18).' },
  142: { primary: 'T20, T14, D20', alternates: ['T20, T18, D14', 'T19, T15, D20'], advice: 'T20 leaves 82 (T14->D20); single 20 leaves 122 (T18->18->Bull).' },
  143: { primary: 'T20, T17, D16', alternates: ['T19, T18, D16', 'T20, 23, BULL'], advice: 'T20 leaves 83 (T17->D16); single 20 leaves 123 (T19->16->Bull).' },
  144: { primary: 'T20, T20, D12', alternates: ['T18, T18, D18', 'T20, 24, BULL'], advice: 'Double T20 leaves D12; single 20 leaves 124 (T20->14->Bull).' },
  145: { primary: 'T20, T15, D20', alternates: ['T19, T16, D20', 'T20, 25, BULL'], advice: 'T20 leaves 85 (T15->D20); single 20 leaves 125 (25->T20->D20).' },
  146: { primary: 'T20, T18, D16', alternates: ['T19, T17, D19', 'T20, 26, BULL'], advice: 'T20 leaves 86 (T18->D16); single 20 leaves 126 (T19->19->Bull).' },
  147: { primary: 'T20, T17, D18', alternates: ['T19, T18, D18', 'T20, 27, BULL'], advice: 'T20 leaves 87 (T17->D18); single 20 leaves 127 (T20->17->Bull).' },
  148: { primary: 'T20, T20, D14', alternates: ['T20, T16, D20', 'T18, T18, D20'], advice: 'Double T20 leaves D14; single 20 leaves 128 (T18->24->Bull).' },
  149: { primary: 'T20, T19, D16', alternates: ['T19, T20, D16', 'T19, T16, D22'], advice: 'T20 leaves 89 (T19->D16); single 20 leaves 129 (T19->22->Bull).' },
  150: { primary: 'T20, T18, D18', alternates: ['T19, T19, D18', 'T20, T20, D15'], advice: 'T20 leaves 90 (T18->D18); single 20 leaves 130 (T20->20->Bull).' },
  151: { primary: 'T20, T17, D20', alternates: ['T19, T18, D20', 'T20, T19, D17'], advice: 'T20 leaves 91 (T17->D20); single 20 leaves 131 (T20->T13->D16).' },
  152: { primary: 'T20, T20, D16', alternates: ['T19, T19, D19', 'T20, T16, D22'], advice: 'Double T20 leaves prime Double 16; single 20 leaves 132 (T20->T16->D12).' },
  153: { primary: 'T20, T19, D18', alternates: ['T19, T20, D18', 'T19, T16, D24'], advice: 'T20 leaves 93 (T19->D18); single 20 leaves 133 (T20->T19->D8).' },
  154: { primary: 'T20, T18, D20', alternates: ['T19, T19, D20', 'T20, T20, D17'], advice: 'T20 leaves 94 (T18->D20); single 20 leaves 134 (T20->T14->D16).' },
  155: { primary: 'T20, T19, D19', alternates: ['T19, T20, D19', 'T19, T16, D25'], advice: 'T20 leaves 95 (T19->D19); single 20 leaves 135 (25->T20->Bull).' },
  156: { primary: 'T20, T20, D18', alternates: ['T19, T19, D21', 'T20, T18, D21'], advice: 'Double T20 leaves Double 18; single 20 leaves 136 (T20->T20->D8).' },
  157: { primary: 'T20, T19, D20', alternates: ['T19, T20, D20', 'T19, T18, D23'], advice: 'T20 leaves 97 (T19->D20); single 20 leaves 137 (T19->T16->D16).' },
  158: { primary: 'T20, T20, D19', alternates: ['T18, T18, D25', 'T20, T18, D22'], advice: 'Double T20 leaves Double 19; single 20 leaves 138 (T20->T18->D12).' },

  // Bogey 159
  159: { primary: 'Bogey (No 3-dart checkout)', advice: '159 is a Bogey score. Hit T20 with dart 1 to set up a 2-dart finish next visit.' },

  160: { primary: 'T20, T20, D20', alternates: ['T20, T20, Tops'], advice: 'The classic maximum 3-dart outer ring finish: T20, T20, Tops (D20)!' },
  161: { primary: 'T20, T17, BULL', alternates: ['T20, 25, BULL (safety)'], advice: 'T20 leaves 101 (T17->Bull); single 20 leaves 141 (T20->T19->D12).' },

  // Bogey 162, 163
  162: { primary: 'Bogey (No 3-dart checkout)', advice: '162 is a Bogey score. Score heavy on T20 to leave 102 for next visit.' },
  163: { primary: 'Bogey (No 3-dart checkout)', advice: '163 is a Bogey score. Score heavy on T20 to leave 103 for next visit.' },

  164: { primary: 'T20, T18, BULL', alternates: ['T19, T19, BULL'], advice: 'T20 leaves 104 (T18->Bull); single 20 leaves 144 (T20->T20->D12).' },

  // Bogey 165, 166
  165: { primary: 'Bogey (No 3-dart checkout)', advice: '165 is a Bogey score. Hit T20 to leave 105 for next visit.' },
  166: { primary: 'Bogey (No 3-dart checkout)', advice: '166 is a Bogey score. Hit T20 to leave 106 for next visit.' },

  167: { primary: 'T20, T19, BULL', alternates: ['T19, T20, BULL'], advice: 'T20 leaves 107 (T19->Bull); single 20 leaves 147 (T20->T17->D18).' },

  // Bogey 168, 169
  168: { primary: 'Bogey (No 3-dart checkout)', advice: '168 is a Bogey score. Hit T20 to leave 108 for next visit.' },
  169: { primary: 'Bogey (No 3-dart checkout)', advice: '169 is a Bogey score. Hit T20 to leave 109 for next visit.' },

  // Maximum Outshot 170
  170: { primary: 'T20, T20, BULL', alternates: ['The Big Fish!'], advice: 'The Big Fish! The highest possible checkout in darts: Treble 20, Treble 20, Bullseye (50 pts)!', isBigFish: true }
};

// Main function to get rich detailed checkout analysis
export function getDetailedCheckout(score: number): DetailedCheckout | null {
  if (score < 2 || score > 170) return null;

  const isBogey = BOGEY_NUMBERS.includes(score);
  const data = RAW_CHECKOUTS[score];

  if (isBogey || !data) {
    return {
      score,
      isBogey: true,
      minDarts: null,
      primaryRoute: 'Bogey (No 3-dart checkout)',
      dartSteps: [],
      alternateRoutes: [],
      aiAdvice: `${score} is a mathematical Bogey score. It is impossible to check out in 3 darts. Best strategy: throw at Treble 20 to set up a clean 2-dart outshot next visit.`,
      singleMissAdvice: 'Score maximum points (T20) to leave an easy checkout.',
    };
  }

  // Parse steps
  const stepsRaw = data.primary.split(',').map((s) => s.trim());
  const dartSteps: DartStep[] = stepsRaw.map((step, idx) => parseDartStep(step, idx + 1));

  let minDarts: 1 | 2 | 3 = 3;
  if (score === 50 || (score <= 40 && score % 2 === 0)) {
    minDarts = 1;
  } else if (dartSteps.length === 2) {
    minDarts = 2;
  }

  const isDouble = minDarts === 1;
  const isShanghai = score === 120 || data.advice?.includes('Shanghai');
  const isBigFish = score === 170;

  return {
    score,
    isBogey: false,
    minDarts,
    primaryRoute: data.primary,
    dartSteps,
    alternateRoutes: data.alternates || [],
    aiAdvice: data.advice || `Standard pro checkout route for ${score}: ${data.primary}`,
    singleMissAdvice: data.singleMiss,
    isShanghai,
    isBigFish,
    isDouble,
  };
}

// Simple lookup for backward compatibility
export function getCheckoutRoute(score: number): string | null {
  const detailed = getDetailedCheckout(score);
  if (!detailed) return null;
  return detailed.primaryRoute;
}

// Quick filter categories for the checkout guide browser
export type CheckoutCategory = 'all' | 'doubles' | '2-dart' | '3-dart' | 'big' | 'bogey';

export function getCheckoutsByCategory(category: CheckoutCategory, searchQuery = ''): DetailedCheckout[] {
  const results: DetailedCheckout[] = [];
  const query = searchQuery.trim().toLowerCase();

  for (let s = 170; s >= 2; s--) {
    const item = getDetailedCheckout(s);
    if (!item) continue;

    if (query) {
      const matchScore = s.toString().includes(query);
      const matchRoute = item.primaryRoute.toLowerCase().includes(query);
      const matchAdvice = item.aiAdvice.toLowerCase().includes(query);
      if (!matchScore && !matchRoute && !matchAdvice) {
        continue;
      }
    }

    if (category === 'all') {
      results.push(item);
    } else if (category === 'doubles' && item.minDarts === 1) {
      results.push(item);
    } else if (category === '2-dart' && item.minDarts === 2) {
      results.push(item);
    } else if (category === '3-dart' && item.minDarts === 3 && !item.isBogey) {
      results.push(item);
    } else if (category === 'big' && s >= 121 && !item.isBogey) {
      results.push(item);
    } else if (category === 'bogey' && item.isBogey) {
      results.push(item);
    }
  }

  return results;
}
