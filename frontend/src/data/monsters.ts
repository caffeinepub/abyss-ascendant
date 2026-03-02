export interface MonsterTemplate {
  id: string;
  name: string;
  emoji: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  xpReward: number;
  lootWeight: number; // relative weight for loot drops
  ticksBetweenAttacks: number; // how many ticks between each monster attack
}

// Prefix and suffix pools for monster name generation
const MONSTER_PREFIXES = [
  'Vile', 'Rotting', 'Ancient', 'Cursed', 'Feral',
  'Festering', 'Hungering', 'Corrupted', 'Blighted', 'Savage',
  'Wretched', 'Forsaken', 'Twisted', 'Dread', 'Infernal',
];

const MONSTER_SUFFIXES = [
  'Brute', 'Warden', 'Scout', 'Shaman', 'Ravager',
  'Specter', 'Champion', 'Marauder', 'Stalker', 'Berserker',
];

/**
 * Generates a unique display name for a monster by combining a random prefix
 * and/or suffix with the base monster type name.
 */
export function generateMonsterDisplayName(baseName: string): string {
  const prefix = MONSTER_PREFIXES[Math.floor(Math.random() * MONSTER_PREFIXES.length)];
  const suffix = MONSTER_SUFFIXES[Math.floor(Math.random() * MONSTER_SUFFIXES.length)];
  // Always use both prefix and suffix for maximum variety
  return `${prefix} ${baseName} ${suffix}`;
}

// Base attack values reduced by ~12% from original
// HP scaling per level will be reduced 10% in combatEngine
export const MONSTER_TEMPLATES: MonsterTemplate[] = [
  {
    id: 'goblin',
    name: 'Goblin',
    emoji: '👺',
    baseHp: 30,
    baseAttack: 5,
    baseDefense: 2,
    xpReward: 15,
    lootWeight: 10,
    ticksBetweenAttacks: 3,
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    emoji: '💀',
    baseHp: 40,
    baseAttack: 7,
    baseDefense: 3,
    xpReward: 20,
    lootWeight: 10,
    ticksBetweenAttacks: 3,
  },
  {
    id: 'orc',
    name: 'Orc',
    emoji: '👹',
    baseHp: 60,
    baseAttack: 9,
    baseDefense: 4,
    xpReward: 30,
    lootWeight: 8,
    ticksBetweenAttacks: 4,
  },
  {
    id: 'troll',
    name: 'Troll',
    emoji: '🧌',
    baseHp: 90,
    baseAttack: 12,
    baseDefense: 5,
    xpReward: 45,
    lootWeight: 7,
    ticksBetweenAttacks: 5,
  },
  {
    id: 'wraith',
    name: 'Wraith',
    emoji: '👻',
    baseHp: 70,
    baseAttack: 14,
    baseDefense: 3,
    xpReward: 55,
    lootWeight: 8,
    ticksBetweenAttacks: 2,
  },
  {
    id: 'vampire',
    name: 'Vampire',
    emoji: '🧛',
    baseHp: 85,
    baseAttack: 16,
    baseDefense: 6,
    xpReward: 65,
    lootWeight: 9,
    ticksBetweenAttacks: 3,
  },
  {
    id: 'demon',
    name: 'Demon',
    emoji: '😈',
    baseHp: 110,
    baseAttack: 18,
    baseDefense: 7,
    xpReward: 80,
    lootWeight: 8,
    ticksBetweenAttacks: 4,
  },
  {
    id: 'lich',
    name: 'Lich',
    emoji: '🧟',
    baseHp: 130,
    baseAttack: 22,
    baseDefense: 8,
    xpReward: 100,
    lootWeight: 9,
    ticksBetweenAttacks: 3,
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    baseHp: 200,
    baseAttack: 28,
    baseDefense: 12,
    xpReward: 150,
    lootWeight: 10,
    ticksBetweenAttacks: 5,
  },
  {
    id: 'elder_god',
    name: 'Elder God',
    emoji: '🌑',
    baseHp: 300,
    baseAttack: 35,
    baseDefense: 15,
    xpReward: 250,
    lootWeight: 10,
    ticksBetweenAttacks: 6,
  },
];
