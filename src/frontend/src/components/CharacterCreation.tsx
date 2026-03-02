import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Shield,
  Sword,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { Realm } from "../backend";
import type { Character } from "../backend";
import { ABILITIES } from "../data/abilities";
import { generateStarterEquipment } from "../engine/lootGenerator";
import { saveStarterEquipmentForCharacter } from "../hooks/useLocalCharacter";
import {
  CharacterLimitReachedError,
  useCreateCharacter,
  useDeleteCharacter,
} from "../hooks/useQueries";
import { type CharacterClass, applyClassStatBonus } from "../types/game";

interface CharacterCreationProps {
  onCharacterCreated: (characterId: number) => void;
  onBack?: () => void;
  existingCharacters?: Character[];
  onCancel?: () => void;
}

const TOTAL_STAT_POINTS = 8;

type CreationStep = "class" | "details";

interface ClassInfo {
  id: CharacterClass;
  label: string;
  description: string;
  statBonus: string;
  statBonusKey: "str" | "dex" | "int";
  image: string;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}

const CLASSES: ClassInfo[] = [
  {
    id: "Warrior",
    label: "Warrior",
    description:
      "A battle-hardened fighter who dominates the front lines with raw strength and unbreakable will.",
    statBonus: "+3 Strength",
    statBonusKey: "str",
    image: "/assets/generated/class-warrior.dim_256x256.png",
    color: "red",
    borderColor: "border-red-500/60",
    bgColor: "bg-red-950/30",
    textColor: "text-red-400",
  },
  {
    id: "Rogue",
    label: "Rogue",
    description:
      "A swift and deadly assassin who strikes from the shadows with precision and cunning.",
    statBonus: "+3 Dexterity",
    statBonusKey: "dex",
    image: "/assets/generated/class-rogue.dim_256x256.png",
    color: "purple",
    borderColor: "border-purple-500/60",
    bgColor: "bg-purple-950/30",
    textColor: "text-purple-400",
  },
  {
    id: "Mage",
    label: "Mage",
    description:
      "A master of arcane arts who channels devastating magical forces to obliterate enemies.",
    statBonus: "+3 Intelligence",
    statBonusKey: "int",
    image: "/assets/generated/class-mage.dim_256x256.png",
    color: "blue",
    borderColor: "border-blue-500/60",
    bgColor: "bg-blue-950/30",
    textColor: "text-blue-400",
  },
];

