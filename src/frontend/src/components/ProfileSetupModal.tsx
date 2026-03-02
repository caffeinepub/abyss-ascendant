import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

interface ProfileSetupModalProps {
  open: boolean;
}

export default function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a name for your adventurer.");
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 20) {
      setError("Name must be between 2 and 20 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_\- ]+$/.test(trimmed)) {
      setError(
        "Name may only contain letters, numbers, spaces, hyphens, and underscores.",
      );
      return;
    }
    setError("");
    await saveProfile.mutateAsync({ username: trimmed });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="panel border-ember/40 max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-ember/20 border border-ember/40 flex items-center justify-center">
              <User className="w-5 h-5 text-ember" />
            </div>
            <div>
              <DialogTitle className="font-gothic text-dungeon-gold text-xl">
                Name Your Adventurer
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Choose wisely — this name will echo through the Abyss.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="username"
              className="text-foreground font-gothic text-sm tracking-wide"
            >
              Adventurer Name
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. IronVeil, ShadowMark..."
              className="bg-stone border-stone-light text-foreground placeholder:text-muted-foreground focus:border-ember"
              maxLength={20}
              autoFocus
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>

          <div className="panel-ember rounded-sm p-3 text-xs text-muted-foreground">
            <p>
              Your name will appear on the{" "}
              <span className="text-dungeon-gold">Eternal Ladder</span> and in
              the marketplace. Choose something memorable.
            </p>
          </div>

          <button
            type="submit"
            disabled={saveProfile.isPending || !username.trim()}
            className="btn-ember w-full py-3 rounded-sm font-gothic tracking-widest uppercase text-sm font-semibold"
          >
            {saveProfile.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Inscribing...
              </span>
            ) : (
              "Begin Your Journey"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
