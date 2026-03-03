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
      <div className="flex items-center gap-2 w-full max-w-[220px]">
        <div
          className="relative h-2 flex-1 rounded-full overflow-hidden flex-shrink-0"
          style={{ background: "oklch(0.16 0.018 258)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, oklch(0.62 0.18 55), oklch(0.72 0.2 45))",
              boxShadow: "0 0 5px oklch(0.65 0.18 50 / 0.5)",
            }}
          />
        </div>
        <span
          className="text-[10px] font-mono whitespace-nowrap flex-shrink-0"
          style={{ color: "oklch(0.72 0.16 50)" }}
        >
          EXP: {xpIntoLevel}/{xpNeeded}
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
