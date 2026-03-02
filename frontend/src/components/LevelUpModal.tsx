import React, { useState } from 'react';
import { LocalCharacter } from '../hooks/useLocalCharacter';
import { Sword, Zap, Brain, Heart, ChevronUp, X } from 'lucide-react';

interface LevelUpModalProps {
  character: LocalCharacter;
  onAllocate: (stat: 'str' | 'dex' | 'int' | 'vit', amount: number) => void;
  onClose: () => void;
}

const STATS = [
  { key: 'str' as const, label: 'Strength', icon: Sword, color: 'text-red-400', desc: '+2 physical damage' },
  { key: 'dex' as const, label: 'Dexterity', icon: Zap, color: 'text-green-400', desc: '+1.5% crit, faster attacks' },
  { key: 'int' as const, label: 'Intelligence', icon: Brain, color: 'text-blue-400', desc: '+2 magic damage' },
  { key: 'vit' as const, label: 'Vitality', icon: Heart, color: 'text-pink-400', desc: '+8 max HP, +1.5 defense' },
];

export default function LevelUpModal({ character, onAllocate, onClose }: LevelUpModalProps) {
  const [pending, setPending] = useState({ str: 0, dex: 0, int: 0, vit: 0 });
  const totalPending = pending.str + pending.dex + pending.int + pending.vit;
  const remaining = character.pendingStatPoints - totalPending;

  const adjust = (stat: keyof typeof pending, delta: number) => {
    const newVal = pending[stat] + delta;
    if (newVal < 0) return;
    if (delta > 0 && remaining <= 0) return;
    setPending((prev) => ({ ...prev, [stat]: newVal }));
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
      <div className="relative z-10 bg-surface-1 border border-border rounded-xl p-6 max-w-md mx-4 w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-primary text-xl font-bold flex items-center gap-2 font-display">
              <ChevronUp className="w-5 h-5" />
              Level Up!
            </h2>
            <p className="text-muted text-xs mt-0.5">
              {character.pendingStatPoints} stat point{character.pendingStatPoints !== 1 ? 's' : ''} to allocate
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {STATS.map(({ key, label, icon: Icon, color, desc }) => (
            <div key={key} className="bg-surface-2 border border-border rounded-lg p-3 flex items-center gap-3">
              <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
              <div className="flex-1">
                <div className={`text-sm font-semibold ${color}`}>{label}</div>
                <div className="text-xs text-muted">{desc}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{character.stats[key]}</span>
                <button
                  onClick={() => adjust(key, -1)}
                  disabled={pending[key] <= 0}
                  className="w-6 h-6 rounded bg-surface-1 border border-border text-foreground hover:bg-surface-2 disabled:opacity-30 text-sm font-bold flex items-center justify-center"
                >
                  −
                </button>
                <span
                  className={`w-6 text-center text-sm font-bold ${
                    pending[key] > 0 ? 'text-primary' : 'text-muted'
                  }`}
                >
                  +{pending[key]}
                </span>
                <button
                  onClick={() => adjust(key, 1)}
                  disabled={remaining <= 0}
                  className="w-6 h-6 rounded bg-surface-1 border border-border text-foreground hover:bg-surface-2 disabled:opacity-30 text-sm font-bold flex items-center justify-center"
                >
                  +
                </button>
                <span className={`text-sm font-bold ${color} w-8 text-right`}>
                  {character.stats[key] + pending[key]}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-muted">Remaining points:</span>
          <span className={`font-bold ${remaining > 0 ? 'text-amber-400' : 'text-muted'}`}>
            {remaining}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={totalPending === 0}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-2 text-muted font-bold uppercase tracking-widest text-sm hover:bg-surface-2/80 transition-all"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
