# Specification

## Summary
**Goal:** Fix the non-functional "Enter The Realm" button in `CharacterSelectScreen.tsx` so that clicking it with a selected character correctly triggers navigation.

**Planned changes:**
- In `CharacterSelectScreen.tsx`: audit and fix the `onClick` handler on the "Enter The Realm" button — ensure it is not conditionally disabled, is always rendered with an `onClick`, correctly calls `onSelectCharacter` with the selected character's ID, is never blocked by `pointer-events-none` or `stopPropagation`, and that the selected character state is non-null when clicked.
- In `App.tsx`: audit and fix the `onSelectCharacter` callback — ensure it is defined (never `undefined`) at render time, correctly writes the selected character ID into app-level state, immediately transitions routing state to the character sheet/dungeon select screen, and that no loading flag or guard silently blocks the screen transition after the callback fires.

**User-visible outcome:** Clicking "Enter The Realm" with a character selected immediately navigates to the character sheet or dungeon select screen on the first click, with no blank screen, spinner, or silence.
