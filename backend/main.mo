import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Text "mo:core/Text";


import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // ── User profiles (required by frontend) ──

  public type UserProfile = {
    username : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ── Game types ──

  public type Realm = { #Softcore; #Hardcore };
  public type CharacterStatus = { #Alive; #Dead };

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

  public type ItemType = { #Weapon; #Armor; #Trinket };
  public type Rarity = {
    #Common;
    #Uncommon;
    #Rare;
    #Legendary;
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

  public type MarketplaceListing = {
    item : Item;
    price : Nat;
    seller : Principal;
    active : Bool;
  };

  // ── Game state ──

  var currentSeason = 1;
  let characters = Map.empty<Principal, Character>();
  let items = Map.empty<Text, Item>();
  let marketplace = Map.empty<Text, MarketplaceListing>();

  // ── Character functions ──

  public shared ({ caller }) func createCharacter(name : Text, realm : Realm) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create characters");
    };
    if (characters.containsKey(caller)) { Runtime.trap("Character already exists") };

    let character : Character = {
      name;
      realm;
      classTier = 1;
      level = 1;
      xp = 0;
      season = currentSeason;
      status = #Alive;
      str = 1;
      dex = 1;
      int = 1;
      vit = 1;
    };

    characters.add(caller, character);
  };

  public query ({ caller }) func getCharacter() : async ?Character {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can access their character");
    };
    characters.get(caller);
  };

  // ── Item functions ──

  public query func getItem(itemId : Text) : async ?Item {
    items.get(itemId);
  };

  // ── Marketplace functions ──

  public query func getMarketplaceListings() : async [MarketplaceListing] {
    marketplace.values().toArray();
  };

  public shared ({ caller }) func listItemForSale(itemId : Text, price : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can list items for sale");
    };

    let item = switch (items.get(itemId)) {
      case (null) { Runtime.trap("Item does not exist") };
      case (?item) { item };
    };

    if (item.owner != caller) { Runtime.trap("Not item owner") };

    let listing : MarketplaceListing = {
      item;
      price;
      seller = caller;
      active = true;
    };

    marketplace.add(itemId, listing);
  };

  public shared ({ caller }) func buyItem(itemId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can buy items");
    };

    let listing = switch (marketplace.get(itemId)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) { listing };
    };

    if (listing.seller == caller) { Runtime.trap("Cannot buy own item") };

    let updatedItem : Item = {
      listing.item with
      owner = caller
    };

    items.add(itemId, updatedItem);
    marketplace.remove(itemId);
  };

  // ── Combat / dungeon functions ──

  public shared ({ caller }) func submitDungeonResult(xpGained : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can submit dungeon results");
    };

    let character = switch (characters.get(caller)) {
      case (null) { Runtime.trap("Character does not exist") };
      case (?character) { character };
    };

    if (character.status == #Dead) { Runtime.trap("Character is dead") };

    let updatedCharacter : Character = {
      character with
      xp = character.xp + xpGained
    };

    characters.add(caller, updatedCharacter);
  };

  // ── Item image storage ──

  let itemImages = Map.empty<Text, Storage.ExternalBlob>();

  public shared ({ caller }) func uploadItemImage(itemId : Text, externalBlob : Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can upload item images");
    };
    let item = switch (items.get(itemId)) {
      case (null) { Runtime.trap("Item does not exist") };
      case (?item) { item };
    };
    if (item.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Cannot upload image for items you do not own");
    };
    itemImages.add(itemId, externalBlob);
  };

  public query func getItemImage(itemId : Text) : async Storage.ExternalBlob {
    switch (itemImages.get(itemId)) {
      case (?externalBlob) { externalBlob };
      case (null) { Runtime.trap("Item image does not exist") };
    };
  };
};
