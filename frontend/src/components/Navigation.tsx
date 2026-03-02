import React from 'react';
import { LocalCharacter } from '../hooks/useLocalCharacter';
import { UserProfile } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

interface NavigationProps {
  character: LocalCharacter;
  currentScreen: string;
  onNavigate: (screen: string) => void;
  userProfile?: UserProfile;
}

const NAV_ITEMS = [
  { id: 'character',    label: 'Character', icon: '⚔️' },
  { id: 'dungeon-select', label: 'Dungeon',  icon: '🏚️' },
  { id: 'inventory',   label: 'Inventory', icon: '🎒' },
  { id: 'marketplace', label: 'Market',    icon: '⚖️' },
  { id: 'leaderboard', label: 'Ladder',    icon: '🏆' },
  { id: 'professions', label: 'Crafting',  icon: '🔨' },
  { id: 'shrines',     label: 'Shrines',   icon: '🕯️' },
];

export default function Navigation({
  character,
  currentScreen,
  onNavigate,
  userProfile,
}: NavigationProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await clear();
    queryClient.clear();
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/logo-sigil.dim_256x256.png"
            alt="Abyss Crawler"
            className="w-7 h-7 opacity-80"
          />
          <span className="font-bold text-primary tracking-widest text-sm uppercase hidden sm:block">
            Abyss Crawler
          </span>
        </div>

        {/* Character quick info — no gold */}
        <div className="flex items-center gap-4 text-sm">
          <div className="hidden sm:flex items-center gap-3 text-muted-foreground">
            <span className="font-semibold text-foreground">{character.name}</span>
            <span>Lv.{character.level}</span>
            <span className={character.realm === 'Hardcore' ? 'text-red-400' : 'text-blue-400'}>
              {character.realm === 'Hardcore' ? '💀 HC' : '🛡️ SC'}
            </span>
          </div>
          {userProfile && (
            <span className="text-xs text-muted-foreground hidden md:block">
              @{userProfile.username}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Nav tabs */}
      <nav className="flex overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 ${
              currentScreen === item.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}
