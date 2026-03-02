# Specification

## Summary
**Goal:** Fix two combat bugs: HP resetting to max on character re-select, and player/enemy attack tick rates not using the correct default values.

**Planned changes:**
- Save the character's current HP to persistent state (backend or local) before navigating away from the dungeon/game screen, and restore it when the same character is re-selected on the character select screen
- Define a named constant `PLAYER_ATTACK_INTERVAL = 12` in the combat engine so the player attacks once every 12 ticks instead of every tick
- Define enemy attack tick rate as `21 - Math.floor((enemyLevel - 1) / 5)` ticks (level 1 = 21 ticks, level 5 = 20 ticks, level 10 = 19 ticks, etc.) using named constants in the combat engine

**User-visible outcome:** A character's HP is preserved when backing out to character select and re-entering, and combat timing is corrected so the player attacks every 12 ticks and enemies attack at the appropriate scaled rate based on their level.
