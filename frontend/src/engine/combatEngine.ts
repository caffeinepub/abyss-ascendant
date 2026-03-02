import { LocalCharacter } from '../types/game';
import { MonsterTemplate, getMonsterTemplates } from '../data/monsters';
import { ABILITIES } from '../data/abilities';
import { generateLoot, GeneratedItem } from './lootGenerator';

export const PLAYER_TICKS_BETWEEN_ATTACKS = 12;

/**
 * Returns the number of ticks between attacks for an enemy at the given level.
 * Level 1 = 21 ticks, decreases by 1 every 5 levels, floor at 2.
 */
export function getEnemyTicksBetweenAttacks(level: number): number {
  return Math.max(2, 21 - Math.floor((level - 1) / 5));
}

export interface Monster {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xpReward: number;
  ticksBetweenAttacks: number;
  template: MonsterTemplate;
}

export interface CombatLogEntry {
  tick: number;
  message: string;
  type: 'player-attack' | 'enemy-attack' | 'player-ability' | 'enemy-death' | 'player-death' | 'info' | 'crit' | 'loot';
}

export interface CombatResult {
  victory: boolean;
  xpEarned: number;
  finalPlayerHp: number;
  log: CombatLogEntry[];
  monstersDefeated: number;
  loot: GeneratedItem[];
  totalTicks: number;
}

function getBaselineStats(level: number): { hp: number; attack: number; defense: number } {
  const baseHp = 25 + (level - 1) * 8;
  const baseAttack = 3 + Math.floor((level - 1) * 1.2);
  const baseDefense = 1 + Math.floor((level - 1) * 0.8);
  return { hp: baseHp, attack: baseAttack, defense: baseDefense };
}

function computeStatPowerMultiplier(monster: Monster): number {
  const baseline = getBaselineStats(monster.level);
  const hpRatio = monster.maxHp / Math.max(1, baseline.hp);
  const attackRatio = monster.attack / Math.max(1, baseline.attack);
  const defenseRatio = monster.defense / Math.max(1, baseline.defense);

  // Weighted composite: defense counts more since it makes fights harder
  const composite = hpRatio * 0.35 + attackRatio * 0.3 + defenseRatio * 0.35;

  // Floor at 1.0 so XP is never reduced below base
  return Math.max(1.0, composite);
}

function getBaseXpForLevel(level: number): number {
  return Math.floor(10 + (level - 1) * 15 + Math.pow(level - 1, 1.5) * 5);
}

export function generateMonster(dungeonLevel: number, floorNumber: number): Monster {
  const templates = getMonsterTemplates();
  const eligibleTemplates = templates.filter(t => {
    const minLevel = Math.max(1, dungeonLevel - 5);
    const maxLevel = dungeonLevel + 5;
    return t.minLevel <= maxLevel && (t.maxLevel === undefined || t.maxLevel >= minLevel);
  });

  const template = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)] || templates[0];

  const levelVariance = Math.floor(Math.random() * 5) - 2;
  const monsterLevel = Math.max(1, dungeonLevel + levelVariance);

  // Stat variance: some monsters get boosted stats (making them harder but more rewarding)
  const hpVariance = 0.7 + Math.random() * 0.9; // 0.7x to 1.6x
  const attackVariance = 0.8 + Math.random() * 0.7; // 0.8x to 1.5x
  const defenseVariance = 0.7 + Math.random() * 0.9; // 0.7x to 1.6x

  const baseHp = Math.floor((template.baseHp + (monsterLevel - 1) * 8) * hpVariance);
  const baseAttack = Math.floor((template.baseAttack + Math.floor((monsterLevel - 1) * 1.2)) * attackVariance);
  const baseDefense = Math.floor((template.baseDefense + Math.floor((monsterLevel - 1) * 0.8)) * defenseVariance);

  const hp = Math.max(5, baseHp);
  const attack = Math.max(1, baseAttack);
  const defense = Math.max(0, baseDefense);

  const ticksBetweenAttacks = getEnemyTicksBetweenAttacks(monsterLevel);

  const monster: Monster = {
    id: `${template.id}-${floorNumber}-${Date.now()}`,
    name: template.name,
    level: monsterLevel,
    hp,
    maxHp: hp,
    attack,
    defense,
    xpReward: 0, // will be set below after multiplier
    ticksBetweenAttacks,
    template,
  };

  // Compute XP with stat-power multiplier
  const baseXp = getBaseXpForLevel(monsterLevel);
  const multiplier = computeStatPowerMultiplier(monster);
  monster.xpReward = Math.floor(baseXp * multiplier);

  return monster;
}

