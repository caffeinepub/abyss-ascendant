import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile, useGetCharacters, useSaveCallerUserProfile } from './hooks/useQueries';
import { useLocalCharacter } from './hooks/useLocalCharacter';
import { useHealthRegen } from './hooks/useHealthRegen';
import { Character } from './backend';
import Navigation, { NavScreen } from './components/Navigation';
import CharacterSelectScreen from './components/CharacterSelectScreen';
import CharacterCreation from './components/CharacterCreation';
import DungeonSelectScreen from './components/DungeonSelectScreen';
import DungeonRunScreen from './components/DungeonRunScreen';
import InventoryScreen from './components/InventoryScreen';
import CharacterSheet from './components/CharacterSheet';
import MarketplaceScreen from './components/MarketplaceScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import ProfessionsPlaceholder from './components/ProfessionsPlaceholder';
import ShrinesPlaceholder from './components/ShrinesPlaceholder';
import AbilitySelectModal from './components/AbilitySelectModal';
import LevelUpModal from './components/LevelUpModal';
import { Toaster } from './components/ui/sonner';

interface CharacterWithId {
  id: number;
  character: Character;
}

type AppScreen =
  | { type: 'login' }
  | { type: 'profile-setup' }
  | { type: 'character-select' }
  | { type: 'character-create' }
  | { type: 'dungeon-run' }
  | { type: 'game'; navScreen: NavScreen };

