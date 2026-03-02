export interface MonsterTemplate {
  id: string;
  name: string;
  emoji: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  lootWeight: number;
  ticksBetweenAttacks: number;
}

export interface StatModifier {
  hp: number;
  attack: number;
  defense: number;
}

export interface MonsterPrefix {
  name: string;
  modifiers: StatModifier;
}

export interface MonsterSuffix {
  name: string;
  modifiers: StatModifier;
}

export interface GeneratedMonster {
  name: string;
  emoji: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  lootWeight: number;
  ticksBetweenAttacks: number;
}

// ─── Prefix pool (10+) ───────────────────────────────────────────────────────
// Each prefix adds flat bonuses to the base monster stats.
// Positive values boost a stat; negative values reduce it.
// Defense values reduced by 80% (keeping 20% of original).
export const MONSTER_PREFIXES: MonsterPrefix[] = [
  { name: 'Ancient',   modifiers: { hp: 12, attack: 4,  defense: 1  } },
  { name: 'Infernal',  modifiers: { hp: 4,  attack: 10, defense: 0  } },
  { name: 'Cursed',    modifiers: { hp: 6,  attack: 6,  defense: 1  } },
  { name: 'Withered',  modifiers: { hp: -4, attack: 2,  defense: 0  } },
  { name: 'Verdant',   modifiers: { hp: 8,  attack: 2,  defense: 1  } },
  { name: 'Dread',     modifiers: { hp: 5,  attack: 8,  defense: 1  } },
  { name: 'Spectral',  modifiers: { hp: 2,  attack: 7,  defense: 0  } },
  { name: 'Molten',    modifiers: { hp: 6,  attack: 9,  defense: 1  } },
  { name: 'Forsaken',  modifiers: { hp: 10, attack: 5,  defense: 1  } },
  { name: 'Elder',     modifiers: { hp: 15, attack: 8,  defense: 2  } },
  { name: 'Vile',      modifiers: { hp: 3,  attack: 6,  defense: 0  } },
  { name: 'Savage',    modifiers: { hp: 7,  attack: 7,  defense: 1  } },
];

// ─── Suffix pool (10+) ───────────────────────────────────────────────────────
// Defense values reduced by 80% (keeping 20% of original).
export const MONSTER_SUFFIXES: MonsterSuffix[] = [
  { name: 'Goblin',    modifiers: { hp: -5, attack: -2, defense: 0  } },
  { name: 'Warlord',   modifiers: { hp: 8,  attack: 8,  defense: 1  } },
  { name: 'Shade',     modifiers: { hp: -2, attack: 5,  defense: 0  } },
  { name: 'Colossus',  modifiers: { hp: 15, attack: 4,  defense: 2  } },
  { name: 'Serpent',   modifiers: { hp: 4,  attack: 6,  defense: 0  } },
  { name: 'Revenant',  modifiers: { hp: 6,  attack: 5,  defense: 1  } },
  { name: 'Wraith',    modifiers: { hp: 2,  attack: 8,  defense: 0  } },
  { name: 'Titan',     modifiers: { hp: 12, attack: 6,  defense: 2  } },
  { name: 'Fiend',     modifiers: { hp: 5,  attack: 9,  defense: 1  } },
  { name: 'Elder God', modifiers: { hp: 20, attack: 12, defense: 3  } },
  { name: 'Berserker', modifiers: { hp: 6,  attack: 11, defense: 0  } },
  { name: 'Stalker',   modifiers: { hp: 3,  attack: 7,  defense: 1  } },
];

// ─── Base monster type pool ───────────────────────────────────────────────────
// These are the "body" of the monster — prefix + base + suffix = full name.
// Defense values reduced by 80% (keeping 20% of original).
export const MONSTER_TEMPLATES: MonsterTemplate[] = [
  {
    id: 'goblin',
    name: 'Goblin',
    emoji: '👺',
    baseHp: 25,
    baseAttack: 5,
    baseDefense: 0,
    lootWeight: 10,
    ticksBetweenAttacks: 3,
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    emoji: '💀',
    baseHp: 28,
    baseAttack: 7,
    baseDefense: 0,
    lootWeight: 10,
    ticksBetweenAttacks: 3,
  },
  {
    id: 'orc',
    name: 'Orc',
    emoji: '👹',
    baseHp: 30,
    baseAttack: 9,
    baseDefense: 1,
    lootWeight: 8,
    ticksBetweenAttacks: 4,
  },
  {
    id: 'troll',
    name: 'Troll',
    emoji: '🧌',
    baseHp: 32,
    baseAttack: 11,
    baseDefense: 1,
    lootWeight: 7,
    ticksBetweenAttacks: 5,
  },
  {
    id: 'wraith',
    name: 'Wraith',
    emoji: '👻',
    baseHp: 27,
    baseAttack: 13,
    baseDefense: 0,
    lootWeight: 8,
    ticksBetweenAttacks: 2,
  },
  {
    id: 'vampire',
    name: 'Vampire',
    emoji: '🧛',
    baseHp: 30,
    baseAttack: 15,
    baseDefense: 1,
    lootWeight: 9,
    ticksBetweenAttacks: 3,
  },
  {
    id: 'demon',
    name: 'Demon',
    emoji: '😈',
    baseHp: 33,
    baseAttack: 17,
    baseDefense: 1,
    lootWeight: 8,
    ticksBetweenAttacks: 4,
  },
  {
    id: 'lich',
    name: 'Lich',
    emoji: '🧟',
    baseHp: 30,
    baseAttack: 20,
    baseDefense: 1,
    lootWeight: 9,
    ticksBetweenAttacks: 3,
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    baseHp: 35,
    baseAttack: 25,
    baseDefense: 2,
    lootWeight: 10,
    ticksBetweenAttacks: 5,
  },
  {
    id: 'elder_god',
    name: 'Elder God',
    emoji: '🌑',
    baseHp: 35,
    baseAttack: 30,
    baseDefense: 2,
    lootWeight: 10,
    ticksBetweenAttacks: 6,
  },
];

/**
 * Procedurally generates a unique monster by combining a random prefix,
 * a random base template, and a random suffix. The final stats are the
 * base template stats plus the flat modifiers from both prefix and suffix.
 * Returns a GeneratedMonster with the combined name and resolved stats.
 */
export function generateMonster(): GeneratedMonster {
  const template = MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];
  const prefix = MONSTER_PREFIXES[Math.floor(Math.random() * MONSTER_PREFIXES.length)];
  const suffix = MONSTER_SUFFIXES[Math.floor(Math.random() * MONSTER_SUFFIXES.length)];

  const name = `${prefix.name} ${template.name} ${suffix.name}`;

  const baseHp = Math.max(10, template.baseHp + prefix.modifiers.hp + suffix.modifiers.hp);
  const baseAttack = Math.max(1, template.baseAttack + prefix.modifiers.attack + suffix.modifiers.attack);
  const baseDefense = Math.max(0, template.baseDefense + prefix.modifiers.defense + suffix.modifiers.defense);

  return {
    name,
    emoji: template.emoji,
    baseHp,
    baseAttack,
    baseDefense,
    lootWeight: template.lootWeight,
    ticksBetweenAttacks: template.ticksBetweenAttacks,
  };
}