export function calculateDropRate(dungeonLevel: number): number {
  return Math.min(0.8, 0.2 + dungeonLevel * 0.02);
}

export function getMaxMonsterLevel(dungeonLevel: number): number {
  return dungeonLevel + 5;
}

interface CombatState {
  playerHp: number;
  playerMaxHp: number;
  playerAttack: number;
  playerDefense: number;
  playerTicksBetweenAttacks: number;
  playerTickCounter: number;
  abilityTickCounter: number;
  currentAbilityIndex: number;
  monster: Monster;
  tick: number;
  log: CombatLogEntry[];
}

function getPlayerStats(character: LocalCharacter) {
  const stats = character.stats;
  return {
    attack: stats.attack,
    defense: stats.defense,
    maxHp: stats.maxHp,
    currentHp: stats.currentHp,
    critChance: stats.critChance,
    critPower: stats.critPower,
  };
}

function resolveAbility(
  ability: typeof ABILITIES[0],
  state: CombatState,
  character: LocalCharacter
): { damage: number; message: string; type: CombatLogEntry['type'] } {
  const playerStats = getPlayerStats(character);
  const type: CombatLogEntry['type'] = 'player-ability';

  const multiplier = ability.damageMultiplier ?? 1.5;

  let damage: number;
  if (ability.damageType === 'physical') {
    damage = Math.floor(playerStats.attack * multiplier);
  } else if (ability.damageType === 'magic') {
    damage = Math.floor(playerStats.attack * multiplier * 1.1);
  } else {
    // 'true' damage — ignores defense
    damage = Math.floor(playerStats.attack * multiplier);
  }

  // Apply defense reduction (except for true damage)
  const effectiveDamage = ability.damageType === 'true'
    ? Math.max(1, damage)
    : Math.max(1, damage - Math.floor(state.monster.defense * 0.5));

  const message = `You use ${ability.name} on ${state.monster.name} for ${effectiveDamage} damage!`;

  return { damage: effectiveDamage, message, type };
}

