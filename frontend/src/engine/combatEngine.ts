import { GeneratedItem, generateLoot } from './lootGenerator';
import { MONSTER_TEMPLATES, MonsterTemplate } from '../data/monsters';
import { ABILITIES } from '../data/abilities';

// Player attacks once every PLAYER_ATTACK_INTERVAL ticks
const PLAYER_ATTACK_INTERVAL = 12;

/**
 * Calculate the number of ticks between enemy attacks based on enemy level.
 * Level 1 = 21 ticks, decreasing by 1 every 5 levels.
 * Formula: 21 - floor((level - 1) / 5)
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

/**
 * Calculate drop rate percentage based on player vs monster level.
 * Exported for use in DungeonSelectScreen.
 */
export function calculateDropRate(playerLevel: number, monsterLevel: number): number {
  const levelDiff = playerLevel - monsterLevel;
  return Math.max(0, 6 - Math.max(0, levelDiff));
}

/**
 * Get the maximum monster level a player can fight.
 * Exported for use in DungeonSelectScreen.
 */
export function getMaxMonsterLevel(playerLevel: number): number {
  return playerLevel + 5;
}

function getEquipmentBonuses(items: GeneratedItem[]): { str: number; dex: number; int: number; vit: number; bonusHp: number; bonusDamage: number; bonusDefense: number } {
  let str = 0, dex = 0, int_ = 0, vit = 0, bonusHp = 0, bonusDamage = 0, bonusDefense = 0;
  for (const item of items) {
    for (const affix of item.affixes) {
      if (affix.stat === 'str') str += affix.value;
      else if (affix.stat === 'dex') dex += affix.value;
      else if (affix.stat === 'int') int_ += affix.value;
      else if (affix.stat === 'vit') vit += affix.value;
      else if (affix.stat === 'hp') bonusHp += affix.value;
    }
    if (item.itemType === 'Weapon') bonusDamage += item.baseDamage || 0;
    if (item.itemType === 'Armor') bonusDefense += item.baseDefense || 0;
  }
  return { str, dex, int: int_, vit, bonusHp, bonusDamage, bonusDefense };
}

function calculatePlayerDamage(stats: CombatStats, equipBonuses: ReturnType<typeof getEquipmentBonuses>): { min: number; max: number } {
  const totalStr = stats.str + equipBonuses.str;
  const totalDex = stats.dex + equipBonuses.dex;
  const baseDmg = equipBonuses.bonusDamage + Math.floor(totalStr * 0.8) + Math.floor(totalDex * 0.3);
  const min = Math.max(1, baseDmg);
  const max = Math.max(2, Math.floor(baseDmg * 1.5));
  return { min, max };
}

function calculatePlayerDefense(stats: CombatStats, equipBonuses: ReturnType<typeof getEquipmentBonuses>): number {
  return equipBonuses.bonusDefense + Math.floor(stats.str * 0.2);
}

