import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type CharacterId = number;
export interface AdvancedStats {
    maxHP: bigint;
    currentHP: bigint;
    critChance: bigint;
    critPower: bigint;
}
export interface Character {
    xp: bigint;
    status: CharacterStatus;
    totalStatPointsEarned: bigint;
    name: string;
    season: bigint;
    level: bigint;
    baseStats: BaseStats;
    advancedStats: AdvancedStats;
    classTier: bigint;
    realm: Realm;
    totalStatPointsSpent: bigint;
}
export interface CharacterCreationParams {
    dex: bigint;
    int: bigint;
    str: bigint;
    vit: bigint;
    name: string;
    realm: Realm;
}
export interface MarketplaceListing {
    active: boolean;
    item: Item;
    seller: Principal;
    price: bigint;
}
export interface Item {
    id: string;
    owner: Principal;
    name: string;
    stats: {
        dex: bigint;
        int: bigint;
        str: bigint;
        vit: bigint;
        bonus: string;
    };
    itemType: ItemType;
    rarity: Rarity;
}
export interface DungeonResult {
    unspentStatPoints: bigint;
    newLevel: bigint;
    xpEarned: bigint;
    characterId: CharacterId;
}
export interface BaseStats {
    dex: bigint;
    int: bigint;
    str: bigint;
    vit: bigint;
}
export interface UserProfile {
    username: string;
}
export enum CharacterCreationError {
    noPermission = "noPermission",
    alreadyExists = "alreadyExists",
    limitReached = "limitReached"
}
export enum CharacterStatus {
    Dead = "Dead",
    Alive = "Alive"
}
export enum ItemType {
    Weapon = "Weapon",
    Armor = "Armor",
    Trinket = "Trinket"
}
export enum Rarity {
    Rare = "Rare",
    Uncommon = "Uncommon",
    Legendary = "Legendary",
    Common = "Common"
}
export enum Realm {
    Hardcore = "Hardcore",
    Softcore = "Softcore"
}
export enum SetHpError {
    noPermission = "noPermission",
    characterNotFound = "characterNotFound",
    maxHPExceeded = "maxHPExceeded",
    alreadyFullHP = "alreadyFullHP"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    buyItem(itemId: string): Promise<void>;
    createCharacter(params: CharacterCreationParams): Promise<{
        __kind__: "ok";
        ok: CharacterId;
    } | {
        __kind__: "err";
        err: CharacterCreationError;
    }>;
    deleteCharacter(characterId: CharacterId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCharacters(): Promise<Array<Character>>;
    getItem(itemId: string): Promise<Item | null>;
    getItemImage(itemId: string): Promise<ExternalBlob>;
    getMarketplaceListings(): Promise<Array<MarketplaceListing>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listItemForSale(itemId: string, price: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setCharacterHp(characterId: CharacterId, hp: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: SetHpError;
    }>;
    spendStatPoints(characterId: CharacterId, pointsSpent: bigint): Promise<void>;
    submitDungeonResult(result: DungeonResult): Promise<void>;
    uploadItemImage(itemId: string, externalBlob: ExternalBlob): Promise<void>;
}
