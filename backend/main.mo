import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat8 "mo:core/Nat8";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  public type UserProfile = { username : Text };

  public type Realm = { #Softcore; #Hardcore };
  public type CharacterStatus = { #Alive; #Dead };

  public type ItemType = { #Weapon; #Armor; #Trinket };
  public type Rarity = { #Common; #Uncommon; #Rare; #Legendary };

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
    maxHP : Nat;
    currentHP : Nat;
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

  public type CharacterCreationError = { #alreadyExists; #noPermission; #limitReached };
  public type SetHpError = {
    #characterNotFound;
    #noPermission;
    #alreadyFullHP;
    #maxHPExceeded;
  };

  type CharacterId = Nat8;
  type CharacterSlot = { id : CharacterId; character : Character };
  type CharacterIds = CharacterId;
  public type CharStorage = Map.Map<CharacterIds, Character>;
  type CharSlotStorage = List.List<CharacterSlot>;
  type CharPersistentStorage = Map.Map<Principal, CharSlotStorage>;
  type ItemPersistentStorage = Map.Map<Text, Item>;
  type MarketplaceStorage = Map.Map<Text, MarketplaceListing>;
  type ItemArray = [Item];

  var currentSeason = 1;
  var nextCharacterId : Nat8 = 0;
  var characters : CharPersistentStorage = Map.empty<Principal, CharSlotStorage>();
  var items : ItemPersistentStorage = Map.empty<Text, Item>();
  var marketplace : MarketplaceStorage = Map.empty<Text, MarketplaceListing>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  let itemImages = Map.empty<Text, Storage.ExternalBlob>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  include MixinStorage();

  func getNextCharacterId() : CharacterId {
    let newId = nextCharacterId;
    nextCharacterId += 1;
    newId;
  };

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

  public shared ({ caller }) func createCharacter(name : Text, realm : Realm) : async {
    #ok : CharacterId;
    #err : CharacterCreationError;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err(#noPermission);
    };

    let existingCharacters = switch (characters.get(caller)) {
      case (null) { List.empty<CharacterSlot>() };
      case (?chars) { chars };
    };
    if (existingCharacters.size() >= 8) { return #err(#limitReached) };

    let newCharacter : Character = {
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
      maxHP = 20;
      currentHP = 20;
    };

    let newId = getNextCharacterId();
    let newSlot : CharacterSlot = { id = newId; character = newCharacter };
    let updatedCharacters = List.fromArray<CharacterSlot>(existingCharacters.toArray());
    updatedCharacters.add(newSlot);
    characters.add(caller, updatedCharacters);
    #ok(newId);
  };

  public shared ({ caller }) func setCharacterHp(characterId : CharacterId, hp : Nat) : async {
    #ok : ();
    #err : SetHpError;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err(#noPermission);
    };

    switch (characters.get(caller)) {
      case (null) { #err(#characterNotFound) };
      case (?characterSlots) {
        var found = false;
        let updatedSlotsArray = characterSlots.toArray().map(
          func(slot) {
            if (slot.id == characterId) {
              found := true;
              let character = slot.character;
              if (hp > character.maxHP) {
                return { slot with character = { character with currentHP = character.maxHP } };
              };
              return { slot with character = { character with currentHP = hp } };
            };
            slot;
          }
        );
        if (not found) { return #err(#characterNotFound) };
        let updatedSlots = List.fromArray<CharacterSlot>(updatedSlotsArray);
        characters.add(caller, updatedSlots);
        #ok(());
      };
    };
  };

  public shared ({ caller }) func deleteCharacter(characterId : CharacterId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete characters");
    };

    switch (characters.get(caller)) {
      case (null) { Runtime.trap("Character not found or unauthorized") };
      case (?characterSlots) {
        let filteredSlots = characterSlots.filter(
          func(slot) {
            slot.id != characterId;
          }
        );
        if (filteredSlots.size() == characterSlots.size()) {
          Runtime.trap("Character not found or unauthorized");
        };
        characters.add(caller, filteredSlots);
      };
    };
  };

  public query ({ caller }) func getCharacters() : async [Character] {
    switch (characters.get(caller)) {
      case (null) { [] };
      case (?chars) {
        let charArray = chars.toArray();
        charArray.map(func(slot) { slot.character });
      };
    };
  };

  public query func getItem(itemId : Text) : async ?Item {
    items.get(itemId);
  };

  public query func getMarketplaceListings() : async [MarketplaceListing] {
    marketplace.values().toArray();
  };

  public shared ({ caller }) func listItemForSale(itemId : Text, price : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Only authenticated users can list items for sale");
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
      Runtime.trap("Only authenticated users can buy items");
    };

    let listing = switch (marketplace.get(itemId)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) { listing };
    };

    if (listing.seller == caller) { Runtime.trap("Cannot buy own item") };

    let updatedItem : Item = { listing.item with owner = caller };
    items.add(itemId, updatedItem);
    marketplace.remove(itemId);
  };

  public shared ({ caller }) func uploadItemImage(itemId : Text, externalBlob : Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Only authenticated users can upload item images");
    };
    switch (items.get(itemId)) {
      case (null) { Runtime.trap("Item does not exist") };
      case (?item) {
        if (item.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Cannot upload image for items you do not own");
        };
        itemImages.add(itemId, externalBlob);
      };
    };
  };

  public query func getItemImage(itemId : Text) : async Storage.ExternalBlob {
    switch (itemImages.get(itemId)) {
      case (?externalBlob) { externalBlob };
      case (null) { Runtime.trap("Item image does not exist") };
    };
  };
};
