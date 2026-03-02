import React, { useState, useEffect, useRef } from 'react';
import { LocalCharacter } from '../hooks/useLocalCharacter';
import {
  simulateCombat,
  simulateAscensionTrial,
  spawnMonster,
  CombatResult,
  CombatLogEntry,
} from '../engine/combatEngine';
import { generateLoot, GeneratedItem } from '../engine/lootGenerator';
import { Loader2, ScrollText, Trophy, Skull, ChevronRight } from 'lucide-react';

interface DungeonRunScreenProps {
  character: LocalCharacter;
  dungeonMode: 'Catacombs' | 'Depths' | 'AscensionTrial';
  dungeonLevel: number;
  onComplete: (result: { survived: boolean; xpGained: number; loot: GeneratedItem[]; remainingHp: number }) => void;
  onDeath: () => void;
}

export default function DungeonRunScreen({
  character,
  dungeonMode,
  dungeonLevel,
  onComplete,
  onDeath,
}: DungeonRunScreenProps) {
  const [log, setLog] = useState<CombatLogEntry[]>([]);
  const [result, setResult] = useState<CombatResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [loot, setLoot] = useState<GeneratedItem | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const isAscension = dungeonMode === 'AscensionTrial';

  const startCombat = () => {
    setIsRunning(true);
    setLog([]);
    setCurrentLogIndex(0);
    setResult(null);

    let combatResult: CombatResult;

    if (isAscension) {
      const ascResult = simulateAscensionTrial(character, character.currentHP);
      const droppedItem = ascResult.itemDropped ? generateLoot(character.level + 5) : null;
      combatResult = {
        victory: ascResult.victory,
        ticksElapsed: ascResult.log.length,
        xpGained: ascResult.xpGained,
        log: ascResult.log,
        playerHpRemaining: ascResult.playerHpRemaining,
        monsterHpRemaining: 0,
        itemDropped: ascResult.itemDropped,
        penaltyApplied: false,
        remainingHp: ascResult.playerHpRemaining,
        lootDropped: droppedItem,
      };
      setLoot(droppedItem);
    } else {
      const monster = spawnMonster(dungeonLevel);
      combatResult = simulateCombat(character, monster, character.currentHP);
      setLoot(combatResult.lootDropped);
    }

    setResult(combatResult);
  };

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    const timer = setTimeout(startCombat, 400);
    return () => clearTimeout(timer);
  }, []);

  // Animate log entries
  useEffect(() => {
    if (!result) return;
    if (currentLogIndex >= result.log.length) {
      setIsRunning(false);
      return;
    }
    const timer = setTimeout(() => {
      setLog((prev) => [...prev, result.log[currentLogIndex]]);
      setCurrentLogIndex((prev) => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, [result, currentLogIndex]);

  // Auto-scroll
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  function handleContinue() {
    if (!result) return;
    const survived = result.playerHpRemaining > 0;
    if (!survived) {
      onDeath();
      return;
    }
    onComplete({
      survived,
      xpGained: result.xpGained,
      loot: loot ? [loot] : [],
      remainingHp: result.remainingHp,
    });
  }

  const isFinished = !isRunning && result !== null && currentLogIndex >= (result?.log.length ?? 0);

  const getLogColor = (entry: CombatLogEntry) => {
    if (entry.actor === 'player') {
      if (entry.abilityName) return 'text-purple-300';
      if (entry.isCrit) return 'text-yellow-300';
      return 'text-blue-300';
    }
    return 'text-red-300';
  };

  const formatLogEntry = (entry: CombatLogEntry) => {
    const actor = entry.actor === 'player' ? character.name : 'Monster';
    const critTag = entry.isCrit ? ' [CRIT!]' : '';
    if (entry.healing) return `${actor} ${entry.action}: +${entry.healing} HP healed${critTag}`;
    if (entry.damage !== undefined) return `${actor} ${entry.action}: ${entry.damage} dmg${critTag}`;
    return `${actor} ${entry.action}`;
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-surface-1 border border-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground font-display">
            {isAscension ? '🔥 Ascension Trial' : '⚔️ Combat'}
          </h2>
          <p className="text-sm text-muted">
            Level {dungeonLevel} encounter · Entering with {character.currentHP}/{character.maxHP} HP
          </p>
        </div>
        {isRunning && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
      </div>

      {/* Combat Log */}
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <ScrollText className="w-4 h-4 text-muted" />
          <span className="text-sm font-medium text-foreground">Combat Log</span>
        </div>
        <div className="h-72 overflow-y-auto p-4 space-y-1 font-mono text-xs">
          {log.map((entry, i) => (
            <div key={i} className={`${getLogColor(entry)} leading-relaxed`}>
              <span className="text-muted/50 mr-2">[{entry.tick}]</span>
              {formatLogEntry(entry)}
            </div>
          ))}
          {isRunning && (
            <div className="text-muted animate-pulse">▋</div>
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Result */}
      {isFinished && result && (
        <div className={`rounded-xl border p-5 ${
          result.victory
            ? 'bg-green-900/20 border-green-700/40'
            : 'bg-red-900/20 border-red-700/40'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {result.victory ? (
              <Trophy className="w-8 h-8 text-yellow-400" />
            ) : (
              <Skull className="w-8 h-8 text-red-400" />
            )}
            <div>
              <h3 className="text-lg font-bold text-foreground font-display">
                {result.victory ? 'Victory!' : 'Defeated'}
              </h3>
              <p className="text-sm text-muted">
                {result.victory
                  ? `Remaining HP: ${result.remainingHp} / ${character.maxHP}`
                  : 'You have fallen in battle'}
              </p>
            </div>
          </div>

          {result.victory && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-surface-2 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-yellow-400">+{result.xpGained}</div>
                <div className="text-xs text-muted">Experience</div>
              </div>
              <div className="bg-surface-2 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-400">
                  {result.remainingHp} / {character.maxHP}
                </div>
                <div className="text-xs text-muted">HP Remaining</div>
              </div>
            </div>
          )}

          {loot && (
            <div className="mb-4 bg-surface-2 rounded-lg p-3">
              <div className="text-xs text-muted mb-1">Item Dropped</div>
              <div className={`font-medium text-sm ${
                loot.rarity === 'Legendary' ? 'text-yellow-400' :
                loot.rarity === 'Rare' ? 'text-blue-400' :
                loot.rarity === 'Uncommon' ? 'text-green-400' :
                'text-foreground'
              }`}>
                {loot.icon} {loot.name}
              </div>
              <div className="text-xs text-muted">{loot.rarity} {loot.itemType}</div>
            </div>
          )}

          <button
            onClick={handleContinue}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all active:scale-95"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
