import React from 'react';
import { LocalCharacter } from '../types/game';
import { ABILITIES } from '../data/abilities';
import { PLAYER_TICKS_BETWEEN_ATTACKS } from '../engine/combatEngine';
import HealthBar from './HealthBar';
import XPBar from './XPBar';

interface CharacterSheetProps {
  character: LocalCharacter | null;
  onOpenAbilityModal?: () => void;
  onOpenLevelUpModal?: () => void;
}

const STAT_LABELS: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  int: 'Intelligence',
  vit: 'Vitality',
};

export default function CharacterSheet({ character, onOpenAbilityModal, onOpenLevelUpModal }: CharacterSheetProps) {
  if (!character) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground font-display">No character selected.</p>
      </div>
    );
  }

  const equippedAbilities = character.equippedAbilities ?? [];
  const abilities = equippedAbilities
    .map(id => ABILITIES.find(a => a.id === id))
    .filter(Boolean) as typeof ABILITIES;

  const realmLabel = character.realm === 'Hardcore' ? '⚔️ Hardcore' : '🛡️ Softcore';
  const statusLabel = character.status === 'Dead' ? '💀 Dead' : '✅ Alive';

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-surface-1 rounded-lg p-6 border border-border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">{character.name}</h1>
            <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
              <span>{realmLabel}</span>
              <span>•</span>
              <span>Season {character.season}</span>
              <span>•</span>
              <span>{statusLabel}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-display font-bold text-accent">Lv. {character.level}</div>
          </div>
        </div>

        <div className="space-y-2">
          <HealthBar
            currentHP={character.stats.currentHp}
            maxHP={character.stats.maxHp}
          />
          <XPBar level={character.level} xp={character.xp} />
        </div>
      </div>

      {/* Base Stats */}
      <div className="bg-surface-1 rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-foreground">Base Stats</h2>
          {character.pendingStatPoints > 0 && (
            <button
              onClick={onOpenLevelUpModal}
              className="px-3 py-1 bg-accent text-accent-foreground rounded text-sm font-display font-semibold hover:bg-accent/90 transition-colors animate-pulse"
            >
              +{character.pendingStatPoints} Points Available
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(character.baseStats).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center bg-surface-2 rounded px-3 py-2">
              <span className="text-muted-foreground text-sm">{STAT_LABELS[key] ?? key}</span>
              <span className="font-display font-bold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Combat Stats */}
      <div className="bg-surface-1 rounded-lg p-6 border border-border">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Combat Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Max HP', value: character.stats.maxHp },
            { label: 'Attack', value: character.stats.attack },
            { label: 'Defense', value: character.stats.defense },
            { label: 'Crit Chance', value: `${character.stats.critChance}%` },
            { label: 'Crit Power', value: `${character.stats.critPower}%` },
            { label: 'Ticks Between Attacks', value: PLAYER_TICKS_BETWEEN_ATTACKS },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center bg-surface-2 rounded px-3 py-2">
              <span className="text-muted-foreground text-sm">{label}</span>
              <span className="font-display font-bold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Equipped Items */}
      {character.equippedItems && character.equippedItems.length > 0 && (
        <div className="bg-surface-1 rounded-lg p-6 border border-border">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Equipped Items</h2>
          <div className="space-y-2">
            {character.equippedItems.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-surface-2 rounded px-3 py-2">
                <span className="text-foreground text-sm">{item.name}</span>
                <span className="text-muted-foreground text-xs capitalize">{item.itemType}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abilities */}
      <div className="bg-surface-1 rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-foreground">Abilities</h2>
          <button
            onClick={onOpenAbilityModal}
            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm font-display hover:bg-primary/90 transition-colors"
          >
            Manage
          </button>
        </div>
        {abilities.length === 0 ? (
          <p className="text-muted-foreground text-sm">No abilities equipped. Click Manage to add abilities.</p>
        ) : (
          <div className="space-y-2">
            {abilities.map(ability => (
              <div key={ability.id} className="flex items-start gap-3 bg-surface-2 rounded px-3 py-2">
                <img
                  src="/assets/generated/ability-icon-placeholder.dim_64x64.png"
                  alt={ability.name}
                  className="w-8 h-8 rounded object-cover shrink-0"
                />
                <div>
                  <div className="font-display font-semibold text-sm text-foreground">{ability.name}</div>
                  <div className="text-xs text-muted-foreground">{ability.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
