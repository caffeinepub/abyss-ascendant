import { useState, useEffect, useCallback } from 'react';
import { Character } from '../backend';
import { LocalCharacter, calculateMaxHp, calculateUnspentStatPoints, calculateAvailableAbilityPoints } from '../types/game';
import { GeneratedItem } from '../engine/lootGenerator';
import { useSetCharacterHp } from './useQueries';

export type { LocalCharacter };

interface CharacterWithId {
  id: number;
  character: Character;
}

function buildLocalCharacter(id: number, backendChar: Character, currentHp?: number): LocalCharacter {
  const str = Number(backendChar.baseStats.str);
  const dex = Number(backendChar.baseStats.dex);
  const int_ = Number(backendChar.baseStats.int);
  const vit = Number(backendChar.baseStats.vit);

  const maxHp = calculateMaxHp(vit);
  // Use provided currentHp (live value), or backend-persisted value, never reset to maxHp
  const resolvedCurrentHp = currentHp !== undefined
    ? Math.min(currentHp, maxHp)
    : Math.min(Number(backendChar.advancedStats.currentHP), maxHp);

  const level = Number(backendChar.level);
  const xp = Number(backendChar.xp);
  const season = Number(backendChar.season);
  const totalStatPointsEarned = Number(backendChar.totalStatPointsEarned);
  const totalStatPointsSpent = Number(backendChar.totalStatPointsSpent);

  const pendingStatPoints = calculateUnspentStatPoints(totalStatPointsEarned, totalStatPointsSpent);
  const abilityPoints = calculateAvailableAbilityPoints(level);

  // Base attack from str + dex
  const baseAttack = Math.floor(str * 1.5 + dex * 0.5) + 5;
  // Base defense from str + vit
  const baseDefense = Math.floor(str * 0.5 + vit * 0.5) + 2;
  // Crit chance from dex
  const critChance = Number(backendChar.advancedStats.critChance) + Math.floor(dex * 0.5);
  // Crit power from int
  const critPower = Number(backendChar.advancedStats.critPower) + Math.floor(int_ * 1.0);

  return {
    id,
    name: backendChar.name,
    realm: backendChar.realm === 'Hardcore' ? 'Hardcore' : 'Softcore',
    level,
    xp,
    season,
    status: backendChar.status === 'Dead' ? 'Dead' : 'Alive',
    baseStats: { str, dex, int: int_, vit },
    stats: {
      str,
      dex,
      int: int_,
      vit,
      maxHp,
      currentHp: resolvedCurrentHp,
      attack: baseAttack,
      defense: baseDefense,
      critChance,
      critPower,
    },
    abilities: [],
    equippedAbilities: [],
    equippedItems: [],
    inventory: [],
    stash: [],
    pendingStatPoints,
    totalStatPointsEarned,
    totalStatPointsSpent,
    abilityPoints,
  };
}

