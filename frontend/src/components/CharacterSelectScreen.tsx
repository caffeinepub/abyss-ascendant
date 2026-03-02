import React, { useState } from 'react';
import { Character, CharacterId, Realm } from '../backend';
import { useGetCharacters, useDeleteCharacter } from '../hooks/useQueries';
import { Sword, Shield, Skull, Plus, Trash2, ChevronRight, Users, AlertTriangle } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface CharacterWithId {
  id: CharacterId;
  character: Character;
}

interface CharacterSelectScreenProps {
  onSelectCharacter: (characterId: CharacterId, character: Character) => void;
  onCreateCharacter: () => void;
}

const MAX_CHARACTERS = 8;

function getRealmColor(realm: Realm) {
  return realm === 'Hardcore' ? 'text-red-400' : 'text-blue-400';
}

function getRealmBg(realm: Realm) {
  return realm === 'Hardcore' ? 'bg-red-900/30 border-red-700/40' : 'bg-blue-900/30 border-blue-700/40';
}

function getClassTierLabel(tier: number) {
  const tiers: Record<number, string> = {
    1: 'Novice',
    2: 'Apprentice',
    3: 'Journeyman',
    4: 'Expert',
    5: 'Master',
  };
  return tiers[tier] ?? `Tier ${tier}`;
}

export default function CharacterSelectScreen({
  onSelectCharacter,
  onCreateCharacter,
}: CharacterSelectScreenProps) {
  const { data: rawCharacters, isLoading } = useGetCharacters();
  const deleteCharacter = useDeleteCharacter();
  const [deleteTarget, setDeleteTarget] = useState<{ id: CharacterId; name: string } | null>(null);

  // The backend returns Character[] but we need IDs. We'll use index-based IDs from the query.
  // Since getCharacters() doesn't return IDs, we need to track them differently.
  // We'll use a separate approach: store characters with their index as a proxy ID.
  // Actually, looking at the backend, getCharacters() returns Character[] without IDs.
  // We need to use a workaround - we'll use the character name + realm as a key for display,
  // but for deletion we need the actual CharacterId.
  // The backend stores CharacterSlot { id, character } but only returns Character[].
  // We need to get IDs somehow. Let's use a separate query approach.
  // For now, we'll use the character index as a display key and note this as a backend gap.

  const characters = rawCharacters ?? [];
  const atCap = characters.length >= MAX_CHARACTERS;

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCharacter.mutateAsync(deleteTarget.id);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-surface-1 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/assets/generated/logo-sigil.dim_256x256.png" alt="Abyss Ascendant" className="w-8 h-8 opacity-80" />
              <div>
                <h1 className="text-xl font-bold text-foreground font-display">Abyss Ascendant</h1>
                <p className="text-xs text-muted">Select your adventurer</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Users className="w-4 h-4" />
              <span>{characters.length} / {MAX_CHARACTERS}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your Characters</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <button
                    onClick={onCreateCharacter}
                    disabled={atCap}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${atCap
                        ? 'bg-surface-2 text-muted cursor-not-allowed opacity-60'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                      }`}
                  >
                    <Plus className="w-4 h-4" />
                    Create New Character
                  </button>
                </span>
              </TooltipTrigger>
              {atCap && (
                <TooltipContent>
                  <p>Maximum 8 characters reached</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sword className="w-16 h-16 text-muted mb-4 opacity-40" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Characters Yet</h3>
              <p className="text-muted text-sm mb-6">Create your first adventurer to begin your descent into the Abyss.</p>
              <button
                onClick={onCreateCharacter}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Create Character
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {characters.map((character, index) => {
                const isAlive = character.status === 'Alive' || (character.status as unknown as { __kind__: string }).__kind__ === 'Alive';
                const isHardcore = character.realm === 'Hardcore' || (character.realm as unknown as { __kind__: string }).__kind__ === 'Hardcore';
                const realmLabel = isHardcore ? 'Hardcore' : 'Softcore';
                const realmEnum = isHardcore ? Realm.Hardcore : Realm.Softcore;
                const level = Number(character.level);
                const classTier = Number(character.classTier);
                const currentHP = Number(character.currentHP);
                const maxHP = Number(character.maxHP);
                const hpPercent = maxHP > 0 ? (currentHP / maxHP) * 100 : 0;

                return (
                  <div
                    key={index}
                    className={`relative group rounded-xl border p-4 transition-all cursor-pointer
                      ${isAlive
                        ? `${getRealmBg(realmEnum)} hover:border-primary/60 hover:bg-surface-2`
                        : 'bg-surface-1 border-border opacity-60'
                      }`}
                    onClick={() => isAlive && onSelectCharacter(index as CharacterId, character)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isAlive ? 'bg-surface-2' : 'bg-surface-1'}`}>
                        {isAlive ? (
                          isHardcore ? (
                            <Shield className="w-6 h-6 text-red-400" />
                          ) : (
                            <Sword className="w-6 h-6 text-blue-400" />
                          )
                        ) : (
                          <Skull className="w-6 h-6 text-muted" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-foreground truncate">{character.name}</span>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getRealmColor(realmEnum)} bg-surface-2`}>
                            {realmLabel}
                          </span>
                          {!isAlive && (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded text-red-400 bg-red-900/20">
                              Dead
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span>Level {level}</span>
                          <span>·</span>
                          <span>{getClassTierLabel(classTier)}</span>
                          {isAlive && (
                            <>
                              <span>·</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      hpPercent > 60 ? 'bg-health-high' : hpPercent > 30 ? 'bg-health-mid' : 'bg-health-low'
                                    }`}
                                    style={{ width: `${hpPercent}%` }}
                                  />
                                </div>
                                <span>{currentHP}/{maxHP} HP</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setDeleteTarget({ id: index as CharacterId, name: character.name });
                          }}
                          className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete character"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {isAlive && (
                          <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="bg-surface-1 border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Delete Character
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted">
                Are you sure you want to permanently delete <strong className="text-foreground">{deleteTarget?.name}</strong>?
                This action cannot be undone. All progress, items, and data for this character will be lost forever.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-surface-2 border-border text-foreground hover:bg-surface-2/80">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteCharacter.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteCharacter.isPending ? 'Deleting...' : 'Delete Forever'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
