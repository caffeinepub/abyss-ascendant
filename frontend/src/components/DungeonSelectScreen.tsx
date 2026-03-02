import React, { useState } from 'react';
import { LocalCharacter } from '../hooks/useLocalCharacter';
import { GeneratedItem } from '../engine/lootGenerator';
import { ItemCard } from './ItemTooltip';
import { Sword, Zap, Star, Lock, ChevronRight, Gift } from 'lucide-react';

interface DungeonSelectScreenProps {
  character: LocalCharacter;
  onStartDungeon: (mode: 'Catacombs' | 'Depths' | 'AscensionTrial', level: number) => void;
  pendingLoot: GeneratedItem[];
  onClearPendingLoot: () => void;
}

const DUNGEON_MODES: Array<{
  id: 'Catacombs' | 'Depths' | 'AscensionTrial';
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  rewards: string;
  risk: string;
  riskColor: string;
  borderColor: string;
  hoverColor: string;
  requiresLevel: number;
}> = [
  {
    id: 'Catacombs',
    name: 'The Catacombs',
    subtitle: 'Standard Descent',
    icon: Sword,
    description:
      "Steady pace through the ancient burial halls. Full loot rewards, manageable danger. The foundation of every adventurer's journey.",
    rewards: 'Full loot · Standard XP · Safe progression',
    risk: 'Low Risk',
    riskColor: 'text-green-400',
    borderColor: 'border-border',
    hoverColor: 'hover:border-primary/40',
    requiresLevel: 1,
  },
  {
    id: 'Depths',
    name: 'The Depths',
    subtitle: 'High Risk / High Reward',
    icon: Zap,
    description:
      'Faster-paced encounters in the treacherous lower reaches. Surprise ambushes, stronger enemies, but significantly better loot and XP.',
    rewards: 'Bonus loot · +50% XP · Rare drops',
    risk: 'High Risk',
    riskColor: 'text-yellow-400',
    borderColor: 'border-border',
    hoverColor: 'hover:border-yellow-400/40',
    requiresLevel: 5,
  },
  {
    id: 'AscensionTrial',
    name: 'Ascension Trial',
    subtitle: 'Class Tier Unlock',
    icon: Star,
    description:
      'Face the guardian that stands between you and your next class tier. Only the worthy may attempt this trial.',
    rewards: 'Class tier unlock · Legendary loot · Glory',
    risk: 'Extreme Risk',
    riskColor: 'text-amber-400',
    borderColor: 'border-amber-400/30',
    hoverColor: 'hover:border-amber-400/60',
    requiresLevel: 100,
  },
];

export default function DungeonSelectScreen({
  character,
  onStartDungeon,
  pendingLoot,
  onClearPendingLoot,
}: DungeonSelectScreenProps) {
  const [showLootModal, setShowLootModal] = useState(pendingLoot.length > 0);

  const handleClearLoot = () => {
    setShowLootModal(false);
    onClearPendingLoot();
  };

  // XP progress
  const xpForCurrentLevel = (character.level - 1) * 100;
  const xpForNextLevel = character.level * 100;
  const xpProgress = character.xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const xpPercent = Math.min(100, Math.floor((xpProgress / xpNeeded) * 100));

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Choose Your Descent</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Select a dungeon mode and face what lurks below.
            </p>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold text-foreground">{character.name}</div>
            <div className="text-muted-foreground">Level {character.level}</div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Experience</span>
            <span>
              {xpProgress} / {xpNeeded} XP
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dungeon Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DUNGEON_MODES.map(
          ({
            id,
            name,
            subtitle,
            icon: Icon,
            description,
            rewards,
            risk,
            riskColor,
            borderColor,
            hoverColor,
            requiresLevel,
          }) => {
            const isLocked = character.level < requiresLevel;

            return (
              <button
                key={id}
                onClick={() => !isLocked && onStartDungeon(id, character.level)}
                disabled={isLocked}
                className={`bg-card border-2 ${borderColor} ${
                  !isLocked ? hoverColor : ''
                } rounded-xl p-5 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {isLocked ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Icon className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${riskColor}`}>{risk}</span>
                </div>

                <h3 className="font-bold text-base text-foreground mb-0.5">{name}</h3>
                <div className="text-xs text-muted-foreground mb-2">{subtitle}</div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{description}</p>

                <div className="text-xs text-primary/80 mb-2">{rewards}</div>

                {isLocked ? (
                  <div className="text-xs text-muted-foreground">
                    🔒 Requires Level {requiresLevel} (currently {character.level})
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                    Enter <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          }
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Inventory', value: `${character.inventory.length} items`, icon: '🎒' },
          { label: 'Stash', value: `${character.stash.length} items`, icon: '📦' },
          {
            label: 'Abilities',
            value: `${character.equippedAbilityIds.filter(Boolean).length}/3`,
            icon: '⚡',
          },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-sm font-semibold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Loot reward modal */}
      {showLootModal && pendingLoot.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={handleClearLoot} />
          <div className="relative z-10 bg-card border border-amber-400/40 rounded-xl p-6 max-w-md mx-4 w-full">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-amber-400 text-lg">Loot Acquired!</h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pendingLoot.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
            <button
              onClick={handleClearLoot}
              className="w-full py-2 rounded-lg bg-amber-400/20 text-amber-400 hover:bg-amber-400/30 font-semibold text-sm mt-4 transition-all"
            >
              Collect All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
