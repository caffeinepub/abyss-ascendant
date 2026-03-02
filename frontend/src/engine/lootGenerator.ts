import { Rarity } from '../backend';

export type StatKey =
  | 'str'
  | 'dex'
  | 'int'
  | 'vit'
  | 'hp'
  | 'physDmg'
  | 'magDmg'
  | 'defense'
  | 'critChance';

export interface ItemAffix {
  stat: StatKey;
  value: number;
  label: string;
}

export interface GeneratedItem {
  id: string;
  name: string;
  itemType: 'Weapon' | 'Armor' | 'Trinket';
  rarity: Rarity;
  affixes: ItemAffix[];
  icon: string;
}

// ── Valid affix pool (restricted to 9 valid stats only) ──
const VALID_AFFIXES: { stat: StatKey; label: string; minVal: number; maxVal: number }[] = [
  { stat: 'str',       label: '+Strength',        minVal: 1, maxVal: 8 },
  { stat: 'dex',       label: '+Dexterity',       minVal: 1, maxVal: 8 },
  { stat: 'int',       label: '+Intelligence',    minVal: 1, maxVal: 8 },
  { stat: 'vit',       label: '+Vitality',        minVal: 1, maxVal: 8 },
  { stat: 'hp',        label: '+HP',              minVal: 5, maxVal: 40 },
  { stat: 'physDmg',   label: '+Physical Damage', minVal: 1, maxVal: 10 },
  { stat: 'magDmg',    label: '+Magic Damage',    minVal: 1, maxVal: 10 },
  { stat: 'defense',   label: '+Defense',         minVal: 1, maxVal: 8 },
  { stat: 'critChance',label: '+Critical Chance', minVal: 1, maxVal: 5 },
];

const ITEM_NAMES: Record<string, string[]> = {
  Weapon: [
    'Iron Sword', 'Shadow Blade', 'Bone Staff', 'Elven Bow', 'War Axe',
    'Cursed Dagger', 'Thunder Mace', 'Void Wand', 'Serrated Knife', 'Runic Hammer',
  ],
  Armor: [
    'Leather Vest', 'Chain Mail', 'Shadow Cloak', 'Iron Plate', 'Bone Armor',
    'Silk Robe', 'Dragonhide Coat', 'Runic Breastplate', 'Tattered Shroud', 'Warden Cuirass',
  ],
  Trinket: [
    'Amulet of Power', 'Ring of Shadows', 'Cursed Talisman', 'Arcane Pendant',
    'Blood Stone', 'Void Crystal', 'Rune Charm', 'Bone Fetish', 'Storm Sigil', 'Ember Shard',
  ],
};

const RARITY_WEIGHTS = [
  { rarity: Rarity.Common,    weight: 60 },
  { rarity: Rarity.Uncommon,  weight: 25 },
  { rarity: Rarity.Rare,      weight: 12 },
  { rarity: Rarity.Legendary, weight: 3  },
];

const RARITY_AFFIX_COUNT: Record<Rarity, number> = {
  [Rarity.Common]:    1,
  [Rarity.Uncommon]:  2,
  [Rarity.Rare]:      3,
  [Rarity.Legendary]: 4,
};

function weightedRandom<T>(items: { weight: number; value?: T }[], values?: T[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= items[i].weight;
    if (roll <= 0) return values ? values[i] : (items[i] as unknown as { value: T }).value!;
  }
  return values ? values[values.length - 1] : (items[items.length - 1] as unknown as { value: T }).value!;
}

function pickRarity(): Rarity {
  const total = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of RARITY_WEIGHTS) {
    roll -= r.weight;
    if (roll <= 0) return r.rarity;
  }
  return Rarity.Common;
}

function generateAffixes(rarity: Rarity): ItemAffix[] {
  const count = RARITY_AFFIX_COUNT[rarity];
  const pool = [...VALID_AFFIXES];
  const chosen: ItemAffix[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const template = pool.splice(idx, 1)[0];
    const value = Math.floor(
      Math.random() * (template.maxVal - template.minVal + 1) + template.minVal
    );
    chosen.push({ stat: template.stat, value, label: template.label });
  }
  return chosen;
}

function pickItemType(): 'Weapon' | 'Armor' | 'Trinket' {
  const roll = Math.random();
  if (roll < 0.35) return 'Weapon';
  if (roll < 0.70) return 'Armor';
  return 'Trinket';
}

function pickName(itemType: 'Weapon' | 'Armor' | 'Trinket'): string {
  const names = ITEM_NAMES[itemType];
  return names[Math.floor(Math.random() * names.length)];
}

const ITEM_ICONS: Record<string, string> = {
  Weapon: '⚔️',
  Armor: '🛡️',
  Trinket: '💎',
};

// ── Drop rate: base probability reduced by 50% ──
// Original: ~0.6 base drop chance per monster kill
// New: ~0.3 base drop chance per monster kill
const BASE_DROP_CHANCE = 0.30;

export function generateLoot(
  dungeonLevel: number,
  monsterLootWeight: number,
  dungeonMode: 'Catacombs' | 'Depths' | 'AscensionTrial'
): GeneratedItem | null {
  // Mode multipliers (relative ratios preserved, overall halved)
  const modeMultiplier =
    dungeonMode === 'Catacombs'      ? 0.5  :
    dungeonMode === 'Depths'         ? 0.75 :
    /* AscensionTrial */               1.0;

  // lootWeight is 3–10; normalize to 0.3–1.0
  const weightFactor = monsterLootWeight / 10;

  const dropChance = BASE_DROP_CHANCE * modeMultiplier * weightFactor;

  if (Math.random() > dropChance) return null;

  const itemType = pickItemType();
  const rarity = pickRarity();
  const affixes = generateAffixes(rarity);
  const name = pickName(itemType);

  return {
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    itemType,
    rarity,
    affixes,
    icon: ITEM_ICONS[itemType],
  };
}

export function generateMultiLoot(
  dungeonLevel: number,
  monsterLootWeight: number,
  dungeonMode: 'Catacombs' | 'Depths' | 'AscensionTrial',
  killCount: number
): GeneratedItem[] {
  const drops: GeneratedItem[] = [];
  for (let i = 0; i < killCount; i++) {
    const item = generateLoot(dungeonLevel, monsterLootWeight, dungeonMode);
    if (item) drops.push(item);
  }
  return drops;
}