export default function App() {
  const { identity, clear, login, loginStatus, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const [screen, setScreen] = useState<AppScreen>({ type: 'login' });
  const [selectedCharacterWithId, setSelectedCharacterWithId] = useState<CharacterWithId | null>(null);
  const [activeDungeonLevel, setActiveDungeonLevel] = useState<number>(1);
  const [isInCombat, setIsInCombat] = useState(false);
  const [showAbilityModal, setShowAbilityModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const {
    data: rawCharacters,
    isLoading: charsLoading,
    isError: charsError,
    refetch: refetchChars,
  } = useGetCharacters();

  const { localCharacter, updateHp, applyEquipment, applyAbilities, applyLevelUp, syncHpToBackend } =
    useLocalCharacter(selectedCharacterWithId);

  // Keep refs to localCharacter and selectedCharacterWithId for stable callbacks
  const localCharacterRef = useRef(localCharacter);
  const selectedCharacterWithIdRef = useRef(selectedCharacterWithId);
  useEffect(() => { localCharacterRef.current = localCharacter; }, [localCharacter]);
  useEffect(() => { selectedCharacterWithIdRef.current = selectedCharacterWithId; }, [selectedCharacterWithId]);

  const saveProfile = useSaveCallerUserProfile();

  // Health regen
  useHealthRegen({
    character: localCharacter,
    isInCombat,
    onHpChange: updateHp,
  });

  // Route to appropriate screen based on auth/profile state
  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      setScreen({ type: 'login' });
      return;
    }

    if (profileLoading || !profileFetched) return;

    if (userProfile === null) {
      setScreen({ type: 'profile-setup' });
      return;
    }

    if (screen.type === 'login' || screen.type === 'profile-setup') {
      setScreen({ type: 'character-select' });
    }
  }, [isAuthenticated, isInitializing, profileLoading, profileFetched, userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleLogout = async () => {
    const lc = localCharacterRef.current;
    if (lc) {
      syncHpToBackend(lc.id, lc.stats.currentHp);
    }
    await clear();
    queryClient.clear();
    setSelectedCharacterWithId(null);
    setScreen({ type: 'login' });
  };

  // Accept the full character object directly — no fragile ref lookup needed.
  const handleSelectCharacter = useCallback((id: number, character: Character) => {
    const lc = localCharacterRef.current;
    const sel = selectedCharacterWithIdRef.current;
    if (lc && sel) {
      syncHpToBackend(lc.id, lc.stats.currentHp);
    }
    setSelectedCharacterWithId({ id, character });
    setScreen({ type: 'game', navScreen: 'dungeon-select' });
  }, [syncHpToBackend]);

  const handleBackToCharacterSelect = useCallback(() => {
    const lc = localCharacterRef.current;
    if (lc) {
      syncHpToBackend(lc.id, lc.stats.currentHp);
    }
    setScreen({ type: 'character-select' });
  }, [syncHpToBackend]);

  const handleNavigate = useCallback((navScreen: NavScreen) => {
    setScreen({ type: 'game', navScreen });
  }, []);

  const handleStartDungeon = useCallback((level: number) => {
    setActiveDungeonLevel(level);
    setIsInCombat(true);
    setScreen({ type: 'dungeon-run' });
  }, []);

  const handleDungeonComplete = useCallback((result: { xpEarned: number; finalHp: number; newLevel: number }) => {
    setIsInCombat(false);
    updateHp(result.finalHp);
    setScreen({ type: 'game', navScreen: 'dungeon-select' });
  }, [updateHp]);

  const handleProfileSave = async () => {
    if (!profileUsername.trim()) return;
    await saveProfile.mutateAsync({ username: profileUsername.trim() });
    setScreen({ type: 'character-select' });
  };

  const handleLevelUp = useCallback((newBaseStats: { str: number; dex: number; int: number; vit: number }, newTotalSpent: number) => {
    applyLevelUp(newBaseStats, newTotalSpent);
    setShowLevelUpModal(false);
  }, [applyLevelUp]);

  const handleAbilitiesConfirm = useCallback((abilities: string[]) => {
    applyAbilities(abilities);
    setShowAbilityModal(false);
  }, [applyAbilities]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-display">Loading...</p>
        </div>
      </div>
    );
  }

  if (screen.type === 'login') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-4">
        <div className="text-center">
          <img src="/assets/generated/logo-sigil.dim_256x256.png" alt="Logo" className="w-24 h-24 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl font-display font-bold text-primary mb-2">Dungeon Realm</h1>
          <p className="text-muted-foreground">An epic adventure awaits</p>
        </div>
        <button
          onClick={handleLogin}
          disabled={loginStatus === 'logging-in'}
          className="px-8 py-3 bg-primary text-primary-foreground rounded font-display font-semibold text-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loginStatus === 'logging-in' ? 'Connecting...' : 'Enter the Realm'}
        </button>
        <footer className="absolute bottom-4 text-xs text-muted-foreground">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>{' '}
          © {new Date().getFullYear()}
        </footer>
      </div>
    );
  }

  if (screen.type === 'profile-setup') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-4">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-primary mb-2">Create Your Legend</h1>
          <p className="text-muted-foreground">Choose your adventurer name</p>
        </div>
        <div className="w-full max-w-sm space-y-4">
          <input
            type="text"
            value={profileUsername}
            onChange={e => setProfileUsername(e.target.value)}
            placeholder="Enter your name..."
            className="w-full px-4 py-3 bg-surface-1 border border-border rounded text-foreground placeholder:text-muted-foreground font-display focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={e => e.key === 'Enter' && handleProfileSave()}
          />
          <button
            onClick={handleProfileSave}
            disabled={!profileUsername.trim() || saveProfile.isPending}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded font-display font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saveProfile.isPending ? 'Saving...' : 'Begin Adventure'}
          </button>
        </div>
      </div>
    );
  }

  if (screen.type === 'character-select') {
    return (
      <div className="min-h-screen bg-background">
        <CharacterSelectScreen
          characters={rawCharacters?.map((char, i) => ({ id: i, character: char })) ?? []}
          isLoading={charsLoading}
          isError={charsError}
          onRetry={refetchChars}
          onSelectCharacter={handleSelectCharacter}
          onCreateCharacter={() => setScreen({ type: 'character-create' })}
        />
        <footer className="py-4 text-center text-xs text-muted-foreground">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>{' '}
          © {new Date().getFullYear()}
        </footer>
      </div>
    );
  }

  if (screen.type === 'character-create') {
    return (
      <div className="min-h-screen bg-background">
        <CharacterCreation
          existingCharacters={rawCharacters ?? []}
          onBack={() => setScreen({ type: 'character-select' })}
          onCancel={() => setScreen({ type: 'character-select' })}
          onCharacterCreated={(id) => {
            refetchChars().then(result => {
              if (result.data) {
                setSelectedCharacterWithId({ id, character: result.data[id] });
                setScreen({ type: 'game', navScreen: 'dungeon-select' });
              } else {
                setScreen({ type: 'character-select' });
              }
            });
          }}
        />
      </div>
    );
  }

  if (screen.type === 'dungeon-run') {
    if (!localCharacter) {
      setScreen({ type: 'character-select' });
      return null;
    }
    return (
      <div className="min-h-screen bg-background">
        <DungeonRunScreen
          character={localCharacter}
          dungeonLevel={activeDungeonLevel}
          onComplete={handleDungeonComplete}
          onBack={() => {
            setIsInCombat(false);
            setScreen({ type: 'game', navScreen: 'dungeon-select' });
          }}
        />
      </div>
    );
  }

  // Game screen
  const navScreen = screen.type === 'game' ? screen.navScreen : 'dungeon-select';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation
        currentScreen={navScreen}
        onNavigate={handleNavigate}
        characterName={localCharacter?.name}
        characterLevel={localCharacter?.level}
        characterRealm={localCharacter?.realm}
        currentHP={localCharacter?.stats.currentHp}
        maxHP={localCharacter?.stats.maxHp}
        onBackToCharacterSelect={handleBackToCharacterSelect}
      />

      <main className="flex-1 overflow-auto">
        {navScreen === 'dungeon-select' && (
          <DungeonSelectScreen
            character={localCharacter ?? undefined}
            onStartDungeon={handleStartDungeon}
          />
        )}
        {navScreen === 'inventory' && (
          <InventoryScreen
            character={localCharacter ?? undefined}
            onEquipmentChange={applyEquipment}
          />
        )}
        {navScreen === 'character' && (
          <CharacterSheet
            character={localCharacter}
            onOpenAbilityModal={() => setShowAbilityModal(true)}
            onOpenLevelUpModal={() => setShowLevelUpModal(true)}
          />
        )}
        {navScreen === 'marketplace' && (
          <MarketplaceScreen character={localCharacter} />
        )}
        {navScreen === 'leaderboard' && (
          <LeaderboardScreen currentUsername={userProfile?.username} />
        )}
        {navScreen === 'professions' && <ProfessionsPlaceholder />}
        {navScreen === 'shrines' && <ShrinesPlaceholder />}
      </main>

      {showAbilityModal && localCharacter && (
        <AbilitySelectModal
          character={localCharacter}
          onConfirm={handleAbilitiesConfirm}
          onClose={() => setShowAbilityModal(false)}
        />
      )}

      {showLevelUpModal && localCharacter && (
        <LevelUpModal
          character={localCharacter}
          onConfirm={handleLevelUp}
          onClose={() => setShowLevelUpModal(false)}
        />
      )}

      <footer className="py-3 text-center text-xs text-muted-foreground border-t border-border">
        Built with ❤️ using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          caffeine.ai
        </a>{' '}
        © {new Date().getFullYear()}
      </footer>

      <Toaster />
    </div>
  );
}
