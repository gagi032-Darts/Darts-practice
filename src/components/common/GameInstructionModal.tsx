import React from 'react';
import { Play, X, Clock, Target, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { GameType } from '../../types';
import { GAME_DEFINITIONS } from '../../utils/gamesData';
import { sound } from '../../utils/sound';

interface GameInstructionModalProps {
  gameType: GameType | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmStart: (gameType: GameType) => void;
}

export const GAME_INSTRUCTIONS: Record<
  GameType,
  {
    title: string;
    tagline: string;
    duration: string;
    rules: string[];
    proTip?: string;
  }
> = {
  cal: {
    title: 'Arm Calibration',
    tagline: '10-minute warm-up stroke and alignment drill',
    duration: '10 min · Countdown',
    rules: [
      'Throw 3 darts at sequential segment sets: 20 → 6 → 3, then 6 → 3 → 11, then 3 → 11 → 20, then 11 → 20 → Bull.',
      'Log your hits on each target (Single, Double, Treble, or Miss).',
      'Focus on smooth arm extension, consistent elbow elevation, and steady follow-through across the board.',
    ],
    proTip: 'Do not rush; establish your stance balance and release feeling before power scoring.',
  },
  wheel: {
    title: 'The Wheel',
    tagline: '20 → 19 → 18 clockwise alignment warm-up',
    duration: '10 min · Countdown',
    rules: [
      'Throw 1 dart at 20, 1 dart at 19, and 1 dart at 18 in every 3-dart visit.',
      'Log whether you hit 1 target, 2 targets, 3 targets, or missed all 3.',
      'Build horizontal and vertical muscle memory for transitioning between top and bottom board segments.',
    ],
    proTip: 'Keep your rhythm fluid when transitioning your eye line from 20 down to 19 and 18.',
  },
  align: {
    title: 'Align',
    tagline: '10-minute cross-axis and center bull alignment drill',
    duration: '10 min · Countdown',
    rules: [
      'Throw 1 dart at each target in sequence across 4 cardinal axes passing through Bull.',
      'Cycle: 20 → Bull → 3 (Vertical Down), 11 → Bull → 6 (Horizontal Right), 3 → Bull → 20 (Vertical Up), 6 → Bull → 11 (Horizontal Left).',
      'Singles, Doubles, Trebles, and 25 / Bull all count as valid hits.',
      'Log how many hits you scored (0, 1, 2, or 3) on each 3-dart visit.',
    ],
    proTip: 'Focus on clean vertical and horizontal lines of flight centering through the bullseye.',
  },
  score: {
    title: 'High Score (10 min)',
    tagline: '10 minutes of pure scoring rhythm at Treble 20',
    duration: '10 min · Countdown',
    rules: [
      'Throw 3 darts at Treble 20 in every visit.',
      'Enter your visit score (0 to 180) via the rapid keypad or quick-score buttons.',
      'Track your 3-dart scoring average, First 9 average, and advanced score bucket distribution.',
    ],
    proTip: 'Use your first dart as a marker; stack darts tight into the treble bed.',
  },
  switchblade: {
    title: 'Switchblade',
    tagline: '10-minute 5-throw repeating sequence & target switching',
    duration: '10 min · Countdown',
    rules: [
      'Throw 1 dart at each of the active targets in 5 standard throws (5 × 3 darts per cycle):',
      '• Throw 1: Treble 20 — Treble 20 — Treble 20',
      '• Throw 2: Treble 20 — Treble 20 — Treble 19',
      '• Throw 3: Treble 20 — Treble 20 — Treble 18',
      '• Throw 4: Treble 20 — Treble 20 — Treble 17',
      '• Throw 5: Treble 20 — Treble 20 — Bullseye',
      'You only score points on the designated target segment (Single, Double, Treble, or Bull 50/25).',
      'Repeat the 5-throw cycle continuously for 10 minutes. If the timer runs out mid-cycle, you can finish the 5-throw round!',
    ],
    proTip: 'Maintain identical posture and release speed when switching your 3rd dart to 19, 18, 17, or Bull.',
  },
  powerswitch: {
    title: 'Power Switch',
    tagline: '10-minute dynamic target progression & treble lock',
    duration: '10 min · Countdown',
    rules: [
      'Every 3-dart visit ALWAYS begins at Treble 20.',
      '• Hit a Treble (+3 pts) → STAY on that same target with your next dart!',
      '• Miss or hit Single/Double (+0/+1/+2 pts) → SWITCH to the next target in sequence (T20 → T19 → T18) with your next dart.',
      '• A perfect visit is hitting 3 trebles on T20 (180 score!).',
      'Once a visit is complete, the next visit always starts fresh at Treble 20.',
      'Log as many high-scoring visits as possible in 10 minutes.',
    ],
    proTip: 'Hitting trebles lets you remain locked onto T20 for maximum scoring potential across all visits!',
  },
  bigscores: {
    title: 'Big Scores',
    tagline: '10-minute power sequence (20 → 19 → 18 → 17 → Bull)',
    duration: '10 min · Countdown',
    rules: [
      'Throw 3 darts per visit at each designated segment in repeating 5-visit cycles:',
      '• Visit 1: Segment 20 (aim at Treble 20)',
      '• Visit 2: Segment 19 (aim at Treble 19)',
      '• Visit 3: Segment 18 (aim at Treble 18)',
      '• Visit 4: Segment 17 (aim at Treble 17)',
      '• Visit 5: Bullseye (Outer 25 / Red Bull 50)',
      'Once Visit 5 is complete, start from Segment 20 again.',
      'Play for 10 minutes. If the timer reaches 0:00, you can complete the active 5-visit round before wrapping up!',
    ],
    proTip: 'Stack all 3 darts tight in the treble bed of each segment before rotating to the next number.',
  },
  1219: {
    title: '121 in 9 Darts',
    tagline: 'High-pressure checkout ladder with 3-dart checkpoint lock',
    duration: '20 min · Countdown',
    rules: [
      'Start on 121 with 9 darts (3 visits) to take it out with a double finish.',
      'Checkout in ≤ 3 darts (1 visit) to advance target by +1 AND LOCK a permanent checkpoint!',
      'Checkout in 4–9 darts to advance target by +1 (no lock).',
      'Failing in 9 darts drops you back to your highest locked checkpoint.',
    ],
    proTip: 'Always calculate your 2-dart route before releasing dart 1.',
  },
  12112: {
    title: '121 in 12 Darts',
    tagline: 'Checkout ladder with 6-dart checkpoint lock',
    duration: '20 min · Countdown',
    rules: [
      'Start on 121 with 12 darts (4 visits) to finish on a double.',
      'Checkout in ≤ 6 darts (2 visits) to advance target by +1 AND lock a checkpoint.',
      'Checkout in 7–12 darts advances the target without locking.',
      'Failing in 12 darts resets your target to your latest checkpoint.',
    ],
    proTip: 'Use remaining visits to set up your preferred double finish (D16, D20, D8).',
  },
  catch40: {
    title: 'Catch 40',
    tagline: '40 checkout scenarios from 41 up to 80 (6 darts each)',
    duration: '20 min · Countdown',
    rules: [
      'Attempt 40 consecutive checkout targets from 41 to 80 with 6 darts (2 visits) per target.',
      'Checkout in 2 or 3 darts (Visit 1) = 2 Points.',
      'Checkout in 4, 5, or 6 darts (Visit 2) = 1 Point.',
      'Failing in 6 darts = 0 Points. Maximum possible score is 80 points!',
    ],
    proTip: 'Master 2-dart outshots like S12 + D16 for 44 or S18 + D20 for 58.',
  },
  cochallenge: {
    title: 'Checkout Challenge',
    tagline: 'Dynamic climbing checkout ladder in max 3 darts',
    duration: '20 min · Countdown',
    rules: [
      'Select what checkout you want to start with (default: 21).',
      'Attempt to finish the checkout (501-style double finish) in max 3 darts.',
      'Hit the checkout within 3 darts: Next checkout increases by +10 (e.g. 21 → 31 → 41).',
      'Fail/Miss within 3 darts: Next checkout is reduced by -1 (e.g. 31 → 30), never dropping below your starting checkout.',
      'The highest checkout you have successfully finished within 20 minutes is your score!',
    ],
    proTip: 'Focus on setting up comfortable doubles and follow the smart Outshot suggestion.',
  },
  boomerang: {
    title: 'Doubles Boomerang',
    tagline: 'Clockwise doubles clearance from D1 around to D20',
    duration: '10 min · Countdown & Overtime',
    rules: [
      'Hit each double clockwise on the board starting with 1: D1, D18, D4, D13, D6, D10, D15, D2, D17, D3, D19, D7, D16, D8, D11, D14, D9, D12, D5, D20.',
      'Throw 1 dart at each active double in sequence (first visit: D1, D18, D4).',
      'If you hit a double, it is locked and you move on to the next double in the circle.',
      'If you miss a double, you must return to it on your next throw.',
      'Complete all 20 doubles using as few darts as possible.',
      'If you finish a round in under 10 min, start another round! If 10 min runs out, you can finish your round or stop and view your score.',
    ],
    proTip: 'Smooth rhythm around the board: keep your elbow steady as you rotate through the angles.',
  },
  bobs27: {
    title: "Bob's 27",
    tagline: 'The iconic doubles pressure drill designed by Bob Anderson',
    duration: '10 min · Countdown & Multi-Run',
    rules: [
      'You start with 27 points.',
      'Throw 3 darts at each double in sequence from D1 up to D20, finishing with the Bullseye (21 targets total).',
      'For every dart that hits the active double, add its double value to your score (e.g. 1x D1 = +2, 2x D10 = +40, 1x Bull = +50).',
      'If ALL 3 DARTS MISS the target double (0 hits), subtract the single double value from your total score (e.g. miss D1 = -2, miss D20 = -40, miss Bull = -50).',
      'BUST: If your score drops to 0 or below at any point, the run is OVER!',
      '10-Minute Session: When a run ends (busted or cleared all 21 doubles), immediately start another run to improve your score. Maximize your highest score and doubles accuracy in 10 minutes!',
    ],
    proTip: 'Stay calm under pressure on high doubles (D15-D20) where misses subtract big points!',
  },
  a1practice: {
    title: 'A1 Practice',
    tagline: 'Single numbers precision drill across 20–11 & 1–10',
    duration: '10 min · Auto-rotates',
    rules: [
      'Hit 2 out of 3 darts on each LARGE SINGLE FIELD.',
      'Click HIT if you hit 2 or 3 in the active large single field.',
      'Click MISS if you hit less than 2 (0 or 1 dart).',
      'Target numbers go 20 down to 11 (or 1 up to 10).',
      'Each target requires 3 successful visits to clear and lock.',
      'Auto-Rotation: If you clear the 10 numbers before 10 minutes, the game immediately switches to the other set so you can keep practicing!',
    ],
    proTip: 'Focus your vision on the wide center of each large single segment for maximum margin of error.',
  },
  bigsingles: {
    title: 'BIG SINGLES',
    tagline: 'Precision grouping drill across numbers 1 to 20',
    duration: '10 min · Countdown',
    rules: [
      'Hit only the big single field of the current number, from 1 to 20.',
      'This is a grouping game: throw all 3 darts at the current number in every visit.',
      'Advanced Level rules:',
      '• 3 hits = move to next number (+1)',
      '• 2 hits = stay on current number',
      '• 1 hit = go back one number (-1)',
      '• 0 hits = go back two numbers (-2)',
      'Intermediate Level rules:',
      '• 2 or 3 hits = move to next number (+1)',
      '• 1 hit = stay on current number',
      '• 0 hits = go back one number (-1)',
      'Timer lasts 10 min. If you clear all 20 numbers, a new round starts immediately until the timer ends!',
    ],
    proTip: 'Group tightly in the middle of the large single bed. Use previous darts as flight markers.',
  },
  rtwsingles: {
    title: 'Round the World Singles',
    tagline: '1 dart per target from 1 to 20 ending on Bullseye',
    duration: '10 min · Countdown',
    rules: [
      'Throw at every single number from 1 to 20, ending with Bullseye.',
      'One dart per target (e.g. Visit 1: Dart 1 at 1, Dart 2 at 2, Dart 3 at 3 if you hit).',
      '• Hit target: Advance to next number (+1).',
      '• Miss target: Go back to previous number (-1).',
      '• Bull Misses: Do not count toward losing, but put you back to hit Single 20 (if you miss S20, that counts!).',
      'If time remains after clearing Bullseye or busting, start a new run immediately!',
    ],
    proTip: 'Keep a steady rhythm and adjust your aim dart-by-dart as you move around the board.',
  },
  bull: {
    title: 'Bull Warm-up',
    tagline: '10 minutes of center-board grouping & focus',
    duration: '10 min · Countdown',
    rules: [
      'Throw 3 darts at the Bullseye in every visit.',
      'Log each dart: Bull (50 pts / Red), Outer 25 (Green), or Miss (0 pts).',
      'Hone your vertical balance and release trajectory right into the center ring.',
    ],
    proTip: 'Look at the tiny center hole in the red bull, not the whole green circle.',
  },
  triple: {
    title: 'Triple Lock',
    tagline: '20-minute countdown challenge from 20 down to 1 & Bull finish',
    duration: '20 min · Countdown',
    rules: [
      'Descend sequentially from 20 down to 1, finishing on the Bullseye before 20 minutes expire.',
      'Throw 3 darts at the big single of your current target number in each visit:',
      '• 0 or 1 hit = RESET to your latest locked checkpoint.',
      '• 2 hits = ADVANCE to the next descending number.',
      '• 3 hits = ADVANCE AND LOCK that number as your new safe checkpoint!',
      'Complete all 20 numbers to unlock the final Bullseye bonus scoring round!',
    ],
    proTip: 'Aim for the center of the big single segment to avoid wire deflections.',
  },
  '301': {
    title: '301 Match Play',
    tagline: '20 minutes of continuous double-out match legs',
    duration: '20 min · Countdown',
    rules: [
      'Play standard 301 (501 format with double out finish) continuously for 20 minutes.',
      'Each time you take out 301 on a double, record your checkout and start a new leg.',
      'Track total completed legs, best leg (fewest darts thrown), 3-dart average, and double conversion %.',
    ],
    proTip: 'Set up comfortable checkouts on 32 (D16), 40 (D20), or 36 (D18).',
  },
  dartbot: {
    title: 'X01 vs AI DartBot & Solo',
    tagline: 'Play 501, 301, or 701 Solo or vs AI Bot',
    duration: 'Match Play · Untimed',
    rules: [
      'Choose starting score (501, 301, 701) and match format (Best of 3, 5, 7, etc.).',
      'Select Solo Practice or challenge AI DartBot (Levels 1 to 10 with realistic 35 to 105+ averages).',
      'Standard double-out finishing with real-time leg scoreboards, turn-by-turn logs, and checkout suggestions.',
    ],
    proTip: 'Adjust DartBot level to challenge your current 3-dart average.',
  },
};

export const GameInstructionModal: React.FC<GameInstructionModalProps> = ({
  gameType,
  isOpen,
  onClose,
  onConfirmStart,
}) => {
  if (!isOpen || !gameType) return null;

  const info = GAME_INSTRUCTIONS[gameType] || {
    title: GAME_DEFINITIONS[gameType]?.title || 'Drill',
    tagline: GAME_DEFINITIONS[gameType]?.subtitle || 'Precision practice drill',
    duration: `${GAME_DEFINITIONS[gameType]?.durationMinutes || 10} min`,
    rules: [GAME_DEFINITIONS[gameType]?.description || 'Throw darts and log your score.'],
  };

  const handleStart = () => {
    sound.tap();
    onConfirmStart(gameType);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#15191e] border border-[#232930] rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sound.tap();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & Badge */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-700/80 text-emerald-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> {info.duration}
            </span>
            <span className="text-xs text-neutral-400 font-semibold">How to Play</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {info.title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            {info.tagline}
          </p>
        </div>

        {/* Rules Box */}
        <div className="bg-[#101317] border border-[#20272f] rounded-2xl p-4 space-y-2.5 text-xs text-neutral-300 leading-relaxed shadow-inner">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block border-b border-[#20272f] pb-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" /> Drill Rules & Mechanics
          </span>
          <div className="space-y-2">
            {info.rules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                <span className="text-neutral-200">{rule}</span>
              </div>
            ))}
          </div>

          {info.proTip && (
            <div className="pt-2 border-t border-[#20272f] text-[11px] text-amber-300/90 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span><b>Pro Tip:</b> {info.proTip}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              sound.tap();
              onClose();
            }}
            className="h-12 rounded-xl bg-[#20262e] hover:bg-[#28303b] active:scale-95 text-neutral-300 hover:text-white font-bold text-xs border border-[#2a3440] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Drill & Timer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
