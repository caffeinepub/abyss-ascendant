import React from "react";
import type {
  AffixStat,
  GeneratedItem,
  ItemAffix,
} from "../engine/lootGenerator";

// Re-export StatKey as alias for backward compat
export type { AffixStat as StatKey };

interface ItemTooltipProps {
  item: GeneratedItem;
  className?: string;
}

const RARITY_COLORS: Record<string, string> = {
  Common: "text-foreground border-border",
  Uncommon: "text-green-400 border-green-400/40",
  Rare: "text-blue-400 border-blue-400/40",
  Legendary: "text-yellow-400 border-yellow-400/40",
};

const RARITY_BG: Record<string, string> = {
  Common: "bg-card",
  Uncommon: "bg-green-950/30",
  Rare: "bg-blue-950/30",
  Legendary: "bg-yellow-950/30",
};

// Map all valid stat keys to display labels and icons
const STAT_DISPLAY: Partial<
  Record<AffixStat, { label: string; icon: string; color: string }>
> = {
  str: { label: "Strength", icon: "💪", color: "text-red-400" },
  dex: { label: "Dexterity", icon: "🏃", color: "text-green-400" },
  int: { label: "Intelligence", icon: "🧠", color: "text-blue-400" },
  vit: { label: "Vitality", icon: "❤️", color: "text-pink-400" },
  hp: { label: "HP", icon: "💗", color: "text-pink-300" },
  physicalDamage: {
    label: "Physical Damage",
    icon: "⚔️",
    color: "text-orange-400",
  },
  magicDamage: { label: "Magic Damage", icon: "✨", color: "text-purple-400" },
  defense: { label: "Defense", icon: "🛡️", color: "text-cyan-400" },
  critChance: {
    label: "Critical Chance",
    icon: "🎯",
    color: "text-yellow-400",
  },
};

function AffixLine({ affix }: { affix: ItemAffix }) {
  const display = STAT_DISPLAY[affix.stat];

  if (!display) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>•</span>
        <span>
          +{affix.value} {affix.label}
        </span>
      </div>
    );
  }

  const suffix = affix.stat === "critChance" ? "%" : "";

  return (
    <div className={`flex items-center gap-2 text-xs ${display.color}`}>
      <span>{display.icon}</span>
      <span>
        +{affix.value}
        {suffix} {display.label}
      </span>
    </div>
  );
}

export default function ItemTooltip({
  item,
  className = "",
}: ItemTooltipProps) {
  const rarityClass = RARITY_COLORS[item.rarity] ?? RARITY_COLORS.Common;
  const bgClass = RARITY_BG[item.rarity] ?? RARITY_BG.Common;

  return (
    <div
      className={`rounded-lg border p-3 min-w-[180px] max-w-[240px] ${bgClass} ${rarityClass} ${className}`}
    >
      {/* Item Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{item.icon}</span>
        <div>
          <div className={`font-bold text-sm ${rarityClass.split(" ")[0]}`}>
            {item.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {item.rarity} {item.itemType}
          </div>
        </div>
      </div>

      {/* Base Weapon Damage */}
      {item.itemType === "Weapon" && item.baseDamage !== undefined && (
        <div className="border-t border-border/50 pt-2 mb-2">
          <div className="flex items-center gap-2 text-xs text-orange-400 font-semibold">
            <span>⚔️</span>
            <span>Base Damage: {item.baseDamage}</span>
          </div>
        </div>
      )}

      {/* Base Armor Defense */}
      {item.itemType === "Armor" && item.baseDefense !== undefined && (
        <div className="border-t border-border/50 pt-2 mb-2">
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold">
            <span>🛡️</span>
            <span>Base Defense: {item.baseDefense}</span>
          </div>
        </div>
      )}

      {/* Affixes */}
      {item.affixes.length > 0 && (
        <div className="space-y-1 border-t border-border/50 pt-2">
          {item.affixes.map((affix) => (
            <AffixLine key={affix.stat} affix={affix} />
          ))}
        </div>
      )}

      {item.affixes.length === 0 && !item.baseDamage && !item.baseDefense && (
        <div className="text-xs text-muted-foreground italic">No bonuses</div>
      )}
    </div>
  );
}

// Named export for use in other components
export function ItemCard({
  item,
  onClick,
  selected,
  className = "",
}: {
  item: GeneratedItem;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}) {
  const rarityClass = RARITY_COLORS[item.rarity] ?? RARITY_COLORS.Common;
  const bgClass = RARITY_BG[item.rarity] ?? RARITY_BG.Common;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-2 transition-all ${bgClass} ${rarityClass} ${
        selected ? "ring-2 ring-primary" : ""
      } ${onClick ? "hover:opacity-80 cursor-pointer" : "cursor-default"} ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{item.icon}</span>
        <div className="min-w-0 flex-1">
          <div
            className={`font-semibold text-xs truncate ${rarityClass.split(" ")[0]}`}
          >
            {item.name}
          </div>
          <div className="text-xs text-muted-foreground">{item.rarity}</div>
        </div>
      </div>

      {/* Base stats for weapons/armor */}
      {item.itemType === "Weapon" && item.baseDamage !== undefined && (
        <div className="mt-1 text-xs text-orange-400 font-semibold">
          ⚔️ {item.baseDamage} Base Dmg
        </div>
      )}
      {item.itemType === "Armor" && item.baseDefense !== undefined && (
        <div className="mt-1 text-xs text-cyan-400 font-semibold">
          🛡️ {item.baseDefense} Base Def
        </div>
      )}

      {item.affixes.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {item.affixes.map((affix) => {
            const display = STAT_DISPLAY[affix.stat];
            const suffix = affix.stat === "critChance" ? "%" : "";
            return (
              <div
                key={affix.stat}
                className={`text-xs ${display?.color ?? "text-muted-foreground"}`}
              >
                +{affix.value}
                {suffix} {display?.label ?? affix.label}
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
}

export function getRarityStyle(rarity: string) {
  return {
    text: RARITY_COLORS[rarity]?.split(" ")[0] ?? "text-foreground",
    border: RARITY_COLORS[rarity]?.split(" ")[1] ?? "border-border",
    bg: RARITY_BG[rarity] ?? "bg-card",
  };
}
