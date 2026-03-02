# Specification

## Summary
**Goal:** Fix three bugs in the character management flow: stat point allocation not persisting, abilities being incorrectly disabled at level 1, and missing class labels on the character select screen.

**Planned changes:**
- Fix LevelUpModal stat point allocation so that points spent on STR, DEX, INT, and VIT are correctly saved and immediately reflected in the Character tab
- Fix AbilitySelectModal so that abilities are enabled and selectable when the character has at least one unspent ability point (including at level 1); abilities are only grayed out when no points remain or all slots are filled
- Display each character's class name (Warrior, Rogue, Mage) as a visible label on their card in the Character Select screen

**User-visible outcome:** Players can spend stat points during level-up and see the updated stats in the Character tab, select abilities starting at level 1, and immediately see each character's class on the character select screen.
