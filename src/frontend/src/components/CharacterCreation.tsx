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
type CreationStep = "class" | "details" | "ability";

interface ClassInfo {
  id: CharacterClass;
  label: string;
  description: string;
  statBonus: string;
  statBonusKey: "str" | "dex" | "int";
  icon: string;
  gradient: string;
  accentColor: string;
  borderActive: string;
  bgActive: string;
  textActive: string;
}

const CLASSES: ClassInfo[] = [
  {
    id: "Warrior",
    label: "Warrior",
    description:
      "A battle-hardened fighter who dominates the front lines with raw strength and unbreakable will.",
    statBonus: "+6 Strength",
    statBonusKey: "str",
    icon: "⚔️",
    gradient:
      "linear-gradient(135deg, oklch(0.18 0.05 38) 0%, oklch(0.12 0.03 38) 100%)",
    accentColor: "orange",
    borderActive: "border-orange-500/70",
    bgActive: "bg-orange-950/30",
    textActive: "text-orange-400",
  },
  {
    id: "Rogue",
    label: "Rogue",
    description:
      "A swift and deadly assassin who strikes from the shadows with precision and cunning.",
    statBonus: "+6 Dexterity",
    statBonusKey: "dex",
    icon: "🗡️",
    gradient:
      "linear-gradient(135deg, oklch(0.18 0.05 180) 0%, oklch(0.12 0.03 180) 100%)",
    accentColor: "teal",
    borderActive: "border-teal-500/70",
    bgActive: "bg-teal-950/30",
    textActive: "text-teal-400",
  },
  {
    id: "Mage",
    label: "Mage",
    description:
      "A master of arcane arts who channels devastating magical forces to obliterate enemies.",
    statBonus: "+6 Intelligence",
    statBonusKey: "int",
    icon: "🔮",
    gradient:
      "linear-gradient(135deg, oklch(0.18 0.05 298) 0%, oklch(0.12 0.03 298) 100%)",
    accentColor: "violet",
    borderActive: "border-violet-500/70",
    bgActive: "bg-violet-950/30",
    textActive: "text-violet-400",
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
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
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

  const handleProceedToDetails = () => {
    if (!selectedClass) {
      setError("Please select a class to continue.");
      return;
    }
    setError("");
    setStep("details");
  };

  const handleProceedToAbility = () => {
    if (!name.trim()) {
      setError("Please enter a character name.");
      return;
    }
    if (remainingPoints !== 0) {
      setError(
        `Allocate all ${TOTAL_STAT_POINTS} stat points (${remainingPoints} remaining).`,
      );
      return;
    }
    setError("");
    setStep("ability");
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
        `Allocate all ${TOTAL_STAT_POINTS} stat points (${remainingPoints} remaining).`,
      );
      return;
    }
    if (!selectedAbility) {
      setError("Please choose a starting ability.");
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

    // Build the backend ability object for the selected starting ability
    const abilityData = ABILITIES.find((a) => a.name === selectedAbility);
    const initialAbilityObjects = abilityData
      ? [
          {
            name: abilityData.name,
            description: abilityData.description,
            type: abilityData.effectType,
            element: abilityData.damageType,
            power: BigInt(Math.round(abilityData.damageMultiplier * 100)),
          },
        ]
      : [];

    try {
      const result = await createCharacterMutation.mutateAsync({
        name: name.trim(),
        class: selectedClass,
        realm,
        str: BigInt(baseStats.str),
        dex: BigInt(baseStats.dex),
        int: BigInt(baseStats.int),
        vit: BigInt(baseStats.vit),
        equippedAbilities: initialAbilityObjects,
      });

      const characterId = typeof result === "number" ? result : 0;
      const { weapon, armor } = generateStarterEquipment();
      // Save starter equipment AND the chosen ability to localStorage immediately
      saveStarterEquipmentForCharacter(
        characterId,
        weapon,
        armor,
        selectedAbility ? [selectedAbility] : [],
      );
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
  const selectedClassInfo = CLASSES.find((c) => c.id === selectedClass);
  const classAbilities = selectedClass
    ? ABILITIES.filter((a) => a.classRestriction === selectedClass)
    : [];

  const statLabels = [
    { key: "str" as const, label: "Strength", color: "text-orange-400" },
    { key: "dex" as const, label: "Dexterity", color: "text-teal-400" },
    { key: "int" as const, label: "Intelligence", color: "text-violet-400" },
    { key: "vit" as const, label: "Vitality", color: "text-rose-400" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start py-10 px-4 animate-fade-in">
      <div className="w-full max-w-3xl">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div
            aria-hidden="true"
            className="w-10 h-10 mx-auto mb-3 flex items-center justify-center text-2xl opacity-60"
          >
            ⚔
          </div>
          <h1 className="font-display text-3xl text-foreground font-bold mb-1">
            {step === "class"
              ? "Choose Your Path"
              : step === "details"
                ? "Forge Your Legend"
                : "Choose Your Starting Ability"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === "class"
              ? "Your class defines your weapons, armor, and available abilities."
              : step === "details"
                ? "Claim your name and allocate your starting stats."
                : "Every hero begins with one ability. Choose wisely — you can unlock more as you level."}
          </p>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3 mt-5">
            {[
              { n: 1, label: "Class", stepKey: "class" },
              { n: 2, label: "Details", stepKey: "details" },
              { n: 3, label: "Ability", stepKey: "ability" },
            ].map(({ n, label, stepKey }, i) => {
              const isActive = step === stepKey;
              const stepOrder = ["class", "details", "ability"];
              const currentIdx = stepOrder.indexOf(step);
              const thisIdx = stepOrder.indexOf(stepKey);
              const isDone = currentIdx > thisIdx;
              return (
                <React.Fragment key={stepKey}>
                  {i > 0 && (
                    <div
                      className={`w-8 h-px ${isDone ? "bg-primary/50" : "bg-border"}`}
                    />
                  )}
                  <div
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground/60"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? "text-primary-foreground"
                          : isDone
                            ? "bg-primary/30 text-primary"
                            : "bg-surface-2 text-muted-foreground/40"
                      }`}
                      style={
                        isActive ? { background: "oklch(0.65 0.17 38)" } : {}
                      }
                    >
                      {isDone ? "✓" : n}
                    </div>
                    {label}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Step 1: Class Selection ──────────────────────────────── */}
        {step === "class" && (
          <div className="space-y-6">
            {/* Existing characters list */}
            {existingCharacters.length > 0 && (
              <div>
                <h2 className="font-display text-sm text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-primary/60" />
                  Your Characters
                </h2>
                <div className="space-y-2">
                  {existingCharacters.map((char, idx) => {
                    const realmStr = char.realm as string;
                    const statusStr = char.status as string;
                    const realmLabel =
                      realmStr === "Hardcore" ? "⚔ HC" : "🛡 SC";
                    const isDead = statusStr === "Dead";
                    return (
                      <div
                        key={`${String(char.name)}-${idx}`}
                        data-ocid={`creation.character.item.${idx + 1}`}
                        className="flex items-center justify-between bg-surface-1 border border-border/40 rounded-lg px-4 py-3"
                      >
                        <div>
                          <span className="font-display text-foreground font-semibold text-sm">
                            {char.name}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            Lv.{Number(char.level)} · {realmLabel}
                            {isDead && (
                              <span className="ml-2 text-destructive font-medium">
                                · Fallen
                              </span>
                            )}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`creation.character.delete_button.${idx + 1}`}
                          className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                          onClick={() =>
                            setDeleteTarget({ id: idx, name: char.name })
                          }
                          disabled={deleteCharacterMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Class cards */}
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
                    data-ocid={`creation.class.${cls.id.toLowerCase()}.button`}
                    onClick={() => setSelectedClass(cls.id)}
                    className={`relative rounded-xl border-2 cursor-pointer transition-all overflow-hidden text-left w-full group ${
                      isSelected
                        ? `${cls.borderActive} ${cls.bgActive} shadow-lg`
                        : "border-border/40 bg-surface-1 hover:border-border/70 hover:bg-surface-2"
                    }`}
                  >
                    {/* Class portrait — CSS gradient with icon */}
                    <div
                      className="aspect-square w-full overflow-hidden relative flex items-center justify-center"
                      style={{ background: cls.gradient }}
                    >
                      <span className="text-7xl select-none">{cls.icon}</span>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${cls.bgActive} ${cls.textActive} ${cls.borderActive}`}
                          >
                            ✓ Selected
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Class info — text goes here, not on image */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3
                          className={`font-display font-bold text-lg ${isSelected ? cls.textActive : "text-foreground"}`}
                        >
                          {cls.label}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                        {cls.description}
                      </p>
                      <div
                        className={`text-xs font-semibold ${cls.textActive} mb-2`}
                      >
                        {cls.statBonus}
                      </div>
                      {abilities.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Abilities:
                          </p>
                          {abilities.slice(0, 2).map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center gap-1 text-xs text-muted-foreground/70"
                            >
                              <span className="text-sm leading-none">
                                {a.icon}
                              </span>
                              <span>{a.name}</span>
                            </div>
                          ))}
                          {abilities.length > 2 && (
                            <p className="text-xs text-muted-foreground/50">
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
              <p className="text-destructive text-sm text-center bg-destructive/10 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 justify-between">
              {handleBack && (
                <Button
                  variant="outline"
                  data-ocid="creation.back.button"
                  onClick={handleBack}
                  className="flex items-center gap-2 border-border/50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <Button
                data-ocid="creation.continue.button"
                onClick={handleProceedToDetails}
                disabled={!selectedClass}
                className="flex items-center gap-2 ml-auto"
                style={{
                  background: "oklch(0.65 0.17 38)",
                  color: "oklch(0.08 0.01 38)",
                }}
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Character Details ────────────────────────────── */}
        {step === "details" && selectedClassInfo && (
          <div className="space-y-6">
            {/* Selected class summary */}
            <div
              className={`flex items-center gap-4 rounded-xl border-2 ${selectedClassInfo.borderActive} ${selectedClassInfo.bgActive} p-4`}
            >
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 text-3xl border border-border/30"
                style={{ background: selectedClassInfo.gradient }}
              >
                {selectedClassInfo.icon}
              </div>
              <div>
                <h3
                  className={`font-display font-bold text-xl ${selectedClassInfo.textActive}`}
                >
                  {selectedClassInfo.label}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedClassInfo.description}
                </p>
                <p
                  className={`text-xs font-semibold mt-1 ${selectedClassInfo.textActive}`}
                >
                  {selectedClassInfo.statBonus}
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="character-name-input"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
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
                data-ocid="creation.name.input"
                className="w-full bg-surface-2 border border-border/50 rounded-lg px-4 py-2.5 text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>

            {/* Realm */}
            <div>
              <p className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Realm
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: Realm.Softcore,
                    label: "Softcore",
                    icon: "🛡",
                    desc: "Death is not permanent",
                    active: "border-primary/60 bg-primary/10 text-primary",
                  },
                  {
                    value: Realm.Hardcore,
                    label: "Hardcore",
                    icon: "⚔",
                    desc: "Permadeath — one life only",
                    active:
                      "border-destructive/60 bg-destructive/10 text-destructive",
                  },
                ].map((r) => (
                  <button
                    type="button"
                    key={r.label}
                    data-ocid={`creation.realm.${r.label.toLowerCase()}.button`}
                    onClick={() => setRealm(r.value)}
                    className={`cursor-pointer rounded-xl border-2 p-3 transition-all text-left w-full ${
                      realm === r.value
                        ? r.active
                        : "border-border/40 bg-surface-1 text-muted-foreground hover:bg-surface-2"
                    }`}
                  >
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div className="font-semibold text-sm">{r.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Stat allocation */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Allocate Stats
                </p>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    remainingPoints > 0
                      ? "text-primary bg-primary/10 border border-primary/30"
                      : "text-muted-foreground"
                  }`}
                >
                  {remainingPoints} remaining
                </span>
              </div>
              <div className="space-y-2">
                {statLabels.map(({ key, label, color }) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 bg-surface-1 rounded-lg px-4 py-2.5 border border-border/30"
                  >
                    <span className={`text-sm font-medium flex-1 ${color}`}>
                      {label}
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        data-ocid={`creation.stat.${key}.decrement_button`}
                        onClick={() => decrementStat(key)}
                        disabled={statPoints[key] <= 1}
                        className="w-7 h-7 flex items-center justify-center rounded border border-border/50 bg-surface-2 text-muted-foreground hover:text-foreground hover:border-border transition-all disabled:opacity-30 text-sm"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-bold text-foreground text-sm">
                        {statPoints[key]}
                      </span>
                      <button
                        type="button"
                        data-ocid={`creation.stat.${key}.increment_button`}
                        onClick={() => incrementStat(key)}
                        disabled={remainingPoints <= 0}
                        className="w-7 h-7 flex items-center justify-center rounded border border-border/50 bg-surface-2 text-muted-foreground hover:text-foreground hover:border-border transition-all disabled:opacity-30 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {selectedClassInfo && (
                <p className={`text-xs mt-2 ${selectedClassInfo.textActive}`}>
                  * {selectedClassInfo.statBonus} applied automatically on
                  creation
                </p>
              )}
            </div>

            {/* Abilities preview */}
            {classAbilities.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Available Abilities
                </p>
                <div className="space-y-1.5">
                  {classAbilities.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2.5 text-xs text-muted-foreground bg-surface-1 rounded-lg px-3 py-2 border border-border/30"
                    >
                      <span className="text-sm leading-none">{a.icon}</span>
                      <span className="font-medium text-foreground">
                        {a.name}
                      </span>
                      <span className="ml-auto text-muted-foreground/60">
                        {(a.damageMultiplier * 100).toFixed(0)}% dmg
                      </span>
                    </div>
                  ))}
                  {classAbilities.length > 3 && (
                    <p className="text-xs text-muted-foreground/50 pl-1">
                      +{classAbilities.length - 3} more abilities to unlock
                    </p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <p className="text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                data-ocid="creation.back.button"
                onClick={() => setStep("class")}
                className="flex items-center gap-2 border-border/50"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                data-ocid="creation.continue_to_ability.button"
                onClick={handleProceedToAbility}
                disabled={!name.trim() || remainingPoints !== 0}
                className="flex-1 flex items-center justify-center gap-2"
                style={{
                  background: "oklch(0.65 0.17 38)",
                  color: "oklch(0.08 0.01 38)",
                }}
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        {/* ── Step 3: Ability Selection ────────────────────────────── */}
        {step === "ability" && selectedClass && (
          <div className="space-y-6">
            {/* Class summary bar */}
            {selectedClassInfo && (
              <div
                className={`flex items-center gap-3 rounded-xl border-2 ${selectedClassInfo.borderActive} ${selectedClassInfo.bgActive} p-3`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl border border-border/30"
                  style={{ background: selectedClassInfo.gradient }}
                >
                  {selectedClassInfo.icon}
                </div>
                <div>
                  <span
                    className={`font-display font-bold text-sm ${selectedClassInfo.textActive}`}
                  >
                    {name} — {selectedClassInfo.label}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Select 1 starting ability · Unlock more at levels 20, 40,
                    60, 80
                  </p>
                </div>
              </div>
            )}

            {/* Ability cards */}
            <div className="space-y-2">
              {classAbilities.map((ability) => {
                const isSelected = selectedAbility === ability.name;
                return (
                  <button
                    type="button"
                    key={ability.id}
                    data-ocid={`creation.ability.${ability.id}.button`}
                    onClick={() => setSelectedAbility(ability.name)}
                    className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                      isSelected
                        ? "border-accent bg-accent/15 shadow-sm shadow-accent/20"
                        : "border-border/40 bg-surface-1 hover:border-border/70 hover:bg-surface-2 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 p-2 rounded-lg text-xl flex-shrink-0 ${
                          isSelected ? "bg-accent/20" : "bg-surface-2"
                        }`}
                      >
                        {ability.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-semibold text-sm ${
                              isSelected ? "text-accent" : "text-foreground"
                            }`}
                          >
                            {ability.name}
                          </span>
                          {isSelected && (
                            <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-medium">
                              ✓ Selected
                            </span>
                          )}
                          <span className="ml-auto text-xs text-muted-foreground capitalize">
                            {ability.damageType} · {ability.effectType}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {ability.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-orange-400 font-medium">
                            {(ability.damageMultiplier * 100).toFixed(0)}%
                            damage
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Scales: {ability.scalingStat.toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            CD: {ability.cooldown}s
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                data-ocid="creation.back.button"
                onClick={() => setStep("details")}
                className="flex items-center gap-2 border-border/50"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <button
                type="button"
                data-ocid="creation.submit_button"
                onClick={handleCreate}
                disabled={createCharacterMutation.isPending || !selectedAbility}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "oklch(0.65 0.17 38)",
                  color: "oklch(0.08 0.01 38)",
                }}
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
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent
          data-ocid="creation.delete.dialog"
          className="bg-surface-1 border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Character
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="creation.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="creation.delete.confirm_button"
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
