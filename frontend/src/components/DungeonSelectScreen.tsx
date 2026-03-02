import React, { useState } from 'react';
import { Sword, AlertTriangle, Flame, Gift } from 'lucide-react';
import { LocalCharacter } from '../types/game';
import { GeneratedItem } from '../engine/lootGenerator';
import { ItemCard } from './ItemTooltip';
import { calculateDropRate, getMaxMonsterLevel } from '../engine/combatEngine';

interface DungeonSelectScreenProps {
  character?: LocalCharacter;
  onStartDungeon: (level: number) => void;
  pendingLoot?: GeneratedItem[];
  onClearPendingLoot?: () => void;
}

export default function DungeonSelectScreen({
  character,
  onStartDungeon,
  pendingLoot = [],
  onClearPendingLoot,
}: DungeonSelectScreenProps) {
  // All hooks must be called unconditionally before any early returns
  const [showLootModal, setShowLootModal] = useState(pendingLoot.length > 0);
  const [monsterLevel, setMonsterLevel] = useState<number>(character?.level ?? 1);
  const [inputValue, setInputValue] = useState<string>(String(character?.level ?? 1));
  const [levelError, setLevelError] = useState<string | null>(null);

  if (!character) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground font-display">No character selected.</p>
      </div>
    );
  }

  const maxLevel = getMaxMonsterLevel(character.level);
  const minLevel = 1;

  const dropRatePercent = Math.round(calculateDropRate(monsterLevel) * 100);

  function getXpRateLabel(playerLevel: number, mLevel: number): { label: string; color: string } {
    const diff = mLevel - playerLevel;
    if (diff >= 3) return { label: 'Bonus XP (+50%)', color: 'text-yellow-400' };
    if (diff >= 0) return { label: 'Full XP (100%)', color: 'text-green-400' };
    if (diff >= -3) return { label: 'Reduced XP', color: 'text-muted-foreground' };
    return { label: 'Minimal XP', color: 'text-muted-foreground/60' };
  }

  const xpInfo = getXpRateLabel(character.level, monsterLevel);

  const validateLevel = (value: number): string | null => {
    if (value > maxLevel) {
      return `Maximum monster level is ${maxLevel} (your level + 5).`;
    }
    if (value < minLevel) {
      return `Minimum monster level is ${minLevel}.`;
    }
    return null;
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      setMonsterLevel(parsed);
      setLevelError(validateLevel(parsed));
    }
  };

  const handleLevelBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed)) {
      setMonsterLevel(character.level);
      setInputValue(String(character.level));
      setLevelError(null);
      return;
    }
    const error = validateLevel(parsed);
    if (error) {
      setLevelError(error);
    } else {
      const clamped = Math.max(minLevel, Math.min(maxLevel, parsed));
      setMonsterLevel(clamped);
      setInputValue(String(clamped));
      setLevelError(null);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    setMonsterLevel(v);
    setInputValue(String(v));
    setLevelError(null);
  };

  const handleStartCombat = () => {
    if (levelError) return;
    const level = Math.max(minLevel, Math.min(maxLevel, monsterLevel));
    onStartDungeon(level);
  };

  const handleClearLoot = () => {
    setShowLootModal(false);
    onClearPendingLoot?.();
  };

  const canStartCombat = !levelError && monsterLevel >= minLevel && monsterLevel <= maxLevel;
  const currentHp = character.stats.currentHp;
  const maxHp = character.stats.maxHp;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-foreground font-display mb-1">Enter the Abyss</h2>
        <p className="text-muted-foreground text-sm">
          Choose your challenge. The deeper you go, the greater the reward.
        </p>
      </div>

      {/* Pending loot notification */}
      {showLootModal && pendingLoot.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold text-yellow-300 text-sm">
                {pendingLoot.length} item{pendingLoot.length !== 1 ? 's' : ''} found!
              </span>
            </div>
            <button
              onClick={handleClearLoot}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {pendingLoot.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Current HP warning */}
      {currentHp < maxHp && (
        <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 text-sm font-semibold">Not at full health</p>
            <p className="text-yellow-200/70 text-xs mt-0.5">
              HP: {currentHp}/{maxHp} — Consider resting before entering the dungeon.
            </p>
          </div>
        </div>
      )}

      {/* Dungeon Level Selector */}
      <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Dungeon Level</h3>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min={minLevel}
            max={maxLevel}
            value={monsterLevel}
            onChange={handleSliderChange}
            className="flex-1 accent-primary"
          />
          <input
            type="number"
            min={minLevel}
            max={maxLevel}
            value={inputValue}
            onChange={handleLevelChange}
            onBlur={handleLevelBlur}
            className="w-16 text-center bg-surface-2 border border-border rounded px-2 py-1 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {levelError && (
          <p className="text-destructive text-xs">{levelError}</p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">Drop Rate</div>
            <div className="font-display font-semibold text-foreground">{dropRatePercent}%</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-muted-foreground text-xs mb-1">XP Rate</div>
            <div className={`font-display font-semibold ${xpInfo.color}`}>{xpInfo.label}</div>
          </div>
        </div>
      </div>

      {/* Enter Button */}
      <button
        onClick={handleStartCombat}
        disabled={!canStartCombat}
        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-display font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <Sword className="w-5 h-5" />
        Enter Dungeon (Level {monsterLevel})
      </button>
    </div>
  );
}
