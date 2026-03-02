import React, { useState, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import {
  useGetCharacters,
  useSetCharacterHp,
  useSpendStatPoints,
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from './hooks/useQueries';
import { useLocalCharacter } from './hooks/useLocalCharacter';
import { useHealthRegen } from './hooks/useHealthRegen';
import { LocalCharacter, BaseStats, calculateUnspentStatPoints } from './types/game';
import { Character } from './backend';
import { CombatResult } from './engine/combatEngine';
import { GeneratedItem } from './engine/lootGenerator';

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

// CharacterWithId wraps a backend Character with its array index as a local ID
interface CharacterWithId {
  id: number;
  character: Character;
}

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
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [pendingLevelUp, setPendingLevelUp] = useState(false);

  const { data: rawCharacters = [], isLoading: charsLoading, isError: charsError, refetch: refetchChars } = useGetCharacters();
  const setCharacterHpMutation = useSetCharacterHp();
  const spendStatPointsMutation = useSpendStatPoints();

  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  // Build CharacterWithId list using array index as ID
  const characters: CharacterWithId[] = rawCharacters.map((character, index) => ({
    id: index,
    character,
  }));

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

  // Health regen - sync to backend periodically
  const handleBackendHpSync = useCallback((newHp: number) => {
    if (selectedCharacterIndex === null || !character) return;
    setCharacterHpMutation.mutate({ characterId: selectedCharacterIndex, hp: newHp });
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
      const unspent = calculateUnspentStatPoints(character.totalStatPointsEarned, character.totalStatPointsSpent);
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

  const handleBackToCharacterSelect = useCallback(() => {
    // Persist current HP to backend before navigating away so it is restored on re-entry
    if (selectedCharacterIndex !== null && character) {
      const hpToSave = Math.min(character.stats.currentHp, character.stats.maxHp);
      setCharacterHpMutation.mutate({ characterId: selectedCharacterIndex, hp: hpToSave });
    }
    setSelectedCharacterIndex(null);
    setCurrentScreen('character');
    setIsInDungeon(false);
    setPendingLoot([]);
  }, [selectedCharacterIndex, character, setCharacterHpMutation]);

  type DungeonMode = 'Catacombs' | 'Depths' | 'AscensionTrial';

  const handleStartDungeon = useCallback((mode: DungeonMode, level: number) => {
    setDungeonLevel(level);
    setDungeonMode(mode === 'AscensionTrial' ? 'hardcore' : 'normal');
    setIsInDungeon(true);
  }, []);

  const handleDungeonComplete = useCallback((
    result: CombatResult,
    newXp: number,
    newLevel: number,
    remainingHp: number
  ) => {
    setIsInDungeon(false);

    // Update local character state with post-combat values
    updateAfterDungeon(newXp, newLevel, remainingHp);

    // Persist post-combat HP to backend
    if (selectedCharacterIndex !== null) {
      setCharacterHpMutation.mutate({ characterId: selectedCharacterIndex, hp: remainingHp });
    }

    // Add loot to pending
    if (result.loot.length > 0) {
      setPendingLoot(prev => [...prev, ...result.loot]);
    }

    // Check if leveled up - trigger level up modal
    if (character && newLevel > character.level) {
      setPendingLevelUp(true);
    }

    setCurrentScreen('dungeon-select');
  }, [character, updateAfterDungeon, selectedCharacterIndex, setCharacterHpMutation]);

  const handleDungeonDeath = useCallback(() => {
    setIsInDungeon(false);
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

  // Profile setup modal
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
            onCharacterCreated={(id) => {
              refetchChars();
              setShowCharacterCreation(false);
            }}
            onCancel={() => setShowCharacterCreation(false)}
          />
          <AppFooter />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-surface-1">
        <CharacterSelectScreen
          characters={characters}
          isLoading={charsLoading}
          isError={charsError}
          onRetry={refetchChars}
          onSelectCharacter={handleSelectCharacter}
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
          onComplete={handleDungeonComplete}
          onDeath={handleDungeonDeath}
        />
      </div>
    );
  }

  // Main game screens
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
      />

      <main className="flex-1 pb-4">
        {currentScreen === 'character' && character && (
          <CharacterSheet
            character={character}
            onUpdateBaseStats={handleUpdateBaseStats}
            onUpdateAbilities={handleUpdateAbilities}
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

      {/* Level Up Modal */}
      {showLevelUpModal && character && calculateUnspentStatPoints(character.totalStatPointsEarned, character.totalStatPointsSpent) > 0 && (
        <LevelUpModal
          character={character}
          onConfirm={async (newBaseStats, newTotalSpent) => {
            try {
              await spendStatPointsMutation.mutateAsync({
                characterId: selectedCharacterIndex,
                pointsSpent: newTotalSpent,
              });
              handleUpdateBaseStats(newBaseStats, newTotalSpent);
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
