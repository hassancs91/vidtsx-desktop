import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        neo: {
          bg: '#FFFDF0',
          black: '#000000',
          white: '#FFFFFF',
          coral: '#FF6B6B',
          teal: '#4ECDC4',
          yellow: '#FFE500',
          purple: '#A855F7',
        }
      },
      boxShadow: {
        neo: '4px 4px 0px #000000',
        'neo-sm': '2px 2px 0px #000000',
        'neo-hover': '6px 6px 0px #000000',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
