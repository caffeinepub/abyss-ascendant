import { GeneratedItem, generateLoot } from './lootGenerator';
import { ABILITIES, Ability } from '../data/abilities';
import { MONSTER_TEMPLATES, generateMonsterDisplayName } from '../data/monsters';
import type { LocalCharacter } from '../hooks/useLocalCharacter';

export type { LocalCharacter };

// ── Tick constants ──
export const PLAYER_BASE_TICKS_BETWEEN_ATTACKS = 12;

export function calculateEnemyTicksBetweenAttacks(level: number): number {
  const clamped = Math.max(1, Math.min(100, level));
  const ticks = 12 - ((10 / 99) * (clamped - 1));
  return Math.max(2, Math.round(ticks));
}

// ── Types ──

export interface CombatStats {
  hp: number;
  maxHp: number;
  physicalDamage: number;
  magicDamage: number;
  defense: number;
  critChance: number;
  ticksBetweenAttacks: number;
  str: number;
  dex: number;
  int: number;
  vit: number;
}

export interface MonsterInstance {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  physicalDamage: number;
  magicDamage: number;
  defense: number;
  ticksBetweenAttacks: number;
  xpReward: number;
  lootChance: number;
}

export interface CombatLogEntry {
  tick: number;
  actor: 'player' | 'monster';
  action: string;
  damage?: number;
  healing?: number;
  isCrit?: boolean;
  abilityName?: string;
}

export interface CombatResult {
  victory: boolean;
  ticksElapsed: number;
  xpGained: number;
  log: CombatLogEntry[];
  playerHpRemaining: number;
  monsterHpRemaining: number;
  itemDropped: boolean;
  penaltyApplied: boolean;
  remainingHp: number;
  lootDropped: GeneratedItem | null;
}

// ── Stat derivation ──

export function derivePlayerStats(character: LocalCharacter): CombatStats {
  let str = character.stats.str;
  let dex = character.stats.dex;
  let int = character.stats.int;
  let vit = character.stats.vit;
  let bonusPhysDmg = 0;
  let bonusMagicDmg = 0;
  let bonusDefense = 0;
  let bonusCrit = 0;
  let bonusHp = 0;
  let baseWeaponDamage = 0;
  let baseArmorDefense = 0;

  for (const item of character.equippedItems) {
    for (const affix of item.affixes) {
      if (affix.stat === 'str') str += affix.value;
      else if (affix.stat === 'dex') dex += affix.value;
      else if (affix.stat === 'int') int += affix.value;
      else if (affix.stat === 'vit') vit += affix.value;
      else if (affix.stat === 'physicalDamage') bonusPhysDmg += affix.value;
      else if (affix.stat === 'magicDamage') bonusMagicDmg += affix.value;
      else if (affix.stat === 'defense') bonusDefense += affix.value;
      else if (affix.stat === 'critChance') bonusCrit += affix.value;
      else if (affix.stat === 'hp') bonusHp += affix.value;
    }
    if (item.itemType === 'Weapon' && item.baseDamage) {
      baseWeaponDamage += item.baseDamage;
    }
    if (item.itemType === 'Armor' && item.baseDefense) {
      baseArmorDefense += item.baseDefense;
    }
  }

  const physicalDamage = Math.max(1, str * 2 + dex + baseWeaponDamage + bonusPhysDmg);
  const magicDamage = Math.max(1, int * 2 + bonusMagicDmg);
  const defense = Math.max(0, vit + dex + baseArmorDefense + bonusDefense);
  const critChance = Math.min(0.75, 0.05 + dex * 0.005 + bonusCrit * 0.01);
  const maxHp = Math.max(10, vit * 10 + 50 + bonusHp);

  return {
    hp: maxHp,
    maxHp,
    physicalDamage,
    magicDamage,
    defense,
    critChance,
    ticksBetweenAttacks: PLAYER_BASE_TICKS_BETWEEN_ATTACKS,
    str,
    dex,
    int,
    vit,
  };
}

// ── Monster spawning ──

export function spawnMonster(level: number): MonsterInstance {
  const template = MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];
  const scaleFactor = 1 + (level - 1) * 0.15;
  const scaledHp = Math.round(template.baseHp * scaleFactor);
  const scaledPhysDmg = Math.round(template.baseAttack * scaleFactor);
  const scaledMagicDmg = Math.round(template.baseAttack * 0.5 * scaleFactor);
  const scaledDefense = Math.round(template.baseDefense * scaleFactor);
  const xpReward = Math.round(template.xpReward * scaleFactor);
  const lootChance = 0.06;
  const ticksBetweenAttacks = calculateEnemyTicksBetweenAttacks(level);
  const name = generateMonsterDisplayName(template.name);

  return {
    name,
    level,
    hp: scaledHp,
    maxHp: scaledHp,
    physicalDamage: scaledPhysDmg,
    magicDamage: scaledMagicDmg,
    defense: scaledDefense,
    ticksBetweenAttacks,
    xpReward,
    lootChance,
  };
}

