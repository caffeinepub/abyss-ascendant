import { AlertTriangle, Flame, Gift, Sword, Zap } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { type GeneratedMonster, generateMonster } from "../data/monsters";
import { calculateDropRate, getMaxMonsterLevel } from "../engine/combatEngine";
import type { GeneratedItem } from "../engine/lootGenerator";
import type { LocalCharacter } from "../types/game";
import { ItemCard } from "./ItemTooltip";

type DungeonMode = "Catacombs" | "Depths" | "AscensionTrial";

interface DungeonSelectScreenProps {
  character: LocalCharacter;
  onStartDungeon: (
    mode: DungeonMode,
    level: number,
    monsters?: GeneratedMonster[],
  ) => void;
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

  function getXpRateLabel(
    playerLevel: number,
    mLevel: number,
  ): { label: string; color: string } {
    const diff = mLevel - playerLevel;
    if (diff >= 3)
      return { label: "Bonus XP (+50%)", color: "text-yellow-400" };
    if (diff >= 0) return { label: "Full XP (100%)", color: "text-green-400" };
    if (diff >= -3) return { label: "Reduced XP", color: "text-muted" };
    return { label: "Minimal XP", color: "text-muted/60" };
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
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      setMonsterLevel(parsed);
      setLevelError(validateLevel(parsed));
    }
  };

  const handleLevelBlur = () => {
    const parsed = Number.parseInt(inputValue, 10);
    if (Number.isNaN(parsed)) {
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
    const v = Number.parseInt(e.target.value, 10);
    setMonsterLevel(v);
    setInputValue(String(v));
    setLevelError(null);
  };

  const handleStartCombat = () => {
    if (levelError) return;
    const level = Math.max(minLevel, Math.min(maxLevel, monsterLevel));
    // Generate the number of monsters for this dungeon level (1-3)
    const numMonsters = Math.min(3, 1 + Math.floor(level / 5));
    const monsters = Array.from({ length: numMonsters }, () =>
      generateMonster(),
    );
    onStartDungeon("Catacombs", level, monsters);
  };

  const handleStartAscension = () => {
    const ascensionLevel = character.level + 5;
    const numMonsters = Math.min(3, 1 + Math.floor(ascensionLevel / 5));
    const monsters = Array.from({ length: numMonsters }, () =>
      generateMonster(),
    );
    onStartDungeon("AscensionTrial", ascensionLevel, monsters);
  };

  const handleClearLoot = () => {
    setShowLootModal(false);
    onClearPendingLoot();
  };

  const canStartCombat =
    !levelError && monsterLevel >= minLevel && monsterLevel <= maxLevel;

  // Use the correct HP field from LocalCharacter.stats
  const currentHp = character.stats.currentHp;
  const maxHp = character.stats.maxHp;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-foreground font-display mb-1">
          Enter the Abyss
        </h2>
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
                {pendingLoot.length} item{pendingLoot.length !== 1 ? "s" : ""}{" "}
                found!
              </span>
            </div>
            <button
              type="button"
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
          <button
            type="button"
            onClick={handleClearLoot}
            className="mt-3 w-full text-sm text-center text-muted hover:text-foreground transition-colors"
          >
            Dismiss all
          </button>
        </div>
      )}

      {/* HP Warning */}
      {currentHp < maxHp * 0.3 && (
        <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-2 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Low HP! Consider resting before entering the dungeon.</span>
        </div>
      )}

      {/* Dungeon Card */}
      <div className="bg-surface-2 border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sword className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              The Catacombs
            </h3>
            <p className="text-xs text-muted">
              Standard dungeon run — fight monsters, earn XP and loot
            </p>
          </div>
        </div>

        {/* Monster Level Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="monster-level-input"
              className="text-sm font-medium text-foreground"
            >
              Monster Level
            </label>
            <div className="flex items-center gap-2">
              <input
                id="monster-level-input"
                type="number"
                min={minLevel}
                max={maxLevel}
                value={inputValue}
                onChange={handleLevelChange}
                onBlur={handleLevelBlur}
                className="w-16 text-center bg-surface-1 border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <input
            type="range"
            min={minLevel}
            max={maxLevel}
            value={monsterLevel}
            onChange={handleSliderChange}
            className="w-full accent-primary"
          />

          <div className="flex items-center justify-between text-xs text-muted">
            <span>Lv. {minLevel}</span>
            <span>Lv. {maxLevel}</span>
          </div>

          {levelError && (
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>{levelError}</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-surface-1 rounded-lg px-3 py-2">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className={xpInfo.color}>{xpInfo.label}</span>
          </div>
          <div className="flex items-center gap-2 bg-surface-1 rounded-lg px-3 py-2">
            <Gift className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-muted">{dropRatePercent}% drop rate</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartCombat}
          disabled={!canStartCombat}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Enter Dungeon
        </button>
      </div>

      {/* Ascension Trial */}
      <div className="bg-surface-2 border border-border rounded-xl p-5 space-y-3 opacity-90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Ascension Trial
            </h3>
            <p className="text-xs text-muted">
              Face monsters 5 levels above you — high risk, high reward
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-surface-1 rounded-lg px-3 py-2">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-yellow-400">Bonus XP (+50%)</span>
          </div>
          <div className="flex items-center gap-2 bg-surface-1 rounded-lg px-3 py-2">
            <Gift className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-muted">6% drop rate</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartAscension}
          className="w-full py-2.5 rounded-lg bg-yellow-600/80 text-white font-semibold text-sm hover:bg-yellow-600 transition-colors"
        >
          Begin Ascension (Lv. {character.level + 5})
        </button>
      </div>
    </div>
  );
}
