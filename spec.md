# Abyss Ascendant

## Current State
Version 57 introduced the XP bar fix. However, the `useCreateCharacter` hook in `useQueries.ts` regressed — the stale closure fix from v54 was not properly applied. The comment said "Re-read actor from query cache" but the code still did `const actor = _actor` (a plain copy of the closed-over value), meaning it used a potentially stale actor reference captured at render time instead of the live value.

This causes:
1. "Failed to create character" error on the character creation final step
2. No characters shown on the select screen (related actor initialization race)

## Requested Changes (Diff)

### Add
- Nothing new added.

### Modify
- `useCreateCharacter` in `useQueries.ts`: Read the actor fresh from the query client cache at mutation call time, using `queryClient.getQueryData(["actor", identity?.getPrincipal().toString()])`. This requires importing `useInternetIdentity` in this file.

### Remove
- Remove the stale `const { actor: _actor } = useActor()` pattern from `useCreateCharacter`.

## Implementation Plan
1. Import `useInternetIdentity` in `useQueries.ts`
2. Replace `useActor()` in `useCreateCharacter` with `useInternetIdentity()` to get the identity (for the cache key)
3. Inside `mutationFn`, use `queryClient.getQueryData(["actor", identity?.getPrincipal().toString()])` to get the live actor at call time
