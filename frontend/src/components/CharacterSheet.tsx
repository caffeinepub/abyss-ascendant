import React, { useState } from 'react';
import { LocalCharacter } from '../hooks/useLocalCharacter';
import { ABILITIES } from '../data/abilities';
import AbilitySelectModal from './AbilitySelectModal';
import LevelUpModal from './LevelUpModal';
import { derivePlayerStats, PLAYER_BASE_TICKS_BETWEEN_ATTACKS } from '../engine/combatEngine';

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
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  const { stats, level, xp, realm, equippedAbilityIds, availableAbilityPoints } = character;

  const effectiveStats = derivePlayerStats(character);

  const maxHp = effectiveStats.maxHp;
  const physDmg = effectiveStats.physicalDamage;
  const magDmg = effectiveStats.magicDamage;
  const defense = effectiveStats.defense;
  const critChance = effectiveStats.critChance;
  const ticksBetweenAttacks = PLAYER_BASE_TICKS_BETWEEN_ATTACKS;

  const xpForCurrentLevel = (level - 1) * 100;
  const xpForNextLevel = level * 100;
  const xpProgress = xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const xpPercent = Math.min(100, Math.floor((xpProgress / xpNeeded) * 100));

  const totalAbilityPoints = 1 + Math.floor(level / 10);

  const equippedAbilities = equippedAbilityIds
    .filter(Boolean)
    .map((id) => ABILITIES.find((a) => a.id === id))
    .filter(Boolean);

  const abilityCount = equippedAbilities.length;
  const attackChance = Math.round((1 - abilityCount * 0.125) * 100);

  const realmLabel = realm === 'Hardcore' ? '💀 Hardcore' : '🛡️ Softcore';
  const classTierLabel = `Tier ${character.classTier ?? 1}`;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Character Header */}
      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground font-display">{character.name}</h2>
            <div className="flex gap-3 mt-1 text-sm text-muted">
              <span>{realmLabel}</span>
              <span>•</span>
              <span>Class {classTierLabel}</span>
              <span>•</span>
              <span>Level {level}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{level}</div>
            <div className="text-xs text-muted uppercase tracking-wider">Level</div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>Experience</span>
            <span>
              {xpProgress} / {xpNeeded} XP
            </span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Attributes
          </h3>
          {character.pendingStatPoints > 0 && (
            <button
              onClick={() => setShowLevelUpModal(true)}
              className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold animate-pulse hover:bg-amber-500/30 transition-all"
            >
              {character.pendingStatPoints} points to spend!
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'str' as const, label: 'Strength', icon: '💪', color: 'text-red-400' },
            { key: 'dex' as const, label: 'Dexterity', icon: '🏃', color: 'text-green-400' },
            { key: 'int' as const, label: 'Intelligence', icon: '🧠', color: 'text-blue-400' },
            { key: 'vit' as const, label: 'Vitality', icon: '❤️', color: 'text-pink-400' },
          ].map(({ key, label, icon, color }) => (
            <div key={key} className="flex items-center gap-2 bg-surface-2 rounded-lg p-3">
              <span className="text-lg">{icon}</span>
              <div className="flex-1">
                <div className="text-xs text-muted">{label}</div>
                <div className={`text-lg font-bold ${color}`}>
                  {stats[key]}
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
      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
          Combat Stats
          {character.equippedItems && character.equippedItems.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted normal-case">
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
            { label: 'Crit Chance', value: `${(critChance * 100).toFixed(1)}%`, icon: '🎯' },
            { label: 'Atk Speed (ticks)', value: ticksBetweenAttacks, icon: '⚡' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-surface-2 rounded-lg p-3 text-center">
              <div className="text-lg">{icon}</div>
              <div className="text-lg font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Attack Cycle Info */}
      {abilityCount > 0 && (
        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
            Attack Cycle
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted">Normal Attack</span>
              <span className="font-bold text-primary">{attackChance}%</span>
            </div>
            {equippedAbilities.map((ability) =>
              ability ? (
                <div key={ability.id} className="flex justify-between items-center">
                  <span className="text-muted">
                    {ability.icon} {ability.name}
                  </span>
                  <span className="font-bold text-purple-400">12.5%</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Abilities */}
      <div className="bg-surface-1 border border-border rounded-xl p-5">
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
            <span className="text-xs text-muted">
              {totalAbilityPoints} total pts
            </span>
            <button
              onClick={() => setShowAbilityModal(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 font-semibold transition-all"
            >
              Manage
            </button>
          </div>
        </div>

        {equippedAbilities.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">
            No abilities equipped. Click Manage to learn and equip abilities.
          </p>
        ) : (
          <div className="space-y-2">
            {equippedAbilities.map((ability) =>
              ability ? (
                <div
                  key={ability.id}
                  className="flex items-center gap-3 bg-surface-2 rounded-lg p-3"
                >
                  <span className="text-xl">{ability.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{ability.name}</div>
                    <div className="text-xs text-muted">{ability.description}</div>
                  </div>
                  <span className="text-xs text-purple-400 font-bold">12.5%</span>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>

      {showAbilityModal && (
        <AbilitySelectModal
          character={character}
          onPurchase={onPurchaseAbility}
          onEquip={onEquipAbility}
          onUnequip={onUnequipAbility}
          onClose={() => setShowAbilityModal(false)}
        />
      )}

      {showLevelUpModal && character.pendingStatPoints > 0 && (
        <LevelUpModal
          character={character}
          onAllocate={(stat, amount) => onApplyStatPoints({ [stat]: amount })}
          onClose={() => setShowLevelUpModal(false)}
        />
      )}
    </div>
  );
}
