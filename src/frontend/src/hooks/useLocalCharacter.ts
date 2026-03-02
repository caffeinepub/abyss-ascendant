import { useCallback, useEffect, useState } from "react";
import type { Character } from "../backend";
import {
  type GeneratedItem,
  generateStarterEquipment,
} from "../engine/lootGenerator";
import {
  type BaseStats,
  type CharacterClass,
  type LocalCharacter,
  applyClassStatBonus,
  calculateAvailableAbilityPoints,
  calculateMaxHp,
  calculateUnspentStatPoints,
  computeEquipmentBonuses,
} from "../types/game";

const STORAGE_KEY_PREFIX = "abyss_char_";

interface StoredCharacterData {
  currentHp?: number;
  equippedAbilities: string[];
  abilities: string[];
  equippedItems: GeneratedItem[];
  inventory: GeneratedItem[];
  stash: GeneratedItem[];
}

function getStorageKey(characterId: number): string {
  return `${STORAGE_KEY_PREFIX}${characterId}`;
}

function loadStoredData(characterId: number): StoredCharacterData | null {
  try {
    const raw = localStorage.getItem(getStorageKey(characterId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migrate: ensure equippedAbilities is an array
    if (!Array.isArray(parsed.equippedAbilities)) {
      parsed.equippedAbilities = parsed.equippedAbilities
        ? [parsed.equippedAbilities]
        : Array.isArray(parsed.abilities)
          ? [...parsed.abilities]
          : [];
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredData(characterId: number, data: StoredCharacterData): void {
  try {
    localStorage.setItem(getStorageKey(characterId), JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Save starter equipment for a newly created character.
 */
export function saveStarterEquipmentForCharacter(
  characterId: number,
  weapon: GeneratedItem,
  armor: GeneratedItem,
): void {
  const existing = loadStoredData(characterId);
  const newStored: StoredCharacterData = {
    equippedAbilities: existing?.equippedAbilities || [],
    abilities: existing?.abilities || [],
    equippedItems: [weapon, armor],
    inventory: existing?.inventory || [],
    stash: existing?.stash || [],
  };
  saveStoredData(characterId, newStored);
}

function resolveCharacterClass(backendClass: string): CharacterClass {
  if (
    backendClass === "Warrior" ||
    backendClass === "Rogue" ||
    backendClass === "Mage"
  ) {
    return backendClass;
  }
  return "Warrior";
}

function buildLocalCharacter(
  id: number,
  backendChar: Character,
  stored: StoredCharacterData | null,
  currentHpOverride?: number,
): LocalCharacter {
  const level = Number(backendChar.level);
  const xp = Number(backendChar.xp);
  const totalEarned = Number(backendChar.totalStatPointsEarned);
  const totalSpent = Number(backendChar.totalStatPointsSpent);

  // Backend baseStats are the source of truth after updateStats
  const baseStr = Number(backendChar.baseStats.str);
  const baseDex = Number(backendChar.baseStats.dex);
  const baseInt = Number(backendChar.baseStats.int);
  const baseVit = Number(backendChar.baseStats.vit);

  const characterClass = resolveCharacterClass(backendChar.class);
  const baseStats: BaseStats = {
    str: baseStr,
    dex: baseDex,
    int: baseInt,
    vit: baseVit,
  };
  const withBonus = applyClassStatBonus(baseStats, characterClass);

  const equippedItems = stored?.equippedItems || [];
  const equipBonuses = computeEquipmentBonuses(equippedItems);

  // Effective stats = base stats + class bonus + all equipment bonuses
  const effectiveStr = withBonus.str + equipBonuses.str;
  const effectiveDex = withBonus.dex + equipBonuses.dex;
  const effectiveInt = withBonus.int + equipBonuses.int;
  const effectiveVit = withBonus.vit + equipBonuses.vit;
  const effectiveCritChance =
    (Number(backendChar.advancedStats.critChance) || 5) +
    equipBonuses.bonusCritChance;

  const maxHp = calculateMaxHp(effectiveVit, equipBonuses.bonusHp);
  const backendCurrentHp = Number(backendChar.advancedStats.currentHP);
  const rawHp =
    currentHpOverride !== undefined ? currentHpOverride : backendCurrentHp;
  const currentHp = Math.min(Math.max(1, rawHp), maxHp);

  const unspentStatPoints = calculateUnspentStatPoints(totalEarned, totalSpent);
  const abilityPoints = calculateAvailableAbilityPoints(level);

  // Migrate equippedAbilities
  let equippedAbilities: string[] = [];
  if (stored?.equippedAbilities && Array.isArray(stored.equippedAbilities)) {
    equippedAbilities = stored.equippedAbilities;
  }
  if (
    equippedAbilities.length === 0 &&
    backendChar.equippedAbilities?.length > 0
  ) {
    equippedAbilities = backendChar.equippedAbilities.map((a) => a.name);
  }

  const legacyAbilities: string[] = stored?.abilities || [];
  const inventory = stored?.inventory || [];
  const stash = stored?.stash || [];

  // If no stored data at all, initialize with starter equipment
  if (!stored) {
    const starterGear = generateStarterEquipment();
    const newStored: StoredCharacterData = {
      equippedAbilities: [],
      abilities: [],
      equippedItems: [starterGear.weapon, starterGear.armor],
      inventory: [],
      stash: [],
    };
    saveStoredData(id, newStored);
    return buildLocalCharacter(id, backendChar, newStored, currentHpOverride);
  }

  return {
    id,
    name: backendChar.name,
    class: characterClass,
    realm: backendChar.realm === "Hardcore" ? "Hardcore" : "Softcore",
    level,
    xp,
    status: backendChar.status === "Dead" ? "Dead" : "Alive",
    baseStats,
    stats: {
      str: effectiveStr,
      dex: effectiveDex,
      int: effectiveInt,
      vit: effectiveVit,
      maxHp,
      currentHp,
      critChance: effectiveCritChance,
      critPower: Number(backendChar.advancedStats.critPower) || 50,
    },
    totalStatPointsEarned: totalEarned,
    totalStatPointsSpent: totalSpent,
    pendingStatPoints: unspentStatPoints,
    abilityPoints,
    equippedAbilities,
    abilities: legacyAbilities,
    equippedItems,
    inventory,
    stash,
  };
}

export interface UseLocalCharacterReturn {
  character: LocalCharacter | null;
  updateHp: (newHp: number) => void;
  updateBaseStats: (newBaseStats: BaseStats, newTotalSpent: number) => void;
  updateEquippedAbilities: (abilities: string[]) => void;
  updateEquipment: (
    equippedItems: GeneratedItem[],
    inventory: GeneratedItem[],
    stash: GeneratedItem[],
  ) => void;
  updateAfterDungeon: (
    newXp: number,
    newLevel: number,
    remainingHp: number,
  ) => void;
  updateAbilities: (abilities: string[]) => void;
}

export function useLocalCharacter(
  characterId: number | null,
  backendChar: Character | null | undefined,
): UseLocalCharacterReturn {
  const [localCharacter, setLocalCharacter] = useState<LocalCharacter | null>(
    null,
  );

  // Rebuild character from backend whenever backendChar changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: localCharacter intentionally excluded to avoid infinite re-render loop
  useEffect(() => {
    if (characterId === null || !backendChar) {
      setLocalCharacter(null);
      return;
    }

    const stored = loadStoredData(characterId);
    const isNewCharacter = !localCharacter || localCharacter.id !== characterId;

    if (isNewCharacter) {
      setLocalCharacter(buildLocalCharacter(characterId, backendChar, stored));
    } else {
      setLocalCharacter((prev) => {
        if (!prev) return buildLocalCharacter(characterId, backendChar, stored);
        // Preserve current HP when rebuilding from fresh backend data
        return buildLocalCharacter(
          characterId,
          backendChar,
          stored,
          prev.stats.currentHp,
        );
      });
    }
  }, [characterId, backendChar]);

  const updateHp = useCallback(
    (newHp: number) => {
      if (characterId === null) return;
      setLocalCharacter((prev) => {
        if (!prev) return prev;
        const stored = loadStoredData(characterId);
        saveStoredData(characterId, {
          equippedAbilities:
            stored?.equippedAbilities || prev.equippedAbilities,
          abilities: stored?.abilities || prev.abilities,
          equippedItems: stored?.equippedItems || prev.equippedItems,
          inventory: stored?.inventory || prev.inventory,
          stash: stored?.stash || prev.stash,
          currentHp: newHp,
        });
        return { ...prev, stats: { ...prev.stats, currentHp: newHp } };
      });
    },
    [characterId],
  );

  const updateBaseStats = useCallback(
    (newBaseStats: BaseStats, newTotalSpent: number) => {
      if (characterId === null) return;
      setLocalCharacter((prev) => {
        if (!prev) return prev;
        const characterClass = prev.class;
        const withClassBonus = applyClassStatBonus(
          newBaseStats,
          characterClass,
        );
        const equipBonuses = computeEquipmentBonuses(prev.equippedItems);

        const effectiveStr = withClassBonus.str + equipBonuses.str;
        const effectiveDex = withClassBonus.dex + equipBonuses.dex;
        const effectiveInt = withClassBonus.int + equipBonuses.int;
        const effectiveVit = withClassBonus.vit + equipBonuses.vit;
        const maxHp = calculateMaxHp(effectiveVit, equipBonuses.bonusHp);
        const currentHp = Math.min(prev.stats.currentHp, maxHp);
        const unspentStatPoints = calculateUnspentStatPoints(
          prev.totalStatPointsEarned,
          newTotalSpent,
        );

        return {
          ...prev,
          baseStats: newBaseStats,
          stats: {
            ...prev.stats,
            str: effectiveStr,
            dex: effectiveDex,
            int: effectiveInt,
            vit: effectiveVit,
            maxHp,
            currentHp,
          },
          totalStatPointsSpent: newTotalSpent,
          pendingStatPoints: unspentStatPoints,
        };
      });
    },
    [characterId],
  );

  const updateEquippedAbilities = useCallback(
    (abilities: string[]) => {
      if (characterId === null) return;
      setLocalCharacter((prev) => {
        if (!prev) return prev;
        const stored = loadStoredData(characterId);
        saveStoredData(characterId, {
          equippedAbilities: abilities,
          abilities: stored?.abilities || prev.abilities,
          equippedItems: stored?.equippedItems || prev.equippedItems,
          inventory: stored?.inventory || prev.inventory,
          stash: stored?.stash || prev.stash,
        });
        return { ...prev, equippedAbilities: abilities };
      });
    },
    [characterId],
  );

  // Legacy alias for updateEquippedAbilities
  const updateAbilities = updateEquippedAbilities;

  const updateEquipment = useCallback(
    (
      equippedItems: GeneratedItem[],
      inventory: GeneratedItem[],
      stash: GeneratedItem[],
    ) => {
      if (characterId === null) return;
      setLocalCharacter((prev) => {
        if (!prev) return prev;
        const stored = loadStoredData(characterId);
        saveStoredData(characterId, {
          equippedAbilities:
            stored?.equippedAbilities || prev.equippedAbilities,
          abilities: stored?.abilities || prev.abilities,
          equippedItems,
          inventory,
          stash,
        });

        // Recompute effective stats including new equipment bonuses
        const prevEquipBonuses = computeEquipmentBonuses(prev.equippedItems);
        const newEquipBonuses = computeEquipmentBonuses(equippedItems);
        const withClassBonus = applyClassStatBonus(prev.baseStats, prev.class);
        const effectiveStr = withClassBonus.str + newEquipBonuses.str;
        const effectiveDex = withClassBonus.dex + newEquipBonuses.dex;
        const effectiveInt = withClassBonus.int + newEquipBonuses.int;
        const effectiveVit = withClassBonus.vit + newEquipBonuses.vit;
        // Strip old equipment crit and apply new equipment crit on top of base crit
        const baseCritChance =
          prev.stats.critChance - prevEquipBonuses.bonusCritChance;
        const effectiveCritChance =
          baseCritChance + newEquipBonuses.bonusCritChance;
        const maxHp = calculateMaxHp(effectiveVit, newEquipBonuses.bonusHp);
        const currentHp = Math.min(prev.stats.currentHp, maxHp);

        return {
          ...prev,
          equippedItems,
          inventory,
          stash,
          stats: {
            ...prev.stats,
            str: effectiveStr,
            dex: effectiveDex,
            int: effectiveInt,
            vit: effectiveVit,
            critChance: Math.max(0, effectiveCritChance),
            maxHp,
            currentHp,
          },
        };
      });
    },
    [characterId],
  );

  const updateAfterDungeon = useCallback(
    (newXp: number, newLevel: number, remainingHp: number) => {
      setLocalCharacter((prev) => {
        if (!prev) return prev;
        const newTotalEarned = newLevel - 1;
        const pendingStatPoints = calculateUnspentStatPoints(
          newTotalEarned,
          prev.totalStatPointsSpent,
        );
        const abilityPoints = calculateAvailableAbilityPoints(newLevel);
        const clampedHp = Math.min(Math.max(1, remainingHp), prev.stats.maxHp);
        return {
          ...prev,
          level: newLevel,
          xp: newXp,
          stats: { ...prev.stats, currentHp: clampedHp },
          pendingStatPoints,
          totalStatPointsEarned: newTotalEarned,
          abilityPoints,
        };
      });
    },
    [],
  );

  return {
    character: localCharacter,
    updateHp,
    updateBaseStats,
    updateEquippedAbilities,
    updateEquipment,
    updateAfterDungeon,
    updateAbilities,
  };
}
