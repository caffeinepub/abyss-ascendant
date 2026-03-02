import React, { useState } from "react";
import type { GeneratedItem } from "../engine/lootGenerator";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useBuyItem,
  useGetMarketplaceListings,
  useListItemForSale,
} from "../hooks/useQueries";
import type { LocalCharacter } from "../types/game";

interface MarketplaceScreenProps {
  character: LocalCharacter | null;
}

const RARITY_COLORS: Record<string, string> = {
  Common: "text-foreground",
  Uncommon: "text-green-400",
  Rare: "text-blue-400",
  Legendary: "text-yellow-400",
};

const ITEM_TYPE_ICONS: Record<string, string> = {
  Weapon: "⚔️",
  Armor: "🛡️",
  Trinket: "💎",
};

export default function MarketplaceScreen({
  character,
}: MarketplaceScreenProps) {
  const { identity } = useInternetIdentity();
  const [listingItemId, setListingItemId] = useState<string | null>(null);
  const [listingPrice, setListingPrice] = useState("");
  const [activeTab, setActiveTab] = useState<"browse" | "sell">("browse");

  const { data: listings = [], isLoading: listingsLoading } =
    useGetMarketplaceListings();
  const listItemMutation = useListItemForSale();
  const buyItemMutation = useBuyItem();

  const inventoryItems: GeneratedItem[] = character
    ? [...character.inventory, ...character.stash]
    : [];

  function handleListItem(item: GeneratedItem) {
    setListingItemId(item.id);
    setListingPrice("");
  }

  async function handleConfirmListing() {
    if (!listingItemId || !listingPrice) return;
    const price = Number.parseInt(listingPrice, 10);
    if (Number.isNaN(price) || price <= 0) return;
    try {
      await listItemMutation.mutateAsync({
        itemId: listingItemId,
        price: BigInt(price),
      });
      setListingItemId(null);
      setListingPrice("");
    } catch {
      // error handled by mutation state
    }
  }

  async function handleBuyItem(itemId: string) {
    try {
      await buyItemMutation.mutateAsync(itemId);
    } catch {
      // error handled by mutation state
    }
  }

  const callerPrincipal = identity?.getPrincipal().toString();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <h2 className="text-xl font-bold text-foreground font-display">
          Marketplace
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Buy and sell items with other adventurers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["browse", "sell"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-surface-1 border border-border text-muted hover:text-foreground"
            }`}
          >
            {tab === "browse" ? "🛒 Browse" : "💰 Sell"}
          </button>
        ))}
      </div>

      {activeTab === "browse" && (
        <div className="bg-surface-1 border border-border rounded-xl p-4">
          {listingsLoading ? (
            <div className="text-center py-8 text-muted">
              Loading listings...
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <div className="text-4xl mb-2">🏪</div>
              <div>No items listed for sale yet.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => {
                const isOwnListing =
                  listing.seller.toString() === callerPrincipal;
                return (
                  <div
                    key={listing.item.id}
                    className="flex items-center gap-3 bg-surface-2 rounded-lg p-3 border border-border"
                  >
                    <span className="text-2xl">
                      {ITEM_TYPE_ICONS[listing.item.itemType as string] || "📦"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium text-sm ${RARITY_COLORS[listing.item.rarity as string] || "text-foreground"}`}
                      >
                        {listing.item.name}
                      </div>
                      <div className="text-xs text-muted">
                        {listing.item.itemType as string} ·{" "}
                        {listing.item.rarity as string}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-yellow-400">
                        {Number(listing.price)} gold
                      </div>
                      {!isOwnListing && (
                        <button
                          type="button"
                          onClick={() => handleBuyItem(listing.item.id)}
                          disabled={buyItemMutation.isPending}
                          className="text-xs mt-1 px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-all disabled:opacity-50"
                        >
                          Buy
                        </button>
                      )}
                      {isOwnListing && (
                        <span className="text-xs text-muted">Your listing</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "sell" && (
        <div className="bg-surface-1 border border-border rounded-xl p-4">
          {inventoryItems.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <div className="text-4xl mb-2">🎒</div>
              <div>No items in your inventory or stash to sell.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {inventoryItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-surface-2 rounded-lg p-3 border border-border"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium text-sm ${RARITY_COLORS[item.rarity as string] || "text-foreground"}`}
                    >
                      {item.name}
                    </div>
                    <div className="text-xs text-muted">
                      {item.itemType} · {item.rarity as string}
                    </div>
                  </div>
                  {listingItemId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                        placeholder="Price"
                        className="w-20 bg-background border border-border rounded px-2 py-1 text-sm text-foreground"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmListing}
                        disabled={listItemMutation.isPending}
                        className="text-xs px-2 py-1 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-all disabled:opacity-50"
                      >
                        List
                      </button>
                      <button
                        type="button"
                        onClick={() => setListingItemId(null)}
                        className="text-xs px-2 py-1 rounded bg-surface-1 text-muted hover:text-foreground transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleListItem(item)}
                      className="text-xs px-3 py-1.5 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-all"
                    >
                      Sell
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
