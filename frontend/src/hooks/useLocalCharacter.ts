import { useState, useEffect, useCallback } from 'react';
import { GeneratedItem } from '../engine/lootGenerator';
import { ABILITIES, Ability } from '../data/abilities';

export interface LocalStats {
  str: number;
  dex: number;
  int: number;
  vit: number;
}

export interface LocalCharacter {
  name: string;
  realm: 'Softcore' | 'Hardcore';
  level: number;
  xp: number;
  stats: LocalStats;
  inventory: GeneratedItem[];
  stash: GeneratedItem[];
  equippedItems: GeneratedItem[];
  // Abilities: owned ability IDs and equipped (slotted) ability IDs
  ownedAbilityIds: string[];
  equippedAbilityIds: string[]; // max 3
  availableAbilityPoints: number;
  // Pending stat points from leveling
  pendingStatPoints: number;
}

const STORAGE_KEY = 'local_character_v2';

const XP_PER_LEVEL = 100;

// Ability points: 1 at creation + 1 per 10 levels
// At level 1: 1 point. At level 10: 2 points. At level 100: 11 points.
function calcTotalAbilityPoints(level: number): number {
  return 1 + Math.floor(level / 10);
}

function calcLevel(xp: number): number {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

function calcXpForNextLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export function useLocalCharacter() {
  const [character, setCharacter] = useState<LocalCharacter | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalCharacter;
        // Migrate: ensure no gold field, ensure ability points use new formula
        const level = parsed.level ?? 1;
        const totalPoints = calcTotalAbilityPoints(level);
        const spentPoints = parsed.ownedAbilityIds?.length ?? 0;
        const available = Math.max(0, totalPoints - spentPoints);
        setCharacter({
          ...parsed,
          availableAbilityPoints: available,
        });
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage whenever character changes
  useEffect(() => {
    if (character) {
      // Strip any gold field before saving
      const { ...toSave } = character as LocalCharacter & { gold?: number };
      delete (toSave as { gold?: number }).gold;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [character]);

  const initCharacter = useCallback(
    (
      name: string,
      realm: 'Softcore' | 'Hardcore',
      allocatedStats: LocalStats
    ) => {
      // Validate stats: each must be at least 1
      const stats: LocalStats = {
        str: Math.max(1, allocatedStats.str),
        dex: Math.max(1, allocatedStats.dex),
        int: Math.max(1, allocatedStats.int),
        vit: Math.max(1, allocatedStats.vit),
      };

      const newChar: LocalCharacter = {
        name,
        realm,
        level: 1,
        xp: 0,
        stats,
        inventory: [],
        stash: [],
        equippedItems: [],
        ownedAbilityIds: [],
        equippedAbilityIds: [],
        availableAbilityPoints: 1, // start with exactly 1 ability point
        pendingStatPoints: 0,
      };
      setCharacter(newChar);
      return newChar;
    },
    []
  );

  const addXp = useCallback(
    (amount: number) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        const newXp = prev.xp + amount;
        const newLevel = calcLevel(newXp);
        const oldLevel = prev.level;
        const levelsGained = newLevel - oldLevel;

        // Recalculate ability points based on new level
        const totalPoints = calcTotalAbilityPoints(newLevel);
        const spentPoints = prev.ownedAbilityIds.length;
        const newAvailablePoints = Math.max(0, totalPoints - spentPoints);

        return {
          ...prev,
          xp: newXp,
          level: newLevel,
          pendingStatPoints: prev.pendingStatPoints + levelsGained,
          availableAbilityPoints: newAvailablePoints,
        };
      });
    },
    []
  );

  const applyStatPoints = useCallback(
    (delta: Partial<LocalStats>) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        const cost = Object.values(delta).reduce((s, v) => s + (v ?? 0), 0);
        if (cost > prev.pendingStatPoints) return prev;
        return {
          ...prev,
          stats: {
            str: prev.stats.str + (delta.str ?? 0),
            dex: prev.stats.dex + (delta.dex ?? 0),
            int: prev.stats.int + (delta.int ?? 0),
            vit: prev.stats.vit + (delta.vit ?? 0),
          },
          pendingStatPoints: prev.pendingStatPoints - cost,
        };
      });
    },
    []
  );

  const purchaseAbility = useCallback(
    (abilityId: string) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        // Guard: must have available points
        if (prev.availableAbilityPoints <= 0) return prev;
        // Guard: must not already own it
        if (prev.ownedAbilityIds.includes(abilityId)) return prev;
        // Guard: ability must exist
        const ability = ABILITIES.find((a) => a.id === abilityId);
        if (!ability) return prev;

        return {
          ...prev,
          ownedAbilityIds: [...prev.ownedAbilityIds, abilityId],
          availableAbilityPoints: prev.availableAbilityPoints - 1,
        };
      });
    },
    []
  );

  const equipAbility = useCallback(
    (abilityId: string, slotIndex: number) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        // Must own the ability
        if (!prev.ownedAbilityIds.includes(abilityId)) return prev;
        // Slot index must be 0, 1, or 2 (max 3 equipped)
        if (slotIndex < 0 || slotIndex > 2) return prev;

        const newEquipped = [...prev.equippedAbilityIds];
        // Remove from any existing slot
        const existingIdx = newEquipped.indexOf(abilityId);
        if (existingIdx !== -1) newEquipped.splice(existingIdx, 1);
        // Place in target slot (pad if needed)
        while (newEquipped.length <= slotIndex) newEquipped.push('');
        newEquipped[slotIndex] = abilityId;
        // Clean up empty trailing slots
        const cleaned = newEquipped.filter((id, i) => id !== '' || i < 3);

        return {
          ...prev,
          equippedAbilityIds: cleaned.slice(0, 3),
        };
      });
    },
    []
  );

  const unequipAbility = useCallback(
    (abilityId: string) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          equippedAbilityIds: prev.equippedAbilityIds.filter((id) => id !== abilityId),
        };
      });
    },
    []
  );

  const addItemToInventory = useCallback(
    (item: GeneratedItem) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        return { ...prev, inventory: [...prev.inventory, item] };
      });
    },
    []
  );

  const equipItem = useCallback(
    (item: GeneratedItem) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        // Remove from inventory
        const newInventory = prev.inventory.filter((i) => i.id !== item.id);
        // Unequip existing item of same type
        const displaced = prev.equippedItems.find((i) => i.itemType === item.itemType);
        const newEquipped = prev.equippedItems.filter((i) => i.itemType !== item.itemType);
        newEquipped.push(item);
        // Put displaced item back in inventory
        if (displaced) newInventory.push(displaced);
        return { ...prev, inventory: newInventory, equippedItems: newEquipped };
      });
    },
    []
  );

  const unequipItem = useCallback(
    (item: GeneratedItem) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          equippedItems: prev.equippedItems.filter((i) => i.id !== item.id),
          inventory: [...prev.inventory, item],
        };
      });
    },
    []
  );

  const moveToStash = useCallback(
    (item: GeneratedItem) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          inventory: prev.inventory.filter((i) => i.id !== item.id),
          stash: [...prev.stash, item],
        };
      });
    },
    []
  );

  const moveFromStash = useCallback(
    (item: GeneratedItem) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stash: prev.stash.filter((i) => i.id !== item.id),
          inventory: [...prev.inventory, item],
        };
      });
    },
    []
  );

  const applyDeathPenalty = useCallback(
    (isHardcore: boolean) => {
      setCharacter((prev) => {
        if (!prev) return prev;
        if (isHardcore) {
          // Hardcore: character is permanently dead (handled at app level)
          return prev;
        }
        // Softcore: lose 10% of current XP (no gold penalty)
        const xpLoss = Math.floor(prev.xp * 0.1);
        const newXp = Math.max(0, prev.xp - xpLoss);
        const newLevel = calcLevel(newXp);
        const totalPoints = calcTotalAbilityPoints(newLevel);
        const spentPoints = prev.ownedAbilityIds.length;
        return {
          ...prev,
          xp: newXp,
          level: newLevel,
          availableAbilityPoints: Math.max(0, totalPoints - spentPoints),
        };
      });
    },
    []
  );

  const clearCharacter = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCharacter(null);
  }, []);

  return {
    character,
    initCharacter,
    addXp,
    applyStatPoints,
    purchaseAbility,
    equipAbility,
    unequipAbility,
    addItemToInventory,
    equipItem,
    unequipItem,
    moveToStash,
    moveFromStash,
    applyDeathPenalty,
    clearCharacter,
    calcLevel,
    calcXpForNextLevel,
    calcTotalAbilityPoints,
  };
}