export default function CharacterCreation({
  onCharacterCreated,
  onBack,
  existingCharacters = [],
  onCancel,
}: CharacterCreationProps) {
  const [step, setStep] = useState<CreationStep>("class");
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(
    null,
  );
  const [name, setName] = useState("");
  const [realm, setRealm] = useState<Realm>(Realm.Softcore);
  const [statPoints, setStatPoints] = useState({
    str: 1,
    dex: 1,
    int: 1,
    vit: 1,
  });
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const createCharacterMutation = useCreateCharacter();
  const deleteCharacterMutation = useDeleteCharacter();

  const usedPoints =
    statPoints.str -
    1 +
    statPoints.dex -
    1 +
    statPoints.int -
    1 +
    statPoints.vit -
    1;
  const remainingPoints = TOTAL_STAT_POINTS - usedPoints;

  const incrementStat = (stat: keyof typeof statPoints) => {
    if (remainingPoints <= 0) return;
    setStatPoints((prev) => ({ ...prev, [stat]: prev[stat] + 1 }));
  };

  const decrementStat = (stat: keyof typeof statPoints) => {
    if (statPoints[stat] <= 1) return;
    setStatPoints((prev) => ({ ...prev, [stat]: prev[stat] - 1 }));
  };

  const handleSelectClass = (cls: CharacterClass) => {
    setSelectedClass(cls);
  };

  const handleProceedToDetails = () => {
    if (!selectedClass) {
      setError("Please select a class to continue.");
      return;
    }
    setError("");
    setStep("details");
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Please enter a character name.");
      return;
    }
    if (!selectedClass) {
      setError("Please select a class.");
      return;
    }
    if (remainingPoints !== 0) {
      setError(
        `Please allocate all ${TOTAL_STAT_POINTS} stat points (${remainingPoints} remaining).`,
      );
      return;
    }
    setError("");

    const baseStats = applyClassStatBonus(
      {
        str: statPoints.str,
        dex: statPoints.dex,
        int: statPoints.int,
        vit: statPoints.vit,
      },
      selectedClass,
    );

    try {
      const result = await createCharacterMutation.mutateAsync({
        name: name.trim(),
        class: selectedClass,
        realm,
        str: BigInt(baseStats.str),
        dex: BigInt(baseStats.dex),
        int: BigInt(baseStats.int),
        vit: BigInt(baseStats.vit),
        equippedAbilities: [],
      });

      // result is the character ID (number) returned from the backend
      const characterId = typeof result === "number" ? result : 0;

      const { weapon, armor } = generateStarterEquipment();
      saveStarterEquipmentForCharacter(characterId, weapon, armor);

      onCharacterCreated(characterId);
    } catch (err) {
      if (err instanceof CharacterLimitReachedError) {
        setError("You have reached the maximum number of characters (8).");
      } else {
        setError("Failed to create character. Please try again.");
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCharacterMutation.mutateAsync(deleteTarget.id);
    } catch {
      setError("Failed to delete character. Please try again.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleBack = onBack || onCancel;

  const statLabels: {
    key: keyof typeof statPoints;
    label: string;
    color: string;
  }[] = [
    { key: "str", label: "Strength", color: "text-red-400" },
    { key: "dex", label: "Dexterity", color: "text-green-400" },
    { key: "int", label: "Intelligence", color: "text-blue-400" },
    { key: "vit", label: "Vitality", color: "text-yellow-400" },
  ];

  const selectedClassInfo = CLASSES.find((c) => c.id === selectedClass);
  const classAbilities = selectedClass
    ? ABILITIES.filter((a) => a.classRestriction === selectedClass)
    : [];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-primary mb-2">
            Create Character
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === "class"
              ? "Choose your path in the realm of darkness"
              : "Forge your legend"}
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div
              className={`flex items-center gap-1.5 text-xs font-medium ${step === "class" ? "text-primary" : "text-muted-foreground"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "class" ? "bg-primary text-primary-foreground" : "bg-primary/30 text-primary"}`}
              >
                1
              </div>
              Choose Class
            </div>
            <div className="w-8 h-px bg-border" />
            <div
              className={`flex items-center gap-1.5 text-xs font-medium ${step === "details" ? "text-primary" : "text-muted-foreground"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "details" ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"}`}
              >
                2
              </div>
              Character Details
            </div>
          </div>
        </div>

        {/* ── STEP 1: Class Selection ── */}
        {step === "class" && (
          <div className="space-y-6">
            {existingCharacters.length > 0 && (
              <div className="mb-2">
                <h2 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Your Characters
                </h2>
                <div className="space-y-2">
                  {existingCharacters.map((char, idx) => {
                    const realmStr = char.realm as string;
                    const statusStr = char.status as string;
                    const realmLabel =
                      realmStr === "Hardcore" ? "⚔ Hardcore" : "🛡 Softcore";
                    const isDead = statusStr === "Dead";
                    return (
                      <div
                        key={char.name}
                        className="flex items-center justify-between bg-surface-1 border border-border rounded-lg px-4 py-3"
                      >
                        <div className="flex flex-col">
                          <span className="font-display text-foreground font-semibold">
                            {char.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Lv.{Number(char.level)} · {realmLabel}
                            {isDead && (
                              <span className="ml-2 text-destructive font-medium">
                                · Dead
                              </span>
                            )}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setDeleteTarget({ id: idx, name: char.name })
                          }
                          disabled={deleteCharacterMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Class Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CLASSES.map((cls) => {
                const isSelected = selectedClass === cls.id;
                const abilities = ABILITIES.filter(
                  (a) => a.classRestriction === cls.id,
                );
                return (
                  <button
                    type="button"
                    key={cls.id}
                    onClick={() => handleSelectClass(cls.id)}
                    className={`relative rounded-xl border-2 cursor-pointer transition-all overflow-hidden w-full text-left ${
                      isSelected
                        ? `${cls.borderColor} ${cls.bgColor} shadow-lg`
                        : "border-border bg-surface-1 hover:border-border/80 hover:bg-surface-2"
                    }`}
                  >
                    {/* Class image */}
                    <div className="aspect-square w-full overflow-hidden">
                      <img
                        src={cls.image}
                        alt={cls.label}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Class info */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`font-display font-bold text-lg ${isSelected ? cls.textColor : "text-foreground"}`}
                        >
                          {cls.label}
                        </h3>
                        {isSelected && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${cls.bgColor} ${cls.textColor} border ${cls.borderColor}`}
                          >
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {cls.description}
                      </p>
                      <div
                        className={`text-xs font-semibold ${cls.textColor} mb-2`}
                      >
                        {cls.statBonus}
                      </div>
                      {abilities.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Abilities:
                          </p>
                          {abilities.slice(0, 2).map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center gap-1 text-xs text-muted-foreground"
                            >
                              <span>{a.icon}</span>
                              <span>{a.name}</span>
                            </div>
                          ))}
                          {abilities.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{abilities.length - 2} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}

            <div className="flex gap-3 justify-between">
              {handleBack && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleProceedToDetails}
                disabled={!selectedClass}
                className="flex items-center gap-2 ml-auto"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Character Details ── */}
        {step === "details" && selectedClassInfo && (
          <div className="space-y-6">
            {/* Selected class summary */}
            <div
              className={`flex items-center gap-4 rounded-xl border-2 ${selectedClassInfo.borderColor} ${selectedClassInfo.bgColor} p-4`}
            >
              <img
                src={selectedClassInfo.image}
                alt={selectedClassInfo.label}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h3
                  className={`font-display font-bold text-xl ${selectedClassInfo.textColor}`}
                >
                  {selectedClassInfo.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedClassInfo.description}
                </p>
                <p
                  className={`text-xs font-semibold mt-1 ${selectedClassInfo.textColor}`}
                >
                  {selectedClassInfo.statBonus}
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="character-name-input"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Character Name
              </label>
              <input
                id="character-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name..."
                maxLength={24}
                className="w-full bg-surface-1 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>

            {/* Realm */}
            <div>
              <p className="block text-sm font-medium text-foreground mb-2">
                Realm
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: Realm.Softcore,
                    label: "Softcore",
                    icon: "🛡",
                    desc: "Death is not permanent",
                    color: "border-blue-500/60 bg-blue-950/20 text-blue-400",
                  },
                  {
                    value: Realm.Hardcore,
                    label: "Hardcore",
                    icon: "⚔",
                    desc: "Permadeath — one life only",
                    color: "border-red-500/60 bg-red-950/20 text-red-400",
                  },
                ].map((r) => (
                  <button
                    type="button"
                    key={r.label}
                    onClick={() => setRealm(r.value)}
                    className={`cursor-pointer rounded-lg border-2 p-3 transition-all text-left w-full ${
                      realm === r.value
                        ? r.color
                        : "border-border bg-surface-1 text-muted-foreground hover:bg-surface-2"
                    }`}
                  >
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div className="font-semibold text-sm">{r.label}</div>
                    <div className="text-xs opacity-70">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Stat allocation */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="block text-sm font-medium text-foreground">
                  Allocate Stats
                </p>
                <span
                  className={`text-sm font-bold ${remainingPoints > 0 ? "text-accent" : "text-muted-foreground"}`}
                >
                  {remainingPoints} points remaining
                </span>
              </div>
              <div className="space-y-2">
                {statLabels.map(({ key, label, color }) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 bg-surface-1 rounded-lg px-4 py-2.5 border border-border"
                  >
                    <span className={`text-sm font-medium w-24 ${color}`}>
                      {label}
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => decrementStat(key)}
                        disabled={statPoints[key] <= 1}
                      >
                        −
                      </Button>
                      <span className="w-6 text-center font-bold text-foreground">
                        {statPoints[key]}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => incrementStat(key)}
                        disabled={remainingPoints <= 0}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {selectedClassInfo && (
                <p className={`text-xs mt-2 ${selectedClassInfo.textColor}`}>
                  * {selectedClassInfo.statBonus} will be applied automatically
                </p>
              )}
            </div>

            {/* Abilities preview */}
            {classAbilities.length > 0 && (
              <div>
                <p className="block text-sm font-medium text-foreground mb-2">
                  Available Abilities
                </p>
                <div className="space-y-1">
                  {classAbilities.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 text-xs text-muted-foreground bg-surface-1 rounded px-3 py-1.5 border border-border"
                    >
                      <span>{a.icon}</span>
                      <span className="font-medium text-foreground">
                        {a.name}
                      </span>
                      <span className="ml-auto">
                        {(a.damageMultiplier * 100).toFixed(0)}% dmg
                      </span>
                    </div>
                  ))}
                  {classAbilities.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-1">
                      +{classAbilities.length - 3} more abilities to unlock
                    </p>
                  )}
                </div>
              </div>
            )}

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("class")}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  createCharacterMutation.isPending ||
                  !name.trim() ||
                  remainingPoints !== 0
                }
                className="flex-1 flex items-center justify-center gap-2"
              >
                {createCharacterMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Character
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Character</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCharacterMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
