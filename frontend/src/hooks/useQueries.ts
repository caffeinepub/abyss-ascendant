import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  Character,
  CharacterCreationParams,
  DungeonResult,
  UserProfile,
  MarketplaceListing,
  CharacterCreationError,
  SetHpError,
} from '../backend';

export class CharacterLimitReachedError extends Error {
  constructor() {
    super('Character limit reached');
    this.name = 'CharacterLimitReachedError';
  }
}

export function useGetCharacters() {
  const { actor, isFetching } = useActor();

  return useQuery<Character[]>({
    queryKey: ['characters'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCharacters();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCharacter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CharacterCreationParams) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createCharacter(params);
      if (result.__kind__ === 'err') {
        if (result.err === CharacterCreationError.limitReached) {
          throw new CharacterLimitReachedError();
        }
        throw new Error(`Failed to create character: ${result.err}`);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useDeleteCharacter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (characterId: number) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteCharacter(characterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useSetCharacterHp() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ characterId, hp }: { characterId: number; hp: number }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.setCharacterHp(characterId, BigInt(Math.floor(hp)));
      if (result.__kind__ === 'err') {
        // Don't throw on alreadyFullHP - it's not a real error
        if (result.err === SetHpError.alreadyFullHP) return;
        throw new Error(`Failed to set HP: ${result.err}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useSubmitDungeonResult() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (result: DungeonResult) => {
      if (!actor) throw new Error('Actor not available');
      await actor.submitDungeonResult(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useSpendStatPoints() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ characterId, pointsSpent }: { characterId: number; pointsSpent: number }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.spendStatPoints(characterId, BigInt(pointsSpent));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetMarketplaceListings() {
  const { actor, isFetching } = useActor();

  return useQuery<MarketplaceListing[]>({
    queryKey: ['marketplaceListings'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMarketplaceListings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListItemForSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, price }: { itemId: string; price: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.listItemForSale(itemId, price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceListings'] });
    },
  });
}

export function useBuyItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.buyItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceListings'] });
    },
  });
}