function rollDamage(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isCrit(critChance: number): boolean {
  return Math.random() * 100 < critChance;
}

export function simulateCombat(
  playerStats: CombatStats,
  dungeonLevel: number,
  isHardcore: boolean,
  realm: 'Softcore' | 'Hardcore'
): CombatResult {
  const log: string[] = [];
  const loot: GeneratedItem[] = [];
  let xpEarned = 0;
  let monstersDefeated = 0;

  const equipBonuses = getEquipmentBonuses(playerStats.equippedItems || []);
  const playerDmgRange = calculatePlayerDamage(playerStats, equipBonuses);
  const playerDefense = calculatePlayerDefense(playerStats, equipBonuses);

  let playerHp = playerStats.currentHp;
  const playerMaxHp = playerStats.maxHp;

  // Select abilities
  const abilityIds = playerStats.abilities || [];
  const selectedAbilities = abilityIds
    .map(id => ABILITIES.find(a => a.id === id))
    .filter(Boolean) as typeof ABILITIES[0][];

  // Ability cooldown tracking
  const abilityCooldowns: Record<string, number> = {};
  for (const ab of selectedAbilities) {
    abilityCooldowns[ab.id] = 0;
  }

  // Determine number of monsters (1-3 based on dungeon level)
  const numMonsters = Math.min(3, 1 + Math.floor(dungeonLevel / 5));

  // Cap monster level
  const monsterLevel = Math.min(dungeonLevel, 50);

  // Pick monsters
  const monsterTemplates: MonsterTemplate[] = [];
  for (let i = 0; i < numMonsters; i++) {
    const idx = Math.floor(Math.random() * MONSTER_TEMPLATES.length);
    monsterTemplates.push(MONSTER_TEMPLATES[idx]);
  }

  log.push(`Entering dungeon level ${dungeonLevel}...`);

  for (let mi = 0; mi < monsterTemplates.length; mi++) {
    const template = monsterTemplates[mi];
    // HP scaling: base HP at level 1, grows ~15% per level above 1
    const scaledHp = Math.floor(template.baseHp * (1 + Math.max(0, monsterLevel - 1) * 0.15));
    const scaledAtk = Math.floor(template.baseAttack * (1 + monsterLevel * 0.12));
    const scaledDef = Math.floor(template.baseDefense * (1 + monsterLevel * 0.1));

    // Enemy attack interval: level 1 = 21 ticks, -1 tick per 5 levels
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

    log.push(`\nEncountered ${monster.name} (Level ${monster.level}) — HP: ${monster.hp}`);

    let tick = 0;
    let playerTicksSinceLastAttack = 0;
    let abilityIndex = 0;

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
        let attackLabel = 'attack';

        // Try to use an ability
        let usedAbility = false;
        if (selectedAbilities.length > 0) {
          for (let ai = 0; ai < selectedAbilities.length; ai++) {
            const ab = selectedAbilities[(abilityIndex + ai) % selectedAbilities.length];
            if (abilityCooldowns[ab.id] === 0) {
              const statValue = ab.scalingStat === 'str' ? playerStats.str + equipBonuses.str
                : ab.scalingStat === 'dex' ? playerStats.dex + equipBonuses.dex
                : ab.scalingStat === 'int' ? playerStats.int + equipBonuses.int
                : playerStats.vit + equipBonuses.vit;

              playerDmg = Math.floor(statValue * ab.damageMultiplier + playerDmgRange.min * 0.5);
              attackLabel = `use ${ab.name}`;
              abilityCooldowns[ab.id] = ab.cooldown;
              abilityIndex = (abilityIndex + 1) % selectedAbilities.length;
              usedAbility = true;
              break;
            }
          }
        }

        if (!usedAbility) {
          playerDmg = rollDamage(playerDmgRange.min, playerDmgRange.max);
        }

        // Apply crit
        const critHit = isCrit(playerStats.critChance);
        if (critHit) {
          playerDmg = Math.floor(playerDmg * (1 + playerStats.critPower / 100));
          attackLabel += ' (CRIT!)';
        }

        // Apply monster defense
        const effectiveDmg = Math.max(1, playerDmg - monster.defense);
        monster.hp -= effectiveDmg;
        log.push(`Tick ${tick}: You ${attackLabel} for ${effectiveDmg} damage. ${monster.name} HP: ${Math.max(0, monster.hp)}/${monster.maxHp}`);

        if (monster.hp <= 0) break;
      }

      if (monster.hp <= 0) break;

      // Monster attacks every ticksBetweenAttacks ticks
      monster.ticksSinceLastAttack++;
      if (monster.ticksSinceLastAttack >= monster.ticksBetweenAttacks) {
        monster.ticksSinceLastAttack = 0;
        const monsterDmg = Math.max(1, monster.attack - playerDefense);
        playerHp -= monsterDmg;
        log.push(`Tick ${tick}: ${monster.name} attacks you for ${monsterDmg} damage. Your HP: ${Math.max(0, playerHp)}/${playerMaxHp}`);
      }
    }

    if (monster.hp <= 0) {
      monstersDefeated++;
      const xp = Math.floor(10 * monsterLevel * (1 + monsterLevel * 0.1));
      xpEarned += xp;
      log.push(`${monster.name} defeated! +${xp} XP`);

      // Loot drop
      const dropChance = 0.3 + monsterLevel * 0.01;
      if (Math.random() < dropChance) {
        const item = generateLoot(monsterLevel);
        if (item) {
          loot.push(item);
          log.push(`Loot dropped: ${item.name}`);
        }
      }
    } else {
      // Player died
      log.push(`\nYou have been slain by ${monster.name}!`);
      break;
    }
  }

  const victory = playerHp > 0;

  if (victory) {
    log.push(`\nDungeon cleared! Total XP earned: ${xpEarned}`);
  }

  // Determine remaining HP
  let remainingHp: number;
  if (!victory && realm === 'Softcore') {
    remainingHp = 1; // Softcore death: survive with 1 HP
  } else {
    remainingHp = Math.max(0, playerHp);
  }

  return {
    victory,
    log,
    xpEarned,
    loot,
    remainingHp,
    monstersDefeated,
  };
}
