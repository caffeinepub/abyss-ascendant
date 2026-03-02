import React from 'react';
import { Hammer, Wrench, FlaskConical, Fish } from 'lucide-react';

export default function ProfessionsPlaceholder() {
  return (
    <div className="min-h-screen dungeon-bg relative">
      <div className="absolute inset-0 dungeon-overlay" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="panel rounded-sm p-6 text-center space-y-4">
          <div className="flex justify-center gap-4 text-4xl">
            <Hammer className="w-10 h-10 text-ember opacity-60" />
            <Wrench className="w-10 h-10 text-dungeon-gold opacity-60" />
            <FlaskConical className="w-10 h-10 text-rarity-uncommon opacity-60" />
            <Fish className="w-10 h-10 text-stat-dex opacity-60" />
          </div>
          <h1 className="font-gothic text-3xl text-dungeon-gold tracking-widest">Professions</h1>
          <div className="tier-badge mx-auto w-fit">Coming Soon</div>
          <p className="text-muted-foreground font-body text-base leading-relaxed max-w-md mx-auto">
            The ancient crafting halls are being restored. Soon, adventurers will be able to forge weapons,
            brew potions, transmute materials, and master the forgotten arts of the deep.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { icon: Hammer, name: 'Smithing', desc: 'Forge and enhance weapons & armor' },
              { icon: FlaskConical, name: 'Alchemy', desc: 'Brew potions and transmute materials' },
              { icon: Wrench, name: 'Tinkering', desc: 'Craft trinkets and magical devices' },
              { icon: Fish, name: 'Gathering', desc: 'Harvest rare materials from the deep' },
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
