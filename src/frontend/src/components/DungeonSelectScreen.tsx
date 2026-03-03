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
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <div className="mb-1">
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">
          Enter the Abyss
        </h2>
        <p className="text-muted-foreground text-sm">
          Choose your challenge. The deeper you descend, the greater the reward.
        </p>
      </div>

      {/* Pending loot notification */}
      {showLootModal && pendingLoot.length > 0 && (
        <div className="bg-dungeon-gold/5 border border-dungeon-gold/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-dungeon-gold" />
              <span className="font-semibold text-dungeon-gold text-sm">
                {pendingLoot.length} item{pendingLoot.length !== 1 ? "s" : ""}{" "}
                acquired!
              </span>
            </div>
            <button
              type="button"
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
          <button
            type="button"
            onClick={handleClearLoot}
            className="mt-3 w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
          >
            Dismiss all
          </button>
        </div>
      )}

      {/* HP Warning */}
      {currentHp < maxHp * 0.3 && (
        <div className="flex items-center gap-2 bg-health-low/10 border border-health-low/30 rounded-lg px-4 py-2 text-health-low text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Low HP — consider resting before entering the dungeon.</span>
        </div>
      )}

      {/* ── Dungeon Card ──────────────────────────────────────────── */}
      <div className="panel-ember rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-ember/10 border border-ember/20 flex items-center justify-center flex-shrink-0">
            <Sword className="w-5 h-5 text-ember" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              The Catacombs
            </h3>
            <p className="text-xs text-muted-foreground">
              Standard dungeon run — fight monsters, earn XP and loot
            </p>
          </div>
        </div>

        {/* Monster Level Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="monster-level-input"
              className="text-sm font-medium text-foreground"
            >
              Monster Level
            </label>
            <input
              id="monster-level-input"
              type="number"
              min={minLevel}
              max={maxLevel}
              value={inputValue}
              onChange={handleLevelChange}
              onBlur={handleLevelBlur}
              data-ocid="dungeon.level.input"
              className="w-16 text-center bg-surface-2 border border-border/50 rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <input
            type="range"
            min={minLevel}
            max={maxLevel}
            value={monsterLevel}
            onChange={handleSliderChange}
            className="w-full accent-primary h-1.5 rounded-full"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground/60">
            <span>Lv. {minLevel}</span>
            <span>Lv. {maxLevel}</span>
          </div>

          {levelError && (
            <div className="flex items-center gap-2 text-health-low text-xs bg-health-low/10 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>{levelError}</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2 border border-border/30">
            <Zap className="w-3.5 h-3.5 text-dungeon-gold" />
            <span className={xpInfo.color}>{xpInfo.label}</span>
          </div>
          <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2 border border-border/30">
            <Gift className="w-3.5 h-3.5 text-rarity-rare" />
            <span className="text-muted-foreground">
              {dropRatePercent}% drop rate
            </span>
          </div>
        </div>

        <button
          type="button"
          data-ocid="dungeon.enter.primary_button"
          onClick={handleStartCombat}
          disabled={!canStartCombat}
          className="w-full py-3 rounded-lg font-display font-semibold text-sm tracking-wide transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "oklch(0.65 0.17 38)",
            color: "oklch(0.08 0.01 38)",
          }}
        >
          Enter the Dungeon
        </button>
      </div>

      {/* ── Ascension Trial ───────────────────────────────────────── */}
      <div className="panel-gold rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-dungeon-gold/10 border border-dungeon-gold/20 flex items-center justify-center flex-shrink-0">
            <Flame className="w-5 h-5 text-dungeon-gold" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Ascension Trial
            </h3>
            <p className="text-xs text-muted-foreground">
              Face monsters 5 levels above you — high risk, high reward
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2 border border-border/30">
            <Zap className="w-3.5 h-3.5 text-dungeon-gold" />
            <span className="text-dungeon-gold">Bonus XP (+50%)</span>
          </div>
          <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2 border border-border/30">
            <Gift className="w-3.5 h-3.5 text-rarity-rare" />
            <span className="text-muted-foreground">6% drop rate</span>
          </div>
        </div>

        <button
          type="button"
          data-ocid="dungeon.ascension.primary_button"
          onClick={handleStartAscension}
          className="w-full py-2.5 rounded-lg font-display font-semibold text-sm tracking-wide transition-all text-background hover:opacity-90"
          style={{ background: "oklch(0.72 0.14 72)" }}
        >
          Begin Ascension (Lv. {character.level + 5})
        </button>
      </div>
    </div>
  );
}
