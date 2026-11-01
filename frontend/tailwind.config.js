/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#1B2420', soft: '#2A362F', faint: '#5B6660' },
        paper: { DEFAULT: '#F6F4EF', dim: '#EDEAE1', card: '#FFFFFF' },
        denim: { DEFAULT: '#2F4C7A', deep: '#233A5E', light: '#5B7BAE', tint: '#E8EEF6' },
        moss: { DEFAULT: '#4B7857', tint: '#E8F1EA' },
        amber: { DEFAULT: '#D9A441', tint: '#FBF1DD' },
        crimson: { DEFAULT: '#A63446', tint: '#F7E7E9' },
      },
      fontFamily: {
        serif: ['"Lora"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(27,36,32,0.06), 0 4px 14px rgba(27,36,32,0.05)',
        lifted: '0 2px 4px rgba(27,36,32,0.08), 0 12px 28px rgba(27,36,32,0.10)',
      },
      borderRadius: {
        xl2: '1.1rem',
      },
    },
  },
  plugins: [],
}
