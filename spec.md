# Specification

## Summary
**Goal:** Introduce procedural monster generation using prefix+suffix combinations and update XP rewards to scale additively with monster stats.

**Planned changes:**
- Expand `monsters.ts` with at least 10 prefixes (e.g., Ancient, Infernal, Cursed, Withered, Verdant, Dread, Spectral, Molten, Forsaken, Elder) and 10 suffixes (e.g., Goblin, Warlord, Shade, Colossus, Serpent, Revenant, Wraith, Titan, Fiend, Elder God), each carrying stat modifier objects (HP, attack, defense).
- Add a monster generation function that combines a random prefix and suffix to produce a unique monster name and final stats (base stats + prefix modifiers + suffix modifiers).
- Update `combatEngine.ts` XP formula to: Final XP = baseXP(level) + (equalBonus × monsterHP) + (equalBonus × monsterAttack) + (equalBonus × monsterDefense), with all three stat bonuses using the same per-point rate.
- Update `DungeonRunScreen` and `DungeonSelectScreen` to generate a procedural monster at run start and pass its combined stats and full "Prefix Suffix" name to the combat engine and combat log.

**User-visible outcome:** Each dungeon run now fights a uniquely named procedural monster (e.g., "Infernal Titan"), and monsters with stronger stats award noticeably more XP than weaker ones at the same level.
