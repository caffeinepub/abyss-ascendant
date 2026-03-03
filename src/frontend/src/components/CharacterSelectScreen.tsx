import {
  AlertTriangle,
  ChevronRight,
  Plus,
  RefreshCw,
  Shield,
  Skull,
  Swords,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import type { LocalCharacter } from "../types/game";

interface CharacterSelectScreenProps {
  characters: LocalCharacter[];
  onSelectCharacter: (character: LocalCharacter) => void;
  onCreateCharacter: () => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

const CLASS_CONFIG: Record<
  string,
  {
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
    glowColor: string;
    fallbackIcon: string;
  }
> = {
  Warrior: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: <Swords className="w-3 h-3" />,
    glowColor: "oklch(0.65 0.17 38 / 0.4)",
    fallbackIcon: "⚔️",
  },
  Rogue: {
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    icon: <Zap className="w-3 h-3" />,
    glowColor: "oklch(0.65 0.17 180 / 0.4)",
    fallbackIcon: "🗡️",
  },
  Mage: {
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    icon: <span className="text-xs leading-none">✦</span>,
    glowColor: "oklch(0.55 0.2 298 / 0.4)",
    fallbackIcon: "🔮",
  },
};

const CLASS_GRADIENTS: Record<string, string> = {
  Warrior:
    "linear-gradient(135deg, oklch(0.18 0.05 38) 0%, oklch(0.12 0.03 38) 100%)",
  Rogue:
    "linear-gradient(135deg, oklch(0.18 0.05 180) 0%, oklch(0.12 0.03 180) 100%)",
  Mage: "linear-gradient(135deg, oklch(0.18 0.05 298) 0%, oklch(0.12 0.03 298) 100%)",
};

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const barColor =
    pct > 60
      ? "oklch(0.58 0.18 145)"
      : pct > 30
        ? "oklch(0.68 0.16 78)"
        : "oklch(0.52 0.2 22)";

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "oklch(0.16 0.018 258)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: barColor,
            boxShadow: `0 0 4px ${barColor}`,
          }}
        />
      </div>
      <span
        className="text-xs font-mono whitespace-nowrap"
        style={{ color: "oklch(0.48 0.01 258)" }}
      >
        {Math.floor(current)}/{max}
      </span>
    </div>
  );
}

