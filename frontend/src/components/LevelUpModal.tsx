import React, { useState } from 'react';
import { LocalCharacterState } from '../types/game';
import { Sword, Zap, Brain, Heart, ChevronUp } from 'lucide-react';
import { X } from 'lucide-react';

interface LevelUpModalProps {
  character: LocalCharacterState;
  onAllocate: (stat: 'str' | 'dex' | 'int' | 'vit', amount: number) => void;
  onClose: () => void;
}

const STATS = [
  { key: 'str' as const, label: 'Strength', icon: Sword, color: 'text-stat-str', desc: '+2 physical damage' },
  { key: 'dex' as const, label: 'Dexterity', icon: Zap, color: 'text-stat-dex', desc: '+1.5% crit, faster attacks' },
  { key: 'int' as const, label: 'Intelligence', icon: Brain, color: 'text-stat-int', desc: '+2 magic damage' },
  { key: 'vit' as const, label: 'Vitality', icon: Heart, color: 'text-stat-vit', desc: '+8 max HP, +1.5 defense' },
];

export default function LevelUpModal({ character, onAllocate, onClose }: LevelUpModalProps) {
  const [pending, setPending] = useState({ str: 0, dex: 0, int: 0, vit: 0 });
  const totalPending = pending.str + pending.dex + pending.int + pending.vit;
  const remaining = character.statPoints - totalPending;

  const adjust = (stat: keyof typeof pending, delta: number) => {
    const newVal = pending[stat] + delta;
    if (newVal < 0) return;
    if (delta > 0 && remaining <= 0) return;
    setPending(prev => ({ ...prev, [stat]: newVal }));
  };

  const handleConfirm = () => {
    for (const [stat, amount] of Object.entries(pending)) {
      if (amount > 0) {
        onAllocate(stat as 'str' | 'dex' | 'int' | 'vit', amount);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 panel-gold rounded-sm p-6 max-w-md mx-4 w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-gothic text-dungeon-gold text-xl flex items-center gap-2">
              <ChevronUp className="w-5 h-5" />
              Level Up!
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              {character.statPoints} stat point{character.statPoints !== 1 ? 's' : ''} to allocate
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {STATS.map(({ key, label, icon: Icon, color, desc }) => (
            <div key={key} className="panel rounded-sm p-3 flex items-center gap-3">
              <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
              <div className="flex-1">
                <div className={`text-sm font-gothic ${color}`}>{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{character[key]}</span>
                <button
                  onClick={() => adjust(key, -1)}
                  disabled={pending[key] <= 0}
                  className="w-6 h-6 rounded-sm bg-stone border border-stone-light text-foreground hover:bg-stone-light disabled:opacity-30 text-sm font-bold flex items-center justify-center"
                >
                  −
                </button>
                <span className={`w-6 text-center text-sm font-bold ${pending[key] > 0 ? 'text-dungeon-gold' : 'text-muted-foreground'}`}>
                  +{pending[key]}
                </span>
                <button
                  onClick={() => adjust(key, 1)}
                  disabled={remaining <= 0}
                  className="w-6 h-6 rounded-sm bg-stone border border-stone-light text-foreground hover:bg-stone-light disabled:opacity-30 text-sm font-bold flex items-center justify-center"
                >
                  +
                </button>
                <span className={`text-sm font-bold ${color} w-8 text-right`}>{character[key] + pending[key]}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-muted-foreground">Remaining points:</span>
          <span className={`font-bold ${remaining > 0 ? 'text-ember' : 'text-muted-foreground'}`}>{remaining}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={totalPending === 0}
            className="btn-gold flex-1 py-2 rounded-sm font-gothic tracking-widest uppercase text-sm"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="btn-stone px-4 py-2 rounded-sm font-gothic tracking-widest uppercase text-sm"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
