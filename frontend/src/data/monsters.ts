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

// All monsters have base HP of ~25-35 so level 1 encounters are fair.
// HP scales ~15% per level above 1 in combatEngine (so level 10 ≈ 2.35x base).
// Monsters are differentiated by attack speed, attack power, and defense rather than raw HP.
export const MONSTER_TEMPLATES: MonsterTemplate[] = [
  {
    id: 'goblin',
    name: 'Goblin',
    emoji: '👺',
    baseHp: 25,
    baseAttack: 5,
    baseDefense: 1,
    xpReward: 15,
    lootWeight: 10,
    ticksBetweenAttacks: 3,
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    emoji: '💀',
    baseHp: 28,
    baseAttack: 7,
    baseDefense: 2,
    xpReward: 20,
    lootWeight: 10,
    ticksBetweenAttacks: 3,
  },
  {
    id: 'orc',
    name: 'Orc',
    emoji: '👹',
    baseHp: 30,
    baseAttack: 9,
    baseDefense: 3,
    xpReward: 30,
    lootWeight: 8,
    ticksBetweenAttacks: 4,
  },
  {
    id: 'troll',
    name: 'Troll',
    emoji: '🧌',
    baseHp: 32,
    baseAttack: 11,
    baseDefense: 4,
    xpReward: 45,
    lootWeight: 7,
    ticksBetweenAttacks: 5,
  },
  {
    id: 'wraith',
    name: 'Wraith',
    emoji: '👻',
    baseHp: 27,
    baseAttack: 13,
    baseDefense: 2,
    xpReward: 55,
    lootWeight: 8,
    ticksBetweenAttacks: 2,
  },
  {
    id: 'vampire',
    name: 'Vampire',
    emoji: '🧛',
    baseHp: 30,
    baseAttack: 15,
    baseDefense: 4,
    xpReward: 65,
    lootWeight: 9,
    ticksBetweenAttacks: 3,
  },
  {
    id: 'demon',
    name: 'Demon',
    emoji: '😈',
    baseHp: 33,
    baseAttack: 17,
    baseDefense: 5,
    xpReward: 80,
    lootWeight: 8,
    ticksBetweenAttacks: 4,
  },
  {
    id: 'lich',
    name: 'Lich',
    emoji: '🧟',
    baseHp: 30,
    baseAttack: 20,
    baseDefense: 6,
    xpReward: 100,
    lootWeight: 9,
    ticksBetweenAttacks: 3,
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    baseHp: 35,
    baseAttack: 25,
    baseDefense: 8,
    xpReward: 150,
    lootWeight: 10,
    ticksBetweenAttacks: 5,
  },
  {
    id: 'elder_god',
    name: 'Elder God',
    emoji: '🌑',
    baseHp: 35,
    baseAttack: 30,
    baseDefense: 10,
    xpReward: 250,
    lootWeight: 10,
    ticksBetweenAttacks: 6,
  },
];
