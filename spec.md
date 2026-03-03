# Abyss Ascendant

## Current State
Character creation is a 2-step flow: (1) Choose Class, (2) Character Details (name, realm, stats). After creation the player lands on the Character Sheet where they can open the AbilitySelectModal to equip abilities. At level 1 the player has 1 ability point. The bug is that new players miss this step entirely — the ability selection is a post-creation screen that is easy to overlook. There were also reports that Rogue and Mage abilities could not be purchased at level 1 (likely due to the flow being missed, not a logic bug in the modal itself).

## Requested Changes (Diff)

### Add
- Step 3 "Choose Your Ability" in the CharacterCreation flow, inserted between Step 2 (Details) and the final Create button
- The new step displays all 5 class abilities for the selected class as selectable cards
- Player must select exactly 1 ability before they can create the character (they have 1 ability point at level 1)
- Selected ability is passed to `createCharacterMutation` as the initial `equippedAbilities` array
- Selected ability is also saved to localStorage via `saveStarterEquipmentForCharacter` so it persists immediately
- Step indicator updated from 2 steps to 3 steps (Choose Class → Details → Choose Ability)

### Modify
- `CharacterCreation.tsx`: Add `"ability"` to `CreationStep` type; add step 3 UI and logic; pass selected ability on creation; update step indicators
- `useLocalCharacter.ts` / `saveStarterEquipmentForCharacter`: Accept optional initial equipped abilities so they are stored alongside starter equipment

### Remove
- Nothing removed

## Implementation Plan
1. Add `"ability"` to `CreationStep` type in CharacterCreation.tsx
2. Add `selectedAbility` state (single ability name or null)
3. Update step indicators to show 3 steps
4. Add "Continue to Ability" button at the end of Step 2 (after the existing details form), replacing the current "Create Character" button
5. Add Step 3 UI: show all 5 class abilities as clickable cards with icon, name, description, and damage info; one must be selected to enable creation
6. "Create Character" button moves to Step 3 footer, enabled only when an ability is selected
7. On creation, pass `[selectedAbility]` as initial `equippedAbilities` to the backend mutation AND save to localStorage
8. Update `saveStarterEquipmentForCharacter` to accept an optional `initialAbilities` parameter so abilities are stored at the same time as starter equipment
