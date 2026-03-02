import { useState, useEffect, useCallback, useRef } from 'react';
import { LocalCharacter, BaseStats, calculateAvailableAbilityPoints, calculateMaxHp, calculateUnspentStatPoints } from '../types/game';
import { GeneratedItem, generateStarterEquipment } from '../engine/lootGenerator';
import { Character } from '../backend';

export type { LocalCharacter };

const STORAGE_PREFIX = 'dungeon_char_';

interface StoredCharacterData {
  abilities: string[];
  equippedItems: GeneratedItem[];
  inventory: GeneratedItem[];
  stash: GeneratedItem[];
  abilityPointsInitialized: boolean;
}

function getStorageKey(characterId: number): string {
  return `${STORAGE_PREFIX}${characterId}`;
}

function loadStoredData(characterId: number): StoredCharacterData | null {
  try {
    const raw = localStorage.getItem(getStorageKey(characterId));
    if (!raw) return null;
    return JSON.parse(raw);
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
 * Compute bonus HP from equipped items using vit affixes.
 */
function computeBonusHpFromItems(equippedItems: GeneratedItem[]): number {
  let bonusHp = 0;
  for (const item of equippedItems) {
    for (const affix of item.affixes) {
      if (affix.stat === 'vit') bonusHp += affix.value * 10;
      if (affix.stat === 'hp') bonusHp += affix.value;
    }
  }
  return bonusHp;
}

function buildLocalCharacter(
  id: number,
  backendChar: Character,
  stored: StoredCharacterData | null,
  overrideCurrentHp?: number
): LocalCharacter {
  const level = Number(backendChar.level);
  const xp = Number(backendChar.xp);
  const vit = Number(backendChar.baseStats.vit);
  const str = Number(backendChar.baseStats.str);
  const dex = Number(backendChar.baseStats.dex);
  const int_ = Number(backendChar.baseStats.int);

  const equippedItems = stored?.equippedItems || [];
  const bonusHp = computeBonusHpFromItems(equippedItems);
  const maxHp = calculateMaxHp(vit, bonusHp);

  // Use override HP if provided (preserves live local HP across backend re-fetches),
  // otherwise fall back to the backend-persisted currentHP on initial load.
  const backendCurrentHp = Number(backendChar.advancedStats.currentHP);
  const rawHp = overrideCurrentHp !== undefined ? overrideCurrentHp : backendCurrentHp;
  const currentHp = Math.min(Math.max(1, rawHp), maxHp);

  const critChance = Number(backendChar.advancedStats.critChance) || 5;
  const critPower = Number(backendChar.advancedStats.critPower) || 50;

  const totalStatPointsEarned = Number(backendChar.totalStatPointsEarned);
  const totalStatPointsSpent = Number(backendChar.totalStatPointsSpent);
  const pendingStatPoints = calculateUnspentStatPoints(totalStatPointsEarned, totalStatPointsSpent);

  const availableAbilityPoints = calculateAvailableAbilityPoints(level);
  const abilities = stored?.abilities || [];

  const inventory = stored?.inventory || [];
  const stash = stored?.stash || [];

  if (!stored) {
    // New character - give starter equipment
    const starterGear = generateStarterEquipment();
    const newStored: StoredCharacterData = {
      abilities: [],
      equippedItems: [starterGear.weapon, starterGear.armor],
      inventory: [],
      stash: [],
      abilityPointsInitialized: true,
    };
    saveStoredData(id, newStored);
    return buildLocalCharacter(id, backendChar, newStored, overrideCurrentHp);
  }

  const baseStats: BaseStats = { str, dex, int: int_, vit };

  return {
    id,
    name: backendChar.name,
    realm: backendChar.realm === 'Hardcore' ? 'Hardcore' : 'Softcore',
    level,
    xp,
    status: backendChar.status === 'Dead' ? 'Dead' : 'Alive',
    stats: {
      str,
      dex,
      int: int_,
      vit,
      maxHp,
      currentHp,
      critChance,
      critPower,
    },
    baseStats,
    abilities,
    equippedItems,
    inventory,
    stash,
    pendingStatPoints,
    totalStatPointsEarned,
    totalStatPointsSpent,
    abilityPoints: availableAbilityPoints,
  };
}

/**
 * Save starter equipment for a newly created character.
 * Called from CharacterCreation after the backend character is created.
 */
export function saveStarterEquipmentForCharacter(
  characterId: number,
  weapon: GeneratedItem,
  armor: GeneratedItem
): void {
  const existing = loadStoredData(characterId);
  const newStored: StoredCharacterData = {
    abilities: existing?.abilities || [],
    equippedItems: [weapon, armor],
    inventory: existing?.inventory || [],
    stash: existing?.stash || [],
    abilityPointsInitialized: true,
  };
  saveStoredData(characterId, newStored);
}

export interface UseLocalCharacterReturn {
  character: LocalCharacter | null;
  updateHp: (newHp: number) => void;
  updateAbilities: (abilities: string[]) => void;
  updateEquipment: (equippedItems: GeneratedItem[], inventory: GeneratedItem[], stash: GeneratedItem[]) => void;
  updateAfterDungeon: (newXp: number, newLevel: number, remainingHp: number) => void;
  updateBaseStats: (newBaseStats: BaseStats, newTotalSpent: number) => void;
  reload: (backendChar: Character) => void;
}

export function useLocalCharacter(
  characterId: number | null,
  backendChar: Character | null
): UseLocalCharacterReturn {
  const [character, setCharacter] = useState<LocalCharacter | null>(null);

  // Track the last characterId we initialized for, so we can detect a genuine
  // character switch vs. a background re-fetch of the same character.
  const initializedForIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (characterId === null || !backendChar) {
      setCharacter(null);
      initializedForIdRef.current = null;
      return;
    }

    const isNewCharacter = initializedForIdRef.current !== characterId;

    if (isNewCharacter) {
      // First load for this character — use backend HP as the authoritative source
      initializedForIdRef.current = characterId;
      const stored = loadStoredData(characterId);
      const local = buildLocalCharacter(characterId, backendChar, stored);
      setCharacter(local);
    } else {
      // Same character, backend data refreshed (e.g. after submitDungeonResult or spendStatPoints).
      // Preserve the live local HP so a background re-fetch doesn't reset it.
      setCharacter(prev => {
        if (!prev) {
          const stored = loadStoredData(characterId);
          return buildLocalCharacter(characterId, backendChar, stored);
        }
        // Keep the current live HP; only update fields that come from the backend
        // (level, xp, stat points, base stats) which may have changed.
        const stored = loadStoredData(characterId);
        return buildLocalCharacter(characterId, backendChar, stored, prev.stats.currentHp);
      });
    }
  }, [characterId, backendChar]);

  const updateHp = useCallback((newHp: number) => {
    setCharacter(prev => {
      if (!prev) return null;
      return {
        ...prev,
        stats: { ...prev.stats, currentHp: newHp },
      };
    });
  }, []);

  const updateAbilities = useCallback((abilities: string[]) => {
    setCharacter(prev => {
      if (!prev) return null;
      const stored = loadStoredData(prev.id);
      const newStored: StoredCharacterData = {
        abilities,
        equippedItems: stored?.equippedItems || prev.equippedItems,
        inventory: stored?.inventory || prev.inventory,
        stash: stored?.stash || prev.stash,
        abilityPointsInitialized: true,
      };
      saveStoredData(prev.id, newStored);
      return { ...prev, abilities };
    });
  }, []);

  const updateEquipment = useCallback((equippedItems: GeneratedItem[], inventory: GeneratedItem[], stash: GeneratedItem[]) => {
    setCharacter(prev => {
      if (!prev) return null;
      const stored = loadStoredData(prev.id);
      const newStored: StoredCharacterData = {
        abilities: stored?.abilities || prev.abilities,
        equippedItems,
        inventory,
        stash,
        abilityPointsInitialized: stored?.abilityPointsInitialized ?? true,
      };
      saveStoredData(prev.id, newStored);

      const bonusHp = computeBonusHpFromItems(equippedItems);
      const maxHp = calculateMaxHp(prev.stats.vit, bonusHp);
      const currentHp = Math.min(prev.stats.currentHp, maxHp);

      return {
        ...prev,
        equippedItems,
        inventory,
        stash,
        stats: { ...prev.stats, maxHp, currentHp },
      };
    });
  }, []);

  const updateAfterDungeon = useCallback((newXp: number, newLevel: number, remainingHp: number) => {
    setCharacter(prev => {
      if (!prev) return null;

      const newTotalEarned = newLevel - 1;
      const pendingStatPoints = calculateUnspentStatPoints(newTotalEarned, prev.totalStatPointsSpent);
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
  }, []);

  const updateBaseStats = useCallback((newBaseStats: BaseStats, newTotalSpent: number) => {
    setCharacter(prev => {
      if (!prev) return null;

      const bonusHp = computeBonusHpFromItems(prev.equippedItems);
      const maxHp = calculateMaxHp(newBaseStats.vit, bonusHp);
      const currentHp = Math.min(prev.stats.currentHp, maxHp);
      const pendingStatPoints = calculateUnspentStatPoints(prev.totalStatPointsEarned, newTotalSpent);

      return {
        ...prev,
        baseStats: newBaseStats,
        stats: {
          ...prev.stats,
          str: newBaseStats.str,
          dex: newBaseStats.dex,
          int: newBaseStats.int,
          vit: newBaseStats.vit,
          maxHp,
          currentHp,
        },
        pendingStatPoints,
        totalStatPointsSpent: newTotalSpent,
      };
    });
  }, []);

  const reload = useCallback((backendChar: Character) => {
    if (characterId === null) return;
    const stored = loadStoredData(characterId);
    const local = buildLocalCharacter(characterId, backendChar, stored);
    setCharacter(local);
  }, [characterId]);

  return {
    character,
    updateHp,
    updateAbilities,
    updateEquipment,
    updateAfterDungeon,
    updateBaseStats,
    reload,
  };
}
