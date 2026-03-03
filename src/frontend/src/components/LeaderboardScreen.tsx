import { Shield, Skull, Trophy } from "lucide-react";
import React, { useState } from "react";

interface LeaderboardScreenProps {
  currentUsername?: string;
}

// Mock leaderboard data — backend does not expose a getLeaderboard endpoint yet
const MOCK_SOFTCORE = [
  {
    name: "IronVeil",
    classTier: 3,
    level: 28,
    xp: 85000,
    status: "Alive",
    realm: "Softcore",
  },
  {
    name: "ShadowMark",
    classTier: 2,
    level: 19,
    xp: 22000,
    status: "Alive",
    realm: "Softcore",
  },
  {
    name: "EmberFist",
    classTier: 2,
    level: 15,
    xp: 11000,
    status: "Alive",
    realm: "Softcore",
  },
  {
    name: "VoidWalker",
    classTier: 1,
    level: 9,
    xp: 3200,
    status: "Alive",
    realm: "Softcore",
  },
  {
    name: "CrystalBane",
    classTier: 1,
    level: 7,
    xp: 1900,
    status: "Alive",
    realm: "Softcore",
  },
];

const MOCK_HARDCORE = [
  {
    name: "AbyssLord",
    classTier: 4,
    level: 42,
    xp: 960000,
    status: "Dead",
    realm: "Hardcore",
  },
  {
    name: "BoneReaper",
    classTier: 3,
    level: 35,
    xp: 300000,
    status: "Alive",
    realm: "Hardcore",
  },
  {
    name: "MagmaKing",
    classTier: 2,
    level: 22,
    xp: 37000,
    status: "Dead",
    realm: "Hardcore",
  },
  {
    name: "PlagueBorn",
    classTier: 1,
    level: 12,
    xp: 6200,
    status: "Alive",
    realm: "Hardcore",
  },
];

const TIER_NAMES: Record<number, string> = {
  1: "Wanderer",
  2: "Seeker",
  3: "Vanguard",
  4: "Ascendant",
  5: "Eternal",
};

export default function LeaderboardScreen({
  currentUsername,
}: LeaderboardScreenProps) {
  const [activeRealm, setActiveRealm] = useState<"Softcore" | "Hardcore">(
    "Softcore",
  );

  const entries = activeRealm === "Softcore" ? MOCK_SOFTCORE : MOCK_HARDCORE;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="panel-gold rounded-xl p-5 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-48 h-24 pointer-events-none opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at top right, oklch(0.72 0.14 72), transparent)",
          }}
        />
        <div className="flex items-center gap-3 relative">
          <Trophy className="w-6 h-6 text-dungeon-gold flex-shrink-0 animate-gold-shimmer" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Eternal Ladder
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              The greatest adventurers of the current season
            </p>
          </div>
        </div>
      </div>

      {/* Realm Tabs */}
      <div className="flex gap-2">
        {(["Softcore", "Hardcore"] as const).map((realm) => (
          <button
            type="button"
            key={realm}
            data-ocid={`leaderboard.${realm.toLowerCase()}.tab`}
            onClick={() => setActiveRealm(realm)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeRealm === realm
                ? realm === "Hardcore"
                  ? "bg-destructive/15 text-destructive border border-destructive/40"
                  : "border border-primary/40 text-primary"
                : "bg-surface-1 border border-border/50 text-muted-foreground hover:text-foreground"
            }`}
            style={
              activeRealm === realm && realm === "Softcore"
                ? { background: "oklch(0.65 0.17 38 / 0.15)" }
                : {}
            }
          >
            {realm === "Hardcore" ? (
              <Skull className="w-3.5 h-3.5" />
            ) : (
              <Shield className="w-3.5 h-3.5" />
            )}
            {realm}
          </button>
        ))}
      </div>

      {/* Notice */}
      <div className="panel rounded-lg px-4 py-3 text-xs text-muted-foreground/70">
        <span className="text-dungeon-gold">⚠</span> Rankings update as players
        progress. Season resets wipe all rankings.
        {activeRealm === "Hardcore" && (
          <span className="text-health-low/70 ml-1">
            Fallen Hardcore characters remain until season reset.
          </span>
        )}
      </div>

      {/* Rankings */}
      <div className="panel rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border/60 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest bg-surface-2/50">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Adventurer</div>
          <div className="col-span-2">Class</div>
          <div className="col-span-2 text-center">Level</div>
          <div className="col-span-2 text-right">XP</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        {entries.map((entry, i) => {
          const tierName = TIER_NAMES[entry.classTier] ?? "Wanderer";
          const isCurrentUser = currentUsername
            ? entry.name === currentUsername
            : false;
          const isDead = entry.status === "Dead";

          return (
            <div
              key={entry.name}
              data-ocid={`leaderboard.item.${i + 1}`}
              className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/30 text-sm transition-colors ${
                isCurrentUser ? "bg-primary/8" : "hover:bg-surface-2/60"
              } ${isDead ? "opacity-50" : ""}`}
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center">
                {i === 0 ? (
                  <span className="text-dungeon-gold text-base animate-gold-shimmer">
                    👑
                  </span>
                ) : i === 1 ? (
                  <span className="text-foreground/50 font-bold text-sm">
                    2
                  </span>
                ) : i === 2 ? (
                  <span className="text-ember/70 font-bold text-sm">3</span>
                ) : (
                  <span className="text-muted-foreground/50 text-sm">
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Name */}
              <div className="col-span-4 flex items-center gap-2">
                <span
                  className={`font-semibold ${isCurrentUser ? "text-primary" : "text-foreground"}`}
                >
                  {entry.name}
                </span>
                {isCurrentUser && (
                  <span className="text-xs text-primary/60">(you)</span>
                )}
              </div>

              {/* Class */}
              <div className="col-span-2 flex items-center">
                <span className="text-xs px-2 py-0.5 rounded-md bg-primary/8 text-primary/70 border border-primary/20">
                  {tierName}
                </span>
              </div>

              {/* Level */}
              <div className="col-span-2 text-center text-muted-foreground text-sm">
                {entry.level}
              </div>

              {/* XP */}
              <div className="col-span-2 text-right text-muted-foreground text-xs">
                {entry.xp.toLocaleString()}
              </div>

              {/* Status */}
              <div className="col-span-1 text-right">
                {isDead ? (
                  <span className="text-health-low/70" title="Fallen">
                    ☠
                  </span>
                ) : (
                  <span className="text-health-high" title="Alive">
                    ●
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <div
            data-ocid="leaderboard.empty_state"
            className="flex flex-col items-center justify-center h-32 text-muted-foreground/30"
          >
            <Trophy className="w-7 h-7 mb-2" />
            <div className="text-sm">No adventurers ranked yet</div>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground/40 text-center">
        Rankings: Class Tier → Level → XP. Season resets wipe all rankings.
      </div>
    </div>
  );
}
