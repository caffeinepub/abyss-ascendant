# Specification

## Summary
**Goal:** Fix equipment stats being applied to effective stats, add variety to monster names via prefix/suffix generation, and expose attack speed (ticks between attacks) as a visible stat for players and monsters.

**Planned changes:**
- Add base physical damage to generated Weapon items and base defense to generated Armor items in `lootGenerator.ts`, scaled by rarity and item level.
- Update `combatEngine.ts` player stat derivation to iterate over all equipped items and sum their base values plus all affixes on top of base character stats before combat calculations.
- Update `CharacterSheet.tsx` to display effective stats that include all equipped item contributions, and add a "Ticks Between Attacks" row in the derived stats section.
- Add a prefix/suffix name generation system in `monsters.ts` with at least 8 prefixes and 6 suffixes; apply randomly on each monster spawn to produce unique display names (e.g. "Cursed Goblin Brute").
- Update `DungeonRunScreen.tsx` and combat log to display monster names with their generated prefix/suffix.
- Derive player attack interval (ticks between attacks) from effective stats in `combatEngine.ts` and display each monster's ticks-between-attacks value alongside its HP bar in `DungeonRunScreen.tsx`.

**User-visible outcome:** Equipping weapons and armor now meaningfully increases player damage and defense. Every monster encountered has a unique themed name. Both the character sheet and the dungeon screen show how many ticks separate each attacker's strikes.
