import React, { useState } from 'react';
import { LocalCharacter } from '../hooks/useLocalCharacter';
import { GeneratedItem } from '../engine/lootGenerator';
import { ItemCard } from './ItemTooltip';

interface InventoryScreenProps {
  character: LocalCharacter;
  onEquipItem: (item: GeneratedItem) => void;
  onUnequipItem: (item: GeneratedItem) => void;
  onMoveToStash: (item: GeneratedItem) => void;
  onMoveFromStash: (item: GeneratedItem) => void;
}

type Tab = 'inventory' | 'stash' | 'equipped';

export default function InventoryScreen({
  character,
  onEquipItem,
  onUnequipItem,
  onMoveToStash,
  onMoveFromStash,
}: InventoryScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [selectedItem, setSelectedItem] = useState<GeneratedItem | null>(null);

  const currentItems =
    activeTab === 'inventory'
      ? character.inventory
      : activeTab === 'stash'
      ? character.stash
      : character.equippedItems;

  function handleItemClick(item: GeneratedItem) {
    setSelectedItem((prev) => (prev?.id === item.id ? null : item));
  }

  function handleEquip() {
    if (!selectedItem) return;
    onEquipItem(selectedItem);
    setSelectedItem(null);
  }

  function handleUnequip() {
    if (!selectedItem) return;
    onUnequipItem(selectedItem);
    setSelectedItem(null);
  }

  function handleMoveToStash() {
    if (!selectedItem) return;
    onMoveToStash(selectedItem);
    setSelectedItem(null);
  }

  function handleMoveFromStash() {
    if (!selectedItem) return;
    onMoveFromStash(selectedItem);
    setSelectedItem(null);
  }

  const isEquipped = selectedItem
    ? character.equippedItems.some((i) => i.id === selectedItem.id)
    : false;
  const isInStash = selectedItem
    ? character.stash.some((i) => i.id === selectedItem.id)
    : false;

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'inventory', label: '🎒 Inventory', count: character.inventory.length },
    { id: 'stash',     label: '📦 Stash',     count: character.stash.length },
    { id: 'equipped',  label: '⚔️ Equipped',  count: character.equippedItems.length },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-xl font-bold text-foreground">Inventory</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your equipment and stash. Gear is self-found — no vendors.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedItem(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-muted'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Item Grid */}
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-4">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/50">
              <div className="text-4xl mb-2">
                {activeTab === 'inventory' ? '🎒' : activeTab === 'stash' ? '📦' : '⚔️'}
              </div>
              <div className="text-sm">
                {activeTab === 'inventory'
                  ? 'No items in inventory'
                  : activeTab === 'stash'
                  ? 'Stash is empty'
                  : 'Nothing equipped'}
              </div>
              <div className="text-xs mt-1">Find gear by running dungeons!</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                  selected={selectedItem?.id === item.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Item Detail / Actions */}
        <div className="bg-card border border-border rounded-xl p-4">
          {selectedItem ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Selected Item
              </h3>
              <ItemCard item={selectedItem} />

              <div className="space-y-2 pt-2 border-t border-border">
                {/* Equip / Unequip */}
                {isEquipped ? (
                  <button
                    onClick={handleUnequip}
                    className="w-full py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 text-sm font-semibold transition-all"
                  >
                    Unequip
                  </button>
                ) : (
                  <button
                    onClick={handleEquip}
                    className="w-full py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-sm font-semibold transition-all"
                  >
                    Equip
                  </button>
                )}

                {/* Move to/from stash */}
                {!isEquipped && (
                  <>
                    {isInStash ? (
                      <button
                        onClick={handleMoveFromStash}
                        className="w-full py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-semibold transition-all"
                      >
                        Move to Inventory
                      </button>
                    ) : (
                      <button
                        onClick={handleMoveToStash}
                        className="w-full py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-semibold transition-all"
                      >
                        Move to Stash
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 py-8">
              <div className="text-3xl mb-2">👆</div>
              <div className="text-sm text-center">Select an item to see actions</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
