import React, { useState, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import {
  useGetCharacters,
  useSetCharacterHp,
  useSpendStatPoints,
  useUpdateStats,
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from './hooks/useQueries';
import { useLocalCharacter } from './hooks/useLocalCharacter';
import { useHealthRegen } from './hooks/useHealthRegen';
import { LocalCharacter, BaseStats, calculateUnspentStatPoints } from './types/game';
import { Character } from './backend';
import { CombatResult } from './engine/combatEngine';
import { GeneratedItem } from './engine/lootGenerator';
import { GeneratedMonster } from './data/monsters';

import Navigation, { NavScreen } from './components/Navigation';
import CharacterSelectScreen from './components/CharacterSelectScreen';
import CharacterCreation from './components/CharacterCreation';
import CharacterSheet from './components/CharacterSheet';
import DungeonSelectScreen from './components/DungeonSelectScreen';
import DungeonRunScreen from './components/DungeonRunScreen';
import InventoryScreen from './components/InventoryScreen';
import MarketplaceScreen from './components/MarketplaceScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import ProfessionsPlaceholder from './components/ProfessionsPlaceholder';
import ShrinesPlaceholder from './components/ShrinesPlaceholder';
import LevelUpModal from './components/LevelUpModal';

const queryClient = new QueryClient();

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState<number | null>(null);
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('character');
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [pendingLoot, setPendingLoot] = useState<GeneratedItem[]>([]);
  const [dungeonLevel, setDungeonLevel] = useState(1);
  const [dungeonMode, setDungeonMode] = useState<'normal' | 'hardcore'>('normal');
  const [isInDungeon, setIsInDungeon] = useState(false);
  const [pendingMonsters, setPendingMonsters] = useState<GeneratedMonster[]>([]);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [pendingLevelUp, setPendingLevelUp] = useState(false);
  const [isSavingHp, setIsSavingHp] = useState(false);

  const { data: rawCharacters = [], isLoading: charsLoading, isError: charsError, refetch: refetchChars } = useGetCharacters();
  const setCharacterHpMutation = useSetCharacterHp();
  const spendStatPointsMutation = useSpendStatPoints();
  const updateStatsMutation = useUpdateStats();

  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  // Find the selected backend character by index
  const selectedBackendChar: Character | null =
    selectedCharacterIndex !== null && rawCharacters[selectedCharacterIndex] !== undefined
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
  const handleBackendHpSync = useCallback((newHp: number) => {
    if (selectedCharacterIndex === null || !character) return;
    setCharacterHpMutation.mutate({ characterId: selectedCharacterIndex, hp: BigInt(Math.floor(newHp)) });
  }, [selectedCharacterIndex, character, setCharacterHpMutation]);

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
        character.totalStatPointsSpent
      );
      if (unspent > 0) {
        setShowLevelUpModal(true);
        setPendingLevelUp(false);
      }
    }
  }, [character, isInDungeon, pendingLevelUp]);

  const handleSelectCharacter = useCallback((index: number) => {
    setSelectedCharacterIndex(index);
    setCurrentScreen('character');
    setShowCharacterCreation(false);
  }, []);

  const handleBackToCharacterSelect = useCallback(async () => {
    const charIdToSave = selectedCharacterIndex;
    const charToSave = character;

    if (charIdToSave !== null && charToSave) {
      const hpToSave = Math.min(charToSave.stats.currentHp, charToSave.stats.maxHp);
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
    setCurrentScreen('character');
    setIsInDungeon(false);
    setPendingLoot([]);
    setPendingMonsters([]);
  }, [selectedCharacterIndex, character, setCharacterHpMutation]);

  type DungeonMode = 'Catacombs' | 'Depths' | 'AscensionTrial';

  const handleStartDungeon = useCallback((mode: DungeonMode, level: number, monsters?: GeneratedMonster[]) => {
    setDungeonLevel(level);
    setDungeonMode(mode === 'AscensionTrial' ? 'hardcore' : 'normal');
    setPendingMonsters(monsters ?? []);
    setIsInDungeon(true);
  }, []);

  const handleDungeonComplete = useCallback((
    result: CombatResult,
    newXp: number,
    newLevel: number,
    remainingHp: number
  ) => {
    setIsInDungeon(false);
    setPendingMonsters([]);

    updateAfterDungeon(newXp, newLevel, remainingHp);

    if (selectedCharacterIndex !== null) {
      setCharacterHpMutation.mutate({
        characterId: selectedCharacterIndex,
        hp: BigInt(Math.floor(remainingHp)),
      });
    }

    if (result.loot.length > 0) {
      setPendingLoot(prev => [...prev, ...result.loot]);
    }

    if (character && newLevel > character.level) {
      setPendingLevelUp(true);
    }

    setCurrentScreen('dungeon-select');
  }, [character, updateAfterDungeon, selectedCharacterIndex, setCharacterHpMutation]);

  const handleDungeonDeath = useCallback(() => {
    setIsInDungeon(false);
    setPendingMonsters([]);
    setSelectedCharacterIndex(null);
    setCurrentScreen('character');
    refetchChars();
  }, [refetchChars]);

  const handleUpdateBaseStats = useCallback(async (newBaseStats: BaseStats, newTotalSpent: number) => {
    updateBaseStats(newBaseStats, newTotalSpent);
    setShowLevelUpModal(false);
  }, [updateBaseStats]);

  const handleUpdateAbilities = useCallback((abilities: string[]) => {
    updateAbilities(abilities);
  }, [updateAbilities]);

  const handleUpdateEquipment = useCallback((
    equippedItems: GeneratedItem[],
    inventory: GeneratedItem[],
    stash: GeneratedItem[]
  ) => {
    updateEquipment(equippedItems, inventory, stash);
  }, [updateEquipment]);

  const handleClearPendingLoot = useCallback(() => {
    setPendingLoot([]);
  }, []);

  // Profile setup
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileName, setProfileName] = useState('');

  const showProfileSetupModal = isAuthenticated && !profileLoading && profileFetched && userProfile === null;

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
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <div className="text-center">
          <img src="/assets/generated/logo-sigil.dim_256x256.png" alt="Logo" className="w-16 h-16 mx-auto mb-4 opacity-80 animate-pulse" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
        <div className="bg-surface-2 border border-border rounded-lg p-8 max-w-sm w-full text-center">
          <img src="/assets/generated/logo-sigil.dim_256x256.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
          <h2 className="font-display text-2xl text-primary mb-2">Welcome, Adventurer</h2>
          <p className="text-muted-foreground text-sm mb-6">Choose your name to begin your journey.</p>
          <input
            type="text"
            value={profileName}
            onChange={e => setProfileName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full bg-surface-1 border border-border rounded px-3 py-2 text-foreground mb-4 focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
            autoFocus
          />
          <button
            onClick={handleSaveProfile}
            disabled={!profileName.trim() || saveProfile.isPending}
            className="w-full bg-primary text-primary-foreground rounded py-2 font-display tracking-wide disabled:opacity-50"
          >
            {saveProfile.isPending ? 'Saving...' : 'Begin Adventure'}
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
            onCharacterCreated={(characterId) => {
              refetchChars();
              setShowCharacterCreation(false);
              // Select the newly created character by index
              if (typeof characterId === 'number') {
                handleSelectCharacter(characterId);
              }
            }}
            onCancel={() => setShowCharacterCreation(false)}
          />
          <AppFooter />
        </div>
      );
    }

    // Build LocalCharacter-like list for CharacterSelectScreen
    // We pass index as id so onSelectCharacter receives the index
    const characterSelectList: LocalCharacter[] = rawCharacters.map((backendChar, index) => {
      const level = Number(backendChar.level);
      const vit = Number(backendChar.baseStats.vit);
      const str = Number(backendChar.baseStats.str);
      const dex = Number(backendChar.baseStats.dex);
      const int_ = Number(backendChar.baseStats.int);
      const maxHp = Math.max(10, vit * 10 + 50);
      const currentHp = Math.min(Number(backendChar.advancedStats.currentHP), maxHp);
      const totalEarned = Number(backendChar.totalStatPointsEarned);
      const totalSpent = Number(backendChar.totalStatPointsSpent);
      const classStr = backendChar.class;
      const characterClass =
        classStr === 'Warrior' || classStr === 'Rogue' || classStr === 'Mage'
          ? (classStr as import('./types/game').CharacterClass)
          : ('Warrior' as import('./types/game').CharacterClass);

      return {
        id: index,
        name: backendChar.name,
        class: characterClass,
        realm: backendChar.realm === 'Hardcore' ? 'Hardcore' : 'Softcore',
        level,
        xp: Number(backendChar.xp),
        status: backendChar.status === 'Dead' ? 'Dead' : 'Alive',
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
        equippedAbilities: backendChar.equippedAbilities?.map(a => a.name) || [],
        abilities: [],
        equippedItems: [],
        inventory: [],
        stash: [],
      } as LocalCharacter;
    });

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
          onComplete={handleDungeonComplete}
          onDeath={handleDungeonDeath}
        />
      </div>
    );
  }

  // Main game screens
  const unspentPoints = character
    ? calculateUnspentStatPoints(character.totalStatPointsEarned, character.totalStatPointsSpent)
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
        onBackToCharacterSelect={handleBackToCharacterSelect}
        isSavingHp={isSavingHp}
      />

      <main className="flex-1 pb-4">
        {currentScreen === 'character' && character && (
          <CharacterSheet
            character={character}
            onUpdateBaseStats={handleUpdateBaseStats}
            onUpdateEquippedAbilities={handleUpdateAbilities}
          />
        )}
        {currentScreen === 'dungeon-select' && character && (
          <DungeonSelectScreen
            character={character}
            pendingLoot={pendingLoot}
            onClearPendingLoot={handleClearPendingLoot}
            onStartDungeon={handleStartDungeon}
          />
        )}
        {currentScreen === 'inventory' && character && (
          <InventoryScreen
            character={character}
            onEquipItem={(item) => {
              const newEquipped = [...character.equippedItems.filter(e => e.itemType !== item.itemType), item];
              const newInventory = character.inventory.filter(i => i.id !== item.id);
              handleUpdateEquipment(newEquipped, newInventory, character.stash);
            }}
            onUnequipItem={(item) => {
              const newEquipped = character.equippedItems.filter(e => e.id !== item.id);
              const newInventory = [...character.inventory, item];
              handleUpdateEquipment(newEquipped, newInventory, character.stash);
            }}
            onMoveToStash={(item) => {
              const newInventory = character.inventory.filter(i => i.id !== item.id);
              const newStash = [...character.stash, item];
              handleUpdateEquipment(character.equippedItems, newInventory, newStash);
            }}
            onMoveFromStash={(item) => {
              const newStash = character.stash.filter(i => i.id !== item.id);
              const newInventory = [...character.inventory, item];
              handleUpdateEquipment(character.equippedItems, newInventory, newStash);
            }}
          />
        )}
        {currentScreen === 'marketplace' && (
          <MarketplaceScreen character={character} />
        )}
        {currentScreen === 'leaderboard' && (
          <LeaderboardScreen currentUsername={userProfile?.username} />
        )}
        {currentScreen === 'professions' && <ProfessionsPlaceholder />}
        {currentScreen === 'shrines' && <ShrinesPlaceholder />}
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
              console.error('Failed to save stat points:', err);
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
  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <img
          src="/assets/generated/logo-sigil.dim_256x256.png"
          alt="Dungeon Crawler"
          className="w-24 h-24 mx-auto mb-6"
        />
        <h1 className="font-display text-4xl text-primary mb-2">Dungeon Crawler</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          An on-chain RPG adventure. Battle monsters, collect loot, and rise through the ranks.
        </p>
        <button
          onClick={login}
          disabled={isLoggingIn}
          className="bg-primary text-primary-foreground px-8 py-3 rounded font-display tracking-wide text-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {isLoggingIn ? 'Connecting...' : 'Begin Adventure'}
        </button>
        <p className="text-xs text-muted-foreground mt-4">
          Secured by Internet Identity
        </p>
      </div>
      <AppFooter />
    </div>
  );
}

function AppFooter() {
  const appId = typeof window !== 'undefined' ? encodeURIComponent(window.location.hostname) : 'dungeon-crawler';
  return (
    <footer className="text-center py-4 text-xs text-muted-foreground">
      <p>
        © {new Date().getFullYear()} Dungeon Crawler &nbsp;·&nbsp; Built with{' '}
        <span className="text-red-400">♥</span> using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </footer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
