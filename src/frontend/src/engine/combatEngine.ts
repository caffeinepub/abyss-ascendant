import { ABILITIES } from "../data/abilities";
import { type GeneratedMonster, generateMonster } from "../data/monsters";
import { type GeneratedItem, generateLoot } from "./lootGenerator";

// Player attacks once every PLAYER_ATTACK_INTERVAL ticks
const PLAYER_ATTACK_INTERVAL = 12;

// ─── Additive XP formula constants ───────────────────────────────────────────
const STAT_BONUS_PER_POINT = 0.4;

/**
 * Calculate the number of ticks between enemy attacks based on enemy level.
 */
function calculateEnemyAttackInterval(enemyLevel: number): number {
  return 21 - Math.floor((enemyLevel - 1) / 5);
}

export interface CombatStats {
  str: number;
  dex: number;
  int: number;
  vit: number;
  maxHp: number;
  currentHp: number;
  critChance: number;
  critPower: number;
  equippedItems?: GeneratedItem[];
  abilities?: string[];
  /** Character class for ability restriction enforcement */
  characterClass?: string;
}

export interface CombatResult {
  victory: boolean;
  log: string[];
  xpEarned: number;
  loot: GeneratedItem[];
  remainingHp: number;
  monstersDefeated: number;
}

export interface MonsterState {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  level: number;
  ticksBetweenAttacks: number;
  ticksSinceLastAttack: number;
}

export function calculateDropRate(
  playerLevel: number,
  monsterLevel: number,
): number {
  const levelDiff = playerLevel - monsterLevel;
  return Math.max(0, 6 - Math.max(0, levelDiff));
}

export function getMaxMonsterLevel(playerLevel: number): number {
  return playerLevel + 5;
}

/**
 * Get equipment bonuses for combat calculations.
 * NOTE: stat affixes (str, dex, int, vit, hp, critChance) are intentionally NOT
 * aggregated here because they are already baked into playerStats (via useLocalCharacter).
 * This function only returns physicalDamage and defense affixes plus base weapon/armor values,
 * which are additive on top of the already-effective player stats.
 */
function getEquipmentBonuses(items: GeneratedItem[]): {
  bonusDamage: number;
  bonusMagicDamage: number;
  bonusDefense: number;
} {
  let bonusDamage = 0;
  let bonusMagicDamage = 0;
  let bonusDefense = 0;
  for (const item of items) {
    for (const affix of item.affixes) {
      if (affix.stat === "physicalDamage") bonusDamage += affix.value;
      else if (affix.stat === "magicDamage") bonusMagicDamage += affix.value;
      else if (affix.stat === "defense") bonusDefense += affix.value;
    }
    // Base weapon damage and base armor defense
    if (item.itemType === "Weapon") bonusDamage += item.baseDamage || 0;
    if (item.itemType === "Armor") bonusDefense += item.baseDefense || 0;
  }
  return { bonusDamage, bonusMagicDamage, bonusDefense };
}

function calculatePlayerDamage(
  stats: CombatStats,
  equipBonuses: ReturnType<typeof getEquipmentBonuses>,
): { min: number; max: number } {
  // stats.str and stats.dex already include equipment affix bonuses
  const baseDmg =
    equipBonuses.bonusDamage +
    Math.floor(stats.str * 0.8) +
    Math.floor(stats.dex * 0.3);
  const min = Math.max(1, baseDmg);
  const max = Math.max(2, Math.floor(baseDmg * 1.5));
  return { min, max };
}

function calculatePlayerDefense(
  stats: CombatStats,
  equipBonuses: ReturnType<typeof getEquipmentBonuses>,
): number {
  // stats.str already includes equipment affix bonuses; bonusDefense adds base armor defense + defense affixes
  return equipBonuses.bonusDefense + Math.floor(stats.str * 0.2);
}

