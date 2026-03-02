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
export interface Character {
    xp: bigint;
    dex: bigint;
    int: bigint;
    str: bigint;
    vit: bigint;
    status: CharacterStatus;
    name: string;
    season: bigint;
    level: bigint;
    classTier: bigint;
    realm: Realm;
}
export interface UserProfile {
    username: string;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    buyItem(itemId: string): Promise<void>;
    createCharacter(name: string, realm: Realm): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCharacter(): Promise<Character | null>;
    getItem(itemId: string): Promise<Item | null>;
    getItemImage(itemId: string): Promise<ExternalBlob>;
    getMarketplaceListings(): Promise<Array<MarketplaceListing>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listItemForSale(itemId: string, price: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitDungeonResult(xpGained: bigint): Promise<void>;
    uploadItemImage(itemId: string, externalBlob: ExternalBlob): Promise<void>;
}
