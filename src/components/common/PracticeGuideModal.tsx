import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Clock,
  Play,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import { GameType } from '../../types';
import { sound } from '../../utils/sound';

interface PracticeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (type: GameType) => void;
  onOpenCheckoutAi?: () => void;
}

export const PracticeGuideModal: React.FC<PracticeGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectGame,
  onOpenCheckoutAi,
}) => {
  const [activeTab, setActiveTab] = useState<'routine' | 'keypad' | 'features'>('routine');

  if (!isOpen) return null;

  const handleStartDrill = (gameId: GameType) => {
    sound.tap();
    onClose();
    onSelectGame(gameId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/90 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              Dart Practice Tutorial
            </h3>
          </div>

          <button
            type="button"
            id="guide-close-btn"
            onClick={() => {
              sound.tap();
              onClose();
            }}
            className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Tabs */}
        <div className="flex items-center gap-1 px-3 py-1.5 bg-neutral-950 border-b border-neutral-800 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => {
              sound.tap();
              setActiveTab('routine');
            }}
            className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'routine'
                ? 'bg-emerald-600 text-white'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>2-Hour Routine</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.tap();
              setActiveTab('keypad');
            }}
            className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'keypad'
                ? 'bg-emerald-600 text-white'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keypad Shortcuts</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.tap();
              setActiveTab('features');
            }}
            className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'features'
                ? 'bg-emerald-600 text-white'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Features</span>
          </button>
        </div>

        {/* Scrollable Textual Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-neutral-200 text-xs sm:text-sm leading-relaxed space-y-4">
          {activeTab === 'routine' && (
            <div className="space-y-3 font-sans">
              <div>
                <h4 className="text-base sm:text-lg font-black text-white">
                  2-Hour Darts Practice Routine
                </h4>
                <p className="text-neutral-400 text-xs mt-1">
                  A structured 2-hour practice routine divided into short, focused sections covering warm-up, scoring, finishing, single numbers, and match play.
                </p>
              </div>

              <div className="border-t border-neutral-800 pt-3">
                <h5 className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-2">
                  The Routine
                </h5>

                <div className="space-y-2.5 divide-y divide-neutral-800/60 text-xs">
                  {/* Step 1: Warm Up */}
                  <div className="pt-2 flex items-start justify-between gap-2">
                    <div>
                      <b className="text-white text-xs sm:text-sm block">Warm Up — 20 min</b>
                      <p className="text-neutral-400">Play both 10-minute warm-up games once.</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleStartDrill('cal')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-emerald-400 font-bold flex items-center gap-1 border border-neutral-700"
                      >
                        <Play className="w-2.5 h-2.5" /> Calibration
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartDrill('wheel')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-emerald-400 font-bold flex items-center gap-1 border border-neutral-700"
                      >
                        <Play className="w-2.5 h-2.5" /> Wheel
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Scoring */}
                  <div className="pt-2 flex items-start justify-between gap-2">
                    <div>
                      <b className="text-white text-xs sm:text-sm block">Scoring — 20 min</b>
                      <p className="text-neutral-400">Play one 20-minute Highscore session.</p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleStartDrill('score')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-cyan-400 font-bold flex items-center gap-1 border border-neutral-700"
                      >
                        <Play className="w-2.5 h-2.5" /> High Score
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Finishing */}
                  <div className="pt-2 flex items-start justify-between gap-2">
                    <div>
                      <b className="text-white text-xs sm:text-sm block">Finishing — 20 min</b>
                      <p className="text-neutral-400">Choose one: 121 in 9 (checkpoint in 3 darts), 121 in 12 (checkpoint in 6 darts), or Catch 40.</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleStartDrill('1219')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-amber-400 font-bold flex items-center gap-1 border border-neutral-700"
                      >
                        <Play className="w-2.5 h-2.5" /> 121 (9)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartDrill('12112')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-amber-400 font-bold flex items-center gap-1 border border-neutral-700"
                      >
                        <Play className="w-2.5 h-2.5" /> 121 (12)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartDrill('catch40')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-amber-400 font-bold flex items-center gap-1 border border-neutral-700"
                      >
                        <Play className="w-2.5 h-2.5" /> Catch 40
                      </button>
                    </div>
                  </div>

                  {/* Step 4: Break */}
                  <div className="pt-2">
                    <b className="text-blue-400 text-xs sm:text-sm block">Break — 10 min</b>
                    <p className="text-neutral-400">Take a 10-minute break after the first three sections.</p>
                  </div>

                  {/* Step 5: Bull Warm Up */}
                  <div className="pt-2 flex items-start justify-between gap-2">
                    <div>
                      <b className="text-white text-xs sm:text-sm block">Bull Warm Up — 10 min</b>
                      <p className="text-neutral-400">Use the 10-minute Bull Warm Up to get back into your rhythm.</p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleStartDrill('bull')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-rose-400 font-bold flex items-center gap-1 border border-neutral-700"
                      >
                        <Play className="w-2.5 h-2.5" /> Bull
                      </button>
                    </div>
                  </div>

                  {/* Step 6: Single Numbers */}
                  <div className="pt-2 flex items-start justify-between gap-2">
                    <div>
                      <b className="text-white text-xs sm:text-sm block">Single Numbers / Triple Lock — 20 min</b>
                      <p className="text-neutral-400">Hit Big single twice to advance to next number, hit Big single three times to lock number.</p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleStartDrill('triple')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-purple-400 font-bold flex items-center gap-1 border border-neutral-700"
                      >
                        <Play className="w-2.5 h-2.5" /> Triple Lock
                      </button>
                    </div>
                  </div>

                  {/* Step 7: 301 Solo & Match Play */}
                  <div className="pt-2 flex items-start justify-between gap-2">
                    <div>
                      <b className="text-white text-xs sm:text-sm block">301 & X01 Match Play — 20 min</b>
                      <p className="text-neutral-400">Play solo 301 legs for 20 minutes, or challenge AI DartBot.</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleStartDrill('301')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-yellow-400 font-bold flex items-center gap-1 border border-neutral-700 active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5" /> 301 Solo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartDrill('dartbot')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-rose-400 font-bold flex items-center gap-1 border border-neutral-700 active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5" /> X01 Match
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total & Footer Notes */}
              <div className="border-t border-neutral-800 pt-3 space-y-1.5 text-xs text-neutral-400">
                <div>
                  <b className="text-white block">Total Practice Time</b>
                  <p className="text-emerald-400 font-mono font-bold">120 minutes</p>
                </div>
                <p>
                  The routine is designed as a recommended structure, not a requirement. Use the app however you prefer and adjust the session to suit your own practice goals.
                </p>
                <p className="text-neutral-500 text-[11px]">
                  If you have additional time, the X01 section also offers VS Bot games (Levels 1 through 10) for extended match play, leg breakdowns, and pressure testing.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'keypad' && (
            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-black text-white text-sm">Keypad & Physical Shortcut Controls</h4>
                <p className="text-neutral-400 text-xs mt-0.5">
                  Designed for rapid score entry with on-screen touch and external Bluetooth / USB numpads.
                </p>
              </div>

              <div className="space-y-2 border-t border-neutral-800 pt-2.5">
                <div>
                  <b className="text-emerald-400">REMAINING Mode:</b>
                  <p className="text-neutral-300">
                    If you have 140 remaining and score 60, toggle REMAINING and enter 80 to automatically calculate the visit.
                  </p>
                </div>

                <div>
                  <b className="text-cyan-400">CHECK / Direct Finish:</b>
                  <p className="text-neutral-300">
                    When you finish a leg, tap CHECK (or press <kbd className="bg-neutral-800 px-1 py-0.5 rounded font-mono text-white">+</kbd>) to log your darts on the double.
                  </p>
                </div>

                <div>
                  <b className="text-rose-400">no Score:</b>
                  <p className="text-neutral-300">
                    Used when busting or scoring 0 in a visit. Immediately commits 0 points (or press <kbd className="bg-neutral-800 px-1 py-0.5 rounded font-mono text-white">N</kbd>).
                  </p>
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5">
                <b className="text-white block mb-1 text-[11px] uppercase tracking-wider">Keyboard Shortcuts:</b>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono text-neutral-300">
                  <div><span className="text-emerald-400">0-9</span>: Digits</div>
                  <div><span className="text-emerald-400">Enter</span>: Submit</div>
                  <div><span className="text-cyan-400">+</span>: Check</div>
                  <div><span className="text-amber-400">R</span>: Remaining</div>
                  <div><span className="text-rose-400">N</span>: No Score (0)</div>
                  <div><span className="text-blue-400">U</span>: Undo</div>
                  <div><span className="text-neutral-400">Backspace</span>: Del</div>
                  <div><span className="text-neutral-400">Esc / C</span>: Clear</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-black text-white text-sm">App Features</h4>
                <p className="text-neutral-400 text-xs mt-0.5">Quick guide and instant launch to built-in training tools.</p>
              </div>

              <div className="space-y-2.5 border-t border-neutral-800 pt-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <b className="text-emerald-400">170-2 Outshot AI:</b>
                    <p className="text-neutral-300">
                      Check optimal professional checkout paths, recovery routes, and double percentages.
                    </p>
                  </div>
                  {onOpenCheckoutAi && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.tap();
                        onClose();
                        onOpenCheckoutAi();
                      }}
                      className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-emerald-400 font-bold flex items-center gap-1 border border-neutral-700 shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Open AI
                    </button>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <b className="text-rose-400">DartBot AI (Levels 1–10):</b>
                    <p className="text-neutral-300">
                      Simulates realistic opponents from Novice (35 Avg) to World Champion (105 Avg) with realistic turn pace.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartDrill('dartbot')}
                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-rose-400 font-bold flex items-center gap-1 border border-neutral-700 shrink-0 cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5" /> Launch
                  </button>
                </div>

                <div>
                  <b className="text-cyan-400">Screen Wake Lock:</b>
                  <p className="text-neutral-300">
                    Tap the Sun icon in the navbar or homescreen to keep your device screen awake throughout your entire practice session.
                  </p>
                </div>

                <div>
                  <b className="text-amber-400">Daily Dart Volume & Cloud Sync:</b>
                  <p className="text-neutral-300">
                    Tracks every single dart thrown across all drills and match play with real-time cloud multi-device sync and local backup.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-neutral-400 font-medium">
            120 Total Practice Minutes
          </span>
          <button
            type="button"
            id="guide-done-btn"
            onClick={() => {
              sound.tap();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

