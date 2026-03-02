// Core game types used throughout the frontend
// Backend types are imported from 'src/backend'

export type Screen =
  | 'login'
  | 'profile-setup'
  | 'character-creation'
  | 'character-sheet'
  | 'dungeon-select'
  | 'dungeon-run'
  | 'inventory'
  | 'marketplace'
  | 'leaderboard'
  | 'professions'
  | 'shrines';

// DungeonMode: Catacombs and Depths replaced by numeric level input.
// Only AscensionTrial remains as a named mode.
export type DungeonMode = 'AscensionTrial';

export interface DungeonRunConfig {
  mode: DungeonMode | 'Standard';
  monsterLevel: number;
}

export interface LocalItem {
  id: string;
  name: string;
  itemType: 'Weapon' | 'Armor' | 'Trinket';
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
  stats: {
    str: number;
    dex: number;
    int: number;
    vit: number;
    bonus: string;
  };
  affixes: ItemAffix[];
  owner?: string;
}

export interface ItemAffix {
  name: string;
  value: number;
  type: 'str' | 'dex' | 'int' | 'vit' | 'damage' | 'defense' | 'crit' | 'regen' | 'speed';
}

export interface EquippedItems {
  weapon: LocalItem | null;
  armor: LocalItem | null;
  trinket: LocalItem | null;
}

export interface EquippedAbilities {
  slot1: string | null;
  slot2: string | null;
  slot3: string | null;
}

// LocalCharacterState — kept for backward compatibility with LevelUpModal and other components
export interface LocalCharacterState {
  name: string;
  realm: 'Softcore' | 'Hardcore';
  classTier: number;
  level: number;
  xp: number;
  season: number;
  status: 'Alive' | 'Dead';
  str: number;
  dex: number;
  int: number;
  vit: number;
  statPoints: number;
  inventory: LocalItem[];
  stash: LocalItem[];
  equipped: EquippedItems;
  equippedAbilities: EquippedAbilities;
  abilityPoints: number;
  gold: number;
}

export interface CombatLogEntry {
  tick: number;
  message: string;
  type: 'player-attack' | 'monster-attack' | 'ability' | 'crit' | 'heal' | 'system' | 'victory' | 'defeat';
}

export interface CombatState {
  playerHp: number;
  playerMaxHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  monsterName: string;
  tick: number;
  log: CombatLogEntry[];
  status: 'idle' | 'running' | 'victory' | 'defeat';
  xpGained: number;
  lootDrops: LocalItem[];
}

export const CLASS_TIERS: Record<number, { name: string; title: string; color: string; ascensionLevel: number }> = {
  1: { name: 'Wanderer', title: 'The Wanderer', color: 'text-rarity-common', ascensionLevel: 10 },
  2: { name: 'Seeker', title: 'The Seeker', color: 'text-rarity-uncommon', ascensionLevel: 20 },
  3: { name: 'Vanguard', title: 'The Vanguard', color: 'text-rarity-rare', ascensionLevel: 35 },
  4: { name: 'Ascendant', title: 'The Ascendant', color: 'text-rarity-legendary', ascensionLevel: 50 },
  5: { name: 'Eternal', title: 'The Eternal', color: 'legendary-shimmer', ascensionLevel: 999 },
};

export const XP_PER_LEVEL: number[] = [
  0,      // level 1
  100,    // level 2
  250,    // level 3
  450,    // level 4
  700,    // level 5
  1000,   // level 6
  1400,   // level 7
  1900,   // level 8
  2500,   // level 9
  3200,   // level 10
  4000,   // level 11
  5000,   // level 12
  6200,   // level 13
  7600,   // level 14
  9200,   // level 15
  11000,  // level 16
  13000,  // level 17
  15500,  // level 18
  18500,  // level 19
  22000,  // level 20
];

/**
 * Returns the total XP required to reach the given level.
 * Exported for use in XPBar and other components.
 */
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level - 1 < XP_PER_LEVEL.length) return XP_PER_LEVEL[level - 1];
  // Beyond level 20: extrapolate
  const base = XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
  const extra = (level - XP_PER_LEVEL.length) * 5000;
  return base + extra;
}
