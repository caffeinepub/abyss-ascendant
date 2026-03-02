import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LocalCharacter } from '../hooks/useLocalCharacter';
import { runFullCombat, CombatLogEntry, CombatResult, spawnMonster, MonsterInstance } from '../engine/combatEngine';
import { GeneratedItem } from '../engine/lootGenerator';
import { useSubmitDungeonResult } from '../hooks/useQueries';

interface DungeonRunScreenProps {
  character: LocalCharacter;
  dungeonMode: 'Catacombs' | 'Depths' | 'AscensionTrial';
  dungeonLevel: number;
  onComplete: (result: { survived: boolean; xpGained: number; loot: GeneratedItem[] }) => void;
  onDeath: () => void;
}

const MODE_LABELS: Record<string, string> = {
  Catacombs: '🏚️ Catacombs',
  Depths: '🌑 The Depths',
  AscensionTrial: '🔥 Ascension Trial',
};

const LOG_COLORS: Record<CombatLogEntry['type'], string> = {
  player_attack: 'text-foreground',
  monster_attack: 'text-red-400',
  player_crit: 'text-yellow-400 font-semibold',
  monster_crit: 'text-red-500 font-semibold',
  player_death: 'text-red-600 font-bold',
  monster_death: 'text-green-400 font-semibold',
  loot: 'text-purple-400',
  xp: 'text-blue-400',
  info: 'text-muted-foreground',
};

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
  // Preview monster for showing stats before combat resolves
  const [previewMonster, setPreviewMonster] = useState<MonsterInstance | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const submitDungeonResult = useSubmitDungeonResult();

  const startCombat = useCallback(() => {
    setIsRunning(true);
    setLog([]);
    setCurrentLogIndex(0);
    setResult(null);

    const combatResult = runFullCombat(
      {
        str: character.stats.str,
        dex: character.stats.dex,
        int: character.stats.int,
        vit: character.stats.vit,
        level: character.level,
        equippedItems: character.equippedItems,
      },
      dungeonLevel,
      dungeonMode
    );

    // Spawn a preview monster to show stats (separate instance for display only)
    const preview = spawnMonster(dungeonLevel);
    setPreviewMonster(preview);
    setResult(combatResult);
  }, [character, dungeonLevel, dungeonMode]);

  // Auto-start combat on mount
  useEffect(() => {
    const timer = setTimeout(startCombat, 500);
    return () => clearTimeout(timer);
  }, [startCombat]);

  // Animate log entries one by one
  useEffect(() => {
    if (!result) return;
    if (currentLogIndex >= result.log.length) {
      setIsRunning(false);
      return;
    }

    const delay = result.log[currentLogIndex].type === 'info' ? 400 : 250;
    const timer = setTimeout(() => {
      setLog((prev) => [...prev, result.log[currentLogIndex]]);
      setCurrentLogIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [result, currentLogIndex]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  // Submit XP to backend when combat finishes
  useEffect(() => {
    if (!result || isRunning) return;
    if (result.victory && result.xpGained > 0) {
      submitDungeonResult.mutate(result.xpGained);
    }
  }, [result, isRunning]);

  function handleContinue() {
    if (!result) return;
    if (!result.survived) {
      onDeath();
      return;
    }
    onComplete({
      survived: result.survived,
      xpGained: result.xpGained,
      loot: result.loot,
    });
  }

  const isFinished = !isRunning && result !== null && currentLogIndex >= (result?.log.length ?? 0);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{MODE_LABELS[dungeonMode]}</h2>
          <p className="text-sm text-muted-foreground">Dungeon Level {dungeonLevel}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>{character.name}</div>
          <div>Level {character.level}</div>
        </div>
      </div>

      {/* Monster Info Panel */}
      {previewMonster && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{previewMonster.template.emoji}</span>
            <div className="flex-1">
              <div className="font-bold text-foreground">{previewMonster.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                HP: {previewMonster.maxHp} · ATK: {previewMonster.attack} · DEF: {previewMonster.defense}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Atk Speed</div>
              <div className="text-sm font-semibold text-orange-400">
                ⚡ {previewMonster.ticksBetweenAttacks} ticks
              </div>
            </div>
          </div>
          {/* Monster HP bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{previewMonster.name}</span>
              <span>{previewMonster.maxHp} HP</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full w-full transition-all duration-300" />
            </div>
          </div>
        </div>
      )}

      {/* Combat Log */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
          Combat Log
        </h3>
        <div className="h-72 overflow-y-auto space-y-1 font-mono text-sm">
          {log.map((entry, i) => (
            <div key={i} className={`${LOG_COLORS[entry.type]} leading-relaxed`}>
              {entry.message}
            </div>
          ))}
          {isRunning && (
            <div className="text-muted-foreground animate-pulse">⚔️ Combat in progress...</div>
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Result Panel */}
      {isFinished && result && (
        <div
          className={`bg-card border rounded-xl p-5 ${
            result.victory ? 'border-green-500/40' : 'border-red-500/40'
          }`}
        >
          <h3
            className={`text-xl font-bold mb-3 ${
              result.victory ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {result.victory ? '🏆 Victory!' : '💀 Defeated'}
          </h3>

          {result.victory && (
            <div className="space-y-2 text-sm">
              {/* XP Gained */}
              <div className="flex items-center gap-2 text-blue-400">
                <span>✨</span>
                <span>+{result.xpGained} XP gained</span>
              </div>

              {/* Loot */}
              {result.loot.length > 0 && (
                <div>
                  <div className="text-muted-foreground mb-1">Items found:</div>
                  {result.loot.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-purple-400 ml-2">
                      <span>{item.icon}</span>
                      <span>
                        {item.name} ({item.rarity})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!result.survived && (
            <div className="space-y-2 text-sm">
              <div className="text-red-400">
                {character.realm === 'Hardcore'
                  ? '💀 Your character has died permanently.'
                  : '💔 You lost 10% of your experience.'}
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            className={`mt-4 w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
              result.victory
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            }`}
          >
            {result.survived ? 'Continue' : character.realm === 'Hardcore' ? 'Accept Fate' : 'Respawn'}
          </button>
        </div>
      )}
    </div>
  );
}
