import React, { useState, useCallback, useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
  useGetCharacters,
  useSetCharacterHp,
} from './hooks/useQueries';
import { useLocalCharacter } from './hooks/useLocalCharacter';
import { useHealthRegen } from './hooks/useHealthRegen';
import { Character, CharacterId } from './backend';
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

type AppScreen =
  | 'loading'
  | 'login'
  | 'profile-setup'
  | 'character-select'
  | 'character-creation'
  | 'character'
  | 'dungeon-select'
  | 'dungeon-run'
  | 'inventory'
  | 'marketplace'
  | 'leaderboard'
  | 'professions'
  | 'shrines';

type DungeonMode = 'Catacombs' | 'Depths' | 'AscensionTrial';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const [screen, setScreen] = useState<AppScreen>('loading');
  const [activeCharacterId, setActiveCharacterId] = useState<CharacterId | null>(null);
  const [dungeonMode, setDungeonMode] = useState<DungeonMode>('Catacombs');
  const [dungeonLevel, setDungeonLevel] = useState(1);
  const [pendingLoot, setPendingLoot] = useState<GeneratedItem[]>([]);
  const [isInCombat, setIsInCombat] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');

  const {
    character,
    initializeCharacter,
    setCurrentHP,
    clearCharacter,
    applyStatPoints,
    purchaseAbility,
    equipAbility,
    unequipAbility,
    addItemToInventory,
    equipItem,
    unequipItem,
    moveToStash,
    moveFromStash,
    applyDeathPenalty,
  } = useLocalCharacter();

  const setCharacterHpMutation = useSetCharacterHp();

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const syncHpToBackend = useCallback(
    (hp: number) => {
      if (activeCharacterId === null) return;
      setCharacterHpMutation.mutate({ characterId: activeCharacterId, hp });
    },
    [activeCharacterId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Health regen: +2 HP/sec outside combat
  useHealthRegen({
    currentHP: character?.currentHP ?? 0,
    maxHP: character?.maxHP ?? 0,
    isInCombat,
    onHpChange: setCurrentHP,
    onSyncToBackend: syncHpToBackend,
  });

  // Routing logic
  useEffect(() => {
    if (isInitializing) {
      setScreen('loading');
      return;
    }
    if (!isAuthenticated) {
      setScreen('login');
      return;
    }
    if (profileLoading) {
      setScreen('loading');
      return;
    }
    if (profileFetched && userProfile === null) {
      setScreen('profile-setup');
      return;
    }
    if (profileFetched && userProfile !== null) {
      if (
        screen === 'loading' ||
        screen === 'login' ||
        screen === 'profile-setup'
      ) {
        setScreen('character-select');
      }
    }
  }, [isInitializing, isAuthenticated, profileLoading, profileFetched, userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear on logout
  useEffect(() => {
    if (!isAuthenticated) {
      clearCharacter();
      setActiveCharacterId(null);
    }
  }, [isAuthenticated, clearCharacter]);

  const handleSelectCharacter = useCallback(
    (characterId: CharacterId, backendCharacter: Character) => {
      initializeCharacter(backendCharacter, characterId);
      setActiveCharacterId(characterId);
      setScreen('character');
    },
    [initializeCharacter]
  );

  const handleCreateCharacter = useCallback(() => {
    setScreen('character-creation');
  }, []);

  const handleCharacterCreated = useCallback(() => {
    setScreen('character-select');
    queryClient.invalidateQueries({ queryKey: ['characters'] });
  }, [queryClient]);

  const handleAlreadyExists = useCallback(() => {
    setScreen('character-select');
  }, []);

  const handleBackToCharacterSelect = useCallback(() => {
    clearCharacter();
    setActiveCharacterId(null);
    setScreen('character-select');
  }, [clearCharacter]);

  const handleNavigate = useCallback((navScreen: NavScreen) => {
    setScreen(navScreen as AppScreen);
  }, []);

  const handleStartDungeon = useCallback((mode: DungeonMode, level: number) => {
    setDungeonMode(mode);
    setDungeonLevel(level);
    setIsInCombat(true);
    setScreen('dungeon-run');
  }, []);

  const handleDungeonComplete = useCallback(
    (result: {
      survived: boolean;
      xpGained: number;
      loot: GeneratedItem[];
      remainingHp: number;
    }) => {
      setIsInCombat(false);

      // Persist remaining HP
      const newHp = result.remainingHp;
      setCurrentHP(newHp);
      syncHpToBackend(newHp);

      if (result.loot.length > 0) {
        result.loot.forEach((item) => addItemToInventory(item));
        setPendingLoot(result.loot);
      }

      setScreen('dungeon-select');
    },
    [setCurrentHP, syncHpToBackend, addItemToInventory]
  );

  const handleDeath = useCallback(() => {
    setIsInCombat(false);
    if (!character) return;
    if (character.realm === 'Hardcore') {
      clearCharacter();
      setActiveCharacterId(null);
      setScreen('character-select');
    } else {
      applyDeathPenalty(false);
      // Reset HP to full after softcore death
      const maxHp = character.maxHP;
      setCurrentHP(maxHp);
      syncHpToBackend(maxHp);
      setScreen('dungeon-select');
    }
  }, [character, clearCharacter, applyDeathPenalty, setCurrentHP, syncHpToBackend]);

  const handleSaveProfile = async () => {
    if (!profileUsername.trim()) return;
    await saveProfile.mutateAsync({ username: profileUsername.trim() });
  };

  // ── RENDER ──

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img
            src="/assets/generated/logo-sigil.dim_256x256.png"
            alt="Loading"
            className="w-16 h-16 mx-auto mb-4 opacity-60 animate-pulse"
          />
          <p className="text-muted text-sm">Loading Abyss Ascendant…</p>
        </div>
      </div>
    );
  }

  if (screen === 'login') {
    return <LoginScreen />;
  }

  if (screen === 'profile-setup') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-surface-1 border border-border rounded-2xl p-8">
          <div className="text-center mb-6">
            <img
              src="/assets/generated/logo-sigil.dim_256x256.png"
              alt="Abyss Ascendant"
              className="w-12 h-12 mx-auto mb-3 opacity-80"
            />
            <h2 className="text-xl font-bold text-foreground font-display">
              Welcome, Adventurer
            </h2>
            <p className="text-sm text-muted mt-1">
              Choose your name before entering the Abyss
            </p>
          </div>
          <input
            type="text"
            value={profileUsername}
            onChange={(e) => setProfileUsername(e.target.value)}
            placeholder="Enter your name..."
            className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors mb-4"
            onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
          />
          <button
            onClick={handleSaveProfile}
            disabled={!profileUsername.trim() || saveProfile.isPending}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {saveProfile.isPending ? 'Saving…' : 'Enter the Abyss'}
          </button>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (screen === 'character-select') {
    return (
      <>
        <CharacterSelectScreen
          onSelectCharacter={handleSelectCharacter}
          onCreateCharacter={handleCreateCharacter}
        />
        <AppFooter />
      </>
    );
  }

  if (screen === 'character-creation') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-surface-1 border-b border-border px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => setScreen('character-select')}
              className="text-muted hover:text-foreground transition-colors text-sm"
            >
              ← Back
            </button>
            <h1 className="text-lg font-bold text-foreground font-display">Create Character</h1>
          </div>
        </div>
        <CharacterCreation
          onCharacterCreated={handleCharacterCreated}
          onAlreadyExists={handleAlreadyExists}
        />
        <AppFooter />
      </div>
    );
  }

  if (screen === 'dungeon-run' && character) {
    return (
      <DungeonRunScreen
        character={character}
        dungeonMode={dungeonMode}
        dungeonLevel={dungeonLevel}
        onComplete={handleDungeonComplete}
        onDeath={handleDeath}
      />
    );
  }

  // Main game screens require active character
  if (!character) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted">No character selected.</p>
          <button
            onClick={() => setScreen('character-select')}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
          >
            Select Character
          </button>
        </div>
      </div>
    );
  }

  // Only pass valid NavScreen values to Navigation
  const validNavScreens: NavScreen[] = [
    'character',
    'dungeon-select',
    'inventory',
    'marketplace',
    'leaderboard',
    'professions',
    'shrines',
  ];
  const navScreen: NavScreen = validNavScreens.includes(screen as NavScreen)
    ? (screen as NavScreen)
    : 'character';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation
        currentScreen={navScreen}
        onNavigate={handleNavigate}
        characterName={character.name}
        characterLevel={character.level}
        characterRealm={character.realm}
        currentHP={character.currentHP}
        maxHP={character.maxHP}
        onBackToCharacterSelect={handleBackToCharacterSelect}
      />

      <main className="flex-1">
        {screen === 'character' && (
          <CharacterSheet
            character={character}
            onApplyStatPoints={applyStatPoints}
            onPurchaseAbility={purchaseAbility}
            onEquipAbility={equipAbility}
            onUnequipAbility={unequipAbility}
          />
        )}
        {screen === 'dungeon-select' && (
          <DungeonSelectScreen
            character={character}
            onStartDungeon={handleStartDungeon}
            pendingLoot={pendingLoot}
            onClearPendingLoot={() => setPendingLoot([])}
          />
        )}
        {screen === 'inventory' && (
          <InventoryScreen
            character={character}
            onEquipItem={equipItem}
            onUnequipItem={unequipItem}
            onMoveToStash={moveToStash}
            onMoveFromStash={moveFromStash}
          />
        )}
        {screen === 'marketplace' && <MarketplaceScreen character={character} />}
        {screen === 'leaderboard' && (
          <LeaderboardScreen currentUsername={userProfile?.username} />
        )}
        {screen === 'professions' && <ProfessionsPlaceholder />}
        {screen === 'shrines' && <ShrinesPlaceholder />}
      </main>

      <AppFooter />
    </div>
  );
}

function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <img
          src="/assets/generated/logo-sigil.dim_256x256.png"
          alt="Abyss Ascendant"
          className="w-24 h-24 mx-auto mb-6 opacity-90"
        />
        <h1 className="text-4xl font-bold text-foreground font-display mb-2">
          Abyss Ascendant
        </h1>
        <p className="text-muted text-lg">Descend into darkness. Rise through power.</p>
      </div>

      <button
        onClick={login}
        disabled={isLoggingIn}
        className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
      >
        {isLoggingIn ? 'Connecting…' : 'Enter the Abyss'}
      </button>

      <p className="mt-4 text-xs text-muted">Secured by Internet Identity</p>

      <div className="absolute bottom-4">
        <AppFooter />
      </div>
    </div>
  );
}

function AppFooter() {
  const appId =
    typeof window !== 'undefined'
      ? encodeURIComponent(window.location.hostname)
      : 'abyss-ascendant';
  return (
    <footer className="py-4 text-center text-xs text-muted border-t border-border mt-auto">
      <span>© {new Date().getFullYear()} Abyss Ascendant · Built with </span>
      <span className="text-red-400">♥</span>
      <span> using </span>
      <a
        href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        caffeine.ai
      </a>
    </footer>
  );
}
