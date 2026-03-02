import { Heart } from "lucide-react";
import React from "react";

interface HealthBarProps {
  currentHP: number;
  maxHP: number;
  className?: string;
  compact?: boolean;
}

export default function HealthBar({
  currentHP,
  maxHP,
  className = "",
  compact = false,
}: HealthBarProps) {
  const percentage =
    maxHP > 0 ? Math.max(0, Math.min(100, (currentHP / maxHP) * 100)) : 0;

  const getBarColor = () => {
    if (percentage > 60) return "bg-health-high";
    if (percentage > 30) return "bg-health-mid";
    return "bg-health-low";
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Heart
          className="w-3.5 h-3.5 text-health-low flex-shrink-0"
          fill="currentColor"
        />
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="relative h-2 w-20 bg-surface-2 rounded-full overflow-hidden flex-shrink-0">
            <div
              className={`absolute inset-y-0 left-0 ${getBarColor()} rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs text-muted font-mono whitespace-nowrap">
            {currentHP}/{maxHP}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Heart
        className="w-4 h-4 text-health-low flex-shrink-0"
        fill="currentColor"
      />
      <div className="flex-1 min-w-0">
        <div className="relative h-3 bg-surface-2 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 ${getBarColor()} rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${percentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white drop-shadow-sm">
              {currentHP} / {maxHP}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
