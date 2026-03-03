# Abyss Ascendant

## Current State
- XPBar component has a "compact" variant used in Navigation.tsx that shows a filled progress bar BUT also renders `{Math.floor(progress)}%` text next to it
- DungeonRunScreen starts combat simulation synchronously on mount (no delay there), but the `handleContinue` function calls `submitDungeonResult.mutate` and `setCharacterHp.mutate` (backend ICP update calls) — these are fire-and-forget but the ~10 second delay is likely caused by `handleStartDungeon` in App.tsx triggering a state change that re-renders DungeonRunScreen, which involves backend query calls before showing anything OR it's waiting on the `useActor` hook to re-initialize
- The combat simulation itself runs synchronously in `useEffect` on mount, so the log should appear immediately — the delay may be coming from the App.tsx rendering cycle awaiting actor availability, or from the dungeon screen mount being delayed by React reconciliation after navigation

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
1. **XPBar.tsx compact variant**: Remove the `{Math.floor(progress)}%` percentage text. Replace with a cleaner label showing `{xpIntoLevel} / {xpNeeded} XP` in smaller text, or simply widen the bar so the visual speaks for itself. No percentage anywhere.
2. **DungeonRunScreen.tsx**: Pre-compute the combat result BEFORE transitioning to the dungeon screen, so by the time the component mounts, the result is already available and the log animation begins instantly. Pass the pre-computed result as a prop. This eliminates the React mount → useEffect → simulateCombat → setState cycle delay.
   - In App.tsx `handleStartDungeon`: run `simulateCombat` with character stats immediately and pass the result to DungeonRunScreen
   - In DungeonRunScreen: accept an optional `preComputedResult` prop; if provided, initialize state from it directly (skip the useEffect combat simulation)
   - Backend calls (submitDungeonResult, setCharacterHp) remain async fire-and-forget — no change

### Remove
- The `{Math.floor(progress)}%` text from the compact XPBar variant

## Implementation Plan
1. Edit `XPBar.tsx`: In the compact branch, remove the `<span>` that renders `{Math.floor(progress)}%`. Optionally add a small `xpIntoLevel/xpNeeded` label if it fits, otherwise just show bar + level.
2. Edit `App.tsx`: In `handleStartDungeon`, compute combat result immediately using `simulateCombat` with current character stats. Store it in state (`preComputedCombatResult`). Pass it to `DungeonRunScreen`.
3. Edit `DungeonRunScreen.tsx`: Accept `preComputedResult?: CombatResult` prop. In the mount useEffect, if `preComputedResult` is provided, use it directly instead of calling `simulateCombat`. This removes the computation lag from the dungeon screen mount.
4. Typecheck and build to confirm no regressions.
