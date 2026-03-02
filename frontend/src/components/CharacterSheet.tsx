import React, { useState } from 'react';
import { LocalCharacter } from '../hooks/useLocalCharacter';
import { ABILITIES } from '../data/abilities';
import AbilitySelectModal from './AbilitySelectModal';
import { derivePlayerStats, calculatePlayerTicksBetweenAttacks } from '../engine/combatEngine';

interface CharacterSheetProps {
  character: LocalCharacter;
  onApplyStatPoints: (delta: { str?: number; dex?: number; int?: number; vit?: number }) => void;
  onPurchaseAbility: (abilityId: string) => void;
  onEquipAbility: (abilityId: string, slotIndex: number) => void;
  onUnequipAbility: (abilityId: string) => void;
}

export default function CharacterSheet({
  character,
  onApplyStatPoints,
  onPurchaseAbility,
  onEquipAbility,
  onUnequipAbility,
}: CharacterSheetProps) {
  const [showAbilityModal, setShowAbilityModal] = useState(false);

  const { stats, level, xp, realm, equippedAbilityIds, availableAbilityPoints } = character;

  // Derive effective combat stats using the same engine function used in combat
  // This ensures CharacterSheet always matches what combat actually uses
  const effectiveStats = derivePlayerStats({
    str: stats.str,
    dex: stats.dex,
    int: stats.int,
    vit: stats.vit,
    level,
    equippedItems: character.equippedItems,
  });

  const maxHp = effectiveStats.maxHp;
  const physDmg = effectiveStats.attack;
  const defense = effectiveStats.defense;
  const critChance = effectiveStats.critChance;
  const ticksBetweenAttacks = effectiveStats.ticksBetweenAttacks;

  // Magic damage is derived separately (int-based, not in CombatStats directly)
  const magDmg = Math.floor(
    5 + stats.int * 2 +
    (character.equippedItems?.reduce((sum, item) => {
      const magAffix = item.affixes.find((a) => a.stat === 'magDmg');
      const intAffix = item.affixes.find((a) => a.stat === 'int');
      return sum + (magAffix?.value ?? 0) + (intAffix ? intAffix.value * 2 : 0);
    }, 0) ?? 0)
  );

  // XP progress
  const xpForCurrentLevel = (level - 1) * 100;
  const xpForNextLevel = level * 100;
  const xpProgress = xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const xpPercent = Math.min(100, Math.floor((xpProgress / xpNeeded) * 100));

  // Ability points: 1 at creation + 1 per 10 levels
  const totalAbilityPoints = 1 + Math.floor(level / 10);

  const equippedAbilities = equippedAbilityIds
    .filter(Boolean)
    .map((id) => ABILITIES.find((a) => a.id === id))
    .filter(Boolean);

  const realmLabel = realm === 'Hardcore' ? '💀 Hardcore' : '🛡️ Softcore';
  const classTierLabel = `Tier ${character.level >= 100 ? '🔥' : ''}1`;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Character Header */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{character.name}</h2>
            <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
              <span>{realmLabel}</span>
              <span>•</span>
              <span>Class {classTierLabel}</span>
              <span>•</span>
              <span>Level {level}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{level}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Level</div>
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

      {/* Stats */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Attributes
          </h3>
          {character.pendingStatPoints > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold animate-pulse">
              {character.pendingStatPoints} points to spend!
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'str', label: 'Strength', icon: '💪', color: 'text-red-400' },
            { key: 'dex', label: 'Dexterity', icon: '🏃', color: 'text-green-400' },
            { key: 'int', label: 'Intelligence', icon: '🧠', color: 'text-blue-400' },
            { key: 'vit', label: 'Vitality', icon: '❤️', color: 'text-pink-400' },
          ].map(({ key, label, icon, color }) => (
            <div key={key} className="flex items-center gap-2 bg-background rounded-lg p-3">
              <span className="text-lg">{icon}</span>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className={`text-lg font-bold ${color}`}>
                  {stats[key as keyof typeof stats]}
                </div>
              </div>
              {character.pendingStatPoints > 0 && (
                <button
                  onClick={() => onApplyStatPoints({ [key]: 1 })}
                  className="w-6 h-6 rounded bg-primary/20 text-primary hover:bg-primary/30 text-sm font-bold flex items-center justify-center"
                >
                  +
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Combat Stats */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
          Combat Stats
          {character.equippedItems && character.equippedItems.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground normal-case">
              (includes equipped gear)
            </span>
          )}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Max HP', value: maxHp, icon: '❤️' },
            { label: 'Phys Dmg', value: physDmg, icon: '⚔️' },
            { label: 'Magic Dmg', value: magDmg, icon: '✨' },
            { label: 'Defense', value: defense, icon: '🛡️' },
            { label: 'Crit Chance', value: `${critChance.toFixed(1)}%`, icon: '🎯' },
            { label: 'Atk Speed', value: `${ticksBetweenAttacks} ticks`, icon: '⚡' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-background rounded-lg p-3 text-center">
              <div className="text-lg">{icon}</div>
              <div className="text-lg font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Abilities */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Active Abilities
          </h3>
          <div className="flex items-center gap-2">
            {availableAbilityPoints > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold animate-pulse">
                {availableAbilityPoints} pt{availableAbilityPoints !== 1 ? 's' : ''} available
              </span>
            )}
            <button
              onClick={() => setShowAbilityModal(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 font-semibold transition-all"
            >
              Manage
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((slotIdx) => {
            const ability = equippedAbilities[slotIdx];
            return (
              <div
                key={slotIdx}
                className={`rounded-lg border p-3 text-center ${
                  ability
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-dashed border-border/50 bg-background/50'
                }`}
              >
                {ability ? (
                  <>
                    <div className="text-2xl">{ability.icon}</div>
                    <div className="text-xs font-medium text-foreground mt-1 truncate">
                      {ability.name}
                    </div>
                    <div className="text-xs text-muted-foreground">⏱ {ability.cooldown}s</div>
                  </>
                ) : (
                  <div className="text-muted-foreground text-xs py-2">Empty Slot</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ability Points Info */}
        <div className="mt-3 text-xs text-muted-foreground text-center">
          Total ability points: {totalAbilityPoints} (Level {level} • +1 per 10 levels)
        </div>
      </div>

      {/* Ability Modal */}
      {showAbilityModal && (
        <AbilitySelectModal
          character={character}
          onPurchase={onPurchaseAbility}
          onEquip={onEquipAbility}
          onUnequip={onUnequipAbility}
          onClose={() => setShowAbilityModal(false)}
        />
      )}
    </div>
  );
}
