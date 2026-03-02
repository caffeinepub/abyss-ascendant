import { MONSTER_TEMPLATES, MonsterTemplate } from '../data/monsters';
import { GeneratedItem, generateLoot } from './lootGenerator';

export interface CombatStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  critChance: number;
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
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function rollCrit(critChance: number): boolean {
  return Math.random() * 100 < critChance;
}

export function derivePlayerStats(char: CharacterCombatStats): CombatStats {
  const baseHp = 50 + char.vit * 10 + char.level * 5;
  const baseAttack = 5 + char.str * 2 + char.dex * 1 + Math.floor(char.level / 2);
  const baseDefense = 2 + Math.floor(char.vit / 2) + Math.floor(char.str / 4);
  const baseCrit = 5 + char.dex * 0.5;

  // Apply item bonuses
  let bonusHp = 0;
  let bonusAttack = 0;
  let bonusDefense = 0;
  let bonusCrit = 0;

  if (char.equippedItems) {
    for (const item of char.equippedItems) {
      for (const affix of item.affixes) {
        switch (affix.stat) {
          case 'hp':         bonusHp      += affix.value; break;
          case 'physDmg':    bonusAttack  += affix.value; break;
          case 'magDmg':     bonusAttack  += affix.value; break;
          case 'defense':    bonusDefense += affix.value; break;
          case 'critChance': bonusCrit    += affix.value; break;
          case 'str':        bonusAttack  += affix.value * 2; break;
          case 'dex':        bonusAttack  += affix.value; bonusCrit += affix.value * 0.5; break;
          case 'int':        bonusAttack  += affix.value * 1.5; break;
          case 'vit':        bonusHp      += affix.value * 10; break;
        }
      }
    }
  }

  return {
    hp: baseHp + bonusHp,
    maxHp: baseHp + bonusHp,
    attack: baseAttack + bonusAttack,
    defense: baseDefense + bonusDefense,
    critChance: clamp(baseCrit + bonusCrit, 5, 75),
  };
}

export function spawnMonster(dungeonLevel: number): MonsterInstance {
  // Pick a monster appropriate for the dungeon level
  const eligibleMonsters = MONSTER_TEMPLATES.filter((m, idx) => {
    const minLevel = idx * 10;
    const maxLevel = (idx + 1) * 15 + 10;
    return dungeonLevel >= minLevel && dungeonLevel <= maxLevel;
  });

  const pool = eligibleMonsters.length > 0 ? eligibleMonsters : MONSTER_TEMPLATES;
  const template = pool[Math.floor(Math.random() * pool.length)];

  // Scale HP with dungeon level — HP scaling reduced by 10% (factor 0.9)
  // Original: baseHp * (1 + dungeonLevel * 0.15)
  // New:      baseHp * (1 + dungeonLevel * 0.135)  [0.15 * 0.9 = 0.135]
  const scaledHp = Math.floor(template.baseHp * (1 + dungeonLevel * 0.135));

  // Scale attack with dungeon level (unchanged scaling, base already reduced in monsters.ts)
  const scaledAttack = Math.floor(template.baseAttack * (1 + dungeonLevel * 0.1));

  return {
    template,
    currentHp: scaledHp,
    maxHp: scaledHp,
    attack: scaledAttack,
    defense: template.baseDefense,
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
    message: `⚔️ Encountered ${monster.template.name}! (HP: ${monster.maxHp}, ATK: ${monster.attack})`,
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
      log.push({ type: 'player_crit', message: `💥 CRITICAL HIT! You deal ${playerDamage} damage to ${monster.template.name}!`, value: playerDamage });
    } else {
      log.push({ type: 'player_attack', message: `⚔️ You deal ${playerDamage} damage to ${monster.template.name}.`, value: playerDamage });
    }

    if (monster.currentHp <= 0) {
      log.push({ type: 'monster_death', message: `💀 ${monster.template.name} has been slain!` });
      xpGained += monster.template.xpReward;

      // Try to generate loot
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
      log.push({ type: 'monster_crit', message: `💢 ${monster.template.name} CRITS you for ${monsterDamage} damage!`, value: monsterDamage });
    } else {
      log.push({ type: 'monster_attack', message: `🗡️ ${monster.template.name} hits you for ${monsterDamage} damage.`, value: monsterDamage });
    }

    if (playerHp <= 0) {
      log.push({ type: 'player_death', message: `💀 You have been slain by ${monster.template.name}!` });
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
