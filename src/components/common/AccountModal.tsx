import React, { useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  Lock,
  Mail,
  Smartphone,
  Trash2,
  Check,
  X,
  ArrowRight,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  LogOut,
  LogIn,
  AlertCircle,
  ExternalLink,
  Info,
  Shield,
  Camera,
} from 'lucide-react';
import { UserAccount } from '../../types';
import { storage } from '../../utils/storage';
import { sound } from '../../utils/sound';
import { cloudAuth, CloudUserProfile, formatAuthError } from '../../utils/firebase';
import { PlayerAvatar } from './PlayerAvatar';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAccount: UserAccount;
  onAccountChange: (account: UserAccount) => void;
}

const AVATAR_OPTIONS = ['🎯', '🦅', '🦁', '⚡', '🔥', '👑', '🐺', '🐉', '🏆', '🚀', '🥇', '🏹'];

// Helper to compress uploaded image into a fast, lightweight Data URL
function resizeAndCompressImage(file: File, maxDim = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  activeAccount,
  onAccountChange,
}) => {
  const [accounts, setAccounts] = useState<UserAccount[]>(storage.getAccounts());
  const [activeTab, setActiveTab] = useState<'profiles' | 'cloud' | 'backup'>('cloud');

  // Local Profile Creation
  const [isCreatingLocal, setIsCreatingLocal] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🎯');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [requirePin, setRequirePin] = useState<boolean>(false);

  // Edit file input refs
  const activeFileInputRef = useRef<HTMLInputElement | null>(null);
  const newProfileFileInputRef = useRef<HTMLInputElement | null>(null);
  const cloudRegisterFileInputRef = useRef<HTMLInputElement | null>(null);

  // Switching account with PIN authentication
  const [pinAuthTarget, setPinAuthTarget] = useState<UserAccount | null>(null);
  const [pinAttempt, setPinAttempt] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Cloud Account State
  const [cloudMode, setCloudMode] = useState<'login' | 'register'>('login');
  const [cloudEmail, setCloudEmail] = useState<string>('');
  const [cloudPassword, setCloudPassword] = useState<string>('');
  const [cloudDisplayName, setCloudDisplayName] = useState<string>('');
  const [cloudPhotoUrl, setCloudPhotoUrl] = useState<string>('');
  const [cloudLoading, setCloudLoading] = useState<boolean>(false);
  const [cloudError, setCloudError] = useState<string>('');
  const [cloudSuccess, setCloudSuccess] = useState<string>('');
  const [cloudSyncing, setCloudSyncing] = useState<boolean>(false);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState<boolean>(false);

  // Backup status
  const [backupMessage, setBackupMessage] = useState<string>('');

  if (!isOpen) return null;

  const refreshAccounts = () => {
    const list = storage.getAccounts();
    setAccounts(list);
    return list;
  };

  const handleSelectAccount = (target: UserAccount) => {
    sound.tap();
    if (target.id === activeAccount.id) return;

    if (target.pinCode) {
      setPinAuthTarget(target);
      setPinAttempt('');
      setPinError('');
      return;
    }

    const switched = storage.setActiveAccount(target.id);
    if (switched) {
      onAccountChange(switched);
      sound.hit();
      onClose();
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinAuthTarget) return;

    if (pinAttempt === pinAuthTarget.pinCode) {
      const switched = storage.setActiveAccount(pinAuthTarget.id);
      if (switched) {
        onAccountChange(switched);
        sound.oneEighty();
        setPinAuthTarget(null);
        onClose();
      }
    } else {
      sound.timeUp();
      setPinError('Incorrect 4-digit PIN');
      setPinAttempt('');
    }
  };

  // Upload photo directly to active profile
  const handleUpdateActivePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      sound.hit();
      const compressedDataUrl = await resizeAndCompressImage(file, 256);
      const updated = storage.updateAccount(activeAccount.id, { photoUrl: compressedDataUrl });
      if (updated) {
        onAccountChange(updated);
        refreshAccounts();
        setCloudSuccess('Profile photo updated successfully!');

        // If cloud user, push photo update to cloud profile
        if (updated.isCloudUser && updated.cloudUid) {
          const profile: CloudUserProfile = {
            uid: updated.cloudUid,
            username: updated.name,
            email: updated.email || '',
            avatarEmoji: updated.avatarEmoji || '🎯',
            photoUrl: compressedDataUrl,
            createdAt: updated.createdAt,
            lastSyncedAt: new Date().toISOString(),
          };
          const history = storage.getHistory(updated.id);
          const daily = storage.getDailyRecords(updated.id);
          cloudAuth.uploadDataToCloud(updated.cloudUid, history, daily, profile).catch(console.error);
        }
      }
    } catch (err) {
      console.error('Failed to process image:', err);
    }
  };

  const handleRemoveActivePhoto = () => {
    sound.tap();
    const updated = storage.updateAccount(activeAccount.id, { photoUrl: undefined });
    if (updated) {
      onAccountChange(updated);
      refreshAccounts();
      setCloudSuccess('Profile photo removed.');
    }
  };

  const handleCreateLocalAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    sound.hit();
    const created = storage.createAccount(
      nameInput.trim(),
      emailInput.trim() || undefined,
      selectedAvatar,
      requirePin && pinInput.length === 4 ? pinInput : undefined,
      { photoUrl: customPhotoUrl || undefined }
    );

    refreshAccounts();
    onAccountChange(created);
    setIsCreatingLocal(false);
    setNameInput('');
    setEmailInput('');
    setPinInput('');
    setCustomPhotoUrl('');
    setRequirePin(false);
    onClose();
  };

  const handleDeleteAccount = (accId: string, accName: string) => {
    if (accounts.length <= 1) {
      alert('You cannot delete the only existing account.');
      return;
    }

    if (window.confirm(`Delete profile "${accName}" and all of its match data from this device?`)) {
      sound.tap();
      storage.deleteAccount(accId);
      refreshAccounts();
      const newActive = storage.getActiveAccount();
      onAccountChange(newActive);
    }
  };

  // -------------------------------------------------------------
  // GOOGLE SIGN-IN VIA FIREBASE AUTH
  // -------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setCloudError('');
    setCloudSuccess('');
    setCloudLoading(true);

    try {
      const { user, profile } = await cloudAuth.signInWithGoogle(selectedAvatar);

      const linked = storage.createAccount(
        profile.username,
        profile.email,
        profile.avatarEmoji,
        undefined,
        {
          isCloudUser: true,
          cloudUid: user.uid,
          photoUrl: profile.photoUrl || user.photoURL || undefined,
        }
      );

      // Bidirectional sync guarantees userData/uid is always populated in Firebase
      const localHistory = storage.getHistory(activeAccount.id);
      const localDaily = storage.getDailyRecords(activeAccount.id);
      const synced = await cloudAuth.syncUserWithCloud(user.uid, localHistory, localDaily, profile);
      storage.setAccountData(linked.id, synced.history, synced.dailyRecords, true);

      sound.oneEighty();
      setCloudSuccess(`Signed in with Google as ${profile.username}!`);
      refreshAccounts();
      onAccountChange(linked);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      sound.timeUp();
      setCloudError(formatAuthError(err));
    } finally {
      setCloudLoading(false);
    }
  };

  // -------------------------------------------------------------
  // EMAIL / PASSWORD FIREBASE AUTH
  // -------------------------------------------------------------
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setCloudError('');
    setCloudSuccess('');
    setCloudLoading(true);

    try {
      if (cloudMode === 'register') {
        if (!cloudEmail.trim() || !cloudPassword.trim()) {
          throw new Error('Please enter your email and a password.');
        }

        const { user, profile } = await cloudAuth.registerWithEmail(
          cloudEmail.trim(),
          cloudPassword,
          cloudDisplayName.trim() || cloudEmail.split('@')[0],
          selectedAvatar,
          cloudPhotoUrl || undefined
        );

        // Upload current active account stats
        const localHistory = storage.getHistory(activeAccount.id);
        const localDaily = storage.getDailyRecords(activeAccount.id);
        await cloudAuth.uploadDataToCloud(user.uid, localHistory, localDaily, profile);

        const linked = storage.createAccount(
          profile.username,
          profile.email,
          profile.avatarEmoji,
          undefined,
          { isCloudUser: true, cloudUid: user.uid, photoUrl: profile.photoUrl || cloudPhotoUrl || undefined }
        );

        storage.setAccountData(linked.id, localHistory, localDaily, true);

        sound.oneEighty();
        setCloudSuccess('Firebase Cloud Account created & stats synced!');
        refreshAccounts();
        onAccountChange(linked);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // LOGIN
        if (!cloudEmail.trim() || !cloudPassword.trim()) {
          throw new Error('Please enter your email and password.');
        }

        const { user, profile } = await cloudAuth.signInWithEmail(cloudEmail.trim(), cloudPassword);

        const linked = storage.createAccount(
          profile.username,
          profile.email,
          profile.avatarEmoji || '🎯',
          undefined,
          { isCloudUser: true, cloudUid: user.uid, photoUrl: profile.photoUrl || undefined }
        );

        const localHistory = storage.getHistory(activeAccount.id);
        const localDaily = storage.getDailyRecords(activeAccount.id);
        const synced = await cloudAuth.syncUserWithCloud(user.uid, localHistory, localDaily, profile);
        storage.setAccountData(linked.id, synced.history, synced.dailyRecords, true);

        sound.hit();
        setCloudSuccess(`Logged in as ${profile.username}! Stats synced from Firebase.`);
        refreshAccounts();
        onAccountChange(linked);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      sound.timeUp();
      setCloudError(formatAuthError(err));
    } finally {
      setCloudLoading(false);
    }
  };

  const handleSyncToCloud = async () => {
    if (!activeAccount.isCloudUser || !activeAccount.cloudUid) {
      setCloudError('This is a local profile. Sign in with a Cloud Account to sync.');
      return;
    }

    setCloudSyncing(true);
    setCloudError('');
    setCloudSuccess('');

    try {
      const history = storage.getHistory(activeAccount.id);
      const daily = storage.getDailyRecords(activeAccount.id);
      const profile: CloudUserProfile = {
        uid: activeAccount.cloudUid,
        username: activeAccount.name,
        email: activeAccount.email || '',
        avatarEmoji: activeAccount.avatarEmoji || '🎯',
        photoUrl: activeAccount.photoUrl || undefined,
        createdAt: activeAccount.createdAt,
        lastSyncedAt: new Date().toISOString(),
      };

      await cloudAuth.uploadDataToCloud(activeAccount.cloudUid, history, daily, profile);
      storage.updateAccount(activeAccount.id, { lastSyncedAt: new Date().toISOString() });
      sound.hit();
      setCloudSuccess('All stats, averages & logs backed up to Firebase!');
      refreshAccounts();
    } catch (err: any) {
      sound.timeUp();
      setCloudError(err.message || 'Failed to sync stats to cloud.');
    } finally {
      setCloudSyncing(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!activeAccount.isCloudUser || !activeAccount.cloudUid) {
      setCloudError('This is a local profile. Sign in with a Cloud Account to restore.');
      return;
    }

    setCloudSyncing(true);
    setCloudError('');
    setCloudSuccess('');

    try {
      const cloudData = await cloudAuth.downloadDataFromCloud(activeAccount.cloudUid);
      if (cloudData) {
        storage.setAccountData(activeAccount.id, cloudData.history || [], cloudData.dailyRecords || {});
        storage.updateAccount(activeAccount.id, {
          lastSyncedAt: new Date().toISOString(),
          photoUrl: cloudData.profile?.photoUrl || activeAccount.photoUrl,
        });
        sound.oneEighty();
        setCloudSuccess(`Restored ${cloudData.history?.length || 0} match records from Firebase!`);
        refreshAccounts();
        const updated = storage.getActiveAccount();
        onAccountChange(updated);
      } else {
        setCloudSuccess('No prior cloud records found for this account.');
      }
    } catch (err: any) {
      sound.timeUp();
      setCloudError(err.message || 'Failed to restore stats from cloud.');
    } finally {
      setCloudSyncing(false);
    }
  };

  const handleCloudSignOut = async () => {
    try {
      await cloudAuth.logout();
      sound.tap();
      setCloudSuccess('Signed out of Firebase Cloud session.');
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // JSON BACKUP EXPORT & IMPORT
  // -------------------------------------------------------------
  const handleExportData = () => {
    sound.tap();
    const json = storage.exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dart-practice-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupMessage('Backup exported successfully! File downloaded.');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = storage.importBackupJSON(text);
        if (success) {
          sound.oneEighty();
          refreshAccounts();
          const newActive = storage.getActiveAccount();
          onAccountChange(newActive);
          setBackupMessage('All data, profiles, and match history successfully imported!');
        } else {
          sound.timeUp();
          alert('Invalid backup file structure.');
        }
      } catch (err) {
        sound.timeUp();
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-none">
                Player Profile & Cloud Sync
              </h2>
              <span className="text-[11px] text-neutral-400 font-medium leading-none">
                Add profile photo, switch players & sync stats
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-750 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Profile Quick Photo / Identity Banner */}
        <div className="bg-neutral-850 border border-neutral-750 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <PlayerAvatar
                photoUrl={activeAccount.photoUrl}
                avatarEmoji={activeAccount.avatarEmoji}
                name={activeAccount.name}
                size="lg"
                showEditBadge
                onEditClick={() => activeFileInputRef.current?.click()}
              />
              <input
                ref={activeFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpdateActivePhoto}
                className="hidden"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-white truncate">{activeAccount.name}</span>
                {activeAccount.isCloudUser ? (
                  <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                    <Cloud className="w-2.5 h-2.5" /> Firebase
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                    Local
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 truncate">
                {activeAccount.email || 'No email attached'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => activeFileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeAccount.photoUrl ? 'Change Photo' : 'Add Photo'}</span>
            </button>
            {activeAccount.photoUrl && (
              <button
                type="button"
                onClick={handleRemoveActivePhoto}
                title="Remove custom photo"
                className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
          <button
            type="button"
            onClick={() => {
              sound.tap();
              setActiveTab('cloud');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'cloud'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>Firebase Auth</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.tap();
              setActiveTab('profiles');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'profiles'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Profiles</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.tap();
              setActiveTab('backup');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Backup / Export</span>
          </button>
        </div>

        {/* TAB 1: FIREBASE CLOUD AUTH */}
        {activeTab === 'cloud' && (
          <div className="space-y-4">
            {activeAccount.isCloudUser ? (
              /* ALREADY SIGNED IN WITH FIREBASE */
              <div className="space-y-4 bg-neutral-850/60 p-4 rounded-2xl border border-neutral-800">
                <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      photoUrl={activeAccount.photoUrl}
                      avatarEmoji={activeAccount.avatarEmoji}
                      name={activeAccount.name}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{activeAccount.name}</span>
                        <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                          <Cloud className="w-2.5 h-2.5" /> Firebase Authenticated
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {activeAccount.email || activeAccount.cloudUid}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloudSignOut}
                    title="Sign out of Firebase"
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 border border-neutral-700 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Cloud Sync Operations */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-neutral-300 block">Cloud Synchronization</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={cloudSyncing}
                      onClick={handleSyncToCloud}
                      className="h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      {cloudSyncing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CloudUpload className="w-4 h-4" />
                      )}
                      <span>Push Stats to Firebase</span>
                    </button>

                    <button
                      type="button"
                      disabled={cloudSyncing}
                      onClick={handleRestoreFromCloud}
                      className="h-11 rounded-xl bg-neutral-800 hover:bg-neutral-750 disabled:opacity-50 text-neutral-200 hover:text-white text-xs font-bold border border-neutral-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      {cloudSyncing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CloudDownload className="w-4 h-4 text-cyan-400" />
                      )}
                      <span>Restore from Firebase</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Your practice records, checkout accuracy, profile picture, and dart sessions are secured via Firebase Authentication and rules.
                  </p>
                </div>
              </div>
            ) : (
              /* LOGIN & REGISTRATION OPTIONS */
              <div className="space-y-3.5 bg-neutral-850/60 p-4 rounded-2xl border border-neutral-800">
                {/* 1-Click Google Sign In */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={cloudLoading}
                    className="w-full h-11 rounded-2xl bg-white hover:bg-neutral-100 disabled:opacity-50 text-neutral-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-98 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In with Google (Includes Google Photo)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-neutral-500 text-xs">
                  <div className="flex-1 h-px bg-neutral-800" />
                  <span className="font-semibold text-[11px] uppercase tracking-wider">or with email</span>
                  <div className="flex-1 h-px bg-neutral-800" />
                </div>

                {/* Email / Password Form */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {cloudMode === 'login' ? 'Sign In with Email' : 'Register with Email'}
                    </span>
                    <div className="flex gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setCloudMode('login');
                          setCloudError('');
                          setCloudSuccess('');
                        }}
                        className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                          cloudMode === 'login' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCloudMode('register');
                          setCloudError('');
                          setCloudSuccess('');
                        }}
                        className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                          cloudMode === 'register' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                        }`}
                      >
                        Create
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleEmailAuth} className="space-y-2.5">
                    {cloudMode === 'register' && (
                      <>
                        {/* Optional Photo Upload in Cloud Registration */}
                        <div>
                          <label className="text-[11px] text-neutral-400 font-semibold block mb-1">
                            Profile Photo (Optional)
                          </label>
                          <div className="flex items-center gap-3">
                            <PlayerAvatar
                              photoUrl={cloudPhotoUrl}
                              avatarEmoji={selectedAvatar}
                              name={cloudDisplayName || 'Player'}
                              size="md"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => cloudRegisterFileInputRef.current?.click()}
                                className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold border border-neutral-700 flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{cloudPhotoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                              </button>
                              {cloudPhotoUrl && (
                                <button
                                  type="button"
                                  onClick={() => setCloudPhotoUrl('')}
                                  className="text-xs text-neutral-400 hover:text-rose-400"
                                >
                                  Remove
                                </button>
                              )}
                              <input
                                ref={cloudRegisterFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    const dataUrl = await resizeAndCompressImage(f, 256);
                                    setCloudPhotoUrl(dataUrl);
                                  }
                                }}
                                className="hidden"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-neutral-400 font-semibold block mb-1">
                            Display Name / Nickname
                          </label>
                          <input
                            type="text"
                            value={cloudDisplayName}
                            onChange={(e) => setCloudDisplayName(e.target.value)}
                            placeholder="e.g. LukeTheNuke"
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="text-[11px] text-neutral-400 font-semibold block mb-1">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={cloudEmail}
                          onChange={(e) => setCloudEmail(e.target.value)}
                          placeholder="player@example.com"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 font-semibold block mb-1">
                        Password <span className="text-rose-400">* (Min 6 chars)</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={cloudPassword}
                          onChange={(e) => setCloudPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={cloudLoading}
                      className="w-full h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                    >
                      {cloudLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : cloudMode === 'login' ? (
                        <LogIn className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>{cloudMode === 'login' ? 'Sign In with Email' : 'Create Firebase Account'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Error / Success Feedback */}
            {cloudError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <span>{cloudError}</span>
                  {cloudError.includes('operation-not-allowed') && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowFirebaseGuide(true)}
                        className="text-cyan-400 hover:underline font-bold flex items-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5" /> View how to enable Email/Password in Firebase Console
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {cloudSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{cloudSuccess}</span>
              </div>
            )}

            {/* Expandable Firebase Project Ownership & Configuration Guide */}
            <div className="border border-neutral-800 rounded-2xl bg-neutral-950/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
                className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Firebase Project Ownership & Console Settings</span>
                </div>
                <span className="text-[11px] text-neutral-500">{showFirebaseGuide ? 'Hide ▲' : 'Show ▼'}</span>
              </button>

              {showFirebaseGuide && (
                <div className="px-4 pb-4 text-xs text-neutral-300 space-y-3 border-t border-neutral-800/80 pt-3">
                  <p className="leading-relaxed">
                    This application is now connected to your own Firebase project:{' '}
                    <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono">
                      darts-practice-87
                    </code>
                  </p>

                  <div className="space-y-1.5 bg-neutral-900/90 p-3 rounded-xl border border-neutral-800">
                    <span className="font-bold text-white block text-[11px] uppercase tracking-wider">
                      Manage authentication in your Firebase Console:
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-400 leading-relaxed">
                      <li>
                        Open{' '}
                        <a
                          href="https://console.firebase.google.com/project/darts-practice-87/authentication/providers"
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          Firebase Authentication Sign-in Method Console <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>Click on <strong className="text-white">Email/Password</strong> under Sign-in providers.</li>
                      <li>Toggle <strong className="text-white">Enable</strong> and click Save.</li>
                    </ol>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    <strong>Note:</strong> Google Sign-In works out of the box with zero additional configuration needed.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LOCAL PROFILES */}
        {activeTab === 'profiles' && (
          <div className="space-y-3">
            {/* PIN Security Check */}
            {pinAuthTarget && (
              <form
                onSubmit={handleVerifyPin}
                className="bg-neutral-850 border border-neutral-750 rounded-2xl p-4 text-center space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  Enter 4-Digit PIN for {pinAuthTarget.name}
                </h3>
                <input
                  type="password"
                  maxLength={4}
                  value={pinAttempt}
                  onChange={(e) => setPinAttempt(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  autoFocus
                  className="w-32 mx-auto text-center tracking-widest font-mono text-2xl font-black bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
                {pinError && <p className="text-xs text-rose-400 font-bold">{pinError}</p>}
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setPinAuthTarget(null)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pinAttempt.length !== 4}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold hover:bg-emerald-500 shadow-md"
                  >
                    Unlock & Switch
                  </button>
                </div>
              </form>
            )}

            {isCreatingLocal ? (
              /* Create Local Profile Form */
              <form onSubmit={handleCreateLocalAccount} className="space-y-3 bg-neutral-850 p-4 rounded-2xl border border-neutral-750">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Create New Local Profile
                </h3>

                {/* Profile Photo Upload */}
                <div>
                  <label className="text-[11px] text-neutral-400 font-semibold block mb-1">
                    Profile Photo (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      photoUrl={customPhotoUrl}
                      avatarEmoji={selectedAvatar}
                      name={nameInput || 'Player'}
                      size="md"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => newProfileFileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold border border-neutral-700 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{customPhotoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                      </button>
                      {customPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setCustomPhotoUrl('')}
                          className="text-xs text-neutral-400 hover:text-rose-400"
                        >
                          Remove
                        </button>
                      )}
                      <input
                        ref={newProfileFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const dataUrl = await resizeAndCompressImage(f, 256);
                            setCustomPhotoUrl(dataUrl);
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="text-[11px] text-neutral-400 font-semibold block mb-1">
                    Profile Name / Nickname <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Luke, The Machine, DartKing"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Optional Email */}
                <div>
                  <label className="text-[11px] text-neutral-400 font-semibold block mb-1">
                    Email Address <span className="text-neutral-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="player@example.com"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Optional PIN Protection */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300 font-semibold select-none">
                    <input
                      type="checkbox"
                      checked={requirePin}
                      onChange={(e) => setRequirePin(e.target.checked)}
                      className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0"
                    />
                    <span>Protect this profile with a 4-digit PIN</span>
                  </label>

                  {requirePin && (
                    <div className="mt-2 pl-5">
                      <input
                        type="password"
                        maxLength={4}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 4 digits (e.g. 1234)"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white tracking-widest font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingLocal(false)}
                    className="flex-1 h-10 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Save Profile
                  </button>
                </div>
              </form>
            ) : (
              /* Profile List */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-400 px-1">
                  <span>Profiles on this Device ({accounts.length})</span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingLocal(true)}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add Profile</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {accounts.map((acc) => {
                    const isActive = acc.id === activeAccount.id;
                    const stats = storage.getHistory(acc.id);
                    const matchCount = stats.length;
                    const avg =
                      matchCount > 0
                        ? (
                            stats.reduce((accTotal, s) => {
                              if ('avg' in s.result) return accTotal + s.result.avg;
                              if ('threeDartAvg' in s.result) return accTotal + s.result.threeDartAvg;
                              return accTotal;
                            }, 0) / matchCount
                          ).toFixed(1)
                        : null;

                    return (
                      <div
                        key={acc.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isActive
                            ? 'bg-emerald-950/40 border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/30'
                            : 'bg-neutral-850/80 border-neutral-800 hover:border-neutral-750'
                        }`}
                      >
                        <div
                          onClick={() => handleSelectAccount(acc)}
                          className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                        >
                          <PlayerAvatar
                            photoUrl={acc.photoUrl}
                            avatarEmoji={acc.avatarEmoji}
                            name={acc.name}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-white truncate">{acc.name}</span>
                              {isActive && (
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                                  Active
                                </span>
                              )}
                              {acc.isCloudUser && (
                                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-0.5">
                                  <Cloud className="w-2.5 h-2.5" /> Firebase
                                </span>
                              )}
                              {acc.pinCode && <Lock className="w-3 h-3 text-amber-400" />}
                            </div>
                            <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                              <span>{matchCount} sessions</span>
                              {avg && <span className="text-emerald-400 font-mono font-bold">{avg} avg</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleSelectAccount(acc)}
                              className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-emerald-600 hover:text-white text-neutral-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>Switch</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {accounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(acc.id, acc.name)}
                              title="Delete account"
                              className="p-1.5 rounded-xl text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BACKUP / JSON EXPORT & IMPORT */}
        {activeTab === 'backup' && (
          <div className="space-y-3.5 bg-neutral-850/60 p-4 rounded-2xl border border-neutral-800">
            <div>
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Offline & Cross-Device JSON File Transfer
              </h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Export a standalone JSON file containing all saved player profiles, match histories, checkout statistics, profile photos, and daily dart tracking logs. You can import this file on any device without internet.
              </p>
            </div>

            {backupMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{backupMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                id="account-export-backup"
                onClick={handleExportData}
                className="h-11 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white text-xs font-bold border border-neutral-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Export Backup (.JSON)</span>
              </button>

              <label className="h-11 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white text-xs font-bold border border-neutral-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer">
                <CloudUpload className="w-4 h-4 text-cyan-400" />
                <span>Import Backup (.JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
