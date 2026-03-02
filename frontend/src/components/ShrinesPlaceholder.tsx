import React from 'react';
import { Flame, Sparkles, Star, Zap } from 'lucide-react';

export default function ShrinesPlaceholder() {
  return (
    <div className="min-h-screen dungeon-bg relative">
      <div className="absolute inset-0 dungeon-overlay" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="panel rounded-sm p-6 text-center space-y-4">
          <div className="flex justify-center gap-4">
            <Flame className="w-10 h-10 text-ember opacity-60 animate-pulse-glow" />
            <Star className="w-10 h-10 text-dungeon-gold opacity-60 animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
            <Sparkles className="w-10 h-10 text-rarity-uncommon opacity-60 animate-pulse-glow" style={{ animationDelay: '1s' }} />
            <Zap className="w-10 h-10 text-stat-dex opacity-60 animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
          </div>
          <h1 className="font-gothic text-3xl text-dungeon-gold tracking-widest">Shrines of Power</h1>
          <div className="tier-badge mx-auto w-fit">Coming Soon</div>
          <p className="text-muted-foreground font-body text-base leading-relaxed max-w-md mx-auto">
            Ancient shrines pulse with forgotten power throughout the Abyss. Sacrifice items to gain
            incremental blessings, unlock hidden bonuses, and commune with the forces that shaped the dungeon.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { icon: Flame, name: 'Ember Shrine', desc: 'Sacrifice for attack power blessings' },
              { icon: Star, name: 'Gold Shrine', desc: 'Offer gold for fortune and luck' },
              { icon: Sparkles, name: 'Arcane Shrine', desc: 'Sacrifice magic items for spell power' },
              { icon: Zap, name: 'Storm Shrine', desc: 'Offer speed items for agility boons' },
            ].map(({ icon: Icon, name, desc }) => (
              <div key={name} className="panel rounded-sm p-3 text-center opacity-50">
                <Icon className="w-6 h-6 text-ember mx-auto mb-2" />
                <div className="font-gothic text-xs text-dungeon-gold">{name}</div>
                <div className="text-xs text-muted-foreground mt-1">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
