import React, { useState } from 'react';
import { ABILITIES, Ability } from '../data/abilities';
import { LocalCharacter } from '../hooks/useLocalCharacter';

interface AbilitySelectModalProps {
  character: LocalCharacter;
  onPurchase: (abilityId: string) => void;
  onEquip: (abilityId: string, slotIndex: number) => void;
  onUnequip: (abilityId: string) => void;
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
  onPurchase,
  onEquip,
  onUnequip,
  onClose,
}: AbilitySelectModalProps) {
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [pendingEquipAbilityId, setPendingEquipAbilityId] = useState<string | null>(null);

  // Use the correct field names from the updated LocalCharacter
  const equippedIds = (character.equippedAbilityIds ?? []).filter(Boolean);
  const ownedIds = character.ownedAbilityIds ?? [];
  const availablePoints = character.availableAbilityPoints ?? 0;

  const filteredAbilities = selectedArchetype
    ? ABILITIES.filter((a) => a.archetype === selectedArchetype)
    : ABILITIES;

  function handlePurchase(ability: Ability) {
    if (availablePoints <= 0) return;
    if (ownedIds.includes(ability.id)) return;
    onPurchase(ability.id);
  }

  function handleEquipClick(abilityId: string) {
    if (equippedIds.includes(abilityId)) {
      onUnequip(abilityId);
      setPendingEquipAbilityId(null);
    } else if (equippedIds.length < 3) {
      onEquip(abilityId, equippedIds.length);
      setPendingEquipAbilityId(null);
    } else {
      setPendingEquipAbilityId(abilityId);
    }
  }

  function handleSlotReplace(slotIndex: number) {
    if (!pendingEquipAbilityId) return;
    onEquip(pendingEquipAbilityId, slotIndex);
    setPendingEquipAbilityId(null);
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
              Own abilities and equip up to 3 in your active slots.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Ability Points & Equipped Slots */}
        <div className="p-4 border-b border-border bg-surface-2/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Ability Points
            </span>
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full ${
                availablePoints > 0
                  ? 'bg-primary/20 text-primary animate-pulse'
                  : 'bg-surface-2 text-muted'
              }`}
            >
              {availablePoints} available
            </span>
          </div>

          {/* Equipped Slots */}
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((slotIdx) => {
              const equippedId = equippedIds[slotIdx];
              const equippedAbility = equippedId
                ? ABILITIES.find((a) => a.id === equippedId)
                : null;

              return (
                <div
                  key={slotIdx}
                  className={`rounded-lg border p-2 text-center text-xs ${
                    equippedAbility
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-dashed border-border/50 bg-surface-2/50'
                  }`}
                >
                  {equippedAbility ? (
                    <>
                      <div className="text-xl">{equippedAbility.icon}</div>
                      <div className="font-medium text-foreground mt-0.5 truncate">
                        {equippedAbility.name}
                      </div>
                      <div className="text-muted">⏱ {equippedAbility.cooldown}s</div>
                    </>
                  ) : (
                    <div className="text-muted py-2">Slot {slotIdx + 1} — Empty</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Slot replace prompt */}
          {pendingEquipAbilityId && (
            <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-xs text-amber-400 mb-2 font-semibold">
                All slots full — choose a slot to replace:
              </p>
              <div className="flex gap-2">
                {equippedIds.map((id, idx) => {
                  const ab = ABILITIES.find((a) => a.id === id);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSlotReplace(idx)}
                      className="flex-1 text-xs py-1.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-semibold transition-all"
                    >
                      Replace {ab?.name ?? `Slot ${idx + 1}`}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPendingEquipAbilityId(null)}
                  className="px-3 text-xs py-1.5 rounded bg-surface-2 text-muted hover:bg-surface-2/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Archetype Filter */}
        <div className="p-3 border-b border-border flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedArchetype(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              !selectedArchetype
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-2 text-muted hover:text-foreground'
            }`}
          >
            All
          </button>
          {archetypes.map((arch) => (
            <button
              key={arch}
              onClick={() => setSelectedArchetype(arch === selectedArchetype ? null : arch)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                selectedArchetype === arch
                  ? ARCHETYPE_COLORS[arch] ?? 'bg-primary text-primary-foreground'
                  : 'bg-surface-2 text-muted hover:text-foreground border-transparent'
              }`}
            >
              {ARCHETYPE_LABELS[arch] ?? arch}
            </button>
          ))}
        </div>

        {/* Ability List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredAbilities.map((ability) => {
            const isOwned = ownedIds.includes(ability.id);
            const isEquipped = equippedIds.includes(ability.id);
            const archetypeColor = ARCHETYPE_COLORS[ability.archetype] ?? '';

            return (
              <div
                key={ability.id}
                className={`rounded-lg border p-3 transition-all ${
                  isEquipped
                    ? 'border-primary/50 bg-primary/5'
                    : isOwned
                    ? 'border-border bg-surface-2'
                    : 'border-border/50 bg-surface-2/50 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{ability.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{ability.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${archetypeColor}`}>
                        {ARCHETYPE_LABELS[ability.archetype] ?? ability.archetype}
                      </span>
                      {isEquipped && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                          Equipped
                        </span>
                      )}
                      {isOwned && !isEquipped && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          Owned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{ability.description}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted">
                      <span>⏱ {ability.cooldown}s</span>
                      <span>📊 {ability.statScaling.toUpperCase()} scaling</span>
                      <span>×{ability.damageMultiplier} {ability.damageType} dmg</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {!isOwned && (
                      <button
                        onClick={() => handlePurchase(ability)}
                        disabled={availablePoints <= 0}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Learn (1pt)
                      </button>
                    )}
                    {isOwned && (
                      <button
                        onClick={() => handleEquipClick(ability.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          isEquipped
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                      >
                        {isEquipped ? 'Unequip' : 'Equip'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
