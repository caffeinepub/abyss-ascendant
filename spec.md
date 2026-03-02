# Specification

## Summary
**Goal:** Fix post-login routing so that players with an existing character for a selected realm skip character creation and land directly on the character sheet/dungeon screen.

**Planned changes:**
- In `App.tsx`, after login and realm selection, query the backend for an existing character before rendering any screen; route directly to the character sheet/dungeon select screen if one exists, otherwise show `CharacterCreationScreen` as normal
- In `App.tsx`, if `createCharacter` returns an `#alreadyExists` error (e.g. race condition), silently redirect to the character sheet/dungeon select screen instead of showing an error or crashing
- In `backend/main.mo`, ensure `createCharacter` returns a distinct `#alreadyExists` error variant when a character already exists for the calling principal in the selected realm and current season

**User-visible outcome:** After logging in and selecting a realm, players who already have a character are taken straight to the character sheet/dungeon screen without seeing the character creation screen. New players still go through character creation as before.
