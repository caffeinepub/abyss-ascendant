import React, { useState } from 'react';
import { LocalCharacter } from '../hooks/useLocalCharacter';
import { GeneratedItem } from '../engine/lootGenerator';
import { useGetMarketplaceListings, useListItemForSale, useBuyItem } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface MarketplaceScreenProps {
  character: LocalCharacter;
}

const RARITY_COLORS: Record<string, string> = {
  Common: 'text-foreground',
  Uncommon: 'text-green-400',
  Rare: 'text-blue-400',
  Legendary: 'text-yellow-400',
};

export default function MarketplaceScreen({ character }: MarketplaceScreenProps) {
  const { identity } = useInternetIdentity();
  const [listingItemId, setListingItemId] = useState<string | null>(null);
  const [listingPrice, setListingPrice] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'sell'>('browse');

  const { data: listings = [], isLoading: listingsLoading } = useGetMarketplaceListings();
  const listItemMutation = useListItemForSale();
  const buyItemMutation = useBuyItem();

  const inventoryItems = [...character.inventory, ...character.stash];

  function handleListItem(item: GeneratedItem) {
    setListingItemId(item.id);
    setListingPrice('');
  }

  async function handleConfirmListing() {
    if (!listingItemId || !listingPrice) return;
    const priceIcp = parseFloat(listingPrice);
    if (isNaN(priceIcp) || priceIcp <= 0) return;
    // Convert ICP to e8s (1 ICP = 100_000_000 e8s)
    const priceE8s = BigInt(Math.floor(priceIcp * 100_000_000));
    await listItemMutation.mutateAsync({ itemId: listingItemId, price: priceE8s });
    setListingItemId(null);
    setListingPrice('');
  }

  async function handleBuy(itemId: string) {
    await buyItemMutation.mutateAsync(itemId);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">⚖️ Marketplace</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Trade gear with other adventurers using ICP tokens.
            </p>
          </div>
          {identity && (
            <div className="text-right text-sm">
              <div className="text-muted-foreground text-xs">Wallet</div>
              <div className="text-foreground font-mono text-xs truncate max-w-[120px]">
                {identity.getPrincipal().toString().slice(0, 12)}…
              </div>
            </div>
          )}
        </div>

        {/* ICP Notice */}
        <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400">
          💡 All listings are priced in <strong>ICP</strong>. A 2% listing fee applies to all sales.
          Real ICP transactions coming soon.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['browse', 'sell'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'browse' ? '🔍 Browse' : '💰 Sell'}
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
            Active Listings
          </h3>
          {listingsLoading ? (
            <div className="text-center text-muted-foreground py-8 animate-pulse">
              Loading listings…
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <div className="text-3xl mb-2">📭</div>
              <div>No items listed yet.</div>
              <div className="text-xs mt-1">Be the first to list an item!</div>
            </div>
          ) : (
            <div className="space-y-2">
              {listings
                .filter((l) => l.active)
                .map((listing) => {
                  const priceIcp = Number(listing.price) / 100_000_000;
                  const isOwn =
                    identity &&
                    listing.seller.toString() === identity.getPrincipal().toString();
                  return (
                    <div
                      key={listing.item.id}
                      className="flex items-center gap-3 bg-background rounded-lg p-3"
                    >
                      <span className="text-2xl">
                        {listing.item.itemType === 'Weapon'
                          ? '⚔️'
                          : listing.item.itemType === 'Armor'
                          ? '🛡️'
                          : '💎'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-semibold text-sm ${
                            RARITY_COLORS[listing.item.rarity] ?? 'text-foreground'
                          }`}
                        >
                          {listing.item.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {listing.item.rarity} {listing.item.itemType}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary">
                          {priceIcp.toFixed(4)} ICP
                        </div>
                        {!isOwn && (
                          <button
                            onClick={() => handleBuy(listing.item.id)}
                            disabled={buyItemMutation.isPending}
                            className="text-xs mt-1 px-3 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 transition-all"
                          >
                            {buyItemMutation.isPending ? '…' : 'Buy'}
                          </button>
                        )}
                        {isOwn && (
                          <span className="text-xs text-muted-foreground">Your listing</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Sell Tab */}
      {activeTab === 'sell' && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
            Your Inventory
          </h3>
          {inventoryItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <div className="text-3xl mb-2">🎒</div>
              <div>No items to sell.</div>
              <div className="text-xs mt-1">Find gear in dungeons first!</div>
            </div>
          ) : (
            <div className="space-y-2">
              {inventoryItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-background rounded-lg p-3"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-semibold text-sm ${
                        RARITY_COLORS[item.rarity] ?? 'text-foreground'
                      }`}
                    >
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.rarity} {item.itemType}
                    </div>
                  </div>
                  {listingItemId === item.id ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={listingPrice}
                          onChange={(e) => setListingPrice(e.target.value)}
                          placeholder="ICP price"
                          min="0.0001"
                          step="0.0001"
                          className="w-24 bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <span className="text-xs text-muted-foreground">ICP</span>
                      </div>
                      <button
                        onClick={handleConfirmListing}
                        disabled={listItemMutation.isPending || !listingPrice}
                        className="text-xs px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50"
                      >
                        {listItemMutation.isPending ? '…' : 'List'}
                      </button>
                      <button
                        onClick={() => setListingItemId(null)}
                        className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleListItem(item)}
                      className="text-xs px-3 py-1.5 rounded bg-primary/20 text-primary hover:bg-primary/30 font-semibold transition-all"
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