// ── Drop rate calculation ──

export function calculateDropRate(playerLevel: number, monsterLevel: number): number {
  const levelDiff = playerLevel - monsterLevel;
  const dropRate = Math.max(0, 6 - Math.max(0, levelDiff));
  return dropRate;
}

// ── Monster level cap ──

export function getMaxMonsterLevel(playerLevel: number): number {
  return playerLevel + 5;
}

// ── Ability cycling ──

function rollAbilityOrAttack(equippedAbilityIds: string[]): Ability | null {
  const validIds = equippedAbilityIds.filter(Boolean);
  const count = Math.min(3, validIds.length);
  if (count === 0) return null;

  const roll = Math.random();
  const abilityChanceEach = 0.125;
  const totalAbilityChance = count * abilityChanceEach;

  if (roll >= totalAbilityChance) return null;

  const abilityIndex = Math.floor(roll / abilityChanceEach);
  const abilityId = validIds[Math.min(abilityIndex, validIds.length - 1)];
  return ABILITIES.find((a) => a.id === abilityId) ?? null;
}

// ── Ability application ──

interface AbilityResult {
  damage: number;
  healing: number;
  isCrit: boolean;
}

function applyAbility(
  ability: Ability,
  playerStats: CombatStats,
  monster: MonsterInstance
): AbilityResult {
  const isCrit = Math.random() < playerStats.critChance;
  const multiplier = ability.damageMultiplier ?? 1.0;
  const critMult = isCrit ? 2 : 1;

  // Healing ability: effectType === 'heal'
  if (ability.effectType === 'heal') {
    const healAmount = Math.round(playerStats.maxHp * multiplier);
    return { damage: 0, healing: healAmount, isCrit };
  }

  let baseDmg: number;
  if (ability.damageType === 'magic') {
    baseDmg = playerStats.magicDamage * multiplier * critMult;
    const dmg = Math.max(1, baseDmg - monster.defense * 0.1);
    return { damage: Math.round(dmg), healing: 0, isCrit };
  } else {
    baseDmg = playerStats.physicalDamage * multiplier * critMult;
    const dmg = Math.max(1, baseDmg - monster.defense);
    return { damage: Math.round(dmg), healing: 0, isCrit };
  }
}

// ── Combat simulation ──

export function simulateCombat(
  character: LocalCharacter,
  monster: MonsterInstance,
  currentHp?: number,
  maxTicks = 500
): CombatResult {
  const playerStats = derivePlayerStats(character);

  const maxAllowedLevel = getMaxMonsterLevel(character.level);
  if (monster.level > maxAllowedLevel) {
    throw new Error(
      `Monster level ${monster.level} exceeds maximum allowed level ${maxAllowedLevel}`
    );
  }

  // Use provided currentHp (persistent HP) or fall back to maxHp
  let playerHp = currentHp !== undefined
    ? Math.max(1, Math.min(currentHp, playerStats.maxHp))
    : playerStats.maxHp;
  let monsterHp = monster.hp;
  let playerAttackCooldown = 0;
  let monsterAttackCooldown = 0;
  const log: CombatLogEntry[] = [];

  for (let tick = 0; tick < maxTicks; tick++) {
    if (playerAttackCooldown <= 0) {
      const equippedAbilityIds = character.equippedAbilityIds ?? [];
      const ability = rollAbilityOrAttack(equippedAbilityIds);

      if (ability) {
        const abilityResult = applyAbility(ability, playerStats, monster);
        if (abilityResult.healing > 0) {
          playerHp = Math.min(playerStats.maxHp, playerHp + abilityResult.healing);
          log.push({
            tick,
            actor: 'player',
            action: `uses ${ability.name}`,
            healing: abilityResult.healing,
            isCrit: abilityResult.isCrit,
            abilityName: ability.name,
          });
        } else {
          monsterHp = Math.max(0, monsterHp - abilityResult.damage);
          log.push({
            tick,
            actor: 'player',
            action: `uses ${ability.name}`,
            damage: abilityResult.damage,
            isCrit: abilityResult.isCrit,
            abilityName: ability.name,
          });
        }
      } else {
        const isCrit = Math.random() < playerStats.critChance;
        const rawDmg = playerStats.physicalDamage * (isCrit ? 2 : 1);
        const dmg = Math.max(1, rawDmg - monster.defense);
        monsterHp = Math.max(0, monsterHp - dmg);
        log.push({
          tick,
          actor: 'player',
          action: 'attacks',
          damage: Math.round(dmg),
          isCrit,
        });
      }

      playerAttackCooldown = playerStats.ticksBetweenAttacks;
    }

    if (monsterHp <= 0) break;

    if (monsterAttackCooldown <= 0) {
      const isCrit = Math.random() < 0.05;
      const rawDmg = monster.physicalDamage * (isCrit ? 1.5 : 1);
      const dmg = Math.max(1, rawDmg - playerStats.defense * 0.3);
      playerHp = Math.max(0, playerHp - dmg);
      log.push({
        tick,
        actor: 'monster',
        action: 'attacks',
        damage: Math.round(dmg),
        isCrit,
      });
      monsterAttackCooldown = monster.ticksBetweenAttacks;
    }

    if (playerHp <= 0) break;

    playerAttackCooldown--;
    monsterAttackCooldown--;
  }

  const victory = monsterHp <= 0;
  const xpGained = victory ? monster.xpReward : Math.round(monster.xpReward * 0.1);

  const dropRatePct = victory ? calculateDropRate(character.level, monster.level) : 0;
  const itemDropped = Math.random() * 100 < dropRatePct;
  const lootDropped = itemDropped ? generateLoot(monster.level) : null;

  const remainingHp = Math.round(playerHp);

  return {
    victory,
    ticksElapsed: log.length,
    xpGained,
    log,
    playerHpRemaining: remainingHp,
    monsterHpRemaining: Math.round(monsterHp),
    itemDropped,
    penaltyApplied: false,
    remainingHp,
    lootDropped,
  };
}

