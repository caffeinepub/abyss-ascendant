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

export type DungeonMode = 'catacombs' | 'depths' | 'ascension-trial';

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

export interface LocalCharacterState {
  // Mirrors backend Character but with local additions
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
  // Local-only state
  inventory: LocalItem[];
  stash: LocalItem[];
  equipped: EquippedItems;
  equippedAbilities: EquippedAbilities;
  statPoints: number;
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
  26000,  // level 21
  31000,  // level 22
  37000,  // level 23
  44000,  // level 24
  52000,  // level 25
  61000,  // level 26
  72000,  // level 27
  85000,  // level 28
  100000, // level 29
  120000, // level 30
  145000, // level 31
  175000, // level 32
  210000, // level 33
  250000, // level 34
  300000, // level 35
  360000, // level 36
  430000, // level 37
  510000, // level 38
  600000, // level 39
  700000, // level 40
  820000, // level 41
  960000, // level 42
  1120000,// level 43
  1300000,// level 44
  1500000,// level 45
  1750000,// level 46
  2050000,// level 47
  2400000,// level 48
  2800000,// level 49
  3300000,// level 50
];

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > XP_PER_LEVEL.length) return XP_PER_LEVEL[XP_PER_LEVEL.length - 1] * 2;
  return XP_PER_LEVEL[level - 1];
}

export function getLevelFromXp(xp: number): number {
  let level = 1;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (xp >= XP_PER_LEVEL[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

export function getStatPoints(level: number): number {
  // 5 base points + 3 per level
  return 5 + (level - 1) * 3;
}

export function getAbilityPoints(level: number): number {
  // 1 base + 1 per 5 levels
  return 1 + Math.floor((level - 1) / 5);
}
