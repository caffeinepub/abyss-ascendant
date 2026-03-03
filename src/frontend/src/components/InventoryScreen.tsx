import React, { useState } from "react";
import type { GeneratedItem } from "../engine/lootGenerator";
import type { LocalCharacter } from "../types/game";
import { ItemCard } from "./ItemTooltip";

interface InventoryScreenProps {
  character: LocalCharacter;
  onEquipItem: (item: GeneratedItem) => void;
  onUnequipItem: (item: GeneratedItem) => void;
  onMoveToStash: (item: GeneratedItem) => void;
  onMoveFromStash: (item: GeneratedItem) => void;
}

type Tab = "inventory" | "stash" | "equipped";

export default function InventoryScreen({
  character,
  onEquipItem,
  onUnequipItem,
  onMoveToStash,
  onMoveFromStash,
}: InventoryScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>("inventory");
  const [selectedItem, setSelectedItem] = useState<GeneratedItem | null>(null);

  const equippedItemsArray: GeneratedItem[] = character.equippedItems ?? [];

  const currentItems: GeneratedItem[] =
    activeTab === "inventory"
      ? character.inventory
      : activeTab === "stash"
        ? character.stash
        : equippedItemsArray;

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
    ? equippedItemsArray.some((i) => i.id === selectedItem.id)
    : false;
  const isInStash = selectedItem
    ? character.stash.some((i) => i.id === selectedItem.id)
    : false;

  const TABS: { id: Tab; label: string; count: number }[] = [
    {
      id: "inventory",
      label: "🎒 Inventory",
      count: character.inventory.length,
    },
    { id: "stash", label: "📦 Stash", count: character.stash.length },
    { id: "equipped", label: "⚔️ Equipped", count: equippedItemsArray.length },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="panel rounded-xl p-5">
        <h2 className="font-display text-xl font-bold text-foreground">
          Inventory
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your equipment and stash. All gear is self-found — no vendors.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.id}
            data-ocid={`inventory.${tab.id}.tab`}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedItem(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "text-primary-foreground"
                : "bg-surface-1 border border-border/50 text-muted-foreground hover:text-foreground"
            }`}
            style={
              activeTab === tab.id ? { background: "oklch(0.65 0.17 38)" } : {}
            }
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? "bg-white/20" : "bg-surface-2"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Item Grid */}
        <div className="md:col-span-2 panel rounded-xl p-4">
          {currentItems.length === 0 ? (
            <div
              data-ocid={`inventory.${activeTab}.empty_state`}
              className="flex flex-col items-center justify-center h-48 text-muted-foreground/30"
            >
              <div className="text-4xl mb-3 opacity-50">
                {activeTab === "inventory"
                  ? "🎒"
                  : activeTab === "stash"
                    ? "📦"
                    : "⚔️"}
              </div>
              <div className="text-sm font-medium">
                {activeTab === "inventory"
                  ? "No items in inventory"
                  : activeTab === "stash"
                    ? "Stash is empty"
                    : "Nothing equipped"}
              </div>
              <div className="text-xs mt-1 opacity-60">
                Find gear by running dungeons!
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentItems.map((item, i) => (
                <div key={item.id} data-ocid={`inventory.item.${i + 1}`}>
                  <ItemCard
                    item={item}
                    onClick={() => handleItemClick(item)}
                    selected={selectedItem?.id === item.id}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Item Detail / Actions */}
        <div className="panel rounded-xl p-4">
          {selectedItem ? (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Selected Item
              </h3>
              <ItemCard item={selectedItem} />

              <div className="space-y-2 pt-2 border-t border-border/30">
                {isEquipped ? (
                  <button
                    type="button"
                    data-ocid="inventory.unequip.button"
                    onClick={handleUnequip}
                    className="w-full py-2 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 text-sm font-semibold transition-all border border-destructive/25"
                  >
                    Unequip
                  </button>
                ) : (
                  <button
                    type="button"
                    data-ocid="inventory.equip.button"
                    onClick={handleEquip}
                    className="w-full py-2 rounded-lg text-sm font-semibold transition-opacity"
                    style={{
                      background: "oklch(0.65 0.17 38 / 0.25)",
                      color: "oklch(0.65 0.17 38)",
                      border: "1px solid oklch(0.65 0.17 38 / 0.35)",
                    }}
                  >
                    Equip
                  </button>
                )}

                {!isEquipped &&
                  (isInStash ? (
                    <button
                      type="button"
                      data-ocid="inventory.move-from-stash.button"
                      onClick={handleMoveFromStash}
                      className="w-full py-2 rounded-lg bg-surface-2 text-muted-foreground hover:text-foreground text-sm font-semibold transition-all border border-border/30"
                    >
                      Move to Inventory
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-ocid="inventory.move-to-stash.button"
                      onClick={handleMoveToStash}
                      className="w-full py-2 rounded-lg bg-surface-2 text-muted-foreground hover:text-foreground text-sm font-semibold transition-all border border-border/30"
                    >
                      Move to Stash
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/25 py-8">
              <div className="text-3xl mb-2 opacity-50">🗡️</div>
              <div className="text-sm text-center">
                Select an item to see actions
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
