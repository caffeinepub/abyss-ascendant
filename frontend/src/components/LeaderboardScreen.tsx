import React, { useState } from 'react';
import { Trophy, Skull, Shield } from 'lucide-react';

interface LeaderboardScreenProps {
  currentUsername?: string;
}

// Mock leaderboard data — backend does not expose a getLeaderboard endpoint yet
const MOCK_SOFTCORE = [
  { name: 'IronVeil',    classTier: 3, level: 28, xp: 85000,  status: 'Alive', realm: 'Softcore' },
  { name: 'ShadowMark',  classTier: 2, level: 19, xp: 22000,  status: 'Alive', realm: 'Softcore' },
  { name: 'EmberFist',   classTier: 2, level: 15, xp: 11000,  status: 'Alive', realm: 'Softcore' },
  { name: 'VoidWalker',  classTier: 1, level: 9,  xp: 3200,   status: 'Alive', realm: 'Softcore' },
  { name: 'CrystalBane', classTier: 1, level: 7,  xp: 1900,   status: 'Alive', realm: 'Softcore' },
];

const MOCK_HARDCORE = [
  { name: 'AbyssLord',  classTier: 4, level: 42, xp: 960000, status: 'Dead',  realm: 'Hardcore' },
  { name: 'BoneReaper', classTier: 3, level: 35, xp: 300000, status: 'Alive', realm: 'Hardcore' },
  { name: 'MagmaKing',  classTier: 2, level: 22, xp: 37000,  status: 'Dead',  realm: 'Hardcore' },
  { name: 'PlagueBorn', classTier: 1, level: 12, xp: 6200,   status: 'Alive', realm: 'Hardcore' },
];

const TIER_NAMES: Record<number, string> = {
  1: 'Wanderer',
  2: 'Seeker',
  3: 'Vanguard',
  4: 'Ascendant',
  5: 'Eternal',
};

export default function LeaderboardScreen({ currentUsername }: LeaderboardScreenProps) {
  const [activeRealm, setActiveRealm] = useState<'Softcore' | 'Hardcore'>('Softcore');

  const entries = activeRealm === 'Softcore' ? MOCK_SOFTCORE : MOCK_HARDCORE;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Eternal Ladder</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              The greatest adventurers of the current season
            </p>
          </div>
        </div>
      </div>

      {/* Realm Tabs */}
      <div className="flex gap-2">
        {(['Softcore', 'Hardcore'] as const).map((realm) => (
          <button
            key={realm}
            onClick={() => setActiveRealm(realm)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeRealm === realm
                ? realm === 'Hardcore'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {realm === 'Hardcore' ? (
              <Skull className="w-4 h-4" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {realm}
          </button>
        ))}
      </div>

      {/* Notice */}
      <div className="bg-card border border-border rounded-xl p-3 text-xs text-muted-foreground">
        <span className="text-amber-400">⚠</span> Leaderboard shows top adventurers. Rankings
        update as players progress. Season resets wipe all rankings.
        {activeRealm === 'Hardcore' && (
          <span className="text-red-400 ml-1">
            Fallen Hardcore characters remain until season reset.
          </span>
        )}
      </div>

      {/* Rankings */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Adventurer</div>
          <div className="col-span-2">Class</div>
          <div className="col-span-2 text-center">Level</div>
          <div className="col-span-2 text-right">XP</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        {entries.map((entry, i) => {
          const tierName = TIER_NAMES[entry.classTier] ?? 'Wanderer';
          const isCurrentUser = currentUsername ? entry.name === currentUsername : false;
          const isDead = entry.status === 'Dead';

          return (
            <div
              key={entry.name}
              className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 text-sm transition-colors ${
                isCurrentUser ? 'bg-primary/10' : 'hover:bg-muted/30'
              } ${isDead ? 'opacity-60' : ''}`}
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center">
                {i === 0 ? (
                  <span className="text-amber-400 font-bold text-base">👑</span>
                ) : i === 1 ? (
                  <span className="text-muted-foreground font-bold">2</span>
                ) : i === 2 ? (
                  <span className="text-orange-400 font-bold">3</span>
                ) : (
                  <span className="text-muted-foreground">{i + 1}</span>
                )}
              </div>

              {/* Name */}
              <div className="col-span-4 flex items-center gap-2">
                <span
                  className={`font-semibold ${
                    isCurrentUser ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {entry.name}
                </span>
                {isCurrentUser && (
                  <span className="text-xs text-primary">(you)</span>
                )}
              </div>

              {/* Class */}
              <div className="col-span-2 flex items-center">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {tierName}
                </span>
              </div>

              {/* Level */}
              <div className="col-span-2 text-center text-muted-foreground">{entry.level}</div>

              {/* XP */}
              <div className="col-span-2 text-right text-muted-foreground text-xs">
                {entry.xp.toLocaleString()}
              </div>

              {/* Status */}
              <div className="col-span-1 text-right">
                {isDead ? (
                  <span className="text-red-400" title="Fallen">
                    ☠
                  </span>
                ) : (
                  <span className="text-green-400" title="Alive">
                    ●
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/50">
            <Trophy className="w-8 h-8 mb-2" />
            <div className="text-sm">No adventurers ranked yet</div>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Rankings are based on Class Tier → Level → XP. Season resets wipe all rankings.
      </div>
    </div>
  );
}
