import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      fontFamily: {
        heading: ['var(--font-quicksand)', 'Quicksand', 'sans-serif'],
        body: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
        quicksand: ['var(--font-quicksand)', 'Quicksand', 'sans-serif'],
        manrope: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',          /* 6px */
        md: 'calc(var(--radius) - 2px)', /* 4px */
        sm: 'calc(var(--radius) - 4px)', /* 2px */
        card: '8px',
        button: '6px',
        input: '8px',
        savings: '20px',
        'new-badge': '4px',
      },
      colors: {
        /* ---- CosClub design-system tokens (hex source of truth) ---- */
        'blush-pink': '#A9C9EC',
        'soft-rose': '#7AAFD8',
        coral: '#E8553E',
        'coral-hover': '#D64530',
        'baby-blue': '#F9C8D0',
        'baby-blue-hover': '#E8A0B0',
        'off-white': '#FFFFFF',
        charcoal: '#2C2C2C',
        gray: {
          DEFAULT: '#8A8A8A',
          light: '#E0E0E0',
        },
        'light-gray': '#E0E0E0',
        amber: '#f59e0b',
        'savings-red': '#FF3366',
        'live-red': '#ff3b3b',
        'footer-text': '#A0A0A0',

        /* ---- shadcn/ui semantic mappings (HSL) ---- */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        popover: 'var(--shadow-popover)',
      },
      spacing: {
        '4.5': '2rem',     /* 32px */
        '7.5': '3.75rem',  /* 60px */
        '13': '3.25rem',   /* 52px */
        '18': '4.5rem',    /* 72px */
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
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        floatUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'float-up': 'floatUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
