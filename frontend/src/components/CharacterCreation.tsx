import React, { useState } from 'react';
import { Realm } from '../backend';
import { useCreateCharacter, CharacterAlreadyExistsError, CharacterLimitReachedError } from '../hooks/useQueries';
import { generateStarterEquipment } from '../engine/lootGenerator';
import { saveStarterEquipmentForCharacter } from '../hooks/useLocalCharacter';

interface LocalStats {
  str: number;
  dex: number;
  int: number;
  vit: number;
}

interface CharacterCreationProps {
  onCharacterCreated: () => void;
  onAlreadyExists?: () => void;
}

const TOTAL_STAT_POINTS = 8;

export default function CharacterCreation({ onCharacterCreated, onAlreadyExists }: CharacterCreationProps) {
  const [name, setName] = useState('');
  const [realm, setRealm] = useState<Realm>(Realm.Softcore);
  const [stats, setStats] = useState<LocalStats>({ str: 1, dex: 1, int: 1, vit: 1 });
  const [error, setError] = useState('');

  const createCharacterMutation = useCreateCharacter();

  const basePoints = 4;
  const spentPoints = stats.str + stats.dex + stats.int + stats.vit - basePoints;
  const remainingPoints = TOTAL_STAT_POINTS - spentPoints;

  function incrementStat(stat: keyof LocalStats) {
    if (remainingPoints <= 0) return;
    setStats((prev) => ({ ...prev, [stat]: prev[stat] + 1 }));
  }

  function decrementStat(stat: keyof LocalStats) {
    if (stats[stat] <= 1) return;
    setStats((prev) => ({ ...prev, [stat]: prev[stat] - 1 }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a character name.');
      return;
    }
    if (name.trim().length < 2 || name.trim().length > 20) {
      setError('Name must be between 2 and 20 characters.');
      return;
    }

    try {
      const characterId = await createCharacterMutation.mutateAsync({
        name: name.trim(),
        realm,
      });

      // Generate and persist starter equipment for the new character
      const { weapon, armor } = generateStarterEquipment();
      saveStarterEquipmentForCharacter(characterId, [weapon, armor]);

      onCharacterCreated();
    } catch (err: unknown) {
      if (err instanceof CharacterAlreadyExistsError) {
        onAlreadyExists?.();
        return;
      }
      if (err instanceof CharacterLimitReachedError) {
        setError('Maximum 8 characters reached. Delete a character to create a new one.');
        return;
      }
      const msg = err instanceof Error ? err.message : 'Failed to create character.';
      setError(msg);
    }
  }

  const statDescriptions: Record<keyof LocalStats, string> = {
    str: 'Increases physical damage and carry weight.',
    dex: 'Increases attack speed, dodge, and critical hit chance.',
    int: 'Increases magic damage and mana pool.',
    vit: 'Increases maximum HP and defense.',
  };

  const statLabels: Record<keyof LocalStats, string> = {
    str: 'Strength',
    dex: 'Dexterity',
    int: 'Intelligence',
    vit: 'Vitality',
  };

  const statIcons: Record<keyof LocalStats, string> = {
    str: '💪',
    dex: '🏃',
    int: '🧠',
    vit: '❤️',
  };

  const isLoading = createCharacterMutation.isPending;
  const statKeys = Object.keys(stats) as (keyof LocalStats)[];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <img
            src="/assets/generated/logo-sigil.dim_256x256.png"
            alt="Sigil"
            className="w-20 h-20 mx-auto mb-4 opacity-90"
          />
          <h1 className="text-3xl font-bold text-primary tracking-widest uppercase font-display">
            Create Your Hero
          </h1>
          <p className="text-muted mt-2 text-sm">
            Forge your legend in the depths below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Character Name */}
          <div className="bg-surface-1 border border-border rounded-lg p-5">
            <label className="block text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">
              Character Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your hero's name..."
              maxLength={20}
              disabled={isLoading}
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
          </div>

          {/* Realm Selection */}
          <div className="bg-surface-1 border border-border rounded-lg p-5">
            <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              Choose Realm
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: Realm.Softcore,
                  label: 'Softcore',
                  icon: '🛡️',
                  desc: 'Death causes XP loss. Your journey continues.',
                },
                {
                  value: Realm.Hardcore,
                  label: 'Hardcore',
                  icon: '💀',
                  desc: 'Death is permanent. One life, one legend.',
                },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRealm(r.value)}
                  disabled={isLoading}
                  className={`p-4 rounded-lg border-2 text-left transition-all disabled:opacity-50 ${
                    realm === r.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface-2 text-muted hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{r.icon}</div>
                  <div className="font-bold text-sm">{r.label}</div>
                  <div className="text-xs mt-1 opacity-80">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Stat Allocation */}
          <div className="bg-surface-1 border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Allocate Stats
              </label>
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${
                  remainingPoints > 0
                    ? 'bg-primary/20 text-primary'
                    : 'bg-surface-2 text-muted'
                }`}
              >
                {remainingPoints} points remaining
              </span>
            </div>

            <div className="space-y-3">
              {statKeys.map((stat) => (
                <div key={String(stat)} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{statIcons[stat]}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{statLabels[stat]}</div>
                    <div className="text-xs text-muted">{statDescriptions[stat]}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => decrementStat(stat)}
                      disabled={stats[stat] <= 1 || isLoading}
                      className="w-7 h-7 rounded border border-border bg-surface-2 text-foreground hover:bg-surface-1 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold text-foreground text-lg">
                      {stats[stat]}
                    </span>
                    <button
                      type="button"
                      onClick={() => incrementStat(stat)}
                      disabled={remainingPoints <= 0 || isLoading}
                      className="w-7 h-7 rounded border border-border bg-surface-2 text-foreground hover:bg-surface-1 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {remainingPoints > 0 && (
              <p className="text-xs text-amber-500 mt-3 text-center">
                ⚠️ You have {remainingPoints} unspent point{remainingPoints !== 1 ? 's' : ''}. Allocate all points before continuing.
              </p>
            )}
          </div>

          {/* Starter Equipment Notice */}
          <div className="bg-surface-1 border border-border/50 rounded-lg p-3 flex items-start gap-2">
            <span className="text-yellow-500 text-sm mt-0.5">⚔</span>
            <p className="text-xs text-muted">
              Your hero will start with a <span className="text-foreground font-medium">Worn Sword</span> and{' '}
              <span className="text-foreground font-medium">Worn Chestplate</span> to survive the early dungeons.
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || remainingPoints > 0 || !name.trim()}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                Creating Hero...
              </>
            ) : (
              'Begin Your Journey'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
