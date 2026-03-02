import { Heart, Loader2, Plus, Shield, Star, Sword, Zap } from "lucide-react";
import React, { useState } from "react";
import type { Ability as BackendAbility } from "../backend";
import { ABILITIES } from "../data/abilities";
import {
  useEquipAbilities,
  useSpendStatPoints,
  useUpdateStats,
} from "../hooks/useQueries";
import {
  type BaseStats,
  type LocalCharacter,
  calculateAvailableAbilityPoints,
  calculateUnspentStatPoints,
} from "../types/game";
import AbilitySelectModal from "./AbilitySelectModal";
import LevelUpModal from "./LevelUpModal";

interface CharacterSheetProps {
  character: LocalCharacter;
  onUpdateBaseStats: (newBaseStats: BaseStats, newTotalSpent: number) => void;
  onUpdateEquippedAbilities: (abilities: string[]) => void;
}

export default function CharacterSheet({
  character,
  onUpdateBaseStats,
  onUpdateEquippedAbilities,
}: CharacterSheetProps) {
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showAbilityModal, setShowAbilityModal] = useState(false);

  const updateStatsMutation = useUpdateStats();
  const spendStatPointsMutation = useSpendStatPoints();
  const equipAbilitiesMutation = useEquipAbilities();

  const unspentStatPoints = calculateUnspentStatPoints(
    character.totalStatPointsEarned,
    character.totalStatPointsSpent,
  );
  const availableAbilityPoints = calculateAvailableAbilityPoints(
    character.level,
  );

  const handleLevelUpConfirm = async (statsUpdate: {
    strIncrease: number;
    dexIncrease: number;
    intIncrease: number;
    vitIncrease: number;
    newTotalSpent: number;
  }) => {
    try {
      // 1. Update stats on backend (increments baseStats)
      await updateStatsMutation.mutateAsync({
        characterId: character.id,
        statsUpdate: {
          strIncrease: BigInt(statsUpdate.strIncrease),
          dexIncrease: BigInt(statsUpdate.dexIncrease),
          intIncrease: BigInt(statsUpdate.intIncrease),
          vitIncrease: BigInt(statsUpdate.vitIncrease),
        },
      });

      // 2. Record total spent points on backend
      await spendStatPointsMutation.mutateAsync({
        characterId: character.id,
        pointsSpent: BigInt(statsUpdate.newTotalSpent),
      });

      // 3. Update local state immediately so UI reflects changes without waiting for re-fetch
      const newBaseStats: BaseStats = {
        str: character.baseStats.str + statsUpdate.strIncrease,
        dex: character.baseStats.dex + statsUpdate.dexIncrease,
        int: character.baseStats.int + statsUpdate.intIncrease,
        vit: character.baseStats.vit + statsUpdate.vitIncrease,
      };
      onUpdateBaseStats(newBaseStats, statsUpdate.newTotalSpent);
      setShowLevelUpModal(false);
    } catch (err) {
      console.error("Failed to update stats:", err);
    }
  };

  const handleAbilityConfirm = async (selectedAbilityNames: string[]) => {
    try {
      // Convert ability names to backend Ability objects
      const abilityObjects: BackendAbility[] = selectedAbilityNames
        .map((name) => {
          const found = ABILITIES.find((a) => a.name === name);
          if (!found) return null;
          return {
            name: found.name,
            description: found.description,
            type: found.effectType,
            element: found.damageType,
            power: BigInt(Math.round(found.damageMultiplier * 100)),
          } as BackendAbility;
        })
        .filter((a): a is BackendAbility => a !== null);

      await equipAbilitiesMutation.mutateAsync({
        characterId: character.id,
        abilities: abilityObjects,
      });

      onUpdateEquippedAbilities(selectedAbilityNames);
      setShowAbilityModal(false);
    } catch (err) {
      console.error("Failed to equip abilities:", err);
      // Still update locally even if backend fails
      onUpdateEquippedAbilities(selectedAbilityNames);
      setShowAbilityModal(false);
    }
  };

  const statRows = [
    {
      label: "STR",
      value: character.stats.str,
      icon: <Sword className="w-4 h-4" />,
      color: "text-orange-400",
    },
    {
      label: "DEX",
      value: character.stats.dex,
      icon: <Zap className="w-4 h-4" />,
      color: "text-green-400",
    },
    {
      label: "INT",
      value: character.stats.int,
      icon: <Star className="w-4 h-4" />,
      color: "text-blue-400",
    },
    {
      label: "VIT",
      value: character.stats.vit,
      icon: <Heart className="w-4 h-4" />,
      color: "text-red-400",
    },
  ];

  const equippedAbilityObjects = character.equippedAbilities
    .map((name) => ABILITIES.find((a) => a.name === name))
    .filter(Boolean);

  const isSaving =
    updateStatsMutation.isPending ||
    spendStatPointsMutation.isPending ||
    equipAbilitiesMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Character header */}
      <div className="bg-surface-1 rounded-lg border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/50 bg-surface-2 flex-shrink-0">
            {character.class === "Warrior" && (
              <img
                src="/assets/generated/class-warrior.dim_256x256.png"
                alt="Warrior"
                className="w-full h-full object-cover"
              />
            )}
            {character.class === "Rogue" && (
              <img
                src="/assets/generated/class-rogue.dim_256x256.png"
                alt="Rogue"
                className="w-full h-full object-cover"
              />
            )}
            {character.class === "Mage" && (
              <img
                src="/assets/generated/class-mage.dim_256x256.png"
                alt="Mage"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">
              {character.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Level {character.level} {character.class}
            </p>
          </div>
          {isSaving && (
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-surface-1 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Base Stats
          </h3>
          {unspentStatPoints > 0 && (
            <button
              type="button"
              onClick={() => setShowLevelUpModal(true)}
              className="flex items-center gap-1 text-xs bg-accent/20 text-accent border border-accent/30 px-2 py-1 rounded hover:bg-accent/30 transition-colors"
            >
              <Plus className="w-3 h-3" />
              {unspentStatPoints} point{unspentStatPoints !== 1 ? "s" : ""} to
              spend
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {statRows.map(({ label, value, icon, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-surface-2 rounded p-2"
            >
              <span className={color}>{icon}</span>
              <span className="text-xs text-muted-foreground w-8">{label}</span>
              <span className="font-bold text-foreground ml-auto">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>Max HP</span>
          <span className="font-bold text-foreground">
            {character.stats.maxHp}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Stat points</span>
          <span>
            {character.totalStatPointsSpent} spent ·{" "}
            <span
              className={unspentStatPoints > 0 ? "text-accent font-medium" : ""}
            >
              {unspentStatPoints} available
            </span>
          </span>
        </div>
      </div>

      {/* Abilities */}
      <div className="bg-surface-1 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Abilities
          </h3>
          <button
            type="button"
            onClick={() => setShowAbilityModal(true)}
            className="flex items-center gap-1 text-xs bg-surface-2 text-muted-foreground border border-border px-2 py-1 rounded hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Zap className="w-3 h-3" />
            {equippedAbilityObjects.length > 0 ? "Manage" : "Unlock"}
          </button>
        </div>

        <div className="space-y-2">
          {(["slot-1", "slot-2", "slot-3"] as const).map((slotId, i) => {
            const ability = equippedAbilityObjects[i];
            return (
              <div
                key={slotId}
                className={`flex items-center gap-2 rounded p-2 border ${
                  ability
                    ? "bg-surface-2 border-accent/20"
                    : "bg-surface-2/30 border-border/30 border-dashed"
                }`}
              >
                {ability ? (
                  <>
                    <Zap className="w-4 h-4 text-accent flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {ability.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {ability.description}
                      </div>
                    </div>
                    <div className="text-xs text-orange-400 flex-shrink-0">
                      {(ability.damageMultiplier * 100).toFixed(0)}%
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground/40 mx-auto">
                    {availableAbilityPoints > i
                      ? "— Available slot —"
                      : "— Locked —"}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {availableAbilityPoints} ability slot
          {availableAbilityPoints !== 1 ? "s" : ""} unlocked · 12.5% trigger
          chance
        </p>
      </div>

      {/* Equipment summary */}
      <div className="bg-surface-1 rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
          Equipment
        </h3>
        {character.equippedItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">No items equipped.</p>
        ) : (
          <div className="space-y-1">
            {character.equippedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-xs">
                <Shield className="w-3 h-3 text-muted-foreground" />
                <span className="text-foreground">{item.name}</span>
                <span className="text-muted-foreground ml-auto">
                  {item.itemType}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showLevelUpModal && unspentStatPoints > 0 && (
        <LevelUpModal
          character={character}
          newLevel={character.level}
          statPointsToSpend={unspentStatPoints}
          onConfirm={handleLevelUpConfirm}
          onClose={() => setShowLevelUpModal(false)}
        />
      )}

      {showAbilityModal && (
        <AbilitySelectModal
          character={character}
          onClose={() => setShowAbilityModal(false)}
          onConfirm={handleAbilityConfirm}
        />
      )}
    </div>
  );
}
