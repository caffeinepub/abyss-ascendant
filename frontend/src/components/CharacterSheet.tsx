import React, { useState } from 'react';
import { LocalCharacter, BaseStats, calculateAvailableAbilityPoints, calculateUnspentStatPoints } from '../types/game';
import { useSpendStatPoints } from '../hooks/useQueries';
import { ABILITIES } from '../data/abilities';
import LevelUpModal from './LevelUpModal';
import AbilitySelectModal from './AbilitySelectModal';
import { Shield, Sword, Zap, Heart, Star, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CharacterSheetProps {
  character: LocalCharacter;
  onUpdateBaseStats: (newBaseStats: BaseStats, newTotalSpent: number) => void;
  onUpdateAbilities: (abilities: string[]) => void;
}

export default function CharacterSheet({ character, onUpdateBaseStats, onUpdateAbilities }: CharacterSheetProps) {
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showAbilityModal, setShowAbilityModal] = useState(false);
  const spendStatPoints = useSpendStatPoints();

  // Single source of truth for unspent stat points
  const unspentStatPoints = calculateUnspentStatPoints(
    character.totalStatPointsEarned,
    character.totalStatPointsSpent
  );

  // Single source of truth for ability points
  const totalAbilityPoints = calculateAvailableAbilityPoints(character.level);
  const usedAbilityPoints = character.abilities.length;

  const xpProgress = character.level < 50
    ? Math.min(100, (character.xp / (character.level * 100)) * 100)
    : 100;

  const handleLevelUpConfirm = async (newBaseStats: BaseStats, newTotalSpent: number) => {
    try {
      // Persist to backend
      await spendStatPoints.mutateAsync({
        characterId: character.id,
        pointsSpent: newTotalSpent,
      });
      onUpdateBaseStats(newBaseStats, newTotalSpent);
      setShowLevelUpModal(false);
    } catch (err) {
      console.error('Failed to save stat allocation:', err);
    }
  };

  const realmColor = character.realm === 'Hardcore' ? 'text-red-400' : 'text-blue-400';
  const realmBg = character.realm === 'Hardcore' ? 'bg-red-950/30 border-red-800/50' : 'bg-blue-950/30 border-blue-800/50';

  return (
    <div className="min-h-screen bg-surface-1 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Character Header */}
        <div className={`rounded-lg border p-4 ${realmBg}`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl text-foreground">{character.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`${realmColor} border-current text-xs`}>
                  {character.realm}
                </Badge>
                <span className="text-muted-foreground text-sm">Level {character.level}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className={`font-medium ${character.status === 'Alive' ? 'text-green-400' : 'text-red-400'}`}>
                {character.status}
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Experience</span>
              <span>{character.xp} / {character.level * 100} XP</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="bg-surface-2 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-foreground">Stats</h3>
            {unspentStatPoints > 0 && (
              <Button
                size="sm"
                onClick={() => setShowLevelUpModal(true)}
                className="flex items-center gap-1 text-xs"
              >
                <Star className="w-3 h-3" />
                {unspentStatPoints} Point{unspentStatPoints !== 1 ? 's' : ''} Available
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatRow icon={<Sword className="w-4 h-4 text-red-400" />} label="Strength" value={character.stats.str} />
            <StatRow icon={<Zap className="w-4 h-4 text-yellow-400" />} label="Dexterity" value={character.stats.dex} />
            <StatRow icon={<BookOpen className="w-4 h-4 text-blue-400" />} label="Intelligence" value={character.stats.int} />
            <StatRow icon={<Heart className="w-4 h-4 text-pink-400" />} label="Vitality" value={character.stats.vit} />
          </div>

          <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3">
            <StatRow icon={<Heart className="w-4 h-4 text-health-high" />} label="Max HP" value={character.stats.maxHp} />
            <StatRow icon={<Shield className="w-4 h-4 text-cyan-400" />} label="Crit Chance" value={`${character.stats.critChance}%`} />
          </div>

          {/* Stat points summary */}
          <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex justify-between">
            <span>Total earned: {character.totalStatPointsEarned}</span>
            <span>Spent: {character.totalStatPointsSpent}</span>
            <span className={unspentStatPoints > 0 ? 'text-yellow-400 font-medium' : ''}>
              Available: {unspentStatPoints}
            </span>
          </div>
        </div>

        {/* Abilities */}
        <div className="bg-surface-2 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-foreground">Abilities</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {usedAbilityPoints}/{totalAbilityPoints} slots used
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAbilityModal(true)}
                className="flex items-center gap-1 text-xs"
              >
                Manage
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {character.abilities.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No abilities selected. Click Manage to choose your abilities.
            </p>
          ) : (
            <div className="space-y-2">
              {character.abilities.map(abilityId => {
                const ability = ABILITIES.find(a => a.id === abilityId);
                if (!ability) return null;
                return (
                  <div key={abilityId} className="flex items-center gap-3 bg-surface-1 rounded px-3 py-2 border border-border">
                    <img src="/assets/generated/ability-icon-placeholder.dim_64x64.png" alt="" className="w-8 h-8 rounded" />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">{ability.name}</div>
                      <div className="text-xs text-muted-foreground">{ability.description}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">CD: {ability.cooldown}t</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Equipment Summary */}
        <div className="bg-surface-2 rounded-lg border border-border p-4">
          <h3 className="font-display text-lg text-foreground mb-3">Equipment</h3>
          {character.equippedItems.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-2">No items equipped.</p>
          ) : (
            <div className="space-y-2">
              {character.equippedItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${
                    item.rarity === 'Legendary' ? 'bg-yellow-400' :
                    item.rarity === 'Rare' ? 'bg-blue-400' :
                    item.rarity === 'Uncommon' ? 'bg-green-400' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-foreground">{item.name}</span>
                  <span className="text-muted-foreground text-xs ml-auto">{item.itemType}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showLevelUpModal && unspentStatPoints > 0 && (
        <LevelUpModal
          character={character}
          onConfirm={handleLevelUpConfirm}
          onClose={() => setShowLevelUpModal(false)}
        />
      )}

      {showAbilityModal && (
        <AbilitySelectModal
          character={character}
          onConfirm={(abilities) => {
            onUpdateAbilities(abilities);
            setShowAbilityModal(false);
          }}
          onClose={() => setShowAbilityModal(false)}
        />
      )}
    </div>
  );
}

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}

function StatRow({ icon, label, value }: StatRowProps) {
  return (
    <div className="flex items-center gap-2 bg-surface-1 rounded px-3 py-2 border border-border">
      {icon}
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className="font-mono font-medium text-foreground">{value}</span>
    </div>
  );
}
