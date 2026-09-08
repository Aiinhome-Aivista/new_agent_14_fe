/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF5A14',
        button: '#FF7A45',
        hover: '#F56B2F',
        sidebar: '#141A28',
        light: '#F8FAFC',
        input: '#FFF7F2',
        borderLight: '#E2E8F0',
        borderOrange: '#FF8A55',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        placeholder: '#94A3B8',
        white: '#FFFFFF',
        brand: {
          orange: '#FF5A14',
          orangeHover: '#F56B2F',
          gold: '#EB8C00',
          red: '#E0301E',
          charcoal: '#141A28',
          dark: '#0A0E17',
          surface: '#121826',
          card: '#161E30',
          border: 'rgba(255, 255, 255, 0.08)',
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s infinite',
        'spin-slow': 'spin 8s linear infinite',
        'spin-reverse': 'spin-reverse 12s linear infinite',
        'radar-sweep': 'radar-sweep 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 0.4, transform: 'scale(0.98)' },
          '50%': { opacity: 0.9, transform: 'scale(1.02)' },
        },
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'radar-sweep': {
          '0%': { transform: 'translateY(-100%)', opacity: 0 },
          '50%': { opacity: 0.8 },
          '100%': { transform: 'translateY(100%)', opacity: 0 },
        }
      }
    },
  },
  plugins: [],
}
