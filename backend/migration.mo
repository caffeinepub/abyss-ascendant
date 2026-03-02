import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

module {
  public type MarketplaceListing = {
    item : Item;
    price : Nat;
    seller : Principal;
    active : Bool;
  };

  public type Item = {
    id : Text;
    name : Text;
    itemType : ItemType;
    rarity : Rarity;
    stats : {
      str : Nat;
      dex : Nat;
      int : Nat;
      vit : Nat;
      bonus : Text;
    };
    owner : Principal;
  };

  public type ItemType = { #Weapon; #Armor; #Trinket };
  public type Rarity = {
    #Common;
    #Uncommon;
    #Rare;
    #Legendary;
  };

  public type Character = {
    name : Text;
    realm : Realm;
    classTier : Nat;
    level : Nat;
    xp : Nat;
    season : Nat;
    status : CharacterStatus;
    str : Nat;
    dex : Nat;
    int : Nat;
    vit : Nat;
  };

  public type Realm = { #Softcore; #Hardcore };
  public type CharacterStatus = { #Alive; #Dead };

  public type UserProfile = {
    username : Text;
  };

  public type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    currentSeason : Nat;
    characters : Map.Map<Principal, Character>;
    items : Map.Map<Text, Item>;
    marketplace : Map.Map<Text, MarketplaceListing>;
    itemImages : Map.Map<Text, Storage.ExternalBlob>;
    accessControlState : AccessControl.AccessControlState;
  };

  public type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    currentSeason : Nat;
    characters : Map.Map<Principal, Character>;
    items : Map.Map<Text, Item>;
    marketplace : Map.Map<Text, MarketplaceListing>;
    itemImages : Map.Map<Text, Storage.ExternalBlob>;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor { old };
};
