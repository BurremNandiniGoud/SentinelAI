import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0B0F17',
          800: '#151B26',
        },
        parchment: '#F3EFE6',
        brass: '#A9812F',
        slate: {
          500: '#3B5166',
        },
        forest: '#1F6F54',
        ochre: '#B8862E',
        oxblood: '#7A1F2B',
        navy: {
          900: '#17375E',
          800: '#224B7A',
          700: '#102C4C',
        },
        ivory: {
          50: '#FDFBF8',
          100: '#F7F5F0',
          200: '#F2EFE8',
          300: '#EAE6DD',
        },
      },
      boxShadow: {
        soft: '0 20px 50px rgba(11,15,23,0.12)',
        'light-sm': '0 2px 12px rgba(20,20,20,0.04)',
        light: '0 8px 30px rgba(20,20,20,0.05)',
        'light-hover': '0 20px 60px rgba(20,20,20,0.08)',
      },
      ringColor: {
        brass: '#A9812F',
        navy: '#17375E',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xl: '0.625rem',
        lg: '0.5rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
} satisfies Config
