import { UserAccount, SessionHistoryItem, DailyDartRecord, GameType, GameResultData } from '../types';
import { cloudAuth, CloudUserProfile } from './firebase';

const STORAGE_KEYS = {
  ACCOUNTS: 'dp_accounts_list',
  ACTIVE_ACCOUNT_ID: 'dp_active_account_id',
  SOUND: 'dp_sound_enabled',
};

let syncDebounceTimer: NodeJS.Timeout | null = null;

const DEFAULT_GUEST_ACCOUNT: UserAccount = {
  id: 'guest_default',
  name: 'Default Player',
  avatarEmoji: '🎯',
  isGuest: true,
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
};

function getHistoryKey(accountId: string): string {
  return `dp_history_${accountId}`;
}

function getDailyKey(accountId: string): string {
  return `dp_daily_${accountId}`;
}

export const storage = {
  // -------------------------------------------------------------
  // ACCOUNT & PROFILE MANAGEMENT
  // -------------------------------------------------------------
  getAccounts(): UserAccount[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!raw) {
        // Initialize with default account
        const initial = [DEFAULT_GUEST_ACCOUNT];
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_GUEST_ACCOUNT];
    } catch {
      return [DEFAULT_GUEST_ACCOUNT];
    }
  },

  getActiveAccount(): UserAccount {
    const accounts = this.getAccounts();
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
    const found = accounts.find((a) => a.id === activeId);
    if (found) {
      return found;
    }
    // Fallback to first account
    const fallback = accounts[0] || DEFAULT_GUEST_ACCOUNT;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, fallback.id);
    return fallback;
  },

  setActiveAccount(accountId: string): UserAccount | null {
    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === accountId);
    if (target) {
      target.lastActiveAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, target.id);
      return target;
    }
    return null;
  },

  createAccount(
    name: string,
    email?: string,
    avatarEmoji: string = '🎯',
    pinCode?: string,
    options?: { isCloudUser?: boolean; cloudUid?: string; photoUrl?: string }
  ): UserAccount {
    const accounts = this.getAccounts();
    const newAccount: UserAccount = {
      id: options?.cloudUid ? `cloud_${options.cloudUid}` : `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim() || 'Player',
      email: email ? email.trim().toLowerCase() : undefined,
      avatarEmoji: avatarEmoji || '🎯',
      photoUrl: options?.photoUrl || undefined,
      pinCode: pinCode ? pinCode.trim() : undefined,
      isGuest: false,
      isCloudUser: options?.isCloudUser || false,
      cloudUid: options?.cloudUid,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    // Check if account with same ID or cloudUid already exists
    const existingIndex = accounts.findIndex(
      (a) => a.id === newAccount.id || (options?.cloudUid && a.cloudUid === options.cloudUid)
    );

    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...newAccount };
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, accounts[existingIndex].id);
      return accounts[existingIndex];
    }

    accounts.push(newAccount);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, newAccount.id);
    return newAccount;
  },

  setAccountData(accountId: string, history: SessionHistoryItem[], daily: Record<string, DailyDartRecord>, triggerSync: boolean = false) {
    localStorage.setItem(getHistoryKey(accountId), JSON.stringify(history));
    localStorage.setItem(getDailyKey(accountId), JSON.stringify(daily));
    if (triggerSync) {
      this.triggerAutoCloudSync(accountId, true);
    }
  },

  updateAccount(accountId: string, updates: Partial<UserAccount>): UserAccount | null {
    const accounts = this.getAccounts();
    const index = accounts.findIndex((a) => a.id === accountId);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      this.triggerAutoCloudSync(accountId);
      return accounts[index];
    }
    return null;
  },

  /**
   * Automatic background cloud synchronization for logged-in Firebase users
   */
  triggerAutoCloudSync(accountId?: string, immediate: boolean = false): void {
    const accounts = this.getAccounts();
    const targetAcc = accountId ? accounts.find((a) => a.id === accountId) : this.getActiveAccount();
    if (!targetAcc || !targetAcc.isCloudUser || !targetAcc.cloudUid) {
      return;
    }

    const doSync = async () => {
      try {
        const history = this.getHistory(targetAcc.id);
        const daily = this.getDailyRecords(targetAcc.id);
        const profile: CloudUserProfile = {
          uid: targetAcc.cloudUid!,
          username: targetAcc.name,
          email: targetAcc.email || '',
          avatarEmoji: targetAcc.avatarEmoji || '🎯',
          photoUrl: targetAcc.photoUrl || undefined,
          createdAt: targetAcc.createdAt,
          lastSyncedAt: new Date().toISOString(),
        };

        await cloudAuth.uploadDataToCloud(targetAcc.cloudUid!, history, daily, profile);

        // Update local timestamp
        const curAccounts = this.getAccounts();
        const idx = curAccounts.findIndex((a) => a.id === targetAcc.id);
        if (idx !== -1) {
          curAccounts[idx].lastSyncedAt = new Date().toISOString();
          localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(curAccounts));
        }
      } catch (err) {
        console.warn('Auto cloud sync notice (will retry on next activity):', err);
      }
    };

    if (immediate) {
      doSync();
    } else {
      if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
      syncDebounceTimer = setTimeout(doSync, 800);
    }
  },

  deleteAccount(accountId: string): boolean {
    const accounts = this.getAccounts();
    if (accounts.length <= 1) {
      return false; // Cannot delete last remaining account
    }

    const filtered = accounts.filter((a) => a.id !== accountId);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(filtered));

    // Also remove account data
    localStorage.removeItem(getHistoryKey(accountId));
    localStorage.removeItem(getDailyKey(accountId));

    // If active account was deleted, switch to first available
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
    if (activeId === accountId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, filtered[0].id);
    }
    return true;
  },

  // -------------------------------------------------------------
  // ISOLATED SESSION HISTORY (PER ACCOUNT)
  // -------------------------------------------------------------
  getHistory(accountId?: string): SessionHistoryItem[] {
    const accId = accountId || this.getActiveAccount().id;
    try {
      // Check account-specific storage first
      const raw = localStorage.getItem(getHistoryKey(accId));
      if (raw) return JSON.parse(raw);

      // Backwards compatibility migration from single-user legacy storage
      if (accId === 'guest_default') {
        const legacyRaw = localStorage.getItem('dp_history');
        if (legacyRaw) {
          const legacyItems: SessionHistoryItem[] = JSON.parse(legacyRaw);
          localStorage.setItem(getHistoryKey('guest_default'), legacyRaw);
          return legacyItems;
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  saveSession(gameType: GameType, gameTitle: string, durationSeconds: number, result: GameResultData): SessionHistoryItem {
    const activeAcc = this.getActiveAccount();
    const history = this.getHistory(activeAcc.id);
    const item: SessionHistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      accountId: activeAcc.id,
      gameType,
      gameTitle,
      date: new Date().toISOString(),
      durationSeconds,
      result,
    };
    history.unshift(item);
    // keep up to 300 recent sessions per account
    const trimmed = history.slice(0, 300);
    localStorage.setItem(getHistoryKey(activeAcc.id), JSON.stringify(trimmed));
    
    // Auto-sync immediately to Firebase Cloud for logged in users
    this.triggerAutoCloudSync(activeAcc.id, true);
    
    return item;
  },

  deleteSession(id: string): void {
    const activeAcc = this.getActiveAccount();
    const history = this.getHistory(activeAcc.id).filter((item) => item.id !== id);
    localStorage.setItem(getHistoryKey(activeAcc.id), JSON.stringify(history));
    this.triggerAutoCloudSync(activeAcc.id, true);
  },

  clearAllHistory(): void {
    const activeAcc = this.getActiveAccount();
    localStorage.removeItem(getHistoryKey(activeAcc.id));
    this.triggerAutoCloudSync(activeAcc.id, true);
  },

  // -------------------------------------------------------------
  // ISOLATED DAILY DART COUNTS (PER ACCOUNT)
  // -------------------------------------------------------------
  getDailyRecords(accountId?: string): Record<string, DailyDartRecord> {
    const accId = accountId || this.getActiveAccount().id;
    try {
      const raw = localStorage.getItem(getDailyKey(accId));
      if (raw) return JSON.parse(raw);

      // Backwards compatibility migration
      if (accId === 'guest_default') {
        const legacyRaw = localStorage.getItem('dp_daily');
        if (legacyRaw) {
          localStorage.setItem(getDailyKey('guest_default'), legacyRaw);
          return JSON.parse(legacyRaw);
        }
      }
      return {};
    } catch {
      return {};
    }
  },

  getTodayCount(accountId?: string): number {
    const todayStr = new Date().toISOString().slice(0, 10);
    const records = this.getDailyRecords(accountId);
    return records[todayStr]?.count || 0;
  },

  saveDailyCount(dateStr: string, count: number, notes?: string): void {
    const activeAcc = this.getActiveAccount();
    const records = this.getDailyRecords(activeAcc.id);
    records[dateStr] = {
      date: dateStr,
      count: Math.max(0, count),
      notes: notes || records[dateStr]?.notes || '',
    };
    localStorage.setItem(getDailyKey(activeAcc.id), JSON.stringify(records));
    this.triggerAutoCloudSync(activeAcc.id);
  },

  addDailyCount(dateStr: string, delta: number): number {
    const activeAcc = this.getActiveAccount();
    const records = this.getDailyRecords(activeAcc.id);
    const current = records[dateStr]?.count || 0;
    const newCount = Math.max(0, current + delta);
    records[dateStr] = {
      date: dateStr,
      count: newCount,
    };
    localStorage.setItem(getDailyKey(activeAcc.id), JSON.stringify(records));
    this.triggerAutoCloudSync(activeAcc.id);
    return newCount;
  },

  recordDartsThrown(count: number): number {
    if (!count) return 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    return this.addDailyCount(todayStr, count);
  },

  // -------------------------------------------------------------
  // EXPORT / IMPORT ALL ACCOUNTS & DATA
  // -------------------------------------------------------------
  exportBackupJSON(): string {
    const accounts = this.getAccounts();
    const fullData: {
      version: number;
      exportedAt: string;
      accounts: UserAccount[];
      activeAccountId: string;
      accountData: Record<string, { history: SessionHistoryItem[]; daily: Record<string, DailyDartRecord> }>;
    } = {
      version: 2,
      exportedAt: new Date().toISOString(),
      accounts,
      activeAccountId: this.getActiveAccount().id,
      accountData: {},
    };

    accounts.forEach((acc) => {
      fullData.accountData[acc.id] = {
        history: this.getHistory(acc.id),
        daily: this.getDailyRecords(acc.id),
      };
    });

    return JSON.stringify(fullData, null, 2);
  },

  importBackupJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.version === 2 && Array.isArray(data.accounts)) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(data.accounts));
        if (data.activeAccountId) {
          localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, data.activeAccountId);
        }
        if (data.accountData && typeof data.accountData === 'object') {
          Object.keys(data.accountData).forEach((accId) => {
            const item = data.accountData[accId];
            if (item && Array.isArray(item.history)) {
              localStorage.setItem(getHistoryKey(accId), JSON.stringify(item.history));
            }
            if (item && item.daily && typeof item.daily === 'object') {
              localStorage.setItem(getDailyKey(accId), JSON.stringify(item.daily));
            }
          });
        }
        return true;
      }

      // V1 single-user legacy format import
      if (Array.isArray(data.history) || data.daily) {
        const activeAcc = this.getActiveAccount();
        if (Array.isArray(data.history)) {
          localStorage.setItem(getHistoryKey(activeAcc.id), JSON.stringify(data.history));
        }
        if (data.daily && typeof data.daily === 'object') {
          localStorage.setItem(getDailyKey(activeAcc.id), JSON.stringify(data.daily));
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};
