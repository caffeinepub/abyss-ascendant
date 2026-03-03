import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Nat8 "mo:core/Nat8";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";

actor {
  let maxStats = 100;
  let maxLevel = 50;
  let baseStat = 1;
  var nextCharacterId : Nat8 = 0;
  var currentSeason = 1;

  type CharacterId = Nat8;
  type CharacterIds = CharacterId;
  type CharacterSlot = { id : CharacterId; character : Character };
  type CharStorage = Map.Map<CharacterIds, Character>;
  type CharSlotStorage = List.List<CharacterSlot>;
  type CharPersistentStorage = Map.Map<Principal, CharSlotStorage>;
  type ItemPersistentStorage = Map.Map<Text, Item>;
  type MarketplaceStorage = Map.Map<Text, MarketplaceListing>;
  type ItemArray = [Item];

  var characters : CharPersistentStorage = Map.empty<Principal, CharSlotStorage>();
  var items : ItemPersistentStorage = Map.empty<Text, Item>();
  var marketplace : MarketplaceStorage = Map.empty<Text, MarketplaceListing>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let itemImages = Map.empty<Text, Storage.ExternalBlob>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  include MixinStorage();

  public type UserProfile = { username : Text };

  public type Realm = { #Softcore; #Hardcore };
  public type CharacterStatus = { #Alive; #Dead };

  public type BaseStats = {
    str : Nat;
    dex : Nat;
    int : Nat;
    vit : Nat;
  };

  public type AdvancedStats = {
    maxHP : Nat;
    currentHP : Nat;
    critChance : Nat;
    critPower : Nat;
  };

  public type Ability = {
    name : Text;
    description : Text;
    type_ : Text;
    element : Text;
    power : Nat;
  };

  public type Character = {
    name : Text;
    class_ : Text;
    realm : Realm;
    classTier : Nat;
    level : Nat;
    xp : Nat;
    season : Nat;
    status : CharacterStatus;
    baseStats : BaseStats;
    advancedStats : AdvancedStats;
    totalStatPointsEarned : Nat;
    totalStatPointsSpent : Nat;
    equippedAbilities : [Ability];
  };

  public type ItemType = { #Weapon; #Armor; #Trinket };
  public type Rarity = { #Common; #Uncommon; #Rare; #Legendary };

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

  public type CharacterCreationParams = {
    name : Text;
    class_ : Text;
    realm : Realm;
    str : Nat;
    dex : Nat;
    int : Nat;
    vit : Nat;
    equippedAbilities : [Ability];
  };

  public type StatsUpdate = {
    strIncrease : Nat;
    dexIncrease : Nat;
    intIncrease : Nat;
    vitIncrease : Nat;
  };

  public type CharacterCreationError = { #alreadyExists; #noPermission; #limitReached };
  public type SetHpError = {
    #characterNotFound;
    #noPermission;
    #alreadyFullHP;
    #maxHPExceeded;
  };

  public type DungeonResult = {
    characterId : CharacterId;
    xpEarned : Nat;
    newLevel : Nat;
    unspentStatPoints : Nat;
  };

  func getUnspentStatPoints(character : Character) : Nat {
    character.totalStatPointsEarned - character.totalStatPointsSpent;
  };

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

  public shared ({ caller }) func submitDungeonResult(result : DungeonResult) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can submit dungeon results");
    };

    switch (characters.get(caller)) {
      case (null) { Runtime.trap("Character not found for caller") };
      case (?characterSlots) {
        let maybeCharacter = characterSlots.toArray().find(func(slot) { slot.id == result.characterId });
        switch (maybeCharacter) {
          case (null) { Runtime.trap("Character ID not found for caller") };
          case (?_) {
            let updatedCharacterSlots = characterSlots.map<CharacterSlot, CharacterSlot>(
              func(slot) {
                if (slot.id == result.characterId) {
                  let updatedCharacter : Character = {
                    slot.character with xp = result.xpEarned;
                    level = result.newLevel;
                    totalStatPointsEarned = Nat.max(slot.character.totalStatPointsEarned, result.newLevel - 1);
                  };
                  { slot with character = updatedCharacter };
                } else {
                  slot;
                };
              }
            );
            characters.add(caller, updatedCharacterSlots);
          };
        };
      };
    };
  };

  public shared ({ caller }) func spendStatPoints(characterId : CharacterId, pointsSpent : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can spend stat points");
    };

    switch (characters.get(caller)) {
      case (null) { Runtime.trap("Character not found for caller") };
      case (?characterSlots) {
        let maybeCharacter = characterSlots.toArray().find(func(slot) { slot.id == characterId });
        switch (maybeCharacter) {
          case (null) { Runtime.trap("Character ID not found for caller") };
          case (?_) {
            let updatedCharacterSlots = characterSlots.map<CharacterSlot, CharacterSlot>(
              func(slot) {
                if (slot.id == characterId) {
                  let updatedCharacter : Character = {
                    slot.character with totalStatPointsSpent = pointsSpent;
                  };
                  { slot with character = updatedCharacter };
                } else {
                  slot;
                };
              }
            );
            characters.add(caller, updatedCharacterSlots);
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateStats(characterId : CharacterId, statsUpdate : StatsUpdate) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update stats");
    };

    func increaseStat(current : Nat, increase : Nat) : Nat {
      if (increase > 0) { current + increase } else { current };
    };

    switch (characters.get(caller)) {
      case (null) { Runtime.trap("Character not found for caller") };
      case (?characterSlots) {
        let maybeCharacter = characterSlots.toArray().find(func(slot) { slot.id == characterId });
        switch (maybeCharacter) {
          case (null) { Runtime.trap("Character ID not found for caller") };
          case (?_) {
            let updatedCharacterSlots = characterSlots.map<CharacterSlot, CharacterSlot>(
              func(slot) {
                if (slot.id == characterId) {
                  let updatedCharacter : Character = {
                    slot.character with baseStats = {
                      slot.character.baseStats with str = increaseStat(slot.character.baseStats.str, statsUpdate.strIncrease);
                      dex = increaseStat(slot.character.baseStats.dex, statsUpdate.dexIncrease);
                      int = increaseStat(slot.character.baseStats.int, statsUpdate.intIncrease);
                      vit = increaseStat(slot.character.baseStats.vit, statsUpdate.vitIncrease);
                    };
                  };
                  { slot with character = updatedCharacter };
                } else {
                  slot;
                };
              }
            );
            characters.add(caller, updatedCharacterSlots);
          };
        };
      };
    };
  };

  public shared ({ caller }) func createCharacter(params : CharacterCreationParams) : async {
    #ok : CharacterId;
    #err : CharacterCreationError;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err(#noPermission);
    };

    switch (characters.get(caller)) {
      case (null) {
        characters.add(caller, List.empty<CharacterSlot>());
      };
      case (?existingCharacters) {
        if (existingCharacters.size() >= 8) { return #err(#limitReached) };
      };
    };

    let newCharacter : Character = {
      name = params.name;
      class_ = params.class_;
      realm = params.realm;
      classTier = 1;
      level = 1;
      xp = 0;
      season = currentSeason;
      status = #Alive;
      baseStats = {
        str = params.str;
        dex = params.dex;
        int = params.int;
        vit = params.vit;
      };
      advancedStats = {
        maxHP = 20;
        currentHP = 20;
        critChance = 5;
        critPower = 10;
      };
      totalStatPointsEarned = 0;
      totalStatPointsSpent = 0;
      equippedAbilities = params.equippedAbilities;
    };

    let newId = getNextCharacterId();
    let newSlot : CharacterSlot = { id = newId; character = newCharacter };

    switch (characters.get(caller)) {
      case (null) {
        characters.add(caller, List.fromArray<CharacterSlot>([newSlot]));
      };
      case (?existingCharacters) {
        let updatedCharacters = List.fromArray<CharacterSlot>(existingCharacters.toArray());
        updatedCharacters.add(newSlot);
        characters.add(caller, updatedCharacters);
      };
    };
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
        let character = switch (characterSlots.toArray().find(func(slot) { slot.id == characterId })) {
          case (null) { return #err(#characterNotFound) };
          case (?slot) { slot.character };
        };
        let updatedSlotsArray = characterSlots.toArray().map(
          func(slot) {
            if (slot.id == characterId) {
              let updatedCharacter = {
                slot.character with advancedStats = {
                  slot.character.advancedStats with currentHP = hp;
                };
              };
              { slot with character = updatedCharacter };
            } else {
              slot;
            };
          }
        );
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
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can retrieve their characters");
    };
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
    switch (items.get(itemId)) {
      case (null) { Runtime.trap("Item does not exist") };
      case (?item) {
        if (item.owner != caller) { Runtime.trap("Not item owner") };

        let listing : MarketplaceListing = {
          item;
          price;
          seller = caller;
          active = true;
        };
        marketplace.add(itemId, listing);
      };
    };
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

  /// Load a specific character by its ID.
  /// Applies access control and returns character data only if found.
  public query ({ caller }) func getCharacter(characterId : CharacterId) : async ?Character {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return null;
    };
    switch (characters.get(caller)) {
      case (null) { null };
      case (?characterSlots) {
        let maybeCharacter = characterSlots.toArray().find(
          func(slot) { slot.id == characterId }
        );
        switch (maybeCharacter) {
          case (null) { null };
          case (?slot) { ?slot.character };
        };
      };
    };
  };

  public shared ({ caller }) func equipAbilities(characterId : CharacterId, abilities : [Ability]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can equip abilities");
    };

    switch (characters.get(caller)) {
      case (null) { Runtime.trap("Character not found for caller") };
      case (?characterSlots) {
        let maybeCharacter = characterSlots.toArray().find(
          func(slot) { slot.id == characterId }
        );
        switch (maybeCharacter) {
          case (null) { Runtime.trap("Character ID not found for caller") };
          case (?_) {
            let updatedCharacterSlots = characterSlots.map<CharacterSlot, CharacterSlot>(
              func(slot) {
                if (slot.id == characterId) {
                  let updatedCharacter : Character = {
                    slot.character with equippedAbilities = abilities;
                  };
                  { slot with character = updatedCharacter };
                } else {
                  slot;
                };
              }
            );
            characters.add(caller, updatedCharacterSlots);
          };
        };
      };
    };
  };

  public query ({ caller }) func getEquippedAbilities(characterId : CharacterId) : async [Ability] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view equipped abilities");
    };

    switch (characters.get(caller)) {
      case (null) { Runtime.trap("Character not found for caller") };
      case (?characterSlots) {
        let maybeCharacter = characterSlots.toArray().find(
          func(slot) { slot.id == characterId }
        );
        switch (maybeCharacter) {
          case (null) { [] };
          case (?slot) { slot.character.equippedAbilities };
        };
      };
    };
  };
};
