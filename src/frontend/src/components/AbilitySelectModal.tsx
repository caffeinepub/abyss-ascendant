import { ChevronRight, X, Zap } from "lucide-react";
import React, { useState } from "react";
import { ABILITIES, type Ability } from "../data/abilities";
import {
  type LocalCharacter,
  calculateAvailableAbilityPoints,
} from "../types/game";

interface AbilitySelectModalProps {
  character: LocalCharacter;
  onClose: () => void;
  onConfirm: (selectedAbilities: string[]) => void;
}

const MAX_EQUIPPED = 3;

export default function AbilitySelectModal({
  character,
  onClose,
  onConfirm,
}: AbilitySelectModalProps) {
  // Filter class abilities for this character
  const classAbilities = ABILITIES.filter(
    (a) => !a.classRestriction || a.classRestriction === character.class,
  );

  // Initialize selectedAbilities only from abilities that are valid for this character's class
  // This prevents stale cross-class abilities from consuming ability points
  const validEquipped = character.equippedAbilities.filter((name) =>
    classAbilities.some((a) => a.name === name),
  );

  const [selectedAbilities, setSelectedAbilities] = useState<string[]>(
    validEquipped.slice(0, MAX_EQUIPPED),
  );

  const totalAbilityPoints = Math.min(
    calculateAvailableAbilityPoints(character.level),
    MAX_EQUIPPED,
  );
  const usedPoints = selectedAbilities.length;
  const availablePoints = totalAbilityPoints - usedPoints;

  const handleToggleAbility = (abilityName: string) => {
    const isSelected = selectedAbilities.includes(abilityName);

    if (isSelected) {
      // Deselect
      setSelectedAbilities((prev) => prev.filter((a) => a !== abilityName));
    } else {
      // Select: if at cap, replace the last slot
      if (availablePoints <= 0) {
        setSelectedAbilities((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = abilityName;
          return updated;
        });
      } else {
        setSelectedAbilities((prev) => [...prev, abilityName]);
      }
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedAbilities);
  };

  const getAbilityByName = (name: string): Ability | undefined =>
    ABILITIES.find((a) => a.name === name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface-1 border border-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">
              Ability Selection
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Choose abilities for {character.name} ({character.class})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Points info */}
        <div className="px-4 py-3 bg-surface-2 border-b border-border flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm text-foreground">
              <span className="font-bold text-accent">{availablePoints}</span>{" "}
              ability point{availablePoints !== 1 ? "s" : ""} available
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {usedPoints} / {totalAbilityPoints} slots used
          </div>
          <div className="text-xs text-muted-foreground ml-auto">
            12.5% trigger chance per round
          </div>
        </div>

        {/* Equipped slots preview */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
            Equipped Abilities
          </p>
          <div className="flex gap-2">
            {(["slot-0", "slot-1", "slot-2"] as const)
              .slice(0, MAX_EQUIPPED)
              .map((slotId, i) => {
                const abilityName = selectedAbilities[i];
                const ability = abilityName
                  ? getAbilityByName(abilityName)
                  : undefined;
                return (
                  <div
                    key={slotId}
                    className={`flex-1 rounded border p-2 min-h-[48px] flex items-center gap-2 transition-colors ${
                      ability
                        ? "border-accent/50 bg-accent/10"
                        : "border-border/50 bg-surface-2 border-dashed"
                    }`}
                  >
                    {ability ? (
                      <>
                        <span className="text-accent text-lg">
                          {ability.icon}
                        </span>
                        <span className="text-xs text-foreground font-medium truncate">
                          {ability.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 mx-auto">
                        Empty
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Ability list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {classAbilities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No abilities available for this class.
            </p>
          ) : (
            classAbilities.map((ability) => {
              const isSelected = selectedAbilities.includes(ability.name);
              // An ability is interactable if: it's already selected (can deselect), OR there are available points
              const canInteract = isSelected || availablePoints > 0;

              return (
                <button
                  type="button"
                  key={ability.name}
                  onClick={() => handleToggleAbility(ability.name)}
                  disabled={!canInteract}
                  className={`w-full text-left rounded-lg border p-3 transition-all ${
                    isSelected
                      ? "border-accent bg-accent/15 shadow-sm shadow-accent/20"
                      : canInteract
                        ? "border-border hover:border-accent/50 hover:bg-surface-2 cursor-pointer"
                        : "border-border/30 bg-surface-2/50 opacity-40 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 p-1.5 rounded text-lg ${
                        isSelected ? "bg-accent/20" : "bg-surface-2"
                      }`}
                    >
                      {ability.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-semibold text-sm ${
                            isSelected ? "text-accent" : "text-foreground"
                          }`}
                        >
                          {ability.name}
                        </span>
                        {isSelected && (
                          <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
                            Equipped
                          </span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground capitalize">
                          {ability.damageType} · {ability.effectType}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {ability.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-orange-400">
                          {(ability.damageMultiplier * 100).toFixed(0)}% damage
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Scales: {ability.scalingStat.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          CD: {ability.cooldown}s
                        </span>
                      </div>
                    </div>
                    {canInteract && !isSelected && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 mt-1 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2 rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm font-semibold"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}
