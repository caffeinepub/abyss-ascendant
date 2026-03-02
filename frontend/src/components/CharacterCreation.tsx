import React, { useState } from 'react';
import { Realm } from '../backend';
import {
  useCreateCharacter,
  useDeleteCharacter,
  CharacterLimitReachedError,
} from '../hooks/useQueries';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, Shield, Sword, Plus } from 'lucide-react';
import { Character } from '../backend';

interface CharacterCreationProps {
  onCharacterCreated: (characterId: number) => void;
  onBack?: () => void;
  existingCharacters?: Character[];
  onCancel?: () => void;
}

const TOTAL_STAT_POINTS = 8;

export default function CharacterCreation({
  onCharacterCreated,
  onBack,
  existingCharacters = [],
  onCancel,
}: CharacterCreationProps) {
  const [name, setName] = useState('');
  const [realm, setRealm] = useState<Realm>(Realm.Softcore);
  const [statPoints, setStatPoints] = useState({ str: 1, dex: 1, int: 1, vit: 1 });
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const createCharacterMutation = useCreateCharacter();
  const deleteCharacterMutation = useDeleteCharacter();

  // Points used above the base of 1 per stat
  const usedPoints =
    statPoints.str - 1 + statPoints.dex - 1 + statPoints.int - 1 + statPoints.vit - 1;
  const remainingPoints = TOTAL_STAT_POINTS - usedPoints;

  const incrementStat = (stat: keyof typeof statPoints) => {
    if (remainingPoints <= 0) return;
    setStatPoints((prev) => ({ ...prev, [stat]: prev[stat] + 1 }));
  };

  const decrementStat = (stat: keyof typeof statPoints) => {
    if (statPoints[stat] <= 1) return;
    setStatPoints((prev) => ({ ...prev, [stat]: prev[stat] - 1 }));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a character name.');
      return;
    }
    if (remainingPoints !== 0) {
      setError(
        `Please allocate all ${TOTAL_STAT_POINTS} stat points (${remainingPoints} remaining).`
      );
      return;
    }
    setError('');

    try {
      const characterId = await createCharacterMutation.mutateAsync({
        name: name.trim(),
        realm,
        str: BigInt(statPoints.str),
        dex: BigInt(statPoints.dex),
        int: BigInt(statPoints.int),
        vit: BigInt(statPoints.vit),
      });

      onCharacterCreated(characterId);
    } catch (err) {
      if (err instanceof CharacterLimitReachedError) {
        setError('You have reached the maximum number of characters (8).');
      } else {
        setError('Failed to create character. Please try again.');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCharacterMutation.mutateAsync(deleteTarget.id);
    } catch {
      setError('Failed to delete character. Please try again.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleBack = onBack || onCancel;

  const statLabels: { key: keyof typeof statPoints; label: string; color: string }[] = [
    { key: 'str', label: 'Strength', color: 'text-red-400' },
    { key: 'dex', label: 'Dexterity', color: 'text-green-400' },
    { key: 'int', label: 'Intelligence', color: 'text-blue-400' },
    { key: 'vit', label: 'Vitality', color: 'text-yellow-400' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-primary mb-2">Create Character</h1>
          <p className="text-muted-foreground text-sm">
            Forge your legend in the realm of darkness
          </p>
        </div>

        {/* Existing Characters with Delete */}
        {existingCharacters.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Your Characters
            </h2>
            <div className="space-y-2">
              {existingCharacters.map((char, idx) => {
                const realmStr = char.realm as string;
                const statusStr = char.status as string;
                const realmLabel = realmStr === 'Hardcore' ? '⚔ Hardcore' : '🛡 Softcore';
                const isDead = statusStr === 'Dead';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-surface-1 border border-border rounded-lg px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-display text-foreground font-semibold">
                        {char.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Lv.{Number(char.level)} · {realmLabel}
                        {isDead && (
                          <span className="ml-2 text-destructive font-medium">· Dead</span>
                        )}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget({ id: idx, name: char.name })}
                      disabled={deleteCharacterMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Creation Form */}
        <div className="bg-surface-1 border border-border rounded-xl p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Character Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              maxLength={24}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Realm */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Realm</label>
            <div className="grid grid-cols-2 gap-3">
              {[Realm.Softcore, Realm.Hardcore].map((r) => (
                <button
                  key={r}
                  onClick={() => setRealm(r)}
                  className={`flex flex-col items-center gap-1 p-4 rounded-lg border-2 transition-all ${
                    realm === r
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {r === Realm.Softcore ? (
                    <Shield className="w-6 h-6" />
                  ) : (
                    <Sword className="w-6 h-6" />
                  )}
                  <span className="font-display text-sm font-semibold">{r}</span>
                  <span className="text-xs opacity-70">
                    {r === Realm.Softcore ? 'Respawn on death' : 'Permanent death'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stat Allocation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">Allocate Stats</label>
              <span
                className={`text-sm font-semibold ${
                  remainingPoints === 0 ? 'text-green-400' : 'text-primary'
                }`}
              >
                {remainingPoints} points remaining
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {statLabels.map(({ key, label, color }) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2"
                >
                  <span className={`text-sm font-medium ${color}`}>{label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrementStat(key)}
                      disabled={statPoints[key] <= 1}
                      className="w-6 h-6 rounded bg-surface-2 text-foreground hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-display font-bold text-foreground">
                      {statPoints[key]}
                    </span>
                    <button
                      onClick={() => incrementStat(key)}
                      disabled={remainingPoints <= 0}
                      className="w-6 h-6 rounded bg-surface-2 text-foreground hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Starter Gear Notice */}
          <div className="bg-background border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground flex items-start gap-2">
            <Plus className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>
              Your character will start with a{' '}
              <span className="text-foreground font-medium">Worn Sword</span> and{' '}
              <span className="text-foreground font-medium">Worn Chestplate</span> equipped.
            </span>
          </div>

          {/* Error */}
          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3">
            {handleBack && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
            )}
            <Button
              onClick={handleCreate}
              disabled={
                createCharacterMutation.isPending || !name.trim() || remainingPoints !== 0
              }
              className="flex-1"
            >
              {createCharacterMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Character'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Character</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCharacterMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteCharacterMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCharacterMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