export function useLocalCharacter(characterWithId: CharacterWithId | null) {
  const [localCharacter, setLocalCharacter] = useState<LocalCharacter | null>(null);
  const setCharacterHp = useSetCharacterHp();

  // When the backend character changes (new selection or data refresh),
  // rebuild the local character — but preserve the live HP if it's the same character
  useEffect(() => {
    if (!characterWithId) {
      setLocalCharacter(null);
      return;
    }

    setLocalCharacter(prev => {
      // If same character, preserve the live HP (don't reset to backend value)
      if (prev && prev.id === characterWithId.id) {
        return buildLocalCharacter(characterWithId.id, characterWithId.character, prev.stats.currentHp);
      }
      // New character selected — use backend-persisted HP as source of truth
      return buildLocalCharacter(characterWithId.id, characterWithId.character);
    });
  }, [characterWithId]);

  const updateHp = useCallback((newHp: number) => {
    setLocalCharacter(prev => {
      if (!prev) return null;
      return {
        ...prev,
        stats: { ...prev.stats, currentHp: newHp },
      };
    });
  }, []);

  const applyEquipment = useCallback((items: GeneratedItem[]) => {
    setLocalCharacter(prev => {
      if (!prev) return null;

      let bonusAttack = 0;
      let bonusDefense = 0;
      let bonusHp = 0;
      let bonusCritChance = 0;

      for (const item of items) {
        for (const affix of item.affixes) {
          switch (affix.stat) {
            case 'physicalDamage': bonusAttack += affix.value; break;
            case 'defense': bonusDefense += affix.value; break;
            case 'hp': bonusHp += affix.value; break;
            case 'critChance': bonusCritChance += affix.value; break;
          }
        }
        // Base weapon damage
        if (item.itemType === 'Weapon' && item.baseDamage) {
          bonusAttack += item.baseDamage;
        }
        // Base armor defense
        if (item.itemType === 'Armor' && item.baseDefense) {
          bonusDefense += item.baseDefense;
        }
      }

      const newMaxHp = prev.stats.maxHp + bonusHp;
      const newCurrentHp = Math.min(prev.stats.currentHp, newMaxHp);

      return {
        ...prev,
        equippedItems: items,
        stats: {
          ...prev.stats,
          maxHp: newMaxHp,
          currentHp: newCurrentHp,
          attack: prev.stats.attack + bonusAttack,
          defense: prev.stats.defense + bonusDefense,
          critChance: prev.stats.critChance + bonusCritChance,
        },
      };
    });
  }, []);

  const applyAbilities = useCallback((abilityIds: string[]) => {
    setLocalCharacter(prev => {
      if (!prev) return null;
      return { ...prev, equippedAbilities: abilityIds, abilities: abilityIds };
    });
  }, []);

  const applyLevelUp = useCallback((newBaseStats: { str: number; dex: number; int: number; vit: number }, newTotalSpent: number) => {
    setLocalCharacter(prev => {
      if (!prev) return null;
      const newMaxHp = calculateMaxHp(newBaseStats.vit);
      const newCurrentHp = Math.min(prev.stats.currentHp, newMaxHp);
      const baseAttack = Math.floor(newBaseStats.str * 1.5 + newBaseStats.dex * 0.5) + 5;
      const baseDefense = Math.floor(newBaseStats.str * 0.5 + newBaseStats.vit * 0.5) + 2;

      // Re-apply equipment bonuses
      let bonusAttack = 0;
      let bonusDefense = 0;
      let bonusHp = 0;
      for (const item of prev.equippedItems) {
        for (const affix of item.affixes) {
          if (affix.stat === 'physicalDamage') bonusAttack += affix.value;
          if (affix.stat === 'defense') bonusDefense += affix.value;
          if (affix.stat === 'hp') bonusHp += affix.value;
        }
        if (item.itemType === 'Weapon' && item.baseDamage) bonusAttack += item.baseDamage;
        if (item.itemType === 'Armor' && item.baseDefense) bonusDefense += item.baseDefense;
      }

      return {
        ...prev,
        baseStats: newBaseStats,
        stats: {
          ...prev.stats,
          str: newBaseStats.str,
          dex: newBaseStats.dex,
          int: newBaseStats.int,
          vit: newBaseStats.vit,
          maxHp: newMaxHp + bonusHp,
          currentHp: newCurrentHp,
          attack: baseAttack + bonusAttack,
          defense: baseDefense + bonusDefense,
        },
        totalStatPointsSpent: newTotalSpent,
        pendingStatPoints: calculateUnspentStatPoints(prev.totalStatPointsEarned, newTotalSpent),
      };
    });
  }, []);

  const syncHpToBackend = useCallback((characterId: number, hp: number) => {
    setCharacterHp.mutate({ characterId, hp });
  }, [setCharacterHp]);

  return {
    localCharacter,
    updateHp,
    applyEquipment,
    applyAbilities,
    applyLevelUp,
    syncHpToBackend,
  };
}

export function saveStarterEquipmentForCharacter(_characterId: number): void {
  // Starter equipment is managed locally; no backend persistence needed for items yet
}
