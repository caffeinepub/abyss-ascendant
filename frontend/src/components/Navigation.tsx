import React from 'react';
import { Sword, Package, ShoppingBag, Trophy, Hammer, Flame, LogOut, ChevronLeft } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import HealthBar from './HealthBar';

export type NavScreen =
  | 'character'
  | 'dungeon-select'
  | 'inventory'
  | 'marketplace'
  | 'leaderboard'
  | 'professions'
  | 'shrines';

interface NavigationProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  characterName?: string;
  characterLevel?: number;
  characterRealm?: string;
  currentHP?: number;
  maxHP?: number;
  onBackToCharacterSelect?: () => void;
}

export default function Navigation({
  currentScreen,
  onNavigate,
  characterName,
  characterLevel,
  characterRealm,
  currentHP,
  maxHP,
  onBackToCharacterSelect,
}: NavigationProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const navItems: { screen: NavScreen; icon: React.ReactNode; label: string }[] = [
    { screen: 'character', icon: <Sword className="w-4 h-4" />, label: 'Character' },
    { screen: 'dungeon-select', icon: <Flame className="w-4 h-4" />, label: 'Dungeon' },
    { screen: 'inventory', icon: <Package className="w-4 h-4" />, label: 'Inventory' },
    { screen: 'marketplace', icon: <ShoppingBag className="w-4 h-4" />, label: 'Market' },
    { screen: 'leaderboard', icon: <Trophy className="w-4 h-4" />, label: 'Ranks' },
    { screen: 'professions', icon: <Hammer className="w-4 h-4" />, label: 'Crafting' },
  ];

  return (
    <header className="bg-surface-1 border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Left: Logo + Character info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              {onBackToCharacterSelect && (
                <button
                  onClick={onBackToCharacterSelect}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-all"
                  title="Back to character select"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <img
                src="/assets/generated/logo-sigil.dim_256x256.png"
                alt="Abyss Ascendant"
                className="w-7 h-7 opacity-80"
              />
            </div>
            {characterName && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-foreground truncate font-display">
                    {characterName}
                  </span>
                  {characterLevel && (
                    <span className="text-xs text-muted flex-shrink-0">Lv.{characterLevel}</span>
                  )}
                  {characterRealm && (
                    <span
                      className={`text-xs px-1 py-0.5 rounded flex-shrink-0 ${
                        characterRealm === 'Hardcore'
                          ? 'text-red-400 bg-red-900/20'
                          : 'text-blue-400 bg-blue-900/20'
                      }`}
                    >
                      {characterRealm}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Center: Health Bar */}
          {currentHP !== undefined && maxHP !== undefined && maxHP > 0 && (
            <div className="flex-1 max-w-xs hidden sm:block">
              <HealthBar currentHP={currentHP} maxHP={maxHP} />
            </div>
          )}

          {/* Right: Logout */}
          {identity && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-2 transition-all flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>

        {/* Mobile health bar */}
        {currentHP !== undefined && maxHP !== undefined && maxHP > 0 && (
          <div className="sm:hidden pb-2">
            <HealthBar currentHP={currentHP} maxHP={maxHP} compact />
          </div>
        )}

        {/* Nav tabs */}
        <nav className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
          {navItems.map(({ screen, icon, label }) => (
            <button
              key={screen}
              onClick={() => onNavigate(screen)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all
                ${
                  currentScreen === screen
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-foreground hover:border-border'
                }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
