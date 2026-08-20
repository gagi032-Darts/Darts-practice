import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  onValue,
  Database,
} from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const rtdb: Database = getDatabase(app);

export interface CloudUserProfile {
  uid: string;
  username: string;
  email: string;
  avatarEmoji: string;
  photoUrl?: string;
  createdAt: string;
  lastSyncedAt: string;
  stats?: {
    totalSessions: number;
    totalDarts: number;
    overallAvg?: number;
  };
}

export interface CloudSyncData {
  profile: CloudUserProfile;
  history: any[];
  dailyRecords: Record<string, any>;
  updatedAt: string;
}

/**
 * Format Firebase Auth and Database errors into friendly messages and instructions
 */
export function formatAuthError(error: any): string {
  const message = error?.message || (typeof error === 'string' ? error : '');
  const code = error?.code || '';

  if (message.includes('permission_denied') || message.includes('Permission denied')) {
    return 'Database permission denied: Please update your Realtime Database Rules in Firebase Console to allow authenticated read/write.';
  }
  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    return 'Domain unauthorized: Please add your domain to Firebase Console > Authentication > Settings > Authorized domains.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Sign-in method not enabled yet in your Firebase project. Please enable Email/Password or Google in Firebase Console (Authentication > Sign-in method).';
  }
  if (code === 'auth/email-already-in-use') {
    return 'This email is already registered. Please click "Sign In" instead of "Create".';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address (e.g. name@example.com).';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was closed before completing. Please try again.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
  }

  return message || 'Authentication failed. Please try again.';
}

/**
 * Firebase Authentication & Realtime Database Sync Service
 */
