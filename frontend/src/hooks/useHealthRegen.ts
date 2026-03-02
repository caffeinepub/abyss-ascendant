import { useEffect, useRef } from 'react';

interface UseHealthRegenOptions {
  currentHP: number;
  maxHP: number;
  isInCombat: boolean;
  onHpChange: (newHp: number) => void;
  onSyncToBackend: (hp: number) => void;
}

export function useHealthRegen({
  currentHP,
  maxHP,
  isInCombat,
  onHpChange,
  onSyncToBackend,
}: UseHealthRegenOptions) {
  const currentHPRef = useRef(currentHP);
  const maxHPRef = useRef(maxHP);
  const isInCombatRef = useRef(isInCombat);

  // Keep refs in sync
  currentHPRef.current = currentHP;
  maxHPRef.current = maxHP;
  isInCombatRef.current = isInCombat;

  useEffect(() => {
    if (isInCombat) return;
    if (currentHP >= maxHP) return;

    const interval = setInterval(() => {
      if (isInCombatRef.current) return;
      const current = currentHPRef.current;
      const max = maxHPRef.current;
      if (current >= max) {
        clearInterval(interval);
        return;
      }
      const newHp = Math.min(current + 2, max);
      onHpChange(newHp);
      onSyncToBackend(newHp);
    }, 1000);

    return () => clearInterval(interval);
  }, [isInCombat, currentHP >= maxHP]); // eslint-disable-line react-hooks/exhaustive-deps
}
