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
};

const ARCHETYPE_COLORS: Record<string, string> = {
  melee: 'text-red-400 border-red-400/30 bg-red-400/5',
  ranged: 'text-green-400 border-green-400/30 bg-green-400/5',
  magic: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  tank: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
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

  const equippedIds = character.equippedAbilityIds.filter(Boolean);
  const ownedIds = character.ownedAbilityIds;
  const availablePoints = character.availableAbilityPoints;

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
      // Already equipped — unequip it
      onUnequip(abilityId);
      setPendingEquipAbilityId(null);
    } else if (equippedIds.length < 3) {
      // Free slot available — equip directly
      onEquip(abilityId, equippedIds.length);
      setPendingEquipAbilityId(null);
    } else {
      // All 3 slots full — ask which slot to replace
      setPendingEquipAbilityId(abilityId);
    }
  }

  function handleSlotReplace(slotIndex: number) {
    if (!pendingEquipAbilityId) return;
    onEquip(pendingEquipAbilityId, slotIndex);
    setPendingEquipAbilityId(null);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Ability Selection</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Own abilities and equip up to 3 in your active slots.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Ability Points & Equipped Slots */}
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Ability Points
            </span>
            <span
              className={`text-lg font-bold px-3 py-0.5 rounded-full ${
                availablePoints > 0
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
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
              const isReplaceTarget = pendingEquipAbilityId !== null;

              return (
                <div
                  key={slotIdx}
                  onClick={() => isReplaceTarget && handleSlotReplace(slotIdx)}
                  className={`rounded-lg border p-2 text-center transition-all ${
                    isReplaceTarget
                      ? 'border-primary/60 bg-primary/10 cursor-pointer hover:bg-primary/20'
                      : equippedAbility
                      ? 'border-border bg-background'
                      : 'border-dashed border-border/50 bg-background/50'
                  }`}
                >
                  {equippedAbility ? (
                    <>
                      <div className="text-xl">{equippedAbility.icon}</div>
                      <div className="text-xs font-medium text-foreground truncate">
                        {equippedAbility.name}
                      </div>
                      {isReplaceTarget && (
                        <div className="text-xs text-primary mt-0.5">Click to replace</div>
                      )}
                    </>
                  ) : (
                    <div className="text-muted-foreground text-xs py-1">
                      {isReplaceTarget ? 'Click to place here' : `Slot ${slotIdx + 1} — Empty`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {pendingEquipAbilityId && (
            <p className="text-xs text-primary mt-2 text-center animate-pulse">
              ⬆️ Select a slot above to replace with{' '}
              {ABILITIES.find((a) => a.id === pendingEquipAbilityId)?.name}
            </p>
          )}
        </div>

        {/* Archetype Filter */}
        <div className="flex gap-2 p-4 border-b border-border overflow-x-auto">
          <button
            onClick={() => setSelectedArchetype(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedArchetype === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
          {Object.entries(ARCHETYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedArchetype(selectedArchetype === key ? null : key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedArchetype === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Ability List */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredAbilities.map((ability) => {
            const isOwned = ownedIds.includes(ability.id);
            const isEquipped = equippedIds.includes(ability.id);
            const canPurchase = !isOwned && availablePoints > 0;
            const archetypeClass = ARCHETYPE_COLORS[ability.archetype] ?? '';

            return (
              <div
                key={ability.id}
                className={`rounded-lg border p-3 transition-all ${
                  isEquipped
                    ? 'border-primary/60 bg-primary/5'
                    : isOwned
                    ? 'border-border bg-background'
                    : 'border-border/50 bg-background/50 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{ability.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground text-sm">{ability.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${archetypeClass}`}
                      >
                        {ARCHETYPE_LABELS[ability.archetype]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ability.description}</p>
                    <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>⏱ {ability.cooldown}s</span>
                      <span>📊 {ability.statScaling.toUpperCase()} scaling</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  {!isOwned ? (
                    <button
                      onClick={() => handlePurchase(ability)}
                      disabled={!canPurchase}
                      className="flex-1 py-1.5 rounded text-xs font-semibold bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {availablePoints <= 0 ? 'No Points' : 'Learn (1 pt)'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEquipClick(ability.id)}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                        isEquipped
                          ? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {isEquipped ? 'Unequip' : equippedIds.length >= 3 ? 'Replace Slot' : 'Equip'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-semibold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