export const cloudAuth = {
  /**
   * Google 1-Click Sign-In via Firebase Auth
   */
  async signInWithGoogle(avatarEmoji: string = '🎯', customPhotoUrl?: string) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    let profile: CloudUserProfile = {
      uid: user.uid,
      username: user.displayName || user.email?.split('@')[0] || 'Player',
      email: user.email || '',
      avatarEmoji: avatarEmoji || '🎯',
      photoUrl: customPhotoUrl || user.photoURL || undefined,
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
    };

    // Sync profile with Realtime Database
    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, `users/${user.uid}`));
      if (snapshot.exists()) {
        profile = snapshot.val() as CloudUserProfile;
        // If Google provides a new photo and profile doesn't have one, keep Google photo
        if (!profile.photoUrl && (user.photoURL || customPhotoUrl)) {
          profile.photoUrl = customPhotoUrl || user.photoURL || undefined;
          await set(ref(rtdb, `users/${user.uid}`), profile);
        }
      } else {
        await set(ref(rtdb, `users/${user.uid}`), profile);
      }
    } catch (err) {
      console.warn('Realtime Database read/write notice:', err);
    }

    return { user, profile };
  },

  /**
   * Register with Email & Password via Firebase Auth
   */
  async registerWithEmail(
    email: string,
    password: string,
    username: string,
    avatarEmoji: string = '🎯',
    photoUrl?: string
  ) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (!cleanEmail.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    try {
      await updateProfile(user, {
        displayName: cleanUsername || user.email?.split('@')[0],
      });
    } catch {
      // ignore
    }

    const userProfile: CloudUserProfile = {
      uid: user.uid,
      username: cleanUsername || user.email?.split('@')[0] || 'Player',
      email: user.email || cleanEmail,
      avatarEmoji,
      photoUrl: photoUrl || undefined,
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
    };

    // Save profile in Realtime Database
    try {
      await set(ref(rtdb, `users/${user.uid}`), userProfile);
    } catch (err) {
      console.warn('Realtime Database save notice:', err);
    }

    return { user, profile: userProfile };
  },

  /**
   * Sign In with Email & Password via Firebase Auth
   */
  async signInWithEmail(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    let profile: CloudUserProfile = {
      uid: user.uid,
      username: user.displayName || user.email?.split('@')[0] || 'Player',
      email: user.email || cleanEmail,
      avatarEmoji: '🎯',
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
    };

    // Fetch user profile from Realtime Database
    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, `users/${user.uid}`));
      if (snapshot.exists()) {
        profile = snapshot.val() as CloudUserProfile;
      } else {
        await set(ref(rtdb, `users/${user.uid}`), profile);
      }
    } catch (err) {
      console.warn('Realtime Database fetch notice:', err);
    }

    return { user, profile };
  },

  /**
   * Sign Out
   */
  async logout() {
    await fbSignOut(auth);
  },

  /**
   * Listen to Firebase Auth state
   */
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Get current auth user
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  /**
   * Push full local history & daily records to Realtime Database
   */
  async uploadDataToCloud(
    uid: string,
    history: any[] = [],
    dailyRecords: Record<string, any> = {},
    profile: CloudUserProfile
  ) {
    const safeHistory = Array.isArray(history) ? history : [];
    const safeDaily = dailyRecords && typeof dailyRecords === 'object' ? dailyRecords : {};
    const totalDartsCount = Object.values(safeDaily).reduce((sum, d: any) => sum + (Number(d?.count) || 0), 0);

    const payload = {
      uid,
      profile: {
        ...profile,
        lastSyncedAt: new Date().toISOString(),
      },
      history: safeHistory,
      dailyRecords: safeDaily,
      updatedAt: new Date().toISOString(),
    };

    try {
      await set(ref(rtdb, `userData/${uid}`), payload);
      await set(ref(rtdb, `users/${uid}/lastSyncedAt`), new Date().toISOString());
      await set(ref(rtdb, `users/${uid}/stats`), {
        totalSessions: safeHistory.length,
        totalDarts: totalDartsCount,
      });
      return payload;
    } catch (err: any) {
      console.error('Realtime Database upload error:', err);
      throw new Error(err.message || 'Permission denied. Please check your Realtime Database Rules.');
    }
  },

  /**
   * Download user data from Realtime Database
   */
  async downloadDataFromCloud(uid: string): Promise<CloudSyncData | null> {
    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, `userData/${uid}`));
      if (snapshot.exists()) {
        const val = snapshot.val();
        return {
          profile: val?.profile || {},
          history: Array.isArray(val?.history) ? val.history : [],
          dailyRecords: val?.dailyRecords && typeof val.dailyRecords === 'object' ? val.dailyRecords : {},
          updatedAt: val?.updatedAt || new Date().toISOString(),
        } as CloudSyncData;
      }
      return null;
    } catch (err) {
      console.warn('Could not download Realtime Database data:', err);
      return null;
    }
  },

  /**
   * Auto sync local data with cloud (bidirectional smart merge/sync)
   * If userData/uid does not exist yet on cloud, it immediately uploads and creates it.
   */
  async syncUserWithCloud(
    uid: string,
    localHistory: any[] = [],
    localDaily: Record<string, any> = {},
    profile: CloudUserProfile
  ): Promise<{ history: any[]; dailyRecords: Record<string, any> }> {
    try {
      const cloudData = await this.downloadDataFromCloud(uid);

      // If cloud has no record yet, create userData/${uid} immediately with current local data
      if (!cloudData) {
        await this.uploadDataToCloud(uid, localHistory, localDaily, profile);
        return { history: localHistory, dailyRecords: localDaily };
      }

      // Merge history (deduplicate by id)
      const sessionMap = new Map<string, any>();
      (cloudData.history || []).forEach((item: any) => {
        if (item?.id) sessionMap.set(item.id, item);
      });
      (localHistory || []).forEach((item: any) => {
        if (item?.id) sessionMap.set(item.id, item);
      });
      const mergedHistory = Array.from(sessionMap.values()).sort(
        (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );

      // Merge daily records
      const mergedDaily: Record<string, any> = { ...(cloudData.dailyRecords || {}) };
      Object.entries(localDaily || {}).forEach(([dateStr, record]: [string, any]) => {
        const cloudCount = mergedDaily[dateStr]?.count || 0;
        const localCount = record?.count || 0;
        if (!mergedDaily[dateStr] || localCount > cloudCount) {
          mergedDaily[dateStr] = record;
        }
      });

      // If merged dataset has changes compared to cloud, update cloud
      if (
        mergedHistory.length !== (cloudData.history || []).length ||
        JSON.stringify(mergedDaily) !== JSON.stringify(cloudData.dailyRecords)
      ) {
        await this.uploadDataToCloud(uid, mergedHistory, mergedDaily, profile);
      }

      return { history: mergedHistory, dailyRecords: mergedDaily };
    } catch (err) {
      console.warn('Bidirectional sync notice:', err);
      return { history: localHistory, dailyRecords: localDaily };
    }
  },

  /**
   * Real-time listener for cloud data updates
   */
  subscribeToCloudData(uid: string, onUpdate: (data: CloudSyncData) => void) {
    const userRef = ref(rtdb, `userData/${uid}`);
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        onUpdate({
          profile: val?.profile || {},
          history: Array.isArray(val?.history) ? val.history : [],
          dailyRecords: val?.dailyRecords && typeof val.dailyRecords === 'object' ? val.dailyRecords : {},
          updatedAt: val?.updatedAt || new Date().toISOString(),
        } as CloudSyncData);
      }
    });
  },
};
