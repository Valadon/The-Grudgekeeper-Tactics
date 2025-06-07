/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/game/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dwarf-blue': '#3B82F6',
        'dwarf-green': '#10B981',
        'dwarf-orange': '#F97316',
        'dwarf-yellow': '#F59E0B',
        'enemy-red': '#EF4444',
        'grid-border': '#374151',
        'grid-bg': '#111827',
        'highlight-move': '#3B82F680',
        'highlight-attack': '#EF444480',
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}