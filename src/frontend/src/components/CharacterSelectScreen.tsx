import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Shield,
  Skull,
  Swords,
} from "lucide-react";
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

const CLASS_COLORS: Record<string, string> = {
  Warrior: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  Rogue: "text-green-400 bg-green-400/10 border-green-400/30",
  Mage: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

const CLASS_ICONS: Record<string, React.ReactNode> = {
  Warrior: <Swords className="w-3 h-3" />,
  Rogue: <Shield className="w-3 h-3" />,
  Mage: <span className="text-xs">✦</span>,
};

const CLASS_IMAGES: Record<string, string> = {
  Warrior: "/assets/generated/class-warrior.dim_256x256.png",
  Rogue: "/assets/generated/class-rogue.dim_256x256.png",
  Mage: "/assets/generated/class-mage.dim_256x256.png",
};

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
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-cinzel text-foreground">
            Failed to Load Characters
          </h2>
          <p className="text-muted-foreground text-sm">
            There was an error loading your characters. Please try again.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface-1">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <img
              src="/assets/generated/logo-sigil.dim_256x256.png"
              alt="Abyss Sigil"
              className="w-10 h-10 object-contain opacity-80"
            />
            <h1 className="text-2xl font-cinzel font-bold text-foreground tracking-wide">
              Select Your Adventurer
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-13">
            Choose a character to enter the dungeon
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-surface-1 rounded-lg border border-border animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Character list */}
            {characters.map((character) => {
              const isDead = character.status === "Dead";
              const classColor =
                CLASS_COLORS[character.class] ||
                "text-muted-foreground bg-muted/10 border-muted/30";
              const classImage = CLASS_IMAGES[character.class];

              return (
                <button
                  type="button"
                  key={character.id}
                  onClick={() => !isDead && onSelectCharacter(character)}
                  disabled={isDead}
                  className={`w-full text-left rounded-lg border transition-all group ${
                    isDead
                      ? "border-border/30 bg-surface-1/50 opacity-60 cursor-not-allowed"
                      : "border-border bg-surface-1 hover:border-primary/50 hover:bg-surface-2 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Class image */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-2 border border-border/50">
                      {classImage ? (
                        <img
                          src={classImage}
                          alt={character.class}
                          className={`w-full h-full object-cover ${isDead ? "grayscale" : ""}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          ⚔️
                        </div>
                      )}
                    </div>

                    {/* Character info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-cinzel font-bold text-foreground text-base">
                          {character.name}
                        </span>
                        {isDead && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <Skull className="w-3 h-3" />
                            Fallen
                          </span>
                        )}
                      </div>

                      {/* Class badge */}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border ${classColor}`}
                        >
                          {CLASS_ICONS[character.class]}
                          {character.class}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Level {character.level}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {typeof character.realm === "string"
                            ? character.realm
                            : "realm" in (character.realm as object)
                              ? String(
                                  Object.keys(character.realm as object)[0],
                                )
                              : "Softcore"}
                        </span>
                      </div>
                    </div>

                    {/* Stats summary */}
                    <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                      <div className="text-center">
                        <div className="font-bold text-foreground">
                          {character.stats.str}
                        </div>
                        <div>STR</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-foreground">
                          {character.stats.dex}
                        </div>
                        <div>DEX</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-foreground">
                          {character.stats.int}
                        </div>
                        <div>INT</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-foreground">
                          {character.stats.vit}
                        </div>
                        <div>VIT</div>
                      </div>
                    </div>

                    {/* Arrow */}
                    {!isDead && (
                      <div className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Create new character button */}
            {characters.length < 8 && (
              <button
                type="button"
                onClick={onCreateCharacter}
                className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-transparent hover:bg-surface-1 transition-all p-6 flex items-center justify-center gap-3 text-muted-foreground hover:text-foreground group"
              >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-cinzel font-medium">
                  Create New Character
                </span>
              </button>
            )}

            {characters.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No characters yet.</p>
                <p className="text-sm">
                  Create your first adventurer to begin!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
