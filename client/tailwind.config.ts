import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9f4',
          100: '#d3f0e3',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        maple: {
          50:  '#fef2f2',
          100: '#fddede',
          500: '#C0272D',
          600: '#A82025',
          700: '#8F1A1E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
