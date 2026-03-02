import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Character, CharacterId, CharacterCreationError, Realm, SetHpError } from '../backend';

export class CharacterAlreadyExistsError extends Error {
  constructor() {
    super('Character already exists');
    this.name = 'CharacterAlreadyExistsError';
  }
}

export class CharacterLimitReachedError extends Error {
  constructor() {
    super('Maximum 8 characters reached');
    this.name = 'CharacterLimitReachedError';
  }
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery({
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
    mutationFn: async (profile: { username: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCharacters() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Character[]>({
    queryKey: ['characters'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCharacters();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateCharacter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, realm }: { name: string; realm: Realm }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createCharacter(name, realm);
      if (result.__kind__ === 'err') {
        if (result.err === CharacterCreationError.alreadyExists) {
          throw new CharacterAlreadyExistsError();
        }
        if (result.err === CharacterCreationError.limitReached) {
          throw new CharacterLimitReachedError();
        }
        throw new Error(`Character creation failed: ${result.err}`);
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
    mutationFn: async (characterId: CharacterId) => {
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

  return useMutation({
    mutationFn: async ({ characterId, hp }: { characterId: CharacterId; hp: number }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.setCharacterHp(characterId, BigInt(hp));
      if (result.__kind__ === 'err') {
        // alreadyFullHP is not a real error for our purposes
        if (result.err === SetHpError.alreadyFullHP) return;
        throw new Error(`Set HP failed: ${result.err}`);
      }
    },
  });
}

export function useGetMarketplaceListings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ['marketplaceListings'],
    queryFn: async () => {
      if (!actor) return [];
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
