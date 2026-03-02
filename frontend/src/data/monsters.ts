export interface MonsterTemplate {
  id: string;
  name: string;
  emoji: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  xpReward: number;
  lootWeight: number; // relative weight for loot drops
}

// Base attack values reduced by ~12% from original
// HP scaling per level will be reduced 10% in combatEngine
export const MONSTER_TEMPLATES: MonsterTemplate[] = [
  {
    id: 'goblin',
    name: 'Goblin',
    emoji: '👺',
    baseHp: 30,
    baseAttack: 5, // was ~6
    baseDefense: 2,
    xpReward: 15,
    lootWeight: 10,
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    emoji: '💀',
    baseHp: 40,
    baseAttack: 7, // was ~8
    baseDefense: 3,
    xpReward: 20,
    lootWeight: 10,
  },
  {
    id: 'orc',
    name: 'Orc',
    emoji: '👹',
    baseHp: 60,
    baseAttack: 10, // was ~12
    baseDefense: 5,
    xpReward: 30,
    lootWeight: 8,
  },
  {
    id: 'dark_mage',
    name: 'Dark Mage',
    emoji: '🧙',
    baseHp: 45,
    baseAttack: 13, // was ~15
    baseDefense: 2,
    xpReward: 35,
    lootWeight: 7,
  },
  {
    id: 'troll',
    name: 'Troll',
    emoji: '🧌',
    baseHp: 90,
    baseAttack: 14, // was ~16
    baseDefense: 6,
    xpReward: 45,
    lootWeight: 6,
  },
  {
    id: 'vampire',
    name: 'Vampire',
    emoji: '🧛',
    baseHp: 70,
    baseAttack: 17, // was ~20
    baseDefense: 4,
    xpReward: 55,
    lootWeight: 6,
  },
  {
    id: 'demon',
    name: 'Demon',
    emoji: '😈',
    baseHp: 110,
    baseAttack: 20, // was ~23
    baseDefense: 8,
    xpReward: 70,
    lootWeight: 5,
  },
  {
    id: 'lich',
    name: 'Lich',
    emoji: '☠️',
    baseHp: 130,
    baseAttack: 22, // was ~25
    baseDefense: 7,
    xpReward: 85,
    lootWeight: 4,
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    baseHp: 200,
    baseAttack: 30, // was ~35
    baseDefense: 12,
    xpReward: 120,
    lootWeight: 3,
  },
  {
    id: 'ancient_golem',
    name: 'Ancient Golem',
    emoji: '🗿',
    baseHp: 250,
    baseAttack: 25, // was ~29
    baseDefense: 18,
    xpReward: 100,
    lootWeight: 3,
  },
];
