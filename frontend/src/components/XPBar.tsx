import React from 'react';
import { getXpForLevel } from '../types/game';

interface XPBarProps {
  level: number;
  xp: number;
  compact?: boolean;
}

export default function XPBar({ level, xp, compact = false }: XPBarProps) {
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const xpIntoLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progress = xpNeeded > 0 ? Math.min(100, (xpIntoLevel / xpNeeded) * 100) : 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-gothic">Lv.{level}</span>
        <div className="flex-1 h-1.5 bg-stone rounded-full overflow-hidden">
          <div
            className="h-full xp-bar rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{Math.floor(progress)}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-gothic text-dungeon-gold">Level {level}</span>
        <span className="text-xs text-muted-foreground">
          {xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
        </span>
      </div>
      <div className="h-2 bg-stone rounded-full overflow-hidden border border-stone-light">
        <div
          className="h-full xp-bar rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, boxShadow: '0 0 6px oklch(0.55 0.18 260 / 0.6)' }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{xp.toLocaleString()} total XP</span>
        <span>{(nextLevelXp - xp).toLocaleString()} to next level</span>
      </div>
    </div>
  );
}
