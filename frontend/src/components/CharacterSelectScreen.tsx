import React, { useState } from 'react';
import { Character } from '../backend';
import { useDeleteCharacter } from '../hooks/useQueries';
import HealthBar from './HealthBar';
import { calculateMaxHp } from '../types/game';
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
import { Trash2, Loader2, Plus, Shield, Sword, Skull, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CharacterWithId {
  id: number;
  character: Character;
}

interface CharacterSelectScreenProps {
  characters: CharacterWithId[];
  onSelectCharacter: (characterId: number) => void;
  onCreateCharacter: () => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export default function CharacterSelectScreen({
  characters,
  onSelectCharacter,
  onCreateCharacter,
  isLoading = false,
  isError = false,
  onRetry,
}: CharacterSelectScreenProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const deleteCharacterMutation = useDeleteCharacter();

  const atCharacterLimit = characters.length >= 8;

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCharacterMutation.mutateAsync(deleteTarget.id);
    } catch {
      // error handled silently; query invalidation will refresh the list
    } finally {
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground font-display">Loading characters...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h2 className="font-display text-xl text-foreground mb-2">Could Not Load Characters</h2>
            <p className="text-muted-foreground text-sm">
              There was a problem connecting to the server. Please check your connection and try again.
            </p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/assets/generated/logo-sigil.dim_256x256.png"
            alt="Logo"
            className="w-20 h-20 mx-auto mb-4 opacity-90"
          />
          <h1 className="font-display text-4xl text-primary mb-2">Select Character</h1>
          <p className="text-muted-foreground text-sm">
            {characters.length === 0
              ? 'No characters yet. Create your first adventurer!'
              : `${characters.length} / 8 character slots used`}
          </p>
        </div>

        {/* Character List */}
        <div className="space-y-3 mb-6">
          {characters.map(({ id, character }) => {
            const isDead = (character.status as string) === 'Dead';
            const isHardcore = (character.realm as string) === 'Hardcore';

            // Compute maxHP from the character's Vitality stat using the same formula
            // as the combat engine (vit * 10 + 50). This ensures the select screen
            // shows the correct HP instead of the backend's hardcoded 20.
            const vit = character.baseStats
              ? Number(character.baseStats.vit)
              : Number((character as any).vit ?? 1);
            const maxHP = calculateMaxHp(vit);

            // Read persisted currentHP from backend, clamped to the computed maxHP
            const storedCurrentHP = character.advancedStats
              ? Number(character.advancedStats.currentHP)
              : Number((character as any).currentHP ?? maxHP);
            const currentHP = Math.min(storedCurrentHP, maxHP);

            return (
              <div
                key={id}
                className={`relative flex items-center gap-4 bg-surface-1 border rounded-xl p-4 transition-all ${
                  isDead
                    ? 'border-destructive/30 opacity-60 cursor-not-allowed'
                    : 'border-border hover:border-primary/50 cursor-pointer hover:bg-surface-2'
                }`}
                onClick={() => !isDead && onSelectCharacter(id)}
              >
                {/* Class Icon */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    isDead ? 'bg-destructive/20' : 'bg-primary/20'
                  }`}
                >
                  {isDead ? (
                    <Skull className="w-6 h-6 text-destructive" />
                  ) : isHardcore ? (
                    <Sword className="w-6 h-6 text-primary" />
                  ) : (
                    <Shield className="w-6 h-6 text-primary" />
                  )}
                </div>

                {/* Character Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-lg text-foreground font-semibold truncate">
                      {character.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                        isHardcore
                          ? 'border-destructive/50 text-destructive bg-destructive/10'
                          : 'border-primary/50 text-primary bg-primary/10'
                      }`}
                    >
                      {isHardcore ? '⚔ HC' : '🛡 SC'}
                    </span>
                    {isDead && (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-destructive/50 text-destructive bg-destructive/10 shrink-0">
                        DEAD
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Level {Number(character.level)} · Tier {Number(character.classTier)}
                  </div>
                  {!isDead && <HealthBar currentHP={currentHP} maxHP={maxHP} compact />}
                </div>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ id, name: character.name });
                  }}
                  disabled={deleteCharacterMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Create New Character Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button
                  onClick={onCreateCharacter}
                  disabled={atCharacterLimit}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Plus className="w-5 h-5" />
                  Create New Character
                </Button>
              </div>
            </TooltipTrigger>
            {atCharacterLimit && (
              <TooltipContent>
                <p>Maximum of 8 characters reached</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCharacterMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <footer className="mt-auto pt-10 pb-6 text-muted-foreground text-xs text-center">
        © {new Date().getFullYear()} Dungeon Realm · Built with ❤️ using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
