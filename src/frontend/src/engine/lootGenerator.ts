import { Rarity } from "../backend";

export type ItemType = "Weapon" | "Armor" | "Trinket";

export type AffixStat =
  | "str"
  | "dex"
  | "int"
  | "vit"
  | "hp"
  | "physicalDamage"
  | "magicDamage"
  | "defense"
  | "critChance";

// Backward-compat alias
export type StatKey = AffixStat;

export interface ItemAffix {
  stat: AffixStat;
  value: number;
  label: string;
}

export interface GeneratedItem {
  id: string;
  name: string;
  itemType: ItemType;
  rarity: Rarity;
  affixes: ItemAffix[];
  icon: string; // emoji icon for display
  baseDamage?: number; // Weapons only
  baseDefense?: number; // Armor only
  itemLevel: number;
}

// ── Helpers ──

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// ── Rarity weights by monster level ──

function getRarityWeights(monsterLevel: number): Record<Rarity, number> {
  const lvl = Math.max(1, monsterLevel);
  const legendaryChance = Math.min(0.05, lvl * 0.0004);
  const rareChance = Math.min(0.15, lvl * 0.001);
  const uncommonChance = Math.min(0.3, 0.1 + lvl * 0.002);
  const commonChance = Math.max(
    0.5,
    1 - legendaryChance - rareChance - uncommonChance,
  );

  return {
    [Rarity.Common]: commonChance,
    [Rarity.Uncommon]: uncommonChance,
    [Rarity.Rare]: rareChance,
    [Rarity.Legendary]: legendaryChance,
  };
}

function rollRarity(monsterLevel: number): Rarity {
  const weights = getRarityWeights(monsterLevel);
  const roll = Math.random();
  let cumulative = 0;

  for (const [rarity, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll < cumulative) return rarity as Rarity;
  }
  return Rarity.Common;
}

// ── Rarity multipliers for affix values ──

function rarityMultiplier(rarity: Rarity): number {
  switch (rarity) {
    case Rarity.Common:
      return 1.0;
    case Rarity.Uncommon:
      return 1.5;
    case Rarity.Rare:
      return 2.5;
    case Rarity.Legendary:
      return 4.0;
  }
}

// ── Affix count by rarity ──

function affixCount(rarity: Rarity): number {
  switch (rarity) {
    case Rarity.Common:
      return rand(1, 2);
    case Rarity.Uncommon:
      return rand(2, 3);
    case Rarity.Rare:
      return rand(3, 4);
    case Rarity.Legendary:
      return rand(4, 5);
  }
}

// ── Stat ranges (REDUCED BY 75% from original values) ──
// Average values are ~25% of what they were before.

const AFFIX_RANGES: Record<
  AffixStat,
  { min: number; max: number; label: string }
> = {
  str: { min: 1, max: 2, label: "+Strength" },
  dex: { min: 1, max: 2, label: "+Dexterity" },
  int: { min: 1, max: 2, label: "+Intelligence" },
  vit: { min: 1, max: 2, label: "+Vitality" },
  hp: { min: 2, max: 5, label: "+HP" },
  physicalDamage: { min: 1, max: 3, label: "+Physical Damage" },
  magicDamage: { min: 1, max: 3, label: "+Magic Damage" },
  defense: { min: 1, max: 3, label: "+Defense" },
  critChance: { min: 1, max: 2, label: "+Crit Chance" },
};

const WEAPON_AFFIXES: AffixStat[] = [
  "str",
  "dex",
  "physicalDamage",
  "magicDamage",
  "critChance",
];
const ARMOR_AFFIXES: AffixStat[] = ["vit", "str", "defense", "hp"];
const TRINKET_AFFIXES: AffixStat[] = [
  "str",
  "dex",
  "int",
  "vit",
  "hp",
  "critChance",
  "magicDamage",
];

function getAffixPool(itemType: ItemType): AffixStat[] {
  switch (itemType) {
    case "Weapon":
      return WEAPON_AFFIXES;
    case "Armor":
      return ARMOR_AFFIXES;
    case "Trinket":
      return TRINKET_AFFIXES;
  }
}

function generateAffixes(
  itemType: ItemType,
  rarity: Rarity,
  monsterLevel: number,
): ItemAffix[] {
  const pool = getAffixPool(itemType);
  const count = affixCount(rarity);
  const mult = rarityMultiplier(rarity);
  const levelScale = 1 + (monsterLevel - 1) * 0.02;

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, pool.length));

  return selected.map((stat) => {
    const range = AFFIX_RANGES[stat];
    const rawValue = randFloat(range.min, range.max) * mult * levelScale;
    const value = Math.max(1, Math.round(rawValue));
    return { stat, value, label: range.label };
  });
}

// ── Item names ──

const WEAPON_PREFIXES = [
  "Iron",
  "Steel",
  "Shadow",
  "Flame",
  "Frost",
  "Thunder",
  "Void",
  "Ancient",
];
const WEAPON_SUFFIXES = [
  "Sword",
  "Axe",
  "Dagger",
  "Staff",
  "Mace",
  "Bow",
  "Spear",
  "Wand",
];
const ARMOR_PREFIXES = [
  "Leather",
  "Chain",
  "Plate",
  "Shadow",
  "Runed",
  "Blessed",
  "Cursed",
  "Ancient",
];
const ARMOR_SUFFIXES = [
  "Helm",
  "Chestplate",
  "Gauntlets",
  "Greaves",
  "Boots",
  "Pauldrons",
  "Bracers",
  "Cloak",
];
const TRINKET_NAMES = [
  "Amulet",
  "Ring",
  "Talisman",
  "Charm",
  "Pendant",
  "Sigil",
  "Rune",
  "Orb",
];

