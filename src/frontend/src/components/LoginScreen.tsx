import { useQueryClient } from "@tanstack/react-query";
import { Shield, Skull, Sword } from "lucide-react";
import { motion } from "motion/react";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: `${(i * 5.55 + 3) % 100}%`,
  y: `${(i * 7.3 + 5) % 100}%`,
  size: i % 4 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1,
  color:
    i % 3 === 0
      ? "oklch(0.65 0.17 38)"
      : i % 3 === 1
        ? "oklch(0.72 0.14 72)"
        : "oklch(0.5 0.14 298)",
  delay: `${(i * 0.38) % 3.5}s`,
  duration: `${2.2 + ((i * 0.3) % 2.8)}s`,
}));

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
      {/* Atmospheric overlay */}
      <div className="absolute inset-0 dungeon-overlay" />

      {/* Vignette */}
      <div className="absolute inset-0 vignette" />

      {/* Horizontal scan lines for texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0.9 0 0) 2px, oklch(0.9 0 0) 3px)",
          backgroundSize: "100% 3px",
        }}
      />

      {/* Floating ember particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pulse-glow"
            style={{
              left: p.x,
              top: p.y,
              width: `${p.size * 4}px`,
              height: `${p.size * 4}px`,
              background: p.color,
              animationDelay: p.delay,
              animationDuration: p.duration,
              filter: `blur(${p.size}px)`,
            }}
          />
        ))}
      </div>

      {/* Decorative arch / frame lines */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className="w-[520px] h-[520px] rounded-full border opacity-[0.06]"
          style={{ borderColor: "oklch(0.72 0.14 72)" }}
        />
        <div
          className="absolute w-[620px] h-[620px] rounded-full border opacity-[0.04]"
          style={{ borderColor: "oklch(0.65 0.17 38)" }}
        />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-md w-full"
      >
        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-5">
          {/* Sigil with ember glow */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-50"
              style={{ background: "oklch(0.65 0.17 38 / 0.4)" }}
            />
            <div
              className="relative w-28 h-28 flex items-center justify-center text-7xl select-none animate-ember-pulse"
              style={{
                filter: "drop-shadow(0 0 24px oklch(0.65 0.17 38 / 0.7))",
              }}
            >
              ⚔
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-center"
          >
            <h1
              className="font-gothic text-6xl font-bold tracking-[0.2em] uppercase leading-none"
              style={{
                color: "oklch(0.82 0.14 72)",
                textShadow:
                  "0 0 40px oklch(0.72 0.14 72 / 0.4), 0 2px 4px oklch(0.03 0 0 / 0.8)",
              }}
            >
              Abyss
            </h1>
            <h1
              className="font-gothic text-6xl font-bold tracking-[0.2em] uppercase leading-none mt-1"
              style={{
                color: "oklch(0.72 0.17 38)",
                textShadow:
                  "0 0 40px oklch(0.65 0.17 38 / 0.5), 0 2px 4px oklch(0.03 0 0 / 0.8)",
              }}
            >
              Ascendant
            </h1>
            <p
              className="font-body text-sm mt-3 italic tracking-widest uppercase"
              style={{ color: "oklch(0.55 0.012 258)" }}
            >
              Descend. Conquer. Ascend.
            </p>
          </motion.div>
        </div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-3 gap-3 w-full"
        >
          {[
            { icon: Sword, label: "Hack & Slash", desc: "Real-time combat" },
            { icon: Shield, label: "Class Mastery", desc: "Ascension Trials" },
            { icon: Skull, label: "Hardcore", desc: "Permadeath realm" },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-center"
              style={{
                background: "oklch(0.12 0.016 258 / 0.8)",
                border: "1px solid oklch(0.22 0.018 258 / 0.6)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Icon
                className="w-4 h-4"
                style={{ color: "oklch(0.65 0.17 38)" }}
              />
              <div
                className="font-gothic text-[11px] font-bold tracking-wide"
                style={{ color: "oklch(0.72 0.14 72)" }}
              >
                {label}
              </div>
              <div
                className="text-[10px]"
                style={{ color: "oklch(0.5 0.01 258)" }}
              >
                {desc}
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="w-full flex flex-col items-center gap-3"
        >
          <button
            type="button"
            data-ocid="login.submit_button"
            onClick={handleAuth}
            disabled={isLoggingIn}
            className="w-full py-4 px-8 rounded-sm font-gothic text-base tracking-[0.25em] uppercase font-bold transition-all duration-200 relative overflow-hidden group"
            style={{
              background: isLoggingIn
                ? "oklch(0.45 0.1 38)"
                : "oklch(0.65 0.17 38)",
              color: "oklch(0.08 0.01 38)",
              boxShadow:
                "0 0 24px oklch(0.65 0.17 38 / 0.4), 0 4px 12px oklch(0.04 0.01 258 / 0.6)",
            }}
          >
            {/* Shimmer overlay */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
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
          <p
            className="text-xs text-center tracking-wide"
            style={{ color: "oklch(0.42 0.01 258)" }}
          >
            Secured by Internet Identity · Shared world · On-chain progress
          </p>
        </motion.div>

        {/* Lore quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="rounded px-5 py-4 text-center w-full max-w-sm"
          style={{
            background: "oklch(0.1 0.012 258 / 0.7)",
            border: "1px solid oklch(0.22 0.018 258 / 0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          <p
            className="font-body text-xs italic leading-relaxed"
            style={{ color: "oklch(0.48 0.01 258)" }}
          >
            "The Abyss calls to those brave enough to answer. Descend through
            the Catacombs, face the Ascension Trials, and claim your place on
            the eternal ladder."
          </p>
        </motion.div>

        {/* Footer */}
        <p className="text-[10px]" style={{ color: "oklch(0.32 0.008 258)" }}>
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