export default function CharacterSelectScreen({
  characters,
  onSelectCharacter,
  onCreateCharacter,
  isLoading = false,
  isError = false,
  onRetry,
}: CharacterSelectScreenProps) {
  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div
          className="text-center space-y-4 p-8 max-w-sm w-full animate-slide-up rounded-xl"
          style={{
            background: "oklch(0.12 0.016 258)",
            border: "1px solid oklch(0.22 0.018 258 / 0.6)",
            boxShadow: "0 4px 24px oklch(0.04 0.01 258 / 0.8)",
          }}
        >
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="font-display text-xl text-foreground">
            Failed to Load Characters
          </h2>
          <p className="text-muted-foreground text-sm">
            Could not retrieve your characters. Check your connection and try
            again.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              data-ocid="character-select.error_state"
              className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                background: "oklch(0.65 0.17 38)",
                color: "oklch(0.08 0.01 38)",
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        style={{
          borderBottom: "1px solid oklch(0.22 0.018 258 / 0.5)",
          background:
            "linear-gradient(180deg, oklch(0.11 0.016 258) 0%, oklch(0.09 0.014 258) 100%)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
          <div
            className="w-10 h-10 flex items-center justify-center text-xl flex-shrink-0"
            style={{ color: "oklch(0.65 0.17 38)" }}
          >
            ⚔
          </div>
          <div>
            <h1
              className="font-display text-xl font-bold tracking-wide leading-tight"
              style={{ color: "oklch(0.88 0.008 258)" }}
            >
              Select Your Adventurer
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.48 0.01 258)" }}
            >
              Choose a champion to enter the Abyss
            </p>
          </div>
        </div>
      </div>

      {/* ── Character list ─────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-3" data-ocid="character-select.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl border animate-pulse"
                style={{
                  background: "oklch(0.12 0.016 258)",
                  borderColor: "oklch(0.22 0.018 258 / 0.4)",
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {characters.map((character, listIndex) => {
              const isDead = character.status === "Dead";
              const cfg = CLASS_CONFIG[character.class] ?? CLASS_CONFIG.Warrior;
              const classGradient =
                CLASS_GRADIENTS[character.class] ?? CLASS_GRADIENTS.Warrior;
              const realmStr =
                typeof character.realm === "string"
                  ? character.realm
                  : "realm" in (character.realm as object)
                    ? String(Object.keys(character.realm as object)[0])
                    : "Softcore";
              const isHardcore = realmStr === "Hardcore";

              return (
                <motion.button
                  type="button"
                  key={character.id}
                  data-ocid={`character-select.item.${listIndex + 1}`}
                  onClick={() => !isDead && onSelectCharacter(character)}
                  disabled={isDead}
                  whileHover={!isDead ? { scale: 1.005 } : undefined}
                  whileTap={!isDead ? { scale: 0.998 } : undefined}
                  className="w-full text-left rounded-xl border transition-all duration-200 group overflow-hidden"
                  style={{
                    background: isDead
                      ? "oklch(0.12 0.016 258 / 0.4)"
                      : "oklch(0.12 0.016 258)",
                    borderColor: isDead
                      ? "oklch(0.22 0.018 258 / 0.2)"
                      : "oklch(0.22 0.018 258 / 0.6)",
                    opacity: isDead ? 0.55 : 1,
                    cursor: isDead ? "not-allowed" : "pointer",
                  }}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Portrait */}
                    <div
                      className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{
                        border: "1px solid oklch(0.22 0.018 258 / 0.5)",
                        background: classGradient,
                        boxShadow: !isDead
                          ? `0 0 12px ${cfg.glowColor}`
                          : undefined,
                        opacity: isDead ? 0.5 : 1,
                        filter: isDead ? "grayscale(1)" : undefined,
                      }}
                    >
                      <span className="text-2xl select-none">
                        {cfg.fallbackIcon}
                      </span>
                      {isDead && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Skull className="w-6 h-6 text-destructive" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-display font-bold text-base leading-tight"
                          style={{ color: "oklch(0.88 0.008 258)" }}
                        >
                          {character.name}
                        </span>
                        {isDead && (
                          <span className="text-xs text-destructive font-medium">
                            — Fallen
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {/* Class badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.border} ${cfg.color}`}
                        >
                          {cfg.icon}
                          {character.class}
                        </span>

                        <span
                          className="text-xs"
                          style={{ color: "oklch(0.48 0.01 258)" }}
                        >
                          Lv.{character.level}
                        </span>

                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-bold"
                          style={
                            isHardcore
                              ? {
                                  border:
                                    "1px solid oklch(0.52 0.22 22 / 0.45)",
                                  color: "oklch(0.65 0.2 22)",
                                  background: "oklch(0.52 0.22 22 / 0.1)",
                                }
                              : {
                                  border:
                                    "1px solid oklch(0.65 0.17 38 / 0.35)",
                                  color: "oklch(0.65 0.17 38 / 0.85)",
                                  background: "oklch(0.65 0.17 38 / 0.08)",
                                }
                          }
                        >
                          {isHardcore ? "HC" : "SC"}
                        </span>
                      </div>

                      {/* HP bar */}
                      <HpBar
                        current={character.stats.currentHp}
                        max={character.stats.maxHp}
                      />
                    </div>

                    {/* Stats summary (desktop) */}
                    <div
                      className="hidden sm:grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs flex-shrink-0"
                      style={{ color: "oklch(0.48 0.01 258)" }}
                    >
                      {[
                        ["STR", character.stats.str],
                        ["DEX", character.stats.dex],
                        ["INT", character.stats.int],
                        ["VIT", character.stats.vit],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="flex items-center gap-1.5"
                        >
                          <span
                            className="w-7 uppercase text-[10px] tracking-widest"
                            style={{ color: "oklch(0.38 0.01 258)" }}
                          >
                            {label}
                          </span>
                          <span
                            className="font-bold"
                            style={{ color: "oklch(0.75 0.01 258)" }}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Arrow */}
                    {!isDead && (
                      <ChevronRight
                        className="w-4 h-4 flex-shrink-0 transition-all group-hover:translate-x-0.5"
                        style={{ color: "oklch(0.38 0.01 258)" }}
                      />
                    )}
                  </div>
                </motion.button>
              );
            })}

            {/* Create New Character */}
            {characters.length < 8 && (
              <motion.button
                type="button"
                data-ocid="character-select.open_modal_button"
                onClick={onCreateCharacter}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.998 }}
                className="w-full rounded-xl transition-all duration-200 p-5 flex items-center justify-center gap-3 group"
                style={{
                  border: "2px dashed oklch(0.28 0.018 258 / 0.6)",
                  background: "transparent",
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                  style={{
                    background: "oklch(0.65 0.17 38 / 0.15)",
                    border: "1px solid oklch(0.65 0.17 38 / 0.3)",
                  }}
                >
                  <Plus
                    className="w-3.5 h-3.5"
                    style={{ color: "oklch(0.65 0.17 38 / 0.7)" }}
                  />
                </div>
                <span
                  className="font-display font-medium text-sm tracking-wide transition-colors group-hover:text-foreground"
                  style={{ color: "oklch(0.48 0.01 258)" }}
                >
                  Create New Character
                </span>
              </motion.button>
            )}

            {characters.length === 0 && !isLoading && (
              <div
                data-ocid="character-select.empty_state"
                className="text-center py-16 animate-fade-in"
              >
                {/* Decorative sigil */}
                <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center text-5xl opacity-20">
                  ⚔
                </div>
                <p
                  className="font-display text-base mb-1"
                  style={{ color: "oklch(0.55 0.01 258)" }}
                >
                  No adventurers yet.
                </p>
                <p
                  className="text-sm"
                  style={{ color: "oklch(0.42 0.01 258)" }}
                >
                  Create your first champion to begin the descent.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
