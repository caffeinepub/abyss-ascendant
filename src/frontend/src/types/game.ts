import type { GeneratedItem } from "../engine/lootGenerator";

export type StatKey = "str" | "dex" | "int" | "vit";
export type CharacterClass = "Warrior" | "Rogue" | "Mage";

export interface BaseStats {
  str: number;
  dex: number;
  int: number;
  vit: number;
}

export interface CharacterStats extends BaseStats {
  maxHp: number;
  currentHp: number;
  critChance: number;
  critPower: number;
}

export interface CombatResult {
  victory: boolean;
  log: string[];
  xpEarned: number;
  loot: GeneratedItem[];
  remainingHp: number;
  monstersDefeated: number;
}

export type Realm = "Softcore" | "Hardcore";
export type CharacterStatus = "Alive" | "Dead";

export interface LocalCharacter {
  id: number;
  name: string;
  class: CharacterClass;
  realm: Realm;
  level: number;
  xp: number;
  status: CharacterStatus;
  stats: CharacterStats;
  baseStats: BaseStats;
  /** Legacy single-ability field kept for backward compat; prefer equippedAbilities */
  abilities: string[];
  /** Up to 3 equipped ability IDs */
  equippedAbilities: string[];
  equippedItems: GeneratedItem[];
  inventory: GeneratedItem[];
  stash: GeneratedItem[];
  pendingStatPoints: number;
  totalStatPointsEarned: number;
  totalStatPointsSpent: number;
  abilityPoints: number;
}

export const XP_PER_LEVEL = 100;
export const MAX_LEVEL = 50;
export const BASE_CRIT_CHANCE = 5;
export const BASE_CRIT_POWER = 50;

export function xpForLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

/** Alias kept for backward compatibility */
export const getXpForLevel = xpForLevel;

export function calculateLevel(totalXp: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (level < MAX_LEVEL) {
    xpNeeded += xpForLevel(level);
    if (totalXp < xpNeeded) break;
    level++;
  }
  return level;
}

export function xpToNextLevel(totalXp: number): {
  current: number;
  needed: number;
  level: number;
} {
  const level = calculateLevel(totalXp);
  let xpUsed = 0;
  for (let l = 1; l < level; l++) {
    xpUsed += xpForLevel(l);
  }
  const current = totalXp - xpUsed;
  const needed = xpForLevel(level);
  return { current, needed, level };
}

/**
 * Single source of truth for available ability points.
 * Formula: 1 at level 1, +1 at levels 20, 40, 60, 80 (no point at 100).
 * Total max: 5 points.
 */
export function calculateAvailableAbilityPoints(level: number): number {
  let points = 1;
  if (level >= 20) points++;
  if (level >= 40) points++;
  if (level >= 60) points++;
  if (level >= 80) points++;
  return Math.min(5, points);
}

/**
 * Single source of truth for max HP calculation.
 * Formula: max(10, vit * 10 + 50 + bonusHp)
 */
export function calculateMaxHp(vit: number, bonusHp = 0): number {
  return Math.max(10, vit * 10 + 50 + bonusHp);
}

/**
 * Single source of truth for unspent stat points.
 * Accepts either (earned, spent) numbers or a LocalCharacter object.
 */
export function calculateUnspentStatPoints(
  earnedOrChar: number | LocalCharacter,
  spent?: number,
): number {
  if (typeof earnedOrChar === "object") {
    return Math.max(
      0,
      earnedOrChar.totalStatPointsEarned - earnedOrChar.totalStatPointsSpent,
    );
  }
  return Math.max(0, earnedOrChar - (spent ?? 0));
}

/**
 * Apply class stat bonus to base stats.
 * Warrior: +3 STR, Rogue: +3 DEX, Mage: +3 INT
 */
export function applyClassStatBonus(
  stats: BaseStats,
  characterClass: CharacterClass,
): BaseStats {
  switch (characterClass) {
    case "Warrior":
      return { ...stats, str: stats.str + 3 };
    case "Rogue":
      return { ...stats, dex: stats.dex + 3 };
    case "Mage":
      return { ...stats, int: stats.int + 3 };
    default:
      return stats;
  }
}
