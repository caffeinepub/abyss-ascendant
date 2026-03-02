import typography from '@tailwindcss/typography';
import containerQueries from '@tailwindcss/container-queries';
import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['index.html', 'src/**/*.{js,ts,jsx,tsx,html,css}'],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            fontFamily: {
                gothic: ['Cinzel', 'Crimson Text', 'serif'],
                body: ['Crimson Text', 'Georgia', 'serif'],
                ui: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                border: 'oklch(var(--border))',
                input: 'oklch(var(--input))',
                ring: 'oklch(var(--ring) / <alpha-value>)',
                background: 'oklch(var(--background))',
                foreground: 'oklch(var(--foreground))',
                primary: {
                    DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
                    foreground: 'oklch(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
                    foreground: 'oklch(var(--secondary-foreground))'
                },
                destructive: {
                    DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
                    foreground: 'oklch(var(--destructive-foreground))'
                },
                muted: {
                    DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
                    foreground: 'oklch(var(--muted-foreground) / <alpha-value>)'
                },
                accent: {
                    DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
                    foreground: 'oklch(var(--accent-foreground))'
                },
                popover: {
                    DEFAULT: 'oklch(var(--popover))',
                    foreground: 'oklch(var(--popover-foreground))'
                },
                card: {
                    DEFAULT: 'oklch(var(--card))',
                    foreground: 'oklch(var(--card-foreground))'
                },
                chart: {
                    1: 'oklch(var(--chart-1))',
                    2: 'oklch(var(--chart-2))',
                    3: 'oklch(var(--chart-3))',
                    4: 'oklch(var(--chart-4))',
                    5: 'oklch(var(--chart-5))'
                },
                sidebar: {
                    DEFAULT: 'oklch(var(--sidebar))',
                    foreground: 'oklch(var(--sidebar-foreground))',
                    primary: 'oklch(var(--sidebar-primary))',
                    'primary-foreground': 'oklch(var(--sidebar-primary-foreground))',
                    accent: 'oklch(var(--sidebar-accent))',
                    'accent-foreground': 'oklch(var(--sidebar-accent-foreground))',
                    border: 'oklch(var(--sidebar-border))',
                    ring: 'oklch(var(--sidebar-ring))'
                },
                // Game-specific colors
                ember: {
                    DEFAULT: 'oklch(0.68 0.22 35)',
                    bright: 'oklch(0.75 0.25 40)',
                    dim: 'oklch(0.55 0.18 30)',
                },
                'dungeon-gold': {
                    DEFAULT: 'oklch(0.78 0.18 85)',
                    dim: 'oklch(0.65 0.15 80)',
                },
                obsidian: 'oklch(0.1 0.008 260)',
                stone: {
                    DEFAULT: 'oklch(0.22 0.012 260)',
                    light: 'oklch(0.32 0.015 260)',
                    dark: 'oklch(0.15 0.01 260)',
                },
                rarity: {
                    common: 'oklch(0.65 0.01 260)',
                    uncommon: 'oklch(0.55 0.18 260)',
                    rare: 'oklch(0.78 0.18 85)',
                    legendary: 'oklch(0.65 0.25 35)',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            boxShadow: {
                xs: '0 1px 2px 0 rgba(0,0,0,0.05)',
                ember: '0 0 12px oklch(0.68 0.22 35 / 0.5), 0 0 24px oklch(0.68 0.22 35 / 0.2)',
                gold: '0 0 12px oklch(0.78 0.18 85 / 0.5), 0 0 24px oklch(0.78 0.18 85 / 0.2)',
                legendary: '0 0 16px oklch(0.65 0.25 35 / 0.7), 0 0 32px oklch(0.65 0.25 35 / 0.3)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'legendary-pulse': {
                    '0%, 100%': { boxShadow: '0 0 16px oklch(0.65 0.25 35 / 0.7), 0 0 32px oklch(0.65 0.25 35 / 0.3)' },
                    '50%': { boxShadow: '0 0 24px oklch(0.72 0.28 40 / 0.9), 0 0 48px oklch(0.65 0.25 35 / 0.5)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% center' },
                    '100%': { backgroundPosition: '200% center' },
                },
                'float-up': {
                    '0%': { opacity: '1', transform: 'translateY(0)' },
                    '100%': { opacity: '0', transform: 'translateY(-40px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '0.6' },
                    '50%': { opacity: '1' },
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'legendary-pulse': 'legendary-pulse 2s ease-in-out infinite',
                'shimmer': 'shimmer 3s linear infinite',
                'float-up': 'float-up 1.5s ease-out forwards',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'fade-in': 'fade-in 0.3s ease-out',
            }
        }
    },
    plugins: [typography, containerQueries, animate]
};
