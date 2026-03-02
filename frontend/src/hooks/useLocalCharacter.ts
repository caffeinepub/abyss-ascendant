import { useState, useCallback } from 'react';
import { Character } from '../backend';
import { GeneratedItem } from '../engine/lootGenerator';

export type { GeneratedItem };

export interface LocalStats {
  str: number;
  dex: number;
  int: number;
  vit: number;
}

export interface LocalCharacter {
  // Identity
  characterId: number;
  name: string;
  realm: 'Softcore' | 'Hardcore';
  classTier: number;
  season: number;
  status: 'Alive' | 'Dead';

  // Level / XP
  level: number;
  xp: number;
  pendingStatPoints: number;

  // Stats (flat, matches old shape)
  stats: LocalStats;

  // HP
  maxHP: number;
  currentHP: number;

  // Inventory
  inventory: GeneratedItem[];
  stash: GeneratedItem[];
  equippedItems: GeneratedItem[];

  // Abilities
  ownedAbilityIds: string[];
  equippedAbilityIds: string[]; // max 3
  availableAbilityPoints: number;
}

function getStorageKey(characterId: number): string {
  return `localCharacter_v3_${characterId}`;
}

interface LocalOnlyData {
  pendingStatPoints: number;
  inventory: GeneratedItem[];
  stash: GeneratedItem[];
  equippedItems: GeneratedItem[];
  ownedAbilityIds: string[];
  equippedAbilityIds: string[];
  availableAbilityPoints: number;
}

