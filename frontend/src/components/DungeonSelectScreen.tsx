import React, { useState } from 'react';
import { Sword, AlertTriangle, Zap, Flame, Gift } from 'lucide-react';
import { LocalCharacter } from '../hooks/useLocalCharacter';
import { GeneratedItem } from '../engine/lootGenerator';
import { ItemCard } from './ItemTooltip';
import { calculateDropRate, getMaxMonsterLevel } from '../engine/combatEngine';

type DungeonMode = 'Catacombs' | 'Depths' | 'AscensionTrial';

interface DungeonSelectScreenProps {
  character: LocalCharacter;
  onStartDungeon: (mode: DungeonMode, level: number) => void;
  pendingLoot: GeneratedItem[];
  onClearPendingLoot: () => void;
}

export default function DungeonSelectScreen({
  character,
  onStartDungeon,
  pendingLoot,
  onClearPendingLoot,
}: DungeonSelectScreenProps) {
  const maxLevel = getMaxMonsterLevel(character.level);
  const minLevel = 1;

  const [monsterLevel, setMonsterLevel] = useState<number>(character.level);
  const [inputValue, setInputValue] = useState<string>(String(character.level));
  const [levelError, setLevelError] = useState<string | null>(null);
  const [showLootModal, setShowLootModal] = useState(pendingLoot.length > 0);

  const dropRatePercent = calculateDropRate(character.level, monsterLevel);

  // XP rate: scales with monster level relative to player
  function getXpRateLabel(playerLevel: number, mLevel: number): { label: string; color: string } {
    const diff = mLevel - playerLevel;
    if (diff >= 3) return { label: 'Bonus XP (+50%)', color: 'text-yellow-400' };
    if (diff >= 0) return { label: 'Full XP (100%)', color: 'text-green-400' };
    if (diff >= -3) return { label: 'Reduced XP', color: 'text-muted' };
    return { label: 'Minimal XP', color: 'text-muted/60' };
  }

  const xpInfo = getXpRateLabel(character.level, monsterLevel);

  const validateLevel = (value: number): string | null => {
    if (value > maxLevel) {
      return `Maximum monster level is ${maxLevel} (your level + 5). It is not possible to fight higher.`;
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
    onStartDungeon('Catacombs', level);
  };

  const handleStartAscension = () => {
    onStartDungeon('AscensionTrial', character.level + 5);
  };

  const handleClearLoot = () => {
    setShowLootModal(false);
    onClearPendingLoot();
  };

  const canStartCombat = !levelError && monsterLevel >= minLevel && monsterLevel <= maxLevel;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-foreground font-display mb-1">Enter the Abyss</h2>
        <p className="text-muted text-sm">
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
              className="text-xs text-muted hover:text-foreground transition-colors"
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
      {character.currentHP < character.maxHP && (
        <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-300">Not at full health</p>
            <p className="text-xs text-muted mt-0.5">
              You will enter combat with {character.currentHP}/{character.maxHP} HP. Consider
              waiting for health regeneration before fighting.
            </p>
          </div>
        </div>
      )}

      {/* Monster Level Input */}
      <div className="bg-surface-1 border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sword className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Monster Level</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted mb-1.5 block">
              Enter level (1 – {maxLevel})
            </label>
            <input
              type="number"
              min={minLevel}
              max={maxLevel}
              value={inputValue}
              onChange={handleLevelChange}
              onBlur={handleLevelBlur}
              placeholder={`1 to ${maxLevel}`}
              className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Slider */}
          <input
            type="range"
            min={minLevel}
            max={maxLevel}
            value={Math.max(minLevel, Math.min(maxLevel, monsterLevel || minLevel))}
            onChange={handleSliderChange}
            className="w-full accent-primary"
          />

          {levelError && (
            <div className="flex items-start gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{levelError}</span>
            </div>
          )}

          {/* Static XP & Drop Rate Info */}
          {canStartCombat && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-surface-2 rounded-lg p-3 text-center">
                <div className="text-xs text-muted mb-1 uppercase tracking-wide">XP Rate</div>
                <div className={`text-sm font-semibold ${xpInfo.color}`}>{xpInfo.label}</div>
              </div>
              <div className="bg-surface-2 rounded-lg p-3 text-center">
                <div className="text-xs text-muted mb-1 uppercase tracking-wide">Drop Rate</div>
                <div className={`text-sm font-semibold ${dropRatePercent > 0 ? 'text-foreground' : 'text-red-400'}`}>
                  {dropRatePercent}%
                  {dropRatePercent === 0 && (
                    <span className="block text-xs font-normal text-red-400/80 mt-0.5">monster too low level</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleStartCombat}
            disabled={!canStartCombat}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Flame className="w-4 h-4" />
            Start Combat
          </button>
        </div>
      </div>

      {/* Ascension Trial */}
      <div className="bg-surface-1 border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-foreground">Ascension Trial</h3>
          <span className="text-xs text-muted ml-auto">
            Level {character.level + 5} challenge
          </span>
        </div>
        <p className="text-sm text-muted mb-4">
          Face a powerful enemy 5 levels above you. Rewards are greatly increased but the
          challenge is severe.
        </p>
        <button
          onClick={handleStartAscension}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-yellow-600/20 border border-yellow-600/40 text-yellow-300 font-medium hover:bg-yellow-600/30 transition-all active:scale-95"
        >
          <Zap className="w-4 h-4" />
          Begin Ascension Trial
        </button>
      </div>
    </div>
  );
}
