import { useQueryClient } from "@tanstack/react-query";
import { Shield, Skull, Sword } from "lucide-react";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginScreen() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <div className="min-h-screen dungeon-bg flex items-center justify-center relative overflow-hidden">
      {/* Dark overlay */}
      <div className="absolute inset-0 dungeon-overlay" />
      {/* Vignette */}
      <div className="absolute inset-0 vignette" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {(
          [
            "p0",
            "p1",
            "p2",
            "p3",
            "p4",
            "p5",
            "p6",
            "p7",
            "p8",
            "p9",
            "p10",
            "p11",
          ] as const
        ).map((pid, i) => (
          <div
            key={pid}
            className="absolute w-1 h-1 rounded-full opacity-30 pulse-glow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background:
                i % 3 === 0 ? "#ff6b35" : i % 3 === 1 ? "#ffd700" : "#9c27b0",
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-lg w-full">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src="/assets/generated/logo-sigil.dim_256x256.png"
              alt="Abyss Ascendant"
              className="w-24 h-24 object-contain drop-shadow-lg"
              style={{
                filter: "drop-shadow(0 0 20px rgba(255, 107, 53, 0.6))",
              }}
            />
          </div>
          <div className="text-center">
            <h1 className="font-gothic text-5xl font-bold text-dungeon-gold tracking-widest uppercase">
              Abyss
            </h1>
            <h1 className="font-gothic text-5xl font-bold text-ember tracking-widest uppercase">
              Ascendant
            </h1>
            <p className="text-muted-foreground font-body text-lg mt-2 italic">
              Descend. Conquer. Ascend.
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[
            { icon: Sword, label: "Hack & Slash", desc: "Real-time combat" },
            { icon: Shield, label: "Class Ascension", desc: "Master Trials" },
            { icon: Skull, label: "Hardcore Mode", desc: "Permadeath realm" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="panel rounded-lg p-3 text-center">
              <Icon className="w-5 h-5 text-ember mx-auto mb-1" />
              <div className="font-gothic text-xs text-dungeon-gold">
                {label}
              </div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>

        {/* Login button */}
        <div className="w-full flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleAuth}
            disabled={isLoggingIn}
            className="btn-ember w-full py-4 px-8 rounded-sm font-gothic text-lg tracking-widest uppercase font-semibold transition-all duration-200 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Entering the Abyss...
              </span>
            ) : isAuthenticated ? (
              "Logout"
            ) : (
              "Enter the Abyss"
            )}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Secured by Internet Identity — your key to the shared world
          </p>
        </div>

        {/* Lore text */}
        <div className="panel rounded-sm p-4 text-center max-w-sm">
          <p className="font-body text-sm text-muted-foreground italic leading-relaxed">
            "The Abyss calls to those brave enough to answer. Descend through
            the Catacombs, face the Ascension Trials, and claim your place on
            the eternal ladder."
          </p>
        </div>
      </div>
    </div>
  );
}
