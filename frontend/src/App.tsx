import React, { useState, useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
  useGetCharacter,
} from './hooks/useQueries';
import { useLocalCharacter, LocalStats } from './hooks/useLocalCharacter';
import { Realm } from './backend';
import { GeneratedItem } from './engine/lootGenerator';

// Screens
import CharacterCreation from './components/CharacterCreation';
import CharacterSheet from './components/CharacterSheet';
import DungeonSelectScreen from './components/DungeonSelectScreen';
import DungeonRunScreen from './components/DungeonRunScreen';
import InventoryScreen from './components/InventoryScreen';
import MarketplaceScreen from './components/MarketplaceScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import ProfessionsPlaceholder from './components/ProfessionsPlaceholder';
import ShrinesPlaceholder from './components/ShrinesPlaceholder';
import Navigation from './components/Navigation';

type Screen =
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
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const saveProfileMutation = useSaveCallerUserProfile();

  const [usernameInput, setUsernameInput] = useState('');
  const [profileError, setProfileError] = useState('');

  const {
    character,
    initCharacter,
    addXp,
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
    clearCharacter,
  } = useLocalCharacter();

  // Query backend for existing character
  const {
    data: backendCharacter,
    isLoading: backendCharacterLoading,
    isFetched: backendCharacterFetched,
  } = useGetCharacter();

  const [currentScreen, setCurrentScreen] = useState<Screen>('character');
  const [dungeonMode, setDungeonMode] = useState<DungeonMode>('Catacombs');
  const [dungeonLevel, setDungeonLevel] = useState(1);
  const [pendingLoot, setPendingLoot] = useState<GeneratedItem[]>([]);

  // If backend has a character but local storage doesn't, auto-initialize from backend data.
  // This handles the case where the user has an existing character (e.g., after clearing local storage
  // or logging in on a new device).
  useEffect(() => {
    if (
      isAuthenticated &&
      backendCharacterFetched &&
      backendCharacter !== null &&
      backendCharacter !== undefined &&
      !character
    ) {
      const realm = backendCharacter.realm === Realm.Hardcore ? 'Hardcore' : 'Softcore';
      const allocatedStats: LocalStats = {
        str: Number(backendCharacter.str),
        dex: Number(backendCharacter.dex),
        int: Number(backendCharacter.int),
        vit: Number(backendCharacter.vit),
      };
      initCharacter(backendCharacter.name, realm, allocatedStats);
    }
  }, [isAuthenticated, backendCharacterFetched, backendCharacter, character, initCharacter]);

  // Show profile setup if authenticated but no profile yet
  const showProfileSetup =
    isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  // Show character creation only if:
  // - authenticated
  // - has profile
  // - no local character
  // - backend character query has completed and returned null (no existing character)
  const showCharacterCreation =
    isAuthenticated &&
    !showProfileSetup &&
    !character &&
    backendCharacterFetched &&
    backendCharacter === null;

  // Show loading while we're waiting for the backend character check
  const isCheckingBackendCharacter =
    isAuthenticated &&
    !showProfileSetup &&
    !character &&
    (backendCharacterLoading || !backendCharacterFetched);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    if (!usernameInput.trim() || usernameInput.trim().length < 2) {
      setProfileError('Username must be at least 2 characters.');
      return;
    }
    try {
      await saveProfileMutation.mutateAsync({ username: usernameInput.trim() });
    } catch {
      setProfileError('Failed to save profile. Please try again.');
    }
  }

  function handleCharacterCreationComplete(
    name: string,
    realm: Realm,
    allocatedStats: LocalStats
  ) {
    initCharacter(name, realm === Realm.Hardcore ? 'Hardcore' : 'Softcore', allocatedStats);
    setCurrentScreen('character');
  }

  // Called when createCharacter returns #alreadyExists — skip to character sheet
  function handleCharacterAlreadyExists() {
    // The backend character query will have been invalidated by the mutation.
    // The useEffect above will auto-initialize the local character once the query resolves.
    // Just navigate to the character screen.
    setCurrentScreen('character');
  }

  function handleStartDungeon(mode: DungeonMode, level: number) {
    setDungeonMode(mode);
    setDungeonLevel(level);
    setCurrentScreen('dungeon-run');
  }

  function handleDungeonComplete(result: {
    survived: boolean;
    xpGained: number;
    loot: GeneratedItem[];
  }) {
    if (result.xpGained > 0) {
      addXp(result.xpGained);
    }
    if (result.loot.length > 0) {
      result.loot.forEach((item) => addItemToInventory(item));
      setPendingLoot(result.loot);
    }
    setCurrentScreen('dungeon-select');
  }

  function handleDeath() {
    if (!character) return;
    if (character.realm === 'Hardcore') {
      clearCharacter();
      setCurrentScreen('character');
    } else {
      applyDeathPenalty(false);
      setCurrentScreen('dungeon-select');
    }
  }

  // ── Loading ──
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img
            src="/assets/generated/logo-sigil.dim_256x256.png"
            alt="Loading"
            className="w-16 h-16 mx-auto animate-pulse opacity-70"
          />
          <p className="text-muted-foreground text-sm animate-pulse">Initializing…</p>
        </div>
      </div>
    );
  }

  // ── Not authenticated ──
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // ── Profile setup ──
  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="text-center">
            <img
              src="/assets/generated/logo-sigil.dim_256x256.png"
              alt="Sigil"
              className="w-16 h-16 mx-auto mb-3 opacity-90"
            />
            <h2 className="text-xl font-bold text-foreground">Choose Your Name</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This name will identify you across the realm.
            </p>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter username..."
              maxLength={30}
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {profileError && <p className="text-destructive text-xs">{profileError}</p>}
            <button
              type="submit"
              disabled={saveProfileMutation.isPending}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {saveProfileMutation.isPending ? 'Saving…' : 'Enter the Realm'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Checking for existing backend character ──
  if (isCheckingBackendCharacter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img
            src="/assets/generated/logo-sigil.dim_256x256.png"
            alt="Loading"
            className="w-16 h-16 mx-auto animate-pulse opacity-70"
          />
          <p className="text-muted-foreground text-sm animate-pulse">Loading your hero…</p>
        </div>
      </div>
    );
  }

  // ── Character creation ──
  if (showCharacterCreation) {
    return (
      <CharacterCreation
        onComplete={handleCharacterCreationComplete}
        onAlreadyExists={handleCharacterAlreadyExists}
      />
    );
  }

  // ── Character must exist at this point ──
  if (!character) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground animate-pulse">
          Loading character…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation
        character={character}
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen as Screen)}
        userProfile={userProfile ?? undefined}
      />

      <main className="flex-1 py-6">
        {currentScreen === 'character' && (
          <CharacterSheet
            character={character}
            onApplyStatPoints={applyStatPoints}
            onPurchaseAbility={purchaseAbility}
            onEquipAbility={equipAbility}
            onUnequipAbility={unequipAbility}
          />
        )}

        {currentScreen === 'dungeon-select' && (
          <DungeonSelectScreen
            character={character}
            onStartDungeon={handleStartDungeon}
            pendingLoot={pendingLoot}
            onClearPendingLoot={() => setPendingLoot([])}
          />
        )}

        {currentScreen === 'dungeon-run' && (
          <DungeonRunScreen
            character={character}
            dungeonMode={dungeonMode}
            dungeonLevel={dungeonLevel}
            onComplete={handleDungeonComplete}
            onDeath={handleDeath}
          />
        )}

        {currentScreen === 'inventory' && (
          <InventoryScreen
            character={character}
            onEquipItem={equipItem}
            onUnequipItem={unequipItem}
            onMoveToStash={moveToStash}
            onMoveFromStash={moveFromStash}
          />
        )}

        {currentScreen === 'marketplace' && <MarketplaceScreen character={character} />}

        {currentScreen === 'leaderboard' && (
          <LeaderboardScreen currentUsername={userProfile?.username} />
        )}

        {currentScreen === 'professions' && <ProfessionsPlaceholder />}
        {currentScreen === 'shrines' && <ShrinesPlaceholder />}
      </main>

      <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Abyss Crawler •{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

// ── Login Screen ──
function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <img
          src="/assets/generated/logo-sigil.dim_256x256.png"
          alt="Abyss Crawler"
          className="w-24 h-24 mx-auto opacity-90"
        />
        <div>
          <h1 className="text-4xl font-bold text-primary tracking-widest uppercase">
            Abyss Crawler
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Descend into the darkness. Forge your legend.
          </p>
        </div>
        <button
          onClick={login}
          disabled={isLoggingIn}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isLoggingIn ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              Connecting…
            </>
          ) : (
            'Enter the Abyss'
          )}
        </button>
        <p className="text-xs text-muted-foreground">Secured by Internet Identity</p>
      </div>

      <footer className="absolute bottom-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} •{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
            window.location.hostname
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          Built with ❤️ using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