function generateItemName(itemType: ItemType, rarity: Rarity): string {
  const rarityPrefix = rarity === Rarity.Legendary ? "Legendary " : "";
  switch (itemType) {
    case "Weapon": {
      const prefix = WEAPON_PREFIXES[rand(0, WEAPON_PREFIXES.length - 1)];
      const suffix = WEAPON_SUFFIXES[rand(0, WEAPON_SUFFIXES.length - 1)];
      return `${rarityPrefix}${prefix} ${suffix}`;
    }
    case "Armor": {
      const prefix = ARMOR_PREFIXES[rand(0, ARMOR_PREFIXES.length - 1)];
      const suffix = ARMOR_SUFFIXES[rand(0, ARMOR_SUFFIXES.length - 1)];
      return `${rarityPrefix}${prefix} ${suffix}`;
    }
    case "Trinket": {
      const name = TRINKET_NAMES[rand(0, TRINKET_NAMES.length - 1)];
      return `${rarityPrefix}${name}`;
    }
  }
}

const ITEM_ICONS: Record<ItemType, string> = {
  Weapon: "⚔️",
  Armor: "🛡️",
  Trinket: "💎",
};

// ── Base stats (REDUCED BY 75% from original values) ──

function generateBaseWeaponDamage(
  rarity: Rarity,
  monsterLevel: number,
): number {
  const base = randFloat(2, 5);
  const mult = rarityMultiplier(rarity);
  const levelScale = 1 + (monsterLevel - 1) * 0.03;
  return Math.max(1, Math.round(base * mult * levelScale));
}

function generateBaseArmorDefense(
  rarity: Rarity,
  monsterLevel: number,
): number {
  const base = randFloat(1, 4);
  const mult = rarityMultiplier(rarity);
  const levelScale = 1 + (monsterLevel - 1) * 0.03;
  return Math.max(1, Math.round(base * mult * levelScale));
}

// ── Main generation function ──

export function generateLoot(
  monsterLevel: number,
  penaltyApplied = false,
): GeneratedItem | null {
  const itemTypes: ItemType[] = ["Weapon", "Armor", "Trinket"];
  const itemType = itemTypes[rand(0, itemTypes.length - 1)];

  // With penalty, cap rarity at Uncommon
  let rarity = rollRarity(monsterLevel);
  if (
    penaltyApplied &&
    (rarity === Rarity.Rare || rarity === Rarity.Legendary)
  ) {
    rarity = Rarity.Uncommon;
  }

  const affixes = generateAffixes(itemType, rarity, monsterLevel);
  const name = generateItemName(itemType, rarity);
  const id = `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const item: GeneratedItem = {
    id,
    name,
    itemType,
    rarity,
    affixes,
    icon: ITEM_ICONS[itemType],
    itemLevel: monsterLevel,
  };

  if (itemType === "Weapon") {
    item.baseDamage = generateBaseWeaponDamage(rarity, monsterLevel);
  }
  if (itemType === "Armor") {
    item.baseDefense = generateBaseArmorDefense(rarity, monsterLevel);
  }

  return item;
}

// ── Ascension Trial loot (slightly better) ──

export function generateAscensionLoot(
  playerLevel: number,
): GeneratedItem | null {
  return generateLoot(playerLevel + 5, false);
}

// ── Legacy multi-loot helper ──

export function generateMultiLoot(
  dungeonLevel: number,
  killCount: number,
): GeneratedItem[] {
  const drops: GeneratedItem[] = [];
  for (let i = 0; i < killCount; i++) {
    const item = generateLoot(dungeonLevel, false);
    if (item) drops.push(item);
  }
  return drops;
}

// ── Starter equipment for new characters ──

/**
 * Generates a starter equipment set for newly created characters.
 * Returns a weapon and armor at item level 1 with Common rarity,
 * with guaranteed minimum base stats to make level 1 combat viable.
 */
export function generateStarterEquipment(): {
  weapon: GeneratedItem;
  armor: GeneratedItem;
} {
  const starterAffixes: ItemAffix[] = [];

  const weapon: GeneratedItem = {
    id: `starter_weapon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: "Worn Sword",
    itemType: "Weapon",
    rarity: Rarity.Common,
    affixes: starterAffixes,
    icon: ITEM_ICONS.Weapon,
    itemLevel: 1,
    // Guaranteed 5 base damage — enough to deal meaningful damage vs level 1 monsters
    baseDamage: 5,
  };

  const armor: GeneratedItem = {
    id: `starter_armor_${Date.now() + 1}_${Math.random().toString(36).slice(2, 9)}`,
    name: "Worn Chestplate",
    itemType: "Armor",
    rarity: Rarity.Common,
    affixes: starterAffixes,
    icon: ITEM_ICONS.Armor,
    itemLevel: 1,
    // Guaranteed 5 base defense — enough to reduce incoming damage from level 1 monsters
    baseDefense: 5,
  };

  return { weapon, armor };
}
