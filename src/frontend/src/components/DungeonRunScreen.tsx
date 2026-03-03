import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  PackagePlus,
  Skull,
  Trash2,
  Trophy,
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import type { GeneratedMonster } from "../data/monsters";
import { type CombatResult, simulateCombat } from "../engine/combatEngine";
import type { GeneratedItem } from "../engine/lootGenerator";
import { useSetCharacterHp, useSubmitDungeonResult } from "../hooks/useQueries";
import type { LocalCharacter } from "../types/game";
import { calculateLevel } from "../types/game";

interface DungeonRunScreenProps {
  character: LocalCharacter;
  characterId: number;
  dungeonLevel: number;
  dungeonMode: "normal" | "hardcore";
  monsters?: GeneratedMonster[];
  onComplete: (
    result: CombatResult,
    newXp: number,
    newLevel: number,
    remainingHp: number,
  ) => void;
  onDeath: () => void;
}

type RunPhase = "running" | "loot" | "complete" | "error";

export default function DungeonRunScreen({
  character,
  characterId,
  dungeonLevel,
  dungeonMode,
  monsters,
  onComplete,
  onDeath,
}: DungeonRunScreenProps) {
  const [phase, setPhase] = useState<RunPhase>("running");
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [displayedLog, setDisplayedLog] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Track loot decisions: 'pending' | 'taken' | 'discarded' per item index
  const [lootDecisions, setLootDecisions] = useState<
    Record<number, "taken" | "discarded">
  >({});
  const logEndRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const submitDungeonResult = useSubmitDungeonResult();
  const setCharacterHp = useSetCharacterHp();

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  // Capture initial props in refs so the mount-only effect has no deps
  const initialCharacterRef = useRef(character);
  const initialDungeonLevelRef = useRef(dungeonLevel);
  const initialDungeonModeRef = useRef(dungeonMode);
  const initialMonstersRef = useRef(monsters);

  // Start combat immediately on mount
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const char = initialCharacterRef.current;
    const level = initialDungeonLevelRef.current;
    const mode = initialDungeonModeRef.current;
    const initialMonsters = initialMonstersRef.current;

    // Use equippedAbilities (up to 3) for combat; fall back to abilities
    const combatAbilities =
      char.equippedAbilities.length > 0
        ? char.equippedAbilities
        : char.abilities;

    const result = simulateCombat(
      {
        str: char.stats.str,
        dex: char.stats.dex,
        int: char.stats.int,
        vit: char.stats.vit,
        maxHp: char.stats.maxHp,
        currentHp: char.stats.currentHp,
        critChance: char.stats.critChance,
        critPower: char.stats.critPower,
        equippedItems: char.equippedItems,
        abilities: combatAbilities,
        characterClass: char.class,
      },
      level,
      mode === "hardcore",
      char.realm,
      initialMonsters,
    );

    setCombatResult(result);
    setDisplayedLog([]);
    setLogIndex(0);
    setPhase("running");
  }, []);

  // Animate log lines
  useEffect(() => {
    if (phase !== "running" || !combatResult) return;
    if (logIndex >= combatResult.log.length) {
      // If there's loot and it was a victory, show loot resolution phase first
      if (combatResult.victory && combatResult.loot.length > 0) {
        setPhase("loot");
      } else {
        setPhase("complete");
      }
      return;
    }
    const timer = setTimeout(() => {
      setDisplayedLog((prev) => [...prev, combatResult.log[logIndex]]);
      setLogIndex((prev) => prev + 1);
    }, 80);
    return () => clearTimeout(timer);
  }, [phase, combatResult, logIndex]);

  const handleLootDecision = useCallback(
    (index: number, decision: "taken" | "discarded") => {
      setLootDecisions((prev) => ({ ...prev, [index]: decision }));
    },
    [],
  );

  const handleLootDone = useCallback(() => {
    if (!combatResult) return;
    // All undecided items are treated as discarded
    setPhase("complete");
  }, [combatResult]);

  const handleContinue = useCallback(async () => {
    if (!combatResult) return;
    setSaveError(null);

    const currentXp = character.xp;
    const newTotalXp = currentXp + combatResult.xpEarned;
    const newLevel = Math.min(calculateLevel(newTotalXp), 50);
    const remainingHp = combatResult.remainingHp;

    if (!combatResult.victory && character.realm === "Hardcore") {
      onDeath();
      return;
    }

    // Only pass items the player chose to take
    const takenLoot = combatResult.loot.filter(
      (_, i) => lootDecisions[i] === "taken",
    );
    const resultWithTakenLoot: CombatResult = {
      ...combatResult,
      loot: takenLoot,
    };

    const hpToSave = Math.min(remainingHp, character.stats.maxHp);
    submitDungeonResult.mutate({
      characterId,
      xpEarned: BigInt(newTotalXp),
      newLevel: BigInt(newLevel),
      unspentStatPoints: BigInt(
        Math.max(0, newLevel - 1 - character.totalStatPointsSpent),
      ),
    });
    setCharacterHp.mutate({
      characterId,
      hp: BigInt(Math.floor(hpToSave)),
    });

    onComplete(resultWithTakenLoot, newTotalXp, newLevel, remainingHp);
  }, [
    combatResult,
    lootDecisions,
    character,
    characterId,
    submitDungeonResult,
    setCharacterHp,
    onComplete,
    onDeath,
  ]);

  const handleRetry = useCallback(() => {
    setSaveError(null);
    setPhase("complete");
  }, []);

  const isVictory = combatResult?.victory ?? false;
  const isDeath = combatResult ? !combatResult.victory : false;
  const isSoftcoreDeath = isDeath && character.realm === "Softcore";

  const firstMonsterName =
    monsters && monsters.length > 0 ? monsters[0].name : null;

  const allLootDecided =
    combatResult?.loot.every((_, i) => lootDecisions[i] !== undefined) ?? false;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start p-4 pt-8 animate-fade-in">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="font-display text-2xl text-foreground font-bold mb-1">
            <span className="text-ember">Level {dungeonLevel}</span> Encounter
          </h1>
          <p className="text-muted-foreground text-sm">
            {character.name}
            {firstMonsterName && (
              <>
                {" "}
                <span className="text-muted-foreground/50">vs</span>{" "}
                <span className="text-dungeon-gold">{firstMonsterName}</span>
              </>
            )}
          </p>
        </div>

        {/* Combat Log */}
        <div className="bg-surface-1 rounded-xl border border-border/60 shadow-dungeon overflow-hidden">
          <div className="px-1 py-0.5 border-b border-border/30 bg-surface-2/50 flex items-center gap-2">
            <div className="flex gap-1 px-2 py-1">
              <div className="w-2 h-2 rounded-full bg-destructive/50" />
              <div className="w-2 h-2 rounded-full bg-dungeon-gold/50" />
              <div className="w-2 h-2 rounded-full bg-health-high/50" />
            </div>
            <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
              Combat Log
            </span>
          </div>
          <div className="p-4 h-72 overflow-y-auto scrollbar-thin font-mono text-sm space-y-0.5">
            {displayedLog.map((line, i) => (
              <div
                key={`log-${i}-${line.slice(0, 8)}`}
                className={`leading-relaxed ${
                  line.includes("CRIT")
                    ? "text-dungeon-gold font-bold"
                    : line.includes("defeated")
                      ? "text-health-high"
                      : line.includes("slain") || line.includes("dead")
                        ? "text-health-low"
                        : line.includes("XP")
                          ? "text-accent"
                          : line.includes("Loot")
                            ? "text-rarity-rare"
                            : line.startsWith("Entering") ||
                                line.startsWith("You are battling") ||
                                line.startsWith("Dungeon")
                              ? "text-ember font-semibold"
                              : "text-foreground/70"
                }`}
              >
                {line}
              </div>
            ))}
            {phase === "running" && (
              <div className="flex items-center gap-2 text-muted-foreground/60 mt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">Combat in progress...</span>
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Loot Resolution Phase */}
          {phase === "loot" && combatResult && (
            <div className="border-t border-border/40 p-4 bg-green-950/15">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <div>
                  <h3 className="font-display text-lg">Victory!</h3>
                  <p className="text-sm text-muted-foreground">
                    +{combatResult.xpEarned} XP earned &mdash; Choose your loot
                  </p>
                </div>
              </div>

              {/* Inventory full warning */}
              {character.inventory.length >= 10 && (
                <div
                  data-ocid="loot.inventory_full.error_state"
                  className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-center gap-2"
                >
                  <span>⚠️</span>
                  <span>
                    Inventory full (10/10). You cannot take any more items.
                    Equip or discard existing items first.
                  </span>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {combatResult.loot.map((item: GeneratedItem, i: number) => {
                  const decision = lootDecisions[i];
                  // Count how many "taken" decisions have been made so far (up to this index)
                  const takenCountSoFar = Object.values(lootDecisions).filter(
                    (d) => d === "taken",
                  ).length;
                  const inventoryAfterTaken =
                    character.inventory.length + takenCountSoFar;
                  const inventoryWouldBeFull =
                    inventoryAfterTaken >= 10 && decision === undefined;

                  const rarityColor =
                    item.rarity === "Legendary"
                      ? "border-yellow-500 bg-yellow-950/20"
                      : item.rarity === "Rare"
                        ? "border-blue-500 bg-blue-950/20"
                        : item.rarity === "Uncommon"
                          ? "border-green-600 bg-green-950/20"
                          : "border-border bg-surface-1";
                  const rarityText =
                    item.rarity === "Legendary"
                      ? "text-yellow-400"
                      : item.rarity === "Rare"
                        ? "text-blue-400"
                        : item.rarity === "Uncommon"
                          ? "text-green-400"
                          : "text-muted-foreground";

                  return (
                    <div
                      key={item.id}
                      data-ocid={`loot.item.${i + 1}`}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-opacity ${rarityColor} ${decision === "discarded" ? "opacity-40" : "opacity-100"}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{item.icon}</span>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${rarityText}`}
                          >
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.itemType}
                            {item.baseDamage !== undefined &&
                              ` • ${item.baseDamage} dmg`}
                            {item.baseDefense !== undefined &&
                              ` • ${item.baseDefense} def`}
                            {item.affixes.length > 0 &&
                              ` • ${item.affixes.map((a) => `${a.label} +${a.value}`).join(", ")}`}
                          </p>
                        </div>
                      </div>

                      {decision === undefined ? (
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`loot.take_button.${i + 1}`}
                            className="h-7 px-2 text-xs border-green-600 text-green-400 hover:bg-green-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={inventoryWouldBeFull}
                            title={
                              inventoryWouldBeFull
                                ? "Inventory full (10/10)"
                                : undefined
                            }
                            onClick={() => handleLootDecision(i, "taken")}
                          >
                            {inventoryWouldBeFull ? (
                              "Inv. Full"
                            ) : (
                              <>
                                <PackagePlus className="w-3 h-3 mr-1" />
                                Take
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-ocid={`loot.discard_button.${i + 1}`}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-red-400"
                            onClick={() => handleLootDecision(i, "discarded")}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Discard
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <span
                            className={`text-xs font-medium ${decision === "taken" ? "text-green-400" : "text-muted-foreground/50"}`}
                          >
                            {decision === "taken" ? "Taken" : "Discarded"}
                          </span>
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground ml-1 underline"
                            onClick={() =>
                              setLootDecisions((prev) => {
                                const next = { ...prev };
                                delete next[i];
                                return next;
                              })
                            }
                          >
                            undo
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  data-ocid="loot.done_button"
                  onClick={handleLootDone}
                  disabled={!allLootDecided}
                  className="flex items-center gap-1"
                >
                  {allLootDecided ? (
                    <>
                      Continue <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    "Decide all items to continue"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Result Banner (no loot, or defeat) */}
          {(phase === "complete" || phase === "error") && combatResult && (
            <div
              className={`border-t border-border/40 p-4 ${
                isVictory ? "bg-green-950/20" : "bg-red-950/20"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {isVictory ? (
                  <Trophy className="w-6 h-6 text-yellow-400" />
                ) : (
                  <Skull className="w-6 h-6 text-red-400" />
                )}
                <div>
                  <h3 className="font-display text-lg">
                    {isVictory
                      ? "Victory!"
                      : isSoftcoreDeath
                        ? "Defeated..."
                        : "You Died"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isVictory
                      ? `+${combatResult.xpEarned} XP earned`
                      : isSoftcoreDeath
                        ? "You survived with 1 HP. Rest and recover."
                        : "Your journey ends here."}
                  </p>
                </div>
              </div>

              {phase === "error" && saveError && (
                <div className="flex items-center gap-2 text-red-400 text-sm mb-3 bg-red-950/40 rounded p-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                {phase === "error" && (
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    Retry
                  </Button>
                )}
                {phase === "complete" && (
                  <Button
                    size="sm"
                    data-ocid="dungeon.continue_button"
                    onClick={handleContinue}
                    className="flex items-center gap-1"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
