import { useCallback, useEffect, useRef, useState } from "react";
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
 * Save starter equipment (and optional initial ability) for a newly created character.
 */
export function saveStarterEquipmentForCharacter(
  characterId: number,
  weapon: GeneratedItem,
  armor: GeneratedItem,
  initialAbilities?: string[],
): void {
  const existing = loadStoredData(characterId);
  const newStored: StoredCharacterData = {
    equippedAbilities: initialAbilities ?? existing?.equippedAbilities ?? [],
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

  // Sum equipment affix bonuses so they are reflected in effective stats
  let equipStr = 0;
  let equipDex = 0;
  let equipInt = 0;
  let equipVit = 0;
  let equipBonusHp = 0;
  for (const item of equippedItems) {
    for (const affix of item.affixes ?? []) {
      if (affix.stat === "str") equipStr += affix.value;
      else if (affix.stat === "dex") equipDex += affix.value;
      else if (affix.stat === "int") equipInt += affix.value;
      else if (affix.stat === "vit") equipVit += affix.value;
      else if (affix.stat === "hp") equipBonusHp += affix.value;
    }
  }

  const effectiveStr = withBonus.str + equipStr;
  const effectiveDex = withBonus.dex + equipDex;
  const effectiveInt = withBonus.int + equipInt;
  const effectiveVit = withBonus.vit + equipVit;
  const maxHp = calculateMaxHp(effectiveVit, equipBonusHp);

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
      critChance: Number(backendChar.advancedStats.critChance) || 5,
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

  // Track the last characterId we built for, to detect character switches
  const prevCharacterIdRef = useRef<number | null>(null);

  // Rebuild character from backend whenever backendChar changes
  useEffect(() => {
    if (characterId === null || !backendChar) {
      setLocalCharacter(null);
      prevCharacterIdRef.current = null;
      return;
    }

    const stored = loadStoredData(characterId);
    const isNewCharacter = prevCharacterIdRef.current !== characterId;
    prevCharacterIdRef.current = characterId;

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
        const withBonus = applyClassStatBonus(newBaseStats, characterClass);

        // Include equipment affix bonuses in effective stats
        let equipStr = 0;
        let equipDex = 0;
        let equipInt = 0;
        let equipVit = 0;
        let equipBonusHp = 0;
        for (const item of prev.equippedItems) {
          for (const affix of item.affixes ?? []) {
            if (affix.stat === "str") equipStr += affix.value;
            else if (affix.stat === "dex") equipDex += affix.value;
            else if (affix.stat === "int") equipInt += affix.value;
            else if (affix.stat === "vit") equipVit += affix.value;
            else if (affix.stat === "hp") equipBonusHp += affix.value;
          }
        }

        const effectiveStr = withBonus.str + equipStr;
        const effectiveDex = withBonus.dex + equipDex;
        const effectiveInt = withBonus.int + equipInt;
        const effectiveVit = withBonus.vit + equipVit;
        const maxHp = calculateMaxHp(effectiveVit, equipBonusHp);
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
      _stash: GeneratedItem[], // stash removed; param kept for API compat
    ) => {
      if (characterId === null) return;
      // Always cap inventory at 10; stash is always empty going forward
      const cappedInventory = inventory.slice(0, 10);
      setLocalCharacter((prev) => {
        if (!prev) return prev;
        const stored = loadStoredData(characterId);
        saveStoredData(characterId, {
          equippedAbilities:
            stored?.equippedAbilities || prev.equippedAbilities,
          abilities: stored?.abilities || prev.abilities,
          equippedItems,
          inventory: cappedInventory,
          stash: [],
        });

        // Recompute effective stats including new equipment affix bonuses
        const withBonus = applyClassStatBonus(prev.baseStats, prev.class);
        let equipStr = 0;
        let equipDex = 0;
        let equipInt = 0;
        let equipVit = 0;
        let equipBonusHp = 0;
        for (const item of equippedItems) {
          for (const affix of item.affixes ?? []) {
            if (affix.stat === "str") equipStr += affix.value;
            else if (affix.stat === "dex") equipDex += affix.value;
            else if (affix.stat === "int") equipInt += affix.value;
            else if (affix.stat === "vit") equipVit += affix.value;
            else if (affix.stat === "hp") equipBonusHp += affix.value;
          }
        }
        const effectiveStr = withBonus.str + equipStr;
        const effectiveDex = withBonus.dex + equipDex;
        const effectiveInt = withBonus.int + equipInt;
        const effectiveVit = withBonus.vit + equipVit;
        const maxHp = calculateMaxHp(effectiveVit, equipBonusHp);
        const currentHp = Math.min(prev.stats.currentHp, maxHp);

        return {
          ...prev,
          equippedItems,
          inventory: cappedInventory,
          stash: [],
          stats: {
            ...prev.stats,
            str: effectiveStr,
            dex: effectiveDex,
            int: effectiveInt,
            vit: effectiveVit,
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
        // Never allow totalStatPointsEarned to decrease — mirror backend Nat.max logic
        const levelBasedEarned = newLevel - 1;
        const newTotalEarned = Math.max(
          prev.totalStatPointsEarned,
          levelBasedEarned,
        );
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
