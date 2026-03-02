import { useEffect, useRef, useCallback } from 'react';
import { LocalCharacter } from '../types/game';
import { useSetCharacterHp } from './useQueries';

const REGEN_INTERVAL_MS = 1000; // 1 second
const REGEN_AMOUNT = 2;
const SYNC_THRESHOLD = 10; // sync to backend every 10 HP gained

interface UseHealthRegenOptions {
  character: LocalCharacter | null;
  isInCombat: boolean;
  onHpChange: (newHp: number) => void;
}

export function useHealthRegen({ character, isInCombat, onHpChange }: UseHealthRegenOptions) {
  const setCharacterHp = useSetCharacterHp();

  // Use refs to avoid stale closures in the interval
  const characterRef = useRef(character);
  const isInCombatRef = useRef(isInCombat);
  const hpSinceLastSyncRef = useRef(0);
  const currentHpRef = useRef<number | null>(null);

  // Keep refs in sync with latest props
  useEffect(() => {
    characterRef.current = character;
  }, [character]);

  useEffect(() => {
    isInCombatRef.current = isInCombat;
  }, [isInCombat]);

  // When character id changes (new character selected), reset the HP ref
  // so we always start from the backend-persisted value
  const characterId = character?.id;
  useEffect(() => {
    if (character) {
      currentHpRef.current = character.stats.currentHp;
      hpSinceLastSyncRef.current = 0;
    } else {
      currentHpRef.current = null;
    }
  }, [characterId]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncHpToBackend = useCallback((hp: number) => {
    const char = characterRef.current;
    if (!char) return;
    setCharacterHp.mutate({ characterId: char.id, hp });
    hpSinceLastSyncRef.current = 0;
  }, [setCharacterHp]);

  useEffect(() => {
    const interval = setInterval(() => {
      const char = characterRef.current;
      if (!char || isInCombatRef.current) return;

      const maxHp = char.stats.maxHp;
      const liveHp = currentHpRef.current ?? char.stats.currentHp;

      if (liveHp >= maxHp) return;

      const newHp = Math.min(maxHp, liveHp + REGEN_AMOUNT);
      currentHpRef.current = newHp;
      hpSinceLastSyncRef.current += REGEN_AMOUNT;

      onHpChange(newHp);

      // Sync to backend periodically or when full
      if (hpSinceLastSyncRef.current >= SYNC_THRESHOLD || newHp >= maxHp) {
        syncHpToBackend(newHp);
      }
    }, REGEN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [onHpChange, syncHpToBackend]);

  // Sync HP to backend when component unmounts (navigation away)
  useEffect(() => {
    return () => {
      const char = characterRef.current;
      const liveHp = currentHpRef.current;
      if (char && liveHp !== null && liveHp !== char.stats.currentHp) {
        setCharacterHp.mutate({ characterId: char.id, hp: liveHp });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
