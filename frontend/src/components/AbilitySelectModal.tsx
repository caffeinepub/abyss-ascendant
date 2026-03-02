import React, { useState } from 'react';
import { ABILITIES, Ability } from '../data/abilities';
import { LocalCharacter } from '../types/game';

interface AbilitySelectModalProps {
  character: LocalCharacter;
  onConfirm: (abilities: string[]) => void;
  onClose: () => void;
}

const ARCHETYPE_LABELS: Record<string, string> = {
  melee: '⚔️ Melee',
  ranged: '🏹 Ranged',
  magic: '✨ Magic',
  tank: '🛡️ Tank',
  Warrior: '⚔️ Warrior',
  Mage: '✨ Mage',
  Rogue: '🗡️ Rogue',
  Universal: '🌟 Universal',
};

const ARCHETYPE_COLORS: Record<string, string> = {
  melee: 'text-red-400 border-red-400/30 bg-red-400/5',
  ranged: 'text-green-400 border-green-400/30 bg-green-400/5',
  magic: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  tank: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  Warrior: 'text-red-400 border-red-400/30 bg-red-400/5',
  Mage: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  Rogue: 'text-purple-400 border-purple-400/30 bg-purple-400/5',
  Universal: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
};

export default function AbilitySelectModal({
  character,
  onConfirm,
  onClose,
}: AbilitySelectModalProps) {
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  // Start with the character's current abilities as the working set
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>(character.abilities || []);

  const totalAbilityPoints = character.abilityPoints;
  const usedPoints = selectedAbilities.length;
  const availablePoints = totalAbilityPoints - usedPoints;

  const filteredAbilities = selectedArchetype
    ? ABILITIES.filter((a) => a.archetype === selectedArchetype)
    : ABILITIES;

  function handleToggleAbility(ability: Ability) {
    const isSelected = selectedAbilities.includes(ability.id);
    if (isSelected) {
      setSelectedAbilities(prev => prev.filter(id => id !== ability.id));
    } else {
      if (availablePoints <= 0) return;
      setSelectedAbilities(prev => [...prev, ability.id]);
    }
  }

  function handleConfirm() {
    onConfirm(selectedAbilities);
  }

  const archetypes = [...new Set(ABILITIES.map((a) => a.archetype))];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-surface-1 border border-border rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground font-display">Ability Selection</h2>
            <p className="text-sm text-muted mt-0.5">
              Select up to {totalAbilityPoints} abilities for your character.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Ability Points */}
        <div className="p-4 border-b border-border bg-surface-2/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Ability Slots
            </span>
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full ${
                availablePoints > 0
                  ? 'bg-primary/20 text-primary animate-pulse'
                  : 'bg-surface-2 text-muted'
              }`}
            >
              {usedPoints} / {totalAbilityPoints} used
            </span>
          </div>

          {/* Selected abilities preview */}
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: totalAbilityPoints }).map((_, slotIdx) => {
              const abilityId = selectedAbilities[slotIdx];
              const ability = abilityId ? ABILITIES.find(a => a.id === abilityId) : null;
              return (
                <div
                  key={slotIdx}
                  className={`rounded-lg border p-2 text-center text-xs ${
                    ability
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-dashed border-border/50 bg-surface-2/50'
                  }`}
                >
                  {ability ? (
                    <>
                      <div className="text-xl">{ability.icon}</div>
                      <div className="font-medium text-foreground mt-0.5 truncate">{ability.name}</div>
                      <button
                        onClick={() => handleToggleAbility(ability)}
                        className="text-xs text-red-400 hover:text-red-300 mt-1"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <div className="text-muted py-2">Slot {slotIdx + 1} — Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Archetype Filter */}
        <div className="px-4 pt-3 pb-2 flex gap-2 flex-wrap border-b border-border">
          <button
            onClick={() => setSelectedArchetype(null)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              selectedArchetype === null
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'border-border text-muted hover:text-foreground'
            }`}
          >
            All
          </button>
          {archetypes.map((arch) => (
            <button
              key={arch}
              onClick={() => setSelectedArchetype(arch === selectedArchetype ? null : arch)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                selectedArchetype === arch
                  ? `${ARCHETYPE_COLORS[arch] || 'bg-primary/20 text-primary border-primary/40'}`
                  : 'border-border text-muted hover:text-foreground'
              }`}
            >
              {ARCHETYPE_LABELS[arch] || arch}
            </button>
          ))}
        </div>

        {/* Ability List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredAbilities.map((ability) => {
            const isSelected = selectedAbilities.includes(ability.id);
            const canSelect = availablePoints > 0 || isSelected;

            return (
              <div
                key={ability.id}
                onClick={() => handleToggleAbility(ability)}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary/50 bg-primary/10'
                    : canSelect
                    ? 'border-border hover:border-primary/30 hover:bg-surface-2'
                    : 'border-border opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="text-2xl">{ability.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{ability.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        ARCHETYPE_COLORS[ability.archetype] || 'text-muted border-border'
                      }`}
                    >
                      {ARCHETYPE_LABELS[ability.archetype] || ability.archetype}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{ability.description}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted">
                    <span>⏱ CD: {ability.cooldown}t</span>
                    {ability.damageMultiplier && (
                      <span>⚔ {ability.damageMultiplier}x dmg</span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <span className="text-primary text-xs font-bold shrink-0">✓ Selected</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-2 text-muted hover:text-foreground text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}
