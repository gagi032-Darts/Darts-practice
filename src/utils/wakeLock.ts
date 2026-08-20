// Screen Wake Lock API Manager for Android / Mobile devices
// Keeps phone display awake during active darts training sessions at the oche

class WakeLockManager {
  private sentinel: any = null;
  private isRequestedByUser: boolean = true;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    const saved = localStorage.getItem('dp_wakelock_enabled');
    if (saved !== null) {
      this.isRequestedByUser = saved === 'true';
    }

    // Auto-reacquire when returning to tab/app on Android
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isRequestedByUser) {
          this.request();
        }
      });
    }
  }

  public getSupported(): boolean {
    return this.isSupported;
  }

  public isEnabled(): boolean {
    return this.isRequestedByUser;
  }

  public isActive(): boolean {
    return this.sentinel !== null && !this.sentinel.released;
  }

  public async request(): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      if (this.sentinel && !this.sentinel.released) {
        return true;
      }
      // Request screen lock
      this.sentinel = await (navigator as any).wakeLock.request('screen');
      if (this.sentinel) {
        this.sentinel.addEventListener('release', () => {
          this.sentinel = null;
        });
      }
      return true;
    } catch {
      this.sentinel = null;
      return false;
    }
  }

  public release(): void {
    if (this.sentinel) {
      try {
        this.sentinel.release();
      } catch {
        // Ignored
      }
      this.sentinel = null;
    }
  }

  public toggle(): boolean {
    const next = !this.isRequestedByUser;
    this.isRequestedByUser = next;
    localStorage.setItem('dp_wakelock_enabled', String(next));
    if (next) {
      this.request();
    } else {
      this.release();
    }
    return next;
  }
}

export const wakeLock = new WakeLockManager();