// ── Ascension Trial ──

export interface AscensionTrialResult {
  victory: boolean;
  xpGained: number;
  log: CombatLogEntry[];
  playerHpRemaining: number;
  penaltyApplied: boolean;
  itemDropped: boolean;
}

export function simulateAscensionTrial(
  character: LocalCharacter,
  currentHp?: number
): AscensionTrialResult {
  const trialLevel = character.level + 5;
  const monster = spawnMonster(trialLevel);
  monster.name = `Trial Champion (Lv ${trialLevel})`;

  const playerStats = derivePlayerStats(character);
  let playerHp = currentHp !== undefined
    ? Math.max(1, Math.min(currentHp, playerStats.maxHp))
    : playerStats.maxHp;
  let monsterHp = monster.hp;
  let playerAttackCooldown = 0;
  let monsterAttackCooldown = 0;
  const log: CombatLogEntry[] = [];
  const maxTicks = 1000;

  for (let tick = 0; tick < maxTicks; tick++) {
    if (playerAttackCooldown <= 0) {
      const equippedAbilityIds = character.equippedAbilityIds ?? [];
      const ability = rollAbilityOrAttack(equippedAbilityIds);

      if (ability) {
        const abilityResult = applyAbility(ability, playerStats, monster);
        if (abilityResult.healing > 0) {
          playerHp = Math.min(playerStats.maxHp, playerHp + abilityResult.healing);
          log.push({
            tick,
            actor: 'player',
            action: `uses ${ability.name}`,
            healing: abilityResult.healing,
            isCrit: abilityResult.isCrit,
            abilityName: ability.name,
          });
        } else {
          monsterHp = Math.max(0, monsterHp - abilityResult.damage);
          log.push({
            tick,
            actor: 'player',
            action: `uses ${ability.name}`,
            damage: abilityResult.damage,
            isCrit: abilityResult.isCrit,
            abilityName: ability.name,
          });
        }
      } else {
        const isCrit = Math.random() < playerStats.critChance;
        const rawDmg = playerStats.physicalDamage * (isCrit ? 2 : 1);
        const dmg = Math.max(1, rawDmg - monster.defense);
        monsterHp = Math.max(0, monsterHp - dmg);
        log.push({
          tick,
          actor: 'player',
          action: 'attacks',
          damage: Math.round(dmg),
          isCrit,
        });
      }
      playerAttackCooldown = playerStats.ticksBetweenAttacks;
    }

    if (monsterHp <= 0) break;

    if (monsterAttackCooldown <= 0) {
      const isCrit = Math.random() < 0.05;
      const rawDmg = monster.physicalDamage * (isCrit ? 1.5 : 1);
      const dmg = Math.max(1, rawDmg - playerStats.defense * 0.3);
      playerHp = Math.max(0, playerHp - dmg);
      log.push({
        tick,
        actor: 'monster',
        action: 'attacks',
        damage: Math.round(dmg),
        isCrit,
      });
      monsterAttackCooldown = monster.ticksBetweenAttacks;
    }

    if (playerHp <= 0) break;

    playerAttackCooldown--;
    monsterAttackCooldown--;
  }

  const victory = monsterHp <= 0;
  const xpGained = victory
    ? Math.round(monster.xpReward * 1.5)
    : Math.round(monster.xpReward * 0.1);
  const itemDropped = victory && Math.random() < 0.06;

  return {
    victory,
    xpGained,
    log,
    playerHpRemaining: Math.round(playerHp),
    penaltyApplied: false,
    itemDropped,
  };
}
