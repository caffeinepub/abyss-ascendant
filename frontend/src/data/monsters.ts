export interface MonsterTemplate {
  id: string;
  name: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  minLevel: number;
  maxLevel?: number;
  ticksBetweenAttacks?: number; // legacy, now computed via getEnemyTicksBetweenAttacks
}

/**
 * Returns the number of ticks between attacks for an enemy at the given level.
 * Level 1 = 21 ticks, decreases by 1 every 5 levels, floor at 2.
 */
export function getEnemyTicksBetweenAttacks(level: number): number {
  return Math.max(2, 21 - Math.floor((level - 1) / 5));
}

export function getMonsterTemplates(): MonsterTemplate[] {
  return [
    {
      id: 'goblin',
      name: 'Goblin',
      baseHp: 25,
      baseAttack: 3,
      baseDefense: 1,
      minLevel: 1,
      maxLevel: 10,
    },
    {
      id: 'skeleton',
      name: 'Skeleton',
      baseHp: 28,
      baseAttack: 4,
      baseDefense: 2,
      minLevel: 1,
      maxLevel: 15,
    },
    {
      id: 'orc',
      name: 'Orc',
      baseHp: 35,
      baseAttack: 5,
      baseDefense: 3,
      minLevel: 3,
      maxLevel: 20,
    },
    {
      id: 'troll',
      name: 'Troll',
      baseHp: 45,
      baseAttack: 6,
      baseDefense: 4,
      minLevel: 5,
      maxLevel: 25,
    },
    {
      id: 'dark-elf',
      name: 'Dark Elf',
      baseHp: 30,
      baseAttack: 8,
      baseDefense: 3,
      minLevel: 8,
      maxLevel: 30,
    },
    {
      id: 'werewolf',
      name: 'Werewolf',
      baseHp: 40,
      baseAttack: 9,
      baseDefense: 4,
      minLevel: 10,
      maxLevel: 35,
    },
    {
      id: 'vampire',
      name: 'Vampire',
      baseHp: 35,
      baseAttack: 10,
      baseDefense: 5,
      minLevel: 15,
      maxLevel: 40,
    },
    {
      id: 'dragon',
      name: 'Dragon',
      baseHp: 60,
      baseAttack: 14,
      baseDefense: 10,
      minLevel: 20,
    },
    {
      id: 'lich',
      name: 'Lich',
      baseHp: 50,
      baseAttack: 16,
      baseDefense: 8,
      minLevel: 25,
    },
    {
      id: 'elder-god',
      name: 'Elder God',
      baseHp: 80,
      baseAttack: 20,
      baseDefense: 15,
      minLevel: 35,
    },
  ];
}
