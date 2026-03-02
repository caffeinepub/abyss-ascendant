# Specification

## Summary
**Goal:** Apply six targeted bug fixes and balance changes to Abyss Ascendant: stat persistence, ability point system rework, monster rebalancing, item affix restrictions, drop rate reduction, and full gold system removal.

**Planned changes:**
- Fix character creation so allocated stat points (Strength, Dexterity, Intelligence, Vitality) are written directly to the character's baseStats in stable storage and never overwritten by defaults after creation
- Rework the ability system: characters start with 1 ability point, gain +1 every 10 levels (11 total at level 100), each ability costs 1 point, purchases are blocked at 0 points, max 3 abilities can be equipped at once, and the ability pool in abilities.ts is expanded to ~15 abilities across melee, ranged, magic, and tank archetypes
- Reduce all monster base damage by ~10–15% and reduce HP scaling per dungeon level by ~10% in monsters.ts and combatEngine.ts
- Restrict random item affixes in lootGenerator.ts to only: Strength, Dexterity, Intelligence, Vitality, +HP, +Physical Damage, +Magic Damage, +Defense, +Critical Chance — removing all other affix types
- Reduce global item drop rate by 50% across all dungeon modes and monster types in lootGenerator.ts
- Completely remove the gold system from both backend (main.mo) and frontend (CharacterSheet, Navigation, loot output, death penalty logic); Softcore death switches to XP loss only; marketplace references ICP instead of gold

**User-visible outcome:** Players will see their stat allocations correctly persist after character creation, ability purchases will be properly gated and capped, early dungeon progression will feel more survivable, item drops will be less frequent with only valid stat affixes, and all gold references will be gone from the UI and game logic.