function loadLocalData(characterId: number): LocalOnlyData | null {
  try {
    const key = getStorageKey(characterId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as LocalOnlyData;
  } catch {
    return null;
  }
}

function saveLocalData(character: LocalCharacter): void {
  try {
    const key = getStorageKey(character.characterId);
    const toSave: LocalOnlyData = {
      pendingStatPoints: character.pendingStatPoints,
      inventory: character.inventory,
      stash: character.stash,
      equippedItems: character.equippedItems,
      ownedAbilityIds: character.ownedAbilityIds,
      equippedAbilityIds: character.equippedAbilityIds,
      availableAbilityPoints: character.availableAbilityPoints,
    };
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

export function useLocalCharacter() {
  const [character, setCharacterState] = useState<LocalCharacter | null>(null);

  const initializeCharacter = useCallback(
    (backendCharacter: Character, characterId: number): LocalCharacter => {
      const localData = loadLocalData(characterId);

      const realmKind = (backendCharacter.realm as unknown as { __kind__: string }).__kind__;
      const statusKind = (backendCharacter.status as unknown as { __kind__: string }).__kind__;

      const merged: LocalCharacter = {
        characterId,
        name: backendCharacter.name,
        realm: realmKind === 'Hardcore' ? 'Hardcore' : 'Softcore',
        classTier: Number(backendCharacter.classTier),
        season: Number(backendCharacter.season),
        status: statusKind === 'Dead' ? 'Dead' : 'Alive',
        level: Number(backendCharacter.level),
        xp: Number(backendCharacter.xp),
        stats: {
          str: Number(backendCharacter.str),
          dex: Number(backendCharacter.dex),
          int: Number(backendCharacter.int),
          vit: Number(backendCharacter.vit),
        },
        maxHP: Number(backendCharacter.maxHP),
        // Always seed from backend currentHP
        currentHP: Number(backendCharacter.currentHP),
        // Local-only data
        pendingStatPoints: localData?.pendingStatPoints ?? 0,
        inventory: localData?.inventory ?? [],
        stash: localData?.stash ?? [],
        equippedItems: localData?.equippedItems ?? [],
        ownedAbilityIds: localData?.ownedAbilityIds ?? [],
        equippedAbilityIds: localData?.equippedAbilityIds ?? [],
        availableAbilityPoints: localData?.availableAbilityPoints ?? 1,
      };

      setCharacterState(merged);
      return merged;
    },
    []
  );

  const updateCharacter = useCallback(
    (updater: (prev: LocalCharacter) => LocalCharacter) => {
      setCharacterState((prev) => {
        if (!prev) return prev;
        const updated = updater(prev);
        saveLocalData(updated);
        return updated;
      });
    },
    []
  );

  const setCurrentHP = useCallback((hp: number) => {
    setCharacterState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, currentHP: Math.max(0, Math.min(hp, prev.maxHP)) };
      saveLocalData(updated);
      return updated;
    });
  }, []);

  const clearCharacter = useCallback(() => {
    setCharacterState(null);
  }, []);

  // Legacy helpers used by CharacterSheet / AbilitySelectModal
  const applyStatPoints = useCallback(
    (delta: Partial<LocalStats>) => {
      setCharacterState((prev) => {
        if (!prev) return prev;
        const cost = Object.values(delta).reduce((s, v) => s + (v ?? 0), 0);
        if (cost > prev.pendingStatPoints) return prev;
        const updated: LocalCharacter = {
          ...prev,
          stats: {
            str: prev.stats.str + (delta.str ?? 0),
            dex: prev.stats.dex + (delta.dex ?? 0),
            int: prev.stats.int + (delta.int ?? 0),
            vit: prev.stats.vit + (delta.vit ?? 0),
          },
          pendingStatPoints: prev.pendingStatPoints - cost,
        };
        saveLocalData(updated);
        return updated;
      });
    },
    []
  );

  const purchaseAbility = useCallback((abilityId: string) => {
    setCharacterState((prev) => {
      if (!prev) return prev;
      if (prev.availableAbilityPoints <= 0) return prev;
      if (prev.ownedAbilityIds.includes(abilityId)) return prev;
      const updated: LocalCharacter = {
        ...prev,
        ownedAbilityIds: [...prev.ownedAbilityIds, abilityId],
        availableAbilityPoints: prev.availableAbilityPoints - 1,
      };
      saveLocalData(updated);
      return updated;
    });
  }, []);

  const equipAbility = useCallback((abilityId: string, slotIndex: number) => {
    setCharacterState((prev) => {
      if (!prev) return prev;
      if (!prev.ownedAbilityIds.includes(abilityId)) return prev;
      if (slotIndex < 0 || slotIndex > 2) return prev;
      const newEquipped = [...prev.equippedAbilityIds];
      const existingIdx = newEquipped.indexOf(abilityId);
      if (existingIdx !== -1) newEquipped.splice(existingIdx, 1);
      while (newEquipped.length <= slotIndex) newEquipped.push('');
      newEquipped[slotIndex] = abilityId;
      const cleaned = newEquipped.filter((id, i) => id !== '' || i < 3).slice(0, 3);
      const updated: LocalCharacter = { ...prev, equippedAbilityIds: cleaned };
      saveLocalData(updated);
      return updated;
    });
  }, []);

  const unequipAbility = useCallback((abilityId: string) => {
    setCharacterState((prev) => {
      if (!prev) return prev;
      const updated: LocalCharacter = {
        ...prev,
        equippedAbilityIds: prev.equippedAbilityIds.filter((id) => id !== abilityId),
      };
      saveLocalData(updated);
      return updated;
    });
  }, []);

  const addItemToInventory = useCallback((item: GeneratedItem) => {
    setCharacterState((prev) => {
      if (!prev) return prev;
      const updated: LocalCharacter = { ...prev, inventory: [...prev.inventory, item] };
      saveLocalData(updated);
      return updated;
    });
  }, []);

  const equipItem = useCallback((item: GeneratedItem) => {
    setCharacterState((prev) => {
      if (!prev) return prev;
      const newInventory = prev.inventory.filter((i) => i.id !== item.id);
      const displaced = prev.equippedItems.find((i) => i.itemType === item.itemType);
      const newEquipped = prev.equippedItems.filter((i) => i.itemType !== item.itemType);
      newEquipped.push(item);
      if (displaced) newInventory.push(displaced);
      const updated: LocalCharacter = { ...prev, inventory: newInventory, equippedItems: newEquipped };
      saveLocalData(updated);
      return updated;
    });
  }, []);

  const unequipItem = useCallback((item: GeneratedItem) => {
    setCharacterState((prev) => {
      if (!prev) return prev;
      const updated: LocalCharacter = {
        ...prev,
        equippedItems: prev.equippedItems.filter((i) => i.id !== item.id),
        inventory: [...prev.inventory, item],
      };
      saveLocalData(updated);
      return updated;
    });
  }, []);

  const moveToStash = useCallback((item: GeneratedItem) => {
    setCharacterState((prev) => {
      if (!prev) return prev;
      const updated: LocalCharacter = {
        ...prev,
        inventory: prev.inventory.filter((i) => i.id !== item.id),
        stash: [...prev.stash, item],
      };
      saveLocalData(updated);
      return updated;
    });
  }, []);

  const moveFromStash = useCallback((item: GeneratedItem) => {
    setCharacterState((prev) => {
      if (!prev) return prev;
      const updated: LocalCharacter = {
        ...prev,
        stash: prev.stash.filter((i) => i.id !== item.id),
        inventory: [...prev.inventory, item],
      };
      saveLocalData(updated);
      return updated;
    });
  }, []);

  const applyDeathPenalty = useCallback((isHardcore: boolean) => {
    setCharacterState((prev) => {
      if (!prev) return prev;
      if (isHardcore) return prev;
      const xpLoss = Math.floor(prev.xp * 0.1);
      const newXp = Math.max(0, prev.xp - xpLoss);
      const newLevel = Math.max(1, Math.floor(newXp / 100) + 1);
      const totalPoints = 1 + Math.floor(newLevel / 10);
      const spentPoints = prev.ownedAbilityIds.length;
      const updated: LocalCharacter = {
        ...prev,
        xp: newXp,
        level: newLevel,
        availableAbilityPoints: Math.max(0, totalPoints - spentPoints),
        status: 'Alive',
        currentHP: prev.maxHP,
      };
      saveLocalData(updated);
      return updated;
    });
  }, []);

  return {
    character,
    initializeCharacter,
    updateCharacter,
    setCurrentHP,
    clearCharacter,
    // Legacy helpers
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
  };
}

// Helper to save starter equipment for a newly created character by characterId
export function saveStarterEquipmentForCharacter(
  characterId: number,
  equippedItems: GeneratedItem[]
): void {
  try {
    const key = `localCharacter_v3_${characterId}`;
    const existing = localStorage.getItem(key);
    let data: Record<string, unknown> = {};
    if (existing) {
      try { data = JSON.parse(existing); } catch { data = {}; }
    }
    // Only set starter equipment if no equipped items already exist
    if (!data.equippedItems || (data.equippedItems as GeneratedItem[]).length === 0) {
      data.equippedItems = equippedItems;
    }
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}
