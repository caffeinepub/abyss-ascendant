import React from 'react';
import { Sword, Shield, Map, Package, ShoppingBag, Trophy, Hammer, Sparkles, ChevronLeft, LogOut, Loader2 } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import HealthBar from './HealthBar';

export type NavScreen = 'character' | 'dungeon-select' | 'inventory' | 'marketplace' | 'leaderboard' | 'professions' | 'shrines';

interface NavigationProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  characterName?: string;
  characterLevel?: number;
  characterRealm?: string;
  currentHP?: number;
  maxHP?: number;
  onBackToCharacterSelect: () => void;
  isSavingHp?: boolean;
}

const NAV_ITEMS: { screen: NavScreen; label: string; icon: React.ReactNode }[] = [
  { screen: 'character', label: 'Character', icon: <Shield className="w-4 h-4" /> },
  { screen: 'dungeon-select', label: 'Dungeon', icon: <Sword className="w-4 h-4" /> },
  { screen: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
  { screen: 'marketplace', label: 'Market', icon: <ShoppingBag className="w-4 h-4" /> },
  { screen: 'leaderboard', label: 'Ranks', icon: <Trophy className="w-4 h-4" /> },
  { screen: 'professions', label: 'Crafting', icon: <Hammer className="w-4 h-4" /> },
  { screen: 'shrines', label: 'Shrines', icon: <Sparkles className="w-4 h-4" /> },
];

export default function Navigation({
  currentScreen,
  onNavigate,
  characterName,
  characterLevel,
  characterRealm,
  currentHP,
  maxHP,
  onBackToCharacterSelect,
  isSavingHp = false,
}: NavigationProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const showHealthBar = currentHP !== undefined && maxHP !== undefined && maxHP > 0;

  return (
    <header className="sticky top-0 z-40 bg-surface-2 border-b border-border">
      {/* Top bar: character info + back/logout */}
      <div className="flex items-center justify-between px-4 py-2 gap-2">
        <button
          onClick={onBackToCharacterSelect}
          disabled={isSavingHp}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm disabled:opacity-50 disabled:cursor-wait"
          title="Back to character select"
        >
          {isSavingHp ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{isSavingHp ? 'Saving...' : 'Characters'}</span>
        </button>

        <div className="flex-1 min-w-0 text-center">
          {characterName && (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm text-foreground font-semibold truncate max-w-[120px]">
                  {characterName}
                </span>
                {characterLevel !== undefined && (
                  <span className="text-xs text-muted-foreground shrink-0">Lv.{characterLevel}</span>
                )}
                {characterRealm && (
                  <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${
                    characterRealm === 'Hardcore'
                      ? 'border-destructive/50 text-destructive'
                      : 'border-primary/30 text-primary'
                  }`}>
                    {characterRealm === 'Hardcore' ? 'HC' : 'SC'}
                  </span>
                )}
              </div>
              {showHealthBar && (
                <HealthBar currentHP={currentHP!} maxHP={maxHP!} compact />
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Nav tabs */}
      <nav className="flex overflow-x-auto scrollbar-none border-t border-border/50">
        {NAV_ITEMS.map(({ screen, label, icon }) => (
          <button
            key={screen}
            onClick={() => onNavigate(screen)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors flex-1 justify-center ${
              currentScreen === screen
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-1'
            }`}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}
