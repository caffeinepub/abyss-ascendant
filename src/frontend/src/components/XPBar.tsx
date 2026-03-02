import React from "react";
import { xpForLevel } from "../types/game";

interface XPBarProps {
  level: number;
  xp: number;
  compact?: boolean;
}

export default function XPBar({ level, xp, compact = false }: XPBarProps) {
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpIntoLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progress =
    xpNeeded > 0 ? Math.min(100, (xpIntoLevel / xpNeeded) * 100) : 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Lv.{level}</span>
        <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {Math.floor(progress)}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-primary font-medium">Level {level}</span>
        <span className="text-xs text-muted-foreground">
          {xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
        </span>
      </div>
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden border border-border">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{xp.toLocaleString()} total XP</span>
        <span>{(nextLevelXp - xp).toLocaleString()} to next level</span>
      </div>
    </div>
  );
}
