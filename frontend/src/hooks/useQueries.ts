import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Character, CharacterCreationError, UserProfile, MarketplaceListing, Realm } from '../backend';

// ── User Profile ──

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
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ── Character ──

export function useGetCharacter() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<Character | null>({
    queryKey: ['character'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCharacter();
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

export interface CreateCharacterParams {
  name: string;
  realm: Realm;
  str: number;
  dex: number;
  int: number;
  vit: number;
}

// Typed error class so callers can distinguish alreadyExists from other errors
export class CharacterAlreadyExistsError extends Error {
  constructor() {
    super('Character already exists');
    this.name = 'CharacterAlreadyExistsError';
  }
}

export function useCreateCharacter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCharacterParams) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createCharacter(params.name, params.realm);
      if (result.__kind__ === 'err') {
        if (result.err === CharacterCreationError.alreadyExists) {
          throw new CharacterAlreadyExistsError();
        }
        throw new Error(`Failed to create character: ${result.err}`);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character'] });
    },
  });
}

// ── Dungeon ──

export function useSubmitDungeonResult() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (xpGained: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitDungeonResult(BigInt(xpGained));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character'] });
    },
  });
}

// ── Marketplace ──

export function useGetMarketplaceListings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MarketplaceListing[]>({
    queryKey: ['marketplaceListings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMarketplaceListings();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useListItemForSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, price }: { itemId: string; price: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.listItemForSale(itemId, price);
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
      return actor.buyItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceListings'] });
    },
  });
}
