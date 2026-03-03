/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        // Surfaces
        'surface-1': 'oklch(var(--surface-1) / <alpha-value>)',
        'surface-2': 'oklch(var(--surface-2) / <alpha-value>)',
        // Game-specific tokens
        'dungeon-gold': 'oklch(var(--dungeon-gold) / <alpha-value>)',
        'ember': 'oklch(var(--ember) / <alpha-value>)',
        'shadow-violet': 'oklch(var(--shadow-violet) / <alpha-value>)',
        // Health
        'health-high': 'oklch(var(--health-high) / <alpha-value>)',
        'health-mid': 'oklch(var(--health-mid) / <alpha-value>)',
        'health-low': 'oklch(var(--health-low) / <alpha-value>)',
        // Rarity
        'rarity-common': 'oklch(var(--rarity-common) / <alpha-value>)',
        'rarity-uncommon': 'oklch(var(--rarity-uncommon) / <alpha-value>)',
        'rarity-rare': 'oklch(var(--rarity-rare) / <alpha-value>)',
        'rarity-legendary': 'oklch(var(--rarity-legendary) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Outfit', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        body: ['Outfit', 'Segoe UI', 'system-ui', 'sans-serif'],
        gothic: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'ember-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 12px oklch(0.65 0.17 38 / 0.4)' },
          '50%': { opacity: '0.82', boxShadow: '0 0 22px oklch(0.65 0.17 38 / 0.65)' },
        },
        'gold-shimmer': {
          '0%, 100%': { opacity: '0.75' },
          '50%': { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '25%': { opacity: '0.88' },
          '50%': { opacity: '0.96' },
          '75%': { opacity: '0.82' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'ember-pulse': 'ember-pulse 2.2s ease-in-out infinite',
        'gold-shimmer': 'gold-shimmer 2.8s ease-in-out infinite',
        'slide-up': 'slide-up 0.35s ease-out both',
        'flicker': 'flicker 3.5s ease-in-out infinite',
      },
      boxShadow: {
        'ember-sm': '0 0 8px oklch(0.65 0.17 38 / 0.3)',
        'ember': '0 0 16px oklch(0.65 0.17 38 / 0.4)',
        'ember-lg': '0 0 28px oklch(0.65 0.17 38 / 0.5)',
        'gold-sm': '0 0 8px oklch(0.72 0.14 72 / 0.3)',
        'gold': '0 0 16px oklch(0.72 0.14 72 / 0.4)',
        'dungeon': '0 4px 24px oklch(0.04 0.01 258 / 0.8)',
        'card': '0 2px 8px oklch(0.04 0.01 258 / 0.6)',
      },
      backgroundImage: {
        'ember-gradient': 'linear-gradient(135deg, oklch(0.65 0.17 38), oklch(0.72 0.14 72))',
        'dungeon-gradient': 'linear-gradient(180deg, oklch(0.09 0.014 258), oklch(0.12 0.016 258))',
        'surface-gradient': 'linear-gradient(135deg, oklch(0.12 0.016 258), oklch(0.14 0.018 258))',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};