function rollDamage(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isCrit(critChance: number): boolean {
  return Math.random() * 100 < critChance;
}

function calculateXpReward(
  monsterLevel: number,
  scaledHp: number,
  scaledAtk: number,
  scaledDef: number,
): number {
  const baseXp = Math.floor(10 * monsterLevel * (1 + monsterLevel * 0.1));
  const statBonus = Math.floor(
    STAT_BONUS_PER_POINT * (scaledHp + scaledAtk + scaledDef),
  );
  return baseXp + statBonus;
}

export function simulateCombat(
  playerStats: CombatStats,
  dungeonLevel: number,
  _isHardcore: boolean,
  _realm: "Softcore" | "Hardcore",
  preGeneratedMonsters?: GeneratedMonster[],
): CombatResult {
  const log: string[] = [];
  const loot: GeneratedItem[] = [];
  let xpEarned = 0;
  let monstersDefeated = 0;

  const equipBonuses = getEquipmentBonuses(playerStats.equippedItems || []);
  const playerDmgRange = calculatePlayerDamage(playerStats, equipBonuses);
  const playerDefense = calculatePlayerDefense(playerStats, equipBonuses);

  let playerHp = playerStats.currentHp;

  // Select abilities — filter by class restriction if characterClass is provided
  const abilityIds = playerStats.abilities || [];
  const characterClass = playerStats.characterClass;

  const selectedAbilities = abilityIds
    .map((id) => ABILITIES.find((a) => a.id === id))
    .filter(Boolean)
    .filter((ab) => {
      if (!characterClass) return true;
      return ab!.classRestriction === characterClass;
    }) as (typeof ABILITIES)[number][];

  // Ability cooldown tracking
  const abilityCooldowns: Record<string, number> = {};
  for (const ab of selectedAbilities) {
    abilityCooldowns[ab.id] = 0;
  }

  // Determine number of monsters (1-3 based on dungeon level)
  const numMonsters = Math.min(3, 1 + Math.floor(dungeonLevel / 5));

  // Cap monster level
  const monsterLevel = Math.min(dungeonLevel, 50);

  // Use pre-generated monsters if provided, otherwise generate fresh ones
  const monsterPool: GeneratedMonster[] =
    preGeneratedMonsters && preGeneratedMonsters.length > 0
      ? preGeneratedMonsters
      : Array.from({ length: numMonsters }, () => generateMonster());

  log.push(`Entering dungeon level ${dungeonLevel}...`);

  for (let mi = 0; mi < monsterPool.length; mi++) {
    const template = monsterPool[mi];

    const scaledHp = Math.floor(
      template.baseHp * (1 + Math.max(0, monsterLevel - 1) * 0.15),
    );
    const scaledAtk = Math.floor(
      template.baseAttack * (1 + monsterLevel * 0.12),
    );
    const scaledDef = Math.floor(
      template.baseDefense * (1 + monsterLevel * 0.1),
    );

    const enemyAttackInterval = calculateEnemyAttackInterval(monsterLevel);

    const monster: MonsterState = {
      name: template.name,
      hp: scaledHp,
      maxHp: scaledHp,
      attack: scaledAtk,
      defense: scaledDef,
      level: monsterLevel,
      ticksBetweenAttacks: enemyAttackInterval,
      ticksSinceLastAttack: 0,
    };

    log.push(
      `\nYou are battling ${monster.name} (Level ${monster.level}) — HP: ${monster.hp}`,
    );

    let tick = 0;
    let playerTicksSinceLastAttack = 0;

    while (playerHp > 0 && monster.hp > 0) {
      tick++;

      // Decrement ability cooldowns
      for (const id in abilityCooldowns) {
        if (abilityCooldowns[id] > 0) abilityCooldowns[id]--;
      }

      // Player attacks every PLAYER_ATTACK_INTERVAL ticks
      playerTicksSinceLastAttack++;
      if (playerTicksSinceLastAttack >= PLAYER_ATTACK_INTERVAL) {
        playerTicksSinceLastAttack = 0;

        let playerDmg = rollDamage(playerDmgRange.min, playerDmgRange.max);
        let attackLabel = "attack";

        // Each equipped ability has an independent 12.5% chance to trigger per attack
        // playerStats.str/dex/int/vit already include equipment bonuses
        for (const ab of selectedAbilities) {
          if (Math.random() < 0.125) {
            const statValue =
              ab.scalingStat === "str"
                ? playerStats.str
                : ab.scalingStat === "dex"
                  ? playerStats.dex
                  : ab.scalingStat === "int"
                    ? playerStats.int
                    : playerStats.vit;

            const abilityDmg = Math.floor(
              statValue * ab.damageMultiplier + playerDmgRange.min * 0.5,
            );
            playerDmg += abilityDmg;
            attackLabel = `attack + ${ab.name}`;
          }
        }

        // playerStats.critChance already includes equipment crit bonuses
        let critText = "";
        if (isCrit(playerStats.critChance)) {
          const critMult = 1 + playerStats.critPower / 100;
          playerDmg = Math.floor(playerDmg * critMult);
          critText = " (CRIT!)";
        }

        // Apply monster defense
        const effectiveDmg = Math.max(
          1,
          playerDmg - Math.floor(monster.defense * 0.5),
        );
        monster.hp -= effectiveDmg;

        log.push(
          `You ${attackLabel} for ${effectiveDmg} damage${critText}. ${monster.name} HP: ${Math.max(0, monster.hp)}`,
        );
      }

      // Monster attacks
      monster.ticksSinceLastAttack++;
      if (monster.ticksSinceLastAttack >= monster.ticksBetweenAttacks) {
        monster.ticksSinceLastAttack = 0;

        const monsterDmg = Math.max(
          1,
          rollDamage(
            Math.floor(monster.attack * 0.8),
            Math.floor(monster.attack * 1.2),
          ) - playerDefense,
        );

        playerHp -= monsterDmg;
        log.push(
          `${monster.name} attacks for ${monsterDmg} damage. Your HP: ${Math.max(0, playerHp)}`,
        );
      }

      // Safety valve
      if (tick > 2000) {
        log.push("Combat timed out.");
        break;
      }
    }

    if (monster.hp <= 0) {
      monstersDefeated++;
      const xp = calculateXpReward(
        monsterLevel,
        scaledHp,
        scaledAtk,
        scaledDef,
      );
      xpEarned += xp;
      log.push(`\n${monster.name} defeated! +${xp} XP`);

      // Loot drop
      const dropChance = calculateDropRate(dungeonLevel, monsterLevel);
      if (Math.random() * 100 < dropChance) {
        const item = generateLoot(monsterLevel);
        if (item !== null) {
          loot.push(item);
          log.push(`${monster.name} dropped: ${item.name}`);
        }
      }
    }

    if (playerHp <= 0) {
      log.push("\nYou have been defeated!");
      break;
    }
  }

  const victory = playerHp > 0;
  if (victory) {
    log.push(`\nDungeon cleared! Total XP earned: ${xpEarned}`);
  }

  return {
    victory,
    log,
    xpEarned,
    loot,
    remainingHp: Math.max(0, playerHp),
    monstersDefeated,
  };
}
