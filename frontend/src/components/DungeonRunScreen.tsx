import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LocalCharacter, calculateLevel } from '../types/game';
import { simulateCombat, generateMonster, Monster, CombatResult, PLAYER_TICKS_BETWEEN_ATTACKS } from '../engine/combatEngine';
import { getEnemyTicksBetweenAttacks } from '../data/monsters';
import { GeneratedItem } from '../engine/lootGenerator';
import { useSubmitDungeonResult } from '../hooks/useQueries';
import HealthBar from './HealthBar';
import { ItemCard } from './ItemTooltip';

interface DungeonRunScreenProps {
  character: LocalCharacter;
  dungeonLevel: number;
  onComplete: (result: { xpEarned: number; finalHp: number; newLevel: number }) => void;
  onBack: () => void;
}

const MONSTERS_PER_RUN = 5;
const LOG_ANIMATION_DELAY_MS = 60;

export default function DungeonRunScreen({
  character,
  dungeonLevel,
  onComplete,
  onBack,
}: DungeonRunScreenProps) {
  const submitDungeonResult = useSubmitDungeonResult();

  const [phase, setPhase] = useState<'simulating' | 'animating' | 'done'>('simulating');
  const [displayedLog, setDisplayedLog] = useState<CombatResult['log']>([]);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [currentMonsterIndex, setCurrentMonsterIndex] = useState(0);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSimulated = useRef(false);

  // Run simulation on mount
  useEffect(() => {
    if (hasSimulated.current) return;
    hasSimulated.current = true;

    const generatedMonsters: Monster[] = [];
    for (let i = 0; i < MONSTERS_PER_RUN; i++) {
      generatedMonsters.push(generateMonster(dungeonLevel, i + 1));
    }
    setMonsters(generatedMonsters);

    const result = simulateCombat(character, generatedMonsters);
    setCombatResult(result);
    setPhase('animating');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate log entries
  useEffect(() => {
    if (phase !== 'animating' || !combatResult) return;

    let index = 0;
    const animate = () => {
      if (index >= combatResult.log.length) {
        setPhase('done');
        return;
      }

      const entry = combatResult.log[index];
      if (entry.type === 'info' && entry.message.includes('You encounter')) {
        const monsterMatch = entry.message.match(/encounter a (.+?) \(Level/);
        if (monsterMatch) {
          const monsterName = monsterMatch[1];
          const idx = monsters.findIndex(m => m.name === monsterName);
          if (idx !== -1) setCurrentMonsterIndex(idx);
        }
      }

      setDisplayedLog(prev => [...prev, combatResult.log[index]]);
      index++;
      animationRef.current = setTimeout(animate, LOG_ANIMATION_DELAY_MS);
    };

    animationRef.current = setTimeout(animate, LOG_ANIMATION_DELAY_MS);

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [phase, combatResult, monsters]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedLog]);

  // Save results when done
  useEffect(() => {
    if (phase !== 'done' || !combatResult || savedSuccessfully) return;

    const currentXp = character.xp + combatResult.xpEarned;
    const newLevel = Math.max(character.level, calculateLevel(currentXp));
    const totalStatPointsEarned = newLevel - 1;

    submitDungeonResult.mutate(
      {
        characterId: character.id,
        xpEarned: BigInt(currentXp),
        newLevel: BigInt(newLevel),
        unspentStatPoints: BigInt(totalStatPointsEarned),
      },
      {
        onSuccess: () => setSavedSuccessfully(true),
      }
    );
  }, [phase, combatResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = useCallback(() => {
    if (!combatResult) return;
    const currentXp = character.xp + combatResult.xpEarned;
    const newLevel = Math.max(character.level, calculateLevel(currentXp));
    onComplete({
      xpEarned: combatResult.xpEarned,
      finalHp: combatResult.finalPlayerHp,
      newLevel,
    });
  }, [combatResult, character, onComplete]);

  const getLogEntryColor = (type: CombatResult['log'][0]['type']) => {
    switch (type) {
      case 'player-attack': return 'text-blue-400';
      case 'enemy-attack': return 'text-red-400';
      case 'player-ability': return 'text-purple-400';
      case 'crit': return 'text-yellow-400 font-semibold';
      case 'enemy-death': return 'text-green-400 font-semibold';
      case 'player-death': return 'text-red-500 font-bold';
      case 'loot': return 'text-amber-400';
      case 'info': return 'text-muted-foreground';
      default: return 'text-foreground';
    }
  };

  const currentMonster = monsters[currentMonsterIndex];

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-surface-1 rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-primary">
              Dungeon Level {dungeonLevel}
            </h2>
            <p className="text-sm text-muted-foreground">
              {phase === 'simulating' && 'Preparing combat...'}
              {phase === 'animating' && 'Combat in progress...'}
              {phase === 'done' && (combatResult?.victory ? '⚔️ Victory!' : '💀 Defeated!')}
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>Your attack speed: <span className="text-foreground font-semibold">{PLAYER_TICKS_BETWEEN_ATTACKS} ticks</span></div>
          </div>
        </div>
      </div>

      {/* Combat Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player */}
        <div className="bg-surface-1 rounded-lg p-4 border border-border">
          <h3 className="font-display font-semibold text-foreground mb-2">{character.name}</h3>
          <HealthBar
            currentHP={phase === 'done' && combatResult ? combatResult.finalPlayerHp : character.stats.currentHp}
            maxHP={character.stats.maxHp}
          />
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <div>ATK: {character.stats.attack} | DEF: {character.stats.defense}</div>
            <div>Attack Speed: {PLAYER_TICKS_BETWEEN_ATTACKS} ticks/attack</div>
          </div>
        </div>

        {/* Current Monster */}
        {currentMonster && (
          <div className="bg-surface-1 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <img
                src="/assets/generated/monster-placeholder.dim_128x128.png"
                alt={currentMonster.name}
                className="w-10 h-10 rounded object-cover"
              />
              <div>
                <h3 className="font-display font-semibold text-foreground">{currentMonster.name}</h3>
                <span className="text-xs text-muted-foreground">Level {currentMonster.level}</span>
              </div>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-2 mb-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: '100%' }}
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>HP: {currentMonster.hp} | ATK: {currentMonster.attack} | DEF: {currentMonster.defense}</div>
              <div>Attack Speed: {getEnemyTicksBetweenAttacks(currentMonster.level)} ticks/attack</div>
              <div>XP Reward: <span className="text-accent font-semibold">{currentMonster.xpReward}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Monster List */}
      <div className="bg-surface-1 rounded-lg p-4 border border-border">
        <h3 className="font-display font-semibold text-foreground mb-3">Enemies This Run</h3>
        <div className="grid grid-cols-5 gap-2">
          {monsters.map((monster, i) => (
            <div
              key={monster.id}
              className={`text-center p-2 rounded border text-xs font-display transition-colors ${
                i === currentMonsterIndex && phase !== 'done'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface-2 text-muted-foreground'
              }`}
            >
              <div className="font-semibold truncate">{monster.name}</div>
              <div>Lv.{monster.level}</div>
              <div className="text-accent">{monster.xpReward} XP</div>
              <div className="text-muted-foreground/70">{getEnemyTicksBetweenAttacks(monster.level)}t</div>
            </div>
          ))}
        </div>
      </div>

      {/* Combat Log */}
      <div className="bg-surface-1 rounded-lg border border-border">
        <div className="p-3 border-b border-border">
          <h3 className="font-display font-semibold text-foreground">Combat Log</h3>
        </div>
        <div className="h-64 overflow-y-auto p-3 space-y-1 font-mono text-xs">
          {displayedLog.map((entry, i) => (
            <div key={i} className={getLogEntryColor(entry.type)}>
              <span className="text-muted-foreground/50 mr-2">[{entry.tick}]</span>
              {entry.message}
            </div>
          ))}
          {phase === 'simulating' && (
            <div className="text-muted-foreground animate-pulse">Simulating combat...</div>
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Results */}
      {phase === 'done' && combatResult && (
        <div className="bg-surface-1 rounded-lg p-4 border border-border space-y-3">
          <h3 className="font-display font-semibold text-foreground text-lg">
            {combatResult.victory ? '🏆 Run Complete!' : '💀 Run Failed'}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-surface-2 rounded p-3">
              <div className="text-muted-foreground">Monsters Defeated</div>
              <div className="font-display font-bold text-foreground text-lg">{combatResult.monstersDefeated}/{MONSTERS_PER_RUN}</div>
            </div>
            <div className="bg-surface-2 rounded p-3">
              <div className="text-muted-foreground">XP Earned</div>
              <div className="font-display font-bold text-accent text-lg">+{combatResult.xpEarned}</div>
            </div>
            <div className="bg-surface-2 rounded p-3">
              <div className="text-muted-foreground">Final HP</div>
              <div className="font-display font-bold text-foreground text-lg">{combatResult.finalPlayerHp}/{character.stats.maxHp}</div>
            </div>
            <div className="bg-surface-2 rounded p-3">
              <div className="text-muted-foreground">Total Ticks</div>
              <div className="font-display font-bold text-foreground text-lg">{combatResult.totalTicks}</div>
            </div>
          </div>

          {combatResult.loot.length > 0 && (
            <div>
              <h4 className="font-display font-semibold text-foreground mb-2">Loot Dropped</h4>
              <div className="flex flex-wrap gap-2">
                {combatResult.loot.map((item: GeneratedItem) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-surface-2 text-foreground rounded font-display font-semibold hover:bg-surface-2/80 transition-colors border border-border"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded font-display font-semibold hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
