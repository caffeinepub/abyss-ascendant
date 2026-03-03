import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Ability,
  Character,
  CharacterId,
  DungeonResult,
  MarketplaceListing,
  StatsUpdate,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export class CharacterLimitReachedError extends Error {
  constructor() {
    super("Character limit reached");
    this.name = "CharacterLimitReachedError";
  }
}

export function useGetCharacters() {
  const { actor } = useActor();

  return useQuery<Character[]>({
    queryKey: ["characters"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCharacters();
    },
    // Gate only on actor presence — isFetching guard caused a race condition
    // where the query never fired if the actor resolved during a refetch cycle.
    enabled: !!actor,
    // Always re-fetch when the component mounts to pick up on-chain state
    refetchOnMount: true,
    staleTime: 0,
  });
}

export function useGetCharacter(characterId: CharacterId | null) {
  const { actor } = useActor();

  return useQuery<Character | null>({
    queryKey: ["character", characterId],
    queryFn: async () => {
      if (!actor || characterId === null) return null;
      return actor.getCharacter(characterId);
    },
    enabled: !!actor && characterId !== null,
  });
}

export function useCreateCharacter() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      class: string;
      realm: import("../backend").Realm;
      str: bigint;
      dex: bigint;
      int: bigint;
      vit: bigint;
      equippedAbilities: Ability[];
    }) => {
      // Read actor fresh from query cache at call time to avoid stale closure.
      const actorQueryKey = ["actor", identity?.getPrincipal().toString()];
      const actor =
        queryClient.getQueryData<import("../backend").backendInterface>(
          actorQueryKey,
        );
      if (!actor) throw new Error("Actor not available");
      const result = await actor.createCharacter(params);
      if (result.__kind__ === "err") {
        if (result.err === "limitReached") {
          throw new CharacterLimitReachedError();
        }
        throw new Error(`Failed to create character: ${result.err}`);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useDeleteCharacter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (characterId: CharacterId) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteCharacter(characterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useUpdateStats() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      characterId,
      statsUpdate,
    }: {
      characterId: CharacterId;
      statsUpdate: StatsUpdate;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateStats(characterId, statsUpdate);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({
        queryKey: ["character", variables.characterId],
      });
    },
  });
}

export function useSpendStatPoints() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      characterId,
      pointsSpent,
    }: {
      characterId: CharacterId;
      pointsSpent: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.spendStatPoints(characterId, pointsSpent);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({
        queryKey: ["character", variables.characterId],
      });
    },
  });
}

export function useSubmitDungeonResult() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (result: DungeonResult) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitDungeonResult(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useSetCharacterHp() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      characterId,
      hp,
    }: {
      characterId: CharacterId;
      hp: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setCharacterHp(characterId, hp);
    },
    // Do NOT invalidate here to preserve live HP state during regen
  });
}

export function useEquipAbilities() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      characterId,
      abilities,
    }: {
      characterId: CharacterId;
      abilities: Ability[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.equipAbilities(characterId, abilities);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({
        queryKey: ["character", variables.characterId],
      });
    },
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
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
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetMarketplaceListings() {
  const { actor, isFetching } = useActor();

  return useQuery<MarketplaceListing[]>({
    queryKey: ["marketplaceListings"],
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
    mutationFn: async ({
      itemId,
      price,
    }: { itemId: string; price: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.listItemForSale(itemId, price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplaceListings"] });
    },
  });
}

export function useBuyItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.buyItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplaceListings"] });
    },
  });
}
