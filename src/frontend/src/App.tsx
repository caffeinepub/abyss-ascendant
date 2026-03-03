import React, { useState, useCallback, useEffect } from "react";
import type { Character } from "./backend";
import type { GeneratedMonster } from "./data/monsters";
import {
  type CombatResult,
  type CombatStats,
  simulateCombat,
} from "./engine/combatEngine";
import type { GeneratedItem } from "./engine/lootGenerator";
import { useActor } from "./hooks/useActor";
import { useHealthRegen } from "./hooks/useHealthRegen";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useLocalCharacter } from "./hooks/useLocalCharacter";
import {
  useGetCallerUserProfile,
  useGetCharacters,
  useSaveCallerUserProfile,
  useSetCharacterHp,
  useSpendStatPoints,
  useUpdateStats,
} from "./hooks/useQueries";
import {
  type BaseStats,
  type LocalCharacter,
  calculateUnspentStatPoints,
} from "./types/game";

import CharacterCreation from "./components/CharacterCreation";
import CharacterSelectScreen from "./components/CharacterSelectScreen";
import CharacterSheet from "./components/CharacterSheet";
import DungeonRunScreen from "./components/DungeonRunScreen";
import DungeonSelectScreen from "./components/DungeonSelectScreen";
import InventoryScreen from "./components/InventoryScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";
import LevelUpModal from "./components/LevelUpModal";
import MarketplaceScreen from "./components/MarketplaceScreen";
import Navigation, { type NavScreen } from "./components/Navigation";
import ProfessionsPlaceholder from "./components/ProfessionsPlaceholder";
import ShrinesPlaceholder from "./components/ShrinesPlaceholder";

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { actor, isFetching: actorFetching } = useActor();

  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState<
    number | null
  >(null);
  const [currentScreen, setCurrentScreen] = useState<NavScreen>("character");
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [pendingLoot, setPendingLoot] = useState<GeneratedItem[]>([]);
  const [dungeonLevel, setDungeonLevel] = useState(1);
  const [dungeonMode, setDungeonMode] = useState<"normal" | "hardcore">(
    "normal",
  );
  const [isInDungeon, setIsInDungeon] = useState(false);
  const [pendingMonsters, setPendingMonsters] = useState<GeneratedMonster[]>(
    [],
  );
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [pendingLevelUp, setPendingLevelUp] = useState(false);
  const [isSavingHp, setIsSavingHp] = useState(false);
  const [preComputedCombatResult, setPreComputedCombatResult] =
    useState<CombatResult | null>(null);

  const {
    data: rawCharacters = [],
    isLoading: charsLoading,
    isError: charsError,
    refetch: refetchChars,
  } = useGetCharacters();

  // Ensure characters are fetched once the authenticated actor is ready.
  // This is a safety-net for race conditions where the query fires before
  // the actor has finished initialising.
  useEffect(() => {
    if (isAuthenticated && actor && !actorFetching) {
      refetchChars();
    }
  }, [isAuthenticated, actor, actorFetching, refetchChars]);
  const setCharacterHpMutation = useSetCharacterHp();
  const spendStatPointsMutation = useSpendStatPoints();
  const updateStatsMutation = useUpdateStats();

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  // Find the selected backend character by index
  const selectedBackendChar: Character | null =
    selectedCharacterIndex !== null &&
    rawCharacters[selectedCharacterIndex] !== undefined
      ? rawCharacters[selectedCharacterIndex]
      : null;

  const {
    character,
    updateHp,
    updateAbilities,
    updateEquipment,
    updateAfterDungeon,
    updateBaseStats,
  } = useLocalCharacter(selectedCharacterIndex, selectedBackendChar);

  // Health regen - sync to backend periodically (silent, no query invalidation)
  const handleBackendHpSync = useCallback(
    (newHp: number) => {
      if (selectedCharacterIndex === null || !character) return;
      setCharacterHpMutation.mutate({
        characterId: selectedCharacterIndex,
        hp: BigInt(Math.floor(newHp)),
      });
    },
    [selectedCharacterIndex, character, setCharacterHpMutation],
  );

  useHealthRegen({
    currentHp: character?.stats.currentHp ?? 0,
    maxHp: character?.stats.maxHp ?? 0,
    isInCombat: isInDungeon,
    onHpChange: updateHp,
    onBackendSync: handleBackendHpSync,
  });

  // Show level up modal when character has unspent stat points after dungeon
  useEffect(() => {
    if (character && !isInDungeon && pendingLevelUp) {
      const unspent = calculateUnspentStatPoints(
        character.totalStatPointsEarned,
        character.totalStatPointsSpent,
      );
      if (unspent > 0) {
        setShowLevelUpModal(true);
        setPendingLevelUp(false);
      }
    }
  }, [character, isInDungeon, pendingLevelUp]);

  const handleSelectCharacter = useCallback((index: number) => {
    setSelectedCharacterIndex(index);
    setCurrentScreen("character");
    setShowCharacterCreation(false);
  }, []);

  const handleBackToCharacterSelect = useCallback(async () => {
    const charIdToSave = selectedCharacterIndex;
    const charToSave = character;

    if (charIdToSave !== null && charToSave) {
      const hpToSave = Math.min(
        charToSave.stats.currentHp,
        charToSave.stats.maxHp,
      );
      setIsSavingHp(true);
      try {
        await setCharacterHpMutation.mutateAsync({
          characterId: charIdToSave,
          hp: BigInt(Math.floor(hpToSave)),
        });
      } catch {
        // Even if save fails, still navigate back
      } finally {
        setIsSavingHp(false);
      }
    }

    setSelectedCharacterIndex(null);
    setCurrentScreen("character");
    setIsInDungeon(false);
    setPendingLoot([]);
    setPendingMonsters([]);
  }, [selectedCharacterIndex, character, setCharacterHpMutation]);

  type DungeonMode = "Catacombs" | "Depths" | "AscensionTrial";

  const handleStartDungeon = useCallback(
    (mode: DungeonMode, level: number, monsters?: GeneratedMonster[]) => {
      setDungeonLevel(level);
      const isHardcore = mode === "AscensionTrial";
      setDungeonMode(isHardcore ? "hardcore" : "normal");
      const resolvedMonsters = monsters ?? [];
      setPendingMonsters(resolvedMonsters);

      // Pre-compute combat result immediately so DungeonRunScreen can start
      // animating the log without any async delay.
      if (character) {
        const combatAbilities =
          character.equippedAbilities.length > 0
            ? character.equippedAbilities
            : character.abilities;
        const combatStats: CombatStats = {
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
        };
        const result = simulateCombat(
          combatStats,
          level,
          isHardcore,
          character.realm,
          resolvedMonsters.length > 0 ? resolvedMonsters : undefined,
        );
        setPreComputedCombatResult(result);
      } else {
        setPreComputedCombatResult(null);
      }

      setIsInDungeon(true);
    },
    [character],
  );

  const handleDungeonComplete = useCallback(
    (
      result: CombatResult,
      newXp: number,
      newLevel: number,
      remainingHp: number,
    ) => {
      setIsInDungeon(false);
      setPendingMonsters([]);
      setPreComputedCombatResult(null);

      // Write inventory to localStorage synchronously BEFORE firing any
      // mutations that trigger query invalidation / re-fetches — this
      // ensures buildLocalCharacter reads the correct inventory even if
      // the React state update hasn't been batched yet.
      if (
        result.loot.length > 0 &&
        character &&
        selectedCharacterIndex !== null
      ) {
        const storageKey = `abyss_char_${selectedCharacterIndex}`;
        try {
          const existing = JSON.parse(localStorage.getItem(storageKey) || "{}");
          const currentInv: GeneratedItem[] = existing.inventory || [];
          const newInv = [...currentInv, ...result.loot].slice(0, 10);
          localStorage.setItem(
            storageKey,
            JSON.stringify({ ...existing, inventory: newInv }),
          );
        } catch {
          // ignore storage errors
        }
      }

      updateAfterDungeon(newXp, newLevel, remainingHp);

      if (selectedCharacterIndex !== null) {
        setCharacterHpMutation.mutate({
          characterId: selectedCharacterIndex,
          hp: BigInt(Math.floor(remainingHp)),
        });
      }

      // Update React state for inventory (localStorage already written above)
      if (result.loot.length > 0 && character) {
        const currentInventory = character.inventory ?? [];
        const newInventory = [...currentInventory, ...result.loot].slice(0, 10);
        updateEquipment(character.equippedItems, newInventory, []);
      }

      if (result.loot.length > 0) {
        setPendingLoot((prev) => [...prev, ...result.loot]);
      }

      if (character && newLevel > character.level) {
        setPendingLevelUp(true);
      }

      setCurrentScreen("dungeon-select");
    },
    [
      character,
      updateAfterDungeon,
      updateEquipment,
      selectedCharacterIndex,
      setCharacterHpMutation,
    ],
  );

  const handleDungeonDeath = useCallback(() => {
    setIsInDungeon(false);
    setPendingMonsters([]);
    setPreComputedCombatResult(null);
    setSelectedCharacterIndex(null);
    setCurrentScreen("character");
    refetchChars();
  }, [refetchChars]);

  const handleUpdateBaseStats = useCallback(
    async (newBaseStats: BaseStats, newTotalSpent: number) => {
      updateBaseStats(newBaseStats, newTotalSpent);
      setShowLevelUpModal(false);
    },
    [updateBaseStats],
  );

  const handleUpdateAbilities = useCallback(
    (abilities: string[]) => {
      updateAbilities(abilities);
    },
    [updateAbilities],
  );

  const handleUpdateEquipment = useCallback(
    (
      equippedItems: GeneratedItem[],
      inventory: GeneratedItem[],
      stash: GeneratedItem[],
    ) => {
      updateEquipment(equippedItems, inventory, stash);
    },
    [updateEquipment],
  );

  const handleClearPendingLoot = useCallback(() => {
    setPendingLoot([]);
  }, []);

  // Profile setup
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileName, setProfileName] = useState("");

  const showProfileSetupModal =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  useEffect(() => {
    if (showProfileSetupModal) {
      setShowProfileSetup(true);
    }
  }, [showProfileSetupModal]);

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    await saveProfile.mutateAsync({ username: profileName.trim() });
    setShowProfileSetup(false);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 opacity-80 flex items-center justify-center text-5xl">
            ⚔
          </div>
          <p className="text-muted-foreground text-sm font-display tracking-widest uppercase">
            Entering the Abyss...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface-1 border border-border rounded-xl p-8 max-w-sm w-full text-center shadow-dungeon animate-slide-up">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-5xl">
            ⚔
          </div>
          <h2 className="font-display text-2xl text-primary mb-1">
            Welcome, Adventurer
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Claim your name before the darkness takes it.
          </p>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Enter your name..."
            data-ocid="profile.input"
            className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/60"
            onKeyDown={(e) => e.key === "Enter" && handleSaveProfile()}
          />
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={!profileName.trim() || saveProfile.isPending}
            data-ocid="profile.submit_button"
            className="w-full rounded-lg py-3 font-display tracking-wider text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{
              background: "oklch(0.65 0.17 38)",
              color: "oklch(0.08 0.01 38)",
            }}
          >
            {saveProfile.isPending ? "Entering..." : "Enter the Abyss"}
          </button>
        </div>
      </div>
    );
  }

  // Character selection
  if (selectedCharacterIndex === null) {
    if (showCharacterCreation) {
      return (
        <div className="min-h-screen bg-surface-1">
          <CharacterCreation
            existingCharacters={rawCharacters}
            onCharacterCreated={async () => {
              // Refetch to get updated character list, then select the newest
              // character (last in array). Using the backend character ID as an
              // array index was the v52 regression — backend IDs are not indices.
              const result = await refetchChars();
              const freshChars = result.data ?? rawCharacters;
              if (freshChars.length > 0) {
                handleSelectCharacter(freshChars.length - 1);
              }
              setShowCharacterCreation(false);
            }}
            onCancel={() => setShowCharacterCreation(false)}
          />
          <AppFooter />
        </div>
      );
    }

    // Build LocalCharacter-like list for CharacterSelectScreen
    // We pass index as id so onSelectCharacter receives the index
    const characterSelectList: LocalCharacter[] = rawCharacters.map(
      (backendChar, index) => {
        const level = Number(backendChar.level);
        const vit = Number(backendChar.baseStats.vit);
        const str = Number(backendChar.baseStats.str);
        const dex = Number(backendChar.baseStats.dex);
        const int_ = Number(backendChar.baseStats.int);

        // Load equipment from localStorage to include affix HP bonuses in maxHp
        const storedKey = `abyss_char_${index}`;
        let equipBonusHp = 0;
        let equipVitBonus = 0;
        try {
          const storedRaw = localStorage.getItem(storedKey);
          if (storedRaw) {
            const storedData = JSON.parse(storedRaw);
            for (const item of storedData.equippedItems || []) {
              for (const affix of item.affixes || []) {
                if (affix.stat === "hp") equipBonusHp += affix.value;
                if (affix.stat === "vit") equipVitBonus += affix.value;
              }
            }
          }
        } catch {
          // ignore
        }
        const maxHp = Math.max(
          10,
          (vit + equipVitBonus) * 10 + 50 + equipBonusHp,
        );
        const currentHp = Math.min(
          Number(backendChar.advancedStats.currentHP),
          maxHp,
        );
        const totalEarned = Number(backendChar.totalStatPointsEarned);
        const totalSpent = Number(backendChar.totalStatPointsSpent);
        const classStr = backendChar.class;
        const characterClass =
          classStr === "Warrior" || classStr === "Rogue" || classStr === "Mage"
            ? (classStr as import("./types/game").CharacterClass)
            : ("Warrior" as import("./types/game").CharacterClass);

        return {
          id: index,
          name: backendChar.name,
          class: characterClass,
          realm: backendChar.realm === "Hardcore" ? "Hardcore" : "Softcore",
          level,
          xp: Number(backendChar.xp),
          status: backendChar.status === "Dead" ? "Dead" : "Alive",
          baseStats: { str, dex, int: int_, vit },
          stats: {
            str,
            dex,
            int: int_,
            vit,
            maxHp,
            currentHp,
            critChance: Number(backendChar.advancedStats.critChance) || 5,
            critPower: Number(backendChar.advancedStats.critPower) || 50,
          },
          totalStatPointsEarned: totalEarned,
          totalStatPointsSpent: totalSpent,
          pendingStatPoints: Math.max(0, totalEarned - totalSpent),
          abilityPoints: 1,
          equippedAbilities:
            backendChar.equippedAbilities?.map((a) => a.name) || [],
          abilities: [],
          equippedItems: [],
          inventory: [],
          stash: [],
        } as LocalCharacter;
      },
    );

    return (
      <div className="min-h-screen bg-surface-1">
        <CharacterSelectScreen
          characters={characterSelectList}
          isLoading={charsLoading}
          isError={charsError}
          onRetry={refetchChars}
          onSelectCharacter={(localChar) => handleSelectCharacter(localChar.id)}
          onCreateCharacter={() => setShowCharacterCreation(true)}
        />
        <AppFooter />
      </div>
    );
  }

  // In dungeon run
  if (isInDungeon && character && selectedCharacterIndex !== null) {
    return (
      <div className="min-h-screen bg-surface-1">
        <DungeonRunScreen
          character={character}
          characterId={selectedCharacterIndex}
          dungeonLevel={dungeonLevel}
          dungeonMode={dungeonMode}
          monsters={pendingMonsters.length > 0 ? pendingMonsters : undefined}
          preComputedResult={preComputedCombatResult ?? undefined}
          onComplete={handleDungeonComplete}
          onDeath={handleDungeonDeath}
        />
      </div>
    );
  }

  // Main game screens
  const unspentPoints = character
    ? calculateUnspentStatPoints(
        character.totalStatPointsEarned,
        character.totalStatPointsSpent,
      )
    : 0;

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col">
      <Navigation
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        characterName={character?.name}
        characterLevel={character?.level}
        characterRealm={character?.realm}
        currentHP={character?.stats.currentHp}
        maxHP={character?.stats.maxHp}
        characterXp={character?.xp}
        onBackToCharacterSelect={handleBackToCharacterSelect}
        isSavingHp={isSavingHp}
      />

      <main className="flex-1 pb-4">
        {currentScreen === "character" && character && (
          <CharacterSheet
            character={character}
            onUpdateBaseStats={handleUpdateBaseStats}
            onUpdateEquippedAbilities={handleUpdateAbilities}
          />
        )}
        {currentScreen === "dungeon-select" && character && (
          <DungeonSelectScreen
            character={character}
            pendingLoot={pendingLoot}
            onClearPendingLoot={handleClearPendingLoot}
            onStartDungeon={handleStartDungeon}
          />
        )}
        {currentScreen === "inventory" && character && (
          <InventoryScreen
            character={character}
            onEquipItem={(item) => {
              const newEquipped = [
                ...character.equippedItems.filter(
                  (e) => e.itemType !== item.itemType,
                ),
                item,
              ];
              const newInventory = character.inventory.filter(
                (i) => i.id !== item.id,
              );
              handleUpdateEquipment(newEquipped, newInventory, []);
            }}
            onUnequipItem={(item) => {
              const newEquipped = character.equippedItems.filter(
                (e) => e.id !== item.id,
              );
              const newInventory = [...character.inventory, item].slice(0, 10);
              handleUpdateEquipment(newEquipped, newInventory, []);
            }}
          />
        )}
        {currentScreen === "marketplace" && (
          <MarketplaceScreen character={character} />
        )}
        {currentScreen === "leaderboard" && (
          <LeaderboardScreen currentUsername={userProfile?.username} />
        )}
        {currentScreen === "professions" && <ProfessionsPlaceholder />}
        {currentScreen === "shrines" && <ShrinesPlaceholder />}
      </main>

      {/* Level Up Modal — triggered after dungeon completion */}
      {showLevelUpModal && character && unspentPoints > 0 && (
        <LevelUpModal
          character={character}
          newLevel={character.level}
          statPointsToSpend={unspentPoints}
          onConfirm={async (statsUpdate) => {
            try {
              // 1. Increment stats on the backend
              await updateStatsMutation.mutateAsync({
                characterId: selectedCharacterIndex!,
                statsUpdate: {
                  strIncrease: BigInt(statsUpdate.strIncrease),
                  dexIncrease: BigInt(statsUpdate.dexIncrease),
                  intIncrease: BigInt(statsUpdate.intIncrease),
                  vitIncrease: BigInt(statsUpdate.vitIncrease),
                },
              });
              // 2. Record total spent count on the backend
              await spendStatPointsMutation.mutateAsync({
                characterId: selectedCharacterIndex!,
                pointsSpent: BigInt(statsUpdate.newTotalSpent),
              });
              // 3. Update local state immediately
              if (character) {
                const newBaseStats: BaseStats = {
                  str: character.baseStats.str + statsUpdate.strIncrease,
                  dex: character.baseStats.dex + statsUpdate.dexIncrease,
                  int: character.baseStats.int + statsUpdate.intIncrease,
                  vit: character.baseStats.vit + statsUpdate.vitIncrease,
                };
                updateBaseStats(newBaseStats, statsUpdate.newTotalSpent);
              }
              setShowLevelUpModal(false);
            } catch (err) {
              console.error("Failed to save stat points:", err);
            }
          }}
          onClose={() => setShowLevelUpModal(false)}
        />
      )}

      <AppFooter />
    </div>
  );
}

