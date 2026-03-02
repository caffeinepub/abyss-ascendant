import type { GeneratedItem } from '../engine/lootGenerator';

export type StatKey = 'str' | 'dex' | 'int' | 'vit';

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

export type Realm = 'Softcore' | 'Hardcore';
export type CharacterStatus = 'Alive' | 'Dead';

export interface LocalCharacter {
  id: number;
  name: string;
  realm: Realm;
  level: number;
  xp: number;
  status: CharacterStatus;
  stats: CharacterStats;
  baseStats: BaseStats;
  abilities: string[];
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

export function xpToNextLevel(totalXp: number): { current: number; needed: number; level: number } {
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
 * Formula: 1 + floor((level - 1) / 10)
 */
export function calculateAvailableAbilityPoints(level: number): number {
  return 1 + Math.floor((level - 1) / 10);
}

/**
 * Single source of truth for max HP calculation.
 * Formula: max(10, vit * 10 + 50 + bonusHp)
 */
export function calculateMaxHp(vit: number, bonusHp: number = 0): number {
  return Math.max(10, vit * 10 + 50 + bonusHp);
}

/**
 * Single source of truth for unspent stat points.
 * Formula: totalStatPointsEarned - totalStatPointsSpent
 */
export function calculateUnspentStatPoints(totalStatPointsEarned: number, totalStatPointsSpent: number): number {
  return Math.max(0, totalStatPointsEarned - totalStatPointsSpent);
}
