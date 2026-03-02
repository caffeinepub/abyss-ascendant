import React, { useState, useEffect } from 'react';
import { LocalCharacter, BaseStats, StatKey, calculateUnspentStatPoints } from '../types/game';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Star } from 'lucide-react';

interface LevelUpModalProps {
  character: LocalCharacter;
  onConfirm: (newBaseStats: BaseStats, totalSpent: number) => void;
  onClose: () => void;
}

const STAT_LABELS: Record<StatKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  int: 'Intelligence',
  vit: 'Vitality',
};

const STAT_DESCRIPTIONS: Record<StatKey, string> = {
  str: 'Increases physical damage',
  dex: 'Increases attack speed and dodge',
  int: 'Increases magical damage',
  vit: 'Increases max HP (+10 per point)',
};

export default function LevelUpModal({ character, onConfirm, onClose }: LevelUpModalProps) {
  // Use the single source of truth for unspent stat points
  const unspentPoints = calculateUnspentStatPoints(
    character.totalStatPointsEarned,
    character.totalStatPointsSpent
  );

  const [allocations, setAllocations] = useState<BaseStats>({
    str: 0,
    dex: 0,
    int: 0,
    vit: 0,
  });

  const pointsAllocated = allocations.str + allocations.dex + allocations.int + allocations.vit;
  const pointsRemaining = unspentPoints - pointsAllocated;

  const handleAdd = (stat: StatKey) => {
    if (pointsRemaining <= 0) return;
    setAllocations(prev => ({ ...prev, [stat]: prev[stat] + 1 }));
  };

  const handleRemove = (stat: StatKey) => {
    if (allocations[stat] <= 0) return;
    setAllocations(prev => ({ ...prev, [stat]: prev[stat] - 1 }));
  };

  const handleConfirm = () => {
    if (pointsAllocated === 0 && unspentPoints > 0) return; // Must allocate at least 1 point if available

    const newBaseStats: BaseStats = {
      str: character.baseStats.str + allocations.str,
      dex: character.baseStats.dex + allocations.dex,
      int: character.baseStats.int + allocations.int,
      vit: character.baseStats.vit + allocations.vit,
    };

    const newTotalSpent = character.totalStatPointsSpent + pointsAllocated;
    onConfirm(newBaseStats, newTotalSpent);
  };

  const canConfirm = pointsAllocated > 0 || unspentPoints === 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-surface-2 border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400" />
            Level Up!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {character.name} reached level {character.level}!
            {unspentPoints > 0
              ? ` You have ${unspentPoints} stat point${unspentPoints !== 1 ? 's' : ''} to allocate.`
              : ' No stat points available.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {/* Points remaining indicator */}
          <div className="flex items-center justify-between bg-surface-1 rounded-md px-3 py-2 border border-border">
            <span className="text-sm text-muted-foreground">Points remaining</span>
            <span className={`font-bold text-lg ${pointsRemaining > 0 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
              {pointsRemaining}
            </span>
          </div>

          {/* Stat allocation rows */}
          {(Object.keys(STAT_LABELS) as StatKey[]).map(stat => {
            const currentValue = character.baseStats[stat];
            const addedValue = allocations[stat];
            const totalValue = currentValue + addedValue;

            return (
              <div key={stat} className="flex items-center gap-3 bg-surface-1 rounded-md px-3 py-2 border border-border">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{STAT_LABELS[stat]}</span>
                    <span className="text-sm font-mono">
                      <span className="text-foreground">{currentValue}</span>
                      {addedValue > 0 && (
                        <span className="text-green-400"> +{addedValue} = {totalValue}</span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{STAT_DESCRIPTIONS[stat]}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleRemove(stat)}
                    disabled={allocations[stat] <= 0}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleAdd(stat)}
                    disabled={pointsRemaining <= 0}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Later
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="font-display"
          >
            Confirm Allocation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
