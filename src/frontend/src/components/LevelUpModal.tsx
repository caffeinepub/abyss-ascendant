import { Minus, Plus, TrendingUp } from "lucide-react";
import React, { useState } from "react";
import type { LocalCharacter } from "../types/game";

interface LevelUpModalProps {
  character: LocalCharacter;
  newLevel: number;
  statPointsToSpend: number;
  onConfirm: (statsUpdate: {
    strIncrease: number;
    dexIncrease: number;
    intIncrease: number;
    vitIncrease: number;
    newTotalSpent: number;
  }) => void;
  onClose: () => void;
}

export default function LevelUpModal({
  character,
  newLevel,
  statPointsToSpend,
  onConfirm,
  onClose,
}: LevelUpModalProps) {
  const [allocated, setAllocated] = useState({
    str: 0,
    dex: 0,
    int: 0,
    vit: 0,
  });

  const totalAllocated =
    allocated.str + allocated.dex + allocated.int + allocated.vit;
  const remaining = statPointsToSpend - totalAllocated;

  const handleIncrease = (stat: keyof typeof allocated) => {
    if (remaining <= 0) return;
    setAllocated((prev) => ({ ...prev, [stat]: prev[stat] + 1 }));
  };

  const handleDecrease = (stat: keyof typeof allocated) => {
    if (allocated[stat] <= 0) return;
    setAllocated((prev) => ({ ...prev, [stat]: prev[stat] - 1 }));
  };

  const handleConfirm = () => {
    // Calculate the new total spent = current spent + newly allocated
    const currentSpent = character.totalStatPointsSpent;
    const newTotalSpent = currentSpent + totalAllocated;

    onConfirm({
      strIncrease: allocated.str,
      dexIncrease: allocated.dex,
      intIncrease: allocated.int,
      vitIncrease: allocated.vit,
      newTotalSpent,
    });
  };

  const statRows = [
    {
      key: "str" as const,
      label: "Strength",
      abbr: "STR",
      current: character.stats.str,
      color: "text-orange-400",
      desc: "Increases physical damage",
    },
    {
      key: "dex" as const,
      label: "Dexterity",
      abbr: "DEX",
      current: character.stats.dex,
      color: "text-green-400",
      desc: "Increases attack speed & crit",
    },
    {
      key: "int" as const,
      label: "Intelligence",
      abbr: "INT",
      current: character.stats.int,
      color: "text-blue-400",
      desc: "Increases spell power",
    },
    {
      key: "vit" as const,
      label: "Vitality",
      abbr: "VIT",
      current: character.stats.vit,
      color: "text-red-400",
      desc: "Increases max HP",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface-1 border border-border rounded-lg w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-border text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-cinzel font-bold text-accent">
              Level Up!
            </h2>
          </div>
          <p className="text-foreground font-semibold">
            {character.name} reached Level {newLevel}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            You have{" "}
            <span className="text-accent font-bold">{statPointsToSpend}</span>{" "}
            stat point
            {statPointsToSpend !== 1 ? "s" : ""} to spend
          </p>
        </div>

        {/* Stat allocation */}
        <div className="p-5 space-y-3">
          {statRows.map(({ key, label, abbr, current, color, desc }) => (
            <div
              key={key}
              className="flex items-center gap-3 bg-surface-2 rounded-lg p-3"
            >
              <div className="w-12 text-center">
                <div className={`text-xs font-bold ${color}`}>{abbr}</div>
                <div className="text-lg font-bold text-foreground">
                  {current + allocated[key]}
                </div>
                {allocated[key] > 0 && (
                  <div className={`text-xs ${color}`}>+{allocated[key]}</div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">
                  {label}
                </div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDecrease(key)}
                  disabled={allocated[key] <= 0}
                  className="w-7 h-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleIncrease(key)}
                  disabled={remaining <= 0}
                  className="w-7 h-7 rounded border border-accent/50 flex items-center justify-center text-accent hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Remaining points */}
        <div className="px-5 pb-2 text-center">
          <span className="text-sm text-muted-foreground">
            Remaining points:{" "}
            <span
              className={
                remaining > 0
                  ? "text-accent font-bold"
                  : "text-foreground font-bold"
              }
            >
              {remaining}
            </span>
          </span>
        </div>

        {/* Footer */}
        <div className="p-5 pt-3 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-sm"
          >
            Decide Later
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={remaining > 0}
            className="flex-1 py-2 rounded bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
          >
            {remaining > 0
              ? `Spend ${remaining} more point${remaining !== 1 ? "s" : ""}`
              : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
