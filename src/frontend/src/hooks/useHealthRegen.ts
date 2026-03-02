import { useCallback, useEffect, useRef } from "react";

const REGEN_RATE = 2; // HP per second
const REGEN_INTERVAL = 1000; // ms

interface UseHealthRegenOptions {
  currentHp: number;
  maxHp: number;
  isInCombat: boolean;
  onHpChange: (newHp: number) => void;
  onBackendSync?: (newHp: number) => void;
}

export function useHealthRegen({
  currentHp,
  maxHp,
  isInCombat,
  onHpChange,
  onBackendSync,
}: UseHealthRegenOptions): void {
  const currentHpRef = useRef(currentHp);
  const maxHpRef = useRef(maxHp);
  const isInCombatRef = useRef(isInCombat);
  const onHpChangeRef = useRef(onHpChange);
  const onBackendSyncRef = useRef(onBackendSync);

  // Keep refs in sync with latest values
  useEffect(() => {
    currentHpRef.current = currentHp;
  }, [currentHp]);

  useEffect(() => {
    maxHpRef.current = maxHp;
  }, [maxHp]);

  useEffect(() => {
    isInCombatRef.current = isInCombat;
  }, [isInCombat]);

  useEffect(() => {
    onHpChangeRef.current = onHpChange;
  }, [onHpChange]);

  useEffect(() => {
    onBackendSyncRef.current = onBackendSync;
  }, [onBackendSync]);

  const tick = useCallback(() => {
    if (isInCombatRef.current) return;
    const hp = currentHpRef.current;
    const max = maxHpRef.current;
    if (hp >= max) return;

    const newHp = Math.min(hp + REGEN_RATE, max);
    currentHpRef.current = newHp;
    onHpChangeRef.current(newHp);

    // Sync to backend every 5 HP gained or when full
    if (newHp === max || (newHp - hp) % 10 === 0) {
      onBackendSyncRef.current?.(newHp);
    }
  }, []);

  useEffect(() => {
    // Don't start regen if already at max
    if (currentHp >= maxHp) return;
    if (isInCombat) return;

    const interval = setInterval(tick, REGEN_INTERVAL);
    return () => clearInterval(interval);
  }, [currentHp, isInCombat, maxHp, tick]);

  // Also sync to backend when regen completes (reaches max)
  useEffect(() => {
    if (currentHp >= maxHp && !isInCombat) {
      onBackendSync?.(currentHp);
    }
  }, [currentHp, maxHp, isInCombat, onBackendSync]);
}
