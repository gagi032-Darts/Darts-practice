// Web Audio API Sound Synthesizer & Android Haptics for tactile feedback at the oche

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private hapticsEnabled: boolean = true;

  constructor() {
    // Sound & Haptics preferences
    const savedSound = localStorage.getItem('dp_sound_enabled');
    if (savedSound !== null) {
      this.soundEnabled = savedSound === 'true';
    }
    const savedHaptics = localStorage.getItem('dp_haptics_enabled');
    if (savedHaptics !== null) {
      this.hapticsEnabled = savedHaptics === 'true';
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public isHapticsEnabled(): boolean {
    return this.hapticsEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('dp_sound_enabled', String(enabled));
  }

  public setHapticsEnabled(enabled: boolean): void {
    this.hapticsEnabled = enabled;
    localStorage.setItem('dp_haptics_enabled', String(enabled));
  }

  public toggle(): boolean {
    this.setEnabled(!this.soundEnabled);
    return this.soundEnabled;
  }

  public toggleHaptics(): boolean {
    this.setHapticsEnabled(!this.hapticsEnabled);
    return this.hapticsEnabled;
  }

  // Trigger Android hardware vibration if supported
  private vibrate(pattern: number | number[]): void {
    if (!this.hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Haptics error safely ignored
      }
    }
  }

  private getContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Soft tactile button tap (Keypad, Chips, Navigation)
  public tap(): void {
    this.vibrate(10); // Crisp 10ms haptic tick
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio error ignored
    }
  }

  // Positive dart hit / score entered
  public hit(): void {
    this.vibrate(25); // 25ms solid dart strike pulse
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio error ignored
    }
  }

  // Miss / Fail / Reset
  public miss(): void {
    this.vibrate([20, 40, 20]); // Double buzz on miss
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio error ignored
    }
  }

  // Checkpoint lock or high achievement
  public lock(): void {
    this.vibrate([30, 30, 40]);
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = ctx.currentTime + idx * 0.06;
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.15);
      });
    } catch {
      // Audio error ignored
    }
  }

  // Successful checkout
  public checkout(): void {
    this.vibrate([40, 40, 40, 40, 60]); // Rhythmic winning burst
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const start = ctx.currentTime + idx * 0.07;
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {
      // Audio error ignored
    }
  }

  // 180 Fanfare
  public oneEighty(): void {
    this.vibrate([50, 30, 50, 30, 100]);
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const chords = [
        [523.25, 659.25, 783.99],
        [587.33, 739.99, 880],
        [659.25, 830.61, 987.77],
        [783.99, 987.77, 1174.66, 1567.98]
      ];
      chords.forEach((chord, i) => {
        const time = ctx.currentTime + i * 0.12;
        chord.forEach(f => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0.12, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + (i === 3 ? 0.6 : 0.15));
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + (i === 3 ? 0.6 : 0.15));
        });
      });
    } catch {
      // Audio error ignored
    }
  }

  // Timer warning / countdown tick
  public timerWarning(): void {
    this.vibrate(15);
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio error ignored
    }
  }

  // Time is up buzzer
  public timeUp(): void {
    this.vibrate([100, 50, 150]);
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(260, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio error ignored
    }
  }
}

export const sound = new SoundManager();
