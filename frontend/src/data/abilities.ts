export type AbilityArchetype = 'melee' | 'ranged' | 'magic' | 'tank';
export type EffectType = 'damage' | 'heal' | 'buff' | 'debuff' | 'aoe';

export interface Ability {
  id: string;
  name: string;
  description: string;
  archetype: AbilityArchetype;
  effectType: EffectType;
  cooldown: number; // in seconds
  damageMultiplier?: number;
  healMultiplier?: number;
  statScaling: 'str' | 'dex' | 'int' | 'vit' | 'none';
  icon: string;
}

export const ABILITIES: Ability[] = [
  // ── Melee ──
  {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'A devastating blow that deals 180% weapon damage.',
    archetype: 'melee',
    effectType: 'damage',
    cooldown: 6,
    damageMultiplier: 1.8,
    statScaling: 'str',
    icon: '⚔️',
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: 'Spin and strike all nearby enemies for 140% weapon damage.',
    archetype: 'melee',
    effectType: 'aoe',
    cooldown: 10,
    damageMultiplier: 1.4,
    statScaling: 'str',
    icon: '🌀',
  },
  {
    id: 'battle_cry',
    name: 'Battle Cry',
    description: 'Unleash a war cry, boosting your damage by 25% for 8 seconds.',
    archetype: 'melee',
    effectType: 'buff',
    cooldown: 20,
    statScaling: 'str',
    icon: '📣',
  },
  {
    id: 'rend',
    name: 'Rend',
    description: 'Tear into the enemy, causing them to bleed for 120% damage over 6 seconds.',
    archetype: 'melee',
    effectType: 'debuff',
    cooldown: 8,
    damageMultiplier: 1.2,
    statScaling: 'str',
    icon: '🩸',
  },
  // ── Ranged ──
  {
    id: 'precise_shot',
    name: 'Precise Shot',
    description: 'A carefully aimed shot dealing 200% weapon damage with +15% crit chance.',
    archetype: 'ranged',
    effectType: 'damage',
    cooldown: 7,
    damageMultiplier: 2.0,
    statScaling: 'dex',
    icon: '🏹',
  },
  {
    id: 'shadow_step',
    name: 'Shadow Step',
    description: 'Vanish and reappear behind the enemy, dealing 160% damage.',
    archetype: 'ranged',
    effectType: 'damage',
    cooldown: 12,
    damageMultiplier: 1.6,
    statScaling: 'dex',
    icon: '👤',
  },
  {
    id: 'poison_dart',
    name: 'Poison Dart',
    description: 'Hurl a poisoned dart that deals 80% damage and reduces enemy attack by 20%.',
    archetype: 'ranged',
    effectType: 'debuff',
    cooldown: 9,
    damageMultiplier: 0.8,
    statScaling: 'dex',
    icon: '🎯',
  },
  {
    id: 'evasion',
    name: 'Evasion',
    description: 'Enter a heightened state of awareness, dodging the next 2 attacks.',
    archetype: 'ranged',
    effectType: 'buff',
    cooldown: 18,
    statScaling: 'dex',
    icon: '💨',
  },
  // ── Magic ──
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Hurl a blazing fireball dealing 220% magic damage.',
    archetype: 'magic',
    effectType: 'damage',
    cooldown: 8,
    damageMultiplier: 2.2,
    statScaling: 'int',
    icon: '🔥',
  },
  {
    id: 'frost_nova',
    name: 'Frost Nova',
    description: 'Explode with icy energy, dealing 150% magic damage and slowing enemies.',
    archetype: 'magic',
    effectType: 'aoe',
    cooldown: 14,
    damageMultiplier: 1.5,
    statScaling: 'int',
    icon: '❄️',
  },
  {
    id: 'arcane_bolt',
    name: 'Arcane Bolt',
    description: 'Fire a rapid arcane projectile dealing 170% magic damage.',
    archetype: 'magic',
    effectType: 'damage',
    cooldown: 5,
    damageMultiplier: 1.7,
    statScaling: 'int',
    icon: '✨',
  },
  {
    id: 'mana_shield',
    name: 'Mana Shield',
    description: 'Convert mana into a protective barrier absorbing 200% of your INT in damage.',
    archetype: 'magic',
    effectType: 'buff',
    cooldown: 22,
    statScaling: 'int',
    icon: '🔮',
  },
  // ── Tank ──
  {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Slam your shield into the enemy for 130% damage and stun them briefly.',
    archetype: 'tank',
    effectType: 'damage',
    cooldown: 8,
    damageMultiplier: 1.3,
    statScaling: 'vit',
    icon: '🛡️',
  },
  {
    id: 'iron_skin',
    name: 'Iron Skin',
    description: 'Harden your body, reducing all incoming damage by 40% for 10 seconds.',
    archetype: 'tank',
    effectType: 'buff',
    cooldown: 25,
    statScaling: 'vit',
    icon: '🪨',
  },
  {
    id: 'war_stomp',
    name: 'War Stomp',
    description: 'Slam the ground, dealing 110% damage to all enemies and reducing their defense.',
    archetype: 'tank',
    effectType: 'aoe',
    cooldown: 16,
    damageMultiplier: 1.1,
    statScaling: 'vit',
    icon: '👊',
  },
  {
    id: 'rallying_cry',
    name: 'Rallying Cry',
    description: 'Restore 25% of your maximum HP and boost defense for 12 seconds.',
    archetype: 'tank',
    effectType: 'heal',
    cooldown: 30,
    healMultiplier: 0.25,
    statScaling: 'vit',
    icon: '💚',
  },
];
