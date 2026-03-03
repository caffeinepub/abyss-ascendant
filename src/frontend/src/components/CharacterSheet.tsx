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

const CLASS_ICONS: Record<string, string> = {
  Warrior: "⚔️",
  Rogue: "🗡️",
  Mage: "🔮",
};

const CLASS_GRADIENTS: Record<string, string> = {
  Warrior:
    "linear-gradient(135deg, oklch(0.18 0.05 38) 0%, oklch(0.12 0.03 38) 100%)",
  Rogue:
    "linear-gradient(135deg, oklch(0.18 0.05 180) 0%, oklch(0.12 0.03 180) 100%)",
  Mage: "linear-gradient(135deg, oklch(0.18 0.05 298) 0%, oklch(0.12 0.03 298) 100%)",
};

const STAT_CONFIG = [
  {
    key: "str" as const,
    label: "Strength",
    abbr: "STR",
    icon: <Sword className="w-3.5 h-3.5" />,
    color: "text-orange-400",
    desc: "Physical damage & power",
  },
  {
    key: "dex" as const,
    label: "Dexterity",
    abbr: "DEX",
    icon: <Zap className="w-3.5 h-3.5" />,
    color: "text-teal-400",
    desc: "Speed, crit & initiative",
  },
  {
    key: "int" as const,
    label: "Intelligence",
    abbr: "INT",
    icon: <Star className="w-3.5 h-3.5" />,
    color: "text-violet-400",
    desc: "Spell power & magic damage",
  },
  {
    key: "vit" as const,
    label: "Vitality",
    abbr: "VIT",
    icon: <Heart className="w-3.5 h-3.5" />,
    color: "text-rose-400",
    desc: "Max life & resilience",
  },
];

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
      await updateStatsMutation.mutateAsync({
        characterId: character.id,
        statsUpdate: {
          strIncrease: BigInt(statsUpdate.strIncrease),
          dexIncrease: BigInt(statsUpdate.dexIncrease),
          intIncrease: BigInt(statsUpdate.intIncrease),
          vitIncrease: BigInt(statsUpdate.vitIncrease),
        },
      });
      await spendStatPointsMutation.mutateAsync({
        characterId: character.id,
        pointsSpent: BigInt(statsUpdate.newTotalSpent),
      });
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
      onUpdateEquippedAbilities(selectedAbilityNames);
      setShowAbilityModal(false);
    }
  };

  const equippedAbilityObjects = character.equippedAbilities
    .map((name) => ABILITIES.find((a) => a.name === name))
    .filter(Boolean);

  const isSaving =
    updateStatsMutation.isPending ||
    spendStatPointsMutation.isPending ||
    equipAbilitiesMutation.isPending;

  const classIcon = CLASS_ICONS[character.class] ?? "⚔️";
  const classGradient =
    CLASS_GRADIENTS[character.class] ?? CLASS_GRADIENTS.Warrior;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 animate-fade-in">
      {/* ── Character header ──────────────────────────────────────── */}
      <div className="panel-ember rounded-xl p-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.65 0.17 38), transparent)",
          }}
        />
        <div className="flex items-center gap-4 relative">
          <div
            className="w-16 h-16 rounded-xl border border-border/50 flex-shrink-0 shadow-card flex items-center justify-center text-2xl"
            style={{ background: classGradient }}
          >
            {classIcon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-foreground text-xl leading-tight">
              {character.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Level {character.level}{" "}
              <span className="text-ember">{character.class}</span>
              {" · "}
              <span
                className={
                  character.realm === "Hardcore"
                    ? "text-destructive"
                    : "text-primary/70"
                }
              >
                {character.realm}
              </span>
            </p>
          </div>
          {isSaving && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">Saving...</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div className="panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Base Statistics
          </h3>
          {unspentStatPoints > 0 && (
            <button
              type="button"
              data-ocid="character.stat.open_modal_button"
              onClick={() => setShowLevelUpModal(true)}
              className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1 font-semibold transition-all animate-ember-pulse"
              style={{
                background: "oklch(0.65 0.17 38 / 0.2)",
                color: "oklch(0.65 0.17 38)",
                border: "1px solid oklch(0.65 0.17 38 / 0.35)",
              }}
            >
              <Plus className="w-3 h-3" />
              {unspentStatPoints} point{unspentStatPoints !== 1 ? "s" : ""} to
              spend
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {STAT_CONFIG.map(({ key, abbr, icon, color, desc }) => (
            <div
              key={key}
              className="flex items-center gap-3 bg-surface-2 rounded-lg px-3 py-2.5 border border-border/40"
            >
              <span className={color}>{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    {abbr}
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {character.stats[key]}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground/50 truncate">
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* HP & crit */}
        <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <div className="text-muted-foreground/60 uppercase tracking-wider text-[10px]">
              Max HP
            </div>
            <div className="font-bold text-rose-400 text-sm mt-0.5">
              {character.stats.maxHp}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground/60 uppercase tracking-wider text-[10px]">
              Crit
            </div>
            <div className="font-bold text-dungeon-gold text-sm mt-0.5">
              {character.stats.critChance}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground/60 uppercase tracking-wider text-[10px]">
              Points
            </div>
            <div
              className={`font-bold text-sm mt-0.5 ${unspentStatPoints > 0 ? "text-primary" : "text-muted-foreground"}`}
            >
              {unspentStatPoints > 0
                ? `+${unspentStatPoints}`
                : character.totalStatPointsSpent}
            </div>
          </div>
        </div>
      </div>

      {/* ── Abilities ─────────────────────────────────────────────── */}
      <div className="panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Abilities
          </h3>
          <button
            type="button"
            data-ocid="character.abilities.open_modal_button"
            onClick={() => setShowAbilityModal(true)}
            className="flex items-center gap-1.5 text-xs bg-surface-2 text-muted-foreground border border-border/50 px-2.5 py-1 rounded-lg hover:text-foreground hover:border-border transition-all"
          >
            <Zap className="w-3 h-3" />
            {equippedAbilityObjects.length > 0 ? "Manage" : "Unlock"}
          </button>
        </div>

        <div className="space-y-2">
          {(["slot-0", "slot-1", "slot-2"] as const).map((slotKey, i) => {
            const ability = equippedAbilityObjects[i];
            const hasPoint = availableAbilityPoints > i;
            return (
              <div
                key={slotKey}
                className={`flex items-center gap-3 rounded-lg p-2.5 border transition-all ${
                  ability
                    ? "bg-surface-2 border-accent/20"
                    : hasPoint
                      ? "bg-surface-2/40 border-border/30 border-dashed"
                      : "bg-surface-2/20 border-border/15 border-dashed opacity-40"
                }`}
              >
                {ability ? (
                  <>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                      style={{ background: "oklch(0.35 0.16 298 / 0.2)" }}
                    >
                      {ability.icon ?? "⚡"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {ability.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {ability.description}
                      </div>
                    </div>
                    <div className="text-xs text-ember font-bold flex-shrink-0">
                      {(ability.damageMultiplier * 100).toFixed(0)}%
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground/40 mx-auto py-1">
                    {hasPoint ? "— Available Slot —" : "— Locked —"}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground/50 mt-2.5">
          {availableAbilityPoints} slot{availableAbilityPoints !== 1 ? "s" : ""}{" "}
          unlocked · 12.5% trigger chance per round
        </p>
      </div>

      {/* ── Equipment ─────────────────────────────────────────────── */}
      <div className="panel rounded-xl p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Equipment
        </h3>
        {character.equippedItems.length === 0 ? (
          <div
            data-ocid="character.equipment.empty_state"
            className="flex flex-col items-center justify-center py-8 text-muted-foreground/30"
          >
            <Shield className="w-8 h-8 mb-2" />
            <p className="text-xs">No items equipped.</p>
            <p className="text-[11px] mt-0.5 opacity-70">
              Find gear in the dungeon and equip via Inventory.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {character.equippedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 text-xs bg-surface-2 rounded-lg px-3 py-2 border border-border/30"
              >
                <span className="text-base leading-none">
                  {item.icon ?? "🗡️"}
                </span>
                <span className="text-foreground font-medium flex-1 min-w-0 truncate">
                  {item.name}
                </span>
                <span className="text-muted-foreground/60 flex-shrink-0">
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
