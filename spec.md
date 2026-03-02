# Specification

## Summary
**Goal:** Grant new characters starter equipment at creation time and replace the non-functional drop rate slider in the Dungeon Select screen with a static informational display.

**Planned changes:**
- At character creation, automatically generate and equip a level 1 Common weapon and a level 1 Common armor piece using the existing `lootGenerator.ts` logic, placing them directly into the character's equipped weapon and armor slots.
- Ensure the starter weapon provides meaningful base physical damage (well above 1 damage per hit vs. level 1 monsters) and the starter armor provides meaningful base defense (noticeably reducing incoming ~13 damage from level 1 monsters).
- Remove the non-functional drop rate scroller/slider from `DungeonSelectScreen.tsx`.
- Replace it with a static read-only text display showing the effective drop rate and XP rate for the selected monster level, calculated from the existing formula (6% base, −1% per level the monster is below the player, floor 0%).

**User-visible outcome:** New characters always start with a weapon and armor equipped so early combat is viable. The Dungeon Select screen no longer shows a broken slider, instead cleanly displaying the calculated drop rate and XP rate as informational text.