function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Dungeon background — CSS gradient, no image */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.06 0.02 258) 0%, oklch(0.04 0.01 258) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* Login card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 animate-slide-up">
        {/* Sigil */}
        <div className="relative mb-5 flex items-center justify-center">
          <div
            className="w-24 h-24 flex items-center justify-center text-6xl select-none"
            style={{
              filter: "drop-shadow(0 0 16px oklch(0.65 0.17 38 / 0.7))",
            }}
          >
            ⚔
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-2">
          <h1
            className="font-display text-4xl font-bold tracking-widest uppercase"
            style={{
              color: "oklch(0.72 0.17 38)",
              textShadow: "0 0 30px oklch(0.65 0.17 38 / 0.5)",
            }}
          >
            Abyss Ascendant
          </h1>
        </div>

        <p className="text-muted-foreground text-sm text-center mb-8 max-w-xs leading-relaxed">
          An on-chain RPG of darkness and glory. Battle monsters, collect cursed
          loot, and climb the eternal ladder.
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="login.primary_button"
          className="w-full py-3.5 px-8 rounded-lg font-display tracking-wider text-base font-semibold disabled:opacity-50 transition-all animate-ember-pulse"
          style={{
            background: "oklch(0.65 0.17 38)",
            color: "oklch(0.08 0.01 38)",
          }}
        >
          {isLoggingIn ? "Entering the Abyss..." : "Begin Adventure"}
        </button>

        <p className="text-xs text-muted-foreground mt-4 opacity-60">
          🔐 Secured by Internet Identity
        </p>
      </div>

      <div className="relative z-10 mt-auto">
        <AppFooter />
      </div>
    </div>
  );
}

function AppFooter() {
  const appId =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.hostname)
      : "abyss-ascendant";
  return (
    <footer className="text-center py-4 text-xs text-muted-foreground/50">
      <p>
        © {new Date().getFullYear()} Abyss Ascendant &nbsp;·&nbsp; Built with{" "}
        <span className="text-ember/70">♥</span> using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${appId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary/70 hover:text-primary transition-colors hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </footer>
  );
}

export default function App() {
  return <AppContent />;
}
