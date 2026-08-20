import React from 'react';
import { Camera } from 'lucide-react';

interface PlayerAvatarProps {
  photoUrl?: string | null;
  avatarEmoji?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showEditBadge?: boolean;
  onEditClick?: () => void;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-xs',
  sm: 'w-7 h-7 text-sm',
  md: 'w-9 h-9 text-base',
  lg: 'w-12 h-12 text-xl',
  xl: 'w-16 h-16 text-3xl',
};

const getInitials = (name?: string) => {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  photoUrl,
  avatarEmoji,
  name = 'Player',
  size = 'md',
  className = '',
  showEditBadge = false,
  onEditClick,
}) => {
  const baseSize = sizeClasses[size];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${baseSize} ${className}`}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover rounded-xl border border-neutral-700 shadow-xs"
        />
      ) : avatarEmoji && avatarEmoji !== '🎯' ? (
        <div className="w-full h-full rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shadow-xs">
          <span>{avatarEmoji}</span>
        </div>
      ) : (
        <div className="w-full h-full rounded-xl bg-linear-to-br from-emerald-600 to-teal-800 border border-emerald-500/40 flex items-center justify-center font-bold text-white shadow-xs">
          <span className="font-mono">{getInitials(name)}</span>
        </div>
      )}

      {showEditBadge && (
        <button
          type="button"
          onClick={onEditClick}
          title="Upload or change profile photo"
          className="absolute -bottom-1 -right-1 p-1 rounded-full bg-neutral-900 border border-neutral-600 text-neutral-300 hover:text-white hover:bg-emerald-600 transition-colors shadow-md cursor-pointer"
        >
          <Camera className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
};
