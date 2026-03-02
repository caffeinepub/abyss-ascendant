import Map "mo:core/Map";
import List "mo:core/List";
import Nat8 "mo:core/Nat8";

module {
  public type Rarity = {
    #Common;
    #Uncommon;
    #Rare;
    #Legendary;
  };

  public type Item = {
    id : Text;
    name : Text;
    itemType : {
      #Weapon;
      #Armor;
      #Trinket;
    };
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

  public type Character = {
    name : Text;
    realm : {
      #Softcore;
      #Hardcore;
    };
    classTier : Nat;
    level : Nat;
    xp : Nat;
    season : Nat;
    status : {
      #Alive;
      #Dead;
    };
    str : Nat;
    dex : Nat;
    int : Nat;
    vit : Nat;
    maxHP : Nat;
    currentHP : Nat;
  };

  public type CharacterSlot = {
    id : Nat8;
    character : Character;
  };

  public type OldActor = {
    characters : Map.Map<Principal, List.List<CharacterSlot>>;
  };

  public type NewActor = {
    characters : Map.Map<Principal, List.List<CharacterSlot>>;
  };

  public func run(old : OldActor) : NewActor { old };
};