export function simulateCombat(
  character: LocalCharacter,
  monsters: Monster[],
  maxTicks: number = 2000
): CombatResult {
  const playerStats = getPlayerStats(character);
  // Support both abilities and equippedAbilities for backward compat
  const abilityIds = character.equippedAbilities?.length
    ? character.equippedAbilities
    : (character.abilities || []);
  const abilities = abilityIds
    .map(id => ABILITIES.find(a => a.id === id))
    .filter(Boolean) as typeof ABILITIES;

  let playerHp = playerStats.currentHp;
  const playerMaxHp = playerStats.maxHp;
  const log: CombatLogEntry[] = [];
  let totalXp = 0;
  let monstersDefeated = 0;
  const loot: GeneratedItem[] = [];
  let totalTicks = 0;

  const ABILITY_CYCLE_TICKS = 8;

  for (const monster of monsters) {
    if (playerHp <= 0) break;

    const state: CombatState = {
      playerHp,
      playerMaxHp,
      playerAttack: playerStats.attack,
      playerDefense: playerStats.defense,
      playerTicksBetweenAttacks: PLAYER_TICKS_BETWEEN_ATTACKS,
      playerTickCounter: 0,
      abilityTickCounter: 0,
      currentAbilityIndex: 0,
      monster: { ...monster },
      tick: 0,
      log,
    };

    log.push({
      tick: totalTicks,
      message: `You encounter a ${monster.name} (Level ${monster.level}) — HP: ${monster.hp}, ATK: ${monster.attack}, DEF: ${monster.defense}`,
      type: 'info',
    });

    let monsterDefeated = false;

    while (state.playerHp > 0 && state.monster.hp > 0 && state.tick < maxTicks) {
      state.tick++;
      totalTicks++;
      state.playerTickCounter++;
      state.abilityTickCounter++;

      // Player basic attack
      if (state.playerTickCounter >= state.playerTicksBetweenAttacks) {
        state.playerTickCounter = 0;

        const isCrit = Math.random() * 100 < playerStats.critChance;
        let rawDamage = Math.max(1, state.playerAttack - Math.floor(state.monster.defense * 0.4));
        if (isCrit) {
          rawDamage = Math.floor(rawDamage * (1 + playerStats.critPower / 100));
        }

        state.monster.hp -= rawDamage;

        const critText = isCrit ? ' (Critical Hit!)' : '';
        log.push({
          tick: totalTicks,
          message: `You attack ${state.monster.name} for ${rawDamage} damage${critText}. (${Math.max(0, state.monster.hp)}/${state.monster.maxHp} HP remaining)`,
          type: isCrit ? 'crit' : 'player-attack',
        });
      }

      // Player ability
      if (abilities.length > 0 && state.abilityTickCounter >= ABILITY_CYCLE_TICKS && state.monster.hp > 0) {
        state.abilityTickCounter = 0;
        const ability = abilities[state.currentAbilityIndex % abilities.length];
        state.currentAbilityIndex++;

        const { damage, message, type } = resolveAbility(ability, state, character);
        state.monster.hp -= damage;

        log.push({
          tick: totalTicks,
          message: `${message} (${Math.max(0, state.monster.hp)}/${state.monster.maxHp} HP remaining)`,
          type,
        });
      }

      // Enemy attack
      if (state.monster.hp > 0 && state.tick % state.monster.ticksBetweenAttacks === 0) {
        const enemyDamage = Math.max(1, state.monster.attack - Math.floor(state.playerDefense * 0.4));
        state.playerHp -= enemyDamage;

        log.push({
          tick: totalTicks,
          message: `${state.monster.name} attacks you for ${enemyDamage} damage. (${Math.max(0, state.playerHp)}/${state.playerMaxHp} HP remaining)`,
          type: 'enemy-attack',
        });
      }

      // Check monster death
      if (state.monster.hp <= 0) {
        monsterDefeated = true;
        monstersDefeated++;
        totalXp += monster.xpReward;

        log.push({
          tick: totalTicks,
          message: `${state.monster.name} has been defeated! You earn ${monster.xpReward} XP.`,
          type: 'enemy-death',
        });

        // Loot check
        const dropRate = calculateDropRate(monster.level);
        if (Math.random() < dropRate) {
          const item = generateLoot(monster.level);
          if (item) {
            loot.push(item);
            log.push({
              tick: totalTicks,
              message: `${state.monster.name} dropped: ${item.name}!`,
              type: 'loot',
            });
          }
        }
        break;
      }

      // Check player death
      if (state.playerHp <= 0) {
        log.push({
          tick: totalTicks,
          message: `You have been slain by ${state.monster.name}!`,
          type: 'player-death',
        });
        break;
      }
    }

    playerHp = state.playerHp;

    if (!monsterDefeated && state.monster.hp > 0 && state.tick >= maxTicks) {
      log.push({
        tick: totalTicks,
        message: `The battle with ${state.monster.name} drags on too long — you retreat!`,
        type: 'info',
      });
    }
  }

  return {
    victory: playerHp > 0,
    xpEarned: totalXp,
    finalPlayerHp: Math.max(0, playerHp),
    log,
    monstersDefeated,
    loot,
    totalTicks,
  };
}
