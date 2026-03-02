import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  Skull,
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

type RunPhase = "running" | "complete" | "error";

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
  const logEndRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const submitDungeonResult = useSubmitDungeonResult();
  const setCharacterHp = useSetCharacterHp();

  // Auto-scroll log
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally triggers on displayedLog array identity change for scroll
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedLog]);

  // Start combat immediately on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: hasStarted ref ensures this runs once on mount; all deps are stable at mount time
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Use equippedAbilities (up to 3) for combat; fall back to abilities
    const combatAbilities =
      character.equippedAbilities.length > 0
        ? character.equippedAbilities
        : character.abilities;

    const result = simulateCombat(
      {
        str: character.stats.str,
        dex: character.stats.dex,
        int: character.stats.int,
        vit: character.stats.vit,
        maxHp: character.stats.maxHp,
        currentHp: character.stats.currentHp,
        critChance: character.stats.critChance,
        critPower: character.stats.critPower,
        equippedItems: character.equippedItems,
        abilities: combatAbilities,
        characterClass: character.class,
      },
      dungeonLevel,
      dungeonMode === "hardcore",
      character.realm,
      monsters,
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
      setPhase("complete");
      return;
    }
    const timer = setTimeout(() => {
      setDisplayedLog((prev) => [...prev, combatResult.log[logIndex]]);
      setLogIndex((prev) => prev + 1);
    }, 80);
    return () => clearTimeout(timer);
  }, [phase, combatResult, logIndex]);

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

    onComplete(combatResult, newTotalXp, newLevel, remainingHp);
  }, [
    combatResult,
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

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col items-center justify-start p-4 pt-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl text-primary mb-1">
            Dungeon Level {dungeonLevel}
          </h1>
          <p className="text-muted-foreground text-sm">
            {character.name} — {character.realm}
            {firstMonsterName && (
              <span className="ml-2 text-accent">vs {firstMonsterName}</span>
            )}
          </p>
        </div>

        {/* Combat Log */}
        <div className="bg-surface-2 rounded-lg border border-border">
          <div className="p-4 h-80 overflow-y-auto font-mono text-sm">
            {displayedLog.map((line, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: combat log is append-only; lines never reorder
                key={`log-${i}`}
                className={`mb-1 ${
                  line.includes("CRIT")
                    ? "text-yellow-400 font-bold"
                    : line.includes("defeated")
                      ? "text-green-400"
                      : line.includes("slain") || line.includes("dead")
                        ? "text-red-400"
                        : line.includes("XP")
                          ? "text-accent"
                          : line.includes("Loot")
                            ? "text-purple-400"
                            : line.startsWith("Entering") ||
                                line.startsWith("You are battling") ||
                                line.startsWith("Dungeon")
                              ? "text-primary font-semibold"
                              : "text-foreground/80"
                }`}
              >
                {line}
              </div>
            ))}
            {phase === "running" && (
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Combat in progress...</span>
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Result Banner */}
          {(phase === "complete" || phase === "error") && combatResult && (
            <div
              className={`border-t border-border p-4 ${
                isVictory ? "bg-green-950/30" : "bg-red-950/30"
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
                      ? `+${combatResult.xpEarned} XP earned • ${combatResult.loot.length} items found`
                      : isSoftcoreDeath
                        ? "You survived with 1 HP. Rest and recover."
                        : "Your journey ends here."}
                  </p>
                </div>
              </div>

              {combatResult.loot.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Items found:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {combatResult.loot.map((item: GeneratedItem) => (
                      <span
                        key={item.id}
                        className={`text-xs px-2 py-1 rounded border ${
                          item.rarity === "Legendary"
                            ? "border-yellow-500 text-yellow-400"
                            : item.rarity === "Rare"
                              ? "border-blue-500 text-blue-400"
                              : item.rarity === "Uncommon"
                                ? "border-green-500 text-green-400"
                                : "border-border text-muted-foreground"
                        }`}
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
