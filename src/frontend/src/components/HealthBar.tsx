import { Heart } from "lucide-react";
import React from "react";

interface HealthBarProps {
  currentHP: number;
  maxHP: number;
  className?: string;
  compact?: boolean;
}

function getBarStyle(percentage: number) {
  if (percentage > 60) {
    return {
      color: "oklch(0.58 0.18 145)",
      shadow: "0 0 6px oklch(0.58 0.18 145 / 0.5)",
    };
  }
  if (percentage > 30) {
    return {
      color: "oklch(0.68 0.16 78)",
      shadow: "0 0 6px oklch(0.68 0.16 78 / 0.5)",
    };
  }
  return {
    color: "oklch(0.52 0.2 22)",
    shadow: "0 0 6px oklch(0.52 0.2 22 / 0.6)",
  };
}

export default function HealthBar({
  currentHP,
  maxHP,
  className = "",
  compact = false,
}: HealthBarProps) {
  const percentage =
    maxHP > 0 ? Math.max(0, Math.min(100, (currentHP / maxHP) * 100)) : 0;

  const barStyle = getBarStyle(percentage);

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Heart
          className="w-3 h-3 flex-shrink-0"
          fill={barStyle.color}
          style={{ color: barStyle.color }}
        />
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="relative h-1.5 w-20 rounded-full overflow-hidden flex-shrink-0"
            style={{ background: "oklch(0.16 0.018 258)" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${percentage}%`,
                background: barStyle.color,
                boxShadow: barStyle.shadow,
              }}
            />
          </div>
          <span
            className="text-[10px] font-mono whitespace-nowrap"
            style={{ color: "oklch(0.45 0.01 258)" }}
          >
            {Math.floor(currentHP)}/{maxHP}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Heart
        className="w-4 h-4 flex-shrink-0"
        fill={barStyle.color}
        style={{ color: barStyle.color }}
      />
      <div className="flex-1 min-w-0">
        <div
          className="relative h-3 rounded-full overflow-hidden"
          style={{
            background: "oklch(0.14 0.016 258)",
            border: "1px solid oklch(0.22 0.018 258 / 0.5)",
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${barStyle.color}, oklch(${barStyle.color.includes("145") ? "0.68 0.2 145" : barStyle.color.includes("78") ? "0.75 0.18 78" : "0.62 0.22 22"}))`,
              boxShadow: barStyle.shadow,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white/80 drop-shadow-sm">
              {Math.floor(currentHP)} / {maxHP}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
