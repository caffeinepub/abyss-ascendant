import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Hammer,
  LogOut,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Sword,
  Trophy,
} from "lucide-react";
import type React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import HealthBar from "./HealthBar";

export type NavScreen =
  | "character"
  | "dungeon-select"
  | "inventory"
  | "marketplace"
  | "leaderboard"
  | "professions"
  | "shrines";

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

const NAV_ITEMS: { screen: NavScreen; label: string; icon: React.ReactNode }[] =
  [
    {
      screen: "character",
      label: "Character",
      icon: <Shield className="w-3.5 h-3.5" />,
    },
    {
      screen: "dungeon-select",
      label: "Dungeon",
      icon: <Sword className="w-3.5 h-3.5" />,
    },
    {
      screen: "inventory",
      label: "Inventory",
      icon: <Package className="w-3.5 h-3.5" />,
    },
    {
      screen: "marketplace",
      label: "Market",
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
    },
    {
      screen: "leaderboard",
      label: "Ranks",
      icon: <Trophy className="w-3.5 h-3.5" />,
    },
    {
      screen: "professions",
      label: "Crafting",
      icon: <Hammer className="w-3.5 h-3.5" />,
    },
    {
      screen: "shrines",
      label: "Shrines",
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
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

  const showHealthBar =
    currentHP !== undefined && maxHP !== undefined && maxHP > 0;
  const isHardcore = characterRealm === "Hardcore";

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.11 0.016 258) 0%, oklch(0.09 0.014 258) 100%)",
        borderBottom: "1px solid oklch(0.22 0.018 258 / 0.5)",
        boxShadow:
          "0 4px 20px oklch(0.04 0.01 258 / 0.7), 0 1px 0 oklch(0.65 0.17 38 / 0.08)",
      }}
    >
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        {/* Back to characters */}
        <button
          type="button"
          data-ocid="nav.back_button"
          onClick={onBackToCharacterSelect}
          disabled={isSavingHp}
          className="flex items-center gap-1.5 transition-colors text-sm disabled:opacity-40 disabled:cursor-wait group"
          style={{ color: "oklch(0.5 0.012 258)" }}
          title="Back to character select"
        >
          <ChevronLeft
            className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
            style={{ color: "oklch(0.55 0.012 258)" }}
          />
          <span className="hidden sm:inline text-xs font-medium group-hover:text-foreground transition-colors">
            Characters
          </span>
        </button>

        {/* Character info — center */}
        <div className="flex-1 min-w-0 flex flex-col items-center gap-0.5">
          {characterName && (
            <>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span
                  className="font-display text-sm font-semibold truncate max-w-[130px] leading-tight"
                  style={{ color: "oklch(0.88 0.008 258)" }}
                >
                  {characterName}
                </span>
                {characterLevel !== undefined && (
                  <span
                    className="text-xs shrink-0"
                    style={{ color: "oklch(0.72 0.14 72)" }}
                  >
                    Lv.{characterLevel}
                  </span>
                )}
                {characterRealm && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0"
                    style={
                      isHardcore
                        ? {
                            border: "1px solid oklch(0.52 0.22 22 / 0.5)",
                            color: "oklch(0.65 0.2 22)",
                            background: "oklch(0.52 0.22 22 / 0.1)",
                          }
                        : {
                            border: "1px solid oklch(0.65 0.17 38 / 0.35)",
                            color: "oklch(0.65 0.17 38 / 0.85)",
                            background: "oklch(0.65 0.17 38 / 0.08)",
                          }
                    }
                  >
                    {isHardcore ? "HC" : "SC"}
                  </span>
                )}
              </div>
              {showHealthBar && (
                <HealthBar currentHP={currentHP!} maxHP={maxHP!} compact />
              )}
            </>
          )}
        </div>

        {/* Logout */}
        <button
          type="button"
          data-ocid="nav.logout_button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 transition-colors text-sm group"
          style={{ color: "oklch(0.5 0.012 258)" }}
          title="Logout"
        >
          <LogOut className="w-3.5 h-3.5 group-hover:text-foreground transition-colors" />
          <span className="hidden sm:inline text-xs font-medium group-hover:text-foreground transition-colors">
            Logout
          </span>
        </button>
      </div>

      {/* ── Nav tabs ──────────────────────────────────────────────── */}
      <nav
        className="flex overflow-x-auto scrollbar-hide"
        style={{ borderTop: "1px solid oklch(0.22 0.018 258 / 0.3)" }}
      >
        {NAV_ITEMS.map(({ screen, label, icon }) => {
          const isActive = currentScreen === screen;
          return (
            <button
              type="button"
              key={screen}
              data-ocid={`nav.${screen}.tab`}
              onClick={() => onNavigate(screen)}
              className="relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center group"
              style={{
                color: isActive
                  ? "oklch(0.72 0.14 72)"
                  : "oklch(0.48 0.01 258)",
                background: isActive
                  ? "oklch(0.65 0.17 38 / 0.07)"
                  : "transparent",
              }}
            >
              {/* Active indicator — ember glow line */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, oklch(0.65 0.17 38), transparent)",
                    boxShadow: "0 0 6px oklch(0.65 0.17 38 / 0.6)",
                  }}
                />
              )}

              {/* Hover indicator */}
              {!isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, oklch(0.65 0.17 38 / 0.4), transparent)",
                  }}
                />
              )}

              <span
                className="transition-colors"
                style={{
                  color: isActive
                    ? "oklch(0.65 0.17 38)"
                    : "oklch(0.48 0.01 258)",
                }}
              >
                {icon}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
