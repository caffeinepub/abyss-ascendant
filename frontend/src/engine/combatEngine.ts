import { MONSTER_TEMPLATES, MonsterTemplate, generateMonsterDisplayName } from '../data/monsters';
import { GeneratedItem, generateLoot } from './lootGenerator';

export interface CombatStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  critChance: number;
  ticksBetweenAttacks: number;
}

export interface CharacterCombatStats {
  str: number;
  dex: number;
  int: number;
  vit: number;
  level: number;
  equippedItems?: GeneratedItem[];
}

export interface CombatLogEntry {
  type: 'player_attack' | 'monster_attack' | 'player_crit' | 'monster_crit' | 'player_death' | 'monster_death' | 'loot' | 'xp' | 'info';
  message: string;
  value?: number;
}

export interface CombatResult {
  victory: boolean;
  xpGained: number;
  loot: GeneratedItem[];
  log: CombatLogEntry[];
  survived: boolean;
}

export interface MonsterInstance {
  template: MonsterTemplate;
  name: string; // generated display name (with prefix/suffix)
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  ticksBetweenAttacks: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function rollCrit(critChance: number): boolean {
  return Math.random() * 100 < critChance;
}

/**
 * Calculate ticks between attacks for the player based on effective stats.
 * Base is 3 ticks; each 10 Dexterity reduces by 1 tick (minimum 1).
 */
export function calculatePlayerTicksBetweenAttacks(stats: CharacterCombatStats): number {
  const baseTicks = 3;
  const dexBonus = Math.floor(stats.dex / 10);
  return Math.max(1, baseTicks - dexBonus);
}

/**
 * Calculate ticks between attacks for a monster instance.
 */
export function calculateMonsterTicksBetweenAttacks(monster: MonsterInstance): number {
  return monster.ticksBetweenAttacks;
}

export function derivePlayerStats(char: CharacterCombatStats): CombatStats {
  // Base stats from character attributes
  const baseHp = 50 + char.vit * 10 + char.level * 5;
  const baseAttack = 5 + char.str * 2 + char.dex * 1 + Math.floor(char.level / 2);
  const baseDefense = 2 + Math.floor(char.vit / 2) + Math.floor(char.str / 4);
  const baseCrit = 5 + char.dex * 0.5;

  // Accumulate bonuses from equipped items
  let bonusHp = 0;
  let bonusAttack = 0;
  let bonusDefense = 0;
  let bonusCrit = 0;
  // Stat bonuses that feed back into derived stats
  let bonusStr = 0;
  let bonusDex = 0;
  let bonusInt = 0;
  let bonusVit = 0;

  if (char.equippedItems) {
    for (const item of char.equippedItems) {
      // Add base weapon damage
      if (item.itemType === 'Weapon' && item.baseDamage) {
        bonusAttack += item.baseDamage;
      }
      // Add base armor defense
      if (item.itemType === 'Armor' && item.baseDefense) {
        bonusDefense += item.baseDefense;
      }

      // Add affix bonuses
      for (const affix of item.affixes) {
        switch (affix.stat) {
          case 'hp':         bonusHp      += affix.value; break;
          case 'physDmg':    bonusAttack  += affix.value; break;
          case 'magDmg':     bonusAttack  += affix.value; break;
          case 'defense':    bonusDefense += affix.value; break;
          case 'critChance': bonusCrit    += affix.value; break;
          case 'str':        bonusStr     += affix.value; break;
          case 'dex':        bonusDex     += affix.value; break;
          case 'int':        bonusInt     += affix.value; break;
          case 'vit':        bonusVit     += affix.value; break;
        }
      }
    }
  }

  // Apply stat bonuses from affixes to derived values
  // (mirrors the base stat formulas above)
  bonusAttack  += bonusStr * 2 + bonusDex * 1 + bonusInt * 1.5;
  bonusDefense += Math.floor(bonusVit / 2) + Math.floor(bonusStr / 4);
  bonusHp      += bonusVit * 10;
  bonusCrit    += bonusDex * 0.5;

  // Effective dex for ticks calculation includes item bonuses
  const effectiveDex = char.dex + bonusDex;
  const ticksBetweenAttacks = Math.max(1, 3 - Math.floor(effectiveDex / 10));

  return {
    hp: baseHp + bonusHp,
    maxHp: baseHp + bonusHp,
    attack: Math.floor(baseAttack + bonusAttack),
    defense: Math.floor(baseDefense + bonusDefense),
    critChance: clamp(baseCrit + bonusCrit, 5, 75),
    ticksBetweenAttacks,
  };
}

export function spawnMonster(dungeonLevel: number): MonsterInstance {
  const eligibleMonsters = MONSTER_TEMPLATES.filter((m, idx) => {
    const minLevel = idx * 10;
    const maxLevel = (idx + 1) * 15 + 10;
    return dungeonLevel >= minLevel && dungeonLevel <= maxLevel;
  });

  const pool = eligibleMonsters.length > 0 ? eligibleMonsters : MONSTER_TEMPLATES;
  const template = pool[Math.floor(Math.random() * pool.length)];

  // Scale HP with dungeon level
  const scaledHp = Math.floor(template.baseHp * (1 + dungeonLevel * 0.135));
  // Scale attack with dungeon level
  const scaledAttack = Math.floor(template.baseAttack * (1 + dungeonLevel * 0.1));

  // Generate a unique display name with prefix/suffix
  const displayName = generateMonsterDisplayName(template.name);

  return {
    template,
    name: displayName,
    currentHp: scaledHp,
    maxHp: scaledHp,
    attack: scaledAttack,
    defense: template.baseDefense,
    ticksBetweenAttacks: template.ticksBetweenAttacks,
  };
}

export function simulateCombatRound(
  playerStats: CombatStats,
  monster: MonsterInstance
): { playerDamage: number; monsterDamage: number; playerCrit: boolean; monsterCrit: boolean } {
  const playerCrit = rollCrit(playerStats.critChance);
  const monsterCrit = rollCrit(8); // monsters have 8% base crit

  let playerDamage = Math.max(1, playerStats.attack - monster.defense + Math.floor(Math.random() * 5));
  if (playerCrit) playerDamage = Math.floor(playerDamage * 1.75);

  let monsterDamage = Math.max(1, monster.attack - playerStats.defense + Math.floor(Math.random() * 3));
  if (monsterCrit) monsterDamage = Math.floor(monsterDamage * 1.5);

  return { playerDamage, monsterDamage, playerCrit, monsterCrit };
}

export function runFullCombat(
  charStats: CharacterCombatStats,
  dungeonLevel: number,
  dungeonMode: 'Catacombs' | 'Depths' | 'AscensionTrial',
  maxRounds = 50
): CombatResult {
  const playerStats = derivePlayerStats(charStats);
  const monster = spawnMonster(dungeonLevel);

  let playerHp = playerStats.hp;
  const log: CombatLogEntry[] = [];
  let xpGained = 0;
  const loot: GeneratedItem[] = [];

  log.push({
    type: 'info',
    message: `⚔️ Encountered ${monster.name}! (HP: ${monster.maxHp}, ATK: ${monster.attack})`,
  });

  let round = 0;
  while (playerHp > 0 && monster.currentHp > 0 && round < maxRounds) {
    round++;
    const { playerDamage, monsterDamage, playerCrit, monsterCrit } = simulateCombatRound(
      playerStats,
      monster
    );

    // Player attacks first
    monster.currentHp -= playerDamage;
    if (playerCrit) {
      log.push({ type: 'player_crit', message: `💥 CRITICAL HIT! You deal ${playerDamage} damage to ${monster.name}!`, value: playerDamage });
    } else {
      log.push({ type: 'player_attack', message: `⚔️ You deal ${playerDamage} damage to ${monster.name}.`, value: playerDamage });
    }

    if (monster.currentHp <= 0) {
      log.push({ type: 'monster_death', message: `💀 ${monster.name} has been slain!` });
      xpGained += monster.template.xpReward;

      const drop = generateLoot(dungeonLevel, monster.template.lootWeight, dungeonMode);
      if (drop) {
        loot.push(drop);
        log.push({ type: 'loot', message: `🎁 Loot dropped: ${drop.icon} ${drop.name} (${drop.rarity})` });
      }
      break;
    }

    // Monster attacks
    playerHp -= monsterDamage;
    if (monsterCrit) {
      log.push({ type: 'monster_crit', message: `💢 ${monster.name} CRITS you for ${monsterDamage} damage!`, value: monsterDamage });
    } else {
      log.push({ type: 'monster_attack', message: `🗡️ ${monster.name} hits you for ${monsterDamage} damage.`, value: monsterDamage });
    }

    if (playerHp <= 0) {
      log.push({ type: 'player_death', message: `💀 You have been slain by ${monster.name}!` });
      break;
    }
  }

  if (round >= maxRounds && playerHp > 0 && monster.currentHp > 0) {
    log.push({ type: 'info', message: '⏱️ The battle was a stalemate — you retreat.' });
  }

  const victory = monster.currentHp <= 0;
  if (victory && xpGained > 0) {
    log.push({ type: 'xp', message: `✨ Gained ${xpGained} XP!`, value: xpGained });
  }

  return {
    victory,
    xpGained,
    loot,
    log,
    survived: playerHp > 0,
  };
}
